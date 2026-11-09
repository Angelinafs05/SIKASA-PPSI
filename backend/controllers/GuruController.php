<?php
/**
 * Guru Pendamping Controller - CRUD Guru (Admin only)
 */

class GuruController {
    
    /**
     * GET /api/admin/guru
     */
    public static function index(): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        
        $stmt = $db->query("
            SELECT g.*, u.username,
                   p.id AS assigned_pelatih_id, p.nama_pelatih AS assigned_pelatih_nama,
                   p.ekskul_id AS assigned_ekskul_id, e.nama_ekskul AS assigned_ekskul_nama
            FROM guru_pendamping g
            LEFT JOIN users u ON g.id = u.ref_id AND u.role = 'pendamping'
            LEFT JOIN pelatih p ON p.guru_id = g.id
            LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id
            ORDER BY g.nama_guru ASC
        ");
        
        successResponse($stmt->fetchAll());
    }
    
    /**
     * GET /api/admin/guru/{id}
     */
    public static function show(int $id): void {
        requireRole('admin', 'kepala_sekolah');
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT g.*, u.username 
            FROM guru_pendamping g
            LEFT JOIN users u ON g.id = u.ref_id AND u.role = 'pendamping'
            WHERE g.id = :id
        ");
        $stmt->execute([':id' => $id]);
        $guru = $stmt->fetch();
        
        if (!$guru) {
            errorResponse('Guru pendamping tidak ditemukan', 404);
        }
        
        successResponse($guru);
    }
    
    /**
     * POST /api/admin/guru
     */
    public static function store(): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();
        
        $nama     = trim($data['nama_guru'] ?? '');
        $nip      = trim($data['nip'] ?? '');
        $kodeGuru = trim($data['kode_guru'] ?? '');
        $noHp     = trim($data['no_hp'] ?? '');
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        
        if (empty($nama)) {
            errorResponse('Nama guru wajib diisi', 400);
        }

