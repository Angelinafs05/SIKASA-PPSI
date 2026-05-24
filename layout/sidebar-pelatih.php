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

        <?php if ($_SESSION['role'] == 'pelatih') { ?>

            <li class="<?= in_array($currentPage, ['index.php']) ? 'active' : '' ?>">
                <a href="../pelatih/index.php">Dashboard</a>
            </li>

            <li class="<?= in_array($currentPage, ['siswa-ekskul.php']) ? 'active' : '' ?>">
                <a href="../pelatih/siswa-ekskul.php">Siswa Ekskul</a>
            </li>

            <li class="<?= in_array($currentPage, ['absensi.php']) ? 'active' : '' ?>">
                <a href="../pelatih/absensi.php">Absensi</a>
            </li>

            <li class="<?= in_array($currentPage, ['nilai.php']) ? 'active' : '' ?>">
                <a href="../pelatih/nilai.php">Nilai</a>
            </li>

        <?php } ?>

    </ul>

    <ul>

        <!-- FOOTER SIDEBAR -->
        <div class="sidebar-footer">

            <div class="user-info">
                <div class="user-avatar">P</div>
                <div class="user-text">
                    <span class="user-role">Pelatih</span>
                </div>
            </div>

            <a href="../logout.php" class="logout-btn">
                Keluar / Logout
            </a>

        </div>

    </ul>
</aside>