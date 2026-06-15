<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Comment;
use App\Models\Feedback;
use App\Models\Notification;

class CommentController extends Controller
{
    public function index(Request $request, int $feedbackId): JsonResponse
    {
        Feedback::findOrFail($feedbackId);

        $comments = Comment::with(['user', 'replies.user'])
            ->where('feedback_id', $feedbackId)
            ->whereNull('parent_id')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $comments->map(fn ($c) => $this->formatComment($c)),
        ]);
    }

    public function store(Request $request, int $feedbackId): JsonResponse
    {
        $feedback = Feedback::findOrFail($feedbackId);

        $validated = $request->validate([
            'body'      => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $user    = $request->user();
        $comment = Comment::create([
            'user_id'           => $user->id,
            'feedback_id'       => $feedbackId,
            'parent_id'         => $validated['parent_id'] ?? null,
            'body'              => $validated['body'],
            'is_admin_response' => $user->is_admin,
        ]);

        // Increment comment count on feedback
        $feedback->increment('comments_count');

        // Notify feedback owner
        if ($feedback->user_id !== $user->id) {
            Notification::create([
                'user_id'     => $feedback->user_id,
                'type'        => 'comment',
                'title'       => 'New comment on your feedback',
                'message'     => "{$user->name} commented on \"{$feedback->title}\"",
                'feedback_id' => $feedbackId,
            ]);
        }

        $comment->load(['user', 'replies.user']);

        return response()->json([
            'success' => true,
            'message' => 'Comment posted.',
            'data'    => $this->formatComment($comment),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);

        if ($comment->user_id !== $request->user()->id && !$request->user()->is_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate(['body' => 'required|string|max:1000']);
        $comment->update(['body' => $validated['body']]);

        $comment->load(['user', 'replies.user']);

        return response()->json([
            'success' => true,
            'data'    => $this->formatComment($comment),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);

        if ($comment->user_id !== $request->user()->id && !$request->user()->is_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        Feedback::find($comment->feedback_id)?->decrement('comments_count');
        $comment->delete();

        return response()->json(['success' => true, 'message' => 'Comment deleted.']);
    }

    private function formatComment(Comment $c): array
    {
        return [
            'id'                => $c->id,
            'body'              => $c->body,
            'is_admin_response' => $c->is_admin_response,
            'created_at'        => $c->created_at->toISOString(),
            'user' => $c->user ? [
                'id'         => $c->user->id,
                'name'       => $c->user->name,
                'username'   => $c->user->username,
                'avatar_url' => $c->user->avatar_url,
                'initials'   => $c->user->initials,
                'is_admin'   => $c->user->is_admin,
            ] : null,
            'replies' => $c->replies ? $c->replies->map(fn ($r) => $this->formatComment($r))->toArray() : [],
        ];
    }
}