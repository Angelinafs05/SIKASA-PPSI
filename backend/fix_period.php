<?php
/**
 * Fix: Insert periode aktif ke tabel pengaturan
 * Ekskul yang ada di DB menggunakan: tahun_ajaran=2025/2026, semester=Genap
 */
$pdo = new PDO('mysql:host=localhost;dbname=sikasa_db;charset=utf8mb4', 'root', '');
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$results = [];

// Cek isi tabel pengaturan sekarang
$rows = $pdo->query("SELECT * FROM pengaturan")->fetchAll();
$results['before'] = $rows;

// Set period aktif sesuai ekskul yang sudah ada (2025/2026 Genap)
$tahun    = '2025/2026';
$semester = 'Genap';

$stmt1 = $pdo->prepare("INSERT INTO pengaturan (kunci, nilai) VALUES ('tahun_ajaran_aktif', :v) ON DUPLICATE KEY UPDATE nilai = :v2");
$stmt1->execute([':v' => $tahun, ':v2' => $tahun]);

$stmt2 = $pdo->prepare("INSERT INTO pengaturan (kunci, nilai) VALUES ('semester_aktif', :v) ON DUPLICATE KEY UPDATE nilai = :v2");
$stmt2->execute([':v' => $semester, ':v2' => $semester]);

// Verifikasi setelah update
$rowsAfter = $pdo->query("SELECT * FROM pengaturan")->fetchAll();
$results['after'] = $rowsAfter;

// Test: ambil ekskul dengan filter period baru
$stmt = $pdo->prepare("SELECT id, nama_ekskul, tahun_ajaran, semester FROM ekstrakurikuler WHERE tahun_ajaran = ? AND semester = ?");
$stmt->execute([$tahun, $semester]);
$results['ekskul_with_new_period'] = $stmt->fetchAll();

$results['status'] = 'SUCCESS - Period aktif berhasil di-set ke: ' . $tahun . ' - ' . $semester;

header('Content-Type: application/json');
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
