<header class="page-header">
    <div class="page-title">
        <h1><?= $pageTitle ?? 'Dashboard Admin'; ?></h1>

        <?php if (!empty($pageSubtitle)) { ?>
            <p><?= $pageSubtitle; ?></p>
        <?php } ?>
    </div>

    <?php if (!empty($headerButton)) { ?>
        <div class="page-action">
            <?= $headerButton; ?>
        </div>
    <?php } ?>
</header>