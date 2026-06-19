<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Feedback extends Model
{
    use HasFactory;

    protected $table = 'feedback';

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'status',
        'admin_response',
    ];

    // votes_count, upvotes_count, downvotes_count, views_count, comments_count, is_pinned
    // are intentionally excluded from $fillable — they are computed/admin-controlled fields
    // and must only be updated via increment()/decrement() or explicit direct assignment.

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function votes()
    {
        return $this->hasMany(Vote::class);
    }

    public function voters()
    {
        return $this->belongsToMany(User::class, 'votes')->withTimestamps();
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id');
    }

    public function allComments()
    {
        return $this->hasMany(Comment::class);
    }

    public function follows()
    {
        return $this->hasMany(Follow::class);
    }

    public function followers()
    {
        return $this->belongsToMany(User::class, 'follows')->withTimestamps();
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        if ($status && $status !== 'all') {
            return $query->where('status', $status);
        }
        return $query;
    }

    public function scopeByCategory($query, $categoryId)
    {
        if ($categoryId) {
            return $query->where('category_id', $categoryId);
        }
        return $query;
    }

    public function scopeMostVoted($query)
    {
        return $query->orderBy('votes_count', 'desc');
    }

    public function scopeNewest($query)
    {
        return $query->orderBy('created_at', 'desc');
    }
public function scopeTrending($query)
{
    $driver = DB::getDriverName();

    if ($driver === 'sqlite') {
        // SQLite-compatible: use strftime to compute elapsed seconds
        $seconds    = "(strftime('%s', 'now') - strftime('%s', created_at))";
        $hours      = "({$seconds} / 3600.0)";
        $netScore   = '(MAX(COALESCE(upvotes_count, 0) - COALESCE(downvotes_count, 0) * 1.5, 0))';
        $velocity   = "({$netScore} / ({$hours} + 2))";
        $engagement = '(COALESCE(comments_count, 0) * 3 + COALESCE(views_count, 0) * 0.05)';
        // SQLite has no POW(); approximate decay with a constant factor
        $expr = "(({$velocity} * 10 + {$engagement}) / ({$hours} + 2))";
    } else {
        // MySQL / MariaDB optimised expression
        $netScore   = '(COALESCE(upvotes_count, 0) - (COALESCE(downvotes_count, 0) * 1.5))';
        $clamped    = "GREATEST({$netScore}, 0)";
        $hours      = '(TIMESTAMPDIFF(SECOND, created_at, NOW()) / 3600)';
        $velocity   = "({$clamped} / ({$hours} + 2))";
        $engagement = '(COALESCE(comments_count, 0) * 3 + COALESCE(views_count, 0) * 0.05)';
        $decay      = "POW({$hours} + 2, 0.8)";
        $expr       = "(({$velocity} * 10 + {$engagement}) / {$decay})";
    }

    return $query
        ->selectRaw('feedback.*')
        ->selectRaw("{$expr} AS trending_score")
        ->orderByRaw("{$expr} DESC");
}
}