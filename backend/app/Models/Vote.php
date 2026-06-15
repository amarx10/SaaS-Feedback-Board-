<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Vote extends Model
{
    protected $fillable = ['user_id', 'feedback_id', 'type'];
 
    public function user()
    {
        return $this->belongsTo(User::class);
    }
 
    public function feedback()
    {
        return $this->belongsTo(Feedback::class);
    }
}
