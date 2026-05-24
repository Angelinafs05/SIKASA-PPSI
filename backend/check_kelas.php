<?php
require 'config/database.php';
$db = getDB();
$stmt = $db->query("SELECT * FROM kelas");
$kelas = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($kelas);
