<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $user      = $request->user();
        $validated = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'bio'           => 'nullable|string|max:500',
            'date_of_birth' => 'nullable|date|before:today',
            'password'      => 'nullable|string|min:8|confirmed',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated.',
            'data'    => [
                'id'            => $user->id,
                'name'          => $user->name,
                'username'      => $user->username,
                'email'         => $user->email,
                'bio'           => $user->bio,
                'date_of_birth' => $user->date_of_birth?->format('Y-m-d'),
                'avatar_url'    => $user->avatar_url,
                'initials'      => $user->initials,
                'is_admin'      => $user->is_admin,
            ],
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $user = $request->user();

        // Delete old avatar
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'success'    => true,
            'avatar_url' => $user->fresh()->avatar_url,
        ]);
    }
}