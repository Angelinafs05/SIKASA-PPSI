<?php
include 'koneksi.php';

// Test the fixed query from siswaDashboard
$sid = 3; // Assuming a student ID
$t = '2025-2026';
$s = 'Ganjil';

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

echo "=== SISWA DASHBOARD EKSKUL (Fixed Query) ===\n";
$count = 0;
while ($row = $result->fetch_assoc()) {
    $count++;
    echo "\n{$count}. ID: {$row['ekskul_id']}, Nama: {$row['nama_ekskul']}, Pelatih: {$row['nama_pelatih']}, Hari: {$row['hari']}\n";
}
if ($count == 0) {
    echo "No extracurriculars found for this student.\n";
}

// Test the direct query for ekstrakurikuler
echo "\n\n=== ALL BASKET RECORDS (Ekskul Table) ===\n";
$result = $conn->query("SELECT id, nama_ekskul, hari, jam, tempat FROM ekstrakurikuler WHERE nama_ekskul LIKE '%BASKET%' ORDER BY id");
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, Nama: {$row['nama_ekskul']}, Hari: {$row['hari']}, Jam: {$row['jam']}, Tempat: {$row['tempat']}\n";
}

$conn->close();
