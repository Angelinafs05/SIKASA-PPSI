<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$tables = ['pendaftaran_ekskul', 'ekstrakurikuler', 'siswa'];
foreach($tables as $t) {
    echo "--- $t ---\n";
    $q = $db->query("DESCRIBE $t");
    while($r = $q->fetch()) {
        echo $r['Field'] . " (" . $r['Type'] . ")\n";
    }
    echo "\n";
}
