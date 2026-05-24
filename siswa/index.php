<?php
// Pengaturan session
ini_set('session.cookie_lifetime', 0);
ini_set('session.gc_maxlifetime', 7200); // 2 jam
session_start();

include '../koneksi.php';

/* CEK LOGIN */
if (!isset($_SESSION['login']) || $_SESSION['role'] != 'siswa') {
    header("Location: ../login.html");
    exit;
}

/* AMBIL ID SISWA DARI SESSION */
$id_siswa = $_SESSION['ref_id'];

/* HITUNG EKSKUL YANG SUDAH DISETUJUI */
$queryEkskul = mysqli_query($conn, "
    SELECT COUNT(*) AS total
    FROM pendaftaran_ekskul
    WHERE siswa_id = '$id_siswa'
    AND status = 'approved'
");

$dataEkskul  = mysqli_fetch_assoc($queryEkskul);
$totalEkskul = $dataEkskul['total'];

$pageTitle = "Dashboard Siswa";
$showWelcome = true;
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Dashboard Siswa | SIKASA</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-siswa.php'; ?>

        <main class="content">

            <?php include '../layout/header-siswa.php'; ?>

            <section class="cards">
                <div class="card">
                    <h3>Ekstrakurikuler Diikuti</h3>
                    <p><?= $totalEkskul ?> Ekskul</p>
                </div>
                <div class="card">
                    <h3>Jadwal Minggu Ini</h3>
                    <p>3 Kegiatan</p>
                </div>
                <div class="card">
                    <h3>Kehadiran</h3>
                    <p>90%</p>
                </div>
            </section>

        </main>
    </div>
    <?php include '../layout/footer.php'; ?>
</body>

</html>