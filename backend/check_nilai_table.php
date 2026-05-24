<?php
require_once 'config/database.php';
$db = getDB();
$stmt = $db->query("DESCRIBE nilai_ekskul");
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo $row['Field'] . "\n";
}
