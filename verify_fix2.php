<?php
include 'koneksi.php';

$sid = 1;
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

echo "=== KIM JUHOON'S EXTRACURRICULARS (Student ID 1) - WITH FIX ===\n";
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
echo "Expected: Kim should have only 1 Basket Putra (ID 5 with Pak Tegar), not duplicated.\n";

echo "\n\n=== TESTING WITH OLD QUERY (before fix) ===\n";
// Test the OLD buggy query
$sql_old = "
    SELECT pe.id AS reg_id, e.id AS ekskul_id, e.nama_ekskul, e.hari, e.jam, e.tempat, p.nama_pelatih
    FROM pendaftaran_ekskul pe
    JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
    LEFT JOIN (
        SELECT p_sub.id, p_sub.nama_pelatih, p_sub.guru_id, e_sub.nama_ekskul
        FROM pelatih p_sub
        JOIN ekstrakurikuler e_sub ON p_sub.ekskul_id = e_sub.id
    ) p ON p.nama_ekskul = e.nama_ekskul
    WHERE pe.siswa_id = ? AND pe.status = 'approved' AND pe.tahun_ajaran = ? AND pe.semester = ?
    ORDER BY FIELD(SUBSTRING_INDEX(e.hari, ',', 1), 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') ASC
";

$stmt_old = $conn->prepare($sql_old);
$stmt_old->bind_param("iss", $sid, $t, $s);
$stmt_old->execute();
$result_old = $stmt_old->get_result();

$count_old = 0;
while ($row = $result_old->fetch_assoc()) {
    $count_old++;
    echo "\n$count_old. Ekskul ID: {$row['ekskul_id']}\n";
    echo "   Nama: {$row['nama_ekskul']}\n";
    echo "   Pelatih: {$row['nama_pelatih']}\n";
}

echo "\n\nTotal Ekskuls found with old query: $count_old\n";
echo "ISSUE: The old query would duplicate Basket Putra if there were multiple records with the same name.\n";

$conn->close();
