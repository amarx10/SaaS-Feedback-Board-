<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeedbackResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

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

            'has_voted'    => $user
                ? $this->votes()->where('user_id', $user->id)->exists()
                : false,

            'user_vote_type' => $user
                ? $this->votes()->where('user_id', $user->id)->value('type')
                : null,

            'is_following' => $user
                ? $this->follows()->where('user_id', $user->id)->exists()
                : false,

            'is_owner'     => $user
                ? $this->user_id === $user->id
                : false,
        ];
    }
}