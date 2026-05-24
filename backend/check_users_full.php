<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = getDB();
    echo "\nTable: users\n";
    $stmt = $db->query("DESCRIBE users");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($results as $row) {
        echo "{$row['Field']} | {$row['Type']} | {$row['Null']} | {$row['Key']} | {$row['Default']}\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
