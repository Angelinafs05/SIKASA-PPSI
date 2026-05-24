<?php
ini_set('session.cookie_lifetime', 0);
ini_set('session.gc_maxlifetime', 7200);
session_start();

include '../koneksi.php';

/* CEK LOGIN + ROLE */
if (!isset($_SESSION['login']) || $_SESSION['role'] != 'siswa') {
    header("Location: ../login.html");
    exit;
}

$id_siswa = $_SESSION['ref_id'];
$ekskul_id = $_POST['ekskul_id'] ?? null;

if (!$ekskul_id) {
    header("Location: ekstrakurikuler.php");
    exit;
}

/* 1. HITUNG EKSKUL YANG SUDAH DISETUJUI */
$cekApproved = mysqli_query($conn, "
    SELECT COUNT(*) AS total 
    FROM pendaftaran_ekskul 
    WHERE siswa_id='$id_siswa' AND status='approved'
");

$approved = mysqli_fetch_assoc($cekApproved);

if ($approved['total'] >= 4) {
    echo "<script>
        alert('Maksimal 4 ekstrakurikuler yang disetujui.');
        window.location='ekstrakurikuler.php';
    </script>";
    exit;
}

/* 2. CEK SUDAH PERNAH DAFTAR */
$cekDuplikat = mysqli_query($conn, "
    SELECT * FROM pendaftaran_ekskul
    WHERE siswa_id='$id_siswa' AND ekskul_id='$ekskul_id'
");

if (mysqli_num_rows($cekDuplikat) > 0) {
    echo "<script>
        alert('Kamu sudah mendaftar ekstrakurikuler ini.');
        window.location='ekstrakurikuler.php';
    </script>";
    exit;
}

// simpan sebagai pending
$query = mysqli_query($conn, "
    INSERT INTO pendaftaran_ekskul (siswa_id, ekskul_id, status)
    VALUES ('$id_siswa', '$ekskul_id', 'pending')
");

if (!$query) {
    die("Error: " . mysqli_error($conn));
}

header("Location: ekstrakurikuler.php?status=success");
