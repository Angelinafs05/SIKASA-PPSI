<?php
$host = '127.0.0.1';
$db   = 'sikasa_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("SHOW COLUMNS FROM peserta_lomba LIKE 'parent_approval_status'");
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE peserta_lomba ADD COLUMN parent_approval_status ENUM('Menunggu', 'Disetujui', 'Ditolak') DEFAULT 'Menunggu' AFTER status_izin");
        $pdo->exec("ALTER TABLE peserta_lomba ADD COLUMN parent_approval_reason TEXT NULL AFTER parent_approval_status");
        $pdo->exec("ALTER TABLE peserta_lomba ADD COLUMN parent_approval_file VARCHAR(255) NULL AFTER parent_approval_reason");
        $pdo->exec("ALTER TABLE peserta_lomba ADD COLUMN parent_approval_date TIMESTAMP NULL AFTER parent_approval_file");
        echo "Database updated successfully.\n";
    } else {
        echo "Columns already exist.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
