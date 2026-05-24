<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['role']) || $_SESSION['role'] != 'siswa') {
    header("Location: ../login.html");
    exit;
}

$currentPage = basename($_SERVER['PHP_SELF']);
?>

<aside class="sidebar">
    <h2>SIKASA</h2>

    <ul>

        <!-- DASHBOARD -->
        <li class="<?= $currentPage == 'index.php' ? 'active' : '' ?>">
            <a href="../siswa/index.php">Dashboard</a>
        </li>

        <!-- EKSTRAKURIKULER -->
        <li class="<?= $currentPage == 'ekstrakurikuler.php' ? 'active' : '' ?>">
            <a href="../siswa/ekstrakurikuler.php">Ekstrakurikuler</a>
        </li>

        <!-- PELATIH -->
        <li class="<?= $currentPage == 'pelatih.php' ? 'active' : '' ?>">
            <a href="../siswa/pelatih.php">Pelatih</a>
        </li>

        <!-- PROFIL -->
        <li class="<?= $currentPage == 'profil.php' ? 'active' : '' ?>">
            <a href="../siswa/profil.php">Profil Saya</a>
        </li>

        <!-- LOGOUT -->
        <li>
            <a href="../logout.php">Logout</a>
        </li>

    </ul>
</aside>