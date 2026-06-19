<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
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
            'data'    => CommentResource::collection($comments),
        ]);
    }

    public function store(StoreCommentRequest $request, int $feedbackId): JsonResponse
    {
        $feedback = Feedback::findOrFail($feedbackId);

        $validated = $request->validated();

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
            'data'    => new CommentResource($comment),
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
            'data'    => new CommentResource($comment),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $comment = Comment::findOrFail($id);

        if ($comment->user_id !== $request->user()->id && !$request->user()->is_admin) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $feedback = Feedback::find($comment->feedback_id);
        $comment->delete();

        $commentsCount = 0;
        if ($feedback) {
            $commentsCount = $feedback->allComments()->count();
            $feedback->update(['comments_count' => $commentsCount]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted.',
            'data'    => ['comments_count' => $commentsCount],
        ]);
    }

}