<?php
// Test script for siswaIzin endpoint
require 'config/database.php';
require 'helpers/settings.php';
require 'helpers/UploadHelper.php';

$db = getDB();
$ekskulId = 1;

try {
    $stmt_p = $db->prepare('
        SELECT p.id 
        FROM pelatih p
        JOIN ekstrakurikuler e ON p.ekskul_id = e.id
        WHERE e.nama_ekskul = (SELECT nama_ekskul FROM ekstrakurikuler WHERE id = :eid)
    ');
    $stmt_p->execute([':eid' => $ekskulId]);
    $pelatih = $stmt_p->fetch();
    echo "Pelatih: " . json_encode($pelatih) . "\n";
    $idPelatih = $pelatih['id'];
} catch (Exception $e) {
    echo "Error finding pelatih: " . $e->getMessage() . "\n";
}

try {
    $period = getActivePeriod();
    $tahun = $period['tahun_ajaran'];
    $sem = $period['semester'];
    echo "Period: $tahun - $sem\n";

    $siswaId = 12; // Martin
    $tanggal = '2024-11-20';
    $keterangan = 'Sakit test';
    $uploadPath = 'public/uploads/izin/test.jpg';

    echo "Inserting into absensi...\n";
    $stmt = $db->prepare("INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status, keterangan, surat_ijin, tahun_ajaran, semester) VALUES (:sid, :pid, :tgl, 'Izin', :ket, :file, :tahun, :sem)");
    $stmt->execute([':sid' => $siswaId, ':pid' => $idPelatih, ':tgl' => $tanggal, ':ket' => $keterangan, ':file' => $uploadPath, ':tahun' => $tahun, ':sem' => $sem]);
    echo "Done.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
