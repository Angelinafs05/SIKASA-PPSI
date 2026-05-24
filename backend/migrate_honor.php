<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
try {
    $db->exec("ALTER TABLE riwayat_honor ADD COLUMN tahun_ajaran VARCHAR(20) AFTER tahun, ADD COLUMN semester ENUM('Ganjil', 'Genap') AFTER tahun_ajaran");
    echo "Columns added successfully.";
} catch (Exception $e) {
    echo "Error or already exists: " . $e->getMessage();
}
