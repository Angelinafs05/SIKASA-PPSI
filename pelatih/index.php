<?php
ini_set('session.cookie_lifetime', 0);
ini_set('session.gc_maxlifetime', 7200);
session_start();

include '../koneksi.php';

/* CEK LOGIN + ROLE */
if (!isset($_SESSION['login']) || $_SESSION['role'] != 'pelatih') {
    header("Location: ../login.html");
    exit;
}

$id_pelatih = $_SESSION['ref_id'];

/* ================== DATA PELATIH ================== */
$qPelatih = mysqli_query($conn, "
    SELECT p.*, e.nama_ekskul
    FROM pelatih p
    LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id
    WHERE p.id = '$id_pelatih'
");

$pelatih = mysqli_fetch_assoc($qPelatih);
$ekskul_id = $pelatih['ekskul_id'] ?? 0;

/* ================== TOTAL SISWA ================== */
$qTotalSiswa = mysqli_query($conn, "
    SELECT COUNT(*) AS total
    FROM pendaftaran_ekskul
    WHERE ekskul_id = '$ekskul_id'
    AND status = 'approved'
");

$totalSiswa = mysqli_fetch_assoc($qTotalSiswa)['total'] ?? 0;

/* ================== DAFTAR SISWA (VARIABEL $qSiswa) ================== */
$qSiswa = mysqli_query($conn, "
    SELECT s.nama_siswa, k.nama_kelas, p.tanggal_daftar, p.status
    FROM pendaftaran_ekskul p
    JOIN siswa s ON p.siswa_id = s.id
    JOIN kelas k ON s.kelas_id = k.id
    WHERE p.ekskul_id = '$ekskul_id' AND p.status = 'approved'
    ORDER BY s.nama_siswa ASC
");

/* ================== DAFTAR PERSETUJUAN (VARIABLE $qSiswaPending) ================== */
// Query ini hanya mengambil siswa yang statusnya 'pending' agar otomatis hilang jika diproses
$qSiswaPending = mysqli_query($conn, "
    SELECT p.id AS id_daftar, s.nama_siswa, k.nama_kelas, p.tanggal_daftar, p.status
    FROM pendaftaran_ekskul p
    JOIN siswa s ON p.siswa_id = s.id
    JOIN kelas k ON s.kelas_id = k.id
    WHERE p.ekskul_id = '$ekskul_id' AND p.status = 'pending'
    ORDER BY p.tanggal_daftar ASC
");

$pageTitle = "Dashboard Pelatih";
$pageSubtitle = "Selamat datang, " . $pelatih['nama_pelatih'];
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Dashboard Pelatih | SIKASA</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">
        <?php include '../layout/sidebar-pelatih.php'; ?>

        <main class="content">
            <?php include '../layout/header-pelatih.php'; ?>

            <div class="cards">
                <div class="card">
                    <h3>Ekstrakurikuler</h3>
                    <h1><?= $pelatih['nama_ekskul'] ?? '-'; ?></h1>
                    <p>Bidang Kepelatihan</p>
                </div>

                <div class="card">
                    <h3>Siswa Terdaftar (Aktif)</h3>
                    <h1><?= $totalSiswa; ?></h1>
                    <p>Siswa yang sudah disetujui</p>
                </div>

                <div class="card">
                    <h3>Status Akun</h3>
                    <h1>Aktif</h1>
                    <p>Pelatih SIKASA</p>
                </div>
            </div>

            <div class="table-section">
                <div class="page-header">
                    <div class="page-title">
                        <h1>Persetujuan Siswa Baru</h1>
                        <p>Daftar pengajuan ekskul <?= $pelatih['nama_ekskul'] ?? ''; ?> yang menunggu verifikasi Anda</p>
                    </div>
                </div>

                <?php if ($qSiswaPending && mysqli_num_rows($qSiswaPending) > 0): ?>
                    <div class="table-container">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th>Nama Siswa</th>
                                    <th>Kelas</th>
                                    <th>Tanggal Daftar</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php while ($row = mysqli_fetch_assoc($qSiswaPending)): ?>
                                    <tr>
                                        <td><strong><?= $row['nama_siswa']; ?></strong></td>
                                        <td><?= $row['nama_kelas']; ?></td>
                                        <td><?= date('d M Y', strtotime($row['tanggal_daftar'])); ?></td>
                                        <td>
                                            <div style="display:flex; gap:8px;">
                                                <a href="proses_approval.php?id=<?= $row['id_daftar']; ?>&status=approved"
                                                    class="btn btn-primary"
                                                    onclick="return confirm('Setujui siswa ini?')">
                                                    Setujui
                                                </a>
                                                <a href="proses_approval.php?id=<?= $row['id_daftar']; ?>&status=rejected"
                                                    class="btn btn-danger"
                                                    onclick="return confirm('Tolak pendaftaran ini?')">
                                                    Tolak
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endwhile; ?>
                            </tbody>
                        </table>
                    </div>
                <?php else: ?>
                    <div class="info">
                        <p>Tidak ada pendaftaran baru yang menunggu persetujuan.</p>
                    </div>
                <?php endif; ?>
            </div>
        </main>
    </div>

    <?php include '../layout/footer.php'; ?>
</body>

</html>