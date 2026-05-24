<?php
require 'backend/config/database.php';
$db = getDB();
$stmt = $db->query('DESCRIBE siswa');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
