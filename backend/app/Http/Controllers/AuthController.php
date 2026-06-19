<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name'          => $validated['name'],
            'username'      => $validated['username'],
            'email'         => $validated['email'],
            'password'      => $validated['password'], // hashed automatically by User model cast
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'bio'           => $validated['bio'] ?? null,
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'data'    => [
                'user'  => new UserResource($user),
                'token' => $token,
            ],
        ], 201);
    }
    public function login(LoginRequest $request): JsonResponse
    {
        $login = $request->validated()['login'];
        $user = User::where('email', $login)
                    ->orWhere('username', $login)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Invalid credentials. Please try again.'],
            ]);
        }
        if (!$user->is_active) {
            return response()->json([
               'success' =>false,
                'message' => 'Your account has been deactivated. Please contact support.',
            ], 403);
        }
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data'    => [
                'user'  => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new UserResource($request->user()),
        ]);
    }
}