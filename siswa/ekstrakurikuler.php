<?php
ini_set('session.cookie_lifetime', 0);
ini_set('session.gc_maxlifetime', 7200);
session_start();

include '../koneksi.php';

/* CEK LOGIN + ROLE */
if (!isset($_SESSION['login']) || $_SESSION['role'] != 'siswa') {
    header("Location: ../login.html");
    exit;
}

/* ================== AMBIL ID SISWA ================== */
$id_siswa = $_SESSION['ref_id'];

$pageTitle = "Daftar Ekstrakurikuler";

/* ================== DATA EKSKUL ================== */
$data = mysqli_query($conn, "SELECT * FROM ekstrakurikuler");
?>

<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title><?= $pageTitle; ?></title>
    <link rel="stylesheet" href="../css/style.css">
</head>

<body>

    <div class="container">

        <?php include '../layout/sidebar-siswa.php'; ?>

        <main class="content">

            <?php include '../layout/header-siswa.php'; ?>

            <section class="cards">

                <?php while ($row = mysqli_fetch_assoc($data)) { ?>
                    <div class="card">
                        <h3><?= $row['nama_ekskul'] ?></h3>
                        <p><strong>Pelatih:</strong> <?= $row['pelatih'] ?></p>
                        <p><strong>Jadwal:</strong> <?= $row['hari'] ?> (<?= $row['jam'] ?>)</p>
                        <p><strong>Tempat:</strong> <?= $row['tempat'] ?></p>

                        <form method="POST" action="daftar-ekskul.php">
                            <input type="hidden" name="ekskul_id" value="<?= $row['id'] ?>">
                            <button type="submit" class="btn btn-primary btn-daftar">
                                Daftar
                            </button>
                        </form>
                    </div>
                <?php } ?>

            </section>

        </main>
    </div>
    <?php include '../layout/footer.php'; ?>

</body>

</html>