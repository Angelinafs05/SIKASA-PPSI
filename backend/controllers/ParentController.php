<?php
require_once __DIR__ . '/../config/database.php';

class ParentController
{

    /**
     * Get list of children for the logged in parent
     */
    public static function getChildren()
    {
        $user = requireRole('orang_tua');
        $db = getDB();

        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];

        try {
            $stmt = $db->prepare("
                SELECT s.id, s.no_induk, s.nama_siswa, 
                       COALESCE(rk_k.nama_kelas, k.nama_kelas) as nama_kelas, 
                       s.alamat
                FROM orang_tua_siswa ots
                JOIN siswa s ON ots.siswa_id = s.id
                LEFT JOIN riwayat_kelas rk ON rk.siswa_id = s.id AND rk.tahun_ajaran = ?
                LEFT JOIN kelas rk_k ON rk.kelas_id = rk_k.id
                LEFT JOIN kelas k ON s.kelas_id = k.id
                WHERE ots.parent_user_id = ?
            ");
            $stmt->execute([$tahun, $user->sub]);
            $children = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $children]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Get attendance for a specific child
     */
    public static function getChildAbsensi(int $siswa_id)
    {
        $user = requireRole('orang_tua');
        $db = getDB();

        if (!self::isChildOfParent($db, $user->sub, $siswa_id)) {
            errorResponse('Akses ditolak. Siswa bukan anak Anda.', 403);
            return;
        }

        try {
            // Fix: Join directly to absensi using id_siswa and id_pelatih
            $stmt = $db->prepare("
                SELECT a.tanggal, a.status, a.keterangan, e.nama_ekskul, p.nama_pelatih
                FROM absensi a
                JOIN pelatih p ON a.id_pelatih = p.id
                JOIN ekstrakurikuler e ON p.ekskul_id = e.id
                WHERE a.id_siswa = ?
                ORDER BY a.tanggal DESC
            ");
            $stmt->execute([$siswa_id]);
            successResponse($stmt->fetchAll());
        } catch (PDOException $e) {
            errorResponse('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get grades for a specific child
     */
    public static function getChildNilai(int $siswa_id)
    {
        $user = requireRole('orang_tua');
        $db = getDB();

        if (!self::isChildOfParent($db, $user->sub, $siswa_id)) {
            errorResponse('Akses ditolak. Siswa bukan anak Anda.', 403);
            return;
        }

        try {
            // Fix: Use correct columns (tahun, semester, keterangan as catatan) and add grade calculation
            $stmt = $db->prepare("
                SELECT 
                    n.nilai, 
                    n.keterangan as catatan, 
                    n.semester, 
                    n.tahun as tahun_ajaran,
                    e.nama_ekskul, 
                    p.nama_pelatih,
                    CASE 
                        WHEN n.nilai >= 80 THEN 'A'
                        WHEN n.nilai >= 70 THEN 'B'
                        WHEN n.nilai >= 60 THEN 'C'
                        ELSE 'D'
                    END as grade
                FROM nilai_ekskul n
                JOIN ekstrakurikuler e ON n.ekskul_id = e.id
                LEFT JOIN pelatih p ON n.pelatih_id = p.id
                WHERE n.siswa_id = ?
                ORDER BY n.tahun DESC, n.semester DESC
            ");
            $stmt->execute([$siswa_id]);
            successResponse($stmt->fetchAll());
        } catch (PDOException $e) {
            errorResponse('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get competitions for a specific child
     */
    public static function getChildLomba(int $siswa_id)
    {
        $user = requireRole('orang_tua');
        $db = getDB();

        if (!self::isChildOfParent($db, $user->sub, $siswa_id)) {
            errorResponse('Akses ditolak. Siswa bukan anak Anda.', 403);
            return;
        }

        try {
            // Fix: Join peserta_lomba with lomba table
            $stmt = $db->prepare("
                SELECT l.*, 
                       pl.id as peserta_id,
                       pl.status_izin, pl.alasan_tolak, pl.surat_balasan,
                       pl.parent_approval_status, pl.parent_approval_reason, pl.parent_approval_file, pl.parent_approval_date
                FROM peserta_lomba pl
                JOIN lomba l ON pl.lomba_id = l.id
                WHERE pl.siswa_id = ?
                ORDER BY l.tanggal_pelaksanaan DESC
            ");
            $stmt->execute([$siswa_id]);
            successResponse($stmt->fetchAll());
        } catch (PDOException $e) {
            errorResponse('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get enrolled extracurriculars for a specific child
     */
    public static function getChildEkskul(int $siswa_id)
    {
        $user = requireRole('orang_tua');
        $db = getDB();

        if (!self::isChildOfParent($db, $user->sub, $siswa_id)) {
            errorResponse('Akses ditolak. Siswa bukan anak Anda.', 403);
            return;
        }

        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];
        $sem = $period['semester'];

        try {
            $stmt = $db->prepare("
                SELECT pe.id as pendaftaran_id, e.nama_ekskul, e.hari, e.jam, e.tempat, p.nama_pelatih
                FROM pendaftaran_ekskul pe
                JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
                LEFT JOIN (
                    SELECT p_sub.id, p_sub.nama_pelatih, p_sub.guru_id, e_sub.nama_ekskul
                    FROM pelatih p_sub
                    JOIN ekstrakurikuler e_sub ON p_sub.ekskul_id = e_sub.id
                ) p ON p.nama_ekskul = e.nama_ekskul
                WHERE pe.siswa_id = ? AND pe.status = 'approved'
                  AND pe.tahun_ajaran = ? AND pe.semester = ?
                ORDER BY FIELD(e.hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')
            ");
            $stmt->execute([$siswa_id, $tahun, $sem]);
            successResponse($stmt->fetchAll());
        } catch (PDOException $e) {
            errorResponse('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Helper: Check if siswa_id is child of parent_user_id
     */
    private static function isChildOfParent($db, $parent_id, $siswa_id)
    {
        $stmt = $db->prepare("SELECT 1 FROM orang_tua_siswa WHERE parent_user_id = ? AND siswa_id = ?");
        $stmt->execute([$parent_id, $siswa_id]);
        return $stmt->fetch() !== false;
    }

    /**
     * Get logged-in parent profile
     */
    public static function getProfile()
    {
        $user = requireRole('orang_tua');
        $db = getDB();

        try {
            $stmt = $db->prepare("SELECT id, nama, username, role FROM users WHERE id = ?");
            $stmt->execute([$user->sub]);
            $profile = $stmt->fetch();

            if (!$profile) {
                errorResponse('Profil tidak ditemukan', 404);
                return;
            }

            successResponse($profile);
        } catch (PDOException $e) {
            errorResponse('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update logged-in parent profile
     */
    public static function updateProfile()
    {
        $user = requireRole('orang_tua');
        $db = getDB();
        $input = json_decode(file_get_contents('php://input'), true);

        $nama = $input['nama'] ?? '';
        $username = $input['username'] ?? '';
        $newPassword = $input['password'] ?? '';

        if (!$nama || !$username) {
            errorResponse('Nama dan Username wajib diisi', 400);
            return;
        }

        try {
            // Check username duplicate (exclude current ID)
            $stmt = $db->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
            $stmt->execute([$username, $user->sub]);
            if ($stmt->fetch()) {
                errorResponse('Username sudah digunakan oleh akun lain', 400);
                return;
            }

            if ($newPassword) {
                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                $stmt = $db->prepare("UPDATE users SET nama = ?, username = ?, password = ? WHERE id = ?");
                $stmt->execute([$nama, $username, $hashedPassword, $user->sub]);
            } else {
                $stmt = $db->prepare("UPDATE users SET nama = ?, username = ? WHERE id = ?");
                $stmt->execute([$nama, $username, $user->sub]);
            }

            successResponse(null, 'Profil berhasil diperbarui');
        } catch (PDOException $e) {
            errorResponse('Database error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Parent approve/reject competition participation
     */
    public static function approveLomba()
    {
        $user = requireRole('orang_tua');
        $db = getDB();

        $peserta_id = $_POST['peserta_id'] ?? null;
        $status_approval = $_POST['status_approval'] ?? '';
        $reason = $_POST['reason'] ?? null;

        if (!$peserta_id || !in_array($status_approval, ['Disetujui', 'Ditolak'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Data tidak lengkap atau tidak valid']);
            return;
        }

        if ($status_approval === 'Disetujui' && (!isset($_FILES['approval_file']) || $_FILES['approval_file']['error'] !== UPLOAD_ERR_OK)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Upload surat persetujuan PDF/Gambar wajib saat menyetujui lomba']);
            return;
        }

        if ($status_approval === 'Ditolak' && empty(trim($reason))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Alasan penolakan wajib diisi']);
            return;
        }

        try {
            // Verify this peserta belongs to a child of this parent
            $stmt = $db->prepare("
                SELECT pl.id, pl.siswa_id
                FROM peserta_lomba pl
                WHERE pl.id = ?
            ");
            $stmt->execute([$peserta_id]);
            $peserta = $stmt->fetch();

            if (!$peserta || !self::isChildOfParent($db, $user->sub, $peserta['siswa_id'])) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
                return;
            }

            // Handle file upload
            $approval_file = null;
            if (isset($_FILES['approval_file']) && $_FILES['approval_file']['error'] === UPLOAD_ERR_OK) {
                try {
                    require_once __DIR__ . '/../helpers/UploadHelper.php';
                    $approval_file = UploadHelper::upload($_FILES['approval_file'], 'persetujuan_lomba_orang_tua');
                } catch (Exception $e) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                    return;
                }
            }

            // Update peserta_lomba with parent approval
            if ($approval_file) {
                $updateStmt = $db->prepare("UPDATE peserta_lomba SET parent_approval_status = ?, parent_approval_reason = ?, parent_approval_file = ?, parent_approval_date = NOW() WHERE id = ?");
                $updateStmt->execute([$status_approval, $reason, $approval_file, $peserta_id]);
            } else {
                $updateStmt = $db->prepare("UPDATE peserta_lomba SET parent_approval_status = ?, parent_approval_reason = ?, parent_approval_date = NOW() WHERE id = ?");
                $updateStmt->execute([$status_approval, $reason, $peserta_id]);
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Persetujuan berhasil disimpan']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }
}
