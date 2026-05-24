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

// ambil id siswa
$id = $_GET['id'] ?? null;
if (!$id) {
    header("Location: data-siswa.php");
    exit;
}

// ambil data siswa
$query = mysqli_query($conn, "
    SELECT s.*, k.nama_kelas
    FROM siswa s
    JOIN kelas k ON s.kelas_id = k.id
    WHERE s.id = '$id'
");
$data = mysqli_fetch_assoc($query);

if (!$data) {
    echo "Data siswa tidak ditemukan";
    exit;
}

// ambil data kelas
$kelas = mysqli_query($conn, "
    SELECT id, nama_kelas 
    FROM kelas 
    ORDER BY nama_kelas ASC
");

// proses update
if (isset($_POST['update'])) {
    $nama   = $_POST['nama_siswa'];
    $kelas_id = $_POST['kelas_id'];
    $tgl    = $_POST['tanggal_lahir'];
    $no_hp  = $_POST['no_hp'];

    $update = mysqli_query($conn, "
        UPDATE siswa SET
            nama_siswa    = '$nama',
            kelas_id      = '$kelas_id',
            tanggal_lahir = '$tgl',
            no_hp         = '$no_hp'
        WHERE id = '$id'
    ");

    if ($update) {
        header("Location: data-siswa.php?kelas_id=$kelas_id&siswa_id=$id");
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
    <title>Edit Siswa</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <!-- ================= HEADER HALAMAN ================= -->
            <div class="page-header">

                <div class="page-title">
                    <h1>Edit Data Siswa</h1>
                    <p>Perbarui informasi siswa</p>
                </div>

                <div class="page-action">
                    <a href="data-siswa.php" class="btn btn-secondary">
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
                                <label>Nama Siswa</label>
                                <input type="text" name="nama_siswa"
                                    value="<?= htmlspecialchars($data['nama_siswa']); ?>" required>
                            </div>

                            <div class="form-group">
                                <label>Kelas</label>
                                <select name="kelas_id" required>
                                    <option value="">-- Pilih Kelas --</option>
                                    <?php while ($k = mysqli_fetch_assoc($kelas)) { ?>
                                        <option value="<?= $k['id']; ?>"
                                            <?= $k['id'] == $data['kelas_id'] ? 'selected' : ''; ?>>
                                            Kelas <?= $k['nama_kelas']; ?>
                                        </option>
                                    <?php } ?>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Tanggal Lahir</label>
                                <input type="date" name="tanggal_lahir"
                                    value="<?= $data['tanggal_lahir']; ?>" required>
                            </div>

                            <div class="form-group">
                                <label>No HP</label>
                                <input type="text" name="no_hp"
                                    value="<?= htmlspecialchars($data['no_hp']); ?>" required>
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
    </div>

    </div>
    </main>
    </div>

    <?php include '../layout/footer.php'; ?>

</body>

</html>