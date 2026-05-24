<?php
/**
 * Kelas Controller
 */

class KelasController {
    
    /**
     * GET /api/admin/kelas
     */
    public static function index(): void {
        requireRole('admin');
        $db = getDB();
        
        $stmt = $db->query("SELECT id, nama_kelas FROM kelas ORDER BY nama_kelas ASC");
        successResponse($stmt->fetchAll());
    }
}
