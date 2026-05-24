<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();

// Restore status and class_id
$db->exec("UPDATE siswa SET status = 'aktif', kelas_id = 17 WHERE id = 3");

// Add history for 2025/2026 so he appears in the list
$db->exec("INSERT INTO riwayat_kelas (siswa_id, kelas_id, tahun_ajaran) 
           VALUES (3, 17, '2025/2026') 
           ON DUPLICATE KEY UPDATE kelas_id = 17");

echo "Taesan fully restored to active list for 2025/2026.";
