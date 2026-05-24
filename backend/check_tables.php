<?php
require 'config/database.php';
$db = getDB();
$q = $db->query('SHOW TABLES');
print_r($q->fetchAll(PDO::FETCH_COLUMN));
