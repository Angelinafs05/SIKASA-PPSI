<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$db->exec("UPDATE siswa SET status = 'aktif', kelas_id = 20 WHERE id = 2");
echo "Kim Dohoon restored successfully.";
