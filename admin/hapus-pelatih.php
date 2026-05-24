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
    header("Location: pelatih.php");
    exit;
}

// hapus pelatih
mysqli_query($conn, "DELETE FROM pelatih WHERE id = '$id'");

header("Location: pelatih.php");
exit;
