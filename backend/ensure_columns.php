<?php
require_once __DIR__ . '/helpers/db.php';
$db = getDB();

try {
    // Add surat_ijin if not exists
    $cols = $db->query("DESCRIBE pendaftaran_ekskul")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('surat_ijin', $cols)) {
        $db->exec("ALTER TABLE pendaftaran_ekskul ADD COLUMN surat_ijin VARCHAR(255) AFTER status");
        echo "Added surat_ijin\n";
    }
    
    if (!in_array('tahun_ajaran', $cols)) {
        $db->exec("ALTER TABLE pendaftaran_ekskul ADD COLUMN tahun_ajaran VARCHAR(20) AFTER surat_ijin");
        echo "Added tahun_ajaran\n";
    }
    
    if (!in_array('semester', $cols)) {
        $db->exec("ALTER TABLE pendaftaran_ekskul ADD COLUMN semester VARCHAR(20) AFTER tahun_ajaran");
        echo "Added semester\n";
    }

    echo "Table schema check completed successfully.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
