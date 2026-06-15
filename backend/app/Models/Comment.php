<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Comment extends Model
{
    protected $fillable = [
        'user_id',
        'feedback_id',
        'parent_id',
        'body',
        'is_admin_response',
    ];
 
    protected $casts = [
        'is_admin_response' => 'boolean',
    ];
 
    public function user()
    {
        return $this->belongsTo(User::class);
    }
 
    public function feedback()
    {
        return $this->belongsTo(Feedback::class);
    }
 
    public function parent()
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }
 
    public function replies()
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }
}
