<?php
/**
 * Siswa Controller - CRUD Siswa (Admin only)
 */

class SiswaController {
    
    /**
     * GET /api/admin/siswa?kelas_id=
     */
    public static function index(): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        
        $kelas_id = $_GET['kelas_id'] ?? null;
        $ekskul_id = $_GET['ekskul_id'] ?? null;
        $status = $_GET['status'] ?? 'aktif'; // Default aktif
        
        $period = getActivePeriod();
        $activeTahun = $period['tahun_ajaran'];

        $sql = "SELECT s.*, rk.kelas_id, k.nama_kelas, u.username,
                (CASE WHEN rk.id IS NOT NULL THEN 'aktif' ELSE s.status END) as status 
                FROM siswa s 
                LEFT JOIN riwayat_kelas rk ON s.id = rk.siswa_id AND rk.tahun_ajaran = :active_tahun
                LEFT JOIN kelas k ON rk.kelas_id = k.id 
                LEFT JOIN users u ON s.id = u.ref_id AND u.role = 'siswa'";
        
        $params = [':active_tahun' => $activeTahun];
        $conditions = [];
        
        if ($status === 'aktif') {
            // Siswa dianggap aktif di tahun tersebut jika memiliki riwayat kelas
            $conditions[] = "rk.id IS NOT NULL";
        } elseif ($status === 'alumni') {
            // Alumni adalah yang status saat ini alumni DAN tidak punya riwayat di tahun aktif tersebut
            $conditions[] = "s.status = 'alumni'";
            $conditions[] = "rk.id IS NULL";
        } elseif ($status === 'all') {
            // Tampilkan semua
        }

        if ($kelas_id) {
            $conditions[] = "rk.kelas_id = :kelas_id";
            $params[':kelas_id'] = $kelas_id;
        }
        
