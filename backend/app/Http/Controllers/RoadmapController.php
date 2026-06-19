<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use App\Models\Feedback;

class RoadmapController extends Controller
{
    public function index(): JsonResponse
    {
        $statuses = ['under_review', 'planned', 'in_progress', 'completed'];

        // Single query instead of 4 separate per-status queries
        $allItems = Feedback::with(['user', 'category'])
            ->whereIn('status', $statuses)
            ->orderBy('votes_count', 'desc')
            ->get();

        // Group in PHP — zero additional DB queries
        $roadmap = array_fill_keys($statuses, []);
        foreach ($allItems as $f) {
            $roadmap[$f->status][] = [
                'id'             => $f->id,
                'title'          => $f->title,
                'description'    => $f->description,
                'status'         => $f->status,
                'votes_count'    => $f->votes_count,
                'upvotes_count'  => $f->upvotes_count,
                'downvotes_count'=> $f->downvotes_count,
                'comments_count' => $f->comments_count,
                'created_at'     => $f->created_at->toISOString(),
                'user'           => ['name' => $f->user?->name, 'initials' => $f->user?->initials, 'avatar_url' => $f->user?->avatar_url],
                'category'       => ['name' => $f->category?->name, 'color' => $f->category?->color],
            ];
        }

        // Status counts
        $counts = Feedback::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'success' => true,
            'data'    => [
                'columns' => $roadmap,
                'counts'  => $counts,
            ],
        ]);
    }
}