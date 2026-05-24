<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$stmt = $db->query("DESCRIBE nilai_ekskul");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
