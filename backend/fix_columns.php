<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = getDB();
    $db->exec("ALTER TABLE ekstrakurikuler 
        MODIFY COLUMN hari VARCHAR(255),
        MODIFY COLUMN jam VARCHAR(255),
        MODIFY COLUMN tempat VARCHAR(255)");
    echo "SUCCESS: Columns updated";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
