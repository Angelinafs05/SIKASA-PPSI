<?php
require 'backend/config/database.php';
$db = getDB();
$stmt = $db->query("SELECT target_kelas FROM ekstrakurikuler");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
$stmt2 = $db->query("SELECT id, nama_kelas FROM kelas LIMIT 5");
print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));