        if ($ekskul_id) {
            $sql .= " INNER JOIN pendaftaran_ekskul pe ON s.id = pe.siswa_id";
            $conditions[] = "pe.ekskul_id = :ekskul_id";
            $conditions[] = "pe.status = 'approved'";
            $conditions[] = "pe.tahun_ajaran = :active_tahun"; // Tambahkan filter tahun ajaran
            $params[':ekskul_id'] = $ekskul_id;
        }
        
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(' AND ', $conditions);
        }
        
        $sql .= " ORDER BY k.nama_kelas ASC, s.nama_siswa ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        successResponse($stmt->fetchAll());
    }

    /**
     * GET /api/admin/siswa/master
     * Digunakan untuk Kenaikan Kelas (menarik data kelas asli di tabel siswa, bukan riwayat)
     */
    public static function masterList(): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        
        $sql = "SELECT s.*, k.nama_kelas, u.username 
                FROM siswa s 
                LEFT JOIN kelas k ON s.kelas_id = k.id 
                LEFT JOIN users u ON s.id = u.ref_id AND u.role = 'siswa'
                WHERE s.status = 'aktif'
                ORDER BY k.nama_kelas ASC, s.nama_siswa ASC";
        
        $stmt = $db->query($sql);
        successResponse($stmt->fetchAll());
    }
    
    /**
     * GET /api/admin/siswa/{id}
     */
    public static function show(int $id): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        
        $period = getActivePeriod();
        $activeTahun = $period['tahun_ajaran'];

        $stmt = $db->prepare("
            SELECT s.*, rk.kelas_id, k.nama_kelas, u.username 
            FROM siswa s 
            LEFT JOIN riwayat_kelas rk ON s.id = rk.siswa_id AND rk.tahun_ajaran = :active_tahun
            LEFT JOIN kelas k ON rk.kelas_id = k.id 
            LEFT JOIN users u ON s.id = u.ref_id AND u.role = 'siswa'
            WHERE s.id = :id
        ");
        $stmt->execute([':id' => $id, ':active_tahun' => $activeTahun]);
        $siswa = $stmt->fetch();
        
        if (!$siswa) {
            errorResponse('Siswa tidak ditemukan', 404);
        }
        
        // Total ekskul diikuti
        $stmt2 = $db->prepare("SELECT COUNT(*) FROM pendaftaran_ekskul WHERE siswa_id = :id AND status = 'approved'");
        $stmt2->execute([':id' => $id]);
        $siswa['total_ekskul'] = (int) $stmt2->fetchColumn();
        
        successResponse($siswa);
    }
    
    /**
     * POST /api/admin/siswa
     */
    public static function store(): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();
        
        $nama       = trim($data['nama_siswa'] ?? '');
        $noInduk    = trim($data['no_induk'] ?? '');
        $tglLahir   = $data['tanggal_lahir'] ?? null;
        $noHp       = trim($data['no_hp'] ?? '');
        $kota       = trim($data['kota'] ?? '');
        $alamat     = trim($data['alamat'] ?? '');
        $namaAyah   = trim($data['nama_ayah'] ?? '');
        $pekerjaanAyah = trim($data['pekerjaan_ayah'] ?? '');
        $namaIbu    = trim($data['nama_ibu'] ?? '');
        $pekerjaanIbu = trim($data['pekerjaan_ibu'] ?? '');
        $kelasId    = $data['kelas_id'] ?? null;
        $username   = trim($data['username'] ?? '');
        $password   = trim($data['password'] ?? '');
        
        if (empty($nama) || empty($kelasId)) {
            errorResponse('Nama siswa dan kelas wajib diisi', 400);
        }
        
        try {
            $db->beginTransaction();

            // Cek apakah username sudah digunakan
            if (!empty($username)) {
                $check = $db->prepare("SELECT id FROM users WHERE username = :u");
                $check->execute([':u' => $username]);
                if ($check->fetch()) {
                    $db->rollBack();
                    errorResponse("Username '$username' sudah digunakan oleh orang lain", 400);
                }
            }

            // Insert siswa
            $stmt = $db->prepare("
                INSERT INTO siswa (nama_siswa, no_induk, tanggal_lahir, no_hp, kota, alamat, nama_ayah, pekerjaan_ayah, nama_ibu, pekerjaan_ibu, kelas_id) 
                VALUES (:nama, :no_induk, :tgl, :hp, :kota, :alamat, :nama_ayah, :pekerjaan_ayah, :nama_ibu, :pekerjaan_ibu, :kelas)
            ");
            $stmt->execute([
                ':nama'           => $nama,
                ':no_induk'       => $noInduk,
                ':tgl'            => $tglLahir,
                ':hp'             => $noHp,
                ':kota'           => $kota,
                ':alamat'         => $alamat,
                ':nama_ayah'      => $namaAyah,
                ':pekerjaan_ayah' => $pekerjaanAyah,
                ':nama_ibu'       => $namaIbu,
                ':pekerjaan_ibu'  => $pekerjaanIbu,
                ':kelas'          => $kelasId,
            ]);
            $siswaId = $db->lastInsertId();
            
            $period = getActivePeriod();
            $stmtRiwayat = $db->prepare("INSERT INTO riwayat_kelas (siswa_id, kelas_id, tahun_ajaran) VALUES (:siswa_id, :kelas_id, :tahun_ajaran)");
            $stmtRiwayat->execute([
                ':siswa_id' => $siswaId,
                ':kelas_id' => $kelasId,
                ':tahun_ajaran' => $period['tahun_ajaran']
            ]);
            
            // Buat akun user jika username diberikan
            if (!empty($username) && !empty($password)) {
                $hashed = password_hash($password, PASSWORD_DEFAULT);
                $stmt2 = $db->prepare("
                    INSERT INTO users (nama, username, password, role, ref_id)
                    VALUES (:nama, :user, :pass, 'siswa', :ref)
                ");
                $stmt2->execute([
                    ':nama' => $nama,
                    ':user' => $username,
                    ':pass' => $hashed,
                    ':ref'  => $siswaId,
                ]);
            }
            
            $db->commit();
            successResponse(['id' => (int) $siswaId], 'Siswa berhasil ditambahkan', 201);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse('Gagal menyimpan data siswa: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * PUT /api/admin/siswa/{id}
     */
    public static function update(int $id): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();
        
        $nama     = trim($data['nama_siswa'] ?? '');
        $noInduk  = trim($data['no_induk'] ?? '');
        $tglLahir = $data['tanggal_lahir'] ?? null;
        $noHp     = trim($data['no_hp'] ?? '');
        $kota     = trim($data['kota'] ?? '');
        $alamat   = trim($data['alamat'] ?? '');
        $namaAyah = trim($data['nama_ayah'] ?? '');
        $pekerjaanAyah = trim($data['pekerjaan_ayah'] ?? '');
        $namaIbu  = trim($data['nama_ibu'] ?? '');
        $pekerjaanIbu = trim($data['pekerjaan_ibu'] ?? '');
        $kelasId  = $data['kelas_id'] ?? null;
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        
        if (empty($nama)) {
            errorResponse('Nama siswa wajib diisi', 400);
        }
        
        try {
            $db->beginTransaction();

            // Cek apakah username sudah digunakan oleh orang lain
            if (!empty($username)) {
                $check = $db->prepare("SELECT id FROM users WHERE username = :u AND NOT (ref_id = :ref AND role = 'siswa')");
                $check->execute([':u' => $username, ':ref' => $id]);
                if ($check->fetch()) {
                    $db->rollBack();
                    errorResponse("Username '$username' sudah digunakan oleh orang lain", 400);
                }
            }

            $stmt = $db->prepare("
                UPDATE siswa SET 
                    nama_siswa = :nama, 
                    no_induk = :no_induk,
                    tanggal_lahir = :tgl, 
                    no_hp = :hp, 
                    kota = :kota,
                    alamat = :alamat,
                    nama_ayah = :nama_ayah,
                    pekerjaan_ayah = :pekerjaan_ayah,
                    nama_ibu = :nama_ibu,
                    pekerjaan_ibu = :pekerjaan_ibu,
                    kelas_id = :kelas 
                WHERE id = :id
            ");
            $stmt->execute([
                ':nama'           => $nama,
                ':no_induk'       => $noInduk,
                ':tgl'            => $tglLahir,
                ':hp'             => $noHp,
                ':kota'           => $kota,
                ':alamat'         => $alamat,
                ':nama_ayah'      => $namaAyah,
                ':pekerjaan_ayah' => $pekerjaanAyah,
                ':nama_ibu'       => $namaIbu,
                ':pekerjaan_ibu'  => $pekerjaanIbu,
                ':kelas'          => $kelasId,
                ':id'             => $id,
            ]);
            
            $period = getActivePeriod();
            $stmtRiwayat = $db->prepare("INSERT INTO riwayat_kelas (siswa_id, kelas_id, tahun_ajaran) VALUES (:siswa_id, :kelas_id, :tahun_ajaran) ON DUPLICATE KEY UPDATE kelas_id = :kelas_id2");
            $stmtRiwayat->execute([
                ':siswa_id' => $id,
                ':kelas_id' => $kelasId,
                ':tahun_ajaran' => $period['tahun_ajaran'],
                ':kelas_id2' => $kelasId
            ]);
            
            // Update/Create user account
            if (!empty($username)) {
                // Cek apakah user sudah ada
                $stmtUser = $db->prepare("SELECT id FROM users WHERE ref_id = :ref AND role = 'siswa'");
                $stmtUser->execute([':ref' => $id]);
                $existingUser = $stmtUser->fetch();
                
                if ($existingUser) {
                    // Update username
                    if (!empty($password)) {
                        $hashed = password_hash($password, PASSWORD_DEFAULT);
                        $stmtUpdate = $db->prepare("UPDATE users SET username = :user, password = :pass, nama = :nama WHERE id = :uid");
                        $stmtUpdate->execute([':user' => $username, ':pass' => $hashed, ':nama' => $nama, ':uid' => $existingUser['id']]);
                    } else {
                        $stmtUpdate = $db->prepare("UPDATE users SET username = :user, nama = :nama WHERE id = :uid");
                        $stmtUpdate->execute([':user' => $username, ':nama' => $nama, ':uid' => $existingUser['id']]);
                    }
                } else {
                    // Create new user if password is also provided
                    if (!empty($password)) {
                        $hashed = password_hash($password, PASSWORD_DEFAULT);
                        $stmtInsert = $db->prepare("INSERT INTO users (nama, username, password, role, ref_id) VALUES (:nama, :user, :pass, 'siswa', :ref)");
                        $stmtInsert->execute([':nama' => $nama, ':user' => $username, ':pass' => $hashed, ':ref' => $id]);
                    }
                }
            }
            
            $db->commit();
            successResponse(null, 'Siswa berhasil diupdate');
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse('Gagal memperbarui data siswa: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * DELETE /api/admin/siswa/{id}
     */
    public static function destroy(int $id): void {
        requireRole('admin');
        $db = getDB();
        
        // Hapus pendaftaran terkait
        $db->prepare("DELETE FROM pendaftaran_ekskul WHERE siswa_id = :id")->execute([':id' => $id]);
        
        // Hapus absensi terkait
        $db->prepare("DELETE FROM absensi WHERE id_siswa = :id")->execute([':id' => $id]);
        
        // Hapus nilai terkait
        $db->prepare("DELETE FROM nilai_ekskul WHERE siswa_id = :id")->execute([':id' => $id]);
        
        // Hapus user terkait
        $db->prepare("DELETE FROM users WHERE ref_id = :id AND role = 'siswa'")->execute([':id' => $id]);
        
        // Hapus siswa
        $stmt = $db->prepare("DELETE FROM siswa WHERE id = :id");
        $stmt->execute([':id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Siswa tidak ditemukan', 404);
        }
        
        successResponse(null, 'Siswa berhasil dihapus');
    }
    
    /**
     * GET /api/siswa/profil
     */
    public static function getProfil(): void {
        $user = requireRole('siswa');
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT s.*, k.nama_kelas, u.username
            FROM siswa s
            LEFT JOIN kelas k ON s.kelas_id = k.id
            LEFT JOIN users u ON s.id = u.ref_id AND u.role = 'siswa'
            WHERE s.id = :id
        ");
        $stmt->execute([':id' => $user->ref_id]);
        $siswa = $stmt->fetch();
        
        if (!$siswa) {
            errorResponse('Data profil tidak ditemukan', 404);
        }
        
        successResponse($siswa);
    }
    
    /**
     * PUT /api/siswa/profil/password
     */
    public static function updatePassword(): void {
        $user = requireRole('siswa');
        $db = getDB();
        $data = getRequestBody();
        
        $oldPassword = $data['old_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        
        if (empty($oldPassword) || empty($newPassword)) {
            errorResponse('Password lama dan password baru wajib diisi', 400);
        }
        
        if (strlen($newPassword) < 6) {
            errorResponse('Password baru minimal 6 karakter', 400);
        }
        
        // Cek user yang sedang login
        $stmt = $db->prepare("SELECT id, password FROM users WHERE ref_id = :ref_id AND role = 'siswa'");
        $stmt->execute([':ref_id' => $user->ref_id]);
        $userData = $stmt->fetch();
        
        if (!$userData) {
            errorResponse('Akun tidak ditemukan', 404);
        }
        
        // Verifikasi password lama
        if (!password_verify($oldPassword, $userData['password'])) {
            errorResponse('Password lama salah', 401);
        }
        
        // Update hash password baru
        $hashed = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmtUpdate = $db->prepare("UPDATE users SET password = :pass WHERE id = :id");
        $stmtUpdate->execute([':pass' => $hashed, ':id' => $userData['id']]);
        
        successResponse(null, 'Password berhasil diperbarui');
    }

    /**
     * POST /api/admin/siswa/import
     * Menerima array data siswa dalam format JSON
     */
    public static function import(): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();
        
        $students = $data['students'] ?? [];
        
        if (empty($students) || !is_array($students)) {
            errorResponse('Data siswa kosong atau format tidak valid', 400);
        }
        
        $db->beginTransaction();
        try {
            $inserted = 0;
            $stmtSiswa = $db->prepare("
                INSERT INTO siswa (nama_siswa, no_induk, tanggal_lahir, no_hp, kota, alamat, nama_ayah, pekerjaan_ayah, nama_ibu, pekerjaan_ibu, kelas_id) 
                VALUES (:nama, :no_induk, :tgl, :hp, :kota, :alamat, :nama_ayah, :pekerjaan_ayah, :nama_ibu, :pekerjaan_ibu, :kelas)
            ");
            
            $stmtUser = $db->prepare("
                INSERT INTO users (nama, username, password, role, ref_id)
                VALUES (:nama, :user, :pass, 'siswa', :ref)
            ");
            
            $period = getActivePeriod();
            $stmtRiwayat = $db->prepare("INSERT INTO riwayat_kelas (siswa_id, kelas_id, tahun_ajaran) VALUES (:siswa_id, :kelas_id, :tahun_ajaran)");

            foreach ($students as $row) {
                // Lewati baris kosong atau tanpa nama/kelas
                if (empty(trim($row['nama_siswa'] ?? '')) || empty($row['kelas_id'])) {
                    continue;
                }
                
                $nama = trim($row['nama_siswa']);
                $kelasId = (int)$row['kelas_id'];
                $username = trim($row['username'] ?? '');
                $password = trim($row['password'] ?? '');

                $stmtSiswa->execute([
                    ':nama'           => $nama,
                    ':no_induk'       => trim($row['no_induk'] ?? ''),
                    ':tgl'            => !empty($row['tanggal_lahir']) ? $row['tanggal_lahir'] : null,
                    ':hp'             => trim($row['no_hp'] ?? ''),
                    ':kota'           => trim($row['kota'] ?? ''),
                    ':alamat'         => trim($row['alamat'] ?? ''),
                    ':nama_ayah'      => trim($row['nama_ayah'] ?? ''),
                    ':pekerjaan_ayah' => trim($row['pekerjaan_ayah'] ?? ''),
                    ':nama_ibu'       => trim($row['nama_ibu'] ?? ''),
                    ':pekerjaan_ibu'  => trim($row['pekerjaan_ibu'] ?? ''),
                    ':kelas'          => $kelasId,
                ]);
                
                $siswaId = $db->lastInsertId();
                $inserted++;
                
                $stmtRiwayat->execute([
                    ':siswa_id' => $siswaId,
                    ':kelas_id' => $kelasId,
                    ':tahun_ajaran' => $period['tahun_ajaran']
                ]);
                
                if (!empty($username) && !empty($password)) {
                    $hashed = password_hash($password, PASSWORD_DEFAULT);
                    $stmtUser->execute([
                        ':nama' => $nama,
                        ':user' => $username,
                        ':pass' => $hashed,
                        ':ref'  => $siswaId,
                    ]);
                }
            }
            
            $db->commit();
            successResponse(['imported' => $inserted], "$inserted siswa berhasil diimpor", 201);
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse('Gagal mengimpor data: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/admin/siswa/pindah-kelas
     * Menerima array siswa_ids dan to_kelas_id
     */
    public static function pindahKelasMassal(): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();
        
        $siswaIds = $data['siswa_ids'] ?? [];
        $toKelasId = $data['to_kelas_id'] ?? null;
        
        if (empty($siswaIds) || !is_array($siswaIds) || empty($toKelasId)) {
            errorResponse('Data siswa_ids atau to_kelas_id tidak valid', 400);
        }
        
        // Buat string placeholder ?,?,?
        $placeholders = str_repeat('?,', count($siswaIds) - 1) . '?';
        
        try {
            $sql = "UPDATE siswa SET kelas_id = ? WHERE id IN ($placeholders)";
            $stmt = $db->prepare($sql);
            
            // Gabungkan toKelasId sebagai parameter pertama, lalu array siswaIds
            $params = array_merge([$toKelasId], $siswaIds);
            
            $stmt->execute($params);
            
            $period = getActivePeriod();
            $sqlRiwayat = "INSERT INTO riwayat_kelas (siswa_id, kelas_id, tahun_ajaran) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE kelas_id = ?";
            $stmtRiwayat = $db->prepare($sqlRiwayat);
            foreach ($siswaIds as $sid) {
                $stmtRiwayat->execute([$sid, $toKelasId, $period['tahun_ajaran'], $toKelasId]);
            }
            
            $affected = $stmt->rowCount();
            
            successResponse(['moved' => $affected], "$affected siswa berhasil pindah kelas");
        } catch (Exception $e) {
            errorResponse('Gagal memindahkan kelas: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/admin/siswa/graduate
     * Meluluskan siswa tertentu yang dipilih
     */
    public static function graduateStudents(): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();
        
        $siswaIds = $data['siswa_ids'] ?? [];
        
        if (empty($siswaIds) || !is_array($siswaIds)) {
            errorResponse('Pilih minimal satu siswa untuk diluluskan', 400);
        }
        
        try {
            $placeholders = str_repeat('?,', count($siswaIds) - 1) . '?';
            
            // Update status ke alumni dan hapus kelas_id
            $sql = "UPDATE siswa SET status = 'alumni', kelas_id = NULL WHERE id IN ($placeholders) AND status = 'aktif'";
            $stmt = $db->prepare($sql);
            $stmt->execute($siswaIds);
            
            $affected = $stmt->rowCount();
            successResponse(['graduated' => $affected], "$affected siswa terpilih berhasil diluluskan (status: Alumni).");
        } catch (Exception $e) {
            errorResponse('Gagal proses kelulusan: ' . $e->getMessage(), 500);
        }
    }
}
