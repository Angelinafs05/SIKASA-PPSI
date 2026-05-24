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

$pageTitle = "Kelola Ekstrakurikuler";
$headerButton = '<a href="tambah-ekskul.php" class="btn btn-primary">+ Tambah Ekskul</a>';

$data = mysqli_query($conn, "
    SELECT e.*, p.nama_pelatih AS pelatih
    FROM ekstrakurikuler e
    LEFT JOIN pelatih p ON p.ekskul_id = e.id
");

?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title><?= $pageTitle; ?></title>

    <!-- Font Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-admin.php'; ?>

        <main class="content">

            <?php include '../layout/header-admin.php'; ?>

            <!-- ================= DATA EKSKUL TABEL ================= -->
            <div class="data-card">

                <h2>Data Ekstrakurikuler</h2>
                <p>Daftar seluruh kegiatan ekstrakurikuler sekolah</p>

                <?php if ($data && mysqli_num_rows($data) > 0) { ?>

                    <div class="table-container">

                        <table class="modern-table">

                            <thead>
                                <tr>
                                    <th>Nama Ekskul</th>
                                    <th>Pelatih</th>
                                    <th>Hari</th>
                                    <th>Jam</th>
                                    <th>Tempat</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>

                            <tbody>

                                <?php while ($row = mysqli_fetch_assoc($data)) { ?>

                                    <tr>

                                        <td>
                                            <strong><?= htmlspecialchars($row['nama_ekskul']); ?></strong>
                                        </td>

                                        <td>
                                            <?= htmlspecialchars($row['pelatih'] ?? 'Belum ditentukan'); ?>
                                        </td>

                                        <td><?= htmlspecialchars($row['hari']); ?></td>

                                        <td><?= htmlspecialchars($row['jam']); ?></td>

                                        <td><?= htmlspecialchars($row['tempat']); ?></td>

                                        <td class="aksi-cell">

                                            <a href="edit-ekskul.php?id=<?= $row['id']; ?>"
                                                class="aksi-btn edit-btn"
                                                title="Edit">
                                                <i data-lucide="pencil"></i>
                                            </a>

                                            <a href="hapus-ekskul.php?id=<?= $row['id']; ?>"
                                                class="aksi-btn delete-btn"
                                                title="Hapus"
                                                onclick="return confirm('Yakin ingin menghapus data ini?')">
                                                <i data-lucide="trash-2"></i>
                                            </a>

                                        </td>

                                    </tr>

                                <?php } ?>

                            </tbody>

                        </table>

                    </div>

                <?php } else { ?>

                    <div class="info">
                        Belum ada data ekstrakurikuler.
                    </div>

                <?php } ?>

            </div>

        </main>
    </div>

    <?php include '../layout/footer.php'; ?>

    <!-- Script Lucide (CDN) -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- Inisialisasi ikon -->
    <script>
        lucide.createIcons();
    </script>

</body>

</html>