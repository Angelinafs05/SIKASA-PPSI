<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$tables = ['absensi', 'pendaftaran_ekskul', 'lomba', 'peserta_lomba', 'nilai_ekskul'];
foreach($tables as $t) {
    echo "--- $t ---\n";
    try {
        $q = $db->query("DESCRIBE $t");
        while($r = $q->fetch()) echo $r['Field'] . "\n";
    } catch (Exception $e) {
        echo "Table does not exist or error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}
