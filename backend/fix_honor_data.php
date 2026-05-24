<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();

$rows = $db->query("SELECT id, bulan, tahun FROM riwayat_honor WHERE tahun_ajaran IS NULL OR tahun_ajaran = ''")->fetchAll(PDO::FETCH_ASSOC);

echo "Processing " . count($rows) . " rows...\n";

$ganjilMonths = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
$genapMonths  = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

foreach ($rows as $row) {
    $id = $row['id'];
    $bulan = $row['bulan'];
    $tahun = (int) $row['tahun'];
    
    $ta = "";
    $sem = "";
    
    if (in_array($bulan, $ganjilMonths)) {
        $sem = "Ganjil";
        $ta = $tahun . "/" . ($tahun + 1);
    } else {
        $sem = "Genap";
        $ta = ($tahun - 1) . "/" . $tahun;
    }
    
    $stmt = $db->prepare("UPDATE riwayat_honor SET tahun_ajaran = :ta, semester = :sem WHERE id = :id");
    $stmt->execute([':ta' => $ta, ':sem' => $sem, ':id' => $id]);
    echo "Updated ID $id: $ta $sem ($bulan $tahun)\n";
}

echo "Migration complete.";
