<?php
include 'koneksi.php';

$sid = 12;
$t = '2025-2026';
$s = 'Ganjil';

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

echo "=== MARTIN'S EXTRACURRICULARS (Student ID 12) - WITH FIX ===\n";
echo "Period: $t, Semester: $s\n";

$count = 0;
while ($row = $result->fetch_assoc()) {
    $count++;
    echo "\n$count. Ekskul ID: {$row['ekskul_id']}\n";
    echo "   Nama: {$row['nama_ekskul']}\n";
    echo "   Pelatih: {$row['nama_pelatih']}\n";
    echo "   Hari: {$row['hari']}\n";
    echo "   Jam: {$row['jam']}\n";
    echo "   Tempat: {$row['tempat']}\n";
}

echo "\n\nTotal Ekskuls found: $count\n";
echo "\nExpected: Martin should have only 1 Basket Putra (ID 3 with Pak Mesak), not duplicated.\n";

$conn->close();
