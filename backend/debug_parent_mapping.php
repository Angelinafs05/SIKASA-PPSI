<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = getDB();
    echo "--- Users ---\n";
    $stmt = $db->query("SELECT id, nama, username, role FROM users WHERE role = 'orang_tua'");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($users);

    echo "\n--- Orang Tua Siswa Mapping ---\n";
    $stmt2 = $db->query("SELECT * FROM orang_tua_siswa");
    $mapping = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    print_r($mapping);
} catch (Exception $e) {
    echo $e->getMessage();
}
