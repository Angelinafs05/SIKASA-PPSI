<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();

$siswa = $db->query("SELECT id, status, kelas_id FROM siswa")->fetchAll(PDO::FETCH_ASSOC);
echo "Siswa total: " . count($siswa) . "\n";
print_r($siswa);

$riwayat = $db->query("SELECT * FROM riwayat_kelas")->fetchAll(PDO::FETCH_ASSOC);
echo "\nRiwayat total: " . count($riwayat) . "\n";
print_r($riwayat);

$pengaturan = $db->query("SELECT * FROM pengaturan WHERE kunci IN ('tahun_ajaran_aktif', 'semester_aktif')")->fetchAll(PDO::FETCH_ASSOC);
echo "\nPengaturan:\n";
print_r($pengaturan);
