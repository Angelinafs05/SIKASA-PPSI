<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/auth.php'; // For reqRole etc if needed, though we'll skip it in CLI
$db = getDB();

$parentUserId = 13;
$siswaId = 1;

echo "--- CHECKING RELATIONSHIP ---\n";
$stmt = $db->prepare("SELECT 1 FROM orang_tua_siswa WHERE parent_user_id = ? AND siswa_id = ?");
$stmt->execute([$parentUserId, $siswaId]);
$rel = $stmt->fetch();
echo $rel ? "Relation exists\n" : "NO RELATION FOUND\n";

echo "\n--- CHECKING NILAI QUERY ---\n";
// Same as in ParentController::getChildNilai
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
$stmt->execute([$siswaId]);
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($results)) {
    echo "NO GRADES FOUND FOR SISWA ID $siswaId\n";
    echo "Dumping raw table for this siswa:\n";
    $raw = $db->prepare("SELECT * FROM nilai_ekskul WHERE siswa_id = ?");
    $raw->execute([$siswaId]);
    print_r($raw->fetchAll(PDO::FETCH_ASSOC));
} else {
    echo "Found " . count($results) . " grades:\n";
    print_r($results);
}
