<?php
require 'config/database.php';
$db = getDB();
$q = $db->query('DESCRIBE riwayat_kelas');
print_r($q->fetchAll(PDO::FETCH_COLUMN));
$q = $db->query('SELECT * FROM riwayat_kelas LIMIT 5');
print_r($q->fetchAll(PDO::FETCH_ASSOC));
