<?php
ini_set('session.cookie_lifetime', 0);
ini_set('session.gc_maxlifetime', 7200);
session_start();

include '../koneksi.php';

/* CEK LOGIN + ROLE */
if (!isset($_SESSION['login']) || $_SESSION['role'] != 'admin') {
    header("Location: ../login.html");
    exit;
}

$id = $_GET['id'] ?? null;

if (!$id) {
    echo "ID siswa tidak ditemukan";
    exit;
}

// hapus relasi ekskul dulu
mysqli_query($conn, "
    DELETE FROM pendaftaran_ekskul 
    WHERE siswa_id = '$id'
");

// hapus siswa
$hapus = mysqli_query($conn, "
    DELETE FROM siswa 
    WHERE id = '$id'
");

if ($hapus) {
    header("Location: data-siswa.php");
    exit;
} else {
    echo "Gagal menghapus siswa: " . mysqli_error($conn);
}
