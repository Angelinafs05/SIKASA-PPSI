<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/settings.php';
require_once __DIR__ . '/controllers/DashboardController.php';

function requireRole(...$roles) { return (object)['role' => 'admin']; }
$_SERVER['REQUEST_METHOD'] = 'GET';

try {
    DashboardController::adminDashboard();
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
