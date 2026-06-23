<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/settings.php';

try {
    $db = getDB();
    echo "DB Connected\n";
    
    $period = getActivePeriod();
    echo "Period: " . json_encode($period) . "\n";
    
    $sid = 1; // Assuming a random valid student ID for test, or just preparing queries
    $t = $period['tahun_ajaran'];
    $s = $period['semester'];

    $stmtSiswa = $db->prepare("SELECT s.*, k.nama_kelas FROM siswa s LEFT JOIN kelas k ON s.kelas_id = k.id LIMIT 1");
    $stmtSiswa->execute();
    $siswa = $stmtSiswa->fetch();
    echo "1. Student Query OK: " . ($siswa ? $siswa['id'] : 'None') . "\n";
    
    $sid = $siswa['id'] ?? 1;

    $stmt = $db->prepare("SELECT COUNT(*) FROM pendaftaran_ekskul WHERE siswa_id = :sid AND status = 'approved' AND tahun_ajaran = :t AND semester = :s");
    $stmt->execute([':sid' => $sid, ':t' => $t, ':s' => $s]);
    echo "2. TotalEkskul Query OK\n";

    $stmt2 = $db->prepare("SELECT COUNT(*) FROM pendaftaran_ekskul WHERE siswa_id = :sid AND status = 'pending' AND tahun_ajaran = :t AND semester = :s");
    $stmt2->execute([':sid' => $sid, ':t' => $t, ':s' => $s]);
    echo "3. Pending Count Query OK\n";

    $stmt3 = $db->prepare("
        SELECT pe.id AS reg_id, e.id AS ekskul_id, e.nama_ekskul, e.hari, e.jam, e.tempat, p.nama_pelatih
        FROM pendaftaran_ekskul pe
        JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
        LEFT JOIN pelatih p ON p.ekskul_id = e.id
        WHERE pe.siswa_id = :sid AND pe.status = 'approved' AND pe.tahun_ajaran = :t AND pe.semester = :s
        ORDER BY FIELD(SUBSTRING_INDEX(e.hari, ',', 1), 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') ASC
    ");
    $stmt3->execute([':sid' => $sid, ':t' => $t, ':s' => $s]);
    echo "4. MyEkskuls Query OK\n";

    $today = 'Senin';
    $stmt_s = $db->prepare("
        SELECT e.id AS ekskul_id, e.nama_ekskul, e.hari, e.jam, e.tempat, p.nama_pelatih
        FROM pendaftaran_ekskul pe
        JOIN     ekstrakurikuler e ON pe.ekskul_id = e.id
        LEFT JOIN pelatih p ON p.ekskul_id = e.id
        WHERE pe.siswa_id = :sid 
          AND pe.status = 'approved' 
          AND pe.tahun_ajaran = :t 
          AND pe.semester = :s
          AND e.hari LIKE :today
        ORDER BY e.jam ASC
    ");
    $stmt_s->execute([
        ':sid' => $sid,
        ':t' => $t,
        ':s' => $s,
        ':today' => "%$today%"
    ]);
    echo "5. TodaySchedule Query OK\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
