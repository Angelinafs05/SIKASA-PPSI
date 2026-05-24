<?php
$dsn = 'mysql:host=localhost;dbname=sikasa_db;charset=utf8mb4';
$db = new PDO($dsn, 'root', '');
$stmt = $db->query("SELECT * FROM users WHERE role = 'admin' OR role = 'pelatih'");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
