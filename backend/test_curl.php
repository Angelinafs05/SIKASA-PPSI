<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/auth.php';

$db = getDB();
$stmt = $db->query("SELECT id, username, role, ref_id FROM users WHERE role = 'siswa' LIMIT 1");
$user = $stmt->fetch();

if (!$user) {
    die("No siswa user found.");
}

$token = generateToken($user);
echo "Token generated for user ID {$user['id']}.\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost/SIKASA/backend/api/siswa/kehadiran");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $token",
    "Accept: application/json"
]);

$result = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
}
curl_close($ch);

echo "HTTP Code: $httpcode\n";
echo "Response Body:\n";
echo $result . "\n";
