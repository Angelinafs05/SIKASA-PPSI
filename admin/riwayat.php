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

/* ================== DATA RIWAYAT ================== */
$riwayat = mysqli_query($conn, "
    SELECT 
        pe.id,
        s.nama_siswa,
        e.nama_ekskul,
        pe.status,
        pe.tanggal_daftar,
        pe.tgl_proses
    FROM pendaftaran_ekskul pe
    LEFT JOIN siswa s ON pe.siswa_id = s.id
    LEFT JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
    WHERE pe.status != 'pending'
    ORDER BY pe.tgl_proses DESC
");

if (!$riwayat) {
    die("Query Error: " . mysqli_error($conn));
}

$pageTitle = "Riwayat Persetujuan";
$pageSubtitle = "Data persetujuan dan penolakan ekskul";
$headerButton = '
    <a href="index.php" class="btn btn-secondary">
        Kembali
    </a>
';
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Riwayat Persetujuan</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <?php include '../layout/header-admin.php'; ?>

            <!-- ================= TABEL RIWAYAT ================= -->
            <div class="table-section">

                <?php if ($riwayat && mysqli_num_rows($riwayat) > 0) { ?>

                    <div class="table-container">

                        <table class="modern-table">

                            <thead>
                                <tr>
                                    <th>Nama Siswa</th>
                                    <th>Ekstrakurikuler</th>
                                    <th>Tanggal Pengajuan</th>
                                    <th>Tanggal Diproses</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>

                                <?php while ($row = mysqli_fetch_assoc($riwayat)) { ?>
                                    <tr>

                                        <td><?= $row['nama_siswa']; ?></td>

                                        <td><?= $row['nama_ekskul']; ?></td>

                                        <td>
                                            <?= date('d M Y', strtotime($row['tanggal_daftar'])); ?>
                                        </td>

                                        <td>
                                            <?= $row['tgl_proses']
                                                ? date('d M Y H:i', strtotime($row['tgl_proses']))
                                                : '-' ?>
                                        </td>

                                        <td>

                                            <?php if ($row['status'] == 'approved') { ?>
                                                <span class="badge badge-success">
                                                    Disetujui
                                                </span>
                                            <?php } else { ?>
                                                <span class="badge badge-warning">
                                                    Ditolak
                                                </span>
                                            <?php } ?>

                                        </td>

                                    </tr>
                                <?php } ?>

                            </tbody>

                        </table>

                    </div>

                <?php } else { ?>

                    <div class="info">
                        Belum ada riwayat persetujuan.
                    </div>

                <?php } ?>

            </div>

        </main>
    </div>

    <?php include '../layout/footer.php'; ?>

</body>

</html>