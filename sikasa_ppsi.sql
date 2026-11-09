-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 09, 2026 at 02:12 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sikasa_ppsi`
--

-- --------------------------------------------------------

--
-- Table structure for table `absensi`
--

CREATE TABLE `absensi` (
  `id` int NOT NULL,
  `id_siswa` int NOT NULL,
  `id_pelatih` int NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('Hadir','Izin','Sakit','Alfa') NOT NULL,
  `materi` text,
  `surat_ijin` varchar(255) DEFAULT NULL,
  `status_izin` enum('Menunggu','Disetujui','Ditolak') DEFAULT 'Menunggu',
  `catatan_izin` text,
  `keterangan` text,
  `tahun_ajaran` varchar(20) DEFAULT NULL,
  `semester` enum('Ganjil','Genap') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `absensi`
--

INSERT INTO `absensi` (`id`, `id_siswa`, `id_pelatih`, `tanggal`, `status`, `materi`, `surat_ijin`, `status_izin`, `catatan_izin`, `keterangan`, `tahun_ajaran`, `semester`) VALUES
(1, 2, 2, '2026-03-07', 'Izin', NULL, 'public/uploads/izin/reg_69a926dd6da8b8.82206584.jpg', 'Disetujui', NULL, 'ijin tidak mengikuti ekskul karna sakit', '2025/2026', 'Genap'),
(2, 1, 4, '2026-03-07', 'Izin', NULL, 'public/uploads/izin/reg_69a931e1191a93.87848442.jpg', 'Disetujui', NULL, 'ijin tidak mengikuti ekstrakurikuler karena ada acara keluarga', '2025/2026', 'Genap'),
(3, 2, 2, '2026-03-11', 'Izin', NULL, 'public/uploads/izin/reg_69b0f6b4f0a496.88947340.jpg', 'Disetujui', NULL, 'sakit', '2025/2026', 'Genap'),
(4, 1, 4, '2026-04-02', 'Hadir', NULL, NULL, 'Menunggu', NULL, NULL, '2025/2026', 'Genap'),
(5, 12, 1, '2024-11-20', 'Izin', NULL, 'public/uploads/izin/test.jpg', 'Disetujui', NULL, 'Sakit test', '2024/2025', 'Ganjil'),
(6, 12, 5, '2026-05-23', 'Izin', NULL, 'public/uploads/izin/reg_6a0ffea8ad7b46.26145012.png', 'Disetujui', NULL, 'ijin sakit', '2024/2025', 'Ganjil'),
(7, 12, 5, '2026-05-25', 'Izin', NULL, 'public/uploads/izin/reg_6a0fff2e2fef01.62309574.png', 'Disetujui', NULL, 'ijin sakit', '2024/2025', 'Ganjil'),
(8, 12, 5, '2026-05-22', 'Izin', NULL, NULL, 'Disetujui', NULL, NULL, '2024/2025', 'Ganjil'),
(9, 12, 3, '2026-05-26', 'Izin', NULL, 'public/uploads/izin/reg_6a125a59d48843.16446607.png', 'Disetujui', NULL, 'acara keluarga', '2024/2025', 'Ganjil'),
(10, 12, 3, '2026-05-24', 'Izin', NULL, NULL, 'Disetujui', NULL, NULL, '2024/2025', 'Ganjil'),
(11, 12, 6, '2026-05-28', 'Izin', NULL, 'public/uploads/izin/reg_6a12b2336d08a4.99654276.png', 'Disetujui', NULL, 'acara keluarga', '2024/2025', 'Ganjil'),
(12, 5, 11, '2026-05-25', 'Sakit', NULL, 'public/uploads/izin/reg_6a13c3f9a64ee5.79480148.png', 'Menunggu', NULL, 'ijin sakit demam', '2025/2026', 'Ganjil'),
(14, 5, 5, '2026-05-26', 'Izin', NULL, 'public/uploads/izin/reg_6a13c9d6702ba3.42069970.png', 'Disetujui', NULL, 'ijin sakit', '2025/2026', 'Ganjil'),
(15, 5, 5, '2026-06-05', 'Izin', NULL, 'public/uploads/izin/reg_6a1ff2d64cfbd9.22529570.png', 'Disetujui', NULL, 'ijin acara keluarga', '2025/2026', 'Ganjil'),
(16, 5, 5, '2026-10-28', 'Izin', NULL, NULL, 'Menunggu', NULL, NULL, '2025/2026', 'Ganjil'),
(17, 5, 5, '2026-11-03', 'Hadir', NULL, NULL, 'Menunggu', NULL, NULL, '2025/2026', 'Ganjil');

-- --------------------------------------------------------

--
-- Table structure for table `aspek_penilaian_ekskul`
--

CREATE TABLE `aspek_penilaian_ekskul` (
  `id` int NOT NULL,
  `ekskul_id` int NOT NULL,
  `nama_aspek` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bobot` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `aspek_penilaian_ekskul`
