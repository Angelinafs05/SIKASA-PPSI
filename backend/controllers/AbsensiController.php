<?php

/**
 * Absensi Controller (Pelatih)
 */

class AbsensiController
{

    private static function hasAbsensiColumn(PDO $db, string $column): bool
    {
        static $cache = [];
        $cacheKey = $column;
        if (array_key_exists($cacheKey, $cache)) {
            return $cache[$cacheKey];
        }

        try {
            $stmt = $db->prepare("SHOW COLUMNS FROM absensi LIKE :col");
            $stmt->execute([':col' => $column]);
            $cache[$cacheKey] = (bool) $stmt->fetch();
        } catch (PDOException $e) {
            $cache[$cacheKey] = false;
        }

        return $cache[$cacheKey];
    }

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

        // Ambil materi dari jurnal_ekskul jika ada
        $stmt_materi = $db->prepare("SELECT materi FROM jurnal_ekskul WHERE ekskul_id = :eid AND tanggal = :tgl AND tahun_ajaran = :t AND semester = :s");
        $stmt_materi->execute([':eid' => $ekskulId, ':tgl' => $tanggal, ':t' => $period['tahun_ajaran'], ':s' => $period['semester']]);
        $jurnal = $stmt_materi->fetch();
        $materiHariIni = $jurnal['materi'] ?? '';

        // Fallback cek di tabel absensi
        if (empty($materiHariIni)) {
            $stmt_materi_abs = $db->prepare("SELECT materi FROM absensi WHERE id_pelatih = :pid AND tanggal = :tgl AND materi IS NOT NULL AND materi != '' LIMIT 1");
            $stmt_materi_abs->execute([':pid' => $user->ref_id, ':tgl' => $tanggal]);
            $materiHariIni = $stmt_materi_abs->fetchColumn() ?: '';
        }

