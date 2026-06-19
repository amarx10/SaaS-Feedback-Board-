<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'username'      => $this->username,
            // Only expose email to the user themselves or to admins
            'email'         => $this->when(
                $request->user()?->id === $this->id || $request->user()?->is_admin,
                $this->email
            ),
            'bio'           => $this->bio,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'avatar_url'    => $this->avatar_url,
            'initials'      => $this->initials,
            'is_admin'      => $this->is_admin,
            'is_super_admin'=> $this->is_super_admin,
            'is_active'     => $this->is_active,
            'created_at'    => $this->created_at->toISOString(),
        ];
    }
}