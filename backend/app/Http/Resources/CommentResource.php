<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'body'              => $this->body,
            'is_admin_response' => $this->is_admin_response,
            'created_at'        => $this->created_at->toISOString(),
            'updated_at'        => $this->updated_at->toISOString(),

            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id'         => $this->user->id,
                'name'       => $this->user->name,
                'username'   => $this->user->username,
                'avatar_url' => $this->user->avatar_url,
                'initials'   => $this->user->initials,
                'is_admin'   => $this->user->is_admin,
            ] : null),

            'replies' => $this->whenLoaded('replies',
                fn () => CommentResource::collection($this->replies)
            ),
        ];
    }
}