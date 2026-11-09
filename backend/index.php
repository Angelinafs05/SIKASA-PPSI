<?php

/**
 * SIKASA Backend - Main Entry Point & Router
 * PHP Native REST API
 */

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-View-Year, X-Admin-View-Semester');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autoload Composer (untuk firebase/php-jwt)
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

// Load helpers & config
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth.php';
require_once __DIR__ . '/helpers/settings.php';

// Load controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/DashboardController.php';
require_once __DIR__ . '/controllers/SiswaController.php';
require_once __DIR__ . '/controllers/KelasController.php';
require_once __DIR__ . '/controllers/PelatihController.php';
require_once __DIR__ . '/controllers/EkskulController.php';
require_once __DIR__ . '/controllers/PendaftaranController.php';
require_once __DIR__ . '/controllers/AbsensiController.php';
require_once __DIR__ . '/controllers/NilaiController.php';
require_once __DIR__ . '/controllers/BobotNilaiController.php';
require_once __DIR__ . '/controllers/GuruController.php';
require_once __DIR__ . '/controllers/SettingsController.php';
require_once __DIR__ . '/controllers/HonorController.php';
require_once __DIR__ . '/controllers/LombaController.php';
require_once __DIR__ . '/controllers/ParentController.php';
require_once __DIR__ . '/controllers/AdminParentController.php';
require_once __DIR__ . '/controllers/TahunAjaranController.php';

// ==================== ROUTING ====================

$method = $_SERVER['REQUEST_METHOD'];
$uri    = $_SERVER['REQUEST_URI'];

// Remove base path dynamically (support /SIKASA PPSI/backend or /SIKASA/backend)
$uri = preg_replace('#^/SIKASA(?:%20|\s+)PPSI/backend#i', '', $uri);
$uri = preg_replace('#^/SIKASA/backend#i', '', $uri);

// Remove query string
$uri = strtok($uri, '?');

// Remove trailing slash
$uri = rtrim($uri, '/');

// Jika kosong, set ke root
if ($uri === '') $uri = '/';

// ==================== ROUTE DEFINITIONS ====================

// SERVE STATIC UPLOADED FILES (Jika direct web server rewrite mengarah ke index.php)
if (preg_match('#^/public/uploads/(.+)$#', $uri, $m) && $method === 'GET') {
    $filePath = __DIR__ . '/public/uploads/' . $m[1];
    if (file_exists($filePath) && is_file($filePath)) {
        $mime = mime_content_type($filePath);
        header('Content-Type: ' . ($mime ?: 'application/octet-stream'));
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
    } else {
        errorResponse('File tidak ditemukan', 404);
    }
}

// HEALTH CHECK
if ($uri === '/' && $method === 'GET') {
    successResponse(null, 'SIKASA Backend API is running');
}


// AUTH
if ($uri === '/api/login' && $method === 'POST') {
    AuthController::login();
} elseif ($uri === '/api/register' && $method === 'POST') {
    AuthController::register();
} elseif ($uri === '/api/user' && $method === 'GET') {
    AuthController::me();
}

// ADMIN - DASHBOARD
elseif ($uri === '/api/admin/dashboard' && $method === 'GET') {
    DashboardController::adminDashboard();
}

// ADMIN - KELAS
elseif ($uri === '/api/admin/kelas' && $method === 'GET') {
    EkskulController::listKelas();
}

