<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeedbackResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $vote = $this->resolveVote($user, $request);

        return [
            'id'             => $this->id,
            'title'          => $this->title,
            'description'    => $this->description,
            'status'         => $this->status,
            'votes_count'    => $this->votes_count,
            'upvotes_count'  => $this->upvotes_count,
            'downvotes_count'=> $this->downvotes_count,
            'comments_count' => $this->comments_count,
            'is_pinned'      => $this->is_pinned,
            'admin_response' => $this->admin_response,
            'created_at'     => $this->created_at->toISOString(),
            'updated_at'     => $this->updated_at->toISOString(),

            'user' => $this->whenLoaded('user', fn () => [
                'id'         => $this->user->id,
                'name'       => $this->user->name,
                'username'   => $this->user->username,
                'avatar_url' => $this->user->avatar_url,
                'initials'   => $this->user->initials,
            ]),

            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id'    => $this->category->id,
                'name'  => $this->category->name,
                'slug'  => $this->category->slug,
                'color' => $this->category->color,
            ] : null),

            // Read from bulk-loaded collections stored on request attributes (O(1));
            // falls back to a direct DB query for single-item show() usage.
            'has_voted'      => (bool) $vote,
            'user_vote_type' => $vote?->type,
            'is_following'   => $this->resolveFollowing($user, $request),
            'is_owner'       => $user ? $this->user_id === $user->id : false,
            'views_count'    => $this->views_count ?? 0,
            'trending_score' => isset($this->trending_score) ? (float) $this->trending_score : null,
        ];
    }

    // ---------------------------------------------------------------------------
    // Helpers — read from bulk-loaded data passed via ->additional([...]) on the
    // collection, or fall back to a single query for the detail (show) endpoint.
    // ---------------------------------------------------------------------------

    private function resolveVote($user, Request $request)
    {
        if (! $user) {
            return null;
        }

        // Bulk-loaded collection keyed by feedback_id — set on request attributes in index()
        $userVotes = $request->attributes->get('userVotes');
        if ($userVotes instanceof \Illuminate\Support\Collection) {
            return $userVotes->get($this->id);
        }

        // Single-item fallback (show endpoint)
        return $this->votes()->where('user_id', $user->id)->first();
    }

    private function resolveFollowing($user, Request $request): bool
    {
        if (! $user) {
            return false;
        }

        // Bulk-loaded flip-array keyed by feedback_id — set on request attributes in index()
        $userFollows = $request->attributes->get('userFollows');
        if (is_array($userFollows)) {
            return array_key_exists($this->id, $userFollows);
        }

        // Single-item fallback (show endpoint)
        return $this->follows()->where('user_id', $user->id)->exists();
    }
}