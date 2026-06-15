<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'date_of_birth',
        'bio',
        'avatar',
        'is_admin',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'is_admin'          => 'boolean',
        'is_active'         => 'boolean',
        'date_of_birth'     => 'date',
    ];

    // Relationships
    public function feedback()
    {
        return $this->hasMany(Feedback::class);
    }

    public function votes()
    {
        return $this->hasMany(Vote::class);
    }

    public function votedFeedback()
    {
        return $this->belongsToMany(Feedback::class, 'votes')->withTimestamps();
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function follows()
    {
        return $this->hasMany(Follow::class);
    }

    public function followedFeedback()
    {
        return $this->belongsToMany(Feedback::class, 'follows')->withTimestamps();
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // Helpers
    public function hasVoted(Feedback $feedback): bool
    {
        return $this->votes()->where('feedback_id', $feedback->id)->exists();
    }

    public function isFollowing(Feedback $feedback): bool
    {
        return $this->follows()->where('feedback_id', $feedback->id)->exists();
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar) {
            return '/storage/' . $this->avatar;
        }
        return null;
    }

    public function getInitialsAttribute(): string
    {
        $words = explode(' ', $this->name);
        $initials = '';
        foreach (array_slice($words, 0, 2) as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
        return $initials;
    }
}