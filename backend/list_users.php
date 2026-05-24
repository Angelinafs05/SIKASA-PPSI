<?php
require_once 'config/database.php';
$db = getDB();
$stmt = $db->query("SELECT id, username, role FROM users");
$users = $stmt->fetchAll();
echo json_encode($users, JSON_PRETTY_PRINT);
