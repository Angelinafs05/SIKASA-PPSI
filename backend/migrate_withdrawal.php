<?php
require_once __DIR__ . '/config/database.php';
$db = getDB();

try {
    // Add columns for withdrawal
    $db->exec("ALTER TABLE pendaftaran_ekskul ADD COLUMN alasan_keluar TEXT NULL AFTER surat_ijin");
    $db->exec("ALTER TABLE pendaftaran_ekskul ADD COLUMN surat_keluar VARCHAR(255) NULL AFTER alasan_keluar");
    
    // Note: If status is ENUM, we might need to modify it. Let's check status type first.
    $res = $db->query("SHOW COLUMNS FROM pendaftaran_ekskul LIKE 'status'")->fetch();
    if (strpos($res['Type'], 'enum') !== false) {
        $db->exec("ALTER TABLE pendaftaran_ekskul MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'pending_withdrawal', 'withdrawn') NOT NULL DEFAULT 'pending'");
    }
    
    echo "Migration successful: alasan_keluar and surat_keluar columns added, status enum expanded.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Migration already applied or columns exist.\n";
    } else {
        echo "Migration error: " . $e->getMessage() . "\n";
    }
}
