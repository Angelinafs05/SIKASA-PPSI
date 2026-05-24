<?php
$dsn = 'mysql:host=localhost;dbname=sikasa_db;charset=utf8mb4';
$user = 'root';
$pass = '';
try {
    $db = new PDO($dsn, $user, $pass);
    $stmt = $db->query('DESCRIBE pendaftaran_ekskul');
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach($cols as $col) {
        echo $col['Field'] . " | " . $col['Type'] . "\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
