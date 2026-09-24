<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BukuController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\PeminjamanController;
use App\Http\Controllers\StatistikController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Semua route berprefix /api
*/

// ---------- AUTH ----------
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ---------- DATA BUKU (public untuk GET) ----------
Route::get('/buku', [BukuController::class, 'index']);
Route::get('/buku/{id}/cover', [BukuController::class, 'cover']);
Route::get('/buku/{id}', [BukuController::class, 'show']);

// ---------- DILINDUNGI TOKEN (wajib login) ----------
Route::middleware('auth:sanctum')->group(function () {
    // User & logout (semua role)
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ----- Khusus admin: kelola buku, statistik, export -----
    Route::middleware('role:admin')->group(function () {
        Route::post('/buku', [BukuController::class, 'store']);
        Route::put('/buku/{id}', [BukuController::class, 'update']);
        Route::patch('/buku/{id}', [BukuController::class, 'update']);
        Route::delete('/buku/{id}', [BukuController::class, 'destroy']);

        Route::get('/statistik', [StatistikController::class, 'index']);

        Route::get('/export/excel', [ExportController::class, 'excel']);
        Route::get('/export/pdf', [ExportController::class, 'pdf']);
    });

    // ----- Khusus siswa: ajukan pinjam & riwayat sendiri -----
    Route::middleware('role:siswa')->group(function () {
        Route::get('/peminjaman/saya', [PeminjamanController::class, 'saya']);
        Route::post('/peminjaman', [PeminjamanController::class, 'store']);
    });

    // ----- Petugas & admin: semua peminjaman + proses/pengembalian -----
    Route::middleware('role:petugas,admin')->group(function () {
        Route::get('/peminjaman', [PeminjamanController::class, 'index']);
        Route::patch('/peminjaman/{id}/setujui', [PeminjamanController::class, 'setujui']);
        Route::patch('/peminjaman/{id}/kembali', [PeminjamanController::class, 'kembali']);
    });
});
