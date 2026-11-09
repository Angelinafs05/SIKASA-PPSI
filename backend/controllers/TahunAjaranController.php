<?php
/**
 * TahunAjaranController - Manage Academic Years, Semester Transitions & Promotion
 * Mengikuti pola dan logika ame-me/sistem_presensi
 */

class TahunAjaranController {

    /**
     * GET /api/admin/tahun-ajaran
     */
    public static function index(): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();

        $activePeriod = getActivePeriod();

        // Ambil daftar tahun ajaran dan statistik siswa
        $stmt = $db->query("
            SELECT ta.*,
                (SELECT COUNT(*) FROM riwayat_kelas rk JOIN siswa s ON rk.siswa_id = s.id WHERE rk.tahun_ajaran = ta.tahun AND s.status = 'aktif') AS total_siswa_aktif,
                (SELECT COUNT(*) FROM siswa s WHERE s.status = 'alumni') AS total_alumni
            FROM tahun_ajaran ta
            ORDER BY ta.tahun DESC, CASE WHEN ta.semester = 'Genap' THEN 2 ELSE 1 END DESC
        ");
        $periods = $stmt->fetchAll();

        successResponse([
            'periods' => $periods,
            'active_period' => $activePeriod
        ]);
    }

    /**
     * POST /api/admin/tahun-ajaran
     * Tambah Tahun Ajaran Baru dengan Mode 'same_year' atau 'new_year'
     * Logika ame-me/sistem_presensi:
     * - same_year (misal Ganjil -> Genap): Siswa tetap di kelas yang sama
     * - new_year (misal 2024/2025 Genap -> 2025/2026 Ganjil):
     *     * Siswa kelas 9 (IX) otomatis LULUS (status = alumni)
     *     * Siswa kelas 7 (VII) naik ke kelas 8 (VIII)
     *     * Siswa kelas 8 (VIII) naik ke kelas 9 (IX)
     */
    public static function store(): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();

        $academicYear = trim($data['tahun'] ?? ''); // e.g. "2026/2027"
        $semester = trim($data['semester'] ?? ''); // "Ganjil" atau "Genap"

        if (!preg_match('/^(\d{4})\/(\d{4})$/', $academicYear, $matches)) {
            errorResponse('Format tahun ajaran tidak valid. Contoh: 2025/2026', 400);
        }
        $startYear = (int)$matches[1];
        $endYear = (int)$matches[2];
        if ($endYear !== $startYear + 1) {
            errorResponse('Tahun ajaran harus berurutan 1 tahun (misal: 2025/2026)', 400);
        }

        if (!in_array($semester, ['Ganjil', 'Genap'], true)) {
            errorResponse('Semester harus Ganjil atau Genap', 400);
        }

        $namaPeriode = "$academicYear $semester";

        // Cek apakah sudah ada
        $checkStmt = $db->prepare("SELECT id FROM tahun_ajaran WHERE nama = :nama");
        $checkStmt->execute([':nama' => $namaPeriode]);
        if ($checkStmt->fetch()) {
            errorResponse("Tahun ajaran $namaPeriode sudah ada", 409);
        }

