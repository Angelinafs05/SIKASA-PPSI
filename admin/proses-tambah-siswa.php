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

if (isset($_POST['simpan'])) {

    $nama_siswa    = $_POST['nama_siswa'];
    $username      = $_POST['username'];
    $password      = $_POST['password'];
    $kelas_id      = $_POST['kelas_id'];
    $tanggal_lahir = $_POST['tanggal_lahir'] ?: NULL;
    $no_hp         = $_POST['no_hp'] ?: NULL;
    $alamat        = $_POST['alamat'] ?: NULL;

    /* ================= CEK USERNAME SUDAH ADA ================= */
    $cekUser = mysqli_query($conn, "
        SELECT id FROM users WHERE username = '$username'
    ");

    if (mysqli_num_rows($cekUser) > 0) {
        die("Username sudah digunakan!");
    }

    /* ================= SIMPAN KE TABEL SISWA ================= */
    $insertSiswa = mysqli_query($conn, "
        INSERT INTO siswa (nama_siswa, kelas_id, tanggal_lahir, no_hp, alamat)
        VALUES (
            '$nama_siswa',
            '$kelas_id',
            " . ($tanggal_lahir ? "'$tanggal_lahir'" : "NULL") . ",
            " . ($no_hp ? "'$no_hp'" : "NULL") . ",
            " . ($alamat ? "'$alamat'" : "NULL") . "
        )
    ");

    if (!$insertSiswa) {
        die("Gagal simpan siswa: " . mysqli_error($conn));
    }

    /* ================= AMBIL ID SISWA TERBARU ================= */
    $siswa_id = mysqli_insert_id($conn);

    /* ================= HASH PASSWORD ================= */
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    /* ================= SIMPAN KE USERS ================= */
    $insertUser = mysqli_query($conn, "
        INSERT INTO users (username, password, role, ref_id)
        VALUES (
            '$username',
            '$password_hash',
            'siswa',
            '$siswa_id'
        )
    ");

    if (!$insertUser) {
        die("Gagal membuat akun login: " . mysqli_error($conn));
    }

    /* ================= REDIRECT ================= */
    header("Location: data-siswa.php?kelas_id=$kelas_id");
    exit;
}
