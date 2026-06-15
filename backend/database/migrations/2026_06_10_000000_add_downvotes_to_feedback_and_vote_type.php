<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->integer('upvotes_count')->default(0)->after('votes_count');
            $table->integer('downvotes_count')->default(0)->after('upvotes_count');
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->enum('type', ['up', 'down'])->default('up')->after('feedback_id');
        });

        DB::table('feedback')->update([
            'upvotes_count' => DB::raw('votes_count'),
            'downvotes_count' => 0,
        ]);
    }

    public function down(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->dropColumn('upvotes_count');
            $table->dropColumn('downvotes_count');
        });

        Schema::table('votes', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
