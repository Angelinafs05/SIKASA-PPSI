<?php
session_start();
include '../koneksi.php';

if (!isset($_SESSION['login']) || $_SESSION['role'] != 'pelatih') {
    exit("Akses ditolak");
}

$id_daftar = $_GET['id'];
$status_baru = $_GET['status']; // isinya 'approved' atau 'rejected'

// Update status pendaftaran
$query = mysqli_query($conn, "UPDATE pendaftaran_ekskul SET status = '$status_baru' WHERE id = '$id_daftar'");

if ($query) {
    header("Location: index.php?pesan=berhasil");
} else {
    echo "Gagal memproses data.";
}
