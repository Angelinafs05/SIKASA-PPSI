<?php
// Set the session for student Martin (ID 12)
session_start();
$_SESSION['login'] = true;
$_SESSION['role'] = 'siswa';
$_SESSION['ref_id'] = 12;

include 'backend/index.php';

// This will handle the request
// But we need to simulate a GET request to the siswa dashboard
// Let's do a different approach - call the function directly

include 'backend/config/functions.php';
include 'backend/controllers/DashboardController.php';

try {
    // Get the database
    $db = getDB();

    // Simulate getting dashboard
    $period = getActivePeriod();
    $sid = 12;
    $t = $period['tahun_ajaran'];
    $s = $period['semester'];

    // My Ekskuls (Approved) - testing the fixed query
    $stmt3 = $db->prepare("
        SELECT pe.id AS reg_id, e.id AS ekskul_id, e.nama_ekskul, e.hari, e.jam, e.tempat, p.nama_pelatih
        FROM pendaftaran_ekskul pe
        JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
        LEFT JOIN pelatih p ON p.ekskul_id = e.id
        WHERE pe.siswa_id = :sid AND pe.status = 'approved' AND pe.tahun_ajaran = :t AND pe.semester = :s
        ORDER BY FIELD(SUBSTRING_INDEX(e.hari, ',', 1), 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') ASC
    ");
    $stmt3->execute([':sid' => $sid, ':t' => $t, ':s' => $s]);
    $myEkskuls = $stmt3->fetchAll();

    echo "=== MARTIN'S EXTRACURRICULARS (Student ID 12) ===\n";
    echo "Period: $t, Semester: $s\n";
    echo "Total Ekskuls: " . count($myEkskuls) . "\n\n";

    foreach ($myEkskuls as $ekskul) {
        echo "Ekskul ID: {$ekskul['ekskul_id']}\n";
        echo "Nama: {$ekskul['nama_ekskul']}\n";
        echo "Pelatih: {$ekskul['nama_pelatih']}\n";
        echo "Hari: {$ekskul['hari']}\n";
        echo "Jam: {$ekskul['jam']}\n";
        echo "Tempat: {$ekskul['tempat']}\n";
        echo "---\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
