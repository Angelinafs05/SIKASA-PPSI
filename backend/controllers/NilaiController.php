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
        
        $stmt = $db->prepare("
            SELECT n.ekskul_id, n.nilai, n.keterangan, e.nama_ekskul, p.nama_pelatih
            FROM nilai_ekskul n
            JOIN ekstrakurikuler e ON n.ekskul_id = e.id
            LEFT JOIN pelatih p ON n.pelatih_id = p.id
            WHERE n.siswa_id = :sid AND n.semester = :sem AND n.tahun = :thn
            ORDER BY e.nama_ekskul ASC
        ");
        
        $stmt->execute([
            ':sid' => $user->ref_id,
            ':sem' => $semester,
            ':thn' => $tahun
        ]);
        
        $nilaiData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch detail aspek if any
        foreach($nilaiData as &$n) {
            $stmt_detail = $db->prepare("
                SELECT ap.nama_aspek, nas.nilai 
                FROM nilai_aspek_siswa nas
                JOIN aspek_penilaian_ekskul ap ON nas.aspek_id = ap.id
                WHERE nas.siswa_id = :sid AND nas.ekskul_id = :eid AND nas.semester = :sem AND nas.tahun = :thn
            ");
            $stmt_detail->execute([
                ':sid' => $user->ref_id,
                ':eid' => $n['ekskul_id'],
                ':sem' => $semester,
                ':thn' => $tahun
            ]);
            $n['detail_aspek'] = $stmt_detail->fetchAll(PDO::FETCH_ASSOC);
        }

        successResponse([
            'semester' => $semester,
            'tahun' => $tahun,
            'nilai' => $nilaiData
        ]);
    }
}
