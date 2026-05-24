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

/* ================== DATA EKSKUL ================== */
$qEkskul = mysqli_query($conn, "
    SELECT id, nama_ekskul 
    FROM ekstrakurikuler 
    ORDER BY nama_ekskul ASC
");

if (!$qEkskul) {
    die("Query ekskul error: " . mysqli_error($conn));
}

/* ================== SIMPAN DATA ================== */
if (isset($_POST['simpan'])) {
    $nama_pelatih = $_POST['nama_pelatih'];
    $no_hp        = $_POST['no_hp'];
    $alamat       = $_POST['alamat'];
    // Ubah: sekarang mengambil teks nama ekskul, bukan ID
    $nama_ekskul_input = $_POST['nama_ekskul_input'];
    $pendamping   = $_POST['pendamping'] ?: NULL;

    /* otomatis tentukan asal pelatih */
    $asal = $pendamping ? 'luar' : 'dalam';

    $insert = mysqli_query($conn, "
        INSERT INTO pelatih (nama_pelatih, no_hp, alamat, pendamping, asal)
        VALUES ('$nama_pelatih', '$no_hp', '$alamat', " .
        ($pendamping ? "'$pendamping'" : "NULL") . ", '$asal')
    ");

    if ($insert) {
        $pelatih_id = mysqli_insert_id($conn);
        $username = strtolower(str_replace(' ', '', $nama_pelatih)) . rand(100, 999);
        $password_hash = password_hash("123456", PASSWORD_DEFAULT);

        // Masukkan ke tabel users
        mysqli_query($conn, "
            INSERT INTO users (nama, username, password, role, ref_id)
            VALUES ('$nama_pelatih', '$username', '$password_hash', 'pelatih', '$pelatih_id')
        ");

        header("Location: pelatih.php");
        exit;
    }
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Tambah Pelatih | SIKASA</title>

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
                    <h1>Tambah Pelatih</h1>
                    <p>Tambahkan pelatih baru ke sistem</p>
                </div>

                <div class="page-action">
                    <a href="pelatih.php" class="btn btn-secondary">
                        ← Kembali
                    </a>
                </div>

            </div>

            <!-- ================= FORM ================= -->
            <div class="form-container">

                <div class="form-card">

                    <?php if (!empty($error)) { ?>
                        <div class="info danger">
                            <?= $error; ?>
                        </div>
                    <?php } ?>

                    <form method="POST">

                        <div class="form-grid">

                            <!-- NAMA -->
                            <div class="form-group">
                                <label>Nama Pelatih</label>
                                <input type="text" name="nama_pelatih" required>
                            </div>

                            <!-- NO HP -->
                            <div class="form-group">
                                <label>No HP</label>
                                <input type="text" name="no_hp">
                            </div>

                            <!-- EKSTRAKURIKULER -->
                            <div class="form-group">
                                <label>Ekstrakurikuler yang Diampu</label>
                                <input type="text" name="nama_ekskul_input" placeholder="Contoh: Futsal, Pramuka..." required>
                            </div>

                            <!-- PENDAMPING -->
                            <div class="form-group">
                                <label>Pendamping (Opsional)</label>
                                <input type="text" name="pendamping" placeholder="Nama guru pendamping">
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

                            <a href="pelatih.php"
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