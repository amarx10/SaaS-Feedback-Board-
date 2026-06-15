<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql' || $driver === 'mysqli') {
            DB::statement("ALTER TABLE feedback MODIFY status ENUM('open','under_review','planned','in_progress','completed','closed') NOT NULL DEFAULT 'open'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql' || $driver === 'mysqli') {
            DB::statement("ALTER TABLE feedback MODIFY status ENUM('open','planned','in_progress','completed','closed') NOT NULL DEFAULT 'open'");
        }
    }
};