        successResponse([
            'tanggal' => $tanggal,
            'ekskul_id' => $ekskulId,
            'materi'  => $materiHariIni,
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
        $materi   = trim($data['materi'] ?? '');
        $absensi  = $data['absensi'] ?? [];
        $idPelatih = $user->ref_id;

        // Ambil ekskul_id pelatih
        $stmt_pe = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
        $stmt_pe->execute([':id' => $idPelatih]);
        $pelatihData = $stmt_pe->fetch();
        $ekskulIdPelatih = $pelatihData['ekskul_id'] ?? 0;

        $period = getActivePeriod();
        $tahun  = $period['tahun_ajaran'];
        $sem    = $period['semester'];

        // Simpan / update ke jurnal_ekskul
        if (!empty($ekskulIdPelatih)) {
            $stmt_jurnal = $db->prepare("
                INSERT INTO jurnal_ekskul (ekskul_id, pelatih_id, tanggal, materi, tahun_ajaran, semester)
                VALUES (:eid, :pid, :tgl, :materi, :thn, :sem)
                ON DUPLICATE KEY UPDATE materi = :materi_upd, pelatih_id = :pid_upd
            ");
            $stmt_jurnal->execute([
                ':eid' => $ekskulIdPelatih,
                ':pid' => $idPelatih,
                ':tgl' => $tanggal,
                ':materi' => $materi,
                ':thn' => $tahun,
                ':sem' => $sem,
                ':materi_upd' => $materi,
                ':pid_upd' => $idPelatih
            ]);
        }

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
            $hasFinal = self::hasAbsensiColumn($db, 'is_final');

            // Cek apakah sudah ada
            $cek = $db->prepare("SELECT id FROM absensi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem");
            $cek->execute([':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);

            if ($cek->fetch()) {
                // Update and finalize teacher input
                if ($hasFinal) {
                    $db->prepare("UPDATE absensi SET status = :status, id_pelatih = :pid, is_final = 1 WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem")
                        ->execute([':status' => $status, ':pid' => $idPelatih, ':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
                } else {
                    $db->prepare("UPDATE absensi SET status = :status, id_pelatih = :pid, materi = :materi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem")
                        ->execute([':status' => $status, ':pid' => $idPelatih, ':materi' => $materi, ':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
                }
            } else {
                // Insert and finalize teacher input
                if ($hasFinal) {
                    $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, tahun_ajaran, semester, is_final) VALUES (:sid, :pid, :tgl, :status, :tahun, :sem, 1)")
                        ->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':status' => $status, ':tahun' => $tahun, ':sem' => $sem]);
                } else {
                    $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, tahun_ajaran, semester) VALUES (:sid, :pid, :tgl, :status, :tahun, :sem)")
                        ->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':status' => $status, ':tahun' => $tahun, ':sem' => $sem]);
                }
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

        $stmt_materi = $db->prepare("SELECT materi FROM jurnal_ekskul WHERE ekskul_id = :eid AND tanggal = :tgl AND tahun_ajaran = :t AND semester = :s");
        $stmt_materi->execute([':eid' => $ekskulId, ':tgl' => $tanggal, ':t' => $period['tahun_ajaran'], ':s' => $period['semester']]);
        $jurnal = $stmt_materi->fetch();
        $materiHariIni = $jurnal['materi'] ?? '';

        successResponse([
            'tanggal' => $tanggal,
            'ekskul_id' => $ekskulId,
            'materi'  => $materiHariIni,
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
        $materi   = trim($data['materi'] ?? '');
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

            $hasFinal = self::hasAbsensiColumn($db, 'is_final');
            // Cek apakah sudah ada
            $cek = $db->prepare("SELECT id FROM absensi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem");
            $cek->execute([':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);

            if ($cek->fetch()) {
                // Update and finalize teacher input
                if ($hasFinal) {
                    $db->prepare("UPDATE absensi SET status = :status, id_pelatih = :pid, is_final = 1 WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem")
                        ->execute([':status' => $status, ':pid' => $idPelatih, ':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
                } else {
                    $db->prepare("UPDATE absensi SET status = :status, id_pelatih = :pid, materi = :materi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem")
                        ->execute([':status' => $status, ':pid' => $idPelatih, ':materi' => $materi, ':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
                }
            } else {
                // Insert and finalize teacher input
                if ($hasFinal) {
                    $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, tahun_ajaran, semester, is_final) VALUES (:sid, :pid, :tgl, :status, :tahun, :sem, 1)")
                        ->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':status' => $status, ':tahun' => $tahun, ':sem' => $sem]);
                } else {
                    $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, tahun_ajaran, semester) VALUES (:sid, :pid, :tgl, :status, :tahun, :sem)")
                        ->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':status' => $status, ':tahun' => $tahun, ':sem' => $sem]);
                }
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

        $hasFinal = self::hasAbsensiColumn($db, 'is_final');
        $selectColumns = $hasFinal ? 'id, surat_ijin, is_final' : 'id, surat_ijin';

        // Cek absensi
        $cek = $db->prepare("SELECT {$selectColumns} FROM absensi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem");
        $cek->execute([':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
        $existing = $cek->fetch();

        if ($existing && $hasFinal && $existing['is_final']) {
            errorResponse('Surat izin sudah final dan tidak dapat diubah', 400);
        }

        $uploadPath = null;
        if (!empty($_FILES['surat_ijin']) && $_FILES['surat_ijin']['error'] === UPLOAD_ERR_OK) {
            require_once 'helpers/UploadHelper.php';
            $uploadPath = UploadHelper::upload($_FILES['surat_ijin'], 'public/uploads/izin');
            if (!$uploadPath) {
                errorResponse('Gagal mengunggah surat izin. Pastikan format file benar (JPG, PNG, PDF).', 400);
            }
        }

        if ($existing) {
            $filePath = $uploadPath ?: $existing['surat_ijin'];
            if (!$filePath) {
                errorResponse('Surat izin wajib diunggah', 400);
            }
            if ($hasFinal) {
                $db->prepare("UPDATE absensi SET status = 'Izin', status_izin = 'Menunggu', keterangan = :ket, surat_ijin = :file, is_final = 0 WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem")
                    ->execute([':ket' => $keterangan, ':file' => $filePath, ':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
            } else {
                $db->prepare("UPDATE absensi SET status = 'Izin', status_izin = 'Menunggu', keterangan = :ket, surat_ijin = :file WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem")
                    ->execute([':ket' => $keterangan, ':file' => $filePath, ':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
            }
        } else {
            if (!$uploadPath) {
                errorResponse('Surat izin wajib diunggah', 400);
            }
            if ($hasFinal) {
                $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, status_izin, keterangan, surat_ijin, tahun_ajaran, semester, is_final) VALUES (:sid, :pid, :tgl, 'Izin', 'Menunggu', :ket, :file, :tahun, :sem, 0)")
                    ->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':ket' => $keterangan, ':file' => $uploadPath, ':tahun' => $tahun, ':sem' => $sem]);
            } else {
                $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, status_izin, keterangan, surat_ijin, tahun_ajaran, semester) VALUES (:sid, :pid, :tgl, 'Izin', 'Menunggu', :ket, :file, :tahun, :sem)")
                    ->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':ket' => $keterangan, ':file' => $uploadPath, ':tahun' => $tahun, ':sem' => $sem]);
            }
        }

        successResponse(null, 'Surat izin berhasil dikirim', 201);
    }

    public static function siswaIzinDetail(): void
    {
        $user = requireRole('siswa');
        $db = getDB();

        $ekskulId = $_GET['ekskul_id'] ?? null;
        $tanggal = $_GET['tanggal'] ?? null;

        if (!$ekskulId || !$tanggal) {
            errorResponse('Ekstrakurikuler dan tanggal harus diberikan', 400);
        }

        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];
        $sem = $period['semester'];

        $hasFinal = self::hasAbsensiColumn($db, 'is_final');
        $selectFinal = $hasFinal ? 'a.is_final' : '0 AS is_final';

        $stmt = $db->prepare("SELECT a.tanggal, a.status, a.status_izin, a.catatan_izin, a.keterangan, a.surat_ijin, {$selectFinal}
            FROM absensi a
            JOIN pelatih p ON a.id_pelatih = p.id
            WHERE a.id_siswa = :sid
              AND a.tanggal = :tgl
              AND a.tahun_ajaran = :tahun
              AND a.semester = :sem
              AND p.ekskul_id = :eid");
        $stmt->execute([':sid' => $user->ref_id, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem, ':eid' => $ekskulId]);

        $data = $stmt->fetch();
        successResponse(['izin' => $data ?: null]);
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

        try {
            // Get approved ekskuls for this student
            $stmt_e = $db->prepare("
                SELECT e.id, e.nama_ekskul
                FROM pendaftaran_ekskul pe
                JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
                WHERE pe.siswa_id = :sid AND pe.status = 'approved' AND pe.tahun_ajaran = :t AND pe.semester = :s
            ");
            $stmt_e->execute([':sid' => $siswaId, ':t' => $tahun, ':s' => $sem]);
            $ekskuls = $stmt_e->fetchAll();

            $result = [];
            foreach ($ekskuls as $e) {
                $eid = $e['id'];

                // Get pelatih for this ekskul
                $stmt_p = $db->prepare("SELECT p.nama_pelatih FROM pelatih p WHERE p.ekskul_id = :eid LIMIT 1");
                $stmt_p->execute([':eid' => $eid]);
                $pelatih = $stmt_p->fetch();
                $nama_pelatih = $pelatih['nama_pelatih'] ?? '-';

                // Get stats for this ekskul
                $stmt_stats = $db->prepare("
                    SELECT 
                        SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                        SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
                        SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                        SUM(CASE WHEN status = 'Alfa' THEN 1 ELSE 0 END) as alfa
                    FROM absensi a
                    JOIN pelatih p ON a.id_pelatih = p.id
                    WHERE a.id_siswa = :sid AND p.ekskul_id = :eid
                      AND a.tahun_ajaran = :t AND a.semester = :s
                ");
                $stmt_stats->execute([':sid' => $siswaId, ':eid' => $eid, ':t' => $tahun, ':s' => $sem]);
                $stats = $stmt_stats->fetch();

                // Get detail log
                $hasFinal = self::hasAbsensiColumn($db, 'is_final');
                $selectFinal = $hasFinal ? 'a.is_final' : '0 AS is_final';

                $stmt_log = $db->prepare("
                    SELECT a.tanggal, a.status, a.status_izin, a.catatan_izin, a.keterangan, {$selectFinal}, :eid1 as ekskul_id
                    FROM absensi a
                    JOIN pelatih p ON a.id_pelatih = p.id
                    WHERE a.id_siswa = :sid AND p.ekskul_id = :eid2
                      AND a.tahun_ajaran = :t AND a.semester = :s
                    ORDER BY a.tanggal DESC
                ");
                $stmt_log->execute([':sid' => $siswaId, ':eid1' => $eid, ':eid2' => $eid, ':t' => $tahun, ':s' => $sem]);
                $logs = $stmt_log->fetchAll();

                $result[] = [
                    'ekskul_id' => $eid,
                    'nama_ekskul' => $e['nama_ekskul'],
                    'nama_pelatih' => $nama_pelatih,
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
        } catch (Exception $e) {
            errorResponse('Gagal mengambil data kehadiran: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/siswa/izin/ubah-status
     * Body: ekskul_id, tanggal, new_status (Sakit|Alfa)
     */
    public static function updateIzinStatus(): void
    {
        $user = requireRole('siswa');
        $db = getDB();

        $input = json_decode(file_get_contents('php://input'), true);
        $ekskulId = $input['ekskul_id'] ?? null;
        $tanggal = $input['tanggal'] ?? null;
        $newStatus = $input['new_status'] ?? null;
        $siswaId = $user->ref_id;

        if (!$ekskulId || !$tanggal || !$newStatus) {
            errorResponse('Ekstrakurikuler, tanggal, dan status baru harus diberikan', 400);
        }

        if (!in_array($newStatus, ['Sakit', 'Alfa', 'Hadir'])) {
            errorResponse('Status harus Sakit, Alfa, atau Hadir', 400);
        }

        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];
        $sem = $period['semester'];

        $hasFinal = self::hasAbsensiColumn($db, 'is_final');

        // Cek apakah ada absensi dengan status Izin
        $cek = $db->prepare("SELECT id FROM absensi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem AND status = 'Izin'");
        $cek->execute([':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
        $existing = $cek->fetch();

        if (!$existing) {
            errorResponse('Izin tidak ditemukan', 404);
        }

        // Cek apakah final
        if ($hasFinal) {
            $cekFinal = $db->prepare("SELECT is_final FROM absensi WHERE id = :id");
            $cekFinal->execute([':id' => $existing['id']]);
            $row = $cekFinal->fetch();
            if ($row && $row['is_final']) {
                errorResponse('Izin sudah final dan tidak dapat diubah', 400);
            }
        }

        // Update status
        $db->prepare("UPDATE absensi SET status = :status WHERE id = :id")
            ->execute([':status' => $newStatus, ':id' => $existing['id']]);

        successResponse(null, 'Status izin berhasil diubah menjadi ' . $newStatus, 200);
    }

    /**
     * DELETE /api/siswa/izin/batalkan
     * Query: ekskul_id, tanggal
     */
    public static function cancelIzin(): void
    {
        $user = requireRole('siswa');
        $db = getDB();

        $ekskulId = $_GET['ekskul_id'] ?? null;
        $tanggal = $_GET['tanggal'] ?? null;
        $siswaId = $user->ref_id;

        if (!$ekskulId || !$tanggal) {
            errorResponse('Ekstrakurikuler dan tanggal harus diberikan', 400);
        }

        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];
        $sem = $period['semester'];

        $hasFinal = self::hasAbsensiColumn($db, 'is_final');

        // Cek apakah ada absensi dengan status Izin
        $cek = $db->prepare("SELECT id FROM absensi WHERE id_siswa = :sid AND tanggal = :tgl AND tahun_ajaran = :tahun AND semester = :sem AND status = 'Izin'");
        $cek->execute([':sid' => $siswaId, ':tgl' => $tanggal, ':tahun' => $tahun, ':sem' => $sem]);
        $existing = $cek->fetch();

        if (!$existing) {
            errorResponse('Izin tidak ditemukan', 404);
        }

        // Cek apakah final
        if ($hasFinal) {
            $cekFinal = $db->prepare("SELECT is_final FROM absensi WHERE id = :id");
            $cekFinal->execute([':id' => $existing['id']]);
            $row = $cekFinal->fetch();
            if ($row && $row['is_final']) {
                errorResponse('Izin sudah final dan tidak dapat dibatalkan', 400);
            }
        }

        // Hapus record izin
        $db->prepare("DELETE FROM absensi WHERE id = :id")->execute([':id' => $existing['id']]);

        successResponse(null, 'Izin berhasil dibatalkan', 200);
    }

    /**
     * GET /api/admin/izin
     * List all izin for Admin / Kepala Sekolah / Pendamping
     */
    public static function adminListIzin(): void
    {
        $user = requireRole('admin', 'kepala_sekolah', 'pendamping');
        $db = getDB();
        $period = getActivePeriod();

        $statusFilter = $_GET['status_izin'] ?? null;
        $tahun = $_GET['tahun'] ?? $period['tahun_ajaran'];
        $sem = $_GET['semester'] ?? $period['semester'];

        $sql = "
            SELECT a.id, a.id_siswa, a.id_pelatih, a.tanggal, a.status, a.surat_ijin,
                   a.status_izin, a.catatan_izin, a.keterangan, a.tahun_ajaran, a.semester,
                   s.nama_siswa, s.no_induk, k.nama_kelas,
                   e.nama_ekskul, p.nama_pelatih
            FROM absensi a
            JOIN siswa s ON a.id_siswa = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            JOIN pelatih p ON a.id_pelatih = p.id
            JOIN ekstrakurikuler e ON p.ekskul_id = e.id
            WHERE a.status = 'Izin' AND a.tahun_ajaran = :t AND a.semester = :s
        ";
        $params = [':t' => $tahun, ':s' => $sem];

        // Jika user adalah pendamping, batasi izin hanya untuk ekskul yang didampinginya
        if ($user->role === 'pendamping') {
            $sql .= " AND p.guru_id = :guru_id";
            $params[':guru_id'] = $user->ref_id;
        }

        if ($statusFilter) {
            $sql .= " AND a.status_izin = :st";
            $params[':st'] = $statusFilter;
        }

        $sql .= " ORDER BY a.tanggal DESC, a.id DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        successResponse($stmt->fetchAll());
    }

    /**
     * POST /api/admin/izin/{id}/status
     * Body: { status_izin: 'Disetujui'|'Ditolak', catatan_izin: '...' }
     */
    public static function adminUpdateIzin(int $id): void
    {
        $user = requireRole('admin', 'pendamping');
        $data = getRequestBody();
        $db = getDB();

        $statusIzin = $data['status_izin'] ?? '';
        $catatan = $data['catatan_izin'] ?? '';

        if (!in_array($statusIzin, ['Menunggu', 'Disetujui', 'Ditolak'])) {
            errorResponse('Status izin tidak valid', 400);
        }

        // Jika pendamping, pastikan izin ini berasal dari ekskul yang didampinginya
        if ($user->role === 'pendamping') {
            $checkStmt = $db->prepare("
                SELECT a.id 
                FROM absensi a 
                JOIN pelatih p ON a.id_pelatih = p.id 
                WHERE a.id = :id AND p.guru_id = :guru_id
            ");
            $checkStmt->execute([':id' => $id, ':guru_id' => $user->ref_id]);
            if (!$checkStmt->fetch()) {
                errorResponse('Anda tidak berwenang mengelola izin ini', 403);
            }
        }

        $stmt = $db->prepare("UPDATE absensi SET status_izin = :st, catatan_izin = :cat WHERE id = :id");
        $stmt->execute([':st' => $statusIzin, ':cat' => $catatan, ':id' => $id]);

        successResponse(null, "Status izin berhasil diubah menjadi $statusIzin");
    }

    /**
     * GET /api/admin/rekap-absensi?ekskul_id=...&bulan=...&tahun=...&kelas_id=...
     */
    public static function rekapAbsensi(): void
    {
        $user = requireRole('admin', 'kepala_sekolah', 'pendamping');
        $db = getDB();
        $period = getActivePeriod();

        $ekskulId = $_GET['ekskul_id'] ?? null;
        $kelasId = $_GET['kelas_id'] ?? null;
        $tahun = $_GET['tahun'] ?? $period['tahun_ajaran'];
        $sem = $_GET['semester'] ?? $period['semester'];

        $sql = "
            SELECT s.id, s.no_induk, s.nama_siswa, s.kelas_id, k.nama_kelas,
                   e.id AS ekskul_id, e.nama_ekskul, e.hari, e.jam, e.tempat,
                   p.nama_pelatih, g.nama_guru AS nama_pendamping,
                   COUNT(CASE WHEN a.status = 'Hadir' THEN 1 END) as total_hadir,
                   COUNT(CASE WHEN a.status = 'Izin' THEN 1 END) as total_izin,
                   COUNT(CASE WHEN a.status = 'Sakit' THEN 1 END) as total_sakit,
                   COUNT(CASE WHEN a.status = 'Alfa' THEN 1 END) as total_alfa,
                   COUNT(a.id) as total_pertemuan
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
            LEFT JOIN pelatih p ON (p.ekskul_id = e.id OR p.ekskul_id IN (SELECT id FROM ekstrakurikuler WHERE nama_ekskul = e.nama_ekskul))
            LEFT JOIN guru_pendamping g ON p.guru_id = g.id
            LEFT JOIN absensi a ON a.id_siswa = s.id AND a.tahun_ajaran = :t1 AND a.semester = :s1
                 AND a.id_pelatih = p.id
            WHERE pe.status = 'approved' AND pe.tahun_ajaran = :t2 AND pe.semester = :s2
        ";
        $params = [
            ':t1' => $tahun, ':s1' => $sem,
            ':t2' => $tahun, ':s2' => $sem
        ];

        // Jika user adalah pendamping, batasi hanya ekskul yang didampinginya
        if ($user->role === 'pendamping') {
            $sql .= " AND p.guru_id = :guru_id";
            $params[':guru_id'] = $user->ref_id;
        }

        if ($ekskulId) {
            if (is_numeric($ekskulId)) {
                $sql .= " AND pe.ekskul_id IN (
                    SELECT id FROM ekstrakurikuler 
                    WHERE nama_ekskul = (SELECT nama_ekskul FROM ekstrakurikuler WHERE id = :eid LIMIT 1)
                )";
                $params[':eid'] = $ekskulId;
            } else {
                $sql .= " AND e.nama_ekskul = :enama";
                $params[':enama'] = $ekskulId;
            }
        }

        if ($kelasId) {
            $sql .= " AND s.kelas_id = :kid";
            $params[':kid'] = $kelasId;
        }

        $sql .= " GROUP BY s.id, pe.ekskul_id ORDER BY k.nama_kelas ASC, s.nama_siswa ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        successResponse($stmt->fetchAll());
    }
}

