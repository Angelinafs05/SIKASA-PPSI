<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = getDB();
    $ekskulId = 1;
    $tanggal = '2025-01-01';
    $t1 = '2024-2025';
    $s1 = 'Genap';
    $t2 = '2024-2025';
    $s2 = 'Genap';
    $stmt = $db->prepare("
        SELECT s.id, s.nama_siswa, k.nama_kelas,
                a.status AS status_absensi, a.keterangan, a.surat_ijin,
                (SELECT COUNT(*) FROM absensi a_s WHERE a_s.id_siswa = s.id AND a_s.tahun_ajaran = :t1 AND a_s.semester = :s1 AND a_s.status = 'Sakit' AND a_s.id_pelatih IN (SELECT id FROM pelatih WHERE ekskul_id = :eid)) as total_sakit,
                (SELECT COUNT(*) FROM absensi a_i WHERE a_i.id_siswa = s.id AND a_i.tahun_ajaran = :t1 AND a_i.semester = :s1 AND a_i.status = 'Izin' AND a_i.id_pelatih IN (SELECT id FROM pelatih WHERE ekskul_id = :eid)) as total_izin,
                (SELECT COUNT(*) FROM absensi a_a WHERE a_a.id_siswa = s.id AND a_a.tahun_ajaran = :t1 AND a_a.semester = :s1 AND a_a.status = 'Alfa' AND a_a.id_pelatih IN (SELECT id FROM pelatih WHERE ekskul_id = :eid)) as total_alfa
        FROM pendaftaran_ekskul pe
        JOIN siswa s ON pe.siswa_id = s.id
        LEFT JOIN kelas k ON s.kelas_id = k.id
        LEFT JOIN absensi a ON a.id_siswa = s.id 
            AND a.tanggal = :tgl 
            AND a.tahun_ajaran = :t1 
            AND a.semester = :s1
        WHERE pe.status = 'approved' 
            AND pe.ekskul_id = :eid
            AND pe.tahun_ajaran = :t2
            AND pe.semester = :s2
        ORDER BY s.nama_siswa ASC
    ");
    $stmt->execute([
        ':eid' => $ekskulId, 
        ':tgl' => $tanggal,
        ':t2' => $t2,
        ':s2' => $s2,
        ':t1' => $t1,
        ':s1' => $s1
    ]);
    print_r($stmt->fetchAll());
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
