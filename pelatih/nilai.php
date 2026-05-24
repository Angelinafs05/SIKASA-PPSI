<?php
ini_set('session.cookie_lifetime', 0);
ini_set('session.gc_maxlifetime', 7200);
session_start();

include '../koneksi.php';

/* CEK LOGIN + ROLE */
if (!isset($_SESSION['login']) || $_SESSION['role'] != 'pelatih') {
    header("Location: ../login.html");
    exit;
}

$id_pelatih = $_SESSION['ref_id'];

/* ================= DATA PELATIH ================= */
$qPelatih = mysqli_query($conn, "
    SELECT p.*, e.nama_ekskul
    FROM pelatih p
    LEFT JOIN ekstrakurikuler e ON p.ekskul_id = e.id
    WHERE p.id = '$id_pelatih'
");

$pelatih = mysqli_fetch_assoc($qPelatih);
$ekskul_id = $pelatih['ekskul_id'] ?? 0;

// PERBAIKAN: Definisikan variabel ini agar tidak undefined di baris 105
$nama_ekskul = $pelatih['nama_ekskul'] ?? '-';

/* ================= LOGIKA FILTER (PENTING) ================= */
// Ambil nilai dari POST jika ada, jika tidak gunakan default
$semesterIni = $_POST['semester'] ?? 'Ganjil';
$tahunIni    = $_POST['tahun'] ?? date('Y');

/* ================= DATA SISWA ================= */
$qSiswa = mysqli_query($conn, "
    SELECT s.id, s.nama_siswa, k.nama_kelas
    FROM pendaftaran_ekskul pe
    JOIN siswa s ON pe.siswa_id = s.id
    LEFT JOIN kelas k ON s.kelas_id = k.id
    WHERE pe.status = 'approved'
    AND pe.ekskul_id = '$ekskul_id'
    ORDER BY k.nama_kelas ASC, s.nama_siswa ASC
");


/* ================= SIMPAN NILAI ================= */
if (isset($_POST['simpan'])) {
    $semester = mysqli_real_escape_string($conn, $_POST['semester']);
    $tahun    = mysqli_real_escape_string($conn, $_POST['tahun']);

    foreach ($_POST['nilai'] as $id_siswa => $nilai) {
        $id_siswa = (int)$id_siswa;
        $nilai    = (int)$nilai;
        $ket      = mysqli_real_escape_string($conn, $_POST['keterangan'][$id_siswa] ?? '');

        $cek = mysqli_query($conn, "
            SELECT id FROM nilai_ekskul
            WHERE siswa_id = '$id_siswa'
            AND semester = '$semester'
            AND tahun = '$tahun'
        ");

        if (mysqli_num_rows($cek) == 0) {
            mysqli_query($conn, "
                INSERT INTO nilai_ekskul
                (siswa_id, pelatih_id, nilai, keterangan, semester, tahun)
                VALUES
                ('$id_siswa','$id_pelatih','$nilai','$ket','$semester','$tahun')
            ");
        } else {
            mysqli_query($conn, "
                UPDATE nilai_ekskul
                SET nilai='$nilai', keterangan='$ket'
                WHERE siswa_id='$id_siswa'
                AND semester='$semester'
                AND tahun='$tahun'
            ");
        }
    }
    $success = "Nilai berhasil disimpan!";
}
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Nilai Siswa | SIKASA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css">

</head>

<body>

    <div class="container">
        <?php include '../layout/sidebar-pelatih.php'; ?>

        <main class="content">
            <?php include '../layout/header-pelatih.php'; ?>

            <div class="data-card">
                <div class="page-header">
                    <div class="page-title">
                        <h2>Input Nilai Ekstrakurikuler</h2>
                        <p>Ekskul: <span class="badge-ekskul" style="background:#f1f5f9; padding:5px 10px; border-radius:5px;"><strong><?= htmlspecialchars($nama_ekskul) ?></strong></span></p>
                    </div>
                </div>

                <form method="POST">
                    <div class="filter-group" style="display: flex; gap: 15px; margin-bottom: 25px; align-items: center; background: #fff; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">

                        <div class="form-group" style="flex: 1;">
                            <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #64748b; font-size: 0.9rem;">Semester</label>
                            <select name="semester" class="form-control" style="width: 100%;">
                                <option value="Ganjil" <?= ($semesterIni == 'Ganjil') ? 'selected' : '' ?>>Ganjil</option>
                                <option value="Genap" <?= ($semesterIni == 'Genap') ? 'selected' : '' ?>>Genap</option>
                            </select>
                        </div>

                        <div class="form-group" style="flex: 1;">
                            <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #64748b; font-size: 0.9rem;">Tahun Ajaran</label>
                            <select name="tahun" class="form-control" style="width: 100%;">
                                <?php
                                $currY = date('Y');
                                for ($t = $currY - 1; $t <= $currY + 1; $t++) {
                                    $selected = ($t == $tahunIni) ? 'selected' : '';
                                    echo "<option value='$t' $selected>$t</option>";
                                }
                                ?>
                            </select>
                        </div>

                        <div style="margin-top: 25px;">
                            <button type="submit" class="btn btn-info" style="display: flex; align-items: center; gap: 5px;">
                                <i data-lucide="refresh-cw" style="width: 16px;"></i> Tampilkan
                            </button>
                        </div>
                    </div>

                    <?php if (isset($success)) : ?>
                        <div style="background: #f0fdf4; color: #166534; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 5px solid #22c55e; display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="check-circle" style="width: 20px;"></i> <?= $success ?>
                        </div>
                    <?php endif; ?>

                    <div class="table-container">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th width="100">Kelas</th>
                                    <th width="250">Nama Siswa</th>
                                    <th width="120">Nilai (0-100)</th>
                                    <th>Keterangan / Deskripsi Capaian</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (mysqli_num_rows($qSiswa) > 0) : ?>
                                    <?php while ($s = mysqli_fetch_assoc($qSiswa)) : ?>
                                        <tr>
                                            <td><span class="badge-kelas"><?= htmlspecialchars($s['nama_kelas']) ?></span></td>
                                            <td>
                                                <div style="font-weight: 600; color: #1e293b;"><?= htmlspecialchars($s['nama_siswa']) ?></div>
                                                <div style="font-size: 0.75rem; color: #94a3b8;">Siswa Terdaftar</div>
                                            </td>
                                            <td>
                                                <input type="number"
                                                    name="nilai[<?= $s['id'] ?>]"
                                                    class="input-nilai-box"
                                                    min="0" max="100"
                                                    placeholder="0"
                                                    required>
                                            </td>
                                            <td>
                                                <input type="text"
                                                    name="keterangan[<?= $s['id'] ?>]"
                                                    class="input-deskripsi-box"
                                                    placeholder="Contoh: Sangat baik dalam teknik dasar dan kerjasama tim">
                                            </td>
                                        </tr>
                                    <?php endwhile; ?>
                                <?php else : ?>
                                    <tr>
                                        <td colspan="4" style="text-align: center; padding: 40px; color: #94a3b8;">
                                            <i data-lucide="users" style="width: 48px; height: 48px; margin-bottom: 10px; opacity: 0.3;"></i>
                                            <p>Belum ada siswa yang terdaftar di ekskul ini.</p>
                                        </td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
                        <p style="font-size: 0.85rem; color: #64748b;">* Pastikan nilai dan deskripsi sudah benar sebelum menyimpan.</p>
                        <button type="submit" name="simpan" class="btn btn-primary" style="padding: 12px 40px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                            Simpan Perubahan Nilai
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </div>

    <?php include '../layout/footer.php'; ?>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();
    </script>
</body>

</html>