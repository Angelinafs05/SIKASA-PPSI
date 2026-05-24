<?php
require_once 'config/database.php';
$db = getDB();
$password = 'password123';
$hashed = password_hash($password, PASSWORD_DEFAULT);
$stmt = $db->prepare("UPDATE users SET password = :password WHERE username = 'admin'");
$stmt->execute([':password' => $hashed]);
echo "Password for 'admin' has been reset to 'password123'\n";
