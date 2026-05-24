<?php

$host = '127.0.0.1';
$db   = 'sikasa_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->beginTransaction();
    
    // Create lomba table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS lomba (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_lomba VARCHAR(255) NOT NULL,
            tanggal_pelaksanaan DATE NOT NULL,
            tempat VARCHAR(255) NOT NULL,
            deskripsi TEXT,
            surat_edaran VARCHAR(255),
            tahun_ajaran VARCHAR(20) NOT NULL,
            semester VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Create peserta_lomba table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS peserta_lomba (
            id INT AUTO_INCREMENT PRIMARY KEY,
            lomba_id INT NOT NULL,
            siswa_id INT NOT NULL,
            status_izin ENUM('Menunggu', 'Disetujui', 'Ditolak') DEFAULT 'Menunggu',
            alasan_tolak TEXT NULL,
            surat_balasan VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lomba_id) REFERENCES lomba(id) ON DELETE CASCADE,
            FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->commit();
    echo "Lomba tables created successfully.\n";
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error: " . $e->getMessage() . "\n";
}
