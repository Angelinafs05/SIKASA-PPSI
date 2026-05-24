<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/settings.php';
require_once __DIR__ . '/controllers/SiswaController.php';

// Mock getActivePeriod since we can't mock headers easily in cli without writing more
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['status'] = 'aktif';

// Mock requireRole
function requireRole(...$roles) { return (object)['role' => 'admin']; }

SiswaController::index();
