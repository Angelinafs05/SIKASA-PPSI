<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$rows = $db->query('DESCRIBE nilai_ekskul')->fetchAll(PDO::FETCH_ASSOC);
print_r($rows);
