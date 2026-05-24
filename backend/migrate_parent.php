<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = getDB();
    
    // 1. Update users table role enum to include 'orang_tua'
    // Note: We need to check current enum values first to avoid overwriting them
    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'role'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $type = $row['Type']; // e.g. enum('admin','pelatih','siswa','pendamping')
    
    if (strpos($type, "'orang_tua'") === false) {
        $newType = str_replace(")", ",'orang_tua')", $type);
        $db->exec("ALTER TABLE users MODIFY COLUMN role $newType NOT NULL DEFAULT 'siswa'");
        echo "Updated users table role enum.\n";
    } else {
        echo "Role 'orang_tua' already exists in enum.\n";
    }

    // 2. Create orang_tua_siswa table
    $query = "
    CREATE TABLE IF NOT EXISTS orang_tua_siswa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_user_id INT NOT NULL,
        siswa_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
        UNIQUE KEY parent_siswa_unique (parent_user_id, siswa_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $db->exec($query);
    echo "Table 'orang_tua_siswa' created successfully.\n";

    echo "Migration completed.\n";
} catch (Exception $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