--

INSERT INTO `aspek_penilaian_ekskul` (`id`, `ekskul_id`, `nama_aspek`, `bobot`, `created_at`, `updated_at`) VALUES
(1, 7, 'Kehadiran', 30, '2026-06-15 03:55:32', '2026-06-15 03:55:32'),
(2, 7, 'Ketrampilan', 50, '2026-06-15 03:55:32', '2026-06-15 03:55:32'),
(3, 7, 'Penugasan', 20, '2026-06-15 03:55:32', '2026-06-15 03:55:32'),
(4, 1, 'Penguasaan Materi', 50, '2026-11-05 05:56:19', '2026-11-05 05:56:19'),
(5, 1, 'Kehadiran / Presensi', 50, '2026-11-05 05:56:19', '2026-11-05 05:56:19');

-- --------------------------------------------------------

--
-- Table structure for table `ekstrakurikuler`
--

CREATE TABLE `ekstrakurikuler` (
  `id` int NOT NULL,
  `nama_ekskul` varchar(100) NOT NULL,
  `pelatih` varchar(100) DEFAULT NULL,
  `pendamping` varchar(255) DEFAULT NULL,
  `hari` varchar(255) DEFAULT NULL,
  `jam` varchar(255) DEFAULT NULL,
  `tempat` varchar(255) DEFAULT NULL,
  `target_kelas` text,
  `is_seleksi` tinyint(1) DEFAULT '0',
  `tahun_ajaran` varchar(20) DEFAULT NULL,
  `semester` enum('Ganjil','Genap') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ekstrakurikuler`
--

INSERT INTO `ekstrakurikuler` (`id`, `nama_ekskul`, `pelatih`, `pendamping`, `hari`, `jam`, `tempat`, `target_kelas`, `is_seleksi`, `tahun_ajaran`, `semester`) VALUES
(1, 'Tari Modern', 'Bu Retha', 'Bu Yuni', 'Senin', '14.30 - 16.00', 'Aula', '[\"7\",\"8\",\"9\"]', 0, '2025/2026', 'Ganjil'),
(2, 'Band Inti', '', NULL, 'Kamis', '14.00 - 15.30, 15.30 - 17.00', 'Band', '[\"7\",\"8\",\"9\"]', 1, '2025/2026', 'Ganjil'),
(3, 'Basket Putra', 'Pak Mesak', NULL, 'Selasa', '14.00 - 15.30', 'Lapangan', '[\"7\"]', 0, '2025/2026', 'Ganjil'),
(4, 'Tari Modern', 'Pak Bayu', NULL, 'Senin', '14.00 - 15.30', 'Aula', '[\"7\",\"8\",\"9\"]', 0, '2025/2026', 'Genap'),
(5, 'Basket Putra', 'Pak Tegar', NULL, 'Rabu', '15.30 - 17.00', 'Lapangan', '[\"8\",\"9\"]', 0, '2025/2026', 'Genap'),
(6, 'Band Inti', 'Pak Edo', NULL, 'Kamis', '14.00 - 15.30, 15.30 - 17.00', 'Band', '[\"7\",\"8\",\"9\"]', 1, '2025/2026', 'Genap'),
(7, 'Club IPA', 'Bu Uli', NULL, 'Senin', '14.00 - 15.30', 'IPA 8', '[\"7\"]', 0, '2025/2026', 'Genap'),
(8, 'PMR', 'Kak Febri', NULL, 'Selasa', '14.15 - 15.45', 'Sejarah', '[\"7\",\"8\",\"9\"]', 0, '2025/2026', 'Genap'),
(9, 'Basket Putri', '', NULL, 'Rabu', '14.00 - 15.30', 'Lapangan', '[\"7\",\"8\",\"9\"]', 0, '2025/2026', 'Genap'),
(10, 'Paduan Suara', 'Pak Okky', NULL, 'Rabu', '14.00 - 15.30', 'Fisika', '[\"7\",\"9\",\"8\"]', 0, '2025/2026', 'Genap'),
(11, 'Club TIK 8', 'Pak Jaya', NULL, 'Kamis', '14.00 - 15.30', 'Komputer', '[\"8\"]', 0, '2025/2026', 'Genap'),
(12, 'Pramuka', 'Pak Trianto', NULL, 'Jumat', '14.00 - 15.30', 'Lapangan', '[\"8\"]', 0, '2025/2026', 'Genap'),
(13, 'Club Matematika 7', '', NULL, 'Jumat', '14.00 - 15.30', 'Mat 7', '[\"7\"]', 0, '2025/2026', 'Genap'),
(14, 'Club IPA', '', NULL, 'Senin', '14.00 - 15.30', 'IPA 8', '[\"7\"]', 0, '2025/2026', 'Ganjil'),
(15, 'PMR', '', NULL, 'Selasa', '14.15 - 15.45', 'Sejarah', '[\"7\",\"8\",\"9\"]', 0, '2025/2026', 'Ganjil'),
(16, 'Basket Putri', '', NULL, 'Rabu', '14.00 - 15.30', 'Lapangan', '[\"7\",\"8\",\"9\"]', 0, '2025/2026', 'Ganjil'),
(17, 'Paduan Suara', '', NULL, 'Rabu', '14.00 - 15.30', 'Fisika', '[\"7\",\"9\",\"8\"]', 0, '2025/2026', 'Ganjil'),
(18, 'Club TIK 8', '', NULL, 'Kamis', '14.00 - 15.30', 'Komputer', '[\"8\"]', 0, '2025/2026', 'Ganjil'),
(19, 'Pramuka', '', NULL, 'Jumat', '14.00 - 15.30', 'Lapangan', '[\"8\"]', 0, '2025/2026', 'Ganjil'),
(20, 'Club Matematika 7', '', NULL, 'Jumat', '14.00 - 15.30', 'Mat 7', '[\"7\"]', 0, '2025/2026', 'Ganjil');

-- --------------------------------------------------------

--
-- Table structure for table `guru_pendamping`
--

CREATE TABLE `guru_pendamping` (
  `id` int NOT NULL,
  `nama_guru` varchar(100) NOT NULL,
  `nip` varchar(50) DEFAULT NULL,
  `kode_guru` varchar(20) DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `guru_pendamping`
--

INSERT INTO `guru_pendamping` (`id`, `nama_guru`, `nip`, `kode_guru`, `no_hp`, `created_at`) VALUES
(29, 'Pak Andik', '3322114455', '', '089566774455', '2026-02-28 12:09:06'),
(30, 'Bu Yuni', '2211334455', '', '098566778899', '2026-03-01 13:20:00'),
(31, 'Bu Lina', '1122334455', '', '0099887766', '2026-05-09 06:11:09');

-- --------------------------------------------------------

--
-- Table structure for table `izin_ekskul`
--

CREATE TABLE `izin_ekskul` (
  `id` int NOT NULL,
  `siswa_id` int NOT NULL,
  `ekskul_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `pesan` text NOT NULL,
  `tahun_ajaran` varchar(20) DEFAULT NULL,
  `semester` enum('Ganjil','Genap') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jurnal_ekskul`
--

CREATE TABLE `jurnal_ekskul` (
  `id` int NOT NULL,
  `ekskul_id` int NOT NULL,
  `pelatih_id` int DEFAULT NULL,
  `tanggal` date NOT NULL,
  `materi` text NOT NULL,
  `catatan` text,
  `tahun_ajaran` varchar(20) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kelas`
--

CREATE TABLE `kelas` (
  `id` int NOT NULL,
  `nama_kelas` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `kelas`
--

INSERT INTO `kelas` (`id`, `nama_kelas`) VALUES
(1, 'VII A'),
(2, 'VII B'),
(3, 'VII C'),
(4, 'VII D'),
(5, 'VII E'),
(6, 'VII F'),
(7, 'VII G'),
(8, 'VIII A'),
(9, 'VIII B'),
(10, 'VIII C'),
(11, 'VIII D'),
(12, 'VIII E'),
(13, 'VIII F'),
(14, 'VIII G'),
(15, 'IX A'),
(16, 'IX B'),
(17, 'IX C'),
(18, 'IX D'),
(19, 'IX E'),
(20, 'IX F'),
(21, 'IX G');

-- --------------------------------------------------------

--
-- Table structure for table `nilai_aspek_siswa`
--

CREATE TABLE `nilai_aspek_siswa` (
  `id` int NOT NULL,
  `siswa_id` int NOT NULL,
  `ekskul_id` int NOT NULL,
  `aspek_id` int NOT NULL,
  `pelatih_id` int NOT NULL,
  `nilai` float NOT NULL,
  `semester` enum('Ganjil','Genap') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tahun` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nilai_aspek_siswa`
--

INSERT INTO `nilai_aspek_siswa` (`id`, `siswa_id`, `ekskul_id`, `aspek_id`, `pelatih_id`, `nilai`, `semester`, `tahun`, `created_at`, `updated_at`) VALUES
(1, 5, 7, 1, 5, 85, 'Ganjil', '2025/2026', '2026-06-15 03:56:21', '2026-06-15 03:56:21'),
(2, 5, 7, 2, 5, 96, 'Ganjil', '2025/2026', '2026-06-15 03:56:21', '2026-06-15 03:56:21'),
(3, 5, 7, 3, 5, 100, 'Ganjil', '2025/2026', '2026-06-15 03:56:21', '2026-06-15 03:56:21');

-- --------------------------------------------------------

--
-- Table structure for table `nilai_ekskul`
--

CREATE TABLE `nilai_ekskul` (
  `id` int NOT NULL,
  `siswa_id` int NOT NULL,
  `ekskul_id` int DEFAULT NULL,
  `pelatih_id` int NOT NULL,
  `nilai` int NOT NULL,
  `keterangan` varchar(255) DEFAULT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `tahun` varchar(10) NOT NULL,
  `tahun_ajaran` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `nilai_ekskul`
--

INSERT INTO `nilai_ekskul` (`id`, `siswa_id`, `ekskul_id`, `pelatih_id`, `nilai`, `keterangan`, `semester`, `tahun`, `tahun_ajaran`) VALUES
(1, 1, 5, 4, 95, 'sangat baik dlam menguasai teknik dasar', 'Genap', '2025/2026', NULL),
(2, 4, 4, 1, 96, 'Sangat baik dalam menguasai teknik dasar', 'Genap', '2025/2026', NULL),
(3, 12, 7, 5, 86, 'sangat baik dalam mempelajari materi baru', 'Ganjil', '2024/2025', NULL),
(4, 12, 3, 3, 87, 'sangat bisa menguasai teknik dasar', 'Ganjil', '2024/2025', NULL),
(5, 12, 8, 6, 85, 'sangat baik dalam menguasai teknik  dasar', 'Ganjil', '2024/2025', NULL),
(6, 5, 13, 11, 92, 'sangat baik dalam menguasai rumus awal', 'Ganjil', '2025/2026', NULL),
(7, 5, 9, 7, 87, 'sangat baik', 'Ganjil', '2025/2026', NULL),
(8, 5, 7, 5, 94, 'sangat baik', 'Ganjil', '2025/2026', NULL),
(9, 5, 1, 5, 76, 'Nilai akumulasi pertemuan', 'Ganjil', '2025/2026', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `nilai_pertemuan`
--

CREATE TABLE `nilai_pertemuan` (
  `id` int NOT NULL,
  `ekskul_id` int NOT NULL,
  `siswa_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `nilai` int NOT NULL DEFAULT '0',
  `catatan` varchar(255) DEFAULT NULL,
  `tahun_ajaran` varchar(20) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `nilai_pertemuan`
--

INSERT INTO `nilai_pertemuan` (`id`, `ekskul_id`, `siswa_id`, `tanggal`, `nilai`, `catatan`, `tahun_ajaran`, `semester`, `created_at`, `updated_at`) VALUES
(1, 1, 5, '2026-11-05', 98, 'baik', '2025/2026', 'Ganjil', '2026-11-05 05:36:58', '2026-11-05 05:37:33');

-- --------------------------------------------------------

--
-- Table structure for table `pelatih`
--

CREATE TABLE `pelatih` (
  `id` int NOT NULL,
  `nama_pelatih` varchar(100) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `alamat` text,
  `pendamping` varchar(100) DEFAULT NULL,
  `ekskul_id` int DEFAULT NULL,
  `guru_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pelatih`
--

INSERT INTO `pelatih` (`id`, `nama_pelatih`, `no_hp`, `alamat`, `pendamping`, `ekskul_id`, `guru_id`) VALUES
(1, 'Pak Bayu', '0987777777777', 'ahahahahaha', 'Bu Yuni', 4, 30),
(2, 'Pak Edo', '09832323232', 'gcfcyufyu', 'Pak Andik', 6, 29),
(3, 'Pak Mesak', '0987766554433', 'bfwfbwukfbe', NULL, 3, NULL),
(4, 'Pak Tegar', '09832323232', NULL, NULL, 5, NULL),
(5, 'Bu Retha', '0987654321', NULL, NULL, 1, NULL),
(6, 'Kak Febri', '08977665577', NULL, NULL, 8, 31),
(7, 'Bu Uli', '09833445502', NULL, NULL, 7, NULL),
(8, 'Pak Okky', '0986677889900', NULL, NULL, 10, NULL),
(9, 'Pak Jaya', '0099887766', NULL, NULL, 11, NULL),
(10, 'Pak Trianto', '0099887766', NULL, NULL, 12, NULL),
(11, 'Bu Agustin', '098566774410', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pendaftaran_ekskul`
--

CREATE TABLE `pendaftaran_ekskul` (
  `id` int NOT NULL,
  `siswa_id` int NOT NULL,
  `ekskul_id` int NOT NULL,
  `status` enum('pending','approved','rejected','pending_withdrawal','withdrawn') NOT NULL DEFAULT 'pending',
  `surat_ijin` varchar(255) DEFAULT NULL,
  `alasan_keluar` text,
  `surat_keluar` varchar(255) DEFAULT NULL,
  `tanggal_daftar` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tahun_ajaran` varchar(20) DEFAULT NULL,
  `semester` enum('Ganjil','Genap') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pendaftaran_ekskul`
--

INSERT INTO `pendaftaran_ekskul` (`id`, `siswa_id`, `ekskul_id`, `status`, `surat_ijin`, `alasan_keluar`, `surat_keluar`, `tanggal_daftar`, `tahun_ajaran`, `semester`) VALUES
(1, 1, 4, 'rejected', NULL, NULL, NULL, '2026-03-04 12:51:55', '2025/2026', 'Genap'),
(2, 1, 5, 'approved', 'public/uploads/registration/reg_69a8347d0f6b69.07945667.jpg', NULL, NULL, '2026-03-04 13:32:45', '2025/2026', 'Genap'),
(3, 2, 6, 'approved', 'public/uploads/registration/reg_69a917f49789c9.91067827.jpg', NULL, NULL, '2026-03-05 05:43:16', '2025/2026', 'Genap'),
(4, 4, 4, 'approved', 'public/uploads/registration/reg_69f1c32f3da780.95224953.pdf', NULL, NULL, '2026-04-29 08:37:03', '2025/2026', 'Genap'),
(5, 9, 10, 'pending', 'public/uploads/registration/reg_6a0c12270f3239.16234988.png', NULL, NULL, '2026-05-19 07:32:55', '2024/2025', 'Ganjil'),
(6, 12, 7, 'approved', 'public/uploads/registration/reg_6a0ffa82224632.34471967.png', NULL, NULL, '2026-05-22 06:41:06', '2024/2025', 'Ganjil'),
(7, 12, 3, 'approved', 'public/uploads/registration/reg_6a1253e2889585.40569551.png', NULL, NULL, '2026-05-24 01:26:58', '2024/2025', 'Ganjil'),
(8, 12, 8, 'approved', 'public/uploads/registration/reg_6a12b1ac055359.16110707.png', NULL, NULL, '2026-05-24 08:07:08', '2024/2025', 'Ganjil'),
(9, 5, 13, 'approved', 'public/uploads/registration/reg_6a1390f29dc3d7.67854856.png', NULL, NULL, '2026-05-24 23:59:46', '2025/2026', 'Ganjil'),
(10, 5, 9, 'approved', 'public/uploads/registration/reg_6a13b69da0d902.52291276.png', NULL, NULL, '2026-05-25 02:40:29', '2025/2026', 'Ganjil'),
(11, 4, 1, 'pending', 'public/uploads/registration/reg_6a13bfc2117540.45173812.png', NULL, NULL, '2026-05-25 03:19:30', '2025/2026', 'Ganjil'),
(12, 5, 7, 'approved', 'public/uploads/registration/reg_6a13c3aee7e280.88482872.png', NULL, NULL, '2026-05-25 03:36:14', '2025/2026', 'Ganjil'),
(13, 5, 1, 'approved', 'public/uploads/registration/reg_6a13c8c99c1921.42148296.png', NULL, NULL, '2026-05-25 03:58:01', '2025/2026', 'Ganjil'),
(14, 4, 8, 'approved', 'public/uploads/registration/reg_6aec40b36cfb53.46320157.png', NULL, NULL, '2026-11-05 08:39:15', '2025/2026', 'Ganjil');

-- --------------------------------------------------------

--
-- Table structure for table `pengaturan`
--

CREATE TABLE `pengaturan` (
  `id` int NOT NULL,
  `kunci` varchar(50) NOT NULL,
  `nilai` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pengaturan`
--

INSERT INTO `pengaturan` (`id`, `kunci`, `nilai`) VALUES
(1, 'tahun_ajaran_aktif', '2025/2026'),
(2, 'semester_aktif', 'Ganjil');

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_kelas`
--

CREATE TABLE `riwayat_kelas` (
  `id` int NOT NULL,
  `siswa_id` int NOT NULL,
  `kelas_id` int NOT NULL,
  `tahun_ajaran` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `riwayat_kelas`
--

INSERT INTO `riwayat_kelas` (`id`, `siswa_id`, `kelas_id`, `tahun_ajaran`) VALUES
(1, 1, 1, '2024/2025'),
(2, 2, 9, '2024/2025'),
(3, 3, 17, '2024/2025'),
(6, 1, 10, '2025/2026'),
(7, 2, 20, '2025/2026'),
(9, 4, 6, '2025/2026'),
(12, 5, 6, '2025/2026'),
(13, 12, 10, '2025/2026'),
(14, 9, 17, '2025/2026'),
(16, 9, 8, '2024/2025'),
(27, 12, 1, '2024/2025');

-- --------------------------------------------------------

--
-- Table structure for table `siswa`
--

CREATE TABLE `siswa` (
  `id` int NOT NULL,
  `no_induk` varchar(50) DEFAULT NULL,
  `nama_siswa` varchar(100) NOT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `kota` varchar(100) DEFAULT NULL,
  `alamat` text,
  `nama_ayah` varchar(100) DEFAULT NULL,
  `pekerjaan_ayah` varchar(100) DEFAULT NULL,
  `nama_ibu` varchar(100) DEFAULT NULL,
  `pekerjaan_ibu` varchar(100) DEFAULT NULL,
  `kelas_id` int DEFAULT NULL,
  `status` enum('aktif','alumni') NOT NULL DEFAULT 'aktif',
  `academic_status` enum('AKTIF','PERLU_PENEMPATAN','LULUS') NOT NULL DEFAULT 'AKTIF'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `siswa`
--

INSERT INTO `siswa` (`id`, `no_induk`, `nama_siswa`, `tanggal_lahir`, `no_hp`, `kota`, `alamat`, `nama_ayah`, `pekerjaan_ayah`, `nama_ibu`, `pekerjaan_ibu`, `kelas_id`, `status`, `academic_status`) VALUES
(1, '2233445566', 'Kim Juhoon', '2008-01-03', '0986677889955', 'Jakarta', 'Jl. Cinta 22', '', '', '', '', 10, 'aktif', 'AKTIF'),
(2, '1122333444555', 'Kim Dohoon', '2005-01-30', '0986655443322', 'Bandung', 'Jl. Kenangan 10', '', '', '', '', 20, 'aktif', 'AKTIF'),
(3, NULL, 'taesan', '2004-05-10', '0987788996633', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'alumni', 'AKTIF'),
(4, '00999888777', 'Carmen', '2006-02-18', '0895112233', 'Bali', 'Jl. Kota Besar 22', '', '', '', '', 6, 'aktif', 'AKTIF'),
(5, '0099887766', 'Juha', '2007-02-05', '098566770099', 'Malang', 'Jl. Bunga 8', '', '', '', '', 6, 'aktif', 'AKTIF'),
(9, '0099445566', 'Jihoon', '2006-11-05', '089566774410', '', '', '', '', '', '', 17, 'aktif', 'AKTIF'),
(12, '0099887766', 'Martin', '2008-03-04', '081244556677', '', '', '', '', '', '', 10, 'aktif', 'AKTIF');

-- --------------------------------------------------------

--
-- Table structure for table `tahun_ajaran`
--

CREATE TABLE `tahun_ajaran` (
  `id` int NOT NULL,
  `nama` varchar(50) NOT NULL,
  `tahun` varchar(20) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `status` enum('aktif','nonaktif') NOT NULL DEFAULT 'nonaktif',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tahun_ajaran`
--

INSERT INTO `tahun_ajaran` (`id`, `nama`, `tahun`, `semester`, `status`, `created_at`) VALUES
(1, '2024/2025 Ganjil', '2024/2025', 'Ganjil', 'nonaktif', '2026-11-02 06:05:35'),
(2, '2024/2025 Genap', '2024/2025', 'Genap', 'nonaktif', '2026-11-02 06:05:35'),
(3, '2025/2026 Ganjil', '2025/2026', 'Ganjil', 'aktif', '2026-11-02 06:05:35'),
(4, '2025/2026 Genap', '2025/2026', 'Genap', 'nonaktif', '2026-11-02 06:05:35');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `nama` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','pelatih','siswa','pendamping','orang_tua','kepala_sekolah') NOT NULL DEFAULT 'siswa',
  `ref_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama`, `username`, `password`, `role`, `ref_id`) VALUES
(1, 'Administrator', 'admin', '$2y$10$w9zlkjm5SQ7Bycm/Mg.twue3Q4FUsouDlHvvrfl6vjYAzr.oHSRYa', 'admin', NULL),
(2, 'Pak Edo', 'Edo', '$2y$10$m/maBf5IxGWQx/1Bp4hyYe0tLqFntAqJ2vusm2OKg9hs6HG5k.jRq', 'pelatih', 2),
(3, 'Pak Bayu', 'Bayu', '$2y$10$ylTxCyjoQ9jQQrhu3G7IeO0bAwqoGf1AcLNNTK19jpXXjM.ruyeu2', 'pelatih', 1),
(4, 'Pak Mesak', 'Mesak', '$2y$10$WPwnQLqADEnHXyl51P1RNOg2f.KRSuSx6Fy1sDHMzQa3K/QClxA16', 'pelatih', 3),
(5, 'Kim Juhoon', 'juhoon', '$2y$10$5rn5W2Og75.A8fF12.XOJuK.OMCoB.tVS0F6t7L0dXBR.ps9DKVFy', 'siswa', 1),
(6, 'Kim Dohoon', 'dohoon', '$2y$10$mmwnT4Klcz5234Vf/UICDuwSdGDcRJCDFqz.f9zthuA8pF35dgQ/6', 'siswa', 2),
(7, 'taesan', 'taesan', '$2y$10$.GZovixInRR.al86GixIC.laW8j/RKx2RKhVkfo4XvplR5XfA9ltC', 'siswa', 3),
(8, 'Pak Andik', 'andik', '$2y$10$tZzwOzpXU1xag65kFCLIbejON2D82GxxmphvDEgCGXNnANCbkrP0m', 'pendamping', 29),
(9, 'Bu Yuni', 'Yuni', '$2y$10$G7ZgzWDjcMgeL0hgd0nRLOIgSPfiy4LvUbFRW50eMtsZ5c1.DbhV.', 'pendamping', 30),
(10, 'Test Siswa', 'testsiswa', '$2y$10$12oWYGBm3904xh2Rbxfcv.WQjk9C4DM0vvcTHDGHeGzVNtxVDmw2i', 'siswa', NULL),
(11, 'Student Test', 'student_test', '$2y$10$pF.1EVAVhDpr1cj0gMbbCuZazrvHKP9tdRnCZwePcrjhDbRZRHqty', 'siswa', NULL),
(12, 'Pak Tegar', 'tegar', '$2y$10$r9YkuyVPHpngZ7o7SLW/6OnYqBhV6r/Ph/ZyCinC.gNgdClfgYdji', 'pelatih', 4),
(14, 'Kepala Sekolah', 'kepalasekolah', '$2y$10$DwECrnwBcs0Gyot6QKvU6eQmjxYg9324LC5G.KJoV68RLZ2CC1aUW', 'kepala_sekolah', NULL),
(16, 'Carmen', 'carmen', '$2y$10$4t1Kj3psBuhIiifuRjJ4w.RVMHGlpahh1tCR7qYDXjOclyGLe.hm.', 'siswa', 4),
(17, 'Bu Retha', 'Retha', '$2y$10$ZBcbs/tOKUcF58W772ehG.kqnhZCs8/zhAjYUzC67aZshznvnlD.C', 'pelatih', 5),
(18, 'Bu Lina', 'lina', '$2y$10$XIvS7HfOjoeTYh7MSxVz9e3PNKRoM44zc5qaoR4L1cWwFBz7ES4Wq', 'pendamping', 31),
(19, 'Kak Febri', 'febri', '$2y$10$LSUMUDnNowmDjHZgSf0PDeK6OtjeyLjB5m7aU9cAKgY9W9c1nHbam', 'pelatih', 6),
(20, 'Bu Uli', 'uli', '$2y$10$1lgXEGV9BeWXQuIsvl7UcukqloMxQ6CQdDxtNW5DLL4tI7m3v.rq2', 'pelatih', 7),
(21, 'Pak Okky', 'okky', '$2y$10$pfB3F2e1UeYmSFadz0aL6.Kg6LX8dEFPj8ueixgfFajzAjm5GcMLu', 'pelatih', 8),
(22, 'Pak Trianto', 'trianto', '$2y$10$iAqk3tYUm8HFaL/FxGRkwucICt0269ZUPtoCl2jod4oviqdU/SFEa', 'pelatih', 10),
(23, 'Bu Agustin', 'agustin', '$2y$10$/r0WmzfwwMeSnfNTY6IiF.lQzy5W./CL8dn0G5NRixtsCKvcJnfIe', 'pelatih', 11),
(24, 'Juha', 'juha', '$2y$10$NOvHtyXmj1aCGQE4pQfSy.lyg.AtUlRQnhqgmJfXbTq8r0NGKae6m', 'siswa', 5),
(25, 'Martin', 'martin', '$2y$10$fU3rt476YRIIKa.UGYH47.nbKINYJSfuCHwCqMICpvukmHGALUpmO', 'siswa', 12),
(26, 'Jihoon', 'jihoon', '$2y$10$4oy9cMUfJ8FcXsOxFEMXYONQC930IPNE.FmeGmWawsmpsJYnSJ/1u', 'siswa', 9);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `absensi`
--
ALTER TABLE `absensi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_siswa` (`id_siswa`),
  ADD KEY `id_pelatih` (`id_pelatih`);

--
-- Indexes for table `aspek_penilaian_ekskul`
--
ALTER TABLE `aspek_penilaian_ekskul`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ekskul_id` (`ekskul_id`);

--
-- Indexes for table `ekstrakurikuler`
--
ALTER TABLE `ekstrakurikuler`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `guru_pendamping`
--
ALTER TABLE `guru_pendamping`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `izin_ekskul`
--
ALTER TABLE `izin_ekskul`
  ADD PRIMARY KEY (`id`),
  ADD KEY `siswa_id` (`siswa_id`),
  ADD KEY `ekskul_id` (`ekskul_id`);

--
-- Indexes for table `jurnal_ekskul`
--
ALTER TABLE `jurnal_ekskul`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ekskul_tgl` (`ekskul_id`,`tanggal`,`tahun_ajaran`,`semester`);

--
-- Indexes for table `kelas`
--
ALTER TABLE `kelas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `nilai_aspek_siswa`
--
ALTER TABLE `nilai_aspek_siswa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_nilai_aspek` (`siswa_id`,`ekskul_id`,`aspek_id`,`semester`,`tahun`),
  ADD KEY `ekskul_id` (`ekskul_id`),
  ADD KEY `aspek_id` (`aspek_id`);

--
-- Indexes for table `nilai_ekskul`
--
ALTER TABLE `nilai_ekskul`
  ADD PRIMARY KEY (`id`),
  ADD KEY `siswa_id` (`siswa_id`),
  ADD KEY `pelatih_id` (`pelatih_id`);

--
-- Indexes for table `nilai_pertemuan`
--
ALTER TABLE `nilai_pertemuan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_siswa_pertemuan` (`ekskul_id`,`siswa_id`,`tanggal`,`tahun_ajaran`,`semester`);

--
-- Indexes for table `pelatih`
--
ALTER TABLE `pelatih`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ekskul_id` (`ekskul_id`),
  ADD KEY `fk_pelatih_guru` (`guru_id`);

--
-- Indexes for table `pendaftaran_ekskul`
--
ALTER TABLE `pendaftaran_ekskul`
  ADD PRIMARY KEY (`id`),
  ADD KEY `siswa_id` (`siswa_id`),
  ADD KEY `ekskul_id` (`ekskul_id`);

--
-- Indexes for table `pengaturan`
--
ALTER TABLE `pengaturan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kunci` (`kunci`);

--
-- Indexes for table `riwayat_kelas`
--
ALTER TABLE `riwayat_kelas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_riwayat` (`siswa_id`,`tahun_ajaran`),
  ADD KEY `kelas_id` (`kelas_id`);

--
-- Indexes for table `siswa`
--
ALTER TABLE `siswa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kelas_id` (`kelas_id`);

--
-- Indexes for table `tahun_ajaran`
--
ALTER TABLE `tahun_ajaran`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `absensi`
--
ALTER TABLE `absensi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `aspek_penilaian_ekskul`
--
ALTER TABLE `aspek_penilaian_ekskul`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `ekstrakurikuler`
--
ALTER TABLE `ekstrakurikuler`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `guru_pendamping`
--
ALTER TABLE `guru_pendamping`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `izin_ekskul`
--
ALTER TABLE `izin_ekskul`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jurnal_ekskul`
--
ALTER TABLE `jurnal_ekskul`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kelas`
--
ALTER TABLE `kelas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `nilai_aspek_siswa`
--
ALTER TABLE `nilai_aspek_siswa`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `nilai_ekskul`
--
ALTER TABLE `nilai_ekskul`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `nilai_pertemuan`
--
ALTER TABLE `nilai_pertemuan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pelatih`
--
ALTER TABLE `pelatih`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `pendaftaran_ekskul`
--
ALTER TABLE `pendaftaran_ekskul`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `pengaturan`
--
ALTER TABLE `pengaturan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=215;

--
-- AUTO_INCREMENT for table `riwayat_kelas`
--
ALTER TABLE `riwayat_kelas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `siswa`
--
ALTER TABLE `siswa`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tahun_ajaran`
--
ALTER TABLE `tahun_ajaran`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `absensi`
--
ALTER TABLE `absensi`
  ADD CONSTRAINT `absensi_ibfk_1` FOREIGN KEY (`id_siswa`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `absensi_ibfk_2` FOREIGN KEY (`id_pelatih`) REFERENCES `pelatih` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `aspek_penilaian_ekskul`
--
ALTER TABLE `aspek_penilaian_ekskul`
  ADD CONSTRAINT `aspek_penilaian_ekskul_ibfk_1` FOREIGN KEY (`ekskul_id`) REFERENCES `ekstrakurikuler` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `izin_ekskul`
--
ALTER TABLE `izin_ekskul`
  ADD CONSTRAINT `izin_ekskul_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `izin_ekskul_ibfk_2` FOREIGN KEY (`ekskul_id`) REFERENCES `ekstrakurikuler` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nilai_aspek_siswa`
--
ALTER TABLE `nilai_aspek_siswa`
  ADD CONSTRAINT `nilai_aspek_siswa_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_aspek_siswa_ibfk_2` FOREIGN KEY (`ekskul_id`) REFERENCES `ekstrakurikuler` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_aspek_siswa_ibfk_3` FOREIGN KEY (`aspek_id`) REFERENCES `aspek_penilaian_ekskul` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nilai_ekskul`
--
ALTER TABLE `nilai_ekskul`
  ADD CONSTRAINT `nilai_ekskul_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_ekskul_ibfk_2` FOREIGN KEY (`pelatih_id`) REFERENCES `pelatih` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pelatih`
--
ALTER TABLE `pelatih`
  ADD CONSTRAINT `fk_pelatih_guru` FOREIGN KEY (`guru_id`) REFERENCES `guru_pendamping` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `pelatih_ibfk_1` FOREIGN KEY (`ekskul_id`) REFERENCES `ekstrakurikuler` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `pendaftaran_ekskul`
--
ALTER TABLE `pendaftaran_ekskul`
  ADD CONSTRAINT `pendaftaran_ekskul_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pendaftaran_ekskul_ibfk_2` FOREIGN KEY (`ekskul_id`) REFERENCES `ekstrakurikuler` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `riwayat_kelas`
--
ALTER TABLE `riwayat_kelas`
  ADD CONSTRAINT `riwayat_kelas_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `riwayat_kelas_ibfk_2` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `siswa`
--
ALTER TABLE `siswa`
  ADD CONSTRAINT `siswa_ibfk_1` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
