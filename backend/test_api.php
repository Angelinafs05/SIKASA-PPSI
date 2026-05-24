<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/settings.php';

$db = getDB();
$period = getActivePeriod();
$activeTahun = $period['tahun_ajaran'];

$sql = "SELECT s.*, rk.kelas_id, k.nama_kelas, u.username 
        FROM siswa s 
        JOIN riwayat_kelas rk ON s.id = rk.siswa_id AND rk.tahun_ajaran = :active_tahun
        JOIN kelas k ON rk.kelas_id = k.id 
        LEFT JOIN users u ON s.id = u.ref_id AND u.role = 'siswa'";

$stmt = $db->prepare($sql);
$stmt->execute([':active_tahun' => $activeTahun]);
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($result, JSON_PRETTY_PRINT);
