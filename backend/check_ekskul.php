<?php
require 'config/database.php';
require 'helpers/settings.php';
$db = getDB();
print_r(getActivePeriod());
$q = $db->query('SELECT id, nama_ekskul, tahun_ajaran, semester FROM ekstrakurikuler');
print_r($q->fetchAll(PDO::FETCH_ASSOC));
