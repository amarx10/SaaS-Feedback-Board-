<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Notification;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $notifications = Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Separate COUNT gives an accurate global unread badge (not just the current page)
        $unreadCount = Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success'      => true,
            'data'         => $notifications->items(),
            'unread_count' => $unreadCount,
            'total'        => $notifications->total(),
        ]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }
}