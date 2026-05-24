<?php
/**
 * Pendaftaran Controller
 * Admin: list, approve, reject
 * Pelatih: siswa ekskul, pending, approval
 * Siswa: daftar ekskul
 */

class PendaftaranController {
    
    /**
     * GET /api/admin/pendaftaran?status=
     */
    public static function index(): void {
        requireRole('admin');
        $db = getDB();
        
        $period = getActivePeriod();
        $status = $_GET['status'] ?? null;
        
        $sql = "
            SELECT pe.id, s.nama_siswa, e.nama_ekskul, pe.status, pe.tanggal_daftar,
                   pe.surat_ijin, pe.alasan_keluar, pe.surat_keluar, k.nama_kelas
            FROM pendaftaran_ekskul pe
            LEFT JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            WHERE pe.tahun_ajaran = :tahun AND pe.semester = :sem
        ";
        
        $params = [':tahun' => $period['tahun_ajaran'], ':sem' => $period['semester']];
        
        if ($status) {
            $sql .= " AND pe.status = :status";
            $params[':status'] = $status;
        }
        
        $sql .= " ORDER BY pe.tanggal_daftar DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        successResponse($stmt->fetchAll());
    }
    
    /**
     * POST /api/admin/pendaftaran/{id}/approve
     */
    public static function approve(int $id): void {
        requireRole('admin');
        $db = getDB();
        
        $stmt = $db->prepare("UPDATE pendaftaran_ekskul SET status = 'approved' WHERE id = :id");
        $stmt->execute([':id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Pendaftaran tidak ditemukan', 404);
        }
        
        successResponse(null, 'Pendaftaran disetujui');
    }
    
    /**
     * POST /api/admin/pendaftaran/{id}/reject
     */
    public static function reject(int $id): void {
        requireRole('admin');
        $db = getDB();
        
        $stmt = $db->prepare("UPDATE pendaftaran_ekskul SET status = 'rejected' WHERE id = :id");
        $stmt->execute([':id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Pendaftaran tidak ditemukan', 404);
        }
        
        successResponse(null, 'Pendaftaran ditolak');
    }
    
    // ==================== PELATIH ====================
    
