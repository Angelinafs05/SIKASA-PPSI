<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
$res = $db->query("SELECT * FROM pendaftaran_ekskul")->fetchAll(PDO::FETCH_ASSOC);
print_r($res);
