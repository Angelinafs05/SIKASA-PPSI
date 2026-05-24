<?php
header('Content-Type: application/json');

require 'backend/config/database.php';

$db = getDB();

$username = 'admin';
$password = 'admin123';

$stmt = $db->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
$stmt->execute([':username' => $username]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit;
}

$is_valid = password_verify($password, $user['password']);

echo json_encode([
    'status' => $is_valid ? 'success' : 'error',
    'message' => $is_valid ? 'Password is correct' : 'Password is wrong',
    'hash_in_db' => $user['password'],
    'user_data' => $user
]);
