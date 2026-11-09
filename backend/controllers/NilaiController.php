<?php
/**
 * Nilai Controller (Pelatih)
 */

class NilaiController {
    
    public static function index(): void {
        $user = requireRole('pelatih');
        $db = getDB();
        
        // Ambil ekskul pelatih
        $stmt = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
        $stmt->execute([':id' => $user->ref_id]);
        $pelatih = $stmt->fetch();
        $ekskulId = $pelatih['ekskul_id'] ?? 0;
        
        $period = getActivePeriod();
        $semester = $_GET['semester'] ?? $period['semester'];
        $tahun    = $_GET['tahun']    ?? $period['tahun_ajaran'];
        
        // Data Aspek
        $stmt_aspek = $db->prepare("SELECT id, nama_aspek, bobot FROM aspek_penilaian_ekskul WHERE ekskul_id = :eid ORDER BY id ASC");
        $stmt_aspek->execute([':eid' => $ekskulId]);
        $aspek = $stmt_aspek->fetchAll(PDO::FETCH_ASSOC);

        // Data Nilai Aspek
        $stmt_detail = $db->prepare("SELECT siswa_id, aspek_id, nilai FROM nilai_aspek_siswa WHERE ekskul_id = :eid AND semester = :s AND tahun = :t");
        $stmt_detail->execute([':eid' => $ekskulId, ':s' => $semester, ':t' => $tahun]);
        $detail_nilai = $stmt_detail->fetchAll(PDO::FETCH_ASSOC);

        $nilaiMap = [];
        foreach($detail_nilai as $dn) {
            $nilaiMap[$dn['siswa_id']][$dn['aspek_id']] = $dn['nilai'];
        }

        // Data siswa + nilai akhir
        $stmt2 = $db->prepare("
            SELECT s.id, s.nama_siswa, k.nama_kelas,
                   n.nilai, n.keterangan,
                   (SELECT COUNT(*) FROM absensi a WHERE a.id_siswa = s.id AND a.id_pelatih IN (SELECT p_sub.id FROM pelatih p_sub JOIN ekstrakurikuler e_sub ON p_sub.ekskul_id = e_sub.id WHERE e_sub.nama_ekskul = (SELECT nama_ekskul FROM ekstrakurikuler WHERE id = :eid3)) AND a.status = 'Alfa' AND a.tahun_ajaran = :t3 AND a.semester = :s3) as alfa_count
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN nilai_ekskul n ON n.siswa_id = s.id 
                AND n.semester = :s1 AND n.tahun = :t1 AND n.ekskul_id = :eid1
            WHERE pe.status = 'approved' AND pe.ekskul_id = :eid2
              AND pe.tahun_ajaran = :t2 AND pe.semester = :s2
            ORDER BY k.nama_kelas ASC, s.nama_siswa ASC
        ");
        $stmt2->execute([
            ':eid1' => $ekskulId,
            ':eid2' => $ekskulId, 
            ':eid3' => $ekskulId,
            ':s1' => $semester, ':t1' => $tahun,
            ':s2' => $semester, ':t2' => $tahun,
            ':s3' => $semester, ':t3' => $tahun
        ]);
        
        $siswaData = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        foreach($siswaData as &$s) {
            $s['detail_nilai'] = $nilaiMap[$s['id']] ?? new stdClass(); // fallback to empty obj for JS map
        }

        successResponse([
            'semester' => $semester,
            'tahun'    => $tahun,
            'aspek'    => $aspek,
            'siswa'    => $siswaData,
        ]);
    }
    
    public static function store(): void {
        $user = requireRole('pelatih');
        self::processStore($user->ref_id, 'pelatih');
    }

    public static function pendampingIndex(): void {
        $user = requireRole('pendamping');
        $db = getDB();
        
        $period = getActivePeriod();
        $ekskulId = $_GET['ekskul_id'] ?? 0;
        $semester = $_GET['semester'] ?? $period['semester'];
        $tahun    = $_GET['tahun']    ?? $period['tahun_ajaran'];
        
        if (empty($ekskulId)) {
            successResponse(['semester' => $semester, 'tahun' => $tahun, 'ekskul_id' => null, 'aspek' => [], 'siswa' => []]);
            return;
        }

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
        
        // Data Aspek
        $stmt_aspek = $db->prepare("SELECT id, nama_aspek, bobot FROM aspek_penilaian_ekskul WHERE ekskul_id = :eid ORDER BY id ASC");
        $stmt_aspek->execute([':eid' => $ekskulId]);
        $aspek = $stmt_aspek->fetchAll(PDO::FETCH_ASSOC);

        // Data Nilai Aspek
        $stmt_detail = $db->prepare("SELECT siswa_id, aspek_id, nilai FROM nilai_aspek_siswa WHERE ekskul_id = :eid AND semester = :s AND tahun = :t");
        $stmt_detail->execute([':eid' => $ekskulId, ':s' => $semester, ':t' => $tahun]);
        $detail_nilai = $stmt_detail->fetchAll(PDO::FETCH_ASSOC);

        $nilaiMap = [];
        foreach($detail_nilai as $dn) {
            $nilaiMap[$dn['siswa_id']][$dn['aspek_id']] = $dn['nilai'];
        }

        // Data siswa + nilai
        $stmt2 = $db->prepare("
            SELECT s.id, s.nama_siswa, k.nama_kelas,
                   n.nilai, n.keterangan,
                   (SELECT COUNT(*) FROM absensi a WHERE a.id_siswa = s.id AND a.id_pelatih IN (SELECT p_sub.id FROM pelatih p_sub JOIN ekstrakurikuler e_sub ON p_sub.ekskul_id = e_sub.id WHERE e_sub.nama_ekskul = (SELECT nama_ekskul FROM ekstrakurikuler WHERE id = :eid3)) AND a.status = 'Alfa' AND a.tahun_ajaran = :t3 AND a.semester = :s3) as alfa_count
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN nilai_ekskul n ON n.siswa_id = s.id 
                AND n.semester = :s1 AND n.tahun = :t1 AND n.ekskul_id = :eid1
            WHERE pe.status = 'approved' AND pe.ekskul_id = :eid2
              AND pe.tahun_ajaran = :t2 AND pe.semester = :s2
            ORDER BY k.nama_kelas ASC, s.nama_siswa ASC
        ");
        $stmt2->execute([
            ':eid1' => $ekskulId,
            ':eid2' => $ekskulId, 
            ':eid3' => $ekskulId,
            ':s1' => $semester, ':t1' => $tahun,
            ':s2' => $semester, ':t2' => $tahun,
            ':s3' => $semester, ':t3' => $tahun
        ]);
        
        $siswaData = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        foreach($siswaData as &$s) {
            $s['detail_nilai'] = $nilaiMap[$s['id']] ?? new stdClass();
        }

        successResponse([
            'semester' => $semester,
            'tahun'    => $tahun,
            'ekskul_id' => $ekskulId,
            'aspek'    => $aspek,
            'siswa'    => $siswaData,
        ]);
    }

    public static function pendampingStore(): void {
        $user = requireRole('pendamping');
        self::processStore($user->ref_id, 'pendamping');
    }

    private static function processStore($refId, $role): void {
        $data = getRequestBody();
        $db = getDB();
        
        $period = getActivePeriod();
        $semester  = $data['semester'] ?? $period['semester'];
        $tahun     = $data['tahun']    ?? $period['tahun_ajaran'];
        $nilaiList = $data['nilai'] ?? [];
        
        if ($role === 'pelatih') {
            $stmt_e = $db->prepare("SELECT ekskul_id, id as pelatih_id FROM pelatih WHERE id = :id");
            $stmt_e->execute([':id' => $refId]);
            $pelatihInfo = $stmt_e->fetch();
            $ekskulId = $pelatihInfo['ekskul_id'] ?? 0;
            $idPelatih = $pelatihInfo['pelatih_id'] ?? 0;
        } else {
            // pendamping
            $ekskulId = $data['ekskul_id'] ?? 0;
            if (empty($ekskulId)) errorResponse('Ekskul tidak valid', 400);

            $stmt_check = $db->prepare("
                SELECT p.id as pelatih_id 
                FROM ekstrakurikuler e
                JOIN ekstrakurikuler e2 ON e2.nama_ekskul = e.nama_ekskul
                JOIN pelatih p ON p.ekskul_id = e2.id
                WHERE p.guru_id = :guru_id AND e.id = :eid AND e.tahun_ajaran = :t AND e.semester = :s
            ");
            $stmt_check->execute([
                ':guru_id' => $refId, ':eid' => $ekskulId, ':t' => $period['tahun_ajaran'], ':s' => $period['semester']
            ]);
            $pelatihInfo = $stmt_check->fetch();
            
            if (!$pelatihInfo) errorResponse('Anda tidak memiliki akses ke ekskul ini', 403);
            $idPelatih = $pelatihInfo['pelatih_id'];
        }

        if (empty($nilaiList)) {
            errorResponse('Data nilai tidak boleh kosong', 400);
        }
        
        // Fetch Aspek weights
        $stmt_aspek = $db->prepare("SELECT id, bobot FROM aspek_penilaian_ekskul WHERE ekskul_id = :eid");
        $stmt_aspek->execute([':eid' => $ekskulId]);
        $aspekListDB = $stmt_aspek->fetchAll(PDO::FETCH_ASSOC);
        
        $bobotMap = [];
        foreach($aspekListDB as $a) {
            $bobotMap[$a['id']] = $a['bobot'];
        }
        
        $db->beginTransaction();

        try {
            $stmt_alfa = $db->prepare("SELECT COUNT(*) FROM absensi WHERE id_siswa = :sid AND id_pelatih = :pid AND status = 'Alfa' AND tahun_ajaran = :t1 AND semester = :s1");
            $stmt_cek = $db->prepare("SELECT id FROM nilai_ekskul WHERE siswa_id = :sid AND ekskul_id = :eid AND semester = :sem AND tahun = :thn");
            $stmt_upd = $db->prepare("UPDATE nilai_ekskul SET nilai = :nilai, keterangan = :ket, pelatih_id = :pid WHERE siswa_id = :sid AND ekskul_id = :eid AND semester = :sem AND tahun = :thn");
            $stmt_ins = $db->prepare("INSERT INTO nilai_ekskul (siswa_id, ekskul_id, pelatih_id, nilai, keterangan, semester, tahun) VALUES (:sid, :eid, :pid, :nilai, :ket, :sem, :thn)");
            $stmt_del_aspek = $db->prepare("DELETE FROM nilai_aspek_siswa WHERE siswa_id = :sid AND ekskul_id = :eid AND semester = :sem AND tahun = :thn");
            $stmt_ins_aspek = $db->prepare("INSERT INTO nilai_aspek_siswa (siswa_id, ekskul_id, aspek_id, pelatih_id, nilai, semester, tahun) VALUES (:sid, :eid, :aid, :pid, :nilai, :sem, :thn)");

            foreach ($nilaiList as $item) {
                $siswaId = (int) ($item['siswa_id'] ?? 0);
                $nilaiAspek = $item['nilai_aspek'] ?? [];
                $ket     = trim($item['keterangan'] ?? '');
                
                $nilaiAkhir = 0;
                if (!empty($bobotMap)) {
                    foreach($bobotMap as $aspek_id => $bobot) {
                        $val = isset($nilaiAspek[$aspek_id]) ? (float)$nilaiAspek[$aspek_id] : 0;
                        $nilaiAkhir += ($val * $bobot / 100);
                    }
                    $nilaiAkhir = round($nilaiAkhir);
                } else {
                    $nilaiAkhir = (int) ($item['nilai'] ?? 0);
                }
                
                // Cek batasan nilai jika alfa >= 3
                $stmt_alfa->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':t1' => $tahun, ':s1' => $semester]);
                $alfaCount = $stmt_alfa->fetchColumn();
                
                if ($alfaCount >= 3 && $nilaiAkhir >= 60) {
                    $nama_siswa = $db->query("SELECT nama_siswa FROM siswa WHERE id = $siswaId")->fetchColumn();
                    throw new Exception("Siswa $nama_siswa sudah 3 kali absen (Alfa). Maksimal nilai akhir yang diizinkan adalah 59.");
                }
                
                // Cek existing
                $stmt_cek->execute([':sid' => $siswaId, ':eid' => $ekskulId, ':sem' => $semester, ':thn' => $tahun]);
                if ($stmt_cek->fetch()) {
                    $stmt_upd->execute([':nilai' => $nilaiAkhir, ':ket' => $ket, ':pid' => $idPelatih, ':sid' => $siswaId, ':eid' => $ekskulId, ':sem' => $semester, ':thn' => $tahun]);
                } else {
                    $stmt_ins->execute([':sid' => $siswaId, ':eid' => $ekskulId, ':pid' => $idPelatih, ':nilai' => $nilaiAkhir, ':ket' => $ket, ':sem' => $semester, ':thn' => $tahun]);
                }

                // Sync Aspek Detail
                $stmt_del_aspek->execute([':sid' => $siswaId, ':eid' => $ekskulId, ':sem' => $semester, ':thn' => $tahun]);
                if (!empty($nilaiAspek)) {
                    foreach($nilaiAspek as $aspek_id => $val) {
                        $stmt_ins_aspek->execute([
                            ':sid' => $siswaId, ':eid' => $ekskulId, ':aid' => $aspek_id,
                            ':pid' => $idPelatih, ':nilai' => (float)$val,
                            ':sem' => $semester, ':thn' => $tahun
                        ]);
                    }
                }
            }
            $db->commit();
            successResponse(null, 'Nilai berhasil disimpan');
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse($e->getMessage(), 400);
        }
    }

    public static function siswaIndex(): void {
        $user = requireRole('siswa');
        $db = getDB();
        
        $period = getActivePeriod();
        $semester = $_GET['semester'] ?? $period['semester'];
        $tahun    = $_GET['tahun']    ?? $period['tahun_ajaran'];
        $sid      = $user->ref_id;

        // Ambil info siswa
        $stmt_s = $db->prepare("SELECT s.id, s.no_induk, s.nama_siswa, k.nama_kelas FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id WHERE s.id = :id");
        $stmt_s->execute([':id' => $sid]);
        $siswaInfo = $stmt_s->fetch(PDO::FETCH_ASSOC);
        
        // Ambil seluruh ekskul approved yang diikuti siswa
        $stmt = $db->prepare("
            SELECT pe.ekskul_id, e.nama_ekskul, e.hari, e.jam, e.tempat,
                   p.id as pelatih_id, p.nama_pelatih,
                   ne.nilai, ne.keterangan
            FROM pendaftaran_ekskul pe
            JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
            LEFT JOIN pelatih p ON e.id = p.ekskul_id
            LEFT JOIN nilai_ekskul ne ON ne.siswa_id = pe.siswa_id AND ne.ekskul_id = pe.ekskul_id AND ne.semester = :sem1 AND ne.tahun = :thn1
            WHERE pe.siswa_id = :sid AND pe.status = 'approved' AND pe.tahun_ajaran = :thn2 AND pe.semester = :sem2
            ORDER BY e.nama_ekskul ASC
        ");
        
        $stmt->execute([
            ':sid'  => $sid,
            ':sem1' => $semester, ':thn1' => $tahun,
            ':sem2' => $semester, ':thn2' => $tahun
        ]);
        
        $nilaiData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach($nilaiData as &$n) {
            $eid = (int)$n['ekskul_id'];
            $pid = (int)($n['pelatih_id'] ?? 0);

            // Predikat
            $skor = $n['nilai'] !== null ? (int)$n['nilai'] : null;
            $predikat = '-';
            if ($skor !== null) {
                if ($skor >= 85) $predikat = 'A';
                else if ($skor >= 75) $predikat = 'B';
                else if ($skor >= 60) $predikat = 'C';
                else $predikat = 'D';
            }
            $n['predikat'] = $predikat;

            // 1. Bobot Aspek Penilaian Ekskul
            $stmt_aspek = $db->prepare("SELECT id, nama_aspek, bobot FROM aspek_penilaian_ekskul WHERE ekskul_id = :eid ORDER BY id ASC");
            $stmt_aspek->execute([':eid' => $eid]);
            $aspekList = $stmt_aspek->fetchAll(PDO::FETCH_ASSOC);
            $n['bobot_aspek'] = $aspekList;

            // 2. Kehadiran siswa pada ekskul ini
            $stmt_tot = $db->prepare("SELECT COUNT(DISTINCT tanggal) FROM absensi WHERE id_pelatih = :pid AND tahun_ajaran = :t AND semester = :s");
            $stmt_tot->execute([':pid' => $pid, ':t' => $tahun, ':s' => $semester]);
            $totPertemuan = (int)$stmt_tot->fetchColumn();

            $stmt_abs = $db->prepare("
                SELECT status, COUNT(*) as jml 
                FROM absensi 
                WHERE id_siswa = :sid AND id_pelatih = :pid AND tahun_ajaran = :t AND semester = :s 
                GROUP BY status
            ");
            $stmt_abs->execute([':sid' => $sid, ':pid' => $pid, ':t' => $tahun, ':s' => $semester]);
            $absRows = $stmt_abs->fetchAll(PDO::FETCH_KEY_PAIR);

            $hadir = (int)($absRows['Hadir'] ?? 0);
            $izin  = (int)($absRows['Izin'] ?? 0);
            $sakit = (int)($absRows['Sakit'] ?? 0);
            $alfa  = (int)($absRows['Alfa'] ?? 0);
            $persenHadir = $totPertemuan > 0 ? round(($hadir / $totPertemuan) * 100) : 0;

            $n['rekap_kehadiran'] = [
                'total_pertemuan' => $totPertemuan,
                'hadir'  => $hadir,
                'izin'   => $izin,
                'sakit'  => $sakit,
                'alfa'   => $alfa,
                'persen' => $persenHadir
            ];

            // 3. Rincian nilai per pertemuan (harian) beserta materi
            $stmt_np = $db->prepare("
                SELECT np.tanggal, np.nilai, np.catatan, COALESCE(j.materi, a.materi, '') as materi, a.status as status_absensi
                FROM nilai_pertemuan np
                LEFT JOIN jurnal_ekskul j ON j.ekskul_id = np.ekskul_id AND j.tanggal = np.tanggal AND j.tahun_ajaran = np.tahun_ajaran AND j.semester = np.semester
                LEFT JOIN absensi a ON a.id_siswa = np.siswa_id AND a.tanggal = np.tanggal AND a.tahun_ajaran = np.tahun_ajaran AND a.semester = np.semester
                WHERE np.ekskul_id = :eid AND np.siswa_id = :sid AND np.tahun_ajaran = :t AND np.semester = :s
                ORDER BY np.tanggal ASC
            ");
            $stmt_np->execute([':eid' => $eid, ':sid' => $sid, ':t' => $tahun, ':s' => $semester]);
            $riwayatPertemuan = $stmt_np->fetchAll(PDO::FETCH_ASSOC);
            $n['riwayat_pertemuan'] = $riwayatPertemuan;

            // Rata-rata nilai pertemuan
            $totalNilaiP = 0;
            $countNilaiP = count($riwayatPertemuan);
            foreach($riwayatPertemuan as $rp) {
                $totalNilaiP += (int)$rp['nilai'];
            }
            $n['rata_rata_latihan'] = $countNilaiP > 0 ? round($totalNilaiP / $countNilaiP, 1) : 0;
        }

        successResponse([
            'siswa'    => $siswaInfo,
            'semester' => $semester,
            'tahun'    => $tahun,
            'nilai'    => $nilaiData
        ]);
    }

    /**
     * GET /api/admin/rekap-nilai?ekskul_id=...&semester=...&tahun=...
     */
    public static function rekapNilai(): void
    {
        requireRole('admin', 'kepala_sekolah', 'pendamping');
        $db = getDB();
        $period = getActivePeriod();

        $ekskulId = $_GET['ekskul_id'] ?? null;
        $semester = $_GET['semester'] ?? $period['semester'];
        $tahun = $_GET['tahun'] ?? $period['tahun_ajaran'];

        $sql = "
            SELECT s.id, s.no_induk, s.nama_siswa, k.nama_kelas,
                   e.nama_ekskul, p.nama_pelatih,
                   n.nilai, n.keterangan,
                   (CASE 
                       WHEN n.nilai >= 85 THEN 'A'
                       WHEN n.nilai >= 75 THEN 'B'
                       WHEN n.nilai >= 60 THEN 'C'
                       WHEN n.nilai IS NOT NULL THEN 'D'
                       ELSE '-'
                    END) as predikat
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
            LEFT JOIN pelatih p ON e.id = p.ekskul_id
            LEFT JOIN nilai_ekskul n ON n.siswa_id = s.id 
                AND n.ekskul_id = pe.ekskul_id 
                AND n.semester = :s1 AND n.tahun = :t1
            WHERE pe.status = 'approved' AND pe.tahun_ajaran = :t2 AND pe.semester = :s2
        ";
        $params = [
            ':s1' => $semester, ':t1' => $tahun,
            ':t2' => $tahun, ':s2' => $semester
        ];

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

        $sql .= " ORDER BY e.nama_ekskul ASC, k.nama_kelas ASC, s.nama_siswa ASC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        successResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    /**
     * Helper: Menghitung & Menyinkronkan Nilai Akhir Semester Berdasarkan Bobot dan Rata-rata Pertemuan
     */
    public static function syncNilaiAkhirSemester(PDO $db, int $ekskulId, string $tahun, string $semester): void
    {
        // 1. Ambil bobot aspek penilaian untuk ekskul ini
        $stmt_aspek = $db->prepare("SELECT id, nama_aspek, bobot FROM aspek_penilaian_ekskul WHERE ekskul_id = :eid");
        $stmt_aspek->execute([':eid' => $ekskulId]);
        $aspekList = $stmt_aspek->fetchAll(PDO::FETCH_ASSOC);

        // 2. Ambil pelatih_id
        $stmt_p = $db->prepare("SELECT id FROM pelatih WHERE ekskul_id = :eid LIMIT 1");
        $stmt_p->execute([':eid' => $ekskulId]);
        $pelatihId = (int)$stmt_p->fetchColumn();

        // 3. Ambil daftar siswa approved di ekskul ini
        $stmt_siswa = $db->prepare("
            SELECT siswa_id 
            FROM pendaftaran_ekskul 
            WHERE ekskul_id = :eid AND status = 'approved' AND tahun_ajaran = :t AND semester = :s
        ");
        $stmt_siswa->execute([':eid' => $ekskulId, ':t' => $tahun, ':s' => $semester]);
        $siswaList = $stmt_siswa->fetchAll(PDO::FETCH_COLUMN);

        // 4. Hitung total pertemuan absensi ekskul ini
        $stmt_tot_tgl = $db->prepare("
            SELECT COUNT(DISTINCT tanggal) 
            FROM absensi 
            WHERE id_pelatih = :pid AND tahun_ajaran = :t AND semester = :s
        ");
        $stmt_tot_tgl->execute([':pid' => $pelatihId, ':t' => $tahun, ':s' => $semester]);
        $totalPertemuan = (int)$stmt_tot_tgl->fetchColumn();
        if ($totalPertemuan === 0) $totalPertemuan = 1;

        // Siapkan prepared statement untuk update
        $stmt_cek = $db->prepare("SELECT id FROM nilai_ekskul WHERE siswa_id = :sid AND ekskul_id = :eid AND semester = :sem AND tahun = :thn");
        $stmt_upd = $db->prepare("UPDATE nilai_ekskul SET nilai = :nilai, pelatih_id = :pid WHERE siswa_id = :sid AND ekskul_id = :eid AND semester = :sem AND tahun = :thn");
        $stmt_ins = $db->prepare("INSERT INTO nilai_ekskul (siswa_id, ekskul_id, pelatih_id, nilai, keterangan, semester, tahun) VALUES (:sid, :eid, :pid, :nilai, :ket, :sem, :thn)");

        foreach ($siswaList as $sid) {
            // Rata-rata nilai pertemuan siswa
            $stmt_avg = $db->prepare("
                SELECT AVG(nilai) 
                FROM nilai_pertemuan 
                WHERE ekskul_id = :eid AND siswa_id = :sid AND tahun_ajaran = :t AND semester = :s
            ");
            $stmt_avg->execute([':eid' => $ekskulId, ':sid' => $sid, ':t' => $tahun, ':s' => $semester]);
            $avgPertemuan = $stmt_avg->fetchColumn();
            $avgPertemuan = $avgPertemuan !== null ? (float)$avgPertemuan : 0;

            // Hitung persentase kehadiran
            $stmt_hadir = $db->prepare("
                SELECT COUNT(*) 
                FROM absensi 
                WHERE id_siswa = :sid AND id_pelatih = :pid AND status = 'Hadir' AND tahun_ajaran = :t AND semester = :s
            ");
            $stmt_hadir->execute([':sid' => $sid, ':pid' => $pelatihId, ':t' => $tahun, ':s' => $semester]);
            $totalHadir = (int)$stmt_hadir->fetchColumn();
            $nilaiKehadiran = min(100, round(($totalHadir / $totalPertemuan) * 100));

            // Hitung nilai akhir berdasarkan bobot
            $nilaiAkhir = 0;
            if (!empty($aspekList)) {
                $hasAspekMatched = false;
                foreach ($aspekList as $asp) {
                    $nama = strtolower($asp['nama_aspek']);
                    $bobot = (float)$asp['bobot'] / 100;
                    if (strpos($nama, 'hadir') !== false || strpos($nama, 'absensi') !== false) {
                        $nilaiAkhir += ($nilaiKehadiran * $bobot);
                        $hasAspekMatched = true;
                    } else {
                        // Keterampilan, praktik, materi, tugas, dll mengambil dari rata-rata nilai pertemuan
                        $nilaiAkhir += ($avgPertemuan * $bobot);
                        $hasAspekMatched = true;
                    }
                }
                $nilaiAkhir = round($nilaiAkhir);
            } else {
                // Default: 30% kehadiran + 70% materi pertemuan
                $nilaiAkhir = round(($nilaiKehadiran * 0.3) + ($avgPertemuan * 0.7));
            }

            // Cek batasan nilai jika alfa >= 3
            $stmt_alfa = $db->prepare("SELECT COUNT(*) FROM absensi WHERE id_siswa = :sid AND id_pelatih = :pid AND status = 'Alfa' AND tahun_ajaran = :t AND semester = :s");
            $stmt_alfa->execute([':sid' => $sid, ':pid' => $pelatihId, ':t' => $tahun, ':s' => $semester]);
            $alfaCount = (int)$stmt_alfa->fetchColumn();
            if ($alfaCount >= 3 && $nilaiAkhir > 59) {
                $nilaiAkhir = 59;
            }

            // Simpan / update ke tabel nilai_ekskul
            $stmt_cek->execute([':sid' => $sid, ':eid' => $ekskulId, ':sem' => $semester, ':thn' => $tahun]);
            if ($stmt_cek->fetch()) {
                $stmt_upd->execute([':nilai' => $nilaiAkhir, ':pid' => $pelatihId, ':sid' => $sid, ':eid' => $ekskulId, ':sem' => $semester, ':thn' => $tahun]);
            } else {
                $stmt_ins->execute([':sid' => $sid, ':eid' => $ekskulId, ':pid' => $pelatihId, ':nilai' => $nilaiAkhir, ':ket' => 'Nilai akumulasi pertemuan', ':sem' => $semester, ':thn' => $tahun]);
            }
        }
    }

    /**
     * GET /api/pelatih/nilai/pertemuan?tanggal=...
     */
    public static function getPertemuanNilai(): void
    {
        $user = requireRole('pelatih', 'pendamping');
        $db = getDB();
        $period = getActivePeriod();

        $ekskulId = 0;
        if ($user->role === 'pelatih') {
            $stmt = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
            $stmt->execute([':id' => $user->ref_id]);
            $ekskulId = (int)$stmt->fetchColumn();
        } else {
            $ekskulId = (int)($_GET['ekskul_id'] ?? 0);
        }

        $tanggal = $_GET['tanggal'] ?? date('Y-m-d');

        // Ambil data jurnal (materi pertemuan pada tanggal ini)
        $stmt_jurnal = $db->prepare("
            SELECT materi, catatan 
            FROM jurnal_ekskul 
            WHERE ekskul_id = :eid AND tanggal = :tgl AND tahun_ajaran = :t AND semester = :s
        ");
        $stmt_jurnal->execute([':eid' => $ekskulId, ':tgl' => $tanggal, ':t' => $period['tahun_ajaran'], ':s' => $period['semester']]);
        $jurnal = $stmt_jurnal->fetch(PDO::FETCH_ASSOC);

        // Daftar pertemuan yang ada di ekskul ini
        $stmt_dates = $db->prepare("
            SELECT DISTINCT a.tanggal, j.materi
            FROM absensi a
            JOIN pelatih p ON a.id_pelatih = p.id
            LEFT JOIN jurnal_ekskul j ON j.ekskul_id = p.ekskul_id AND j.tanggal = a.tanggal AND j.tahun_ajaran = a.tahun_ajaran AND j.semester = a.semester
            WHERE p.ekskul_id = :eid AND a.tahun_ajaran = :t AND a.semester = :s
            ORDER BY a.tanggal DESC
        ");
        $stmt_dates->execute([':eid' => $ekskulId, ':t' => $period['tahun_ajaran'], ':s' => $period['semester']]);
        $listDates = $stmt_dates->fetchAll(PDO::FETCH_ASSOC);

        // Ambil data siswa + status absensi hari itu + nilai pertemuan hari itu
        $stmt_siswa = $db->prepare("
            SELECT s.id, s.no_induk, s.nama_siswa, k.nama_kelas,
                   a.status AS status_absensi,
                   np.nilai AS nilai_pertemuan, np.catatan AS catatan_nilai,
                   (SELECT AVG(nilai) FROM nilai_pertemuan WHERE ekskul_id = :eid4 AND siswa_id = s.id AND tahun_ajaran = :t4 AND semester = :s4) as rata_rata_pertemuan
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN absensi a ON a.id_siswa = s.id AND a.tanggal = :tgl AND a.tahun_ajaran = :t1 AND a.semester = :s1
            LEFT JOIN nilai_pertemuan np ON np.siswa_id = s.id AND np.ekskul_id = pe.ekskul_id AND np.tanggal = :tgl2 AND np.tahun_ajaran = :t2 AND np.semester = :s2
            WHERE pe.status = 'approved' AND pe.ekskul_id = :eid AND pe.tahun_ajaran = :t3 AND pe.semester = :s3
            ORDER BY k.nama_kelas ASC, s.nama_siswa ASC
        ");
        $stmt_siswa->execute([
            ':eid' => $ekskulId,
            ':eid4' => $ekskulId,
            ':tgl' => $tanggal,
            ':tgl2' => $tanggal,
            ':t1' => $period['tahun_ajaran'], ':s1' => $period['semester'],
            ':t2' => $period['tahun_ajaran'], ':s2' => $period['semester'],
            ':t3' => $period['tahun_ajaran'], ':s3' => $period['semester'],
            ':t4' => $period['tahun_ajaran'], ':s4' => $period['semester']
        ]);

        successResponse([
            'tanggal' => $tanggal,
            'ekskul_id' => $ekskulId,
            'materi'  => $jurnal['materi'] ?? '',
            'catatan' => $jurnal['catatan'] ?? '',
            'daftar_pertemuan' => $listDates,
            'siswa'   => $stmt_siswa->fetchAll(PDO::FETCH_ASSOC)
        ]);
    }

    /**
     * POST /api/pelatih/nilai/pertemuan
     */
    public static function savePertemuanNilai(): void
    {
        $user = requireRole('pelatih', 'pendamping');
        $data = getRequestBody();
        $db = getDB();
        $period = getActivePeriod();

        $ekskulId = 0;
        if ($user->role === 'pelatih') {
            $stmt = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
            $stmt->execute([':id' => $user->ref_id]);
            $ekskulId = (int)$stmt->fetchColumn();
        } else {
            $ekskulId = (int)($data['ekskul_id'] ?? 0);
        }

        $tanggal = $data['tanggal'] ?? date('Y-m-d');
        $materi  = trim($data['materi'] ?? '');
        $nilaiList = $data['nilai'] ?? [];

        if (empty($ekskulId)) {
            errorResponse('Ekskul tidak valid', 400);
        }

        // Simpan / update materi jurnal pertemuan jika diisi
        if (!empty($materi)) {
            $stmt_jurnal = $db->prepare("
                INSERT INTO jurnal_ekskul (ekskul_id, tanggal, materi, tahun_ajaran, semester)
                VALUES (:eid, :tgl, :materi, :t, :s)
                ON DUPLICATE KEY UPDATE materi = :materi_upd
            ");
            $stmt_jurnal->execute([
                ':eid' => $ekskulId,
                ':tgl' => $tanggal,
                ':materi' => $materi,
                ':t' => $period['tahun_ajaran'],
                ':s' => $period['semester'],
                ':materi_upd' => $materi
            ]);
        }

        $db->beginTransaction();
        try {
            $stmt_ins = $db->prepare("
                INSERT INTO nilai_pertemuan (ekskul_id, siswa_id, tanggal, nilai, catatan, tahun_ajaran, semester)
                VALUES (:eid, :sid, :tgl, :nilai, :catatan, :t, :s)
                ON DUPLICATE KEY UPDATE nilai = :nilai_upd, catatan = :catatan_upd
            ");

            foreach ($nilaiList as $item) {
                $siswaId = (int)($item['siswa_id'] ?? 0);
                $nilai = (int)($item['nilai'] ?? 0);
                $catatan = trim($item['catatan'] ?? '');

                if ($siswaId > 0) {
                    $stmt_ins->execute([
                        ':eid' => $ekskulId,
                        ':sid' => $siswaId,
                        ':tgl' => $tanggal,
                        ':nilai' => $nilai,
                        ':catatan' => $catatan,
                        ':t' => $period['tahun_ajaran'],
                        ':s' => $period['semester'],
                        ':nilai_upd' => $nilai,
                        ':catatan_upd' => $catatan
                    ]);
                }
            }

            // Sinkronkan nilai akhir semester otomatis setelah nilai pertemuan disimpan!
            self::syncNilaiAkhirSemester($db, $ekskulId, $period['tahun_ajaran'], $period['semester']);

            $db->commit();
            successResponse(null, "Nilai pertemuan tanggal $tanggal berhasil disimpan dan nilai akhir rapor disinkronkan.");
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse('Gagal menyimpan nilai pertemuan: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/pelatih/monitoring-nilai
     * Menampilkan rekap perkembangan nilai siswa KHUSUS untuk ekskul pelatih tersebut
     * Termasuk: % kehadiran, rata-rata latihan per pertemuan, nilai akhir, predikat, dan riwayat pertemuan
     */
    public static function monitoringPelatih(): void
    {
        $user = requireRole('pelatih');
        $db = getDB();
        $period = getActivePeriod();

        // 1. Dapatkan ekskul_id pelatih
        $stmt_e = $db->prepare("SELECT p.ekskul_id, e.nama_ekskul, p.id as pelatih_id FROM pelatih p JOIN ekstrakurikuler e ON p.ekskul_id = e.id WHERE p.id = :id");
        $stmt_e->execute([':id' => $user->ref_id]);
        $pelatih = $stmt_e->fetch(PDO::FETCH_ASSOC);

        if (!$pelatih) {
            errorResponse('Data pelatih tidak ditemukan', 404);
        }

        $ekskulId = (int)$pelatih['ekskul_id'];
        $pelatihId = (int)$pelatih['pelatih_id'];
        $namaEkskul = $pelatih['nama_ekskul'];
        $tahun = $period['tahun_ajaran'];
        $semester = $period['semester'];

        // 2. Hitung total pertemuan absensi
        $stmt_tot = $db->prepare("
            SELECT COUNT(DISTINCT tanggal) 
            FROM absensi 
            WHERE id_pelatih = :pid AND tahun_ajaran = :t AND semester = :s
        ");
        $stmt_tot->execute([':pid' => $pelatihId, ':t' => $tahun, ':s' => $semester]);
        $totalPertemuan = (int)$stmt_tot->fetchColumn();
        $totalPertemuanHitung = $totalPertemuan > 0 ? $totalPertemuan : 1;

        // 3. Ambil daftar aspek dan bobot ekskul ini
        $stmt_aspek = $db->prepare("SELECT id, nama_aspek, bobot FROM aspek_penilaian_ekskul WHERE ekskul_id = :eid ORDER BY id ASC");
        $stmt_aspek->execute([':eid' => $ekskulId]);
        $aspekList = $stmt_aspek->fetchAll(PDO::FETCH_ASSOC);

        // 4. Ambil data siswa approved di ekskul ini
        $stmt_siswa = $db->prepare("
            SELECT s.id, s.no_induk, s.nama_siswa, k.nama_kelas,
                   ne.nilai as nilai_akhir, ne.keterangan as capaian,
                   (SELECT COUNT(*) FROM absensi a WHERE a.id_siswa = s.id AND a.id_pelatih = :pid AND a.status = 'Hadir' AND a.tahun_ajaran = :t1 AND a.semester = :s1) as hadir_count,
                   (SELECT COUNT(*) FROM absensi a WHERE a.id_siswa = s.id AND a.id_pelatih = :pid2 AND a.status = 'Izin' AND a.tahun_ajaran = :t2 AND a.semester = :s2) as izin_count,
                   (SELECT COUNT(*) FROM absensi a WHERE a.id_siswa = s.id AND a.id_pelatih = :pid3 AND a.status = 'Sakit' AND a.tahun_ajaran = :t3 AND a.semester = :s3) as sakit_count,
                   (SELECT COUNT(*) FROM absensi a WHERE a.id_siswa = s.id AND a.id_pelatih = :pid4 AND a.status = 'Alfa' AND a.tahun_ajaran = :t4 AND a.semester = :s4) as alfa_count,
                   (SELECT AVG(nilai) FROM nilai_pertemuan np WHERE np.ekskul_id = :eid1 AND np.siswa_id = s.id AND np.tahun_ajaran = :t5 AND np.semester = :s5) as rata_rata_pertemuan,
                   (SELECT COUNT(DISTINCT tanggal) FROM nilai_pertemuan np WHERE np.ekskul_id = :eid2 AND np.siswa_id = s.id AND np.tahun_ajaran = :t6 AND np.semester = :s6) as jumlah_pertemuan_dinilai
            FROM pendaftaran_ekskul pe
            JOIN siswa s ON pe.siswa_id = s.id
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN nilai_ekskul ne ON ne.siswa_id = s.id AND ne.ekskul_id = pe.ekskul_id AND ne.tahun = :t7 AND ne.semester = :s7
            WHERE pe.status = 'approved' AND pe.ekskul_id = :eid AND pe.tahun_ajaran = :t8 AND pe.semester = :s8
            ORDER BY k.nama_kelas ASC, s.nama_siswa ASC
        ");
        $stmt_siswa->execute([
            ':pid' => $pelatihId, ':pid2' => $pelatihId, ':pid3' => $pelatihId, ':pid4' => $pelatihId,
            ':eid1' => $ekskulId, ':eid2' => $ekskulId, ':eid' => $ekskulId,
            ':t1' => $tahun, ':s1' => $semester,
            ':t2' => $tahun, ':s2' => $semester,
            ':t3' => $tahun, ':s3' => $semester,
            ':t4' => $tahun, ':s4' => $semester,
            ':t5' => $tahun, ':s5' => $semester,
            ':t6' => $tahun, ':s6' => $semester,
            ':t7' => $tahun, ':s7' => $semester,
            ':t8' => $tahun, ':s8' => $semester,
        ]);
        $rows = $stmt_siswa->fetchAll(PDO::FETCH_ASSOC);

        $resultSiswa = [];
        foreach ($rows as $r) {
            $hadir = (int)$r['hadir_count'];
            $persenKehadiran = round(($hadir / $totalPertemuanHitung) * 100);
            $avgPertemuan = $r['rata_rata_pertemuan'] !== null ? round((float)$r['rata_rata_pertemuan'], 1) : 0;
            $nilaiAkhir = $r['nilai_akhir'] !== null ? (int)$r['nilai_akhir'] : 0;

            $predikat = '-';
            if ($nilaiAkhir >= 85) $predikat = 'A';
            else if ($nilaiAkhir >= 75) $predikat = 'B';
            else if ($nilaiAkhir >= 60) $predikat = 'C';
            else if ($nilaiAkhir > 0) $predikat = 'D';

            // Indikator perkembangan
            $statusPerkembangan = 'Stabil';
            if ($avgPertemuan >= 85) $statusPerkembangan = 'Sangat Baik';
            else if ($avgPertemuan >= 75) $statusPerkembangan = 'Baik';
            else if ($avgPertemuan >= 60) $statusPerkembangan = 'Cukup';
            else if ($avgPertemuan > 0) $statusPerkembangan = 'Perlu Bimbingan';

            $resultSiswa[] = [
                'id' => (int)$r['id'],
                'no_induk' => $r['no_induk'],
                'nama_siswa' => $r['nama_siswa'],
                'nama_kelas' => $r['nama_kelas'] ?? '-',
                'kehadiran' => [
                    'hadir' => $hadir,
                    'izin' => (int)$r['izin_count'],
                    'sakit' => (int)$r['sakit_count'],
                    'alfa' => (int)$r['alfa_count'],
                    'persen' => $persenKehadiran,
                    'total_pertemuan' => $totalPertemuan
                ],
                'rata_rata_latihan' => $avgPertemuan,
                'pertemuan_dinilai' => (int)$r['jumlah_pertemuan_dinilai'],
                'nilai_akhir' => $nilaiAkhir,
                'predikat' => $predikat,
                'status_perkembangan' => $statusPerkembangan,
                'capaian' => $r['capaian'] ?? ''
            ];
        }

        successResponse([
            'ekskul' => [
                'id' => $ekskulId,
                'nama' => $namaEkskul,
                'total_pertemuan' => $totalPertemuan,
                'bobot_aspek' => $aspekList
            ],
            'tahun_ajaran' => $tahun,
            'semester' => $semester,
            'siswa' => $resultSiswa
        ]);
    }
}
