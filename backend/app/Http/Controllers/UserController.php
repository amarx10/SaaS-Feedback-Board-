<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use App\Http\Resources\UserResource;

class UserController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'          => 'sometimes|string|max:100',
            'bio'           => 'nullable|string|max:500',
            'date_of_birth' => [
                'nullable',
                'date',
                'before_or_equal:' . now()->subYears(16)->format('Y-m-d'),
                'after_or_equal:' . now()->subYears(100)->format('Y-m-d'),
            ],

            // password update protection
            'current_password' => 'required_with:password|string',
            'password'         => 'nullable|string|min:8|confirmed',
        ], [
            'date_of_birth.before_or_equal' => 'You must be at least 16 years old.',
            'date_of_birth.after_or_equal'  => 'Date of birth must be within the last 100 years.',
        ]);

        /**
         * Handle password update securely
         */
        if (isset($validated['password'])) {

            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The current password is incorrect.',
                    'errors'  => [
                        'current_password' => ['The current password is incorrect.']
                    ],
                ], 422);
            }

            // remove current_password before update
            unset($validated['current_password']);

        } else {
            // prevent accidental update payload pollution
            unset($validated['current_password']);
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated.',
            'data'    => new UserResource($user->fresh()),
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