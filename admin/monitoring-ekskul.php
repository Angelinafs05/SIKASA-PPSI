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

$pageTitle = "Monitoring Ekstrakurikuler";
$pageSubtitle = "Pantau kehadiran & nilai ekskul";

$ekskul_id = $_GET['ekskul_id'] ?? null;

/* ================== DATA EKSKUL ================== */
$qEkskul = mysqli_query($conn, "
    SELECT 
        e.id,
        e.nama_ekskul,
        p.nama_pelatih,
        COUNT(pe.id) AS total_siswa
    FROM ekstrakurikuler e
    LEFT JOIN pelatih p ON p.ekskul_id = e.id
    LEFT JOIN pendaftaran_ekskul pe 
        ON pe.ekskul_id = e.id 
        AND pe.status = 'approved'
    GROUP BY e.id, e.nama_ekskul, p.nama_pelatih
    ORDER BY e.nama_ekskul ASC
");

if (!$qEkskul) {
    die("Query error: " . mysqli_error($conn));
}

/* ================== DETAIL EKSKUL ================== */
$detail = null;

if ($ekskul_id) {
    $qDetail = mysqli_query($conn, "
        SELECT 
            e.nama_ekskul,
            p.nama_pelatih,
            COUNT(pe.id) AS total_siswa
        FROM ekstrakurikuler e
        LEFT JOIN pelatih p ON e.id = p.ekskul_id
        LEFT JOIN pendaftaran_ekskul pe 
            ON e.id = pe.ekskul_id AND pe.status = 'approved'
        WHERE e.id = '$ekskul_id'
        GROUP BY e.id
    ");
    $detail = mysqli_fetch_assoc($qDetail);
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Monitoring Ekskul</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">
        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">
            <?php include '../layout/header-admin.php'; ?>

            <?php if (mysqli_num_rows($qEkskul) == 0) { ?>
                <p class="info">Belum ada data ekstrakurikuler</p>
            <?php } else { ?>

                <div class="siswa-list">

                    <?php while ($e = mysqli_fetch_assoc($qEkskul)) {
                    ?>

                        <div class="siswa-list">

                            <?php while ($e = mysqli_fetch_assoc($qEkskul)) { ?>

                                <div class="siswa-row">

                                    <!-- CARD EKSKUL -->
                                    <div class="siswa-card">

                                        <div class="siswa-avatar">
                                            <?= strtoupper(substr($e['nama_ekskul'], 0, 1)); ?>
                                        </div>

                                        <div class="siswa-info">
                                            <h4><?= htmlspecialchars($e['nama_ekskul']); ?></h4>
                                            <p><?= $e['nama_pelatih'] ?? 'Belum ada pelatih'; ?></p>
                                        </div>

                                    </div>

                                    <!-- DETAIL LANGSUNG TAMPIL -->
                                    <div class="detail-inline">

                                        <p><strong>Pelatih:</strong>
                                            <?= $e['nama_pelatih'] ?? '-' ?>
                                        </p>

                                        <p><strong>Total Siswa:</strong>
                                            <?= $e['total_siswa'] ?? 0; ?>
                                        </p>

                                        <div class="detail-actions">

                                            <a href="monitoring-nilai.php?ekskul_id=<?= $e['id']; ?>"
                                                class="action-pill nilai-btn">
                                                <i data-lucide="bar-chart-3"></i>
                                                Lihat Nilai
                                            </a>

                                            <a href="monitoring-absensi.php?ekskul_id=<?= $e['id']; ?>"
                                                class="action-pill absensi-btn">
                                                <i data-lucide="calendar-check"></i>
                                                Lihat Absensi
                                            </a>

                                        </div>

                                    </div>

                                </div>

                            <?php } ?>

                        </div>
                    <?php } ?>

                </div>
            <?php } ?>

        </main>
    </div>

    <?php include '../layout/footer.php'; ?>

    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();
    </script>

</body>

</html>