<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = getDB();
    foreach (['siswa', 'users'] as $table) {
        echo "\nTable: $table\n";
        $stmt = $db->query("DESCRIBE $table");
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($results as $row) {
            echo "{$row['Field']} | {$row['Type']} | {$row['Null']} | {$row['Key']} | {$row['Default']}\n";
        }
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
