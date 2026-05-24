<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();

try {
    $cols = $db->query("DESCRIBE absensi")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('surat_ijin', $cols)) {
        $db->exec("ALTER TABLE absensi ADD COLUMN surat_ijin VARCHAR(255) AFTER status");
        echo "Added surat_ijin to absensi\n";
    } else {
        echo "surat_ijin already exists\n";
    }
    
    if (!in_array('keterangan', $cols)) {
        $db->exec("ALTER TABLE absensi ADD COLUMN keterangan TEXT AFTER surat_ijin");
        echo "Added keterangan to absensi\n";
    } else {
        echo "keterangan already exists\n";
    }

    echo "Migration absensi done.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
