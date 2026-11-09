<?php

/**
 * Dashboard Controller
 * Dashboard stats untuk Admin, Pelatih, Siswa
 */

class DashboardController
{

    /**
     * GET /api/admin/dashboard
     */
    public static function adminDashboard(): void
    {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();

        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];
        $sem = $period['semester'];

        // Total Siswa
        $totalSiswa = $db->query("SELECT COUNT(*) FROM siswa WHERE kelas_id IS NOT NULL")->fetchColumn();

        // Total Ekskul (Unique Names)
        $totalEkskul = $db->query("SELECT COUNT(DISTINCT nama_ekskul) FROM ekstrakurikuler")->fetchColumn();

        // Siswa Aktif (approved) in this period
        $stmt_a = $db->prepare("SELECT COUNT(DISTINCT siswa_id) FROM pendaftaran_ekskul WHERE status = 'approved' AND tahun_ajaran = :t AND semester = :s");
        $stmt_a->execute([':t' => $tahun, ':s' => $sem]);
        $totalAktif = $stmt_a->fetchColumn();

        // Total Pelatih
        $totalPelatih = $db->query("SELECT COUNT(*) FROM pelatih")->fetchColumn();

        // Total Kelas
        $totalKelas = $db->query("SELECT COUNT(*) FROM kelas")->fetchColumn();

