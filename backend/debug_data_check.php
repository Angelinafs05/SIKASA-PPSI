<?php
$pdo = new PDO('mysql:host=localhost;dbname=sikasa_db;charset=utf8mb4', 'root', '');
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$results = [];

// 0. List semua tabel yang ada di DB
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$results['existing_tables'] = $tables;

$hasTable = fn($t) => in_array($t, $tables);

// 1. Cek jumlah data
$results['siswa_total']   = $hasTable('siswa') ? $pdo->query("SELECT COUNT(*) FROM siswa")->fetchColumn() : 'TABLE_NOT_FOUND';
$results['siswa_aktif']   = $hasTable('siswa') ? $pdo->query("SELECT COUNT(*) FROM siswa WHERE status='aktif'")->fetchColumn() : 'TABLE_NOT_FOUND';
$results['guru_total']    = $hasTable('guru_pendamping') ? $pdo->query("SELECT COUNT(*) FROM guru_pendamping")->fetchColumn() : 'TABLE_NOT_FOUND';
$results['pelatih_total'] = $hasTable('pelatih') ? $pdo->query("SELECT COUNT(*) FROM pelatih")->fetchColumn() : 'TABLE_NOT_FOUND';
$results['ekskul_total']  = $hasTable('ekstrakurikuler') ? $pdo->query("SELECT COUNT(*) FROM ekstrakurikuler")->fetchColumn() : 'TABLE_NOT_FOUND';

// 2. Cek active period dari settings
$period = [];
if ($hasTable('settings')) {
    $settings = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
    foreach ($settings as $s) {
        $period[$s['setting_key']] = $s['setting_value'];
    }
    $results['active_period'] = $period;
} else {
    $results['active_period'] = 'TABLE_NOT_FOUND';
}

// 3. Cek ekskul berdasarkan period aktif
$tahun    = $period['tahun_ajaran'] ?? null;
$semester = $period['semester'] ?? null;
if ($hasTable('ekstrakurikuler')) {
    $stmtAll = $pdo->query("SELECT id, nama_ekskul, tahun_ajaran, semester FROM ekstrakurikuler");
    $results['all_ekskul'] = $stmtAll->fetchAll();
    if ($tahun && $semester) {
        $stmt = $pdo->prepare("SELECT id, nama_ekskul, tahun_ajaran, semester FROM ekstrakurikuler WHERE tahun_ajaran = ? AND semester = ?");
        $stmt->execute([$tahun, $semester]);
        $results['ekskul_on_active_period'] = $stmt->fetchAll();
    } else {
        $results['ekskul_on_active_period'] = 'PERIOD_NOT_SET';
    }
}

// 4. Sample data siswa
$results['sample_siswa']   = $hasTable('siswa') ? $pdo->query("SELECT id, nama_siswa, status, kelas_id FROM siswa LIMIT 5")->fetchAll() : [];
$results['sample_pelatih'] = $hasTable('pelatih') ? $pdo->query("SELECT id, nama_pelatih, ekskul_id FROM pelatih LIMIT 5")->fetchAll() : [];
$results['sample_guru']    = $hasTable('guru_pendamping') ? $pdo->query("SELECT id, nama_guru FROM guru_pendamping LIMIT 5")->fetchAll() : [];

header('Content-Type: application/json');
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
