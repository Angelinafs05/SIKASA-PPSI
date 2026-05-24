<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
print_r($db->query('DESCRIBE absensi')->fetchAll(PDO::FETCH_ASSOC));
