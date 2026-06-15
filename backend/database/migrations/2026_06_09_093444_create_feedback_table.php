<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
 
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained()->onDelete('set null');
            $table->string('title');
            $table->text('description');
            $table->enum('status', ['open', 'under_review', 'planned', 'in_progress', 'completed', 'closed'])->default('open');
            $table->integer('votes_count')->default(0);
            $table->integer('comments_count')->default(0);
            $table->boolean('is_pinned')->default(false);
            $table->text('admin_response')->nullable();
            $table->timestamps();
 
            $table->index(['status', 'votes_count']);
            $table->index('user_id');
            $table->index('category_id');
        });
    }
 
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
 
