<?php
require_once 'config/database.php';
$db = getDB();
$stmt = $db->query("SELECT id, username, role FROM users");
$users = $stmt->fetchAll();
print_r($users);
