<?php
require_once 'config/database.php';
$db = getDB();
$username = 'admin';
$stmt = $db->prepare("SELECT password FROM users WHERE username = :username");
$stmt->execute([':username' => $username]);
$user = $stmt->fetch();

if ($user) {
    echo "Hash in DB: " . $user['password'] . "\n";
    echo "Check 'password123': " . (password_verify('password123', $user['password']) ? 'MATCH' : 'NO MATCH') . "\n";
    echo "Check 'admin123': " . (password_verify('admin123', $user['password']) ? 'MATCH' : 'NO MATCH') . "\n";
    echo "Check 'admin': " . (password_verify('admin', $user['password']) ? 'MATCH' : 'NO MATCH') . "\n";
} else {
    echo "User admin not found\n";
}
