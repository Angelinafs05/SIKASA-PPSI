<?php
require_once 'config/database.php';
$db = getDB();

try {
    $db->exec("ALTER TABLE nilai_ekskul ADD COLUMN ekskul_id INT AFTER siswa_id");
    echo "Column ekskul_id added to nilai_ekskul table successfully.\n";
    
    // Attempt to backfill ekskul_id from pelatih table if possible
    $db->exec("UPDATE nilai_ekskul n JOIN pelatih p ON n.pelatih_id = p.id SET n.ekskul_id = p.ekskul_id WHERE n.ekskul_id IS NULL");
    echo "Backfilled ekskul_id from pelatih table.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
