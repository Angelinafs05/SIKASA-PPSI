<?php
header('Content-Type: text/plain');
try {
    $dsn = "mysql:host=localhost;dbname=sikasa;charset=utf8mb4";
    $user = "root";
    $pass = "";
    $db = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ATTR_ERRMODE_EXCEPTION
    ]);
    
    $stmt = $db->query("DESCRIBE pendaftaran_ekskul");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach($cols as $col) {
        echo $col['Field'] . " - " . $col['Type'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
