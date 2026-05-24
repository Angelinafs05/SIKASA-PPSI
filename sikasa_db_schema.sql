CREATE DATABASE IF NOT EXISTS `sikasa_db`;
USE `sikasa_db`;

-- Table structure for `kelas`
CREATE TABLE IF NOT EXISTS `kelas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_kelas` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `siswa`
CREATE TABLE IF NOT EXISTS `siswa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_siswa` varchar(100) NOT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `kelas_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `ekstrakurikuler`
CREATE TABLE IF NOT EXISTS `ekstrakurikuler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_ekskul` varchar(100) NOT NULL,
  `pelatih` varchar(100) DEFAULT NULL,
  `hari` varchar(20) DEFAULT NULL,
  `jam` varchar(20) DEFAULT NULL,
  `tempat` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `pelatih`
CREATE TABLE IF NOT EXISTS `pelatih` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_pelatih` varchar(100) NOT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `pendamping` varchar(100) DEFAULT NULL,
  `ekskul_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`ekskul_id`) REFERENCES `ekstrakurikuler`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `users`
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','pelatih','siswa') NOT NULL DEFAULT 'siswa',
  `ref_id` int(11) DEFAULT NULL, -- ID Siswa or ID Pelatih depending on role
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `pendaftaran_ekskul`
CREATE TABLE IF NOT EXISTS `pendaftaran_ekskul` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `siswa_id` int(11) NOT NULL,
  `ekskul_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `tanggal_daftar` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`ekskul_id`) REFERENCES `ekstrakurikuler`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `absensi`
CREATE TABLE IF NOT EXISTS `absensi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_siswa` int(11) NOT NULL,
  `id_pelatih` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('Hadir','Izin','Sakit','Alfa') NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`id_siswa`) REFERENCES `siswa`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`id_pelatih`) REFERENCES `pelatih`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `izin_ekskul`
CREATE TABLE IF NOT EXISTS `izin_ekskul` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `siswa_id` int(11) NOT NULL,
  `ekskul_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `pesan` text NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`ekskul_id`) REFERENCES `ekstrakurikuler`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for `nilai_ekskul`
CREATE TABLE IF NOT EXISTS `nilai_ekskul` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `siswa_id` int(11) NOT NULL,
  `pelatih_id` int(11) NOT NULL,
  `nilai` int(11) NOT NULL,
  `keterangan` varchar(255) DEFAULT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `tahun` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`pelatih_id`) REFERENCES `pelatih`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (password: admin123)
-- The password hash was generated using password_hash('admin123', PASSWORD_DEFAULT)
INSERT INTO `users` (`nama`, `username`, `password`, `role`) VALUES 
('Administrator', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
