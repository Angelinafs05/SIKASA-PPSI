<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$q = $db->query("DESCRIBE nilai_ekskul");
while($r = $q->fetch()) {
    echo $r['Field'] . "\n";
}
