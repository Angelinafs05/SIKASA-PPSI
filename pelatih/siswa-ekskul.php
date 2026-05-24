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

/* ================== AMBIL EKSKUL PELATIH ================== */
$qEkskul = mysqli_query($conn, "
    SELECT ekskul_id 
    FROM pelatih 
    WHERE id = '$id_pelatih'
");

$dataEkskul = mysqli_fetch_assoc($qEkskul);
$id_ekskul = $dataEkskul['ekskul_id'];

/* ================== DATA SISWA ================== */
$siswa = mysqli_query($conn, "
    SELECT 
        pe.id AS id_daftar,
        s.id AS id_siswa,
        s.nama_siswa,
        k.nama_kelas,
        pe.tanggal_daftar
    FROM pendaftaran_ekskul pe
    JOIN siswa s ON pe.siswa_id = s.id
    LEFT JOIN kelas k ON s.kelas_id = k.id
    WHERE pe.ekskul_id = '$id_ekskul'
    AND pe.status = 'approved'
    ORDER BY s.nama_siswa ASC
");

$pageTitle = "Siswa Ekskul";
$pageSubtitle = "Daftar siswa yang mengikuti ekstrakurikuler";
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Siswa Ekskul | SIKASA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">
        <?php include '../layout/sidebar-pelatih.php'; ?>

        <main class="content">
            <?php include '../layout/header-pelatih.php'; ?>

            <div class="data-card">
                <h2>Data Siswa Ekskul</h2>
                <p>Daftar seluruh siswa yang aktif mengikuti kegiatan ekstrakurikuler</p>

                <?php if ($siswa && mysqli_num_rows($siswa) > 0) { ?>
                    <div class="table-container">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th width="50">No</th>
                                    <th>Nama Siswa</th>
                                    <th>Kelas</th>
                                    <th>Tanggal Bergabung</th>
                                    <th width="150" style="text-align: center;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $no = 1;
                                while ($row = mysqli_fetch_assoc($siswa)) {
                                ?>
                                    <tr>
                                        <td><?= $no++; ?></td>
                                        <td><strong><?= htmlspecialchars($row['nama_siswa']); ?></strong></td>
                                        <td><?= htmlspecialchars($row['nama_kelas'] ?? '-'); ?></td>
                                        <td><?= date('d M Y', strtotime($row['tanggal_daftar'])); ?></td>
                                        <td style="text-align: center;">
                                            <span class="badge badge-success" style="background-color: #dcfce7; color: #15803d; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                                Aktif
                                            </span>
                                        </td>
                                    </tr>
                                <?php } ?>
                            </tbody>
                        </table>
                    </div>
                <?php } else { ?>
                    <div class="info">
                        <p>Belum ada siswa yang terdaftar di ekskul ini.</p>
                    </div>
                <?php } ?>
            </div>
        </main>
    </div>

    <?php include '../layout/footer.php'; ?>

    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();
    </script>
</body>

</html>