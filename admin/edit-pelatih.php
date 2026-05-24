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

$id = $_GET['id'] ?? null;
if (!$id) {
    header("Location: pelatih.php");
    exit;
}

// ambil data pelatih
$qPelatih = mysqli_query($conn, "
    SELECT * FROM pelatih WHERE id = '$id'
");
$data = mysqli_fetch_assoc($qPelatih);

if (!$data) {
    echo "Data pelatih tidak ditemukan";
    exit;
}

// data ekskul
$qEkskul = mysqli_query($conn, "
    SELECT id, nama_ekskul FROM ekstrakurikuler
");

// proses update
if (isset($_POST['update'])) {

    $nama       = $_POST['nama_pelatih'];
    $no_hp      = $_POST['no_hp'];
    $alamat     = $_POST['alamat'];
    $pendamping = $_POST['pendamping'];

    // ===============================
    // PROSES EKSTRAKURIKULER (VERSI PROFESIONAL)
    // ===============================

    $nama_ekskul = trim($_POST['nama_ekskul'] ?? '');
    $ekskul_id = NULL;

    if (!empty($nama_ekskul)) {

        // cek apakah ekskul sudah ada
        $cek = mysqli_query($conn, "
            SELECT id FROM ekstrakurikuler
            WHERE nama_ekskul = '$nama_ekskul'
            LIMIT 1
        ");

        if ($row = mysqli_fetch_assoc($cek)) {

            // jika sudah ada → pakai ID lama
            $ekskul_id = $row['id'];
        } else {

            // jika belum ada → buat baru
            mysqli_query($conn, "
                INSERT INTO ekstrakurikuler (nama_ekskul)
                VALUES ('$nama_ekskul')
            ");

            $ekskul_id = mysqli_insert_id($conn);
        }
    }

    // ===============================
    // UPDATE DATA PELATIH
    // ===============================

    mysqli_query($conn, "
        UPDATE pelatih SET
            nama_pelatih = '$nama',
            no_hp = '$no_hp',
            alamat = '$alamat',
            ekskul_id = " . ($ekskul_id ? "'$ekskul_id'" : "NULL") . ",
            pendamping = '$pendamping'
        WHERE id = '$id'
    ");

    header("Location: pelatih.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Edit Pelatih</title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <!-- ================= HEADER HALAMAN ================= -->
            <div class="page-header">

                <div class="page-title">
                    <h1>Edit Pelatih</h1>
                    <p>Perbarui informasi pelatih ekstrakurikuler</p>
                </div>

                <div class="page-action">
                    <a href="pelatih.php" class="btn btn-secondary">
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
                                <label>Nama Pelatih</label>
                                <input type="text" name="nama_pelatih"
                                    value="<?= htmlspecialchars($data['nama_pelatih']); ?>" required>
                            </div>

                            <div class="form-group">
                                <label>No HP</label>
                                <input type="text" name="no_hp"
                                    value="<?= htmlspecialchars($data['no_hp']); ?>" required>
                            </div>

                            <div class="form-group">
                                <label>Ekstrakurikuler</label>
                                <input type="text" name="nama_ekskul"
                                    value="<?= htmlspecialchars($data['nama_ekskul'] ?? ''); ?>"
                                    placeholder="Contoh: Futsal, Pramuka...">
                            </div>

                            <div class="form-group">
                                <label>Pendamping Pelatih (opsional)</label>
                                <input type="text" name="pendamping"
                                    value="<?= $data['pendamping']; ?>">
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

    </form>
    </div>

    </div>

    </main>
    </div>

    <?php include '../layout/footer.php'; ?>

</body>

</html>