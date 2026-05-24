<?php
require_once 'helpers/db.php';
$db = getDB();
$stmt = $db->query("DESCRIBE pendaftaran_ekskul");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
