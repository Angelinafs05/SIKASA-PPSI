import React, { useState, useEffect } from 'react';
import { 
    Trophy, Search, Activity, User, CheckCircle2, GraduationCap, AlertCircle, 
    Calendar, Printer, Eye, X, BookOpen, Clock, MapPin, ChevronRight, FileText, Percent, Award
} from 'lucide-react';
import api from '../../api/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SiswaNilai = () => {
    const [nilaiData, setNilaiData] = useState([]);
    const [siswaInfo, setSiswaInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState({ semester: '', tahun: '' });
    const [selectedDetail, setSelectedDetail] = useState(null); // Modal detail nilai ekskul tertentu

    useEffect(() => {
        fetchNilai();
    }, []);

    const fetchNilai = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/siswa/nilai');
            if (response.data.success) {
                const resData = response.data.data;
                setNilaiData(resData.nilai || []);
                setSiswaInfo(resData.siswa || null);
                setPeriod({
                    semester: resData.semester,
                    tahun: resData.tahun
                });
            } else {
                setError(response.data.message || 'Gagal mengambil data nilai');
            }
        } catch (err) {
            setError('Gagal mengambil data nilai. Silakan coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    const getGradeLevel = (nilai) => {
        if (nilai === null || nilai === undefined || nilai === '') return { label: '-', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200' };
        const num = Number(nilai);
        if (num >= 85) return { label: 'A', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
        if (num >= 75) return { label: 'B', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        if (num >= 60) return { label: 'C', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
        return { label: 'D', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
    };

    // FUNGSI PRINT PDF (1 Ekskul Tertentu atau Semua Ekskul)
    const handlePrintPDF = (targetEkskul = null) => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const ekskulToPrint = targetEkskul ? [targetEkskul] : nilaiData;

        // KOP Surat Sekolah
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("SMPK SANTA MARIA 2 MALANG", 105, 16, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("LEMBAR LAPORAN CAPAIAN NILAI EKSTRAKURIKULER SISWA", 105, 22, { align: 'center' });
        doc.setFontSize(8.5);
        doc.text(`Tahun Ajaran: ${period.tahun || '-'} | Semester: ${period.semester || '-'}`, 105, 27, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(15, 30, 195, 30);

        // Identitas Siswa
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("IDENTITAS SISWA", 15, 36);
        doc.setFont("helvetica", "normal");
        doc.text(`Nama Lengkap : ${siswaInfo?.nama_siswa || '-'}`, 15, 41);
        doc.text(`NIS / No Induk : ${siswaInfo?.no_induk || '-'}`, 15, 46);
        doc.text(`Kelas                : ${siswaInfo?.nama_kelas || '-'}`, 120, 41);
        doc.text(`Jumlah Ekskul : ${ekskulToPrint.length} Ekstrakurikuler`, 120, 46);
        doc.line(15, 49, 195, 49);

        let currentY = 54;

        ekskulToPrint.forEach((item, idx) => {
            // Cek apakah butuh halaman baru jika mendekati bawah
            if (currentY > 230) {
                doc.addPage();
                currentY = 20;
            }

            // Header Tiap Ekskul
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 128); // Navy
            doc.text(`${idx + 1}. ${item.nama_ekskul.toUpperCase()}`, 15, currentY);
            doc.setTextColor(30, 41, 59);

            currentY += 5;
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.text(`Pembina/Pelatih : ${item.nama_pelatih || '-'}`, 15, currentY);
            
            const bobotStr = item.bobot_aspek?.length > 0 
                ? item.bobot_aspek.map(b => `${b.nama_aspek}: ${b.bobot}%`).join(' | ') 
                : 'Kehadiran: 30% | Materi Pertemuan: 70%';
            doc.text(`Bobot Penilaian: ${bobotStr}`, 15, currentY + 4);

            // Ringkasan Nilai Akhir Box
            currentY += 8;
            const rekapHadir = item.rekap_kehadiran || {};
            const ringkasanBody = [[
                `${rekapHadir.persen || 0}% (${rekapHadir.hadir || 0}/${rekapHadir.total_pertemuan || 0} Masuk)`,
                item.rata_rata_latihan > 0 ? item.rata_rata_latihan : '-',
                item.nilai !== null ? item.nilai : 'Dalam Proses',
                item.predikat || '-',
                item.keterangan || 'Sangat baik, terus pertahankan performamu!'
            ]];

            autoTable(doc, {
                startY: currentY,
                head: [['Kehadiran', 'Rata-rata Latihan', 'Nilai Akhir Rapor', 'Predikat', 'Catatan / Capaian Kompetensi']],
                body: ringkasanBody,
                theme: 'grid',
                headStyles: { fillColor: [0, 0, 128], fontSize: 8, halign: 'center' },
                bodyStyles: { fontSize: 8 },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 32 },
                    1: { halign: 'center', cellWidth: 28 },
                    2: { halign: 'center', cellWidth: 28, fontStyle: 'bold' },
                    3: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
                    4: { halign: 'left' }
                },
                margin: { left: 15, right: 15 }
            });

            currentY = doc.lastAutoTable.finalY + 4;

            // Rincian Pertemuan Harian (Jika Ada)
            if (item.riwayat_pertemuan && item.riwayat_pertemuan.length > 0) {
                if (currentY > 235) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.text("Detail Riwayat Latihan Pertemuan:", 15, currentY);
                currentY += 2;

                const detailBody = item.riwayat_pertemuan.map((p, pIdx) => [
                    pIdx + 1,
                    p.tanggal,
                    p.materi || 'Latihan Rutin',
                    p.status_absensi || 'Hadir',
                    p.nilai,
                    p.catatan || '-'
                ]);

                autoTable(doc, {
                    startY: currentY,
                    head: [['Pertemuan', 'Tanggal', 'Materi / Topik Latihan', 'Absensi', 'Nilai', 'Catatan Pelatih']],
                    body: detailBody,
                    theme: 'striped',
                    headStyles: { fillColor: [71, 85, 105], fontSize: 7.5, halign: 'center' },
                    bodyStyles: { fontSize: 7.5 },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 18 },
                        1: { halign: 'center', cellWidth: 22 },
                        2: { halign: 'left' },
                        3: { halign: 'center', cellWidth: 20 },
                        4: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
                        5: { halign: 'left' }
                    },
                    margin: { left: 15, right: 15 }
                });

                currentY = doc.lastAutoTable.finalY + 8;
            } else {
                currentY += 6;
            }
        });

        // Tanda Tangan Pengesahan di Halaman Terakhir
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }

        const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.text(`Malang, ${today}`, 145, currentY + 6);
        doc.text("Mengetahui,", 145, currentY + 11);
        doc.text("Koordinator Ekstrakurikuler,", 145, currentY + 16);
        doc.setFont("helvetica", "bold");
        doc.text("( ......................................... )", 145, currentY + 36);

        // Download PDF
        const filename = targetEkskul 
            ? `Nilai_${targetEkskul.nama_ekskul.replace(/\s+/g, '_')}_${siswaInfo?.nama_siswa?.replace(/\s+/g, '_')}.pdf`
            : `Rapor_Lengkap_Ekskul_${siswaInfo?.nama_siswa?.replace(/\s+/g, '_')}.pdf`;
        doc.save(filename);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12 font-sans">
            {/* HEADER */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#000080]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#000080]/10 rounded-2xl flex items-center justify-center text-[#000080]">
                                <GraduationCap size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rapor & Nilai Ekskul</h1>
                                <p className="text-slate-500 font-medium">Lihat pencapaian, rincian evaluasi materi latihan, dan nilai akhir rapor kamu.</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-600">
                                <Calendar size={15} className="text-slate-400" />
                                <span>{period.semester} {period.tahun}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 text-[#000080] text-xs font-black uppercase tracking-wider">
                                <Trophy size={15} />
                                <span>{nilaiData.length} Ekstrakurikuler Diikuti</span>
                            </div>
                        </div>
                    </div>

                    {/* TOMBOL CETAK SEMUA NILAI SEKALIGUS */}
                    {nilaiData.length > 0 && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handlePrintPDF(null)}
                                className="flex items-center gap-2 px-6 py-3.5 bg-[#000080] hover:bg-blue-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
                                title="Cetak Rapor Nilai Seluruh Ekskul Sekaligus"
                            >
                                <Printer size={18} />
                                Cetak Semua Nilai ({nilaiData.length} Ekskul)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-6 rounded-[2rem] flex items-center gap-4 border border-rose-100 font-bold text-sm">
                    <AlertCircle className="shrink-0" size={24} />
                    <p>{error}</p>
                </div>
            )}

            {/* CONTENT KARTU NILAI EKSKUL */}
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-[#000080] rounded-full animate-spin"></div>
                </div>
            ) : nilaiData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nilaiData.map((item, idx) => {
                        const grade = getGradeLevel(item.nilai);
                        const rekapHadir = item.rekap_kehadiran || {};
                        const countPertemuan = item.riwayat_pertemuan?.length || 0;

                        return (
                            <div key={idx} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-[#000080]/5 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group">
                                <div className="space-y-5">
                                    {/* Header Ekskul */}
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-800 group-hover:text-[#000080] transition-colors">{item.nama_ekskul}</h3>
                                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                                <User size={13} /> {item.nama_pelatih || '-'}
                                            </p>
                                        </div>
                                        <div className={`w-14 h-14 ${grade.bg} ${grade.color} ${grade.border} rounded-2xl flex flex-col items-center justify-center font-black shadow-sm border-2`}>
                                            <span className="text-2xl leading-none">{grade.label}</span>
                                            <span className="text-[9px] uppercase tracking-widest mt-0.5">Predikat</span>
                                        </div>
                                    </div>

                                    {/* Skor Progress */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest">
                                            <span>Nilai Akhir Rapor</span>
                                            <span className={`${grade.color} text-sm font-black`}>
                                                {item.nilai !== null ? `${item.nilai} / 100` : 'Belum Dinilai'}
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 ease-out rounded-full"
                                                style={{ width: `${item.nilai || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Ringkasan Parameter */}
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kehadiran</p>
                                            <p className="text-base font-black text-slate-700 mt-0.5">
                                                {rekapHadir.persen || 0}%
                                                <span className="text-xs font-semibold text-slate-400 ml-1">({rekapHadir.hadir || 0}/{rekapHadir.total_pertemuan || 0})</span>
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rata-rata Latihan</p>
                                            <p className="text-base font-black text-slate-700 mt-0.5">
                                                {item.rata_rata_latihan > 0 ? item.rata_rata_latihan : '-'}
                                                <span className="text-xs font-semibold text-slate-400 ml-1">({countPertemuan} Sesi)</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Catatan Pelatih */}
                                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/70">
                                        <p className="text-[10px] font-black text-[#000080] uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <Activity size={12} /> Catatan Capaian
                                        </p>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                            "{item.keterangan || 'Sangat baik, terus pertahankan performamu!'}"
                                        </p>
                                    </div>
                                </div>

                                {/* AKSI: LIHAT DETAIL & CETAK 1 EKSKUL */}
                                <div className="grid grid-cols-2 gap-3 pt-6 mt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => setSelectedDetail(item)}
                                        className="py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-200 transition-all active:scale-95"
                                    >
                                        <Eye size={15} className="text-[#000080]" />
                                        Detail Nilai
                                    </button>
                                    <button
                                        onClick={() => handlePrintPDF(item)}
                                        className="py-3 px-4 bg-blue-50 hover:bg-blue-100 text-[#000080] rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-blue-200 transition-all active:scale-95"
                                    >
                                        <Printer size={15} />
                                        Cetak Ekskul Ini
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] py-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                        <Trophy size={48} className="text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-400 tracking-tight">Belum Ada Nilai</h2>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Nilai kamu sedang diproses oleh pelatih. Silakan cek kembali nanti.</p>
                </div>
            )}

            {/* MODAL DETAIL NILAI & RIWAYAT PERTEMUAN */}
            {selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] max-w-3xl w-full p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto my-8">
                        <button
                            onClick={() => setSelectedDetail(null)}
                            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X size={22} />
                        </button>

                        <div className="space-y-6">
                            {/* Header Modal */}
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#000080] rounded-full text-xs font-black uppercase tracking-wider mb-2 border border-blue-100">
                                    Rincian Penilaian Ekstrakurikuler
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                    {selectedDetail.nama_ekskul}
                                </h2>
                                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                    Pembina/Pelatih: {selectedDetail.nama_pelatih || '-'} • Hari: {selectedDetail.hari || '-'} ({selectedDetail.jam || '-'})
                                </p>
                            </div>

                            {/* Bobot Aspek Info */}
                            {selectedDetail.bobot_aspek && selectedDetail.bobot_aspek.length > 0 && (
                                <div className="bg-gradient-to-r from-blue-900 to-[#000080] text-white p-5 rounded-2xl">
                                    <p className="text-xs font-black text-blue-200 uppercase tracking-widest mb-1.5">Komposisi Bobot Nilai</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDetail.bobot_aspek.map((b, i) => (
                                            <span key={i} className="bg-white/10 px-3 py-1 rounded-xl text-xs font-bold border border-white/10">
                                                {b.nama_aspek}: <strong className="text-yellow-300 font-black">{b.bobot}%</strong>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ringkasan Skor Akhir */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kehadiran</p>
                                    <p className="text-lg font-black text-slate-800 mt-0.5">
                                        {selectedDetail.rekap_kehadiran?.persen || 0}%
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold">
                                        {selectedDetail.rekap_kehadiran?.hadir || 0} dari {selectedDetail.rekap_kehadiran?.total_pertemuan || 0} Masuk
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rata-rata Latihan</p>
                                    <p className="text-lg font-black text-slate-800 mt-0.5">
                                        {selectedDetail.rata_rata_latihan > 0 ? selectedDetail.rata_rata_latihan : '-'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold">
                                        {selectedDetail.riwayat_pertemuan?.length || 0} Sesi Dinilai
                                    </p>
                                </div>
                                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-center">
                                    <p className="text-[10px] font-black text-[#000080] uppercase tracking-wider">Nilai Akhir Rapor</p>
                                    <p className="text-2xl font-black text-[#000080] mt-0.5">
                                        {selectedDetail.nilai !== null ? selectedDetail.nilai : '-'}
                                    </p>
                                </div>
                                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center">
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Predikat</p>
                                    <p className="text-2xl font-black text-emerald-700 mt-0.5">
                                        {selectedDetail.predikat || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Tabel Riwayat Latihan Per Pertemuan */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <BookOpen size={16} className="text-[#000080]" /> Riwayat Latihan & Materi Per Pertemuan
                                </h4>

                                {selectedDetail.riwayat_pertemuan && selectedDetail.riwayat_pertemuan.length > 0 ? (
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px]">
                                                    <th className="px-4 py-3 text-center w-12">No</th>
                                                    <th className="px-4 py-3">Tanggal</th>
                                                    <th className="px-4 py-3">Materi / Topik Latihan</th>
                                                    <th className="px-4 py-3 text-center">Presensi</th>
                                                    <th className="px-4 py-3 text-center w-20">Nilai</th>
                                                    <th className="px-4 py-3">Catatan / Evaluasi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedDetail.riwayat_pertemuan.map((p, pIdx) => (
                                                    <tr key={pIdx} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-4 py-3 text-center font-bold text-slate-400">{pIdx + 1}</td>
                                                        <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{p.tanggal}</td>
                                                        <td className="px-4 py-3 font-bold text-slate-800">{p.materi || 'Latihan Rutin'}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                                                p.status_absensi === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                p.status_absensi === 'Izin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                p.status_absensi === 'Sakit' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                'bg-slate-50 text-slate-600 border-slate-200'
                                                            }`}>
                                                                {p.status_absensi || 'Hadir'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-sm font-black text-[#000080]">{p.nilai}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500 italic">{p.catatan || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs font-medium">
                                        Belum ada data nilai per pertemuan yang diinput oleh pelatih untuk ekskul ini.
                                    </div>
                                )}
                            </div>

                            {/* Tombol Aksi di Modal */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handlePrintPDF(selectedDetail)}
                                    className="px-6 py-3 bg-[#000080] hover:bg-blue-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-900/20 active:scale-95 transition-all"
                                >
                                    <Printer size={16} />
                                    Cetak Lembar Nilai Ekskul Ini
                                </button>
                                <button
                                    onClick={() => setSelectedDetail(null)}
                                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiswaNilai;
