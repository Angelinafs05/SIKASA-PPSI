import jsPDF from 'jspdf';
import logoSekolah from '../assets/logo_sekolah.png';

/**
 * Generate PDF Dokumen Angket Pilihan Ekstrakurikuler & Surat Izin Orang Tua
 * Menghasilkan file Blob PDF yang siap di-upload ke backend / diunduh siswa
 */
export const generateAngketPendaftaranPDF = async ({
    namaSiswa,
    kelasNama,
    noInduk,
    namaEkskulPilihan1,
    namaEkskulPilihan2 = '-',
    tahunPelajaran = '2025 - 2026',
    namaOrangTua,
    hubungan = 'Orang Tua / Wali',
    tandaTanganDataUrl = null,
    kota = 'Malang',
    tanggalSurat = null
}) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const leftMargin = 20;
    const rightMargin = pageWidth - 20; // 190mm
    const contentWidth = rightMargin - leftMargin;

    // --- 1. KOP SURAT ---
    try {
        doc.addImage(logoSekolah, 'PNG', leftMargin, 12, 22, 22);
    } catch (e) {
        console.warn('Gagal memuat logo sekolah pada PDF angket', e);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Perkumpulan Dharmaputri', 105, 14, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SMP KATOLIK SANTA MARIA II', 105, 20, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SEKOLAH STANDAR NASIONAL', 105, 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('STATUS TERAKREDITASI "A" | NSS: 203056101019 | NPSN: 20533743', 105, 29, { align: 'center' });
    doc.text('Jl. Panderman 7A Malang Telp. (0341) 561871 | Website: smpksantamaria2malang.sch.id', 105, 33, { align: 'center' });

    // Garis Dobel Kop Surat
    doc.setLineWidth(0.8);
    doc.line(leftMargin, 36, rightMargin, 36);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, 37, rightMargin, 37);

    // --- 2. SURAT PEMBERITAHUAN (BAGIAN ATAS) ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    let y = 43;
    doc.text('No.', leftMargin, y);
    doc.text(': 103/SM.2/D.6/VII/2025', leftMargin + 18, y);

    y += 5;
    doc.text('Lamp.', leftMargin, y);
    doc.text(': 1 lembar', leftMargin + 18, y);

    y += 5;
    doc.text('Hal', leftMargin, y);
    doc.setFont('helvetica', 'bold');
    doc.text(': Pemberitahuan Ekstrakurikuler', leftMargin + 18, y);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Yth.', leftMargin, y);
    y += 4.5;
    doc.text('Bapak/Ibu Orang Tua Siswa Kelas VII, VIII, dan IX', leftMargin, y);
    y += 4.5;
    doc.text('SMP Katolik Santa Maria II', leftMargin, y);
    y += 4.5;
    doc.text('Di tempat', leftMargin, y);

    y += 7;
    doc.text('Dengan hormat,', leftMargin, y);
    y += 5;

    const introText = `Sehubungan akan dilaksanakannya kegiatan ekstrakurikuler Tahun Pelajaran ${tahunPelajaran}, kami menginformasikan beberapa hal sebagai berikut :`;
    const splitIntro = doc.splitTextToSize(introText, contentWidth);
    doc.text(splitIntro, leftMargin, y);
    y += splitIntro.length * 4.5 + 2;

    const points = [
        '1. Kegiatan ekstrakurikuler akan dimulai sesuai kalender akademik sekolah.',
        '2. Setiap siswa WAJIB mengikuti kegiatan ekstrakurikuler, maksimum 2 (dua) jenis ekstrakurikuler (Siswa Kelas VIII WAJIB mengikuti ekstrakurikuler Pramuka).',
        `3. Setiap siswa WAJIB mengikuti kegiatan ekstrakurikuler selama 1 (satu) Tahun Pelajaran ${tahunPelajaran} untuk Kelas VII dan VIII, sedangkan Kelas IX berlangsung pada semester ganjil.`
    ];

    points.forEach(pt => {
        const splitPt = doc.splitTextToSize(pt, contentWidth - 4);
        doc.text(splitPt, leftMargin + 2, y);
        y += splitPt.length * 4.2 + 1.5;
    });

    const outtroText = 'Untuk itu mohon bantuan Bapak/Ibu orang tua/wali siswa mendampingi putra/putri dalam memilih 1 atau 2 kegiatan ekstrakurikuler yang diminati serta mohon pendampingan selama pelaksanaan. Demikian pemberitahuan kami, atas perhatian, dukungan, dan kerja sama dari Bapak/Ibu, kami mengucapkan terima kasih.';
    const splitOuttro = doc.splitTextToSize(outtroText, contentWidth);
    doc.text(splitOuttro, leftMargin, y);
    y += splitOuttro.length * 4.2 + 4;

    // Tanda Tangan Kepala Sekolah (Sebelah Kanan Atas)
    const tglDisplay = tanggalSurat || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const rightColX = 130;
    doc.text(`Malang, ${tglDisplay}`, rightColX, y);
    y += 4.5;
    doc.text('Kepala Sekolah,', rightColX, y);
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.text('Sr. M. Elfrida, SPM., S.Psi., M.M.', rightColX, y);
    doc.setFont('helvetica', 'normal');

    // --- 3. GARIS POTONG DISINI ---
    y += 10;
    doc.setLineDashPattern([2, 2], 0);
    doc.setDrawColor(120);
    doc.line(leftMargin, y, rightMargin, y);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('........................................................................... Potong disini ...........................................................................', 105, y - 1, { align: 'center' });
    doc.setLineDashPattern([], 0); // reset solid line
    doc.setTextColor(0);
    doc.setDrawColor(0);

    // --- 4. FORM ANGKET PILIHAN EKSTRAKURIKULER ---
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ANGKET PILIHAN EKSTRAKURIKULER', 105, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    doc.text(`TAHUN PELAJARAN ${tahunPelajaran}`, 105, y, { align: 'center' });

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    // Identitas Siswa
    doc.text('Nama Lengkap', leftMargin, y);
    doc.text(':', leftMargin + 32, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${namaSiswa} ${noInduk ? `(No. Induk: ${noInduk})` : ''}`, leftMargin + 36, y);
    doc.setFont('helvetica', 'normal');

    y += 6;
    doc.text('Kelas', leftMargin, y);
    doc.text(':', leftMargin + 32, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${kelasNama || '-'}`, leftMargin + 36, y);
    doc.setFont('helvetica', 'normal');

    y += 6;
    doc.text('Jenis Ekstra pilihan', leftMargin, y);
    doc.text(':', leftMargin + 32, y);
    y += 5.5;
    doc.text(`1. ${namaEkskulPilihan1}`, leftMargin + 36, y);
    y += 5.5;
    doc.text(`2. ${namaEkskulPilihan2 || '-'}`, leftMargin + 36, y);

    y += 8;
    const pernyataanText = `Kami menyatakan dengan sebenarnya bahwa ekstrakurikuler tersebut adalah kegiatan yang kami pilih dan jalani selama Tahun Pelajaran ${tahunPelajaran} (Semester Ganjil & Genap).`;
    const splitPernyataan = doc.splitTextToSize(pernyataanText, contentWidth);
    doc.text(splitPernyataan, leftMargin, y);
    y += splitPernyataan.length * 4.2 + 8;

    // --- 5. TANDA TANGAN (ORANG TUA & SISWA) ---
    const ttdY = y;

    // Kolom Kiri: Menyetujui Orang Tua
    doc.text('Menyetujui,', leftMargin, ttdY);
    doc.text(`${hubungan}`, leftMargin, ttdY + 4.5);

    // Jika ada tanda tangan digital orang tua
    if (tandaTanganDataUrl) {
        try {
            doc.addImage(tandaTanganDataUrl, 'PNG', leftMargin, ttdY + 6, 38, 16);
        } catch (err) {
            console.warn('Gagal menempelkan tanda tangan digital di PDF', err);
        }
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`( ${namaOrangTua || 'Nama Orang Tua / Wali'} )`, leftMargin, ttdY + 26);
    doc.setFont('helvetica', 'normal');

    // Kolom Kanan: Siswa yang memilih
    doc.text(`Malang, ${tglDisplay}`, rightColX, ttdY);
    doc.text('Siswa yang memilih,', rightColX, ttdY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.text(`( ${namaSiswa} )`, rightColX, ttdY + 26);
    doc.setFont('helvetica', 'normal');

    // Return as Blob and DataURL
    const pdfBlob = doc.output('blob');
    const pdfDataUri = doc.output('datauristring');

    return {
        blob: pdfBlob,
        dataUri: pdfDataUri,
        fileName: `Angket_Pendaftaran_${namaSiswa.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
        save: () => doc.save(`Angket_Pendaftaran_${namaSiswa.replace(/\s+/g, '_')}.pdf`)
    };
};

