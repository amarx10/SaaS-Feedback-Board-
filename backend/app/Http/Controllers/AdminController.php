<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Feedback;
use App\Models\User;
use App\Models\Category;
use App\Models\Notification;
use App\Models\Vote;
use App\Models\Comment;

class AdminController extends Controller
{
    /**
     * Dashboard statistics.
     */
    public function stats(): JsonResponse
    {
        $statusCounts = Feedback::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');
        $categoryCounts = Category::withCount('feedback')->orderBy('feedback_count', 'desc')->get();
        $recentFeedback = Feedback::with(['user', 'category'])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($f) => [
                'id'         => $f->id,
                'title'      => $f->title,
                'status'     => $f->status,
                'updated_at' => $f->updated_at->toISOString(),
            ]);
        return response()->json([
            'success' => true,
            'data'    => [
                'total_feedback'  => Feedback::count(),
                'total_users'     => User::where('is_admin', false)->count(),
                'total_votes'     => Vote::count(),
                'total_comments'  => Comment::count(),
                'status_counts'   => $statusCounts,
                'category_counts' => $categoryCounts,
                'recent_feedback' => $recentFeedback,
            ],
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
        $feedback = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data'    => [
                'items' => $feedback->map(fn ($f) => [
                    'id'             => $f->id,
                    'title'          => $f->title,
                    'status'         => $f->status,
                    'votes_count'    => $f->votes_count,
                    'comments_count' => $f->comments_count,
                    'is_pinned'      => $f->is_pinned,
                    'created_at'     => $f->created_at->toISOString(),
                    'user'           => ['name' => $f->user?->name, 'username' => $f->user?->username],
                    'category'       => ['name' => $f->category?->name, 'color' => $f->category?->color],
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
        // Notify followers when status changes
        if ($oldStatus !== $validated['status']) {
            $followers = $feedback->follows()->pluck('user_id');
            foreach ($followers as $userId) {
                Notification::create([
                    'user_id'     => $userId,
                    'type'        => 'status_change',
                    'title'       => 'Feedback status updated',
                    'message'     => "Status of \"{$feedback->title}\" changed to " . str_replace('_', ' ', $validated['status']),
                    'feedback_id' => $feedback->id,
                ]);
            }
            // Also notify the feedback owner
            if (!$followers->contains($feedback->user_id)) {
                Notification::create([
                    'user_id'     => $feedback->user_id,
                    'type'        => 'status_change',
                    'title'       => 'Your feedback status was updated',
                    'message'     => "Your feedback \"{$feedback->title}\" is now " . str_replace('_', ' ', $validated['status']),
                    'feedback_id' => $feedback->id,
                ]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Status updated.', 'data' => $feedback]);
    }

    /**
     * Toggle pin feedback.
     */
    public function togglePin(Request $request, int $id): JsonResponse
    {
        $feedback = Feedback::findOrFail($id);
        $feedback->update(['is_pinned' => !$feedback->is_pinned]);

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

        return response()->json(['success' => true, 'message' => 'Feedback deleted.']);
    }
    public function allUsers(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('username', 'like', "%{$request->search}%");
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => [
                'items' => $users->map(fn ($u) => [
                    'id'         => $u->id,
                    'name'       => $u->name,
                    'username'   => $u->username,
                    'email'      => $u->email,
                    'is_admin'   => $u->is_admin,
                    'is_active'  => $u->is_active,
                    'avatar_url' => $u->avatar_url,
                    'initials'   => $u->initials,
                    'created_at' => $u->created_at->toISOString(),
                ]),
                'total'       => $users->total(),
                'current_page'=> $users->currentPage(),
                'last_page'   => $users->lastPage(),
            ],
        ]);
    }

    /**
     * Toggle user active status.
     */
    public function toggleUser(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success'   => true,
            'is_active' => $user->is_active,
        ]);
    }

    /**
     * Toggle admin status.
     */
    public function toggleAdmin(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
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

        $users = User::where('is_active', true)->get();
        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'type'    => 'admin_announcement',
                'title'   => $validated['title'],
                'message' => $validated['message'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Notification sent to {$users->count()} users.",
        ]);
    }
}