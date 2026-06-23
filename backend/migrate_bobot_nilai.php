<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = getDB();
    
    // Create Aspek Penilaian table
    $sql1 = "
    CREATE TABLE IF NOT EXISTS aspek_penilaian_ekskul (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ekskul_id INT NOT NULL,
        nama_aspek VARCHAR(100) NOT NULL,
        bobot INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ekskul_id) REFERENCES ekstrakurikuler(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    // Create Nilai Aspek Siswa table
    $sql2 = "
    CREATE TABLE IF NOT EXISTS nilai_aspek_siswa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        siswa_id INT NOT NULL,
        ekskul_id INT NOT NULL,
        aspek_id INT NOT NULL,
        pelatih_id INT NOT NULL,
        nilai FLOAT NOT NULL,
        semester ENUM('Ganjil', 'Genap') NOT NULL,
        tahun VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
        FOREIGN KEY (ekskul_id) REFERENCES ekstrakurikuler(id) ON DELETE CASCADE,
        FOREIGN KEY (aspek_id) REFERENCES aspek_penilaian_ekskul(id) ON DELETE CASCADE,
        UNIQUE KEY unique_nilai_aspek (siswa_id, ekskul_id, aspek_id, semester, tahun)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $db->exec($sql1);
    echo "Table aspek_penilaian_ekskul created or already exists.\n";
    
    $db->exec($sql2);
    echo "Table nilai_aspek_siswa created or already exists.\n";
    
    echo "Migration completed successfully.\n";
    
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
