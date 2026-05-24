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

$pageTitle = "Pendaftaran Ekstrakurikuler";

/* AMBIL DATA PENDAFTARAN */
$data = mysqli_query($conn, "
    SELECT 
        pe.id,
        s.nama_siswa AS nama_siswa,
        e.nama_ekskul,
        pe.status
    FROM pendaftaran_ekskul pe
    JOIN siswa s ON pe.siswa_id = s.id
    JOIN ekstrakurikuler e ON pe.ekskul_id = e.id
    ORDER BY pe.status ASC, pe.id DESC
");
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title><?= $pageTitle; ?></title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <?php include '../layout/header-admin.php'; ?>

            <!-- ====== TABEL PENDAFTARAN EKSKUL ====== -->
            <div class="table-section">

                <h2>Daftar Pendaftaran</h2>

                <table>
                    <tr>
                        <th>Nama Siswa</th>
                        <th>Ekstrakurikuler</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>

                    <?php while ($row = mysqli_fetch_assoc($data)) { ?>
                        <tr>
                            <td><?= htmlspecialchars($row['nama']) ?></td>
                            <td><?= htmlspecialchars($row['nama_ekskul']) ?></td>
                            <td><?= ucfirst($row['status']) ?></td>
                            <td>
                                <?php if ($row['status'] == 'pending') { ?>
                                    <a href="verifikasi-ekskul.php?id=<?= $row['id'] ?>&aksi=approved"
                                        class="btn btn-primary">
                                        Setujui
                                    </a>

                                    <a href="verifikasi-ekskul.php?id=<?= $row['id'] ?>&aksi=rejected"
                                        class="btn btn-danger">
                                        Tolak
                                    </a>
                                <?php } else { ?>
                                    -
                                <?php } ?>
                            </td>
                        </tr>
                    <?php } ?>
                </table>

            </div>

        </main>
    </div>

    <?php include '../layout/footer.php'; ?>
</body>

</html>