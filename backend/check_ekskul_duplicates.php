<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$res = $db->query("SELECT id, nama_ekskul, tahun_ajaran, semester FROM ekstrakurikuler")->fetchAll(PDO::FETCH_ASSOC);
print_r($res);
