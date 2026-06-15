<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'feedback_id',
        'is_read',
    ];
 
    protected $casts = [
        'is_read' => 'boolean',
    ];
 
    public function user()
    {
        return $this->belongsTo(User::class);
    }
 
    public function feedback()
    {
        return $this->belongsTo(Feedback::class);
    }
}
