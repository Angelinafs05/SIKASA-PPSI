<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/settings.php';
require_once __DIR__ . '/controllers/AbsensiController.php';

// Mock response functions instead of loading response.php
function jsonResponse($data, int $statusCode = 200): void {
    if ($statusCode !== 200) {
        throw new Exception("HTTP $statusCode: " . json_encode($data));
    }
}
function successResponse($data = null, string $message = 'Success', int $statusCode = 200): void {
    // success
}
function errorResponse(string $message = 'Error', int $statusCode = 400, $errors = null): void {
    throw new Exception("HTTP $statusCode: $message");
}

$db = getDB();
$stmt = $db->query("SELECT id, username, role, ref_id FROM users WHERE role = 'siswa'");
$users = $stmt->fetchAll(PDO::FETCH_OBJ);

echo "Testing " . count($users) . " users for kehadiran...\n";

foreach ($users as $user) {
    if (!function_exists('requireRole')) {
        function requireRole(...$roles) { 
            global $currentUser;
            return $currentUser; 
        }
    }
    
    global $currentUser;
    $currentUser = clone $user;

    try {
        AbsensiController::siswaKehadiran();
    } catch (Throwable $e) {
        echo "User ID {$user->id} (Ref: {$user->ref_id}): ERROR - " . $e->getMessage() . "\n";
    }
}
echo "Done.\n";
