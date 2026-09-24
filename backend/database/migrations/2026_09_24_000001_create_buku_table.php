<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buku', function (Blueprint $table) {
            $table->id();
            $table->string('kode_buku', 10)->unique();
            $table->string('judul', 150);
            $table->string('penulis', 100);
            $table->string('kategori', 50);
            $table->smallInteger('tahun_terbit')->unsigned();
            $table->string('penerbit', 100);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buku');
    }
};
