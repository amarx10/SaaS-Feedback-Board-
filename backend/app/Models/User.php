<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
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

    protected $appends = [
        'is_super_admin',
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
        return $this->avatar
            ? Storage::disk('public')->url($this->avatar)
            : null;
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

    public function isSuperAdmin(): bool
    {
        // If is_super_admin column exists in DB, use it
        if (array_key_exists('is_super_admin', $this->getAttributes())) {
            return (bool) $this->getAttributes()['is_super_admin'];
        }
        // Fall back to env-configured username (SUPER_ADMIN_USERNAME in .env)
        $envUser = strtolower((string) config('auth.super_admin_username', ''));
        return $envUser !== '' && strtolower($this->username) === $envUser;
    }

    public function getIsSuperAdminAttribute(): bool
    {
        return $this->isSuperAdmin();
    }
}