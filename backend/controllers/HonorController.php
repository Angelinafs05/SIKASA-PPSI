<?php
/**
 * Honor Controller
 */

class HonorController {
    
    /**
     * GET /api/admin/honor
     */
    public static function index(): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        
        $period = getActivePeriod();
        $stmt = $db->prepare("
            SELECT h.*, p.nama_pelatih, e.nama_ekskul, g.nama_guru AS nama_titip_guru
            FROM riwayat_honor h
            LEFT JOIN pelatih p ON h.pelatih_id = p.id
            LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id
            LEFT JOIN guru_pendamping g ON h.titip_guru_id = g.id
            WHERE h.tahun_ajaran = :t AND h.semester = :s
            ORDER BY 
                FIELD(h.bulan, 'Desember', 'November', 'Oktober', 'September', 'Agustus', 'Juli', 'Juni', 'Mei', 'April', 'Maret', 'Februari', 'Januari') DESC, 
                h.created_at DESC
        ");
        $stmt->execute([':t' => $period['tahun_ajaran'], ':s' => $period['semester']]);
        
        successResponse($stmt->fetchAll());
    }

    /**
     * POST /api/admin/honor
     * Handle multipart/form-data
     */
    public static function store(): void {
        requireRole('admin');
        $db = getDB();
        
        // Data comes from $_POST since it's multipart/form-data
        $pelatihId = $_POST['pelatih_id'] ?? 0;
        $bulan = $_POST['bulan'] ?? '';
        $tahun = $_POST['tahun'] ?? date('Y');
        $nominal = $_POST['nominal'] ?? 0;
        $tanggalCair = $_POST['tanggal_cair'] ?? date('Y-m-d');
        $metode = $_POST['metode_penyerahan'] ?? 'Tunai';
        $titipGuruId = $_POST['titip_guru_id'] ?? null;
        if (empty($titipGuruId)) {
            $titipGuruId = null;
        }
        $keterangan = $_POST['keterangan'] ?? '';
        $status = $_POST['status'] ?? 'sudah dibayar';
        
        if (empty($pelatihId) || empty($bulan)) {
            errorResponse('Data pelatih dan bulan wajib diisi', 400);
        }
        
        // Handle file upload
        $buktiTransfer = null;
        if (isset($_FILES['bukti_transfer']) && $_FILES['bukti_transfer']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/honor_proofs/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $fileExtension = pathinfo($_FILES['bukti_transfer']['name'], PATHINFO_EXTENSION);
            $fileName = uniqid('honor_') . '.' . $fileExtension;
            $destination = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['bukti_transfer']['tmp_name'], $destination)) {
                $buktiTransfer = 'uploads/honor_proofs/' . $fileName;
            } else {
                errorResponse('Gagal mengupload bukti transfer', 500);
            }
        }
        
        $period = getActivePeriod();
        
        try {
            $stmt = $db->prepare("
                INSERT INTO riwayat_honor (pelatih_id, bulan, tahun, tahun_ajaran, semester, nominal, tanggal_cair, metode_penyerahan, titip_guru_id, bukti_transfer, keterangan, status)
                VALUES (:pelatih_id, :bulan, :tahun, :tahun_ajaran, :semester, :nominal, :tanggal_cair, :metode, :titip_guru, :bukti, :keterangan, :status)
            ");
            
            $stmt->execute([
                ':pelatih_id' => $pelatihId,
                ':bulan' => $bulan,
                ':tahun' => $tahun,
                ':tahun_ajaran' => $period['tahun_ajaran'],
                ':semester' => $period['semester'],
                ':nominal' => $nominal,
                ':tanggal_cair' => $tanggalCair,
                ':metode' => $metode,
                ':titip_guru' => $titipGuruId,
                ':bukti' => $buktiTransfer,
                ':keterangan' => $keterangan,
                ':status' => $status
            ]);
            
            successResponse(['id' => $db->lastInsertId()], 'Data honor berhasil disimpan', 201);
            
        } catch (PDOException $e) {
            // Error 1062 is duplicate entry (pelatih_id + bulan + tahun)
            if ($e->errorInfo[1] == 1062) {
                errorResponse('Data honor pelatih untuk bulan dan tahun ini sudah ada', 400);
            }
            errorResponse('Gagal menyimpan data honor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/admin/honor/{id}
     */
    public static function destroy(int $id): void {
        requireRole('admin');
        $db = getDB();
        
        // Ambil data dulu utk cek bukti file
        $stmtCheck = $db->prepare("SELECT bukti_transfer FROM riwayat_honor WHERE id = :id");
        $stmtCheck->execute([':id' => $id]);
        $data = $stmtCheck->fetch();
        
        if (!$data) {
            errorResponse('Data honor tidak ditemukan', 404);
        }
        
        $stmt = $db->prepare("DELETE FROM riwayat_honor WHERE id = :id");
        $stmt->execute([':id' => $id]);
        
        // Hapus file fisik
        if (!empty($data['bukti_transfer'])) {
            $filePath = __DIR__ . '/../' . $data['bukti_transfer'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }
        
        successResponse(null, 'Data honor berhasil dihapus');
    }
    
    /**
     * PUT /api/admin/honor/{id}/status
     */
    public static function updateStatus(int $id): void {
        requireRole('admin');
        $db = getDB();
        $data = getRequestBody();
        $status = $data['status'] ?? 'sudah dibayar';
        
        $stmt = $db->prepare("UPDATE riwayat_honor SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $status, ':id' => $id]);
        
        successResponse(null, 'Status honor berhasil diperbarui');
    }
    
    /**
     * GET /api/pelatih/honor
     */
    public static function pelatihHonor(): void {
        $user = requireRole('pelatih');
        $db = getDB();
        
        $pelatihId = $user->ref_id;
        
        $period = getActivePeriod();
        $stmt = $db->prepare("
            SELECT h.*, g.nama_guru AS nama_titip_guru
            FROM riwayat_honor h
            LEFT JOIN guru_pendamping g ON h.titip_guru_id = g.id
            WHERE h.pelatih_id = :pelatih_id AND h.tahun_ajaran = :t AND h.semester = :s
            ORDER BY 
                FIELD(h.bulan, 'Desember', 'November', 'Oktober', 'September', 'Agustus', 'Juli', 'Juni', 'Mei', 'April', 'Maret', 'Februari', 'Januari') DESC
        ");
        
        $stmt->execute([
            ':pelatih_id' => $pelatihId,
            ':t' => $period['tahun_ajaran'],
            ':s' => $period['semester']
        ]);
        successResponse($stmt->fetchAll());
    }

    /**
     * GET /api/admin/honor/summary
     */
    public static function summary(): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        
        $period = getActivePeriod();
        $stmt = $db->prepare("
            SELECT 
                bulan, 
                tahun, 
                SUM(nominal) as total_nominal, 
                COUNT(*) as jumlah_pelatih
            FROM riwayat_honor
            WHERE tahun_ajaran = :t AND semester = :s
            GROUP BY tahun, bulan
            ORDER BY tahun DESC, 
                FIELD(bulan, 'Desember', 'November', 'Oktober', 'September', 'Agustus', 'Juli', 'Juni', 'Mei', 'April', 'Maret', 'Februari', 'Januari') DESC
        ");
        $stmt->execute([':t' => $period['tahun_ajaran'], ':s' => $period['semester']]);
        
        successResponse($stmt->fetchAll());
    }
}
