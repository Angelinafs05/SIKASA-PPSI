<?php
require_once __DIR__ . '/../config/database.php';

class AdminParentController {
    
    /**
     * Get list of all parent accounts and their linked children
     */
    public static function index() {
        requireRole('admin');
        $db = getDB();
        
        try {
            // Get all parent users
            $stmt = $db->query("SELECT id, nama, username FROM users WHERE role = 'orang_tua' ORDER BY nama");
            $parents = $stmt->fetchAll();
            
            foreach ($parents as &$p) {
                // Get linked children for each parent
                $stmtChild = $db->prepare("
                    SELECT s.id, s.no_induk, s.nama_siswa, k.nama_kelas, s.status
                    FROM orang_tua_siswa ots
                    JOIN siswa s ON ots.siswa_id = s.id
                    LEFT JOIN kelas k ON s.kelas_id = k.id
                    WHERE ots.parent_user_id = ?
                ");
                $stmtChild->execute([$p['id']]);
                $p['children'] = $stmtChild->fetchAll();
            }
            
            echo json_encode(['success' => true, 'data' => $parents]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Create a new parent user
     */
    public static function store() {
        requireRole('admin');
        $db = getDB();
        $input = json_decode(file_get_contents('php://input'), true);
        
        $nama = $input['nama'] ?? '';
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $childIds = $input['child_ids'] ?? []; // Array of student IDs to link

        if (!$nama || !$username || !$password) {
            errorResponse('Semua kolom wajib diisi', 400);
            return;
        }

        try {
            $db->beginTransaction();
            
            // Check duplicate username
            $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                errorResponse('Username sudah digunakan', 400);
                return;
            }
            
            // Insert user
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $db->prepare("INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, 'orang_tua')");
            $stmt->execute([$nama, $username, $hashedPassword]);
            $parentId = $db->lastInsertId();
            
            // Link children
            if (!empty($childIds)) {
                $stmtLink = $db->prepare("INSERT INTO orang_tua_siswa (parent_user_id, siswa_id) VALUES (?, ?)");
                foreach ($childIds as $siswaId) {
                    $stmtLink->execute([$parentId, $siswaId]);
                }
            }
            
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Akun orang tua berhasil dibuat', 'id' => $parentId]);
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Update a parent user and their children links
     */
    public static function update(int $id) {
        requireRole('admin');
        $db = getDB();
        $input = json_decode(file_get_contents('php://input'), true);
        
        $nama = $input['nama'] ?? '';
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $childIds = $input['child_ids'] ?? [];

        try {
            $db->beginTransaction();
            
            // Check username duplicate (exclude current ID)
            $stmt = $db->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
            $stmt->execute([$username, $id]);
            if ($stmt->fetch()) {
                errorResponse('Username sudah digunakan oleh akun lain', 400);
                return;
            }

            // Update user info
            if ($password) {
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $db->prepare("UPDATE users SET nama = ?, username = ?, password = ? WHERE id = ?");
                $stmt->execute([$nama, $username, $hashedPassword, $id]);
            } else {
                $stmt = $db->prepare("UPDATE users SET nama = ?, username = ? WHERE id = ?");
                $stmt->execute([$nama, $username, $id]);
            }
            
            // Sync children (delete all and re-insert)
            $db->prepare("DELETE FROM orang_tua_siswa WHERE parent_user_id = ?")->execute([$id]);
            if (!empty($childIds)) {
                $stmtLink = $db->prepare("INSERT INTO orang_tua_siswa (parent_user_id, siswa_id) VALUES (?, ?)");
                foreach ($childIds as $siswaId) {
                    $stmtLink->execute([$id, $siswaId]);
                }
            }
            
            $db->commit();
            echo json_encode(['success' => true, 'message' => 'Akun orang tua berhasil diperbarui']);
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete parent account
     */
    public static function destroy(int $id) {
        requireRole('admin');
        $db = getDB();
        try {
            $stmt = $db->prepare("DELETE FROM users WHERE id = ? AND role = 'orang_tua'");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Akun orang tua berhasil dihapus']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }
}
