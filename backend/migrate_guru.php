<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();

try {
    // 1. Create guru_pendamping table
    $db->exec("
        CREATE TABLE IF NOT EXISTS guru_pendamping (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama_guru VARCHAR(100) NOT NULL,
            no_hp VARCHAR(20) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
    echo "Table guru_pendamping created.\n";

    // 2. Add guru_id to pelatih table
    // First check if column exists
    $stmt = $db->query("SHOW COLUMNS FROM pelatih LIKE 'guru_id'");
    if (!$stmt->fetch()) {
        $db->exec("ALTER TABLE pelatih ADD COLUMN guru_id INT DEFAULT NULL AFTER ekskul_id");
        $db->exec("ALTER TABLE pelatih ADD CONSTRAINT fk_pelatih_guru FOREIGN KEY (guru_id) REFERENCES guru_pendamping(id) ON DELETE SET NULL");
        echo "Column guru_id added to pelatih.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
