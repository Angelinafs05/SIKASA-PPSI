<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/admin/siswa';
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer dummy';

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/controllers/SiswaController.php';

if (!function_exists('requireRole')) {
    function requireRole($role) {
        return (object)['id' => 1, 'role' => 'admin', 'ref_id' => 1];
    }
}

try {
    $_GET = ['ekskul_id' => '1'];
    SiswaController::index();
} catch (Throwable $e) {
    echo "ERROR CAUGHT: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
