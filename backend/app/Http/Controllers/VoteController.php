<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Vote;
use App\Models\Feedback;
use App\Models\Notification;

class VoteController extends Controller
{
    /**
     * Toggle vote on feedback (upvote/remove upvote).
     */
    public function toggle(Request $request, int $id): JsonResponse
    {
        $feedback = Feedback::findOrFail($id);
        $user     = $request->user();
        $type     = $request->input('type', 'up') === 'down' ? 'down' : 'up';

        $existing = Vote::where('user_id', $user->id)
                        ->where('feedback_id', $id)
                        ->first();

        $voted = true;
        $userVoteType = $type;

        if ($existing) {
            if ($existing->type === $type) {
                $existing->delete();
                if ($type === 'up') {
                    $feedback->decrement('upvotes_count');
                } else {
                    $feedback->decrement('downvotes_count');
                }
                $voted = false;
                $userVoteType = null;
            } else {
                if ($existing->type === 'up') {
                    $feedback->decrement('upvotes_count');
                    $feedback->increment('downvotes_count');
                } else {
                    $feedback->decrement('downvotes_count');
                    $feedback->increment('upvotes_count');
                }
                $existing->type = $type;
                $existing->save();
            }
        } else {
            Vote::create(['user_id' => $user->id, 'feedback_id' => $id, 'type' => $type]);
            if ($type === 'up') {
                $feedback->increment('upvotes_count');
            } else {
                $feedback->increment('downvotes_count');
            }

            if ($feedback->user_id !== $user->id) {
                Notification::create([
                    'user_id'     => $feedback->user_id,
                    'type'        => 'vote',
                    'title'       => 'Someone voted on your feedback',
                    'message'     => "{$user->name} voted on \"{$feedback->title}\"",
                    'feedback_id' => $id,
                ]);
            }
        }

        $feedback->refresh();
        $feedback->update(['votes_count' => $feedback->upvotes_count - $feedback->downvotes_count]);

        return response()->json([
            'success'         => true,
            'voted'           => $voted,
            'vote_type'       => $userVoteType,
            'votes_count'     => $feedback->votes_count,
            'upvotes_count'   => $feedback->upvotes_count,
            'downvotes_count' => $feedback->downvotes_count,
        ]);
    }

    /**
     * Get feedback the user has voted on.
     */
    public function voted(Request $request): JsonResponse
    {
        $voted = Feedback::with(['user', 'category'])
            ->whereHas('votes', fn ($q) => $q->where('user_id', $request->user()->id))
            ->orderBy('votes_count', 'desc')
            ->paginate(15);

        $user = $request->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'items'       => $voted->map(fn ($f) => $this->formatFeedback($f, $user)),
                'total'       => $voted->total(),
                'current_page'=> $voted->currentPage(),
                'last_page'   => $voted->lastPage(),
            ],
        ]);
    }

    private function formatFeedback(Feedback $f, $user): array
    {
        return [
            'id'             => $f->id,
            'title'          => $f->title,
            'description'    => $f->description,
            'status'         => $f->status,
            'votes_count'    => $f->votes_count,
            'upvotes_count'  => $f->upvotes_count,
            'downvotes_count'=> $f->downvotes_count,
            'comments_count' => $f->comments_count,
            'created_at'     => $f->created_at->toISOString(),
            'user'    => ['name' => $f->user?->name, 'initials' => $f->user?->initials, 'avatar_url' => $f->user?->avatar_url],
            'category'=> ['name' => $f->category?->name, 'color' => $f->category?->color],
            'has_voted'      => true,
            'user_vote_type' => $f->votes()->where('user_id', $user->id)->value('type'),
        ];
    }
}