<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$res = $db->query("DESCRIBE riwayat_honor")->fetchAll(PDO::FETCH_ASSOC);
print_r($res);
