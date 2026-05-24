<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$stmt = $db->query('DESCRIBE pelatih');
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($results);
