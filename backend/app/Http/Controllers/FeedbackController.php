<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use App\Models\Feedback;
use App\Models\Category;
use App\Models\Notification;

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
$hasViews = Schema::hasColumn('feedback', 'views_count');
match ($sort) {
    'newest'     => $query->orderBy('created_at', 'desc'),
    'oldest'     => $query->orderBy('created_at', 'asc'),
    'most_voted' => $query->orderBy('votes_count', 'desc'),
    'trending'   => $hasViews
                        ? $query->trending()
                        : $query->orderByRaw('
                            ((GREATEST(COALESCE(upvotes_count,0) - (COALESCE(downvotes_count,0) * 1.5), 0)
                              / (TIMESTAMPDIFF(SECOND, created_at, NOW())/3600 + 2) * 10
                              + COALESCE(comments_count,0) * 3)
                             / POW(TIMESTAMPDIFF(SECOND, created_at, NOW())/3600 + 2, 0.8)) DESC
                        '),
    default      => $query->orderBy('votes_count', 'desc'),
};

        // Pin first
        $query->orderBy('is_pinned', 'desc');

        $feedback = $query->paginate($request->get('per_page', 15));

        $user = Auth::guard('sanctum')->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'items'       => $feedback->map(fn ($f) => $this->formatFeedback($f, $user)),
                'total'       => $feedback->total(),
                'per_page'    => $feedback->perPage(),
                'current_page'=> $feedback->currentPage(),
                'last_page'   => $feedback->lastPage(),
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
            // ignore increment failures to avoid breaking the endpoint
        }
        $user     = Auth::guard('sanctum')->user();

        return response()->json([
            'success' => true,
            'data'    => $this->formatFeedback($feedback, $user, true),
        ]);
    }

    /**
     * Create new feedback.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:200',
            'description' => 'required|string|max:2000',
            'category_id' => 'required|exists:categories,id',
        ]);

        $feedback = Feedback::create([
            'user_id'     => $request->user()->id,
            'category_id' => $validated['category_id'],
            'title'       => $validated['title'],
            'description' => $validated['description'],
            'status'      => 'open',
        ]);

        // Update category count
        Category::find($validated['category_id'])->increment('feedback_count');

        $feedback->load(['user', 'category']);

        return response()->json([
            'success' => true,
            'message' => 'Feedback submitted successfully.',
            'data'    => $this->formatFeedback($feedback, $request->user()),
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

        $feedback->update($validated);
        $feedback->load(['user', 'category']);

        return response()->json([
            'success' => true,
            'message' => 'Feedback updated.',
            'data'    => $this->formatFeedback($feedback, $user),
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
        $feedback = Feedback::with(['user', 'category'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        $user = $request->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'items'       => $feedback->map(fn ($f) => $this->formatFeedback($f, $user)),
                'total'       => $feedback->total(),
                'current_page'=> $feedback->currentPage(),
                'last_page'   => $feedback->lastPage(),
            ],
        ]);
    }

    private function formatFeedback(Feedback $f, $user = null, bool $detail = false): array
    {
        $vote = $user ? $f->votes()->where('user_id', $user->id)->first() : null;

        $data = [
            'id'             => $f->id,
            'title'          => $f->title,
            'description'    => $f->description,
            'status'         => $f->status,
            'votes_count'    => $f->votes_count,
            'upvotes_count'  => $f->upvotes_count,
            'downvotes_count'=> $f->downvotes_count,
            'comments_count' => $f->comments_count,
            'is_pinned'      => $f->is_pinned,
            'admin_response' => $f->admin_response,
            'created_at'     => $f->created_at->toISOString(),
            'updated_at'     => $f->updated_at->toISOString(),
            'user'           => $f->user ? [
                'id'         => $f->user->id,
                'name'       => $f->user->name,
                'username'   => $f->user->username,
                'avatar_url' => $f->user->avatar_url,
                'initials'   => $f->user->initials,
            ] : null,
            'category'       => $f->category ? [
                'id'    => $f->category->id,
                'name'  => $f->category->name,
                'slug'  => $f->category->slug,
                'color' => $f->category->color,
            ] : null,
            'has_voted'      => (bool) $vote,
            'user_vote_type' => $vote?->type,
            'is_following'   => $user ? $f->follows()->where('user_id', $user->id)->exists() : false,
            'is_owner'       => $user ? $f->user_id === $user->id : false,
            'views_count'    => $f->views_count ?? 0,
            'trending_score' => isset($f->trending_score) ? (float) $f->trending_score : null,
        ];

        return $data;
    }
}