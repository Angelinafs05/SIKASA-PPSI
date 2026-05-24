<?php
require_once 'backend/config/database.php';

try {
    $db = getDB();
    
    // Check if columns already exist
    $result = $db->query("SHOW COLUMNS FROM `siswa` LIKE 'no_induk'");
    if ($result->rowCount() == 0) {
        $sql = "ALTER TABLE `siswa` 
                ADD COLUMN `no_induk` varchar(50) DEFAULT NULL AFTER `id`,
                ADD COLUMN `kota` varchar(100) DEFAULT NULL AFTER `no_hp`,
                ADD COLUMN `alamat` text DEFAULT NULL AFTER `kota`,
                ADD COLUMN `nama_ayah` varchar(100) DEFAULT NULL AFTER `alamat`,
                ADD COLUMN `pekerjaan_ayah` varchar(100) DEFAULT NULL AFTER `nama_ayah`,
                ADD COLUMN `nama_ibu` varchar(100) DEFAULT NULL AFTER `pekerjaan_ayah`,
                ADD COLUMN `pekerjaan_ibu` varchar(100) DEFAULT NULL AFTER `nama_ibu`";
        
        $db->exec($sql);
        echo "Successfully added new columns to 'siswa' table.\n";
    } else {
        echo "Columns already exist in 'siswa' table.\n";
    }

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
