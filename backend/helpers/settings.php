<?php
/**
 * Settings Helper - Get Active Academic Period
 */

function getActivePeriod(): array {
    $db = getDB();
    $stmt = $db->query("SELECT kunci, nilai FROM pengaturan WHERE kunci IN ('tahun_ajaran_aktif', 'semester_aktif')");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $tahun = $settings['tahun_ajaran_aktif'] ?? '2024/2025';
    $semester = $settings['semester_aktif'] ?? 'Ganjil';

    // Override untuk sesi tampilan Admin jika header dikirim
    if (isset($_SERVER['HTTP_X_ADMIN_VIEW_YEAR']) && !empty($_SERVER['HTTP_X_ADMIN_VIEW_YEAR'])) {
        $tahun = $_SERVER['HTTP_X_ADMIN_VIEW_YEAR'];
    }
    if (isset($_SERVER['HTTP_X_ADMIN_VIEW_SEMESTER']) && !empty($_SERVER['HTTP_X_ADMIN_VIEW_SEMESTER'])) {
        $semester = $_SERVER['HTTP_X_ADMIN_VIEW_SEMESTER'];
    }

    return [
        'tahun_ajaran' => $tahun,
        'semester'     => $semester
    ];
}
?>
