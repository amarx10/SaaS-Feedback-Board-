<?php

namespace Database\Seeders;
 
use Illuminate\Database\Seeder;
use App\Models\Category;
 
class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Feature Request',    'slug' => 'feature-request',    'color' => '#2563EB', 'icon' => 'lightbulb'],
            ['name' => 'Improvement',        'slug' => 'improvement',        'color' => '#7C3AED', 'icon' => 'trending-up'],
            ['name' => 'Bug Report',         'slug' => 'bug-report',         'color' => '#EF4444', 'icon' => 'bug'],
            ['name' => 'UI/UX Suggestion',   'slug' => 'ui-ux-suggestion',   'color' => '#F59E0B', 'icon' => 'palette'],
            ['name' => 'General Feedback',   'slug' => 'general-feedback',   'color' => '#64748B', 'icon' => 'message-square'],
        ];
 
        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
 