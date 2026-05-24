<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
// Simulate valid auth user ID 13
$siswa_id = 1;
$db = getDB();

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
$nilai = $stmt->fetchAll(PDO::FETCH_ASSOC);

successResponse($nilai);
