<?php
require_once __DIR__ . '/config/database.php';
try {
    $db = getDB();
    echo "--- Users (Parents) ---\n";
    $stmt = $db->query("SELECT id, nama, username, role FROM users WHERE role = 'orang_tua'");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $user) {
        printf("ID: %d | Name: %s | User: %s\n", $user['id'], $user['nama'], $user['username']);
    }

    echo "\n--- Mapping (orang_tua_siswa) ---\n";
    $stmt2 = $db->query("SELECT * FROM orang_tua_siswa");
    $mappings = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    foreach ($mappings as $m) {
        printf("ID: %d | Parent: %d | Student: %d\n", $m['id'], $m['parent_user_id'], $m['siswa_id']);
    }

    echo "\n--- Students (Siswa) ---\n";
    $stmt3 = $db->query("SELECT id, nama_siswa FROM siswa LIMIT 5");
    $siswa = $stmt3->fetchAll(PDO::FETCH_ASSOC);
    foreach ($siswa as $s) {
        printf("ID: %d | Name: %s\n", $s['id'], $s['nama_siswa']);
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
