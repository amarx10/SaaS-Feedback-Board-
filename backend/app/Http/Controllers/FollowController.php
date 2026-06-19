<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use App\Models\Follow;
use App\Models\Feedback;
use App\Models\Vote;

class FollowController extends Controller
{
    public function toggle(Request $request, int $id): JsonResponse
    {
        $feedback = Feedback::findOrFail($id);
        $user     = $request->user();

        $existing = Follow::where('user_id', $user->id)->where('feedback_id', $id)->first();

        if ($existing) {
            $existing->delete();
            $following = false;
        } else {
            Follow::create(['user_id' => $user->id, 'feedback_id' => $id]);
            $following = true;
        }

        return response()->json([
            'success'   => true,
            'following' => $following,
        ]);
    }

    public function following(Request $request): JsonResponse
    {
        $followed = Feedback::with(['user', 'category'])
            ->whereHas('follows', fn ($q) => $q->where('user_id', $request->user()->id))
            ->orderBy('updated_at', 'desc')
            ->paginate(15);

        $user = $request->user();

        // Bulk-load votes BEFORE the map loop to eliminate N+1 queries
        $feedbackIds = $followed->pluck('id');
        $userVotes = Vote::where('user_id', $user->id)
            ->whereIn('feedback_id', $feedbackIds)
            ->get()
            ->keyBy('feedback_id');

        return response()->json([
            'success' => true,
            'data'    => [
                'items'       => $followed->map(fn ($f) => [
                    'id'             => $f->id,
                    'title'          => $f->title,
                    'description'    => $f->description,
                    'status'         => $f->status,
                    'votes_count'    => $f->votes_count,
                    'comments_count' => $f->comments_count,
                    'created_at'     => $f->created_at->toISOString(),
                    'user'           => ['name' => $f->user?->name, 'initials' => $f->user?->initials, 'avatar_url' => $f->user?->avatar_url],
                    'category'       => ['name' => $f->category?->name, 'color' => $f->category?->color],
                    'is_following'   => true,
                    'upvotes_count'  => $f->upvotes_count,
                    'downvotes_count'=> $f->downvotes_count,
                    'user_vote_type' => $userVotes->get($f->id)?->type,
                    'has_voted'      => $userVotes->has($f->id),
                ]),
                'total'        => $followed->total(),
                'current_page' => $followed->currentPage(),
                'last_page'    => $followed->lastPage(),
            ],
        ]);
    }
}