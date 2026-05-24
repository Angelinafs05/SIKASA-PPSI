<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$out = [
  'ekskuls' => $db->query("SELECT * FROM ekstrakurikuler LIMIT 2")->fetchAll(PDO::FETCH_ASSOC),
  'pelatihs' => $db->query("SELECT p.*, e.nama_ekskul, e.pendamping as ekskul_pendamping FROM pelatih p LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id")->fetchAll(PDO::FETCH_ASSOC),
  'gurus' => $db->query("SELECT * FROM guru_pendamping LIMIT 2")->fetchAll(PDO::FETCH_ASSOC)
];
file_put_contents('dump.json', json_encode($out, JSON_PRETTY_PRINT));
