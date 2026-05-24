<?php
require_once 'config/database.php';
$db = getDB();
$stmt = $db->prepare("SELECT id, username, role FROM users WHERE role = 'admin'");
$stmt->execute();
$users = $stmt->fetchAll();
echo json_encode($users, JSON_PRETTY_PRINT);
