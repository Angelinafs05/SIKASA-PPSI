<?php
/**
 * Pelatih Controller - CRUD Pelatih (Admin only)
 */

class PelatihController {
    
    /**
     * GET /api/admin/pelatih
     */
    public static function index(): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        
        $stmt = $db->query("
            SELECT p.*, e.nama_ekskul, u.username, g.nama_guru as pendamping_nama
            FROM pelatih p 
            LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id 
            LEFT JOIN users u ON p.id = u.ref_id AND u.role = 'pelatih'
            LEFT JOIN guru_pendamping g ON p.guru_id = g.id
            ORDER BY p.nama_pelatih ASC
        ");
        
        successResponse($stmt->fetchAll());
    }
    
    /**
     * GET /api/admin/pelatih/{id}
     */
    public static function show(int $id): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT p.*, e.nama_ekskul, u.username, g.nama_guru as pendamping_nama
            FROM pelatih p 
            LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id 
            LEFT JOIN users u ON p.id = u.ref_id AND u.role = 'pelatih'
            LEFT JOIN guru_pendamping g ON p.guru_id = g.id
            WHERE p.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $pelatih = $stmt->fetch();
        
        if (!$pelatih) {
            errorResponse('Pelatih tidak ditemukan', 404);
        }
        
        successResponse($pelatih);
    }
    
    /**
     * POST /api/admin/pelatih
     */
    public static function store(): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();
        
        $nama       = trim($data['nama_pelatih'] ?? '');
        $noHp       = trim($data['no_hp'] ?? '');
        $ekskulId   = $data['ekskul_id'] ?? null;
        $guruId     = $data['guru_id'] ?? null;
        $username   = trim($data['username'] ?? '');
        $password   = trim($data['password'] ?? '');
        
        if (empty($nama)) {
            errorResponse('Nama pelatih wajib diisi', 400);
        }
        
        try {
            $db->beginTransaction();

            // Validasi: 1 guru pendamping hanya boleh mendampingi 1 ekskul/pelatih
            if (!empty($guruId)) {
                $checkGuru = $db->prepare("SELECT p.nama_pelatih, e.nama_ekskul, g.nama_guru FROM pelatih p LEFT JOIN guru_pendamping g ON p.guru_id = g.id LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id WHERE p.guru_id = :gid LIMIT 1");
                $checkGuru->execute([':gid' => $guruId]);
                $already = $checkGuru->fetch();
                if ($already) {
                    $db->rollBack();
                    $ekskulInfo = !empty($already['nama_ekskul']) ? " di ekstrakurikuler " . $already['nama_ekskul'] : "";
                    errorResponse("Guru " . ($already['nama_guru'] ?? 'tersebut') . " sudah mendampingi pelatih " . $already['nama_pelatih'] . $ekskulInfo . ". Satu guru hanya bisa mendampingi 1 kegiatan.", 400);
                }
            }

            // Cek apakah username sudah digunakan
            if (!empty($username)) {
                $check = $db->prepare("SELECT id FROM users WHERE username = :u");
                $check->execute([':u' => $username]);
                if ($check->fetch()) {
                    $db->rollBack();
                    errorResponse("Username '$username' sudah digunakan oleh orang lain", 400);
                }
            }

            $stmt = $db->prepare("
                INSERT INTO pelatih (nama_pelatih, no_hp, ekskul_id, guru_id) 
                VALUES (:nama, :hp, :ekskul, :guru_id)
            ");
            $stmt->execute([
                ':nama'       => $nama,
                ':hp'         => $noHp,
                ':ekskul'     => $ekskulId,
                ':guru_id'    => $guruId,
            ]);
            $pelatihId = $db->lastInsertId();

            // Sinkronisasi dua arah: Update pelatih di tabel ekstrakurikuler jika ekskulId dipilih
            if (!empty($ekskulId)) {
                $db->prepare("UPDATE ekstrakurikuler SET pelatih = :nama WHERE id = :eid")
                    ->execute([':nama' => $nama, ':eid' => $ekskulId]);
            }
            
            // Buat akun user jika username diberikan
            if (!empty($username) && !empty($password)) {
                $hashed = password_hash($password, PASSWORD_DEFAULT);
                $stmt2 = $db->prepare("
                    INSERT INTO users (nama, username, password, role, ref_id)
                    VALUES (:nama, :user, :pass, 'pelatih', :ref)
                ");
                $stmt2->execute([
                    ':nama' => $nama,
                    ':user' => $username,
                    ':pass' => $hashed,
                    ':ref'  => $pelatihId,
                ]);
            }
            
            $db->commit();
            successResponse(['id' => (int) $pelatihId], 'Pelatih berhasil ditambahkan', 201);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse('Gagal menyimpan data pelatih: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * PUT /api/admin/pelatih/{id}
     */
    public static function update(int $id): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();
        
        $nama       = trim($data['nama_pelatih'] ?? '');
        $noHp       = trim($data['no_hp'] ?? '');
        $ekskulId   = $data['ekskul_id'] ?? null;
        $guruId     = $data['guru_id'] ?? null;
        $username   = trim($data['username'] ?? '');
        $password   = trim($data['password'] ?? '');
        
        if (empty($nama)) {
            errorResponse('Nama pelatih wajib diisi', 400);
        }
        
        try {
            $db->beginTransaction();

            // Validasi: 1 guru pendamping hanya boleh mendampingi 1 ekskul/pelatih
            if (!empty($guruId)) {
                $checkGuru = $db->prepare("SELECT p.nama_pelatih, e.nama_ekskul, g.nama_guru FROM pelatih p LEFT JOIN guru_pendamping g ON p.guru_id = g.id LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id WHERE p.guru_id = :gid AND p.id != :pid LIMIT 1");
                $checkGuru->execute([':gid' => $guruId, ':pid' => $id]);
                $already = $checkGuru->fetch();
                if ($already) {
                    $db->rollBack();
                    $ekskulInfo = !empty($already['nama_ekskul']) ? " di ekstrakurikuler " . $already['nama_ekskul'] : "";
                    errorResponse("Guru " . ($already['nama_guru'] ?? 'tersebut') . " sudah mendampingi pelatih " . $already['nama_pelatih'] . $ekskulInfo . ". Satu guru hanya bisa mendampingi 1 kegiatan.", 400);
                }
            }

            // Cek apakah username sudah digunakan oleh orang lain
            if (!empty($username)) {
                $check = $db->prepare("SELECT id FROM users WHERE username = :u AND NOT (ref_id = :ref AND role = 'pelatih')");
                $check->execute([':u' => $username, ':ref' => $id]);
                if ($check->fetch()) {
                    $db->rollBack();
                    errorResponse("Username '$username' sudah digunakan oleh orang lain", 400);
                }
            }

            // Ambil data pelatih lama untuk sinkronisasi ekskul
            $stmtOld = $db->prepare("SELECT nama_pelatih, ekskul_id FROM pelatih WHERE id = :id");
            $stmtOld->execute([':id' => $id]);
            $oldPelatih = $stmtOld->fetch();

            $stmt = $db->prepare("
                UPDATE pelatih SET 
                    nama_pelatih = :nama, 
                    no_hp = :hp, 
                    ekskul_id = :ekskul,
                    guru_id = :guru_id
                WHERE id = :id
            ");
            $stmt->execute([
                ':nama'       => $nama,
                ':hp'         => $noHp,
                ':ekskul'     => $ekskulId,
                ':guru_id'    => $guruId,
                ':id'         => $id,
            ]);
            
            // Update/Create user account
            if (!empty($username)) {
                // Cek apakah user sudah ada
                $stmtUser = $db->prepare("SELECT id FROM users WHERE ref_id = :ref AND role = 'pelatih'");
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
                        $stmtInsert = $db->prepare("INSERT INTO users (nama, username, password, role, ref_id) VALUES (:nama, :user, :pass, 'pelatih', :ref)");
                        $stmtInsert->execute([':nama' => $nama, ':user' => $username, ':pass' => $hashed, ':ref' => $id]);
                    }
                }
            }
            
            // Sinkronisasi dua arah ke tabel ekstrakurikuler
            if ($oldPelatih && !empty($oldPelatih['ekskul_id']) && $oldPelatih['ekskul_id'] != $ekskulId) {
                // Bersihkan ekskul lama jika pelatih pindah ekskul
                $db->prepare("UPDATE ekstrakurikuler SET pelatih = '' WHERE id = :old_eid AND pelatih = :old_nama")
                    ->execute([':old_eid' => $oldPelatih['ekskul_id'], ':old_nama' => $oldPelatih['nama_pelatih']]);
            }
            if (!empty($ekskulId)) {
                $db->prepare("UPDATE ekstrakurikuler SET pelatih = :nama WHERE id = :eid")
                    ->execute([':nama' => $nama, ':eid' => $ekskulId]);
            }

            $db->commit();
            successResponse(null, 'Pelatih berhasil diupdate');
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse('Gagal memperbarui data pelatih: ' . $e->getMessage(), 500);
        }
    }
    
    public static function destroy(int $id): void {
        requireRole('admin');
        $db = getDB();
        
        // Hapus user terkait
        $db->prepare("DELETE FROM users WHERE ref_id = :id AND role = 'pelatih'")->execute([':id' => $id]);
        
        // Hapus pelatih
        $stmt = $db->prepare("DELETE FROM pelatih WHERE id = :id");
        $stmt->execute([':id' => $id]);
        
        if ($stmt->rowCount() === 0) {
            errorResponse('Pelatih tidak ditemukan', 404);
        }
        
        successResponse(null, 'Pelatih berhasil dihapus');
    }

    /**
     * GET /api/pelatih/profil
     */
    public static function getProfil(): void {
        $user = requireRole('pelatih');
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT p.*, e.nama_ekskul, u.username, g.nama_guru as pendamping_nama
            FROM pelatih p
            LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id
            LEFT JOIN users u ON p.id = u.ref_id AND u.role = 'pelatih'
            LEFT JOIN guru_pendamping g ON p.guru_id = g.id
            WHERE p.id = :id
        ");
        $stmt->execute([':id' => $user->ref_id]);
        $profil = $stmt->fetch();
        
        if (!$profil) {
            errorResponse('Profil tidak ditemukan', 404);
        }
        
        successResponse($profil);
    }
    
    /**
     * PUT /api/pelatih/profil/password
     */
    public static function updatePassword(): void {
        $user = requireRole('pelatih');
        $data = getRequestBody();
        $db = getDB();
        
        $oldPassword = $data['old_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        
        if (empty($oldPassword) || empty($newPassword)) {
            errorResponse('Password lama dan baru wajib diisi', 400);
        }
        
        if (strlen($newPassword) < 6) {
            errorResponse('Password baru minimal 6 karakter', 400);
        }
        
        // Cek password lama
        $stmt = $db->prepare("SELECT password FROM users WHERE id = :id AND role = 'pelatih'");
        $stmt->execute([':id' => $user->id]);
        $userRecord = $stmt->fetch();
        
        if (!$userRecord || !password_verify($oldPassword, $userRecord['password'])) {
            errorResponse('Password saat ini tidak cocok', 400);
        }
        
        // Update password baru
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $updateStmt = $db->prepare("UPDATE users SET password = :pass WHERE id = :id AND role = 'pelatih'");
        $updateStmt->execute([
            ':pass' => $hashedPassword,
            ':id' => $user->id
        ]);
        
        successResponse(null, 'Password berhasil diperbarui');
    }
}
