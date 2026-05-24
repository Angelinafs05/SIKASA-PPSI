<?php
include 'koneksi.php';

// Check for duplicate BASKET PUTRA
$result = $conn->query("SELECT id, nama_ekskul, hari, jam, tempat FROM ekstrakurikuler WHERE nama_ekskul LIKE '%BASKET%' ORDER BY id");
echo "=== BASKET RECORDS ===\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, Nama: {$row['nama_ekskul']}, Hari: {$row['hari']}, Jam: {$row['jam']}, Tempat: {$row['tempat']}\n";
}

// Check pelatih
echo "\n=== PELATIH FOR BASKET ===\n";
$result = $conn->query("SELECT p.id, p.nama_pelatih, e.id as ekskul_id, e.nama_ekskul FROM pelatih p JOIN ekstrakurikuler e ON p.ekskul_id = e.id WHERE e.nama_ekskul LIKE '%BASKET%' ORDER BY p.id");
while ($row = $result->fetch_assoc()) {
    echo "Pelatih ID: {$row['id']}, Nama: {$row['nama_pelatih']}, Ekskul ID: {$row['ekskul_id']}, Nama Ekskul: {$row['nama_ekskul']}\n";
}

$conn->close();
