<?php

/**
 * Absensi Controller (Pelatih)
 */

class AbsensiController
{

    /**
     * GET /api/pelatih/absensi?tanggal=YYYY-MM-DD
     */
    public static function index(): void
    {
        $user = requireRole('pelatih');
        $db = getDB();

        $period = getActivePeriod();

        // Ambil ekskul_id pelatih
        $stmt_p = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
        $stmt_p->execute([':id' => $user->ref_id]);
        $pelatih = $stmt_p->fetch();
        $ekskulId = $pelatih['ekskul_id'] ?? 0;

        $tanggal = $_GET['tanggal'] ?? date('Y-m-d');

        // Data siswa ekskul + status absensi
        $stmt2 = $db->prepare("
            SELECT s.id, s.nama_siswa, k.nama_kelas,
                   a.status AS status_absensi, a.keterangan, a.surat_ijin
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN absensi a ON a.id_siswa = s.id 
                AND a.tanggal = :tgl 
                AND a.tahun_ajaran = :t1 
                AND a.semester = :s1
            WHERE pe.status = 'approved' 
              AND pe.ekskul_id = :eid
              AND pe.tahun_ajaran = :t2
              AND pe.semester = :s2
            ORDER BY s.nama_siswa ASC
        ");
        $stmt2->execute([
            ':eid' => $ekskulId,
            ':tgl' => $tanggal,
            ':t2' => $period['tahun_ajaran'],
            ':s2' => $period['semester'],
            ':t1' => $period['tahun_ajaran'],
            ':s1' => $period['semester']
        ]);

        successResponse([
            'tanggal' => $tanggal,
            'siswa'   => $stmt2->fetchAll(),
        ]);
    }

    /**
     * POST /api/pelatih/absensi
     * Body: { "tanggal": "2025-03-01", "absensi": [{ "siswa_id": 1, "status": "Hadir" }, ...] }
     */
    public static function store(): void
    {
        $user = requireRole('pelatih');
        $data = getRequestBody();
        $db = getDB();

        $tanggal  = $data['tanggal'] ?? date('Y-m-d');
        $absensi  = $data['absensi'] ?? [];
        $idPelatih = $user->ref_id;

        if (empty($absensi)) {
            errorResponse('Data absensi tidak boleh kosong', 400);
        }

        $validStatus = ['Hadir', 'Izin', 'Sakit', 'Alfa'];

        foreach ($absensi as $item) {
            $siswaId = (int) ($item['siswa_id'] ?? 0);
            $status  = $item['status'] ?? '';

            if (!in_array($status, $validStatus)) continue;

            $period = getActivePeriod();
            $tahun  = $period['tahun_ajaran'];
            $sem    = $period['semester'];

            // Cek apakah sudah ada
            $cek = $db->prepare("SELECT id FROM absensi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem");
            $cek->execute([':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);

            if ($cek->fetch()) {
                // Update
                $db->prepare("UPDATE absensi SET status = :status WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem")
                    ->execute([':status' => $status, ':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
            } else {
                // Insert
                $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, tahun_ajaran, semester) VALUES (:sid, :pid, :tgl, :status, :tahun, :sem)")
                    ->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':status' => $status, ':tahun' => $tahun, ':sem' => $sem]);
            }
        }

        successResponse(null, "Absensi tanggal $tanggal berhasil disimpan");
    }

    /**
     * GET /api/pendamping/absensi?ekskul_id=...&tanggal=...
     */
    public static function pendampingIndex(): void
    {
        $user = requireRole('pendamping');
        $db = getDB();

        $period = getActivePeriod();
        $ekskulId = $_GET['ekskul_id'] ?? 0;
        $tanggal = $_GET['tanggal'] ?? date('Y-m-d');

        if (empty($ekskulId)) {
            successResponse(['tanggal' => $tanggal, 'ekskul_id' => null, 'siswa' => []]);
            return;
        }

        // Verify pendamping supervises this ekskul
        $stmt_check = $db->prepare("
            SELECT e.id 
            FROM ekstrakurikuler e
            JOIN ekstrakurikuler e2 ON e2.nama_ekskul = e.nama_ekskul
            JOIN pelatih p ON p.ekskul_id = e2.id
            WHERE p.guru_id = :guru_id AND e.id = :eid AND e.tahun_ajaran = :t AND e.semester = :s
        ");
        $stmt_check->execute([
            ':guru_id' => $user->ref_id,
            ':eid' => $ekskulId,
            ':t' => $period['tahun_ajaran'],
            ':s' => $period['semester']
        ]);

        if (!$stmt_check->fetch()) {
            errorResponse('Anda tidak memiliki akses ke ekskul ini', 403);
        }

        // Data siswa ekskul + status absensi
        $stmt2 = $db->prepare("
            SELECT s.id, s.nama_siswa, k.nama_kelas,
                   a.status AS status_absensi, a.keterangan, a.surat_ijin
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN absensi a ON a.id_siswa = s.id 
                AND a.tanggal = :tgl 
                AND a.tahun_ajaran = :t1 
                AND a.semester = :s1
            WHERE pe.status = 'approved' 
              AND pe.ekskul_id = :eid
              AND pe.tahun_ajaran = :t2
              AND pe.semester = :s2
            ORDER BY s.nama_siswa ASC
        ");
        $stmt2->execute([
            ':eid' => $ekskulId,
            ':tgl' => $tanggal,
            ':t2' => $period['tahun_ajaran'],
            ':s2' => $period['semester'],
            ':t1' => $period['tahun_ajaran'],
            ':s1' => $period['semester']
        ]);

        successResponse([
            'tanggal' => $tanggal,
            'ekskul_id' => $ekskulId,
            'siswa'   => $stmt2->fetchAll(),
        ]);
    }

    /**
     * POST /api/pendamping/absensi
     */
    public static function pendampingStore(): void
    {
        $user = requireRole('pendamping');
        $data = getRequestBody();
        $db = getDB();

        $tanggal  = $data['tanggal'] ?? date('Y-m-d');
        $ekskulId = $data['ekskul_id'] ?? 0;
        $absensi  = $data['absensi'] ?? [];
        $guruId = $user->ref_id;

        if (empty($absensi) || empty($ekskulId)) {
            errorResponse('Data absensi atau ekskul tidak valid', 400);
        }

        $period = getActivePeriod();
        $tahun  = $period['tahun_ajaran'];
        $sem    = $period['semester'];

        // Verify pendamping supervises this ekskul
        $stmt_check = $db->prepare("
            SELECT p.id as pelatih_id 
            FROM ekstrakurikuler e
            JOIN ekstrakurikuler e2 ON e2.nama_ekskul = e.nama_ekskul
            JOIN pelatih p ON p.ekskul_id = e2.id
            WHERE p.guru_id = :guru_id AND e.id = :eid AND e.tahun_ajaran = :t AND e.semester = :s
        ");
        $stmt_check->execute([
            ':guru_id' => $guruId,
            ':eid' => $ekskulId,
            ':t' => $tahun,
            ':s' => $sem
        ]);
        $pelatih = $stmt_check->fetch();

        if (!$pelatih) {
            errorResponse('Anda tidak memiliki akses ke ekskul ini', 403);
        }

        $idPelatih = $pelatih['pelatih_id'];

        $validStatus = ['Hadir', 'Izin', 'Sakit', 'Alfa'];

        foreach ($absensi as $item) {
            $siswaId = (int) ($item['siswa_id'] ?? 0);
            $status  = $item['status'] ?? '';

            if (!in_array($status, $validStatus)) continue;

            // Cek apakah sudah ada
            $cek = $db->prepare("SELECT id FROM absensi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem");
            $cek->execute([':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);

            if ($cek->fetch()) {
                // Update
                $db->prepare("UPDATE absensi SET status = :status WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem")
                    ->execute([':status' => $status, ':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
            } else {
                // Insert
                $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, tahun_ajaran, semester) VALUES (:sid, :pid, :tgl, :status, :tahun, :sem)")
                    ->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':status' => $status, ':tahun' => $tahun, ':sem' => $sem]);
            }
        }

        successResponse(null, "Absensi tanggal $tanggal berhasil disimpan");
    }

    public static function izin(): void
    {
        $user = requireRole('pelatih');
        $db = getDB();

        $period = getActivePeriod();

        $stmt2 = $db->prepare("
            SELECT s.nama_siswa, a.keterangan as pesan, a.surat_ijin, a.tanggal
            FROM absensi a
            JOIN siswa s ON a.id_siswa = s.id
            WHERE a.id_pelatih = :pelatih_id
              AND a.status = 'Izin'
              AND a.tahun_ajaran = :tahun
              AND a.semester = :sem
            ORDER BY a.tanggal DESC
            LIMIT 20
        ");
        $stmt2->execute([
            ':pelatih_id' => $user->ref_id,
            ':tahun' => $period['tahun_ajaran'],
            ':sem' => $period['semester']
        ]);

        successResponse($stmt2->fetchAll());
    }

    /**
     * POST /api/siswa/izin
     * Form-Data: ekskul_id, tanggal, keterangan, surat_ijin (file)
     */
    public static function siswaIzin(): void
    {
        $user = requireRole('siswa');
        $db = getDB();

        $ekskulId = $_POST['ekskul_id'] ?? null;
        $tanggal = $_POST['tanggal'] ?? null;
        $keterangan = $_POST['keterangan'] ?? null;
        $siswaId = $user->ref_id;

        if (!$ekskulId || !$tanggal || !$keterangan) {
            errorResponse('Semua field wajib diisi', 400);
        }

        if (empty($_FILES['surat_ijin']) || $_FILES['surat_ijin']['error'] !== UPLOAD_ERR_OK) {
            errorResponse('Surat izin wajib diunggah', 400);
        }

        // Cari pelatih id
        $stmt_p = $db->prepare('
            SELECT p.id 
            FROM pelatih p
            WHERE p.ekskul_id = :eid
        ');
        $stmt_p->execute([':eid' => $ekskulId]);
        $pelatih = $stmt_p->fetch();
        if (!$pelatih) {
            errorResponse('Ekstrakurikuler tidak memiliki pelatih aktif', 400);
        }
        $idPelatih = $pelatih['id'];

        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];
        $sem = $period['semester'];

        // Upload
        require_once 'helpers/UploadHelper.php';
        $uploadPath = UploadHelper::upload($_FILES['surat_ijin'], 'public/uploads/izin');
        if (!$uploadPath) {
            errorResponse('Gagal mengunggah surat izin. Pastikan format file benar (JPG, PNG, PDF).', 400);
        }

        // Cek absensi
        $cek = $db->prepare("SELECT id FROM absensi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem");
        $cek->execute([':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);

        if ($cek->fetch()) {
            $db->prepare("UPDATE absensi SET status = 'Izin', keterangan = :ket, surat_ijin = :file WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem")
                ->execute([':ket' => $keterangan, ':file' => $uploadPath, ':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
        } else {
            $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, keterangan, surat_ijin, tahun_ajaran, semester) VALUES (:sid, :pid, :tgl, 'Izin', :ket, :file, :tahun, :sem)")
                ->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':ket' => $keterangan, ':file' => $uploadPath, ':tahun' => $tahun, ':sem' => $sem]);
        }

        successResponse(null, 'Surat izin berhasil dikirim', 201);
    }

    public static function guruIzin(): void
    {
        $user = requireRole('pendamping');
        $db = getDB();

        $period = getActivePeriod();

        $stmt2 = $db->prepare("
            SELECT s.nama_siswa, a.keterangan as pesan, a.surat_ijin, a.tanggal
            FROM absensi a
            JOIN siswa s ON a.id_siswa = s.id
            JOIN pelatih p ON a.id_pelatih = p.id
            WHERE p.guru_id = :guru_id
              AND a.status = 'Izin'
              AND a.tahun_ajaran = :tahun
              AND a.semester = :sem
            ORDER BY a.tanggal DESC
            LIMIT 20
        ");
        $stmt2->execute([
            ':guru_id' => $user->ref_id,
            ':tahun' => $period['tahun_ajaran'],
            ':sem' => $period['semester']
        ]);

        successResponse($stmt2->fetchAll());
    }

    /**
     * GET /api/siswa/kehadiran
     */
    public static function siswaKehadiran(): void
    {
        $user = requireRole('siswa');
        $db = getDB();

        $period = getActivePeriod();
        $siswaId = $user->ref_id;
        $tahun = $period['tahun_ajaran'];
        $sem = $period['semester'];

        // Get approved ekskuls for this student
        $stmt_e = $db->prepare("
            SELECT e.id, e.nama_ekskul, p.nama_pelatih
            FROM pendaftaran_ekskul pe
            JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
            LEFT JOIN (
                SELECT p_sub.id, p_sub.nama_pelatih, p_sub.guru_id, e_sub.nama_ekskul
                FROM pelatih p_sub
                JOIN ekstrakurikuler e_sub ON p_sub.ekskul_id = e_sub.id
            ) p ON p.nama_ekskul = e.nama_ekskul
            WHERE pe.siswa_id = :sid AND pe.status = 'approved' AND pe.tahun_ajaran = :t AND pe.semester = :s
        ");
        $stmt_e->execute([':sid' => $siswaId, ':t' => $tahun, ':s' => $sem]);
        $ekskuls = $stmt_e->fetchAll();

        $result = [];
        foreach ($ekskuls as $e) {
            $eid = $e['id'];

            // Get stats for this ekskul
            $stmt_stats = $db->prepare("
                SELECT 
                    SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                    SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
                    SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                    SUM(CASE WHEN status = 'Alfa' THEN 1 ELSE 0 END) as alfa
                FROM absensi
                WHERE id_siswa = :sid AND id_pelatih IN (SELECT p_sub.id FROM pelatih p_sub JOIN ekstrakurikuler e_sub ON p_sub.ekskul_id = e_sub.id WHERE e_sub.nama_ekskul = (SELECT nama_ekskul FROM ekstrakurikuler WHERE id = :eid))
                  AND tahun_ajaran = :t AND semester = :s
            ");
            $stmt_stats->execute([':sid' => $siswaId, ':eid' => $eid, ':t' => $tahun, ':s' => $sem]);
            $stats = $stmt_stats->fetch();

            // Get detail log
            $stmt_log = $db->prepare("
                SELECT tanggal, status, keterangan
                FROM absensi
                WHERE id_siswa = :sid AND id_pelatih IN (SELECT p_sub.id FROM pelatih p_sub JOIN ekstrakurikuler e_sub ON p_sub.ekskul_id = e_sub.id WHERE e_sub.nama_ekskul = (SELECT nama_ekskul FROM ekstrakurikuler WHERE id = :eid))
                  AND tahun_ajaran = :t AND semester = :s
                ORDER BY tanggal DESC
            ");
            $stmt_log->execute([':sid' => $siswaId, ':eid' => $eid, ':t' => $tahun, ':s' => $sem]);
            $logs = $stmt_log->fetchAll();

            $result[] = [
                'ekskul_id' => $eid,
                'nama_ekskul' => $e['nama_ekskul'],
                'nama_pelatih' => $e['nama_pelatih'],
                'stats' => [
                    'hadir' => (int)($stats['hadir'] ?? 0),
                    'izin' => (int)($stats['izin'] ?? 0),
                    'sakit' => (int)($stats['sakit'] ?? 0),
                    'alfa' => (int)($stats['alfa'] ?? 0),
                ],
                'logs' => $logs
            ];
        }

        successResponse([
            'kehadiran' => $result,
            'semester' => $sem,
            'tahun' => $tahun
        ]);
    }
}
