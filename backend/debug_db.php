<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$stmt = $db->query("SELECT id, username, role, ref_id FROM users WHERE role IN ('admin', 'pelatih', 'pendamping')");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

// check pelatih ekskul_id
$stmt2 = $db->query("SELECT id, nama_pelatih, ekskul_id FROM pelatih");
$pelatihs = $stmt2->fetchAll(PDO::FETCH_ASSOC);

$data = [
    'users' => $users,
    'pelatihs' => $pelatihs
];
header('Content-Type: application/json');
echo json_encode($data, JSON_PRETTY_PRINT);
