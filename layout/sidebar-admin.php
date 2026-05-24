<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$currentPage = basename($_SERVER['PHP_SELF']);
?>

<aside class="sidebar">

    <!-- HEADER -->
    <div class="sidebar-header">
        <h2>SIKASA</h2>
        <p>SMPK SANTA MARIA 2</p>
    </div>

    <!-- MENU -->
    <ul class="sidebar-menu">

        <?php if ($_SESSION['role'] == 'admin') { ?>

            <li class="<?= in_array($currentPage, ['index.php', 'riwayat.php']) ? 'active' : '' ?>">
                <a href="../admin/index.php">Dashboard</a>
            </li>

            <li class="<?= in_array($currentPage, ['ekstrakurikuler.php', 'tambah-ekskul.php', 'edit-ekskul.php']) ? 'active' : '' ?>">
                <a href="../admin/ekstrakurikuler.php">Ekstrakurikuler</a>
            </li>

            <li class="<?= in_array($currentPage, ['data-siswa.php', 'tambah-siswa.php', 'edit-siswa.php']) ? 'active' : '' ?>">
                <a href="../admin/data-siswa.php">Data Siswa</a>
            </li>

            <li class="<?= in_array($currentPage, ['pelatih.php', 'tambah-pelatih.php', 'edit-pelatih.php']) ? 'active' : '' ?>">
                <a href="../admin/pelatih.php">Pelatih</a>
            </li>

            <li class="<?= $currentPage == 'monitoring-ekskul.php' ? 'active' : '' ?>">
                <a href="../admin/monitoring-ekskul.php">Monitoring Ekskul</a>
            </li>

        <?php } ?>

    </ul>

    <!-- FOOTER SIDEBAR -->
    <div class="sidebar-footer">

        <div class="user-info">
            <div class="user-avatar">A</div>
            <div class="user-text">
                <span class="user-role">Admin Sekolah</span>
            </div>
        </div>

        <a href="../logout.php" class="logout-btn">
            Keluar / Logout
        </a>

    </div>

</aside>