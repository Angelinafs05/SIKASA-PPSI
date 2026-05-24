<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/settings.php';
require_once __DIR__ . '/controllers/SiswaController.php';

function requireRole(...$roles) { return (object)['role' => 'admin']; }
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_X_ADMIN_VIEW_YEAR'] = '2025/2026';

echo "ALUMNI LIST 2025/2026:\n";
$_GET['status'] = 'alumni';
ob_start();
SiswaController::index();
echo ob_get_clean();
