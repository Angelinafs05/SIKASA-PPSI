<?php

/**
 * Ekskul Controller - CRUD Ekstrakurikuler
 */

class EkskulController
{

    /**
     * GET /api/admin/ekskul
     */
    public static function index(): void
    {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();

        $period = getActivePeriod();
        $stmt = $db->prepare("
            SELECT e.*, p.id AS pelatih_id, p.nama_pelatih AS pelatih_nama, g.nama_guru AS pendamping,
                   (SELECT COUNT(*) FROM pendaftaran_ekskul pe 
                    WHERE pe.ekskul_id = e.id
                    AND pe.status = 'approved' AND pe.tahun_ajaran = :t1) AS total_siswa
            FROM ekstrakurikuler e
            LEFT JOIN pelatih p ON p.ekskul_id = e.id
            LEFT JOIN guru_pendamping g ON p.guru_id = g.id
            ORDER BY 
                FIELD(SUBSTRING_INDEX(e.hari, ',', 1), 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') ASC, 
                e.nama_ekskul ASC
        ");
        $stmt->execute([
            ':t1' => $period['tahun_ajaran']
        ]);

        $rawEkskul = $stmt->fetchAll();
        $ekskuls = [];
        $seenNames = [];
        foreach ($rawEkskul as $e) {
            if (!in_array($e['nama_ekskul'], $seenNames)) {
                $ekskuls[] = $e;
                $seenNames[] = $e['nama_ekskul'];
            }
        }

        successResponse($ekskuls);
    }

    /**
     * GET /api/admin/kelas
     */
    public static function listKelas(): void
    {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        $stmt = $db->query("SELECT * FROM kelas ORDER BY nama_kelas ASC");
        successResponse($stmt->fetchAll());
    }

    /**
     * GET /api/admin/ekskul/{id}
     */
    public static function show(int $id): void
    {
        requireRole('admin', 'siswa', 'kepala_sekolah');
        $db = getDB();

        $stmt = $db->prepare("
            SELECT e.*, p.id AS pelatih_id, p.nama_pelatih AS pelatih_nama
            FROM ekstrakurikuler e
            LEFT JOIN pelatih p ON p.ekskul_id = e.id
            WHERE e.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $ekskul = $stmt->fetch();

        if (!$ekskul) {
            errorResponse('Ekstrakurikuler tidak ditemukan', 404);
        }

        successResponse($ekskul);
    }

    /**
     * POST /api/admin/ekskul
     */
    public static function store(): void
    {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();

        $nama      = trim($data['nama_ekskul'] ?? '');
        $pelatihId = $data['pelatih_id'] ?? null;
        $hari      = trim($data['hari'] ?? '');
        $jam       = trim($data['jam'] ?? '');
        $tempat    = trim($data['tempat'] ?? '');
        $pendamping = trim($data['pendamping'] ?? '');
        $targetKelas = $data['target_kelas'] ?? null; // JSON or comma separated string
        $isSeleksi = isset($data['is_seleksi']) ? (int)$data['is_seleksi'] : 0;

        if (empty($nama)) {
            errorResponse('Nama ekskul wajib diisi', 400);
        }

        // Ambil nama pelatih
        $pelatihNama = '';
        if ($pelatihId) {
            $stmt = $db->prepare("SELECT nama_pelatih FROM pelatih WHERE id = :id");
            $stmt->execute([':id' => $pelatihId]);
            $p = $stmt->fetch();
            $pelatihNama = $p['nama_pelatih'] ?? '';
        }

        $period = getActivePeriod();

        $stmt = $db->prepare("
            INSERT INTO ekstrakurikuler (nama_ekskul, pelatih, hari, jam, tempat, target_kelas, is_seleksi, tahun_ajaran, semester)
            VALUES (:nama, :pelatih, :hari, :jam, :tempat, :target, :seleksi, :tahun, :sem)
        ");
        $stmt->execute([
            ':nama'    => $nama,
            ':pelatih' => $pelatihNama,
            ':hari'    => $hari,
            ':jam'     => $jam,
            ':tempat'  => $tempat,
            ':target'  => is_array($targetKelas) ? json_encode($targetKelas) : $targetKelas,
            ':seleksi' => $isSeleksi,
            ':tahun'   => $period['tahun_ajaran'],
            ':sem'     => $period['semester']
        ]);
        $ekskulId = $db->lastInsertId();

        // Sinkronisasi ekskul_id di tabel pelatih
        if ($pelatihId) {
            $db->prepare("UPDATE pelatih SET ekskul_id = :eid WHERE id = :pid")
                ->execute([':eid' => $ekskulId, ':pid' => $pelatihId]);
        }

        successResponse(['id' => (int) $ekskulId], 'Ekskul berhasil ditambahkan', 201);
    }

    /**
     * PUT /api/admin/ekskul/{id}
     */
    public static function update(int $id): void
    {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();

        $nama   = trim($data['nama_ekskul'] ?? '');
        $pelatihId = $data['pelatih_id'] ?? null;
        $hari   = trim($data['hari'] ?? '');
        $jam    = trim($data['jam'] ?? '');
        $tempat = trim($data['tempat'] ?? '');
        $targetKelas = $data['target_kelas'] ?? null;
        $isSeleksi = isset($data['is_seleksi']) ? (int)$data['is_seleksi'] : 0;

        if (empty($nama)) {
            errorResponse('Nama ekskul wajib diisi', 400);
        }

        // Ambil nama pelatih
        $pelatihNama = '';
        if ($pelatihId) {
            $stmt = $db->prepare("SELECT nama_pelatih FROM pelatih WHERE id = :id");
            $stmt->execute([':id' => $pelatihId]);
            $p = $stmt->fetch();
            $pelatihNama = $p['nama_pelatih'] ?? '';
        } else {
            // If pelatihId is null, set pelatih name to empty
            $pelatihNama = '';
        }

        $stmt = $db->prepare("
            UPDATE ekstrakurikuler SET 
                nama_ekskul = :nama, 
                pelatih = :pelatih, 
                hari = :hari, 
                jam = :jam, 
                tempat = :tempat, 
                target_kelas = :target, 
                is_seleksi = :seleksi 
            WHERE id = :id
        ");
        $stmt->execute([
            ':nama'    => $nama,
            ':pelatih' => $pelatihNama,
            ':hari'    => $hari,
            ':jam'     => $jam,
            ':tempat'  => $tempat,
            ':target'  => is_array($targetKelas) ? json_encode($targetKelas) : $targetKelas,
            ':seleksi' => $isSeleksi,
            ':id'      => $id
        ]);

        if ($stmt->rowCount() === 0) {
            errorResponse('Ekskul tidak ditemukan', 404);
        }

        // Update pelatih_id in pelatih table dan bersihkan ekskul lama pelatih tersebut
        // 1. Bersihkan ekskul lain yang sebelumnya dibina oleh pelatih ini (karena 1 pembina hanya 1 ekskul)
        if ($pelatihId) {
            $stmtPrev = $db->prepare("SELECT ekskul_id, nama_pelatih FROM pelatih WHERE id = :pid");
            $stmtPrev->execute([':pid' => $pelatihId]);
            $prevP = $stmtPrev->fetch();
            if ($prevP && !empty($prevP['ekskul_id']) && $prevP['ekskul_id'] != $id) {
                $db->prepare("UPDATE ekstrakurikuler SET pelatih = '' WHERE id = :old_eid")
                    ->execute([':old_eid' => $prevP['ekskul_id']]);
            }
            // Bersihkan ekskul lain yang tercatat nama pelatih ini
            $db->prepare("UPDATE ekstrakurikuler SET pelatih = '' WHERE pelatih = :pname AND id != :curr_id")
                ->execute([':pname' => $pelatihNama, ':curr_id' => $id]);
        }

        // 2. Clear any existing pelatih_id that was previously assigned to this ekskul
        $db->prepare("UPDATE pelatih SET ekskul_id = NULL WHERE ekskul_id = :eid")
            ->execute([':eid' => $id]);

        // 3. Set the new pelatih_id if provided
        if ($pelatihId) {
            $db->prepare("UPDATE pelatih SET ekskul_id = :eid WHERE id = :pid")
                ->execute([':eid' => $id, ':pid' => $pelatihId]);
        }

        successResponse(null, 'Ekskul berhasil diupdate');
    }

    /**
     * DELETE /api/admin/ekskul/{id}
     */
    public static function destroy(int $id): void
    {
        requireRole('admin');
        $db = getDB();

        // Hapus pendaftaran terkait
        $db->prepare("DELETE FROM pendaftaran_ekskul WHERE ekskul_id = :id")->execute([':id' => $id]);

        // Reset pelatih
        $db->prepare("UPDATE pelatih SET ekskul_id = NULL WHERE ekskul_id = :id")->execute([':id' => $id]);

        // Hapus ekskul
        $stmt = $db->prepare("DELETE FROM ekstrakurikuler WHERE id = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            errorResponse('Ekskul tidak ditemukan', 404);
        }

        successResponse(null, 'Ekskul berhasil dihapus');
    }

    /**
     * GET /api/siswa/ekskul - Daftar ekskul untuk siswa
     */
    public static function siswaEkskul(): void
    {
        $user = requireRole('siswa');
        $db = getDB();

        $period = getActivePeriod();
        $sid = $user->ref_id;
        $t = $period['tahun_ajaran'];
        $s = $period['semester'];

        // Get student's current class as fallback
        $stmt = $db->prepare("SELECT s.*, k.nama_kelas FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id WHERE s.id = :id");
        $stmt->execute([':id' => $user->ref_id]);
        $siswa = $stmt->fetch();

        if (!$siswa) {
            // Cek apakah mungkin alumni (kelas_id NULL)
            $stmtAlumni = $db->prepare("SELECT status FROM siswa WHERE id = :id");
            $stmtAlumni->execute([':id' => $user->ref_id]);
            $isAlumni = $stmtAlumni->fetchColumn();

            if ($isAlumni === 'alumni') {
                errorResponse('Akses pendaftaran ditutup karena status Anda telah Lulus (Alumni).', 403);
            }
            errorResponse('Data siswa tidak ditemukan', 404);
        }

        // Cek kembali status alumni (meskipun ada kelas_id, jika status alumni tetap blok)
        if ($siswa['status'] === 'alumni') {
            errorResponse('Akses pendaftaran ditutup karena status Anda telah Lulus (Alumni).', 403);
        }

        $namaKelas = $siswa['nama_kelas'] ?? '';

        // Cek riwayat_kelas sesuai tahun ajaran aktif untuk mendapatkan kelas historis yang benar
        $stmtHistory = $db->prepare("
            SELECT k.nama_kelas 
            FROM riwayat_kelas r 
            JOIN kelas k ON r.kelas_id = k.id 
            WHERE r.siswa_id = :sid AND r.tahun_ajaran = :t1
        ");
        $stmtHistory->execute([':sid' => $user->ref_id, ':t1' => $t]);
        $history = $stmtHistory->fetch();

        if ($history && !empty($history['nama_kelas'])) {
            $namaKelas = $history['nama_kelas'];
        }

        $gradeLevel = explode(' ', $namaKelas)[0] ?? '';
        $romanToNum = ['VII' => '7', 'VIII' => '8', 'IX' => '9', 'X' => '10', 'XI' => '11', 'XII' => '12', 'I' => '1', 'II' => '2', 'III' => '3', 'IV' => '4', 'V' => '5', 'VI' => '6'];
        $targetNum = $romanToNum[$gradeLevel] ?? '';

        // Rule: Class 9 (IX) students are NOT allowed to join in Semester 2 (Genap)
        if ($targetNum === '9' && $s === 'Genap') {
            successResponse([], "Siswa kelas IX tidak diperbolehkan mengikuti ekstrakurikuler pada Semester 2.");
            return;
        }

        $stmt = $db->prepare("
            SELECT 
                e.*, 
                p.nama_pelatih AS pelatih_nama, 
                g.nama_guru AS pendamping_nama,
                (SELECT status FROM pendaftaran_ekskul pe 
                 WHERE pe.ekskul_id IN (SELECT id FROM ekstrakurikuler WHERE nama_ekskul = e.nama_ekskul)
                   AND pe.siswa_id = :sid AND pe.tahun_ajaran = :t1 AND pe.semester = :s1 LIMIT 1) AS my_status,
                (SELECT COUNT(*) FROM pendaftaran_ekskul pe 
                 WHERE pe.ekskul_id IN (SELECT id FROM ekstrakurikuler WHERE nama_ekskul = e.nama_ekskul)
                   AND pe.status = 'approved' AND pe.tahun_ajaran = :t2 AND pe.semester = :s2) AS total_siswa
            FROM ekstrakurikuler e
            LEFT JOIN (
                SELECT p_sub.id, p_sub.nama_pelatih, p_sub.guru_id, e_sub.nama_ekskul
                FROM pelatih p_sub
                JOIN ekstrakurikuler e_sub ON p_sub.ekskul_id = e_sub.id
            ) p ON p.nama_ekskul = e.nama_ekskul
            LEFT JOIN guru_pendamping g ON p.guru_id = g.id
            ORDER BY 
                FIELD(SUBSTRING_INDEX(e.hari, ',', 1), 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') ASC, 
                e.nama_ekskul ASC
        ");
        $stmt->execute([
            ':sid' => $sid,
            ':t1' => $t,
            ':s1' => $s,
            ':t2' => $t,
            ':s2' => $s
        ]);

        $rawEkskul = $stmt->fetchAll();
        $ekskuls = [];
        $seenNames = [];
        foreach ($rawEkskul as $e) {
            if (!in_array($e['nama_ekskul'], $seenNames)) {
                $ekskuls[] = $e;
                $seenNames[] = $e['nama_ekskul'];
            }
        }

        $filteredEkskul = [];

        foreach ($ekskuls as $e) {
            if (empty($e['target_kelas']) || $e['target_kelas'] === 'null' || $e['target_kelas'] === '[]') {
                $filteredEkskul[] = $e;
                continue;
            }

            $targets = json_decode($e['target_kelas'], true);
            if (!is_array($targets)) {
                $targets = array_map('trim', explode(',', $e['target_kelas']));
            }

            if (in_array((string)$targetNum, $targets, true)) {
                $filteredEkskul[] = $e;
            }
        }

        successResponse($filteredEkskul);
    }
}
