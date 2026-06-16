<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Models\User;
class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:100',
            'username'         => 'required|string|max:50|unique:users|alpha_dash',
            'email'            => 'required|email|unique:users',
            'password'         => 'required|string|min:8|confirmed',
            'date_of_birth'    => [
                'nullable',
                'date',
                'before_or_equal:' . now()->subYears(16)->format('Y-m-d'),
                'after_or_equal:' . now()->subYears(100)->format('Y-m-d'),
            ],
            'bio'              => 'nullable|string|max:500',
        ], [
            'date_of_birth.before_or_equal' => 'You must be at least 16 years old.',
            'date_of_birth.after_or_equal'  => 'Date of birth must be within the last 100 years.',
        ]);
        $user = User::create([
            'name'          => $validated['name'],
            'username'      => $validated['username'],
            'email'         => $validated['email'],
            'password'      => Hash::make($validated['password']),
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'bio'           => $validated['bio'] ?? null,
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;
        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'data'    => [
                'user'  => $this->formatUser($user),
                'token' => $token,
            ],
        ], 201);
    }
    public function login(Request $request): JsonResponse
    {
        $request->validate([
           'login'  =>'required|string',
            'password' => 'required|string',       ]);
        $login = $request->login;
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
                'user'  => $this->formatUser($user),
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
            'data'    => $this->formatUser($request->user()),
        ]);
    }
    private function formatUser(User $user): array
    {
        return [
            'id'            => $user->id,
            'name'          => $user->name,
            'username'      => $user->username,
            'email'         => $user->email,
            'bio'           => $user->bio,
            'date_of_birth' => $user->date_of_birth?->format('Y-m-d'),
            'avatar_url'    => $user->avatar_url,
            'initials'      => $user->initials,
            'is_admin'      => $user->is_admin,
            'is_active'     => $user->is_active,
            'created_at'    => $user->created_at->toISOString(),
        ];
    }
}