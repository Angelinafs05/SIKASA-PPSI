<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
echo "--- NILAI EKSKUL ---\n";
$stmt = $db->query("SELECT * FROM nilai_ekskul");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- ORANG TUA SISWA ---\n";
$stmt2 = $db->query("SELECT * FROM orang_tua_siswa");
print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- SISWA ---\n";
$stmt3 = $db->query("SELECT id, nama_siswa FROM siswa");
print_r($stmt3->fetchAll(PDO::FETCH_ASSOC));
