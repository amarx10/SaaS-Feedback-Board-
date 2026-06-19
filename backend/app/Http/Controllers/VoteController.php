<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Vote;
use App\Models\Feedback;
use App\Models\Notification;
use App\Http\Resources\FeedbackResource;

class VoteController extends Controller
{
    /**
     * Toggle vote on feedback.
     */
    public function toggle(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $type = $request->input('type', 'up') === 'down' ? 'down' : 'up';

        $voted = false;
        $userVoteType = null;
        $notificationData = null;

        $feedback = DB::transaction(function () use (
            $id,
            $user,
            $type,
            &$voted,
            &$userVoteType,
            &$notificationData
        ) {

            $feedback = Feedback::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            $existing = Vote::where('user_id', $user->id)
                ->where('feedback_id', $feedback->id)
                ->lockForUpdate()
                ->first();

            if ($existing) {

                // remove same vote
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

                    // switch vote
                    if ($existing->type === 'up') {
                        $feedback->decrement('upvotes_count');
                        $feedback->increment('downvotes_count');
                    } else {
                        $feedback->decrement('downvotes_count');
                        $feedback->increment('upvotes_count');
                    }

                    $existing->update(['type' => $type]);

                    $voted = true;
                    $userVoteType = $type;
                }

            } else {

                // new vote
                Vote::create([
                    'user_id' => $user->id,
                    'feedback_id' => $feedback->id,
                    'type' => $type,
                ]);

                if ($type === 'up') {
                    $feedback->increment('upvotes_count');
                } else {
                    $feedback->increment('downvotes_count');
                }

                $voted = true;
                $userVoteType = $type;

                if ($feedback->user_id !== $user->id) {
                    $notificationData = [
                        'user_id'     => $feedback->user_id,
                        'type'        => 'vote',
                        'title'       => 'Someone voted on your feedback',
                        'message'     => "{$user->name} voted on \"{$feedback->title}\"",
                        'feedback_id' => $feedback->id,
                    ];
                }
            }

            // recompute score
            $feedback->refresh();

            $feedback->votes_count =
            $feedback->upvotes_count - $feedback->downvotes_count;

            $feedback->save();

            $feedback->refresh();

return $feedback;
        });

        // notification AFTER commit
        if ($notificationData) {
            Notification::create($notificationData);
        }

        return response()->json([
            'success'          => true,
            'voted'            => $voted,
            'vote_type'        => $userVoteType,
            'votes_count'      => $feedback->votes_count,
            'upvotes_count'    => $feedback->upvotes_count,
            'downvotes_count'  => $feedback->downvotes_count,
        ]);
    }

    /**
     * Get feedback the user has voted on.
     */
    public function voted(Request $request): JsonResponse
    {
        $user = $request->user();

        $voted = Feedback::with(['user', 'category'])
            ->whereHas('votes', fn ($q) =>
                $q->where('user_id', $user->id)
            )
            ->orderBy('votes_count', 'desc')
            ->paginate(15);

        $feedbackIds = $voted->pluck('id');

        $userVotes = Vote::where('user_id', $user->id)
            ->whereIn('feedback_id', $feedbackIds)
            ->get()
            ->keyBy('feedback_id');

        // Pass bulk data through request attributes so FeedbackResource resolves correctly
        request()->attributes->set('userVotes', $userVotes);
        request()->attributes->set('userFollows', []);

        return response()->json([
            'success' => true,
            'data' => [
                'items'        => FeedbackResource::collection($voted)->toArray(request()),
                'total'        => $voted->total(),
                'current_page' => $voted->currentPage(),
                'last_page'    => $voted->lastPage(),
            ],
        ]);
    }
}