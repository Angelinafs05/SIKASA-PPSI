<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = getDB();
    $tables = ['siswa', 'users'];
    foreach ($tables as $table) {
        echo "Table: $table\n";
        $stmt = $db->query("DESCRIBE $table");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            print_r($row);
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
