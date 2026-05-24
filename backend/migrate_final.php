<?php
$dsn = 'mysql:host=localhost;dbname=sikasa_db;charset=utf8mb4';
$user = 'root';
$pass = '';

try {
    $db = new PDO($dsn, $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $cols = $db->query("DESCRIBE pendaftaran_ekskul")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('tahun_ajaran', $cols)) {
        $db->exec("ALTER TABLE pendaftaran_ekskul ADD COLUMN tahun_ajaran VARCHAR(20) AFTER surat_ijin");
        echo "Added tahun_ajaran\n";
    }
    
    if (!in_array('semester', $cols)) {
        $db->exec("ALTER TABLE pendaftaran_ekskul ADD COLUMN semester VARCHAR(20) AFTER tahun_ajaran");
        echo "Added semester\n";
    }
    
    echo "Migration Finished\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
