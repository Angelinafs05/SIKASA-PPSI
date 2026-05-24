<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$stmt = $db->query('SELECT id, nama_siswa FROM siswa');
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($results);
