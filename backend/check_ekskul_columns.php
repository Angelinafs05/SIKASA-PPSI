<?php
require 'config/database.php';
$db = getDB();
$q = $db->query("DESCRIBE ekstrakurikuler");
print_r($q->fetchAll(PDO::FETCH_COLUMN));
