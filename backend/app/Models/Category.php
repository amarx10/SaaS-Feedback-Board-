<?php

namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
 
class Category extends Model
{
    protected $fillable = ['name', 'slug', 'color', 'icon', 'feedback_count'];
 
    public function feedback()
    {
        return $this->hasMany(Feedback::class);
    }
}
 