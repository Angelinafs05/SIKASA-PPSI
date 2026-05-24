<?php
$dsn = 'mysql:host=127.0.0.1;dbname=sikasa_db;charset=utf8mb4';
$user = 'root';
$pass = '';
try {
    $db = new PDO($dsn, $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $db->query("SELECT id, username, role, ref_id FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($users);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