        // Cari periode sumber terakhir
        $sourceStmt = $db->query("
            SELECT * FROM tahun_ajaran 
            ORDER BY tahun DESC, CASE WHEN semester = 'Genap' THEN 2 ELSE 1 END DESC 
            LIMIT 1
        ");
        $source = $sourceStmt->fetch();

        try {
            $db->beginTransaction();

            // Insert periode baru
            $insertStmt = $db->prepare("INSERT INTO tahun_ajaran (nama, tahun, semester, status) VALUES (:nama, :tahun, :semester, 'nonaktif')");
            $insertStmt->execute([
                ':nama' => $namaPeriode,
                ':tahun' => $academicYear,
                ':semester' => $semester
            ]);

            $summary = [
                'mode' => 'initial',
                'graduated' => 0,
                'promoted' => 0,
                'retained' => 0
            ];

            if ($source) {
                $sourceYear = $source['tahun'];
                $isNewYear = ($academicYear !== $sourceYear);

                if (!$isNewYear) {
                    // MODE: SAME YEAR (Semester Ganjil -> Genap dalam tahun yang sama)
                    // Siswa tetap di kelas yang sama di tahun_ajaran tersebut
                    $summary['mode'] = 'same_year';
                } else {
                    // MODE: NEW YEAR (Tahun Ajaran Baru)
                    $summary['mode'] = 'new_year';

                    // 1. Ambil semua siswa yang aktif di tahun ajaran sebelumnya
                    $siswaSql = "
                        SELECT s.id, s.nama_siswa, rk.kelas_id, k.nama_kelas
                        FROM siswa s
                        JOIN riwayat_kelas rk ON s.id = rk.siswa_id AND rk.tahun_ajaran = :prev_tahun
                        JOIN kelas k ON rk.kelas_id = k.id
                        WHERE s.status = 'aktif'
                    ";
                    $stmtSiswa = $db->prepare($siswaSql);
                    $stmtSiswa->execute([':prev_tahun' => $sourceYear]);
                    $activeStudents = $stmtSiswa->fetchAll();

                    // Ambil seluruh kelas master
                    $allKelasStmt = $db->query("SELECT id, nama_kelas FROM kelas");
                    $allKelas = $allKelasStmt->fetchAll();
                    $kelasMap = [];
                    foreach ($allKelas as $k) {
                        $kelasMap[strtoupper(trim($k['nama_kelas']))] = $k['id'];
                    }

                    $insertRiwayat = $db->prepare("
                        INSERT INTO riwayat_kelas (siswa_id, kelas_id, tahun_ajaran) 
                        VALUES (:siswa_id, :kelas_id, :tahun_ajaran)
                        ON DUPLICATE KEY UPDATE kelas_id = :kelas_id_update
                    ");

                    $updateAlumni = $db->prepare("UPDATE siswa SET status = 'alumni', academic_status = 'LULUS', kelas_id = NULL WHERE id = :id");
                    $updateSiswaKelas = $db->prepare("UPDATE siswa SET kelas_id = :kelas_id, academic_status = 'PERLU_PENEMPATAN' WHERE id = :id");

                    foreach ($activeStudents as $stu) {
                        $cName = strtoupper(trim($stu['nama_kelas']));

                        // Cek kelas IX / 9 -> LULUS
                        if (preg_match('/^IX\b|^9\b/i', $cName)) {
                            $updateAlumni->execute([':id' => $stu['id']]);
                            $summary['graduated']++;
                        }
                        // Cek kelas VII / 7 -> Naik ke VIII
                        elseif (preg_match('/^VII\b|^7\b/i', $cName)) {
                            // Ganti VII ke VIII atau 7 ke 8
                            $promotedName = preg_replace('/^VII\b/i', 'VIII', $cName);
                            if ($promotedName === $cName) {
                                $promotedName = preg_replace('/^7\b/i', '8', $cName);
                            }
                            $targetKelasId = $kelasMap[$promotedName] ?? null;

                            if ($targetKelasId) {
                                $insertRiwayat->execute([
                                    ':siswa_id' => $stu['id'],
                                    ':kelas_id' => $targetKelasId,
                                    ':tahun_ajaran' => $academicYear,
                                    ':kelas_id_update' => $targetKelasId
                                ]);
                                $updateSiswaKelas->execute([
                                    ':kelas_id' => $targetKelasId,
                                    ':id' => $stu['id']
                                ]);
                                $summary['promoted']++;
                            }
                        }
                        // Cek kelas VIII / 8 -> Naik ke IX
                        elseif (preg_match('/^VIII\b|^8\b/i', $cName)) {
                            $promotedName = preg_replace('/^VIII\b/i', 'IX', $cName);
                            if ($promotedName === $cName) {
                                $promotedName = preg_replace('/^8\b/i', '9', $cName);
                            }
                            $targetKelasId = $kelasMap[$promotedName] ?? null;

                            if ($targetKelasId) {
                                $insertRiwayat->execute([
                                    ':siswa_id' => $stu['id'],
                                    ':kelas_id' => $targetKelasId,
                                    ':tahun_ajaran' => $academicYear,
                                    ':kelas_id_update' => $targetKelasId
                                ]);
                                $updateSiswaKelas->execute([
                                    ':kelas_id' => $targetKelasId,
                                    ':id' => $stu['id']
                                ]);
                                $summary['promoted']++;
                            }
                        }
                    }
                }
            }

            $db->commit();
            successResponse($summary, "Tahun ajaran $namaPeriode berhasil dibuat");
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse("Gagal membuat tahun ajaran: " . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/admin/tahun-ajaran/activate
     * Mengaktifkan Tahun Ajaran Tertentu
     */
    public static function activate(): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();

        $id = (int)($data['id'] ?? 0);
        if (!$id) {
            errorResponse('ID Tahun Ajaran tidak valid', 400);
        }

        $stmt = $db->prepare("SELECT * FROM tahun_ajaran WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $target = $stmt->fetch();
        if (!$target) {
            errorResponse('Tahun ajaran tidak ditemukan', 404);
        }

        try {
            $db->beginTransaction();

            // Set semua jadi nonaktif
            $db->exec("UPDATE tahun_ajaran SET status = 'nonaktif'");

            // Set target jadi aktif
            $updateStmt = $db->prepare("UPDATE tahun_ajaran SET status = 'aktif' WHERE id = :id");
            $updateStmt->execute([':id' => $id]);

            // Sinkronkan ke tabel pengaturan
            $stmt1 = $db->prepare("INSERT INTO pengaturan (kunci, nilai) VALUES ('tahun_ajaran_aktif', :v1) ON DUPLICATE KEY UPDATE nilai = :v2");
            $stmt1->execute([':v1' => $target['tahun'], ':v2' => $target['tahun']]);

            $stmt2 = $db->prepare("INSERT INTO pengaturan (kunci, nilai) VALUES ('semester_aktif', :v1) ON DUPLICATE KEY UPDATE nilai = :v2");
            $stmt2->execute([':v1' => $target['semester'], ':v2' => $target['semester']]);

            $db->commit();
            successResponse($target, "Tahun ajaran {$target['nama']} sekarang aktif sebagai periode sistem");
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse("Gagal mengaktifkan tahun ajaran: " . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/admin/tahun-ajaran/{id}
     */
    public static function destroy(int $id): void {
        requireRole('admin');
        $db = getDB();

        $stmt = $db->prepare("SELECT * FROM tahun_ajaran WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $target = $stmt->fetch();
        if (!$target) {
            errorResponse('Tahun ajaran tidak ditemukan', 404);
        }

        if ($target['status'] === 'aktif') {
            errorResponse('Tidak dapat menghapus tahun ajaran yang sedang aktif', 400);
        }

        try {
            $deleteStmt = $db->prepare("DELETE FROM tahun_ajaran WHERE id = :id");
            $deleteStmt->execute([':id' => $id]);
            successResponse(null, "Tahun ajaran {$target['nama']} berhasil dihapus");
        } catch (Exception $e) {
            errorResponse("Gagal menghapus tahun ajaran: " . $e->getMessage(), 500);
        }
    }
}

