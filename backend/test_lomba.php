<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/settings.php';
require_once __DIR__ . '/helpers/auth.php';
require_once __DIR__ . '/controllers/LombaController.php';

// Mock requireRole
function requireRole($role) {
    return (object)['id' => 1, 'role' => 'admin', 'ref_id' => 1];
}

$_GET = [];
$_SERVER['REQUEST_METHOD'] = 'GET';

try {
    LombaController::getAllLomba();
} catch (Throwable $e) {
    echo "CAUGHT ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
