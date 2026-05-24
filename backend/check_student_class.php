<?php
require 'config/database.php';
$db = getDB();
$q = $db->query("SELECT s.id, s.nama_siswa, s.kelas_id, k.nama_kelas 
                 FROM siswa s 
                 LEFT JOIN kelas k ON s.kelas_id = k.id 
                 WHERE s.nama_siswa LIKE '%Martin%' OR s.nama_siswa LIKE '%Juhoon%'");
print_r($q->fetchAll(PDO::FETCH_ASSOC));
