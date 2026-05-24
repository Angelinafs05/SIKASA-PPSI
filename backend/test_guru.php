<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
echo "== GURU ==\n";
print_r($db->query("DESCRIBE guru_pendamping")->fetchAll(PDO::FETCH_ASSOC));
echo "== EKSKUL ==\n";
print_r($db->query("SELECT * FROM ekstrakurikuler LIMIT 1")->fetchAll(PDO::FETCH_ASSOC));
echo "== PELATIH ==\n";
print_r($db->query("SELECT * FROM pelatih LIMIT 1")->fetchAll(PDO::FETCH_ASSOC));
