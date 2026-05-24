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

// ambil id dari URL
$id = $_GET['id'] ?? null;
if (!$id) {
    header("Location: ekstrakurikuler.php");
    exit;
}

// ambil data lama
$query = mysqli_query($conn, "
    SELECT e.*, p.nama_pelatih AS pelatih
    FROM ekstrakurikuler e
    LEFT JOIN pelatih p ON p.ekskul_id = e.id
    WHERE e.id = '$id'
");

$data = mysqli_fetch_assoc($query);

// ambil semua pelatih
$pelatihList = mysqli_query($conn, "SELECT * FROM pelatih");

if (!$data) {
    echo "Data tidak ditemukan";
    exit;
}

// proses update
if (isset($_POST['update'])) {
    $nama_ekskul = $_POST['nama_ekskul'];
    $pelatih_id = $_POST['pelatih_id'];
    $hari        = $_POST['hari'];
    $jam         = $_POST['jam'];
    $tempat       = $_POST['tempat'];

    $update = mysqli_query($conn, "
        UPDATE ekstrakurikuler SET
            nama_ekskul = '$nama_ekskul',
            pelatih_id  = '$pelatih_id',
            hari        = '$hari',
            jam         = '$jam',
            tempat      = '$tempat'
        WHERE id = '$id'
    ");

    if ($update) {
        header("Location: ekstrakurikuler.php");
        exit;
    } else {
        echo "Gagal mengupdate data: " . mysqli_error($conn);
    }
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Edit Ekstrakurikuler</title>

    <!-- Font Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <!-- ================= HEADER HALAMAN ================= -->
            <div class="page-header">

                <div class="page-title">
                    <h1>Edit Ekstrakurikuler</h1>
                    <p>Perbarui informasi kegiatan ekstrakurikuler</p>
                </div>

                <div class="page-action">
                    <a href="ekstrakurikuler.php" class="btn btn-secondary">
                        ← Kembali
                    </a>
                </div>

            </div>

            <!-- ================= FORM CARD ================= -->
            <div class="form-container">

                <div class="form-card">

                    <form method="POST">

                        <div class="form-grid">

                            <div class="form-group">
                                <label>Nama Ekstrakurikuler</label>
                                <input type="text" name="nama_ekskul"
                                    value="<?= htmlspecialchars($data['nama_ekskul']); ?>" required>
                            </div>

                            <div class="form-group">
                                <label>Pelatih</label>
                                <select name="pelatih_id" required>

                                    <?php while ($p = mysqli_fetch_assoc($pelatihList)) { ?>

                                        <option value="<?= $p['id']; ?>"
                                            <?= ($data['pelatih_id'] ?? '') == $p['id'] ? 'selected' : '' ?>>

                                            <?= htmlspecialchars($p['nama_pelatih']); ?>

                                        </option>

                                    <?php } ?>

                                </select>
                            </div>

                            <div class="form-group">
                                <label>Hari</label>
                                <input type="text" name="hari"
                                    value="<?= htmlspecialchars($data['hari']); ?>" required>
                            </div>

                            <div class="form-group">
                                <label>Jam</label>
                                <input type="text" name="jam"
                                    value="<?= htmlspecialchars($data['jam']); ?>" required>
                            </div>

                            <div class="form-group full">
                                <label>Tempat</label>
                                <input type="text" name="tempat"
                                    value="<?= htmlspecialchars($data['tempat']); ?>" required>
                            </div>

                        </div>

                        <!-- ACTION BUTTON -->
                        <div class="form-actions">

                            <button type="submit" name="update"
                                class="btn btn-primary">
                                Simpan Perubahan
                            </button>

                            <a href="ekstrakurikuler.php"
                                class="btn btn-outline">
                                Batal
                            </a>

                        </div>

                    </form>

                </div>

            </div>

        </main>
    </div>

    <?php include '../layout/footer.php'; ?>

</body>

</html>