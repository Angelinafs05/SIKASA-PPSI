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

$pageTitle = "Data Siswa";
$pageSubtitle = "Kelola data siswa per kelas";

/* ================== DATA KELAS ================== */
$kelas = mysqli_query($conn, "
    SELECT id, nama_kelas 
    FROM kelas 
    ORDER BY nama_kelas ASC
");

$kelas_id = $_GET['kelas_id'] ?? null;
$siswa_id = $_GET['siswa_id'] ?? null;

/* ================== DATA SISWA PER KELAS ================== */
$siswa = null;

if ($kelas_id) {
    $querySiswa = "
        SELECT * FROM siswa
        WHERE kelas_id = '$kelas_id'
        ORDER BY nama_siswa ASC
    ";
    $siswa = mysqli_query($conn, $querySiswa);
}

/* ================== DETAIL SISWA ================== */
$detail = null;
$totalEkskul = 0;

if ($siswa_id) {
    $detail = mysqli_fetch_assoc(mysqli_query($conn, "
        SELECT s.*, k.nama_kelas
        FROM siswa s
        JOIN kelas k ON s.kelas_id = k.id
        WHERE s.id = '$siswa_id'
    "));

    $qEkskul = mysqli_query($conn, "
        SELECT COUNT(*) AS total
        FROM pendaftaran_ekskul
        WHERE siswa_id = '$siswa_id'
        AND status = 'approved'
    ");

    $totalEkskul = mysqli_fetch_assoc($qEkskul)['total'];
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Data Siswa</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <?php include '../layout/header-admin.php'; ?>

            <!-- ================= FILTER & ACTION ================= -->
            <div class="filter-card">

                <form method="GET" class="filter-content">

                    <div class="filter-group">

                        <label>Pilih Kelas</label>

                        <div class="modern-select">
                            <select name="kelas_id" onchange="this.form.submit()">
                                <option value="">Pilih kelas...</option>

                                <?php
                                mysqli_data_seek($kelas, 0);
                                while ($k = mysqli_fetch_assoc($kelas)) {
                                    $selected = ($kelas_id == $k['id']) ? 'selected' : '';
                                    echo "<option value='{$k['id']}' $selected>
                            Kelas {$k['nama_kelas']}
                        </option>";
                                }
                                ?>
                            </select>
                            <span class="select-icon">▾</span>
                        </div>

                    </div>

                    <a href="tambah-siswa.php<?= $kelas_id ? '?kelas_id=' . $kelas_id : '' ?>"
                        class="btn btn-primary tambah-siswa-btn">
                        + Tambah Siswa
                    </a>

                </form>

            </div>

            <?php
            // BELUM PILIH KELAS
            if (!$kelas_id) {
                echo "<p class='info'>Silakan pilih kelas terlebih dahulu</p>";
            }

            // KELAS DIPILIH TAPI KOSONG
            elseif ($kelas_id && (!$siswa || mysqli_num_rows($siswa) == 0)) {
                echo "<p class='info'>Tidak ada siswa di kelas ini</p>";
            }

            // KELAS DIPILIH & ADA SISWA
            else {
            ?>
                <div class="siswa-list">

                    <?php
                    mysqli_data_seek($siswa, 0);
                    while ($s = mysqli_fetch_assoc($siswa)) {

                        $isActive = ($siswa_id == $s['id']);

                        $link = $isActive
                            ? "data-siswa.php?kelas_id=$kelas_id"
                            : "data-siswa.php?kelas_id=$kelas_id&siswa_id={$s['id']}";
                    ?>

                        <div class="siswa-row">

                            <!-- CARD SISWA (KIRI 50%) -->
                            <a href="<?= $link ?>" class="siswa-card <?= $isActive ? 'active' : '' ?>">
                                <div class="siswa-avatar">
                                    <?= strtoupper(substr($s['nama_siswa'], 0, 1)); ?>
                                </div>
                                <div class="siswa-info">
                                    <h4><?= htmlspecialchars($s['nama_siswa']); ?></h4>
                                    <p>Siswa</p>
                                </div>
                            </a>

                            <!-- DETAIL SISWA (KANAN 50%) -->
                            <?php if ($isActive && $detail) { ?>
                                <div class="detail-inline">
                                    <p><strong>Kelas:</strong> <?= $detail['nama_kelas']; ?></p>
                                    <p><strong>Tgl Lahir:</strong> <?= $detail['tanggal_lahir']; ?></p>
                                    <p><strong>No HP:</strong> <?= $detail['no_hp']; ?></p>
                                    <p><strong>Ekskul:</strong> <?= $totalEkskul; ?></p>

                                    <div class="detail-actions">

                                        <a href="edit-siswa.php?id=<?= $detail['id']; ?>"
                                            class="aksi-btn edit-btn"
                                            title="Edit Siswa">
                                            <i data-lucide="pencil"></i>
                                        </a>

                                        <a href="hapus-siswa.php?id=<?= $detail['id']; ?>"
                                            class="aksi-btn delete-btn"
                                            title="Hapus Siswa"
                                            onclick="return confirm('Yakin ingin menghapus siswa ini?')">
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

    </div>
<?php } ?>

<?php include '../layout/footer.php'; ?>

<script src="https://unpkg.com/lucide@latest"></script>
<script>
    lucide.createIcons();
</script>

</body>

</html>