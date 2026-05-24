<?php
require 'config/database.php';
$db = getDB();
$q = $db->query('SELECT r.*, k.nama_kelas, s.nama_siswa FROM riwayat_kelas r JOIN kelas k ON r.kelas_id = k.id JOIN siswa s ON r.siswa_id = s.id WHERE s.nama_siswa LIKE "%Martin%"');
print_r($q->fetchAll(PDO::FETCH_ASSOC));
