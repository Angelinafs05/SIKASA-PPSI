<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = getDB();
    $db->exec("ALTER TABLE riwayat_honor ADD COLUMN status ENUM('belum dibayar', 'sudah dibayar') DEFAULT 'sudah dibayar'");
    echo "Column 'status' successfully added.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
