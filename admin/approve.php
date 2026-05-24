<?php
include '../koneksi.php';

$id = $_GET['id'];

mysqli_query($conn, "
    UPDATE pendaftaran_ekskul
    SET status = 'approved'
    WHERE id = '$id'
");

header("Location: index.php");
exit;
