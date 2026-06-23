<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/settings.php';
require_once __DIR__ . '/controllers/DashboardController.php';

// Mock getDB to make sure it runs
$db = getDB();

function requireRole(...$roles) { 
    $db = getDB();
    $stmt = $db->query("SELECT id, username, role, ref_id FROM users WHERE role = 'siswa' LIMIT 1");
    $user = $stmt->fetch();
    return (object)$user; 
}
$_SERVER['REQUEST_METHOD'] = 'GET';

try {
    DashboardController::siswaDashboard();
} catch (Exception $e) {
    echo "EXCEPTION THROWN:\n";
    echo $e->getMessage() . "\n" . $e->getTraceAsString();
} catch (Error $e) {
    echo "ERROR THROWN:\n";
    echo $e->getMessage() . "\n" . $e->getTraceAsString();
}
