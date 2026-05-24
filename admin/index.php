<?php
ini_set('session.cookie_lifetime', 0);
ini_set('session.gc_maxlifetime', 7200);
session_start();

include '../koneksi.php';

/* CEK LOGIN + ROLE */
// if (!isset($_SESSION['login']) || $_SESSION['role'] != 'admin') {
//     header("Location: ../login.html");
//     exit;
// }

/* ================== DASHBOARD COUNTER ================== */
// TOTAL SISWA (sinkron dengan Data Siswa)
$qSiswa = mysqli_query($conn, "
    SELECT COUNT(*) AS total 
    FROM siswa 
    WHERE kelas_id IS NOT NULL
");
$totalSiswa = mysqli_fetch_assoc($qSiswa)['total'];

// TOTAL EKSTRAKURIKULER
$qEkskul = mysqli_query($conn, "
    SELECT COUNT(*) AS total 
    FROM ekstrakurikuler
");
$totalEkskul = mysqli_fetch_assoc($qEkskul)['total'];

// PENDAFTARAN AKTIF
$qAktif = mysqli_query($conn, "
    SELECT COUNT(DISTINCT siswa_id) AS total
    FROM pendaftaran_ekskul
    WHERE status = 'approved'
");
$totalAktif = mysqli_fetch_assoc($qAktif)['total'];

/* ================== DATA TABEL PENDAFTARAN ================== */
$pendaftaran = mysqli_query($conn, "
    SELECT 
        pe.id,
        s.nama_siswa,
        e.nama_ekskul,
        pe.status,
        pe.tanggal_daftar
    FROM pendaftaran_ekskul pe
    LEFT JOIN siswa s ON pe.siswa_id = s.id
    LEFT JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
    WHERE pe.status = 'pending'
    ORDER BY pe.tanggal_daftar DESC
");

if (!$pendaftaran) {
    die("Query Error: " . mysqli_error($conn));
}

$pageTitle = "Dashboard Admin";
$pageSubtitle = "Selamat datang";
$headerButton = '
';

?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Dashboard Admin</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <?php include '../layout/header-admin.php'; ?>


            <!-- ================= DASHBOARD CARD ================= -->
            <div class="cards">

                <!-- TOTAL SISWA -->
                <div class="card">
                    <h3>Total Siswa</h3>

                    <?php if ($totalSiswa > 0): ?>
                        <h1><?= $totalSiswa; ?></h1>
                        <p>Siswa terdaftar</p>
                    <?php else: ?>
                        <p>Belum ada data</p>
                    <?php endif; ?>

                </div>


                <!-- TOTAL EKSKUL -->
                <div class="card">
                    <h3>Total Ekstrakurikuler</h3>

                    <?php if ($totalEkskul > 0): ?>
                        <h1><?= $totalEkskul; ?></h1>
                        <p>Kegiatan tersedia</p>
                    <?php else: ?>
                        <p>Belum ada ekskul</p>
                    <?php endif; ?>

                </div>


                <!-- SISWA AKTIF -->
                <div class="card">
                    <h3>Siswa Aktif</h3>

                    <?php if ($totalAktif > 0): ?>
                        <h1><?= $totalAktif; ?></h1>
                        <p>Sedang mengikuti ekskul</p>
                    <?php else: ?>
                        <p>Belum ada siswa aktif</p>
                    <?php endif; ?>

                </div>

            </div>



            <!-- ================= TABEL PENDAFTARAN ================= -->
            <div class="table-section">

                <div class="page-header">

                    <div class="page-title">
                        <h1>Pendaftaran Ekstrakurikuler</h1>
                        <p>Pengajuan yang menunggu persetujuan admin</p>
                    </div>

                    <div class="page-action">
                        <a href="riwayat.php" class="btn btn-primary">
                            Riwayat
                        </a>
                    </div>

                </div>


                <?php if ($pendaftaran && mysqli_num_rows($pendaftaran) > 0) { ?>

                    <div class="table-container">

                        <table class="modern-table">

                            <thead>
                                <tr>
                                    <th>Nama Siswa</th>
                                    <th>Ekstrakurikuler</th>
                                    <th>Tanggal</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>

                            <tbody>

                                <?php while ($row = mysqli_fetch_assoc($pendaftaran)) { ?>
                                    <tr>

                                        <td><?= $row['nama_siswa']; ?></td>

                                        <td><?= $row['nama_ekskul']; ?></td>

                                        <td>
                                            <?= date('d M Y', strtotime($row['tanggal_daftar'])); ?>
                                        </td>

                                        <td>
                                            <span class="badge badge-warning">
                                                <?= $row['status']; ?>
                                            </span>
                                        </td>

                                        <td>

                                            <div style="display:flex; gap:8px; justify-content:center;">

                                                <a href="approve.php?id=<?= $row['id']; ?>"
                                                    class="btn btn-primary">
                                                    Terima
                                                </a>

                                                <a href="reject.php?id=<?= $row['id']; ?>"
                                                    class="btn btn-danger">
                                                    Tolak
                                                </a>

                                            </div>

                                        </td>

                                    </tr>
                                <?php } ?>

                            </tbody>

                        </table>

                    </div>

                <?php } else { ?>

                    <div class="info">
                        Tidak ada pendaftaran baru.
                    </div>

                <?php } ?>

            </div>


        </main>
    </div>

    <?php include '../layout/footer.php'; ?>

</body>

</html>