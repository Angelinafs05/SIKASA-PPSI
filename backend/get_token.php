<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth.php';

// Generate token for admin
$db = getDB();
$stmt = $db->prepare("SELECT id, username, role, ref_id FROM users WHERE role = 'admin' LIMIT 1");
$stmt->execute();
$user = $stmt->fetch();

if ($user) {
    $token = generateJWT($user['id'], $user['username'], $user['role'], $user['ref_id']);
    echo $token;
} else {
    echo "No admin found";
}
