<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$tables = ['siswa', 'pelatih', 'ekstrakurikuler', 'pendaftaran_ekskul', 'absensi', 'nilai_ekskul', 'orang_tua_siswa'];
foreach($tables as $t) {
    echo "--- $t ---\n";
    $q = $db->query("DESCRIBE $t");
    while($r = $q->fetch()) echo $r['Field'] . "\n";
    echo "\n";
}
