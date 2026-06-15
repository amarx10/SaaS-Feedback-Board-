<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\VoteController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\RoadmapController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;

// ── Public Routes ─────────────────────────────────────────────────────────────

Route::post('/register',       [AuthController::class, 'register']);
Route::post('/login',          [AuthController::class, 'login']);
Route::get('/categories',      [CategoryController::class, 'index']);
Route::get('/roadmap',         [RoadmapController::class, 'index']);

// Public feedback browsing (read-only)
Route::get('/feedback',        [FeedbackController::class, 'index']);
Route::get('/feedback/{id}',   [FeedbackController::class, 'show']);
Route::get('/feedback/{id}/comments', [CommentController::class, 'index']);

// ── Authenticated Routes ───────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout',         [AuthController::class, 'logout']);
    Route::get('/me',              [AuthController::class, 'me']);
    Route::put('/me',              [UserController::class, 'updateProfile']);
    Route::post('/me/avatar',      [UserController::class, 'uploadAvatar']);

    // Feedback CRUD
    Route::post('/feedback',            [FeedbackController::class, 'store']);
    Route::put('/feedback/{id}',        [FeedbackController::class, 'update']);
    Route::delete('/feedback/{id}',     [FeedbackController::class, 'destroy']);
    Route::get('/my-feedback',          [FeedbackController::class, 'myFeedback']);

    // Votes
    Route::post('/feedback/{id}/vote',   [VoteController::class, 'toggle']);
    Route::get('/voted-feedback',        [VoteController::class, 'voted']);

    // Follows
    Route::post('/feedback/{id}/follow', [FollowController::class, 'toggle']);
    Route::get('/following',             [FollowController::class, 'following']);

    // Comments
    Route::post('/feedback/{id}/comments',      [CommentController::class, 'store']);
    Route::put('/comments/{id}',                [CommentController::class, 'update']);
    Route::delete('/comments/{id}',             [CommentController::class, 'destroy']);

    // Notifications
    Route::get('/notifications',            [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all',  [NotificationController::class, 'markAllRead']);

    // ── Admin-only Routes ──────────────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {

        // Dashboard stats
        Route::get('/stats',                [AdminController::class, 'stats']);

        // Manage Feedback
        Route::get('/feedback',             [AdminController::class, 'allFeedback']);
        Route::put('/feedback/{id}/status', [AdminController::class, 'updateStatus']);
        Route::put('/feedback/{id}/pin',    [AdminController::class, 'togglePin']);
        Route::delete('/feedback/{id}',     [AdminController::class, 'deleteFeedback']);

        // Manage Users
        Route::get('/users',                [AdminController::class, 'allUsers']);
        Route::put('/users/{id}/toggle',    [AdminController::class, 'toggleUser']);
        Route::put('/users/{id}/admin',     [AdminController::class, 'toggleAdmin']);

        // Manage Categories
        Route::post('/categories',          [CategoryController::class, 'store']);
        Route::put('/categories/{id}',      [CategoryController::class, 'update']);
        Route::delete('/categories/{id}',   [CategoryController::class, 'destroy']);

        // Send notification to all users
        Route::post('/notify',              [AdminController::class, 'sendNotification']);
    });
});