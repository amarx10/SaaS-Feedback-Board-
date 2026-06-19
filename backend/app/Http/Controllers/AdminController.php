<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use App\Models\Feedback;
use App\Models\User;
use App\Models\Category;
use App\Models\Notification;
use App\Models\Vote;
use App\Models\Comment;
use App\Http\Resources\UserResource;
use App\Http\Resources\FeedbackResource;

class AdminController extends Controller
{
    /**
     * Dashboard statistics.
     */
    public function stats(): JsonResponse
    {
        $data = Cache::remember('admin_stats', 60, function () {
            $statusCounts = Feedback::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $categoryCounts = Category::withCount('feedback')
            ->orderBy('feedback_count', 'desc')
            ->get();

        $recentFeedback = Feedback::with(['user', 'category'])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($f) => [
                'id'         => $f->id,
                'title'      => $f->title,
                'status'     => $f->status,
                'updated_at' => $f->updated_at->toISOString(),
                'user'       => $f->user ? ['name' => $f->user->name] : null,
            ]);

        return [
            'total_feedback'  => Feedback::count(),
            'total_users'     => User::where('is_admin', false)->count(),
            'total_votes'     => Vote::count(),
            'total_comments'  => Comment::count(),
            'status_counts'   => $statusCounts,
            'category_counts' => $categoryCounts,
            'recent_feedback' => $recentFeedback,
        ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
    
    public function allFeedback(Request $request): JsonResponse
    {
        $query = Feedback::with(['user', 'category']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $query->where('title', 'like', "%{$request->search}%");
        }
        if ($request->filled('pinned')) {
            $query->where('is_pinned', true);
        }
        $feedback = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data'    => [
                'items' => $feedback->map(fn ($f) => [
                    'id'              => $f->id,
                    'title'           => $f->title,
                    'status'          => $f->status,
                    'admin_response'  => $f->admin_response,
                    'votes_count'     => $f->votes_count,
                    'comments_count'  => $f->comments_count,
                    'is_pinned'       => $f->is_pinned,
                    'created_at'      => $f->created_at->toISOString(),
                    'user'            => ['name' => $f->user?->name, 'username' => $f->user?->username],
                    'category'        => ['name' => $f->category?->name, 'color' => $f->category?->color],
                ]),
                'total'       => $feedback->total(),
                'current_page'=> $feedback->currentPage(),
                'last_page'   => $feedback->lastPage(),
            ],
        ]);
    }
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status'         => 'required|in:open,under_review,planned,in_progress,completed,closed',
            'admin_response' => 'nullable|string|max:2000',
        ]);
        $feedback = Feedback::findOrFail($id);
        $oldStatus = $feedback->status;
        $feedback->update($validated);

            if ($oldStatus !== $validated['status']) {
                Cache::forget('admin_stats');
                $followers = $feedback->follows()->pluck('user_id');
                $now = now();
                $records = [];

            foreach ($followers as $userId) {
                $records[] = [
                    'user_id'     => $userId,
                    'type'        => 'status_change',
                    'title'       => 'Feedback status updated',
                    'message'     => "Status of \"{$feedback->title}\" changed to " . str_replace('_', ' ', $validated['status']),
                    'feedback_id' => $feedback->id,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ];
            }

            // Also notify the feedback owner if not already a follower
            if (!$followers->contains($feedback->user_id)) {
                $records[] = [
                    'user_id'     => $feedback->user_id,
                    'type'        => 'status_change',
                    'title'       => 'Your feedback status was updated',
                    'message'     => "Your feedback \"{$feedback->title}\" is now " . str_replace('_', ' ', $validated['status']),
                    'feedback_id' => $feedback->id,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ];
            }

            if (!empty($records)) {
                Notification::insert($records);
            }
        }

        $feedback->load(['user', 'category']);

        return response()->json([
            'success' => true,
            'message' => 'Status updated.',
            'data'    => new FeedbackResource($feedback),
        ]);
    }

    /**
     * Toggle pin feedback.
     */
    public function togglePin(Request $request, int $id): JsonResponse
    {
        $feedback = Feedback::findOrFail($id);
        // Direct assignment bypasses $fillable since is_pinned is admin-only
        $feedback->is_pinned = !$feedback->is_pinned;
        $feedback->save();

        return response()->json([
            'success'   => true,
            'is_pinned' => $feedback->is_pinned,
        ]);
    }
    public function deleteFeedback(int $id): JsonResponse
    {
    $feedback = Feedback::findOrFail($id);
    Category::find($feedback->category_id)?->decrement('feedback_count');
    $feedback->delete();
    Cache::forget('admin_stats');
    return response()->json([
        'success' => true,
        'message' => 'Feedback deleted.',
    ]);
}
    public function allUsers(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('username', 'like', "%{$request->search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => [
                'items'        => UserResource::collection($users->items()),
                'total'        => $users->total(),
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
            ],
        ]);
    }

    /**
     * Toggle user active status.
     */
    public function toggleUser(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot suspend or activate the super admin account.',
            ], 403);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success'   => true,
            'is_active' => $user->is_active,
        ]);
    }

    /**
     * Toggle admin status.
     */
    public function toggleAdmin(Request $request, int $id): JsonResponse
    {
        $actor = $request->user();
        $user = User::findOrFail($id);

        if (! $actor->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Only the super admin can change admin privileges.',
            ], 403);
        }

        if ($user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot change super admin privileges.',
            ], 403);
        }

        $user->update(['is_admin' => !$user->is_admin]);

        return response()->json([
            'success'  => true,
            'is_admin' => $user->is_admin,
        ]);
    }

    /**
     * Send notification to all users.
     */
    public function sendNotification(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'   => 'required|string|max:200',
            'message' => 'required|string|max:1000',
        ]);

        $totalNotified = 0;
        $now = now();

        // Chunk inserts to avoid loading all users into memory at once
        User::where('is_active', true)->chunk(500, function ($users) use ($validated, $now, &$totalNotified) {
            $records = [];
            foreach ($users as $user) {
                $records[] = [
                    'user_id'    => $user->id,
                    'type'       => 'admin_announcement',
                    'title'      => $validated['title'],
                    'message'    => $validated['message'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            Notification::insert($records);
            $totalNotified += count($records);
        });

        return response()->json([
            'success' => true,
            'message' => "Notification sent to {$totalNotified} users.",
        ]);
    }
}