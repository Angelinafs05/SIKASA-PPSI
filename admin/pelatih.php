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

$pageTitle = "Data Pelatih";
$pageSubtitle = "Kelola data pelatih ekstrakurikuler";

$pelatih_id = $_GET['pelatih_id'] ?? null;

/* ================== DATA PELATIH ================== */
$qPelatih = mysqli_query($conn, "
    SELECT 
        p.*,
        e.nama_ekskul
    FROM pelatih p
    LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id
    ORDER BY p.nama_pelatih ASC
");

if (!$qPelatih) {
    die("Query pelatih error: " . mysqli_error($conn));
}

/* ================== DETAIL PELATIH ================== */
$detail = null;

if ($pelatih_id) {
    $qDetail = mysqli_query($conn, "
        SELECT 
            p.*,
            e.nama_ekskul
        FROM pelatih p
        LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id
        WHERE p.id = '$pelatih_id'
    ");

    if (!$qDetail) {
        die("Query detail pelatih error: " . mysqli_error($conn));
    }

    $detail = mysqli_fetch_assoc($qDetail);
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Data Pelatih</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>
    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <?php include '../layout/header-admin.php'; ?>

            <!-- ================= ACTION ================= -->
            <div class="filter-bar">
                <div></div>
                <div class="filter-action">
                    <a href="tambah-pelatih.php" class="btn btn-primary">
                        + Tambah Pelatih
                    </a>
                </div>
            </div>

            <?php if (mysqli_num_rows($qPelatih) == 0) { ?>

                <p class="info">Belum ada data pelatih</p>

            <?php } else { ?>

                <div class="siswa-list">

                    <?php
                    mysqli_data_seek($qPelatih, 0);
                    while ($p = mysqli_fetch_assoc($qPelatih)) {

                        $isActive = ($pelatih_id == $p['id']);

                        $link = $isActive
                            ? "pelatih.php"
                            : "pelatih.php?pelatih_id={$p['id']}";
                    ?>

                        <div class="siswa-row">

                            <!-- CARD PELATIH -->
                            <a href="<?= $link ?>" class="siswa-card <?= $isActive ? 'active' : '' ?>">
                                <div class="siswa-avatar">
                                    <?= strtoupper(substr($p['nama_pelatih'], 0, 1)); ?>
                                </div>
                                <div class="siswa-info">
                                    <h4>
                                        <?= htmlspecialchars($p['nama_pelatih']); ?>

                                        <?php if (!empty($p['pendamping'])) { ?>
                                            <span class="badge badge-warning">Eksternal</span>
                                        <?php } else { ?>
                                            <span class="badge badge-success">Internal</span>
                                        <?php } ?>
                                    </h4>
                                    <p>Pelatih</p>
                                </div>
                            </a>

                            <!-- DETAIL INLINE -->
                            <?php if ($isActive && $detail) { ?>
                                <div class="detail-inline">
                                    <p><strong>No HP:</strong> <?= $detail['no_hp'] ?? '-'; ?></p>
                                    <p><strong>Alamat:</strong> <?= $detail['alamat'] ?? '-'; ?></p>
                                    <p><strong>Ekstrakurikuler:</strong>
                                        <?= $detail['nama_ekskul'] ?? 'Belum ditentukan'; ?>
                                    </p>
                                    <?php if (!empty($detail['pendamping'])) { ?>
                                        <p><strong>Pendamping:</strong> <?= htmlspecialchars($detail['pendamping']); ?></p>
                                    <?php } ?>

                                    <div class="detail-actions">

                                        <a href="edit-pelatih.php?id=<?= $detail['id']; ?>"
                                            class="aksi-btn edit-btn"
                                            title="Edit Pelatih">
                                            <i data-lucide="pencil"></i>
                                        </a>

                                        <a href="hapus-pelatih.php?id=<?= $detail['id']; ?>"
                                            class="aksi-btn delete-btn"
                                            title="Hapus Pelatih"
                                            onclick="return confirm('Yakin ingin menghapus pelatih ini?')">
                                            <i data-lucide="trash-2"></i>
                                        </a>

                                    </div>
                                </div>
                            <?php } else { ?>
                                <div></div>
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