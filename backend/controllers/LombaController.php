<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/UploadHelper.php';

class LombaController
{

    // --- ADMIN ENDPOINTS ---

    public static function createLomba()
    {
        requireRole('admin');
        $db = getDB();

        $nama_lomba = $_POST['nama_lomba'] ?? '';
        $tanggal_pelaksanaan = $_POST['tanggal_pelaksanaan'] ?? '';
        $tempat = $_POST['tempat'] ?? '';
        $deskripsi = $_POST['deskripsi'] ?? '';
        $tahun_ajaran = $_POST['tahun_ajaran'] ?? '';
        $semester = $_POST['semester'] ?? '';
        $tanggal_selesai = $_POST['tanggal_selesai'] ?? null;

        if (!$nama_lomba || !$tanggal_pelaksanaan || !$tempat || !$tahun_ajaran || !$semester) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Semua kolom wajib diisi']);
            return;
        }

        $surat_edaran = null;
        if (isset($_FILES['surat_edaran']) && $_FILES['surat_edaran']['error'] === UPLOAD_ERR_OK) {
            try {
                $surat_edaran = UploadHelper::upload($_FILES['surat_edaran'], 'lomba');
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                return;
            }
        }

        try {
            $stmt = $db->prepare("INSERT INTO lomba (nama_lomba, tanggal_pelaksanaan, tanggal_selesai, tempat, deskripsi, surat_edaran, tahun_ajaran, semester) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$nama_lomba, $tanggal_pelaksanaan, $tanggal_selesai, $tempat, $deskripsi, $surat_edaran, $tahun_ajaran, $semester]);

            echo json_encode(['success' => true, 'message' => 'Lomba berhasil ditambahkan', 'id' => $db->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public static function getAllLomba()
    {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        try {
            $tahun_ajaran = $_GET['tahun_ajaran'] ?? '';
            $semester = $_GET['semester'] ?? '';

            $query = "SELECT l.*, 
                      COUNT(p.id) as total_peserta,
                      SUM(CASE WHEN p.status_izin = 'Disetujui' THEN 1 ELSE 0 END) as total_disetujui,
                      SUM(CASE WHEN p.status_izin = 'Ditolak' THEN 1 ELSE 0 END) as total_ditolak
                      FROM lomba l
                      LEFT JOIN peserta_lomba p ON l.id = p.lomba_id";

            $params = [];
            $conditions = [];
            if ($tahun_ajaran) {
                $conditions[] = "l.tahun_ajaran = ?";
                $params[] = $tahun_ajaran;
            }
            if ($semester) {
                $conditions[] = "l.semester = ?";
                $params[] = $semester;
            }

            if (!empty($conditions)) {
                $query .= " WHERE " . implode(' AND ', $conditions);
            }

            $query .= " GROUP BY l.id ORDER BY l.tanggal_pelaksanaan DESC";

            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $lomba = $stmt->fetchAll();

            // Fetch participants for each lomba
            foreach ($lomba as &$l) {
                $stmtPeserta = $db->prepare("SELECT p.id as peserta_id, p.siswa_id, s.nama_siswa, k.nama_kelas as kelas, p.status_izin, p.alasan_tolak, p.surat_balasan, p.parent_approval_status, p.parent_approval_reason, p.parent_approval_file, p.parent_approval_date, p.created_at
                                          FROM peserta_lomba p
                                          JOIN siswa s ON p.siswa_id = s.id
                                          LEFT JOIN kelas k ON s.kelas_id = k.id
                                          WHERE p.lomba_id = ?");
                $stmtPeserta->execute([$l['id']]);
                $l['peserta'] = $stmtPeserta->fetchAll();
            }

            echo json_encode(['success' => true, 'data' => $lomba]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public static function addPeserta()
    {
        requireRole('admin');
        $db = getDB();
        $input = json_decode(file_get_contents('php://input'), true);

        $lomba_id = $input['lomba_id'] ?? null;
        $siswa_ids = $input['siswa_ids'] ?? []; // Array of student IDs

        if (!$lomba_id || empty($siswa_ids)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Data lomba_id dan siswa_ids wajib diisi']);
            return;
        }

        try {
            $db->beginTransaction();
            $stmt = $db->prepare("INSERT INTO peserta_lomba (lomba_id, siswa_id) VALUES (?, ?)");

            $added = 0;
            foreach ($siswa_ids as $siswa_id) {
                // Check if already exists
                $check = $db->prepare("SELECT id FROM peserta_lomba WHERE lomba_id = ? AND siswa_id = ?");
                $check->execute([$lomba_id, $siswa_id]);
                if (!$check->fetch()) {
                    $stmt->execute([$lomba_id, $siswa_id]);
                    $added++;
                }
            }

            $db->commit();
            echo json_encode(['success' => true, 'message' => "$added peserta berhasil ditambahkan"]);
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public static function removePeserta($peserta_id)
    {
        requireRole('admin');
        $db = getDB();
        try {
            $stmt = $db->prepare("DELETE FROM peserta_lomba WHERE id = ?");
            $stmt->execute([$peserta_id]);
            echo json_encode(['success' => true, 'message' => 'Peserta berhasil dihapus']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public static function deleteLomba(int $id)
    {
        requireRole('admin');
        $db = getDB();
        try {
            $stmt = $db->prepare("SELECT surat_edaran FROM lomba WHERE id = ?");
            $stmt->execute([$id]);
            $lomba = $stmt->fetch();

            if ($lomba && $lomba['surat_edaran']) {
                $filePath = __DIR__ . '/../../' . ltrim($lomba['surat_edaran'], '/');
                if (file_exists($filePath)) {
                    @unlink($filePath);
                }
            }

            $stmt = $db->prepare("DELETE FROM lomba WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Data lomba dan perwakilan siswa berhasil dihapus']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    // --- SISWA ENDPOINTS ---

    public static function getLombaSiswa()
    {
        $user = requireRole('siswa');
        $siswa_id = $user->ref_id;
        $db = getDB();
        try {
            $stmt = $db->prepare("SELECT l.*, p.id as peserta_id, p.status_izin, p.alasan_tolak, p.surat_balasan,
                                  p.parent_approval_status, p.parent_approval_reason, p.parent_approval_file, p.parent_approval_date
                                  FROM lomba l
                                  JOIN peserta_lomba p ON l.id = p.lomba_id
                                  WHERE p.siswa_id = ?
                                  ORDER BY l.tanggal_pelaksanaan DESC");
            $stmt->execute([$siswa_id]);
            $data = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $data]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public static function konfirmasiSiswa()
    {
        requireRole('siswa');
        $peserta_id = $_POST['peserta_id'] ?? null;
        if (!$peserta_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Peserta ID diperlukan']);
            return;
        }

        $db = getDB();

        $status_izin = $_POST['status_izin'] ?? '';
        $alasan_tolak = $_POST['alasan_tolak'] ?? null;

        if (!in_array($status_izin, ['Disetujui', 'Ditolak'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Status izin tidak valid']);
            return;
        }

        $surat_balasan = null;
        if (isset($_FILES['surat_balasan']) && $_FILES['surat_balasan']['error'] === UPLOAD_ERR_OK) {
            try {
                $surat_balasan = UploadHelper::upload($_FILES['surat_balasan'], 'persetujuan');
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                return;
            }
        }

        try {
            if ($surat_balasan) {
                $stmt = $db->prepare("UPDATE peserta_lomba SET status_izin = ?, alasan_tolak = ?, surat_balasan = ? WHERE id = ?");
                $stmt->execute([$status_izin, $alasan_tolak, $surat_balasan, $peserta_id]);
            } else {
                $stmt = $db->prepare("UPDATE peserta_lomba SET status_izin = ?, alasan_tolak = ? WHERE id = ?");
                $stmt->execute([$status_izin, $alasan_tolak, $peserta_id]);
            }

            echo json_encode(['success' => true, 'message' => 'Konfirmasi berhasil disimpan']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public static function updateHasil(int $id)
    {
        requireRole('admin');
        $db = getDB();

        $prestasi = $_POST['prestasi'] ?? null;

        // Handle file uploads
        $foto_hasil = null;
        if (isset($_FILES['foto_hasil']) && $_FILES['foto_hasil']['error'] === UPLOAD_ERR_OK) {
            try {
                // Determine target directory
                $targetDir = 'uploads/lomba_hasil';
                if (!is_dir(__DIR__ . '/../../' . $targetDir)) {
                    mkdir(__DIR__ . '/../../' . $targetDir, 0777, true);
                }

                $ext = strtolower(pathinfo($_FILES['foto_hasil']['name'], PATHINFO_EXTENSION));
                $newName = 'foto_' . uniqid() . '.' . $ext;
                $targetPath = $targetDir . '/' . $newName;

                if (move_uploaded_file($_FILES['foto_hasil']['tmp_name'], __DIR__ . '/../../' . $targetPath)) {
                    $foto_hasil = $targetPath;
                }
            } catch (Exception $e) {
                // Log error but continue
                error_log("Error uploading foto_hasil: " . $e->getMessage());
            }
        }

        $sertifikat_hasil = null;
        if (isset($_FILES['sertifikat_hasil']) && $_FILES['sertifikat_hasil']['error'] === UPLOAD_ERR_OK) {
            try {
                $targetDir = 'uploads/lomba_hasil';
                if (!is_dir(__DIR__ . '/../../' . $targetDir)) {
                    mkdir(__DIR__ . '/../../' . $targetDir, 0777, true);
                }

                $ext = strtolower(pathinfo($_FILES['sertifikat_hasil']['name'], PATHINFO_EXTENSION));
                $newName = 'cert_' . uniqid() . '.' . $ext;
                $targetPath = $targetDir . '/' . $newName;

                if (move_uploaded_file($_FILES['sertifikat_hasil']['tmp_name'], __DIR__ . '/../../' . $targetPath)) {
                    $sertifikat_hasil = $targetPath;
                }
            } catch (Exception $e) {
                error_log("Error uploading sertifikat_hasil: " . $e->getMessage());
            }
        }

        try {
            $query = "UPDATE lomba SET prestasi = ?";
            $params = [$prestasi];

            if ($foto_hasil) {
                $query .= ", foto_hasil = ?";
                $params[] = $foto_hasil;
            }
            if ($sertifikat_hasil) {
                $query .= ", sertifikat_hasil = ?";
                $params[] = $sertifikat_hasil;
            }

            $query .= " WHERE id = ?";
            $params[] = $id;

            $stmt = $db->prepare($query);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'message' => 'Hasil lomba berhasil diperbarui']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    // --- PARENT ENDPOINTS ---

    public static function getLombaChildren()
    {
        $user = requireRole('parent');
        $parent_id = $user->ref_id;
        $db = getDB();
        try {
            // Get all children for this parent
            $stmtChildren = $db->prepare("SELECT s.id as siswa_id, s.nama_siswa, k.nama_kelas, s.no_induk 
                                         FROM siswa s 
                                         LEFT JOIN kelas k ON s.kelas_id = k.id
                                         WHERE s.parent_id = ?
                                         ORDER BY s.nama_siswa");
            $stmtChildren->execute([$parent_id]);
            $children = $stmtChildren->fetchAll();

            $result = [];
            foreach ($children as $child) {
                $stmtLomba = $db->prepare("SELECT l.*, p.id as peserta_id, p.parent_approval_status, p.parent_approval_reason, p.parent_approval_file, p.parent_approval_date, p.status_izin, p.alasan_tolak, p.surat_balasan
                                          FROM lomba l
                                          JOIN peserta_lomba p ON l.id = p.lomba_id
                                          WHERE p.siswa_id = ?
                                          ORDER BY l.tanggal_pelaksanaan DESC");
                $stmtLomba->execute([$child['siswa_id']]);
                $lomba = $stmtLomba->fetchAll();

                $result[] = [
                    'siswa_id' => $child['siswa_id'],
                    'nama_siswa' => $child['nama_siswa'],
                    'nama_kelas' => $child['nama_kelas'],
                    'no_induk' => $child['no_induk'],
                    'lomba' => $lomba
                ];
            }

            echo json_encode(['success' => true, 'data' => $result]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public static function approveParentLomba()
    {
        $user = requireRole('parent');
        $input = json_decode(file_get_contents('php://input'), true);

        $peserta_id = $input['peserta_id'] ?? null;
        $status_approval = $input['status_approval'] ?? '';
        $reason = $input['reason'] ?? null;

        if (!$peserta_id || !in_array($status_approval, ['Disetujui', 'Ditolak'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Data tidak lengkap atau tidak valid']);
            return;
        }

        $db = getDB();

        // Handle file upload
        $approval_file = null;
        if (isset($_FILES['approval_file']) && $_FILES['approval_file']['error'] === UPLOAD_ERR_OK) {
            try {
                $approval_file = UploadHelper::upload($_FILES['approval_file'], 'persetujuan_lomba');
            } catch (Exception $e) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                return;
            }
        }

        try {
            if ($approval_file) {
                $stmt = $db->prepare("UPDATE peserta_lomba SET parent_approval_status = ?, parent_approval_reason = ?, parent_approval_file = ?, parent_approval_date = NOW() WHERE id = ?");
                $stmt->execute([$status_approval, $reason, $approval_file, $peserta_id]);
            } else {
                $stmt = $db->prepare("UPDATE peserta_lomba SET parent_approval_status = ?, parent_approval_reason = ?, parent_approval_date = NOW() WHERE id = ?");
                $stmt->execute([$status_approval, $reason, $peserta_id]);
            }

            echo json_encode(['success' => true, 'message' => 'Persetujuan berhasil disimpan']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }
}
