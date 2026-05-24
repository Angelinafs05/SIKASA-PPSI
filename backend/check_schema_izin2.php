<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();
try {
    $tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    foreach($tables as $t) {
        $cols = $db->query("SHOW COLUMNS FROM $t")->fetchAll(PDO::FETCH_ASSOC);
        echo "TABLE: $t (" . implode(", ", array_column($cols, 'Field')) . ")\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
