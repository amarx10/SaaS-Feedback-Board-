<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('feedback', 'views_count')) {
            Schema::table('feedback', function (Blueprint $table) {
                $table->integer('views_count')->default(0)->after('comments_count');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('feedback', 'views_count')) {
            Schema::table('feedback', function (Blueprint $table) {
                $table->dropColumn('views_count');
            });
        }
    }
};
