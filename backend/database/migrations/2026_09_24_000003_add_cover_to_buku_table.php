<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buku', function (Blueprint $table) {
            // Nama file sampul di storage/app/private/cover (opsional)
            $table->string('cover', 255)->nullable()->after('penerbit');
        });
    }

    public function down(): void
    {
        Schema::table('buku', function (Blueprint $table) {
            $table->dropColumn('cover');
        });
    }
};