    /**
     * GET /api/pelatih/siswa
     */
    public static function pelatihSiswa(): void {
        $user = requireRole('pelatih');
        $db = getDB();
        
        // Ambil ekskul_id pelatih
        $stmt = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
        $stmt->execute([':id' => $user->ref_id]);
        $pelatih = $stmt->fetch();
        $ekskulId = $pelatih['ekskul_id'] ?? 0;
        
        $period = getActivePeriod();
        
        $stmt2 = $db->prepare("
            SELECT pe.id AS id_daftar, s.id AS id_siswa, s.nama_siswa, k.nama_kelas, pe.tanggal_daftar
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            WHERE pe.ekskul_id = :eid 
              AND pe.status = 'approved'
              AND pe.tahun_ajaran = :tahun 
              AND pe.semester = :sem
            ORDER BY s.nama_siswa ASC
        ");
        $stmt2->execute([
            ':eid' => $ekskulId,
            ':tahun' => $period['tahun_ajaran'],
            ':sem' => $period['semester']
        ]);
        
        successResponse($stmt2->fetchAll());
    }
    
    /**
     * GET /api/pelatih/pending
     */
    public static function pelatihPending(): void {
        $user = requireRole('pelatih');
        $db = getDB();
        
        $stmt = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
        $stmt->execute([':id' => $user->ref_id]);
        $pelatih = $stmt->fetch();
        $ekskulId = $pelatih['ekskul_id'] ?? 0;
        
        $period = getActivePeriod();
        
        $stmt2 = $db->prepare("
            SELECT pe.id AS id_daftar, s.nama_siswa, k.nama_kelas, pe.tanggal_daftar
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            JOIN kelas k ON s.kelas_id = k.id
            WHERE pe.ekskul_id = :eid 
              AND pe.status = 'pending'
              AND pe.tahun_ajaran = :tahun 
              AND pe.semester = :sem
            ORDER BY pe.tanggal_daftar ASC
        ");
        $stmt2->execute([
            ':eid' => $ekskulId,
            ':tahun' => $period['tahun_ajaran'],
            ':sem' => $period['semester']
        ]);
        
        successResponse($stmt2->fetchAll());
    }
    
    /**
     * POST /api/pelatih/approval/{id}
     * Body: { "status": "approved" | "rejected" }
     */
    public static function pelatihApproval(int $id): void {
        requireRole('pelatih');
        $data = getRequestBody();
        
        $status = $data['status'] ?? '';
        if (!in_array($status, ['approved', 'rejected'])) {
            errorResponse('Status harus approved atau rejected', 400);
        }
        
        $db = getDB();
        $stmt = $db->prepare("UPDATE pendaftaran_ekskul SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $status, ':id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Pendaftaran tidak ditemukan', 404);
        }
        
        $msg = $status === 'approved' ? 'Pendaftaran disetujui' : 'Pendaftaran ditolak';
        successResponse(null, $msg);
    }
    
    // ==================== SISWA ====================
    
    /**
     * POST /api/siswa/daftar
     * Body: FormData { "ekskul_id": 1, "surat_ijin": File }
     */
    public static function siswaDaftar(): void {
        $user = requireRole('siswa');
        $db = getDB();
        
        $ekskulId = $_POST['ekskul_id'] ?? null;
        $siswaId  = $user->ref_id;
        
        if (!$ekskulId) {
            errorResponse('ekskul_id wajib diisi', 400);
        }

        if (empty($_FILES['surat_ijin'])) {
            errorResponse('Surat izin orang tua (foto) wajib diunggah', 400);
        }
        
        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];
        $sem   = $period['semester'];

        // Rule: Class 9 (IX) students are NOT allowed to join in Semester 2 (Genap)
        $stmtSiswa = $db->prepare("SELECT s.kelas_id, k.nama_kelas, s.status FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id WHERE s.id = :sid");
        $stmtSiswa->execute([':sid' => $siswaId]);
        $siswaData = $stmtSiswa->fetch();
        
        if ($siswaData['status'] === 'alumni') {
            errorResponse('Anda tidak dapat mendaftar ekskul baru karena status Anda telah lulus (Alumni).', 403);
        }

        $currKelas = $siswaData['nama_kelas'];
        if ($sem === 'Genap' && $currKelas && strpos($currKelas, 'IX') === 0) {
            errorResponse("Siswa kelas IX tidak diperbolehkan mengikuti ekstrakurikuler pada Semester 2.", 403);
        }

        // Cek max 4 ekskul approved dalam periode ini
        $stmt = $db->prepare("SELECT COUNT(*) FROM pendaftaran_ekskul WHERE siswa_id = :sid AND status = 'approved' AND tahun_ajaran = :tahun AND semester = :sem");
        $stmt->execute([':sid' => $siswaId, ':tahun' => $tahun, ':sem' => $sem]);
        if ($stmt->fetchColumn() >= 4) {
            errorResponse("Maksimal 4 ekstrakurikuler yang disetujui pada periode $tahun $sem", 400);
        }
        
        // Cek duplikat dalam periode ini
        $stmt2 = $db->prepare("SELECT id FROM pendaftaran_ekskul WHERE siswa_id = :sid AND ekskul_id = :eid AND tahun_ajaran = :tahun AND semester = :sem");
        $stmt2->execute([':sid' => $siswaId, ':eid' => $ekskulId, ':tahun' => $tahun, ':sem' => $sem]);
        if ($stmt2->fetch()) {
            errorResponse('Kamu sudah mendaftar ekstrakurikuler ini di periode ini', 409);
        }

        // Handle File Upload
        require_once 'helpers/UploadHelper.php';
        $uploadPath = UploadHelper::upload($_FILES['surat_ijin'], 'public/uploads/registration');
        if (!$uploadPath) {
            errorResponse('Gagal mengunggah surat izin. Pastikan format file adalah JPG, PNG, atau PDF.', 400);
        }
        
        // Insert pending dengan info periode dan file path
        try {
            $stmt3 = $db->prepare("INSERT INTO pendaftaran_ekskul (siswa_id, ekskul_id, status, surat_ijin, tahun_ajaran, semester) VALUES (:sid, :eid, 'pending', :file, :tahun, :sem)");
            $stmt3->execute([
                ':sid'   => $siswaId, 
                ':eid'   => $ekskulId, 
                ':file'  => $uploadPath,
                ':tahun' => $tahun, 
                ':sem'   => $sem
            ]);
            
            successResponse(null, 'Pendaftaran berhasil, menunggu persetujuan Admin', 201);
        } catch (PDOException $e) {
            // Silently log or return the error for debugging
            error_log("Registration SQL Error: " . $e->getMessage());
            errorResponse("Gagal menyimpan pendaftaran: " . $e->getMessage(), 500);
        }
    }
    /**
     * POST /api/parent/child/withdrawal
     * Parent requests to withdraw their child from an extracurricular
     */
    public static function requestWithdrawal(): void {
        $user = requireRole('orang_tua');
        $db = getDB();
        
        $pendaftaranId = $_POST['pendaftaran_id'] ?? null;
        $alasan        = trim($_POST['alasan_keluar'] ?? '');
        
        if (!$pendaftaranId || empty($alasan)) {
            errorResponse('ID pendaftaran dan alasan pengunduran diri wajib diisi', 400);
        }

        // Validate pendaftaran belongs to child of this parent
        $stmt = $db->prepare("
            SELECT pe.id FROM pendaftaran_ekskul pe
            JOIN orang_tua_siswa ots ON pe.siswa_id = ots.siswa_id
            WHERE pe.id = ? AND ots.parent_user_id = ?
        ");
        $stmt->execute([$pendaftaranId, $user->sub]);
        if (!$stmt->fetch()) {
            errorResponse('Akses ditolak atau pendaftaran tidak valid', 403);
        }

        if (empty($_FILES['surat_keluar'])) {
            errorResponse('Surat pemberhentian/keterangan wajib diunggah', 400);
        }

        // Handle File Upload
        require_once 'helpers/UploadHelper.php';
        $uploadPath = UploadHelper::upload($_FILES['surat_keluar'], 'public/uploads/withdrawals');
        if (!$uploadPath) {
            errorResponse('Gagal mengunggah surat keterangan. Format harus JPG, PNG, atau PDF.', 400);
        }

        $stmt = $db->prepare("
            UPDATE pendaftaran_ekskul 
            SET status = 'pending_withdrawal', 
                alasan_keluar = :alasan, 
                surat_keluar = :file 
            WHERE id = :id
        ");
        $stmt->execute([
            ':alasan' => $alasan,
            ':file'   => $uploadPath,
            ':id'     => $pendaftaranId
        ]);

        successResponse(null, 'Permohonan pengunduran diri berhasil dikirim dan menunggu persetujuan Admin');
    }

    /**
     * POST /api/admin/pendaftaran/{id}/approve-withdrawal
     */
    public static function approveWithdrawal(int $id): void {
        requireRole('admin');
        $db = getDB();
        
        $stmt = $db->prepare("UPDATE pendaftaran_ekskul SET status = 'withdrawn' WHERE id = :id AND status = 'pending_withdrawal'");
        $stmt->execute([':id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Permohonan tidak ditemukan atau sudah diproses', 404);
        }
        
        successResponse(null, 'Pengunduran diri disetujui');
    }

    /**
     * POST /api/admin/pendaftaran/{id}/reject-withdrawal
     */
    public static function rejectWithdrawal(int $id): void {
        requireRole('admin');
        $db = getDB();
        
        // Return to approved status if withdrawal is rejected
        $stmt = $db->prepare("UPDATE pendaftaran_ekskul SET status = 'approved' WHERE id = :id AND status = 'pending_withdrawal'");
        $stmt->execute([':id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Permohonan tidak ditemukan atau sudah diproses', 404);
        }
        
        successResponse(null, 'Pengunduran diri ditolak, status siswa kembali Aktif');
    }
}