// ADMIN - SISWA
elseif ($uri === '/api/admin/siswa' && $method === 'GET') {
    SiswaController::index();
} elseif ($uri === '/api/admin/siswa/master' && $method === 'GET') {
    SiswaController::masterList();
} elseif ($uri === '/api/admin/siswa/import' && $method === 'POST') {
    SiswaController::import();
} elseif ($uri === '/api/admin/siswa/pindah-kelas' && $method === 'PUT') {
    SiswaController::pindahKelasMassal();
} elseif ($uri === '/api/admin/siswa/graduate' && $method === 'PUT') {
    SiswaController::graduateStudents();
} elseif (preg_match('#^/api/admin/siswa/(\d+)$#', $uri, $m) && $method === 'GET') {
    SiswaController::show((int)$m[1]);
} elseif ($uri === '/api/admin/siswa' && $method === 'POST') {
    SiswaController::store();
} elseif (preg_match('#^/api/admin/siswa/(\d+)$#', $uri, $m) && $method === 'PUT') {
    SiswaController::update((int)$m[1]);
} elseif (preg_match('#^/api/admin/siswa/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    SiswaController::destroy((int)$m[1]);
}

// ADMIN - PELATIH
elseif ($uri === '/api/admin/pelatih' && $method === 'GET') {
    PelatihController::index();
} elseif (preg_match('#^/api/admin/pelatih/(\d+)$#', $uri, $m) && $method === 'GET') {
    PelatihController::show((int)$m[1]);
} elseif ($uri === '/api/admin/pelatih' && $method === 'POST') {
    PelatihController::store();
} elseif (preg_match('#^/api/admin/pelatih/(\d+)$#', $uri, $m) && $method === 'PUT') {
    PelatihController::update((int)$m[1]);
} elseif (preg_match('#^/api/admin/pelatih/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    PelatihController::destroy((int)$m[1]);
}

// ADMIN - GURU PENDAMPING
elseif ($uri === '/api/admin/guru' && $method === 'GET') {
    GuruController::index();
} elseif (preg_match('#^/api/admin/guru/(\d+)$#', $uri, $m) && $method === 'GET') {
    GuruController::show((int)$m[1]);
} elseif ($uri === '/api/admin/guru' && $method === 'POST') {
    GuruController::store();
} elseif (preg_match('#^/api/admin/guru/(\d+)$#', $uri, $m) && $method === 'PUT') {
    GuruController::update((int)$m[1]);
} elseif (preg_match('#^/api/admin/guru/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    GuruController::destroy((int)$m[1]);
}

// ADMIN - EKSKUL
elseif ($uri === '/api/admin/ekskul' && $method === 'GET') {
    EkskulController::index();
} elseif (preg_match('#^/api/admin/ekskul/(\d+)$#', $uri, $m) && $method === 'GET') {
    EkskulController::show((int)$m[1]);
} elseif ($uri === '/api/admin/ekskul' && $method === 'POST') {
    EkskulController::store();
} elseif (preg_match('#^/api/admin/ekskul/(\d+)$#', $uri, $m) && $method === 'PUT') {
    EkskulController::update((int)$m[1]);
} elseif (preg_match('#^/api/admin/ekskul/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    EkskulController::destroy((int)$m[1]);
}

// ADMIN - BOBOT NILAI
elseif ($uri === '/api/admin/bobot-nilai' && $method === 'GET') {
    BobotNilaiController::index();
}

// ADMIN - PENDAFTARAN
elseif ($uri === '/api/admin/pendaftaran' && $method === 'GET') {
    PendaftaranController::index();
} elseif (preg_match('#^/api/admin/pendaftaran/(\d+)/approve$#', $uri, $m) && $method === 'POST') {
    PendaftaranController::approve((int)$m[1]);
} elseif (preg_match('#^/api/admin/pendaftaran/(\d+)/reject$#', $uri, $m) && $method === 'POST') {
    PendaftaranController::reject((int)$m[1]);
} elseif (preg_match('#^/api/admin/pendaftaran/(\d+)/approve-withdrawal$#', $uri, $m) && $method === 'POST') {
    PendaftaranController::approveWithdrawal((int)$m[1]);
} elseif (preg_match('#^/api/admin/pendaftaran/(\d+)/reject-withdrawal$#', $uri, $m) && $method === 'POST') {
    PendaftaranController::rejectWithdrawal((int)$m[1]);
}

// ADMIN - KELAS
elseif ($uri === '/api/admin/kelas' && $method === 'GET') {
    KelasController::index();
}

// ADMIN - ORANG TUA
elseif ($uri === '/api/admin/parents' && $method === 'GET') {
    AdminParentController::index();
} elseif ($uri === '/api/admin/parents' && $method === 'POST') {
    AdminParentController::store();
} elseif (preg_match('#^/api/admin/parents/(\d+)$#', $uri, $m) && $method === 'PUT') {
    AdminParentController::update((int)$m[1]);
} elseif (preg_match('#^/api/admin/parents/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    AdminParentController::destroy((int)$m[1]);
}

// ADMIN - MONITORING
elseif ($uri === '/api/admin/monitoring' && $method === 'GET') {
    DashboardController::monitoring();
} elseif ($uri === '/api/admin/monitoring/absensi' && $method === 'GET') {
    DashboardController::monitoringAbsensi();
} elseif ($uri === '/api/admin/monitoring/nilai' && $method === 'GET') {
    DashboardController::monitoringNilai();
}

// ADMIN - IZIN
elseif ($uri === '/api/admin/izin' && $method === 'GET') {
    AbsensiController::adminListIzin();
} elseif (preg_match('#^/api/admin/izin/(\d+)/status$#', $uri, $m) && $method === 'POST') {
    AbsensiController::adminUpdateIzin((int)$m[1]);
}

// ADMIN - REKAP ABSENSI & NILAI
elseif ($uri === '/api/admin/rekap-absensi' && $method === 'GET') {
    AbsensiController::rekapAbsensi();
} elseif ($uri === '/api/admin/rekap-nilai' && $method === 'GET') {
    NilaiController::rekapNilai();
}

// ADMIN / KEPALA SEKOLAH - HONOR
elseif ($uri === '/api/admin/honor' && $method === 'GET') {
    HonorController::index();
} elseif ($uri === '/api/admin/honor' && $method === 'POST') {
    HonorController::store();
} elseif ($uri === '/api/admin/honor/summary' && $method === 'GET') {
    HonorController::summary();
} elseif (preg_match('#^/api/admin/honor/(\d+)/status$#', $uri, $m) && ($method === 'PUT' || $method === 'POST')) {
    HonorController::updateStatus((int)$m[1]);
} elseif (preg_match('#^/api/admin/honor/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    HonorController::destroy((int)$m[1]);
}

// ADMIN / KEPALA SEKOLAH - LOMBA
elseif ($uri === '/api/admin/lomba' && $method === 'GET') {
    LombaController::getAllLomba();
} elseif ($uri === '/api/admin/lomba' && $method === 'POST') {
    LombaController::createLomba();
} elseif ($uri === '/api/admin/lomba/peserta' && $method === 'POST') {
    LombaController::addPeserta();
} elseif (preg_match('#^/api/admin/lomba/peserta/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    LombaController::removePeserta((int)$m[1]);
} elseif (preg_match('#^/api/admin/lomba/(\d+)/hasil$#', $uri, $m) && $method === 'POST') {
    LombaController::updateHasil((int)$m[1]);
} elseif (preg_match('#^/api/admin/lomba/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    LombaController::deleteLomba((int)$m[1]);
}

// ADMIN - TAHUN AJARAN
elseif ($uri === '/api/admin/tahun-ajaran' && $method === 'GET') {
    TahunAjaranController::index();
} elseif ($uri === '/api/admin/tahun-ajaran' && $method === 'POST') {
    TahunAjaranController::store();
} elseif ($uri === '/api/admin/tahun-ajaran/activate' && $method === 'PUT') {
    TahunAjaranController::activate();
} elseif (preg_match('#^/api/admin/tahun-ajaran/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    TahunAjaranController::destroy((int)$m[1]);
}

// ADMIN - SETTINGS
elseif ($uri === '/api/admin/settings' && $method === 'GET') {
    SettingsController::index();
} elseif ($uri === '/api/admin/settings' && $method === 'POST') {
    SettingsController::update();
}

// PELATIH
elseif ($uri === '/api/pelatih/dashboard' && $method === 'GET') {
    DashboardController::pelatihDashboard();
} elseif ($uri === '/api/pelatih/siswa' && $method === 'GET') {
    PendaftaranController::pelatihSiswa();
} elseif ($uri === '/api/pelatih/pending' && $method === 'GET') {
    PendaftaranController::pelatihPending();
} elseif (preg_match('#^/api/pelatih/approval/(\d+)$#', $uri, $m) && $method === 'POST') {
    PendaftaranController::pelatihApproval((int)$m[1]);
} elseif ($uri === '/api/pelatih/absensi' && $method === 'GET') {
    AbsensiController::index();
} elseif ($uri === '/api/pelatih/absensi' && $method === 'POST') {
    AbsensiController::store();
} elseif ($uri === '/api/pelatih/nilai' && $method === 'GET') {
    NilaiController::index();
} elseif ($uri === '/api/pelatih/nilai' && $method === 'POST') {
    NilaiController::store();
} elseif ($uri === '/api/pelatih/nilai/pertemuan' && $method === 'GET') {
    NilaiController::getPertemuanNilai();
} elseif ($uri === '/api/pelatih/nilai/pertemuan' && $method === 'POST') {
    NilaiController::savePertemuanNilai();
} elseif ($uri === '/api/pelatih/monitoring-nilai' && $method === 'GET') {
    NilaiController::monitoringPelatih();
} elseif ($uri === '/api/pelatih/bobot-nilai' && $method === 'GET') {
    BobotNilaiController::indexPelatih();
} elseif ($uri === '/api/pelatih/bobot-nilai' && $method === 'POST') {
    BobotNilaiController::store();
} elseif ($uri === '/api/pelatih/izin' && $method === 'GET') {
    AbsensiController::izin();
} elseif ($uri === '/api/pelatih/profil' && $method === 'GET') {
    PelatihController::getProfil();
} elseif ($uri === '/api/pelatih/profil/password' && $method === 'PUT') {
    PelatihController::updatePassword();
}

// GURU PENDAMPING
elseif ($uri === '/api/pendamping/dashboard' && $method === 'GET') {
    DashboardController::pendampingDashboard();
} elseif ($uri === '/api/pendamping/izin' && $method === 'GET') {
    AbsensiController::guruIzin();
} elseif ($uri === '/api/pendamping/absensi' && $method === 'GET') {
    AbsensiController::pendampingIndex();
} elseif ($uri === '/api/pendamping/absensi' && $method === 'POST') {
    AbsensiController::pendampingStore();
} elseif ($uri === '/api/pendamping/nilai' && $method === 'GET') {
    NilaiController::pendampingIndex();
} elseif ($uri === '/api/pendamping/nilai' && $method === 'POST') {
    NilaiController::pendampingStore();
} elseif ($uri === '/api/pendamping/nilai/pertemuan' && $method === 'GET') {
    NilaiController::getPertemuanNilai();
} elseif ($uri === '/api/pendamping/nilai/pertemuan' && $method === 'POST') {
    NilaiController::savePertemuanNilai();
} elseif ($uri === '/api/pelatih/monitoring-nilai' && $method === 'GET') {
    NilaiController::monitoringPelatih();
} elseif ($uri === '/api/pendamping/profil' && $method === 'GET') {
    GuruController::getProfil();
} elseif ($uri === '/api/pendamping/profil/password' && $method === 'PUT') {
    GuruController::updatePassword();
}

// SISWA
elseif ($uri === '/api/siswa/dashboard' && $method === 'GET') {
    DashboardController::siswaDashboard();
} elseif ($uri === '/api/siswa/profil' && $method === 'GET') {
    SiswaController::getProfil();
} elseif ($uri === '/api/siswa/profil/password' && $method === 'PUT') {
    SiswaController::updatePassword();
} elseif ($uri === '/api/siswa/nilai' && $method === 'GET') {
    NilaiController::siswaIndex();
} elseif ($uri === '/api/siswa/kehadiran' && $method === 'GET') {
    AbsensiController::siswaKehadiran();
} elseif ($uri === '/api/siswa/ekskul' && $method === 'GET') {
    EkskulController::siswaEkskul();
} elseif ($uri === '/api/siswa/daftar' && $method === 'POST') {
    PendaftaranController::siswaDaftar();
} elseif (preg_match('#^/api/siswa/pendaftaran/(\d+)/batal$#', $uri, $m) && ($method === 'DELETE' || $method === 'POST')) {
    PendaftaranController::siswaBatalDaftar((int)$m[1]);
} elseif ($uri === '/api/siswa/izin' && $method === 'GET') {
    AbsensiController::siswaIzinDetail();
} elseif ($uri === '/api/siswa/izin' && $method === 'POST') {
    AbsensiController::siswaIzin();
} elseif ($uri === '/api/siswa/izin/ubah-status' && $method === 'PUT') {
    AbsensiController::updateIzinStatus();
} elseif ($uri === '/api/siswa/izin/batalkan' && $method === 'DELETE') {
    AbsensiController::cancelIzin();
} elseif (preg_match('#^/api/siswa/ekskul/(\d+)$#', $uri, $m) && $method === 'GET') {
    EkskulController::show((int)$m[1]);
}

// KEPALA SEKOLAH (PROFILE)
elseif ($uri === '/api/kepala_sekolah/profil' && $method === 'GET') {
    AuthController::me();
}

// 404
else {
    errorResponse('Endpoint tidak ditemukan', 404);
}
