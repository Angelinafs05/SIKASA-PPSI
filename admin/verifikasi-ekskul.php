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

$id   = $_GET['id'];
$aksi = $_GET['aksi'];

if (!in_array($aksi, ['approved', 'rejected'])) {
    header("Location: pendaftaran-ekskul.php");
    exit;
}

mysqli_query($conn, "
    UPDATE pendaftaran_ekskul 
    SET status='$aksi' 
    WHERE id='$id'
");

$cek = mysqli_query($conn, "
    SELECT status FROM pendaftaran_ekskul WHERE id = '$id'
");
$data = mysqli_fetch_assoc($cek);

if ($data['status'] == 'pending') {
    mysqli_query($conn, "
        UPDATE pendaftaran_ekskul 
        SET status = '$aksi'
        WHERE id = '$id'
    ");
}

header("Location: pendaftaran-ekskul.php");
