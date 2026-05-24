<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/settings.php';
require_once __DIR__ . '/controllers/SiswaController.php';

function requireRole(...$roles) { return (object)['role' => 'admin']; }
$_SERVER['REQUEST_METHOD'] = 'GET';

// MOCK Year to 2024/2025
$_SERVER['HTTP_X_ADMIN_VIEW_YEAR'] = '2024/2025';

echo "YEAR: 2024/2025\n";

echo "AKTIF LIST:\n";
$_GET['status'] = 'aktif';
ob_start();
SiswaController::index();
echo ob_get_clean();

echo "\n\nALUMNI LIST:\n";
$_GET['status'] = 'alumni';
ob_start();
SiswaController::index();
echo ob_get_clean();
