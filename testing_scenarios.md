# SIKASA — Tabel Pengujian Dashboard (UAT)

Dokumen ini berisi skenario pengujian untuk setiap peran pengguna di sistem SIKASA. Gunakan tabel ini untuk melakukan pengujian manual dan tandai hasilnya sebagai **Berhasil** atau **Gagal**.

---

## 1. Dashboard Admin
Admin memiliki hak akses penuh untuk manajemen data master dan sistem.

| No | Pertanyaan Pengujian (Skenario) | Hasil (Berhasil/Gagal) | Keterangan |
|:--:|:---|:---:|:---|
| 1 | Apakah Admin dapat login dan masuk ke Dashboard dengan benar? | | |
| 2 | Apakah statistik di dashboard (Total Siswa, Ekskul, Pelatih) akurat? | | |
| 3 | Apakah Admin dapat menambah, mengedit, dan menghapus data Ekskul? | | |
| 4 | Apakah Admin dapat menyetujui atau menolak pendaftaran ekskul siswa? | | |
| 5 | Apakah fitur "Sliding Window" pada filter tahun akademik berfungsi? | | |
| 6 | Apakah Admin dapat menginput Honor Pelatih disertai unggahan bukti transfer? | | |
| 7 | Apakah Admin dapat melihat rekapitulasi absensi global di menu Monitoring? | | |
| 8 | Apakah fitur pencarian data siswa/pelatih berfungsi dengan cepat? | | |

---

## 2. Dashboard Pelatih (Coach)
Pelatih fokus pada manajemen kegiatan ekskul dan penilaian.

| No | Pertanyaan Pengujian (Skenario) | Hasil (Berhasil/Gagal) | Keterangan |
|:--:|:---|:---:|:---|
| 1 | Apakah Pelatih dapat melihat daftar siswa yang mengambil ekskulnya? | | |
| 2 | Apakah Pelatih dapat melakukan input absensi untuk pertemuan hari ini? | | |
| 3 | Apakah Pelatih dapat menginput dan mengubah nilai siswa? | | |
| 4 | Apakah Pelatih dapat melihat riwayat honor yang telah dibayar Admin? | | |
| 5 | Apakah jadwal sesi (Session Row) tampil dengan jelas dan benar? | | |
| 6 | Apakah Pelatih dapat mengunduh bukti transfer honor yang diunggah Admin? | | |

---

## 3. Dashboard Pendamping (Guru)
Pendamping bertugas memantau perkembangan siswa di ekskul terkait.

| No | Pertanyaan Pengujian (Skenario) | Hasil (Berhasil/Gagal) | Keterangan |
|:--:|:---|:---:|:---|
| 1 | Apakah Pendamping dapat memantau absensi siswa secara real-time? | | |
| 2 | Apakah Pendamping dapat membantu melakukan input nilai jika diperlukan? | | |
| 3 | Apakah Pendamping dapat melihat daftar hadir per pertemuan? | | |
| 4 | Apakah informasi detail siswa tampil dengan benar saat diklik? | | |

---

## 4. Dashboard Kepala Sekolah (Principal)
Kepala Sekolah memiliki akses read-only untuk monitoring kinerja sekolah.

| No | Pertanyaan Pengujian (Skenario) | Hasil (Berhasil/Gagal) | Keterangan |
|:--:|:---|:---:|:---|
| 1 | Apakah Kepala Sekolah dapat melihat ringkasan statistik seluruh kegiatan? | | |
| 2 | Apakah laporan absensi global dapat diakses tanpa tombol edit/hapus? | | |
| 3 | Apakah laporan honor pelatih dapat dipantau untuk setiap periode? | | |
| 4 | Apakah data prestasi atau lomba siswa tampil dengan benar? | | |
| 5 | Apakah tampilan dashboard bersih dari tombol aksi (Sesuai mode Read-Only)? | | |

---

## 5. Dashboard Siswa (Student)
Siswa fokus pada kegiatan pendaftaran dan pemantauan kehadiran.

| No | Pertanyaan Pengujian (Skenario) | Hasil (Berhasil/Gagal) | Keterangan |
|:--:|:---|:---:|:---|
| 1 | Apakah Siswa dapat melihat daftar ekskul yang tersedia untuk didaftar? | | |
| 2 | Apakah Siswa dapat mengajukan izin absen melalui sistem? | | |
| 3 | Apakah Siswa dapat melihat riwayat kehadiran mereka secara detail? | | |
| 4 | Apakah jadwal agenda ekskul di dashboard sudah sesuai dengan hari ini? | | |
| 5 | Apakah Siswa dapat melihat informasi pengumuman lomba? | | |

---

## 6. Dashboard Orang Tua (Parent)
Orang Tua fokus pada pemantauan anak dan pengelolaan profil.

| No | Pertanyaan Pengujian (Skenario) | Hasil (Berhasil/Gagal) | Keterangan |
|:--:|:---|:---:|:---|
| 1 | Apakah Orang Tua dapat melihat data anak (nama, kelas, ekskul)? | | |
| 2 | Apakah Orang Tua dapat memantau grafik/list absensi kehadiran anak? | | |
| 3 | Apakah Orang Tua dapat melihat hasil nilai ekskul anak? | | |
| 4 | Apakah Orang Tua dapat melihat data lomba yang diikuti anak? | | |
| 5 | Apakah fitur "Profil Saya" dapat memperbarui data kontak Orang Tua? | | |
| 6 | Apakah Orang Tua dapat mengajukan pengunduran diri ekskul untuk anak? | | |
