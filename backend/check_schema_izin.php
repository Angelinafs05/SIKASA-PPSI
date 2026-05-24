<?php
require_once __DIR__ . '/helpers/db.php';
$db = getDB();
try {
    $tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    foreach($tables as $t) {
        echo "TABLE: $t\n";
        $cols = $db->query("SHOW COLUMNS FROM $t")->fetchAll(PDO::FETCH_ASSOC);
        foreach($cols as $c) {
            echo "  " . $c['Field'] . " - " . $c['Type'] . "\n";
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
