<?php
/**
 * BobotNilai Controller
 */

class BobotNilaiController {
    
    /**
     * GET /api/bobot-nilai
     * Fetch all aspects for a specific ekskul (For Admin & Pelatih)
     */
    public static function index(): void {
        $db = getDB();
        
        $stmt = $db->query("
            SELECT a.*, e.nama_ekskul 
            FROM aspek_penilaian_ekskul a
            JOIN ekstrakurikuler e ON a.ekskul_id = e.id
            ORDER BY e.nama_ekskul ASC, a.id ASC
        ");
        $aspek = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        successResponse($aspek);
    }
    
    public static function indexPelatih(): void {
        $user = requireRole('pelatih');
        $db = getDB();
        
        $stmt_e = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
        $stmt_e->execute([':id' => $user->ref_id]);
        $pelatih = $stmt_e->fetch();
        $ekskulId = $pelatih['ekskul_id'] ?? 0;
        
        if (!$ekskulId) {
            errorResponse('Pelatih tidak terkait dengan ekstrakurikuler manapun.', 400);
        }
        
        $stmt = $db->prepare("SELECT * FROM aspek_penilaian_ekskul WHERE ekskul_id = :eid ORDER BY id ASC");
        $stmt->execute([':eid' => $ekskulId]);
        $aspek = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        successResponse(['ekskul_id' => $ekskulId, 'aspek' => $aspek]);
    }

    /**
     * POST /api/pelatih/bobot-nilai
     * Save/Update all aspects for an ekskul (Pelatih)
     * Body: { aspek: [{id?: 1, nama_aspek: 'Keahlian', bobot: 50}, ...] }
     */
    public static function store(): void {
        $user = requireRole('pelatih');
        $data = getRequestBody();
        $db = getDB();
        
        $aspekList = $data['aspek'] ?? [];
        
        $stmt_e = $db->prepare("SELECT ekskul_id FROM pelatih WHERE id = :id");
        $stmt_e->execute([':id' => $user->ref_id]);
        $pelatih = $stmt_e->fetch();
        $ekskulId = $pelatih['ekskul_id'] ?? 0;
        
        if (!$ekskulId) {
            errorResponse('Pelatih tidak terkait dengan ekstrakurikuler manapun.', 400);
        }
        
        // Validation: total bobot must be exactly 100
        $totalBobot = 0;
        foreach ($aspekList as $asp) {
            $totalBobot += (int)($asp['bobot'] ?? 0);
        }
        
        if ($totalBobot !== 100) {
            errorResponse("Total bobot harus 100%. Total saat ini: {$totalBobot}%", 400);
        }
        
        try {
            $db->beginTransaction();
            
            // Delete all existing aspects for this ekskul to replace them, OR update them.
            // Replacing is easier for array sync, but we might lose `aspek_id` in `nilai_aspek_siswa` if deleted!
            // So we MUST sync properly.
            
            // Get existing
            $stmt_ex = $db->prepare("SELECT id FROM aspek_penilaian_ekskul WHERE ekskul_id = :eid");
            $stmt_ex->execute([':eid' => $ekskulId]);
            $existingIds = $stmt_ex->fetchAll(PDO::FETCH_COLUMN);
            
            $incomingIds = [];
            foreach ($aspekList as $asp) {
                if (!empty($asp['id'])) {
                    $incomingIds[] = $asp['id'];
                }
            }
            
            // Delete ones that are not in incoming
            $toDelete = array_diff($existingIds, $incomingIds);
            if (!empty($toDelete)) {
                $inQuery = implode(',', array_map('intval', $toDelete));
                $db->query("DELETE FROM aspek_penilaian_ekskul WHERE id IN ($inQuery)");
            }
            
            // Insert or Update
            $stmt_ins = $db->prepare("INSERT INTO aspek_penilaian_ekskul (ekskul_id, nama_aspek, bobot) VALUES (:eid, :nama, :bobot)");
            $stmt_upd = $db->prepare("UPDATE aspek_penilaian_ekskul SET nama_aspek = :nama, bobot = :bobot WHERE id = :id AND ekskul_id = :eid");
            
            foreach ($aspekList as $asp) {
                $nama = trim($asp['nama_aspek'] ?? '');
                $bobot = (int)($asp['bobot'] ?? 0);
                
                if (empty($nama)) {
                    throw new Exception('Nama aspek tidak boleh kosong.');
                }
                
                if (!empty($asp['id'])) {
                    $stmt_upd->execute([':nama' => $nama, ':bobot' => $bobot, ':id' => $asp['id'], ':eid' => $ekskulId]);
                } else {
                    $stmt_ins->execute([':eid' => $ekskulId, ':nama' => $nama, ':bobot' => $bobot]);
                }
            }
            
            $db->commit();
            successResponse(null, 'Bobot Nilai berhasil disimpan');
            
        } catch (Exception $e) {
            $db->rollBack();
            errorResponse($e->getMessage(), 400);
        }
    }
}