        try {
            $db->beginTransaction();

            // 1. Insert into guru_pendamping
            $stmt = $db->prepare("INSERT INTO guru_pendamping (nama_guru, nip, kode_guru, no_hp) VALUES (:nama, :nip, :kode, :hp)");
            $stmt->execute([':nama' => $nama, ':nip' => $nip, ':kode' => $kodeGuru, ':hp' => $noHp]);
            $guruId = $db->lastInsertId();
            
            // 2. Insert into users if credentials provided
            if (!empty($username) && !empty($password)) {
                // Check if username exists
                $check = $db->prepare("SELECT id FROM users WHERE username = :u");
                $check->execute([':u' => $username]);
                if ($check->fetch()) {
                    $db->rollBack();
                    errorResponse("Username '@$username' sudah digunakan oleh orang lain", 400);
                }

                $hashed = password_hash($password, PASSWORD_DEFAULT);
                $stmt2 = $db->prepare("
                    INSERT INTO users (nama, username, password, role, ref_id)
                    VALUES (:nama, :user, :pass, 'pendamping', :ref)
                ");
                $stmt2->execute([
                    ':nama' => $nama,
                    ':user' => $username,
                    ':pass' => $hashed,
                    ':ref'  => $guruId,
                ]);
            }

            $db->commit();
            successResponse(['id' => (int) $guruId], 'Guru berhasil ditambahkan', 201);
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse('Gagal menyimpan data: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * PUT /api/admin/guru/{id}
     */
    public static function update(int $id): void {
        requireRole('admin');
        $data = getRequestBody();
        $db = getDB();
        
        $nama     = trim($data['nama_guru'] ?? '');
        $nip      = trim($data['nip'] ?? '');
        $kodeGuru = trim($data['kode_guru'] ?? '');
        $noHp     = trim($data['no_hp'] ?? '');
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        
        if (empty($nama)) {
            errorResponse('Nama guru wajib diisi', 400);
        }

        try {
            $db->beginTransaction();

            // 1. Update guru_pendamping
            $stmt = $db->prepare("UPDATE guru_pendamping SET nama_guru = :nama, nip = :nip, kode_guru = :kode, no_hp = :hp WHERE id = :id");
            $stmt->execute([':nama' => $nama, ':nip' => $nip, ':kode' => $kodeGuru, ':hp' => $noHp, ':id' => $id]);
            
            // 2. Update users
            if (!empty($username)) {
                // Check if username used by someone ELSE
                $check = $db->prepare("SELECT id FROM users WHERE username = :u AND NOT (ref_id = :ref AND role = 'pendamping')");
                $check->execute([':u' => $username, ':ref' => $id]);
                if ($check->fetch()) {
                    $db->rollBack();
                    errorResponse("Username '@$username' sudah digunakan oleh orang lain", 400);
                }

                $stmtUser = $db->prepare("SELECT id FROM users WHERE ref_id = :ref AND role = 'pendamping'");
                $stmtUser->execute([':ref' => $id]);
                $existingUser = $stmtUser->fetch();
                
                if ($existingUser) {
                    if (!empty($password)) {
                        $hashed = password_hash($password, PASSWORD_DEFAULT);
                        $stmtUpdate = $db->prepare("UPDATE users SET username = :user, password = :pass, nama = :nama WHERE id = :uid");
                        $stmtUpdate->execute([':user' => $username, ':pass' => $hashed, ':nama' => $nama, ':uid' => $existingUser['id']]);
                    } else {
                        $stmtUpdate = $db->prepare("UPDATE users SET username = :user, nama = :nama WHERE id = :uid");
                        $stmtUpdate->execute([':user' => $username, ':nama' => $nama, ':uid' => $existingUser['id']]);
                    }
                } else if (!empty($password)) {
                    $hashed = password_hash($password, PASSWORD_DEFAULT);
                    $stmtInsert = $db->prepare("INSERT INTO users (nama, username, password, role, ref_id) VALUES (:nama, :user, :pass, 'pendamping', :ref)");
                    $stmtInsert->execute([':nama' => $nama, ':user' => $username, ':pass' => $hashed, ':ref' => $id]);
                }
            }

            $db->commit();
            successResponse(null, 'Guru berhasil diupdate');
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse('Gagal memperbarui data: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * DELETE /api/admin/guru/{id}
     */
    public static function destroy(int $id): void {
        requireRole('admin');
        $db = getDB();
        
        try {
            $db->beginTransaction();
            $db->prepare("DELETE FROM users WHERE ref_id = :id AND role = 'pendamping'")->execute([':id' => $id]);
            $stmt = $db->prepare("DELETE FROM guru_pendamping WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $db->commit();
            
            if ($stmt->rowCount() === 0) {
                errorResponse('Guru tidak ditemukan', 404);
            }
            
            successResponse(null, 'Guru berhasil dihapus');
        } catch (Exception $e) {
            if ($db->inTransaction()) $db->rollBack();
            errorResponse('Gagal menghapus data: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/pendamping/profil
     */
    public static function getProfil(): void {
        $user = requireRole('pendamping');
        $db = getDB();
        
        $stmt = $db->prepare("
            SELECT g.*, u.username 
            FROM guru_pendamping g
            JOIN users u ON g.id = u.ref_id AND u.role = 'pendamping'
            WHERE g.id = :id
        ");
        $stmt->execute([':id' => $user->ref_id]);
        $profil = $stmt->fetch();
        
        if (!$profil) {
            errorResponse('Profil guru tidak ditemukan', 404);
        }
        
        successResponse($profil);
    }

    /**
     * PUT /api/pendamping/profil/password
     */
    public static function updatePassword(): void {
        $user = requireRole('pendamping');
        $data = getRequestBody();
        $db = getDB();
        
        $oldPassword = $data['old_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        
        if (empty($oldPassword) || empty($newPassword)) {
            errorResponse('Password lama dan password baru wajib diisi', 400);
        }
        
        if (strlen($newPassword) < 6) {
            errorResponse('Password baru minimal 6 karakter', 400);
        }
        
        $stmt = $db->prepare("SELECT id, password FROM users WHERE ref_id = :ref_id AND role = 'pendamping'");
        $stmt->execute([':ref_id' => $user->ref_id]);
        $userData = $stmt->fetch();
        
        if (!$userData || !password_verify($oldPassword, $userData['password'])) {
            errorResponse('Password lama salah', 401);
        }
        
        $hashed = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmtUpdate = $db->prepare("UPDATE users SET password = :pass WHERE id = :id");
        $stmtUpdate->execute([':pass' => $hashed, ':id' => $userData['id']]);
        
        successResponse(null, 'Password berhasil diperbarui');
    }
}

