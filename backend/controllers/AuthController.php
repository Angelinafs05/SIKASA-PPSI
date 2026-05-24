<?php
/**
 * Auth Controller
 * Login, Register, Get Current User
 */

class AuthController {
    
    /**
     * POST /api/login
     */
    public static function login(): void {
        $data = getRequestBody();
        
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        
        if (empty($username) || empty($password)) {
            errorResponse('Username dan password wajib diisi', 400);
        }
        
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            errorResponse('Username tidak ditemukan', 401);
        }
        
        if (!password_verify($password, $user['password'])) {
            errorResponse('Password salah', 401);
        }
        
        $token = generateToken($user);
        
        // Ambil nama berdasarkan role
        $nama = $user['nama'] ?? '';
        if ($user['role'] === 'siswa' && $user['ref_id']) {
            $stmt2 = $db->prepare("SELECT nama_siswa FROM siswa WHERE id = :id");
            $stmt2->execute([':id' => $user['ref_id']]);
            $ref = $stmt2->fetch();
            $nama = $ref['nama_siswa'] ?? $nama;
        } elseif ($user['role'] === 'pelatih' && $user['ref_id']) {
            $stmt2 = $db->prepare("SELECT nama_pelatih, pendamping FROM pelatih WHERE id = :id");
            $stmt2->execute([':id' => $user['ref_id']]);
            $ref = $stmt2->fetch();
            $nama = $ref['nama_pelatih'] ?? $nama;
            $is_external = !empty($ref['pendamping']);
        } elseif ($user['role'] === 'pendamping' && $user['ref_id']) {
            $stmt2 = $db->prepare("SELECT nama_guru FROM guru_pendamping WHERE id = :id");
            $stmt2->execute([':id' => $user['ref_id']]);
            $ref = $stmt2->fetch();
            $nama = $ref['nama_guru'] ?? $nama;
        }
        
        successResponse([
            'token' => $token,
            'user'  => [
                'id'          => $user['id'],
                'nama'        => $nama,
                'username'    => $user['username'],
                'role'        => $user['role'],
                'ref_id'      => $user['ref_id'],
                'is_external' => $is_external ?? false,
            ]
        ], 'Login berhasil');
    }
    
    /**
     * POST /api/register
     */
    public static function register(): void {
        $data = getRequestBody();
        
        $nama     = trim($data['nama'] ?? '');
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        
        if (empty($nama) || empty($username) || empty($password)) {
            errorResponse('Nama, username, dan password wajib diisi', 400);
        }
        
        if (strlen($password) < 6) {
            errorResponse('Password minimal 6 karakter', 400);
        }
        
        $db = getDB();
        
        // Cek duplikat username
        $stmt = $db->prepare("SELECT id FROM users WHERE username = :username");
        $stmt->execute([':username' => $username]);
        if ($stmt->fetch()) {
            errorResponse('Username sudah digunakan', 409);
        }
        
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $db->prepare("
            INSERT INTO users (nama, username, password, role) 
            VALUES (:nama, :username, :password, 'siswa')
        ");
        $stmt->execute([
            ':nama'     => $nama,
            ':username' => $username,
            ':password' => $hashedPassword,
        ]);
        
        successResponse(null, 'Registrasi berhasil', 201);
    }
    
    /**
     * GET /api/user
     */
    public static function me(): void {
        $user = requireAuth();
        
        $db = getDB();
        $stmt = $db->prepare("SELECT id, nama, username, role, ref_id FROM users WHERE id = :id");
        $stmt->execute([':id' => $user->sub]);
        $userData = $stmt->fetch();
        
        if (!$userData) {
            errorResponse('User tidak ditemukan', 404);
        }
        
        // Ambil nama lengkap berdasarkan role
        if ($userData['role'] === 'siswa' && $userData['ref_id']) {
            $stmt2 = $db->prepare("SELECT nama_siswa FROM siswa WHERE id = :id");
            $stmt2->execute([':id' => $userData['ref_id']]);
            $ref = $stmt2->fetch();
            $userData['nama'] = $ref['nama_siswa'] ?? $userData['nama'];
        } elseif ($userData['role'] === 'pelatih' && $userData['ref_id']) {
            $stmt2 = $db->prepare("SELECT nama_pelatih, pendamping FROM pelatih WHERE id = :id");
            $stmt2->execute([':id' => $userData['ref_id']]);
            $ref = $stmt2->fetch();
            $userData['nama'] = $ref['nama_pelatih'] ?? $userData['nama'];
            $userData['is_external'] = !empty($ref['pendamping']);
        } elseif ($userData['role'] === 'pendamping' && $userData['ref_id']) {
            $stmt2 = $db->prepare("SELECT nama_guru FROM guru_pendamping WHERE id = :id");
            $stmt2->execute([':id' => $userData['ref_id']]);
            $ref = $stmt2->fetch();
            $userData['nama'] = $ref['nama_guru'] ?? $userData['nama'];
        }
        
        successResponse($userData);
    }
}
