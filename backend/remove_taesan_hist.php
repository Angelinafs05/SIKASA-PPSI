<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$db->exec("DELETE FROM riwayat_kelas WHERE siswa_id = 3 AND tahun_ajaran = '2025/2026'");
echo "History for Taesan in 2025/2026 removed.";
