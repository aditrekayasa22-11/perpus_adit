<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login (admin / petugas / siswa) → mengembalikan Personal Access Token (Sanctum).
     * POST /api/login
     *
     * Field `role` opsional: bila diisi, role akun harus sama dengan role
     * halaman login yang dipakai (mis. halaman login petugas).
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'role'     => ['sometimes', 'nullable', Rule::in(['admin', 'petugas', 'siswa'])],
        ]);

        $user = User::where('username', $data['username'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah.'],
            ]);
        }

        if (! empty($data['role']) && $user->role !== $data['role']) {
            throw ValidationException::withMessages([
                'role' => [sprintf(
                    'Akun ini terdaftar sebagai %s, bukan %s. Silakan gunakan halaman login yang sesuai.',
                    $user->role,
                    $data['role'],
                )],
            ]);
        }

        // Buat token baru (revoke token lama agar bersih)
        $user->tokens()->delete();
        $token = $user->createToken($user->role.'-token')->plainTextToken;

        return response()->json([
            'status'  => 'success',
            'message' => 'Login berhasil.',
            'token'   => $token,
            'user'    => self::payload($user),
        ]);
    }

    /**
     * Pendaftaran akun baru (siswa atau petugas).
     * POST /api/register
     *
     * Akun admin tidak bisa didaftarkan sendiri — dibuat lewat seeder.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'username' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:users,username'],
            'email'    => ['required', 'string', 'email', 'max:100', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'role'     => ['required', Rule::in(['siswa', 'petugas'])],
        ], [
            'username.unique'     => 'Username sudah digunakan.',
            'username.alpha_dash' => 'Username hanya boleh berisi huruf, angka, dan tanda hubung.',
            'email.unique'        => 'Email sudah digunakan.',
            'role.in'             => 'Peran hanya boleh siswa atau petugas.',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'username' => $data['username'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
        ]);

        $token = $user->createToken($user->role.'-token')->plainTextToken;

        return response()->json([
            'status'  => 'success',
            'message' => 'Pendaftaran akun berhasil.',
            'token'   => $token,
            'user'    => self::payload($user),
        ], 201);
    }

    /**
     * Ambil data user yang sedang login (untuk cek status token).
     * GET /api/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'user'   => self::payload($request->user()),
        ]);
    }

    /**
     * Logout → mencabut token yang dipakai.
     * POST /api/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Logout berhasil.',
        ]);
    }

    /** Bentuk JSON user yang aman dikirim ke frontend (tanpa password). */
    private static function payload(User $user): array
    {
        return [
            'id'       => $user->id,
            'name'     => $user->name,
            'username' => $user->username,
            'role'     => $user->role,
        ];
    }
}
