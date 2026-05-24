<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';

// Test for Sishwa ID 1 (Kim Juhoon) who we know has grades
$siswa_id = 1;
$db = getDB();

echo "--- TESTING ABSENSI ---\n";
try {
    $stmt = $db->prepare("
        SELECT a.tanggal, a.status, a.keterangan, e.nama_ekskul, p.nama_pelatih
        FROM absensi a
        JOIN pelatih p ON a.id_pelatih = p.id
        JOIN ekstrakurikuler e ON p.ekskul_id = e.id
        WHERE a.id_siswa = ?
        ORDER BY a.tanggal DESC
    ");
    $stmt->execute([$siswa_id]);
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($res) . " attendance records.\n";
    if (count($res) > 0) print_r($res[0]);
} catch (Exception $e) { echo "ERROR: " . $e->getMessage() . "\n"; }

echo "\n--- TESTING NILAI ---\n";
try {
    $stmt = $db->prepare("
        SELECT 
            n.nilai, 
            n.keterangan as catatan, 
            n.semester, 
            n.tahun as tahun_ajaran,
            e.nama_ekskul, 
            p.nama_pelatih,
            CASE 
                WHEN n.nilai >= 80 THEN 'A'
                WHEN n.nilai >= 70 THEN 'B'
                WHEN n.nilai >= 60 THEN 'C'
                ELSE 'D'
            END as grade
        FROM nilai_ekskul n
        JOIN ekstrakurikuler e ON n.ekskul_id = e.id
        LEFT JOIN pelatih p ON n.pelatih_id = p.id
        WHERE n.siswa_id = ?
        ORDER BY n.tahun DESC, n.semester DESC
    ");
    $stmt->execute([$siswa_id]);
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($res) . " grade records.\n";
    if (count($res) > 0) print_r($res[0]);
} catch (Exception $e) { echo "ERROR: " . $e->getMessage() . "\n"; }

echo "\n--- TESTING LOMBA ---\n";
try {
    $stmt = $db->prepare("
        SELECT l.*, pl.status_izin, pl.alasan_tolak, pl.surat_balasan
        FROM peserta_lomba pl
        JOIN lomba l ON pl.lomba_id = l.id
        WHERE pl.siswa_id = ?
        ORDER BY l.tanggal_pelaksanaan DESC
    ");
    $stmt->execute([$siswa_id]);
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($res) . " competition records.\n";
    if (count($res) > 0) print_r($res[0]);
} catch (Exception $e) { echo "ERROR: " . $e->getMessage() . "\n"; }
