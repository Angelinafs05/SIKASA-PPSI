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

// Ambil data pelatih
$qPelatih = mysqli_query($conn, "
    SELECT 
        p.id,
        p.nama_pelatih,
        e.nama_ekskul
    FROM pelatih p
    LEFT JOIN ekstrakurikuler e 
        ON p.ekskul_id = e.id
");

if (isset($_POST['simpan'])) {
    // Ambil data dari form
    $nama_ekskul = mysqli_real_escape_string($conn, $_POST['nama_ekskul']);
    $pelatih_id  = mysqli_real_escape_string($conn, $_POST['pelatih_id']);
    $hari        = mysqli_real_escape_string($conn, $_POST['hari']);
    $jam         = mysqli_real_escape_string($conn, $_POST['jam']);
    $tempat      = mysqli_real_escape_string($conn, $_POST['tempat']);

    // 1. Ambil nama pelatih berdasarkan ID yang dipilih
    $resP = mysqli_query($conn, "SELECT nama_pelatih FROM pelatih WHERE id = '$pelatih_id'");
    $dataPelatih = mysqli_fetch_assoc($resP);
    $nama_pelatih_str = $dataPelatih['nama_pelatih'];

    // 2. Insert ke tabel ekstrakurikuler
    // PASTIKAN: nama kolom di bawah ini (nama_ekskul, pelatih, hari, jam, tempat) 
    // sama persis dengan yang ada di database Anda.
    $queryInsert = mysqli_query($conn, "INSERT INTO ekstrakurikuler (nama_ekskul, pelatih, hari, jam, tempat) 
                                        VALUES ('$nama_ekskul', '$nama_pelatih_str', '$hari', '$jam', '$tempat')");

    if ($queryInsert) {
        // 3. Update ID ekskul yang baru saja dibuat ke tabel pelatih agar sinkron
        $new_id = mysqli_insert_id($conn);
        mysqli_query($conn, "UPDATE pelatih SET ekskul_id = '$new_id' WHERE id = '$pelatih_id'");

        echo "<script>alert('Data Berhasil Disimpan!'); window.location='ekstrakurikuler.php';</script>";
        exit;
    } else {
        // Jika gagal, tampilkan error untuk pelacakan
        die("Gagal menyimpan data: " . mysqli_error($conn));
    }
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Tambah Ekstrakurikuler | SIKASA</title>

    <!-- Font Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="../css/style.css">

    <style>
        .modern-select {
            width: 100%;
            position: relative;
            display: flex;
            align-items: center;
        }

        .modern-select select {
            width: 100%;
            padding: 12px 16px;
            /* Warna background disamakan (Putih Bersih) */
            background-color: #ffffff;
            /* Warna dan ketebalan border disamakan */
            border: 1px solid #cdd2da;
            border-radius: 12px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            color: #1e293b;
            appearance: none;
            -webkit-appearance: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        /* Efek saat diklik (Focus) disamakan dengan input lain */
        .modern-select select:focus {
            outline: none;
            border-color: #4f46e5;
            background-color: #ffffff;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .modern-select .select-icon {
            position: absolute;
            right: 16px;
            pointer-events: none;
            color: #64748b;
            font-size: 20px;
        }

        /* Memastikan input readonly (Nama Ekskul) punya warna berbeda sedikit agar terlihat otomatis */
        #nama_ekskul {
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0;
        }
    </style>
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <!-- ================= HEADER HALAMAN ================= -->
            <div class="page-header">

                <div class="page-title">
                    <h1>Tambah Ekstrakurikuler</h1>
                    <p>Tambahkan kegiatan ekstrakurikuler baru ke sistem</p>
                </div>

                <div class="page-action">
                    <a href="ekstrakurikuler.php" class="btn btn-secondary">
                        ← Kembali
                    </a>
                </div>

            </div>

            <!-- ================= FORM ================= -->
            <div class="form-container">

                <div class="form-card">

                    <form method="POST">

                        <div class="form-grid">

                            <!-- PILIH PELATIH -->
                            <div class="form-group">
                                <label>Pilih Pelatih</label>

                                <select name="pelatih_id" id="pelatihSelect" required>
                                    <option value="">-- Pilih Pelatih --</option>

                                    <?php while ($p = mysqli_fetch_assoc($qPelatih)) { ?>
                                        <option
                                            value="<?= $p['id']; ?>"
                                            data-ekskul="<?= htmlspecialchars($p['nama_ekskul'] ?? ''); ?>">

                                            <?= htmlspecialchars($p['nama_pelatih']); ?>
                                        </option>
                                    <?php } ?>
                                </select>
                                <span class="select-icon">▾</span>
                            </div>
                        </div>

                        <!-- NAMA EKSKUL -->
                        <div class="form-group">
                            <label>Nama Ekstrakurikuler</label>
                            <input
                                type="text"
                                id="nama_ekskul"
                                name="nama_ekskul"
                                readonly>
                        </div>

                        <!-- HARI -->
                        <div class="form-group">
                            <label>Hari</label>
                            <input type="text"
                                name="hari"
                                placeholder="Contoh: Jumat"
                                required>
                        </div>

                        <!-- JAM -->
                        <div class="form-group">
                            <label>Jam</label>
                            <input type="text"
                                name="jam"
                                placeholder="Contoh: 15.00 - 17.00"
                                required>
                        </div>

                        <!-- TEMPAT -->
                        <div class="form-group full">
                            <label>Tempat</label>
                            <input type="text"
                                name="tempat"
                                placeholder="Contoh: Lapangan Utama"
                                required>
                        </div>

                        <!-- ACTION BUTTON -->
                        <div class="form-actions">

                            <button type="submit"
                                name="simpan"
                                class="btn btn-primary">
                                Simpan
                            </button>

                            <a href="ekstrakurikuler.php"
                                class="btn btn-outline">
                                Batal
                            </a>

                        </div>

                </div>

                </form>

            </div>

    </div>

    </main>

    </div>

    <?php include '../layout/footer.php'; ?>

    <script>
        document.getElementById("pelatihSelect").addEventListener("change", function() {

            const selected = this.options[this.selectedIndex];
            const ekskul = selected.getAttribute("data-ekskul");

            document.getElementById("nama_ekskul").value = ekskul ?? '';

        });
    </script>

</body>

</html>