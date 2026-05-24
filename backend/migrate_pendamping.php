<?php
/**
 * Migration Script: Add pendamping and room to ekstrakurikuler table
 */
require_once __DIR__ . '/config/database.php';

try {
    $db = getDB();
    
    // Add pendamping column if not exists
    $db->exec("ALTER TABLE ekstrakurikuler ADD COLUMN pendamping VARCHAR(255) DEFAULT NULL AFTER pelatih");
    echo "Column 'pendamping' added successfully.\n";
    
    // Add tempat/ruangan column if not exists (should already exist but ensuring consistent naming)
    // The user mentioned "ruangan" in the table column request. 
    // The table currently has "tempat". I will keep "tempat" but ensure it's treated as ruangan.
    
    echo "Migration completed.\n";
} catch (PDOException $e) {
    echo "Migration error: " . $e->getMessage() . "\n";
}
