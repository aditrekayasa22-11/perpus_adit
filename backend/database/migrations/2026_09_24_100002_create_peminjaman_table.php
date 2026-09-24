<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Alur peminjaman buku:
     *   siswa mengajukan pinjam → status "menunggu"
     *   petugas menyetujui       → status "dipinjam"  (tanggal pinjam + batas kembali)
     *   petugas memproses kembali → status "dikembalikan" (tanggal pengembalian)
     */
    public function up(): void
    {
        Schema::create('peminjaman', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('buku_id')->constrained('buku')->cascadeOnDelete();
            $table->string('status', 20)->default('menunggu')->index();
            $table->string('catatan', 255)->nullable();
            $table->date('tanggal_pinjam')->nullable();
            $table->date('tanggal_kembali')->nullable();
            $table->date('tanggal_pengembalian')->nullable();
            $table->foreignId('diproses_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peminjaman');
    }
};
