<?php
/**
 * Nilai Controller (Pelatih)
 */

class NilaiController {
    
    /**
     * GET /api/pelatih/nilai?semester=Ganjil&tahun=2025
     */
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
        
        successResponse([
            'semester' => $semester,
            'tahun'    => $tahun,
            'siswa'    => $stmt2->fetchAll(),
        ]);
    }
    
    /**
     * POST /api/pelatih/nilai
     * Body: { "semester": "Ganjil", "tahun": "2025", "nilai": [{ "siswa_id": 1, "nilai": 85, "keterangan": "Baik" }] }
     */
    public static function store(): void {
        $user = requireRole('pelatih');
        $data = getRequestBody();
        $db = getDB();
        
        $period = getActivePeriod();
        $semester  = $data['semester'] ?? $period['semester'];
        $tahun     = $data['tahun']    ?? $period['tahun_ajaran'];
        $nilaiList = $data['nilai'] ?? [];
        $idPelatih = $user->ref_id;
        
        if (empty($nilaiList)) {
            errorResponse('Data nilai tidak boleh kosong', 400);
        }
        
        // Ambil ekskul pelatih
        $stmt_e = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
        $stmt_e->execute([':id' => $idPelatih]);
        $pelatih = $stmt_e->fetch();
        $ekskulId = $pelatih['ekskul_id'] ?? 0;
        
        foreach ($nilaiList as $item) {
            $siswaId = (int) ($item['siswa_id'] ?? 0);
            $nilai   = (int) ($item['nilai'] ?? 0);
            $ket     = trim($item['keterangan'] ?? '');
            
            // Cek batasan nilai jika alfa >= 3
            $stmt_alfa = $db->prepare("SELECT COUNT(*) FROM absensi WHERE id_siswa = :sid AND id_pelatih = :pid AND status = 'Alfa' AND tahun_ajaran = :t1 AND semester = :s1");
            $stmt_alfa->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':t1' => $tahun, ':s1' => $semester]);
            $alfaCount = $stmt_alfa->fetchColumn();
            
            if ($alfaCount >= 3 && $nilai >= 60) {
                $nama_siswa = $db->query("SELECT nama_siswa FROM siswa WHERE id = $siswaId")->fetchColumn();
                errorResponse("Siswa $nama_siswa sudah 3 kali absen (Alfa). Maksimal nilai yang dapat diinput adalah 59.", 400);
            }
            
            // Cek existing
            $cek = $db->prepare("SELECT id FROM nilai_ekskul WHERE siswa_id = :sid AND ekskul_id = :eid AND semester = :sem AND tahun = :thn");
            $cek->execute([':sid' => $siswaId, ':eid' => $ekskulId, ':sem' => $semester, ':thn' => $tahun]);
            
            if ($cek->fetch()) {
                // Update
                $db->prepare("UPDATE nilai_ekskul SET nilai = :nilai, keterangan = :ket WHERE siswa_id = :sid AND ekskul_id = :eid AND semester = :sem AND tahun = :thn")
                   ->execute([':nilai' => $nilai, ':ket' => $ket, ':sid' => $siswaId, ':eid' => $ekskulId, ':sem' => $semester, ':thn' => $tahun]);
            } else {
                // Insert
                $db->prepare("INSERT INTO nilai_ekskul (siswa_id, ekskul_id, pelatih_id, nilai, keterangan, semester, tahun) VALUES (:sid, :eid, :pid, :nilai, :ket, :sem, :thn)")
                   ->execute([':sid' => $siswaId, ':eid' => $ekskulId, ':pid' => $idPelatih, ':nilai' => $nilai, ':ket' => $ket, ':sem' => $semester, ':thn' => $tahun]);
            }
        }
        
        successResponse(null, 'Nilai berhasil disimpan');
    }

    /**
     * GET /api/pendamping/nilai?ekskul_id=...&semester=...&tahun=...
     */
    public static function pendampingIndex(): void {
        $user = requireRole('pendamping');
        $db = getDB();
        
        $period = getActivePeriod();
        $ekskulId = $_GET['ekskul_id'] ?? 0;
        $semester = $_GET['semester'] ?? $period['semester'];
        $tahun    = $_GET['tahun']    ?? $period['tahun_ajaran'];
        
        if (empty($ekskulId)) {
            successResponse(['semester' => $semester, 'tahun' => $tahun, 'ekskul_id' => null, 'siswa' => []]);
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
        
        successResponse([
            'semester' => $semester,
            'tahun'    => $tahun,
            'ekskul_id' => $ekskulId,
            'siswa'    => $stmt2->fetchAll(),
        ]);
    }

    /**
     * POST /api/pendamping/nilai
     */
    public static function pendampingStore(): void {
        $user = requireRole('pendamping');
        $data = getRequestBody();
        $db = getDB();
        
        $period = getActivePeriod();
        $ekskulId  = $data['ekskul_id'] ?? 0;
        $semester  = $data['semester'] ?? $period['semester'];
        $tahun     = $data['tahun']    ?? $period['tahun_ajaran'];
        $nilaiList = $data['nilai'] ?? [];
        $guruId = $user->ref_id;

        if (empty($nilaiList) || empty($ekskulId)) {
            errorResponse('Data nilai atau ekskul tidak valid', 400);
        }

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
            ':t' => $period['tahun_ajaran'],
            ':s' => $period['semester']
        ]);
        $pelatih = $stmt_check->fetch();
        
        if (!$pelatih) {
            errorResponse('Anda tidak memiliki akses ke ekskul ini', 403);
        }
        
        $idPelatih = $pelatih['pelatih_id'];
        
        foreach ($nilaiList as $item) {
            $siswaId = (int) ($item['siswa_id'] ?? 0);
            $nilai   = (int) ($item['nilai'] ?? 0);
            $ket     = trim($item['keterangan'] ?? '');
            
            // Cek existing
            $cek = $db->prepare("SELECT id FROM nilai_ekskul WHERE siswa_id = :sid AND ekskul_id = :eid AND semester = :sem AND tahun = :thn");
            $cek->execute([':sid' => $siswaId, ':eid' => $ekskulId, ':sem' => $semester, ':thn' => $tahun]);
            
            if ($cek->fetch()) {
                // Update
                $db->prepare("UPDATE nilai_ekskul SET nilai = :nilai, keterangan = :ket, pelatih_id = :pid WHERE siswa_id = :sid AND ekskul_id = :eid AND semester = :sem AND tahun = :thn")
                   ->execute([':nilai' => $nilai, ':ket' => $ket, ':pid' => $idPelatih, ':sid' => $siswaId, ':eid' => $ekskulId, ':sem' => $semester, ':thn' => $tahun]);
            } else {
                // Insert
                $db->prepare("INSERT INTO nilai_ekskul (siswa_id, ekskul_id, pelatih_id, nilai, keterangan, semester, tahun) VALUES (:sid, :eid, :pid, :nilai, :ket, :sem, :thn)")
                   ->execute([':sid' => $siswaId, ':eid' => $ekskulId, ':pid' => $idPelatih, ':nilai' => $nilai, ':ket' => $ket, ':sem' => $semester, ':thn' => $tahun]);
            }
        }
        
        successResponse(null, 'Nilai berhasil disimpan');
    }

    /**
     * GET /api/siswa/nilai
     */
    public static function siswaIndex(): void {
        $user = requireRole('siswa');
        $db = getDB();
        
        $period = getActivePeriod();
        $semester = $_GET['semester'] ?? $period['semester'];
        $tahun    = $_GET['tahun']    ?? $period['tahun_ajaran'];
        
        $stmt = $db->prepare("
            SELECT n.nilai, n.keterangan, e.nama_ekskul, p.nama_pelatih
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
        
        successResponse([
            'semester' => $semester,
            'tahun' => $tahun,
            'nilai' => $stmt->fetchAll()
        ]);
    }
}
