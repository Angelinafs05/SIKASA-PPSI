<?php
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/settings.php';

try {
    $db = getDB();
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Memulai migrasi Riwayat Kelas...\n";

    // 1. Create riwayat_kelas table
    $db->exec("
        CREATE TABLE IF NOT EXISTS `riwayat_kelas` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `siswa_id` int(11) NOT NULL,
          `kelas_id` int(11) NOT NULL,
          `tahun_ajaran` varchar(20) NOT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `unique_riwayat` (`siswa_id`, `tahun_ajaran`),
          FOREIGN KEY (`siswa_id`) REFERENCES `siswa`(`id`) ON DELETE CASCADE,
          FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Tabel riwayat_kelas berhasil dibuat/sudah ada.\n";

    // 2. Get active period
    $period = getActivePeriod();
    $activeTahun = $period['tahun_ajaran'];
    echo "Tahun Ajaran Aktif saat ini: $activeTahun\n";

    // 3. Migrate existing students
    $stmtSiswa = $db->query("SELECT id, kelas_id FROM siswa WHERE kelas_id IS NOT NULL AND status = 'aktif'");
    $siswas = $stmtSiswa->fetchAll(PDO::FETCH_ASSOC);

    $inserted = 0;
    $stmtInsert = $db->prepare("
        INSERT IGNORE INTO riwayat_kelas (siswa_id, kelas_id, tahun_ajaran) 
        VALUES (:siswa_id, :kelas_id, :tahun_ajaran)
    ");

    foreach ($siswas as $siswa) {
        $stmtInsert->execute([
            ':siswa_id' => $siswa['id'],
            ':kelas_id' => $siswa['kelas_id'],
            ':tahun_ajaran' => $activeTahun
        ]);
        if ($stmtInsert->rowCount() > 0) {
            $inserted++;
        }
    }

    echo "Migrasi selesai. Total riwayat kelas ditambahkan: $inserted siswa.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
