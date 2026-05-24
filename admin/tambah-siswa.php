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

$kelas_id = $_GET['kelas_id'] ?? null;

/* ================== AMBIL DATA KELAS ================== */
$kelas = mysqli_query($conn, "
    SELECT id, nama_kelas 
    FROM kelas 
    ORDER BY nama_kelas ASC
");
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Tambah Siswa | SIKASA</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">
        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <!-- ================= HEADER HALAMAN ================= -->
            <div class="page-header">

                <div class="page-title">
                    <h1>Tambah Siswa</h1>
                    <p>Tambahkan siswa baru ke sistem</p>
                </div>

                <div class="page-action">
                    <a href="data-siswa.php" class="btn btn-secondary">
                        ← Kembali
                    </a>
                </div>

            </div>

            <!-- ================= FORM ================= -->
            <div class="form-container">

                <div class="form-card">

                    <form method="POST" action="proses-tambah-siswa.php">

                        <div class="form-grid">

                            <!-- NAMA -->
                            <div class="form-group">
                                <label>Nama Siswa</label>
                                <input type="text" name="nama_siswa" required>
                            </div>

                            <!-- USERNAME -->
                            <div class="form-group">
                                <label>Username</label>
                                <input type="text" name="username" required>
                            </div>

                            <!-- PASSWORD -->
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" name="password" required>
                            </div>

                            <!-- KELAS -->
                            <div class="form-group">
                                <label>Kelas</label>
                                <select name="kelas_id" required>
                                    <option value="">Pilih kelas...</option>
                                    <?php while ($k = mysqli_fetch_assoc($kelas)) { ?>
                                        <option value="<?= $k['id']; ?>"
                                            <?= ($kelas_id == $k['id']) ? 'selected' : '' ?>>
                                            Kelas <?= $k['nama_kelas']; ?>
                                        </option>
                                    <?php } ?>
                                </select>
                            </div>

                            <!-- TANGGAL LAHIR -->
                            <div class="form-group">
                                <label>Tanggal Lahir</label>
                                <input type="date" name="tanggal_lahir">
                            </div>

                            <!-- NO HP -->
                            <div class="form-group">
                                <label>No. HP</label>
                                <input type="text" name="no_hp">
                            </div>

                            <!-- ALAMAT -->
                            <div class="form-group full">
                                <label>Alamat</label>
                                <textarea name="alamat" rows="3"></textarea>
                            </div>

                        </div>

                        <!-- BUTTON -->
                        <div class="form-actions">

                            <button type="submit" name="simpan"
                                class="btn btn-primary">
                                Simpan
                            </button>

                            <a href="data-siswa.php<?= $kelas_id ? '?kelas_id=' . $kelas_id : '' ?>"
                                class="btn btn-outline">
                                Batal
                            </a>

                        </div>

                    </form>

                </div>

            </div>

        </main>

    </div>

</body>

</html>