<?php
include 'koneksi.php';

// Find a student who has registered for Basket Putra
$sql = "
    SELECT DISTINCT pe.siswa_id, s.nama_siswa, pe.ekskul_id, e.nama_ekskul, p.nama_pelatih
    FROM pendaftaran_ekskul pe
    JOIN siswa s ON pe.siswa_id = s.id
    JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
    LEFT JOIN pelatih p ON p.ekskul_id = e.id
    WHERE e.nama_ekskul LIKE '%Basket Putra%'
    AND pe.status = 'approved'
    LIMIT 10
";

$result = $conn->query($sql);

echo "=== STUDENTS REGISTERED FOR BASKET PUTRA (Approved) ===\n";
$students_found = false;
while ($row = $result->fetch_assoc()) {
    $students_found = true;
    echo "Student ID: {$row['siswa_id']}, Name: {$row['nama_siswa']}, Ekskul ID: {$row['ekskul_id']}, Ekskul: {$row['nama_ekskul']}, Pelatih: {$row['nama_pelatih']}\n";
}

if (!$students_found) {
    echo "No students found with approved registration for Basket Putra.\n";
    echo "\n=== Checking for any pending registrations ===\n";

    $sql2 = "
        SELECT DISTINCT pe.siswa_id, s.nama_siswa, pe.ekskul_id, e.nama_ekskul, pe.status
        FROM pendaftaran_ekskul pe
        JOIN siswa s ON pe.siswa_id = s.id
        JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
        WHERE e.nama_ekskul LIKE '%Basket%'
        LIMIT 10
    ";
    $result2 = $conn->query($sql2);
    while ($row = $result2->fetch_assoc()) {
        echo "Student ID: {$row['siswa_id']}, Name: {$row['nama_siswa']}, Ekskul ID: {$row['ekskul_id']}, Ekskul: {$row['nama_ekskul']}, Status: {$row['status']}\n";
    }
}

$conn->close();
