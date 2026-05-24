<?php
$host = 'localhost';
$user = 'root';
$password = '';
$dbname = 'sikasa_db';

$conn = new mysqli($host, $user, $password, $dbname);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}

// 1. Check if nip exists
$result = $conn->query("SHOW COLUMNS FROM `guru_pendamping` LIKE 'nip'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE `guru_pendamping` ADD `nip` VARCHAR(50) DEFAULT NULL AFTER `nama_guru`");
    echo "Column 'nip' added successfully.\n";
} else {
    echo "Column 'nip' already exists.\n";
}

// 2. Check if kode_guru exists
$result = $conn->query("SHOW COLUMNS FROM `guru_pendamping` LIKE 'kode_guru'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE `guru_pendamping` ADD `kode_guru` VARCHAR(20) DEFAULT NULL AFTER `nip`");
    echo "Column 'kode_guru' added successfully.\n";
} else {
    echo "Column 'kode_guru' already exists.\n";
}

$conn->close();
?>
