<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
echo "== EKSKUL ==\n";
print_r($db->query("DESCRIBE ekstrakurikuler")->fetchAll(PDO::FETCH_ASSOC));
echo "== PELATIH ==\n";
print_r($db->query("DESCRIBE pelatih")->fetchAll(PDO::FETCH_ASSOC));
