<?php
include 'koneksi.php';

// Check what active periods we have
echo "=== ACTIVE PERIODS ===\n";
$result = $conn->query("SELECT DISTINCT tahun_ajaran, semester FROM pendaftaran_ekskul ORDER BY tahun_ajaran DESC, semester DESC LIMIT 5");
while ($row = $result->fetch_assoc()) {
    echo "{$row['tahun_ajaran']} - {$row['semester']}\n";
}

// Check current settings_periode
echo "\n=== CURRENT ACTIVE PERIOD ===\n";
$result = $conn->query("SELECT tahun_ajaran, semester FROM settings_periode WHERE is_active = 1");
$period = $result->fetch_assoc();
if ($period) {
    echo "Tahun: {$period['tahun_ajaran']}, Semester: {$period['semester']}\n";
} else {
    echo "No active period set\n";
}

// Check registrations for students
echo "\n=== REGISTRATIONS FOR STUDENTS WITH BASKET PUTRA ===\n";
$result = $conn->query("
    SELECT DISTINCT pe.siswa_id, s.nama_siswa, pe.ekskul_id, e.nama_ekskul, pe.status, pe.tahun_ajaran, pe.semester
    FROM pendaftaran_ekskul pe
    JOIN siswa s ON pe.siswa_id = s.id
    JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
    WHERE e.nama_ekskul LIKE '%Basket Putra%'
    ORDER BY pe.siswa_id, pe.tahun_ajaran DESC, pe.semester DESC
    LIMIT 10
");
while ($row = $result->fetch_assoc()) {
    echo "Student: {$row['nama_siswa']} (ID: {$row['siswa_id']}), Ekskul ID: {$row['ekskul_id']}, Ekskul: {$row['nama_ekskul']}, Status: {$row['status']}, Period: {$row['tahun_ajaran']} {$row['semester']}\n";
}

$conn->close();
