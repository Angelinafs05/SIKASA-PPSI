<?php
require 'backend/config/database.php';
$db = getDB();
$stmt = $db->query('UPDATE riwayat_honor SET nominal = nominal * 1000 WHERE nominal < 10000');
echo $stmt->rowCount() . " rows fixed.\n";
