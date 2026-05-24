<header class="page-header">
    <div class="page-title">
        <h1><?= $pageTitle ?? 'Dashboard Pelatih'; ?></h1>

        <?php if (!empty($pageSubtitle)) { ?>
            <p><?= $pageSubtitle; ?></p>
        <?php } elseif (!empty($showWelcome)) { ?>
            <p>Selamat datang, <strong><?= $_SESSION['nama']; ?></strong></p>
        <?php } ?>
    </div>

    <?php if (!empty($headerButton)) { ?>
        <div class="page-action">
            <?= $headerButton; ?>
        </div>
    <?php } ?>
</header>