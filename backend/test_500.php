<?php
// Mock server variables to pretend it's a GET request to /api/admin/lomba
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/admin/lomba';
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer dummy';

// Intercept requireRole using mock if possible... or redefine it before auth.php is loaded? No, auth.php will redeclare.
// Just use a dummy PDO object or simulate. We can modify LombaController temporarily... wait I can just use curl! No, token...
// Let's create a script that calls getAllLomba() directly without auth.

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/controllers/LombaController.php';

// Mock function for requireRole
if (!function_exists('requireRole')) {
    function requireRole($role) {
        return (object)['id' => 1, 'role' => 'admin', 'ref_id' => 1];
    }
}

// Error intercept
try {
    LombaController::getAllLomba();
} catch (Throwable $e) {
    echo "ERROR CAUGHT: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
