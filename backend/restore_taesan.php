<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$db->exec("UPDATE siswa SET status = 'aktif', kelas_id = 17 WHERE id = 3");
echo "Taesan restored successfully.";
