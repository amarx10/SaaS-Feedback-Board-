<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Http\Requests\StoreFeedbackRequest;
use App\Http\Resources\FeedbackResource;
use App\Models\Feedback;
use App\Models\Category;
use App\Models\Follow;
use App\Models\Notification;
use App\Models\Vote;

class FeedbackController extends Controller
{
    /**
     * List feedback with filters, sorting, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Feedback::with(['user', 'category']);

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Sort
$sort = $request->get('sort', 'most_voted');

$query->orderBy('is_pinned', 'desc');

match ($sort) {
    'newest'     => $query->orderBy('created_at', 'desc'),
    'oldest'     => $query->orderBy('created_at', 'asc'),
    'most_voted' => $query->orderBy('votes_count', 'desc'),
    'trending'   => $query->trending(),
    default      => $query->orderBy('votes_count', 'desc'),
};

        $feedback = $query->paginate($request->get('per_page', 15));

        $user = Auth::guard('sanctum')->user();

        // Bulk-load votes and follows for the current user to eliminate N+1 queries
        $feedbackIds = $feedback->pluck('id');
        $userVotes   = [];
        $userFollows = [];

        if ($user) {
            $userVotes = Vote::where('user_id', $user->id)
                ->whereIn('feedback_id', $feedbackIds)
                ->get()
                ->keyBy('feedback_id');

            $userFollows = Follow::where('user_id', $user->id)
                ->whereIn('feedback_id', $feedbackIds)
                ->pluck('feedback_id')
                ->flip()
                ->toArray();
        }

        // Inject bulk data into request attributes so FeedbackResource can
        // do O(1) lookups without firing per-item queries.
        request()->attributes->set('userVotes', $userVotes);
        request()->attributes->set('userFollows', $userFollows);

        return response()->json([
            'success' => true,
            'data'    => [
                'items'        => FeedbackResource::collection($feedback)->toArray(request()),
                'total'        => $feedback->total(),
                'per_page'     => $feedback->perPage(),
                'current_page' => $feedback->currentPage(),
                'last_page'    => $feedback->lastPage(),
            ],
        ]);
    }

    /**
     * Get single feedback item.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $feedback = Feedback::with(['user', 'category'])->findOrFail($id);
        // Increment views_count when an item is shown
        try {
            $feedback->increment('views_count');
        } catch (\Exception $e) {
            Log::warning('Failed to increment views for feedback ID ' . $feedback->id . ': ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data'    => new FeedbackResource($feedback),
        ]);
    }

    /**
     * Create new feedback.
     */
    public function store(StoreFeedbackRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $feedback = Feedback::create([
            'user_id'     => $request->user()->id,
            'category_id' => $validated['category_id'],
            'title'       => $validated['title'],
            'description' => $validated['description'],
            'status'      => 'open',
        ]);

        // Update category count (null-safe in case of race condition with category deletion)
        Category::find($validated['category_id'])?->increment('feedback_count');
        Cache::forget('admin_stats');
        $feedback->load(['user', 'category']);

        return response()->json([
            'success' => true,
            'message' => 'Feedback submitted successfully.',
            'data'    => new FeedbackResource($feedback),
        ], 201);
    }

    /**
     * Update own feedback (user) or any (admin).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $feedback = Feedback::findOrFail($id);
        $user     = $request->user();

        if ($feedback->user_id !== $user->id && !$user->is_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:200',
            'description' => 'sometimes|string|max:2000',
            'category_id' => 'sometimes|exists:categories,id',
        ]);

        
        // Capture old category before the update so we can adjust counts
$oldCategoryId = $feedback->category_id;

DB::transaction(function () use ($feedback, $validated, $oldCategoryId) {
    $feedback->update($validated);

    if (isset($validated['category_id']) && $validated['category_id'] != $oldCategoryId) {
        Category::find($oldCategoryId)?->decrement('feedback_count');
        Category::find($validated['category_id'])?->increment('feedback_count');
    }
});

Cache::forget('admin_stats');

$feedback->load(['user', 'category']);

        return response()->json([
            'success' => true,
            'message' => 'Feedback updated.',
            'data'    => new FeedbackResource($feedback),
        ]);
    }

    /**
     * Delete feedback (own or admin).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $feedback = Feedback::findOrFail($id);
        $user     = $request->user();

        if ($feedback->user_id !== $user->id && !$user->is_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        Category::find($feedback->category_id)?->decrement('feedback_count');
        $feedback->delete();
        Cache::forget('admin_stats');       

        return response()->json([
            'success' => true,
            'message' => 'Feedback deleted.',
        ]);
    }

    /**
     * My submitted feedback.
     */
   public function myFeedback(Request $request): JsonResponse
{
    $user = $request->user();

    $feedback = Feedback::with(['user', 'category'])
        ->where('user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->paginate(15);

    $feedbackIds = $feedback->pluck('id');

    $userVotes = Vote::where('user_id', $user->id)
        ->whereIn('feedback_id', $feedbackIds)
        ->get()
        ->keyBy('feedback_id');

    $userFollows = Follow::where('user_id', $user->id)
        ->whereIn('feedback_id', $feedbackIds)
        ->pluck('feedback_id')
        ->flip()
        ->toArray();

    request()->attributes->set('userVotes', $userVotes);
    request()->attributes->set('userFollows', $userFollows);

    return response()->json([
        'success' => true,
        'data'    => [
            'items'        => FeedbackResource::collection($feedback)->toArray(request()),
            'total'        => $feedback->total(),
            'current_page' => $feedback->currentPage(),
            'last_page'    => $feedback->lastPage(),
        ],
    ]);
}

    /**
     * Public stats endpoint — returns status counts in a single DB query.
     * Replaces the 5 parallel per-status requests made by the frontend.
     */
    public function stats(): JsonResponse
    {
        $counts = Feedback::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $statuses = ['open', 'under_review', 'planned', 'in_progress', 'completed', 'closed'];

        $result = [];
        foreach ($statuses as $status) {
            $result[$status] = (int) ($counts[$status] ?? 0);
        }

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    }
}