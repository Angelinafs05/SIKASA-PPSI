<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();

// Ekskul
$ekskul = $db->query("SELECT * FROM ekstrakurikuler")->fetchAll(PDO::FETCH_ASSOC);

// Pelatih
$pelatih = $db->query("SELECT p.*, e.nama_ekskul, e.pendamping as ekskul_pendamping FROM pelatih p LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id")->fetchAll(PDO::FETCH_ASSOC);

echo "EKSKUL:\n";
print_r(array_slice($ekskul, 0, 2));

echo "\nPELATIH:\n";
print_r(array_slice($pelatih, 0, 2));
