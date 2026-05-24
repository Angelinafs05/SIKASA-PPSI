<?php
ini_set('session.cookie_lifetime', 0);
ini_set('session.gc_maxlifetime', 7200);
session_start();

include '../koneksi.php';

/* ================= 1. CEK LOGIN ================= */
if (!isset($_SESSION['login']) || $_SESSION['role'] != 'pelatih') {
    header("Location: ../login.html");
    exit;
}

$id_pelatih = (int) $_SESSION['ref_id'];

/* ================= 2. AMBIL EKSKUL PELATIH ================= */
$qEkskul = mysqli_query($conn, "
    SELECT e.id, e.nama_ekskul
    FROM ekstrakurikuler e
    JOIN pelatih pl ON e.id = pl.ekskul_id
    WHERE pl.id = '$id_pelatih'
");

$dataEkskul = mysqli_fetch_assoc($qEkskul);

if (!$dataEkskul) {
    die("Pelatih belum memiliki ekskul atau data tidak ditemukan.");
}

$id_ekskul   = $dataEkskul['id'];
$nama_ekskul = $dataEkskul['nama_ekskul'];

/* ================= 3. SET TANGGAL ================= */
$hariIni  = isset($_POST['tanggal']) ? $_POST['tanggal'] : date('d');
$bulanIni = isset($_POST['bulan']) ? $_POST['bulan'] : date('m');
$tahunIni = isset($_POST['tahun']) ? $_POST['tahun'] : date('Y');

$tanggal_pilihan = "$tahunIni-$bulanIni-$hariIni";

/* ================= 4. SIMPAN ABSENSI ================= */
if (isset($_POST['simpan'])) {
    if (!empty($_POST['status'])) {
        foreach ($_POST['status'] as $id_siswa => $status) {
            $id_siswa = (int)$id_siswa;
            // Cek apakah sudah ada absen di tanggal tersebut
            $cek = mysqli_query($conn, "SELECT id FROM absensi WHERE id_siswa = '$id_siswa' AND tanggal = '$tanggal_pilihan'");

            if (mysqli_num_rows($cek) == 0) {
                mysqli_query($conn, "INSERT INTO absensi (id_siswa, id_pelatih, tanggal, status) VALUES ('$id_siswa', '$id_pelatih', '$tanggal_pilihan', '$status')");
            } else {
                mysqli_query($conn, "UPDATE absensi SET status = '$status' WHERE id_siswa = '$id_siswa' AND tanggal = '$tanggal_pilihan'");
            }
        }
        $success = "Absensi untuk tanggal " . date('d-m-Y', strtotime($tanggal_pilihan)) . " berhasil disimpan!";
    }
}

/* ================= 5. DATA SISWA EKSKUL ================= */
$qSiswa = mysqli_query($conn, "
    SELECT s.id, s.nama_siswa, k.nama_kelas, pe.tanggal_daftar
    FROM pendaftaran_ekskul pe
    JOIN siswa s ON pe.siswa_id = s.id
    LEFT JOIN kelas k ON s.kelas_id = k.id
    WHERE pe.status = 'approved' AND pe.ekskul_id = '$id_ekskul'
    ORDER BY s.nama_siswa ASC
");

/* ================= 6. AMBIL PESAN IZIN (Untuk Modal) ================= */
$qPesan = mysqli_query($conn, "
    SELECT s.nama_siswa, i.pesan 
    FROM izin_ekskul i
    JOIN siswa s ON i.siswa_id = s.id
    WHERE i.tanggal = '$tanggal_pilihan' 
    AND i.ekskul_id = '$id_ekskul'
");

// Cegah Fatal Error jika query gagal
$jumlahPesan = ($qPesan) ? mysqli_num_rows($qPesan) : 0;
?>

<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Absensi | SIKASA</title>
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
                        <h2>Presensi Siswa</h2>
                        <p>Ekskul: <strong><?= htmlspecialchars($nama_ekskul) ?></strong></p>
                    </div>
                    <div class="page-action">
                        <button type="button" class="btn btn-secondary" onclick="bukaPesan()">
                            <i data-lucide="mail"></i> Pesan Izin (<?= $jumlahPesan ?>)
                        </button>
                    </div>
                </div>

                <form method="POST">
                    <div class="filter-group" style="display: flex; gap: 15px; margin-bottom: 25px; align-items: center; background: #fff; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">

                        <div class="form-group" style="flex: 1;">
                            <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #64748b; font-size: 0.9rem;">Tanggal</label>
                            <select name="tanggal" class="form-control" style="width: 100%;">
                                <?php for ($i = 1; $i <= 31; $i++) :
                                    $v = str_pad($i, 2, "0", STR_PAD_LEFT); ?>
                                    <option value="<?= $v ?>" <?= ($v == $hariIni) ? 'selected' : '' ?>><?= $i ?></option>
                                <?php endfor; ?>
                            </select>
                        </div>

                        <div class="form-group" style="flex: 2;">
                            <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #64748b; font-size: 0.9rem;">Bulan</label>
                            <select name="bulan" class="form-control" style="width: 100%;">
                                <?php
                                $namaBulan = [
                                    "01" => "Januari",
                                    "02" => "Februari",
                                    "03" => "Maret",
                                    "04" => "April",
                                    "05" => "Mei",
                                    "06" => "Juni",
                                    "07" => "Juli",
                                    "08" => "Agustus",
                                    "09" => "September",
                                    "10" => "Oktober",
                                    "11" => "November",
                                    "12" => "Desember"
                                ];
                                foreach ($namaBulan as $key => $val) : ?>
                                    <option value="<?= $key ?>" <?= ($key == $bulanIni) ? 'selected' : '' ?>><?= $val ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group" style="flex: 1;">
                            <label style="font-weight: 600; display: block; margin-bottom: 8px; color: #64748b; font-size: 0.9rem;">Tahun</label>
                            <select name="tahun" class="form-control" style="width: 100%;">
                                <?php
                                $thn_sekarang = date('Y');
                                for ($t = $thn_sekarang - 1; $t <= $thn_sekarang + 1; $t++) : ?>
                                    <option value="<?= $t ?>" <?= ($t == $tahunIni) ? 'selected' : '' ?>><?= $t ?></option>
                                <?php endfor; ?>
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
                                    <th width="300">Nama Siswa</th>
                                    <th>Status Kehadiran</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (mysqli_num_rows($qSiswa) > 0) : ?>
                                    <?php while ($row = mysqli_fetch_assoc($qSiswa)) : ?>
                                        <tr>
                                            <td><span class="badge-kelas"><?= htmlspecialchars($row['nama_kelas']) ?></span></td>
                                            <td>
                                                <div style="font-weight: 600; color: #1e293b;"><?= htmlspecialchars($row['nama_siswa']) ?></div>
                                                <div style="font-size: 0.75rem; color: #94a3b8;">Siswa Terdaftar</div>
                                            </td>
                                            <td>
                                                <select name="status[<?= $row['id']; ?>]" class="input-deskripsi-box" style="width: auto; min-width: 150px;">
                                                    <option value="Hadir">Hadir</option>
                                                    <option value="Izin">Izin</option>
                                                    <option value="Sakit">Sakit</option>
                                                    <option value="Alfa">Alfa</option>
                                                </select>
                                            </td>
                                        </tr>
                                    <?php endwhile; ?>
                                <?php else : ?>
                                    <tr>
                                        <td colspan="3" style="text-align: center; padding: 40px; color: #94a3b8;">
                                            <i data-lucide="users" style="width: 48px; height: 48px; margin-bottom: 10px; opacity: 0.3;"></i>
                                            <p>Belum ada siswa yang terdaftar di ekskul ini.</p>
                                        </td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
                        <p style="font-size: 0.85rem; color: #64748b;">* Pastikan absensi sesuai dengan kehadiran siswa di lapangan.</p>
                        <button type="submit" name="simpan" class="btn btn-primary" style="padding: 12px 40px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                            Simpan Kehadiran
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </div>

    <div id="popupPesan" class="modal" style="display:none; position: fixed; z-index: 999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);">
        <div class="modal-content" style="background: #fff; margin: 10% auto; padding: 20px; width: 40%; border-radius: 8px;">
            <div class="modal-header" style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <h3 style="margin:0;">Pesan Izin Siswa (<?= date('d/m/Y', strtotime($tanggal_pilihan)) ?>)</h3>
                <span class="close" style="cursor:pointer; font-size: 24px;" onclick="tutupPesan()">&times;</span>
            </div>
            <div class="modal-body" style="padding-top: 15px; max-height: 300px; overflow-y: auto;">
                <?php if (mysqli_num_rows($qPesan) > 0) : ?>
                    <?php while ($p = mysqli_fetch_assoc($qPesan)) : ?>
                        <div style="margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 5px;">
                            <strong><?= $p['nama_siswa'] ?>:</strong><br>
                            <span style="color: #64748b;"><?= $p['pesan'] ?></span>
                        </div>
                    <?php endwhile; ?>
                <?php else : ?>
                    <p style="color: #64748b;">Tidak ada pesan izin untuk tanggal ini.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <?php include '../layout/footer.php'; ?>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();

        function bukaPesan() {
            document.getElementById("popupPesan").style.display = "block";
        }

        function tutupPesan() {
            document.getElementById("popupPesan").style.display = "none";
        }
        window.onclick = function(e) {
            if (e.target == document.getElementById("popupPesan")) tutupPesan();
        }
    </script>
</body>

</html>