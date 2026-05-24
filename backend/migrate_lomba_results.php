<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = getDB();
    
    // Add columns to lomba table if they don't exist
    $columns = [
        'foto_hasil' => "VARCHAR(255) NULL",
        'sertifikat_hasil' => "VARCHAR(255) NULL",
        'prestasi' => "VARCHAR(255) NULL"
    ];
    
    foreach ($columns as $column => $definition) {
        $check = $db->query("SHOW COLUMNS FROM lomba LIKE '$column'");
        if ($check->rowCount() == 0) {
            $db->exec("ALTER TABLE lomba ADD COLUMN $column $definition");
            echo "Column '$column' added successfully.\n";
        } else {
            echo "Column '$column' already exists.\n";
        }
    }
    
    echo "Database migration completed.\n";
} catch (Exception $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
