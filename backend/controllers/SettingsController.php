<?php
/**
 * Settings Controller - Manage Academic Periods (Admin Only)
 */

class SettingsController {

    /**
     * GET /api/admin/settings
     */
    public static function index(): void {
        requireRole('admin');
        $db = getDB();
        $stmt = $db->query("SELECT kunci, nilai FROM pengaturan");
        $all = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        successResponse([
            'tahun_ajaran' => $all['tahun_ajaran_aktif'] ?? '2024/2025',
            'semester'     => $all['semester_aktif'] ?? 'Ganjil'
        ]);
    }

    /**
     * POST /api/admin/settings
     */
    public static function update(): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();

        $tahun = trim($data['tahun_ajaran'] ?? '');
        $semester = trim($data['semester'] ?? '');

        if (empty($tahun) || empty($semester)) {
            $received = json_encode($data);
            errorResponse("Data tidak lengkap. Tahun: '$tahun', Semester: '$semester'. Raw: $received", 400);
        }

        try {
            $db->beginTransaction();

            $stmt1 = $db->prepare("INSERT INTO pengaturan (kunci, nilai) VALUES ('tahun_ajaran_aktif', :v1) ON DUPLICATE KEY UPDATE nilai = :v2");
            $stmt1->execute([':v1' => $tahun, ':v2' => $tahun]);

            $stmt2 = $db->prepare("INSERT INTO pengaturan (kunci, nilai) VALUES ('semester_aktif', :v1) ON DUPLICATE KEY UPDATE nilai = :v2");
            $stmt2->execute([':v1' => $semester, ':v2' => $semester]);

            $db->commit();
            successResponse(null, 'Pengaturan akademik berhasil diperbarui');
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse('Gagal memperbarui pengaturan: ' . $e->getMessage(), 500);
        }
    }
}
?>
