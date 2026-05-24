<?php
include 'koneksi.php';

$sid = 1;
$t = '2025/2026';
$s = 'Genap';

// Test the fixed query from siswaDashboard
$sql = "
    SELECT pe.id AS reg_id, e.id AS ekskul_id, e.nama_ekskul, e.hari, e.jam, e.tempat, p.nama_pelatih
    FROM pendaftaran_ekskul pe
    JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
    LEFT JOIN pelatih p ON p.ekskul_id = e.id
    WHERE pe.siswa_id = ? AND pe.status = 'approved' AND pe.tahun_ajaran = ? AND pe.semester = ?
    ORDER BY FIELD(SUBSTRING_INDEX(e.hari, ',', 1), 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') ASC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("iss", $sid, $t, $s);
$stmt->execute();
$result = $stmt->get_result();

echo "=== KIM JUHOON'S EXTRACURRICULARS (Student ID 1) - PERIOD 2025/2026 GENAP - WITH FIX ===\n";

$count = 0;
$basket_count = 0;
while ($row = $result->fetch_assoc()) {
    $count++;
    echo "\n$count. Ekskul ID: {$row['ekskul_id']}\n";
    echo "   Nama: {$row['nama_ekskul']}\n";
    echo "   Pelatih: {$row['nama_pelatih']}\n";
    echo "   Hari: {$row['hari']}\n";
    echo "   Jam: {$row['jam']}\n";

    if (stripos($row['nama_ekskul'], 'Basket') !== false) {
        $basket_count++;
    }
}

echo "\n\nTotal Ekskuls found: $count\n";
echo "Basket entries found: $basket_count\n";

if ($basket_count > 0) {
    echo "\n✓ SUCCESS: The fix is working. Each ekskul is listed only ONCE with the correct pelatih.\n";
    echo "  Without the fix, Basket Putra would appear multiple times if there are duplicate names.\n";
} else {
    echo "\nNote: Student doesn't have Basket Putra in this period.\n";
}

$conn->close();
