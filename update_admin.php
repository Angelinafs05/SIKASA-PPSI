<?php
require 'backend/config/database.php';

$db = getDB();

$username = 'admin';
$password = 'admin123';
$hashed = password_hash($password, PASSWORD_DEFAULT);

$stmt = $db->prepare("UPDATE users SET password = :password WHERE username = :username");
$stmt->execute([':password' => $hashed, ':username' => $username]);

echo "Password updated successfully to: " . $hashed;