        // Pendaftaran Pending in this period
        $stmt = $db->prepare("
            SELECT pe.id, s.nama_siswa, e.nama_ekskul, pe.status, pe.tanggal_daftar, pe.surat_ijin
            FROM pendaftaran_ekskul pe
            LEFT JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
            WHERE pe.status = 'pending' AND pe.tahun_ajaran = :t AND pe.semester = :s
            ORDER BY pe.tanggal_daftar DESC
        ");
        $stmt->execute([':t' => $tahun, ':s' => $sem]);
        $pendaftaran = $stmt->fetchAll();

        // Today's Schedule
        $today = self::getIndonesianDay();
        $stmt_s = $db->prepare("
            SELECT e.nama_ekskul, e.jam, e.tempat, p.nama_pelatih
            FROM ekstrakurikuler e
            LEFT JOIN (
                SELECT p_sub.id, p_sub.nama_pelatih, p_sub.guru_id, e_sub.nama_ekskul
                FROM pelatih p_sub
                JOIN ekstrakurikuler e_sub ON p_sub.ekskul_id = e_sub.id
            ) p ON p.nama_ekskul = e.nama_ekskul
            WHERE e.hari LIKE :today
            ORDER BY e.jam ASC
        ");
        $stmt_s->execute([':today' => "%$today%"]);
        $rawSchedule = $stmt_s->fetchAll();

        // Filter Duplicates by Name in PHP
        $todaySchedule = [];
        $seenEkskul = [];
        foreach ($rawSchedule as $s) {
            if (!in_array($s['nama_ekskul'], $seenEkskul)) {
                $todaySchedule[] = $s;
                $seenEkskul[] = $s['nama_ekskul'];
            }
        }

        successResponse([
            'total_siswa'   => (int) $totalSiswa,
            'total_ekskul'  => (int) $totalEkskul,
            'total_aktif'   => (int) $totalAktif,
            'total_pelatih' => (int) $totalPelatih,
            'total_kelas'   => (int) $totalKelas,
            'pendaftaran_pending' => $pendaftaran,
            'today_schedule' => $todaySchedule,
            'periode' => $period,
            'today_name' => $today
        ]);
    }

    /**
     * Helper to get Indonesian day name
     */
    private static function getIndonesianDay(): string
    {
        $days = [
            'Sunday'    => 'Minggu',
            'Monday'    => 'Senin',
            'Tuesday'   => 'Selasa',
            'Wednesday' => 'Rabu',
            'Thursday'  => 'Kamis',
            'Friday'    => 'Jumat',
            'Saturday'  => 'Sabtu'
        ];
        return $days[date('l')];
    }

    /**
     * GET /api/admin/monitoring
     */
    public static function monitoring(): void
    {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();

        $period = getActivePeriod();

        $stmt = $db->prepare("
            SELECT 
                e.id, e.nama_ekskul, e.hari, e.jam, e.tempat, e.target_kelas, e.is_seleksi, 
                p.nama_pelatih, g.nama_guru AS pendamping,
                (SELECT COUNT(*) FROM pendaftaran_ekskul pe 
                 WHERE pe.ekskul_id = e.id 
                 AND pe.status = 'approved' AND pe.tahun_ajaran = :t1 AND pe.semester = :s1) AS total_siswa
            FROM ekstrakurikuler e
            LEFT JOIN pelatih p ON p.ekskul_id = e.id
            LEFT JOIN guru_pendamping g ON p.guru_id = g.id
            WHERE 1=1
            ORDER BY 
                FIELD(SUBSTRING_INDEX(e.hari, ',', 1), 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') ASC, 
                e.nama_ekskul ASC
        ");
        $stmt->execute([
            ':t1' => $period['tahun_ajaran'],
            ':s1' => $period['semester']
        ]);

        $rawMonitoring = $stmt->fetchAll();
        $monitoring = [];
        $seenMon = [];
        foreach ($rawMonitoring as $m) {
            if (!in_array($m['nama_ekskul'], $seenMon)) {
                $monitoring[] = $m;
                $seenMon[] = $m['nama_ekskul'];
            }
        }

        successResponse($monitoring);
    }

    /**
     * GET /api/pelatih/dashboard
     */
    public static function pelatihDashboard(): void
    {
        $user = requireRole('pelatih');
        $db = getDB();

        // Data pelatih
        $stmt = $db->prepare("
            SELECT p.*, e.nama_ekskul, e.hari, e.jam, e.tempat, e.target_kelas, e.is_seleksi,
                   g.nama_guru AS pendamping
            FROM pelatih p 
            LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id 
            LEFT JOIN guru_pendamping g ON p.guru_id = g.id
            WHERE p.id = :id
        ");
        $stmt->execute([':id' => $user->ref_id]);
        $pelatih = $stmt->fetch();

        $ekskul_id = $pelatih['ekskul_id'] ?? 0;

        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];
        $sem = $period['semester'];

        // Total siswa aktif in this period
        $stmt2 = $db->prepare("SELECT COUNT(*) FROM pendaftaran_ekskul WHERE ekskul_id = :eid AND status = 'approved' AND tahun_ajaran = :t AND semester = :s");
        $stmt2->execute([':eid' => $ekskul_id, ':t' => $tahun, ':s' => $sem]);
        $totalSiswa = $stmt2->fetchColumn();

        // Pending count in this period
        $stmt3 = $db->prepare("SELECT COUNT(*) FROM pendaftaran_ekskul WHERE ekskul_id = :eid AND status = 'pending' AND tahun_ajaran = :t AND semester = :s");
        $stmt3->execute([':eid' => $ekskul_id, ':t' => $tahun, ':s' => $sem]);
        $totalPending = $stmt3->fetchColumn();

        successResponse([
            'pelatih'       => $pelatih,
            'total_siswa'   => (int) $totalSiswa,
            'total_pending' => (int) $totalPending,
            'periode'       => $period
        ]);
    }

    /**
     * GET /api/pendamping/dashboard
     */
    public static function pendampingDashboard(): void
    {
        $user = requireRole('pendamping');
        $db = getDB();

        // Data guru
        $stmt = $db->prepare("SELECT * FROM guru_pendamping WHERE id = :id");
        $stmt->execute([':id' => $user->ref_id]);
        $guru = $stmt->fetch();

        $period = getActivePeriod();
        $tahun = $period['tahun_ajaran'];
        $sem = $period['semester'];

        // Ekskul yang didampingi in this period (mencocokkan baik via e.id maupun nama_ekskul)
        $stmt2 = $db->prepare("
            SELECT DISTINCT e.*, p.nama_pelatih, p.id as pelatih_id,
                   (SELECT COUNT(*) FROM pendaftaran_ekskul pe WHERE pe.ekskul_id = e.id AND pe.status = 'approved' AND pe.tahun_ajaran = :t1 AND pe.semester = :s1) as jumlah_siswa,
                   (SELECT COUNT(DISTINCT tanggal) FROM absensi a WHERE a.id_pelatih = p.id AND a.tahun_ajaran = :t2 AND a.semester = :s2) as total_pertemuan
            FROM ekstrakurikuler e
            JOIN pelatih p ON (p.ekskul_id = e.id OR p.ekskul_id IN (SELECT id FROM ekstrakurikuler WHERE nama_ekskul = e.nama_ekskul))
            WHERE p.guru_id = :id AND e.tahun_ajaran = :t3 AND e.semester = :s3
            ORDER BY e.nama_ekskul ASC
        ");
        $stmt2->execute([
            ':id' => $user->ref_id,
            ':t1' => $tahun, ':s1' => $sem,
            ':t2' => $tahun, ':s2' => $sem,
            ':t3' => $tahun, ':s3' => $sem
        ]);
        $ekskuls = $stmt2->fetchAll();

        // Ambil daftar siswa yang mendaftar / terdaftar untuk tiap ekskul
        $stmt_siswa_ekskul = $db->prepare("
            SELECT pe.id as pendaftaran_id, pe.ekskul_id, pe.status, pe.tanggal_daftar,
                   s.id as siswa_id, s.nama_siswa, s.no_induk, k.nama_kelas
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            WHERE pe.ekskul_id = :eid AND pe.tahun_ajaran = :t AND pe.semester = :s
            ORDER BY k.nama_kelas ASC, s.nama_siswa ASC
        ");

        foreach ($ekskuls as &$eks) {
            $stmt_siswa_ekskul->execute([
                ':eid' => $eks['id'],
                ':t'   => $tahun,
                ':s'   => $sem
            ]);
            $eks['daftar_siswa'] = $stmt_siswa_ekskul->fetchAll();
        }
        unset($eks);

        $totalSiswa = 0;
        if (!empty($ekskuls)) {
            $ids = array_column($ekskuls, 'id');
            $placeholders = str_repeat('?,', count($ids) - 1) . '?';
            $params = array_merge([$tahun, $sem], $ids);
            $stmt3 = $db->prepare("SELECT COUNT(*) FROM pendaftaran_ekskul WHERE status = 'approved' AND tahun_ajaran = ? AND semester = ? AND ekskul_id IN ($placeholders)");
            // Order of params: tahun, semester, then the IDs
            $stmt3->execute($params);
            $totalSiswa = $stmt3->fetchColumn();
        }

        successResponse([
            'guru'        => $guru,
            'ekskuls'     => $ekskuls,
            'total_siswa' => (int) $totalSiswa,
            'periode'     => $period
        ]);
    }

    /**
     * GET /api/siswa/dashboard
     */
    public static function siswaDashboard(): void
    {
        $user = requireRole('siswa');
        $db = getDB();

        $period = getActivePeriod();
        $sid = $user->ref_id;
        $t = $period['tahun_ajaran'];
        $s = $period['semester'];

        // Get student's class
        $stmtSiswa = $db->prepare("SELECT s.*, k.nama_kelas FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id WHERE s.id = :sid");
        $stmtSiswa->execute([':sid' => $sid]);
        $siswa = $stmtSiswa->fetch();

        $isAlumni = false;
        $currKelas = null;
        if ($siswa) {
            $isAlumni = (($siswa['status'] ?? '') === 'alumni');
            $currKelas = $siswa['nama_kelas'] ?? null;
        }

        if ($isAlumni) {
            successResponse([
                'siswa' => $siswa,
                'is_alumni' => true,
                'stats' => [
                    'total_ekskul' => 0,
                    'total_kehadiran' => 0
                ],
                'jadwal_hari_ini' => []
            ]);
            return;
        }

        $isClass9Genap = false;
        if ($s === 'Genap' && $currKelas && strpos($currKelas, 'IX') === 0) {
            $isClass9Genap = true;
        }

        if ($isClass9Genap) {
            successResponse([
                'total_ekskul'  => 0,
                'pending_count' => 0,
                'my_ekskuls'    => [],
                'today_schedule' => [],
                'today_name'    => self::getIndonesianDay(),
                'periode'       => $period,
                'is_class_9_genap' => true
            ]);
            return;
        }

        // Total Ekskul Approved
        $stmt = $db->prepare("SELECT COUNT(*) FROM pendaftaran_ekskul WHERE siswa_id = :sid AND status = 'approved' AND tahun_ajaran = :t AND semester = :s");
        $stmt->execute([':sid' => $sid, ':t' => $t, ':s' => $s]);
        $totalEkskul = $stmt->fetchColumn();

        // Pending Count
        $stmt2 = $db->prepare("SELECT COUNT(*) FROM pendaftaran_ekskul WHERE siswa_id = :sid AND status = 'pending' AND tahun_ajaran = :t AND semester = :s");
        $stmt2->execute([':sid' => $sid, ':t' => $t, ':s' => $s]);
        $pendingCount = $stmt2->fetchColumn();

        // My Ekskuls (Approved)
        $stmt3 = $db->prepare("
            SELECT pe.id AS reg_id, e.id AS ekskul_id, e.nama_ekskul, e.hari, e.jam, e.tempat, p.nama_pelatih
            FROM pendaftaran_ekskul pe
            JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
            LEFT JOIN pelatih p ON p.ekskul_id = e.id
            WHERE pe.siswa_id = :sid AND pe.status = 'approved' AND pe.tahun_ajaran = :t AND pe.semester = :s
            ORDER BY FIELD(SUBSTRING_INDEX(e.hari, ',', 1), 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') ASC
        ");
        $stmt3->execute([':sid' => $sid, ':t' => $t, ':s' => $s]);
        $myEkskuls = $stmt3->fetchAll();

        // Today's schedule for this student
        $today = self::getIndonesianDay();
        $stmt_s = $db->prepare("
            SELECT e.id AS ekskul_id, e.nama_ekskul, e.hari, e.jam, e.tempat, p.nama_pelatih
            FROM pendaftaran_ekskul pe
            JOIN     ekstrakurikuler e ON pe.ekskul_id = e.id
            LEFT JOIN pelatih p ON p.ekskul_id = e.id
            WHERE pe.siswa_id = :sid 
              AND pe.status = 'approved' 
              AND pe.tahun_ajaran = :t 
              AND pe.semester = :s
              AND e.hari LIKE :today
            ORDER BY e.jam ASC
        ");
        $stmt_s->execute([
            ':sid' => $sid,
            ':t' => $t,
            ':s' => $s,
            ':today' => "%$today%"
        ]);
        $todaySchedule = $stmt_s->fetchAll();

        successResponse([
            'total_ekskul'  => (int) $totalEkskul,
            'pending_count' => (int) $pendingCount,
            'my_ekskuls'    => $myEkskuls,
            'today_schedule' => $todaySchedule,
            'today_name'    => $today,
            'periode'       => $period
        ]);
    }

    /**
     * GET /api/admin/monitoring/absensi?ekskul_id=...&tanggal=...
     */
    public static function monitoringAbsensi(): void
    {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();

        $ekskulId = $_GET['ekskul_id'] ?? 0;
        $tanggal  = $_GET['tanggal'] ?? date('Y-m-d');
        $period   = getActivePeriod();

        // Data siswa ekskul + status absensi + rekap semester
        $stmt = $db->prepare("
            SELECT s.id, s.nama_siswa, k.nama_kelas,
                   a.status AS status_absensi, a.keterangan, a.surat_ijin,
                   (SELECT COUNT(*) FROM absensi a_s WHERE a_s.id_siswa = s.id AND a_s.tahun_ajaran = :t3 AND a_s.semester = :s3 AND a_s.status = 'Sakit' AND a_s.id_pelatih IN (SELECT id FROM pelatih WHERE ekskul_id = :eid1)) as total_sakit,
                   (SELECT COUNT(*) FROM absensi a_i WHERE a_i.id_siswa = s.id AND a_i.tahun_ajaran = :t4 AND a_i.semester = :s4 AND a_i.status = 'Izin' AND a_i.id_pelatih IN (SELECT id FROM pelatih WHERE ekskul_id = :eid2)) as total_izin,
                   (SELECT COUNT(*) FROM absensi a_a WHERE a_a.id_siswa = s.id AND a_a.tahun_ajaran = :t5 AND a_a.semester = :s5 AND a_a.status = 'Alfa' AND a_a.id_pelatih IN (SELECT id FROM pelatih WHERE ekskul_id = :eid3)) as total_alfa
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN absensi a ON a.id_siswa = s.id 
                AND a.tanggal = :tgl 
                AND a.tahun_ajaran = :t1 
                AND a.semester = :s1
            WHERE pe.status = 'approved' 
              AND pe.ekskul_id = :eid4
              AND pe.tahun_ajaran = :t2
              AND pe.semester = :s2
            ORDER BY s.nama_siswa ASC
        ");
        $stmt->execute([
            ':tgl' => $tanggal,
            ':eid1' => $ekskulId,
            ':eid2' => $ekskulId,
            ':eid3' => $ekskulId,
            ':eid4' => $ekskulId,
            ':t1' => $period['tahun_ajaran'],
            ':s1' => $period['semester'],
            ':t2' => $period['tahun_ajaran'],
            ':s2' => $period['semester'],
            ':t3' => $period['tahun_ajaran'],
            ':s3' => $period['semester'],
            ':t4' => $period['tahun_ajaran'],
            ':s4' => $period['semester'],
            ':t5' => $period['tahun_ajaran'],
            ':s5' => $period['semester']
        ]);

        successResponse([
            'tanggal' => $tanggal,
            'ekskul_id' => $ekskulId,
            'siswa'   => $stmt->fetchAll(),
        ]);
    }

    /**
     * GET /api/admin/monitoring/nilai?ekskul_id=...
     */
    public static function monitoringNilai(): void
    {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();

        $ekskulId = $_GET['ekskul_id'] ?? 0;
        $period   = getActivePeriod();
        $semester = $_GET['semester'] ?? $period['semester'];
        $tahun    = $_GET['tahun']    ?? $period['tahun_ajaran'];

        // Data siswa + nilai
        $stmt = $db->prepare("
            SELECT s.id, s.no_induk, s.nama_siswa, k.nama_kelas,
                   n.nilai, n.keterangan
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN nilai_ekskul n ON n.siswa_id = s.id 
                AND n.semester = :s1 AND n.tahun = :t1 AND n.ekskul_id = :eid1
            WHERE pe.status = 'approved' AND pe.ekskul_id = :eid2
              AND pe.tahun_ajaran = :t2 AND pe.semester = :s2
            ORDER BY k.nama_kelas ASC, s.nama_siswa ASC
        ");
        $stmt->execute([
            ':eid1' => $ekskulId,
            ':eid2' => $ekskulId,
            ':s1' => $semester,
            ':t1' => $tahun,
            ':s2' => $semester,
            ':t2' => $tahun
        ]);

        successResponse([
            'semester' => $semester,
            'tahun'    => $tahun,
            'ekskul_id' => $ekskulId,
            'siswa'    => $stmt->fetchAll(),
        ]);
    }
}
