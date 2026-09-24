-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 24, 2026 at 09:05 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_perpus_api`
--

-- --------------------------------------------------------

--
-- Table structure for table `buku`
--

CREATE TABLE `buku` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kode_buku` varchar(10) NOT NULL,
  `judul` varchar(150) NOT NULL,
  `penulis` varchar(100) NOT NULL,
  `kategori` varchar(50) NOT NULL,
  `tahun_terbit` smallint(5) UNSIGNED NOT NULL,
  `penerbit` varchar(100) NOT NULL,
  `cover` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `buku`
--

INSERT INTO `buku` (`id`, `kode_buku`, `judul`, `penulis`, `kategori`, `tahun_terbit`, `penerbit`, `cover`, `created_at`, `updated_at`) VALUES
(1, 'BK001', 'Laskar Pelangi', 'Andrea Hirata', 'Novel', 2005, 'Bentang Pustaka', 'BK001_1790233344_eu8fXO.jpg', '2026-09-23 23:41:23', '2026-09-24 00:02:24'),
(2, 'BK002', 'Bumi', 'Tere Liye', 'Novel', 2014, 'Gramedia', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(3, 'BK003', 'Pemrograman PHP', 'Abdul Kadir', 'Teknologi', 2020, 'Andi', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(4, 'BK004', 'Belajar HTML dan CSS', 'Jubilee Enterprise', 'Teknologi', 2021, 'Elex Media Komputindo', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(5, 'BK005', 'Dasar-Dasar JavaScript', 'Wahana Komputer', 'Teknologi', 2022, 'Andi', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(6, 'BK006', 'Negeri 5 Menara', 'Ahmad Fuadi', 'Novel', 2009, 'Grasindo', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(7, 'BK007', 'Sapiens: Ringkasan Buku', 'Yuval Noah Harari', 'Sejarah', 2017, 'Kanisius', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(8, 'BK008', 'Filosofi Teras', 'Henry Manampiring', 'Filsafat', 2018, 'Kompas', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(9, 'BK009', 'Atomic Habits', 'James Clear', 'Pengembangan Diri', 2018, 'Gramedia Pustaka Utama', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(10, 'BK010', 'Matematika Dasar', 'Suryadi Ismail', 'Pendidikan', 2016, 'Erlangga', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(11, 'BK011', 'Pemrograman Python', 'Yohanes Gago', 'Teknologi', 2023, 'Informatika', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(12, 'BK012', 'Sejarah Indonesia', 'Sartono Kartodirdjo', 'Sejarah', 2012, 'Yudhistira', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(13, 'BK0098', 'Spiderman', 'Devinza', 'Novel', 2021, 'MR', 'BK0098_1790233390_S68KUP.jpg', '2026-09-24 00:03:10', '2026-09-24 00:03:10');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_09_24_000001_create_buku_table', 1),
(5, '2026_09_24_000002_add_username_to_users_table', 1),
(6, '2026_09_24_000003_add_cover_to_buku_table', 1),
(7, '2026_09_24_032831_create_personal_access_tokens_table', 1),
(8, '2026_09_24_100001_add_role_to_users_table', 1),
(9, '2026_09_24_100002_create_peminjaman_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `peminjaman`
--

CREATE TABLE `peminjaman` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `buku_id` bigint(20) UNSIGNED NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'menunggu',
  `catatan` varchar(255) DEFAULT NULL,
  `tanggal_pinjam` date DEFAULT NULL,
  `tanggal_kembali` date DEFAULT NULL,
  `tanggal_pengembalian` date DEFAULT NULL,
  `diproses_oleh` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `peminjaman`
--

INSERT INTO `peminjaman` (`id`, `user_id`, `buku_id`, `status`, `catatan`, `tanggal_pinjam`, `tanggal_kembali`, `tanggal_pengembalian`, `diproses_oleh`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 'menunggu', 'Untuk tugas sastra', NULL, NULL, NULL, NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(2, 3, 3, 'dipinjam', NULL, '2026-09-22', '2026-09-29', NULL, 2, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(3, 3, 8, 'dikembalikan', NULL, '2026-09-10', '2026-09-17', '2026-09-16', 2, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(4, 4, 6, 'menunggu', 'Bacaan pribadi', NULL, NULL, NULL, NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(5, 4, 11, 'dipinjam', NULL, '2026-09-23', '2026-09-30', NULL, 2, '2026-09-23 23:41:23', '2026-09-23 23:41:23');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(3, 'App\\Models\\User', 5, 'siswa-token', '2beaa83c99be8614648125506b35e2b194da7a08e9c7b9af940d1e9d05b64654', '[\"*\"]', '2026-09-23 23:55:30', NULL, '2026-09-23 23:55:28', '2026-09-23 23:55:30'),
(6, 'App\\Models\\User', 1, 'admin-token', '810fb5b826fd6abf5b924a5727a0160c4e74bb9ccb4cb2eee191c2593493f079', '[\"*\"]', '2026-09-24 00:03:10', NULL, '2026-09-24 00:01:58', '2026-09-24 00:03:10');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'admin',
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `role`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Administrator', 'admin', 'admin', 'admin@perpus.test', NULL, '$2y$12$NVvumWKK/v/X5tgjAkM/H.s/pgp2n2o21cLleYSO4gFSDkBtNYBrK', NULL, '2026-09-23 23:41:22', '2026-09-23 23:41:22'),
(2, 'Petugas Perpustakaan', 'petugas', 'petugas', 'petugas@perpus.test', NULL, '$2y$12$airEwVQmoJqzVmmATCpJGuFcD11yyD.GFi2x0BNt05wuBIhx37s5y', NULL, '2026-09-23 23:41:22', '2026-09-23 23:41:22'),
(3, 'Siswa Contoh', 'siswa', 'siswa', 'siswa@perpus.test', NULL, '$2y$12$jU2elu0yrZDRllxKZX5pyecAxU06xBOhjKMN7U2GIcwn1VSA5mgQq', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23'),
(4, 'Budi Santoso', 'siswa2', 'siswa', 'siswa2@perpus.test', NULL, '$2y$12$Jy1rg0A2VYrrAGczZFVJzuHBpLSab3O2v7xSf3x0In.xGAhMOB8rW', NULL, '2026-09-23 23:41:23', '2026-09-23 23:41:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `buku`
--
ALTER TABLE `buku`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `buku_kode_buku_unique` (`kode_buku`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `peminjaman`
--
ALTER TABLE `peminjaman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `peminjaman_user_id_foreign` (`user_id`),
  ADD KEY `peminjaman_buku_id_foreign` (`buku_id`),
  ADD KEY `peminjaman_diproses_oleh_foreign` (`diproses_oleh`),
  ADD KEY `peminjaman_status_index` (`status`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_username_unique` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `buku`
--
ALTER TABLE `buku`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `peminjaman`
--
ALTER TABLE `peminjaman`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `peminjaman`
--
ALTER TABLE `peminjaman`
  ADD CONSTRAINT `peminjaman_buku_id_foreign` FOREIGN KEY (`buku_id`) REFERENCES `buku` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `peminjaman_diproses_oleh_foreign` FOREIGN KEY (`diproses_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `peminjaman_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
