import React, { useState, useEffect } from 'react';
import { Award, Search, Users, Activity, CheckCircle, Trophy, BarChart3, ChevronRight, Download, Printer, Filter, Calendar } from 'lucide-react';
import api from '../../api/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PelatihPerkembanganNilai = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedKelas, setSelectedKelas] = useState('');
    const [selectedPredikat, setSelectedPredikat] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMonitoringData();
    }, []);

    const fetchMonitoringData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/pelatih/monitoring-nilai');
            if (res.data.success) {
                setData(res.data.data);
            } else {
                setError(res.data.message || 'Gagal memuat perkembangan nilai');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    const siswaList = data?.siswa || [];
    const ekskulInfo = data?.ekskul || {};

    // Extract unique classes for filter dropdown
    const uniqueKelas = Array.from(new Set(siswaList.map(s => s.nama_kelas).filter(Boolean))).sort();

    const filtered = siswaList.filter(s => {
        const matchSearch = s.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.no_induk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchKelas = !selectedKelas || s.nama_kelas === selectedKelas;
        const matchPredikat = !selectedPredikat || s.predikat === selectedPredikat;
        const matchStatus = !selectedStatus || s.status_perkembangan === selectedStatus;
        return matchSearch && matchKelas && matchPredikat && matchStatus;
    });

    // Statistik Rekapitulasi Ekskul Ini
    const totalSiswa = filtered.length;
    const nilaiValid = filtered.filter(f => f.nilai_akhir > 0);
    const avgNilai = nilaiValid.length > 0
        ? (nilaiValid.reduce((acc, curr) => acc + Number(curr.nilai_akhir), 0) / nilaiValid.length).toFixed(1)
        : 0;

    const countA = filtered.filter(f => f.predikat === 'A').length;
    const countB = filtered.filter(f => f.predikat === 'B').length;
    const countC = filtered.filter(f => f.predikat === 'C').length;
    const countD = filtered.filter(f => f.predikat === 'D').length;

    // FUNGSI CETAK LAPORAN PDF
    const handlePrintPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');

        // Header KOP Surat Sekolah
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("SMPK SANTA MARIA 2 MALANG", 105, 16, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("LAPORAN PERKEMBANGAN & REKAPITULASI NILAI EKSTRAKURIKULER", 105, 22, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Tahun Ajaran: ${data?.tahun_ajaran || '-'} | Semester: ${data?.semester || '-'}`, 105, 27, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(15, 30, 195, 30);

        // Informasi Ekstrakurikuler & Bobot
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Ekstrakurikuler : ${ekskulInfo.nama || '-'}`, 15, 36);
        doc.text(`Total Pertemuan: ${ekskulInfo.total_pertemuan || 0} Kali Latihan`, 15, 41);

        const bobotStr = ekskulInfo.bobot_aspek?.map(b => `${b.nama_aspek}: ${b.bobot}%`).join(' | ') || '-';
        doc.setFont("helvetica", "normal");
        doc.text(`Komposisi Bobot: ${bobotStr}`, 15, 46);

        // Tabel Data Siswa
        const tableBody = filtered.map((s, idx) => [
            idx + 1,
            s.no_induk || '-',
            s.nama_siswa || '-',
            s.nama_kelas || '-',
            `${s.kehadiran.persen}% (${s.kehadiran.hadir}/${s.kehadiran.total_pertemuan})`,
            s.rata_rata_latihan > 0 ? s.rata_rata_latihan : '-',
            s.status_perkembangan || '-',
            s.nilai_akhir > 0 ? s.nilai_akhir : '-',
            s.predikat || '-'
        ]);

        autoTable(doc, {
            startY: 51,
            head: [['No', 'NIS', 'Nama Siswa', 'Kelas', 'Kehadiran', 'Rata-rata Latihan', 'Status', 'Nilai Akhir', 'Predikat']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [0, 0, 128], // Navy #000080
                textColor: [255, 255, 255],
                fontSize: 8,
                halign: 'center',
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [30, 41, 59]
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'center', cellWidth: 18 },
                2: { halign: 'left' },
                3: { halign: 'center', cellWidth: 18 },
                4: { halign: 'center', cellWidth: 26 },
                5: { halign: 'center', cellWidth: 22 },
                6: { halign: 'center', cellWidth: 24 },
                7: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
                8: { halign: 'center', cellWidth: 16, fontStyle: 'bold' }
            },
            margin: { left: 15, right: 15 },
            didDrawPage: function (data) {
                // Footer Nomor Halaman
                const str = 'Halaman ' + doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(str, 195, 287, { align: 'right' });
            }
        });

        // Bagian Tanda Tangan
        const finalY = (doc).lastAutoTable.finalY + 12;
        if (finalY < 250) {
            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`Malang, ${today}`, 145, finalY);
            doc.text("Pelatih Ekstrakurikuler,", 145, finalY + 5);
            doc.setFont("helvetica", "bold");
            doc.text(`( ......................................... )`, 145, finalY + 25);
            doc.text(`${ekskulInfo.nama || 'Pelatih Ekskul'}`, 145, finalY + 30);
        }

        doc.save(`Perkembangan_Nilai_${(ekskulInfo.nama || 'Ekskul').replace(/\s+/g, '_')}_${data?.tahun_ajaran?.replace('/', '-')}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-500 animate-pulse">Memuat perkembangan nilai ekstrakurikuler...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#000080] rounded-full text-xs font-black uppercase tracking-wider mb-2 border border-blue-100">
                        Ekstrakurikuler: {ekskulInfo.nama || 'Ekskul Anda'}
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Perkembangan & Rekap Nilai</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Monitoring ringkasan kehadiran, rata-rata latihan per pertemuan, dan nilai akhir rapor siswa untuk ekskul Anda
                    </p>
                </div>

                {/* TOMBOL CETAK / EXPORT */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrintPDF}
                        disabled={filtered.length === 0}
                        className="flex items-center gap-2 px-5 py-3 bg-[#000080] hover:bg-blue-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50"
                        title="Cetak atau Unduh PDF"
                    >
                        <Printer size={18} />
                        Cetak Laporan (PDF)
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-200 font-bold shadow-sm">
                    <Activity size={18} />
                    {error}
                </div>
            )}

            {/* RINGKASAN BOBOT ASPEK EKSKUL INI */}
            {ekskulInfo.bobot_aspek && ekskulInfo.bobot_aspek.length > 0 && (
                <div className="bg-gradient-to-r from-blue-900 to-[#000080] text-white p-6 rounded-[2rem] shadow-lg shadow-blue-900/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-black text-blue-200 uppercase tracking-widest">Aturan Bobot Penilaian Ekskul</p>
                            <h3 className="text-lg font-black mt-0.5">{ekskulInfo.nama} ({data?.tahun_ajaran} - Semester {data?.semester})</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {ekskulInfo.bobot_aspek.map((asp, idx) => (
                                <span key={idx} className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-bold border border-white/10">
                                    {asp.nama_aspek}: <strong className="text-yellow-300 font-black">{asp.bobot}%</strong>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* STATISTIK CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Anggota</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{totalSiswa} <span className="text-xs font-semibold text-slate-400">Siswa</span></p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm bg-gradient-to-br from-white to-blue-50/40">
                    <p className="text-xs font-bold text-[#000080] uppercase tracking-wider">Rata-rata Nilai</p>
                    <p className="text-2xl font-black text-[#000080] mt-1">{avgNilai}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Predikat A</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{countA} <span className="text-xs font-semibold text-slate-400">Siswa</span></p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Predikat B</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{countB} <span className="text-xs font-semibold text-slate-400">Siswa</span></p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Predikat C</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">{countC} <span className="text-xs font-semibold text-slate-400">Siswa</span></p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Predikat D</p>
                    <p className="text-2xl font-black text-rose-600 mt-1">{countD} <span className="text-xs font-semibold text-slate-400">Siswa</span></p>
                </div>
            </div>

            {/* FILTER CONTROLS */}
            <div className="bg-white border border-slate-200 p-5 rounded-[2rem] shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-[#000080] uppercase tracking-wider">
                    <Filter size={16} /> Filter & Pencarian Data
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* SEARCH INPUT */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama atau NIS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080]"
                        />
                    </div>

                    {/* FILTER KELAS */}
                    <div>
                        <select
                            value={selectedKelas}
                            onChange={(e) => setSelectedKelas(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080]"
                        >
                            <option value="">Semua Kelas</option>
                            {uniqueKelas.map((k, idx) => (
                                <option key={idx} value={k}>Kelas {k}</option>
                            ))}
                        </select>
                    </div>

                    {/* FILTER PREDIKAT */}
                    <div>
                        <select
                            value={selectedPredikat}
                            onChange={(e) => setSelectedPredikat(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080]"
                        >
                            <option value="">Semua Predikat (A, B, C, D)</option>
                            <option value="A">Predikat A</option>
                            <option value="B">Predikat B</option>
                            <option value="C">Predikat C</option>
                            <option value="D">Predikat D</option>
                        </select>
                    </div>

                    {/* FILTER STATUS PERKEMBANGAN */}
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080]"
                        >
                            <option value="">Semua Status Perkembangan</option>
                            <option value="Sangat Baik">Sangat Baik</option>
                            <option value="Baik">Baik</option>
                            <option value="Cukup">Cukup</option>
                            <option value="Perlu Bimbingan">Perlu Bimbingan</option>
                        </select>
                    </div>
                </div>

                {/* INFO HASIL FILTER */}
                {(searchTerm || selectedKelas || selectedPredikat || selectedStatus) && (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>Menampilkan <strong>{filtered.length}</strong> dari {siswaList.length} siswa</span>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedKelas('');
                                setSelectedPredikat('');
                                setSelectedStatus('');
                            }}
                            className="text-rose-500 hover:underline font-bold"
                        >
                            Reset Filter
                        </button>
                    </div>
                )}
            </div>

            {/* TABEL REKAP NILAI KHUSUS EKSKUL INI */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">No</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kelas</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kehadiran (% & Sesi)</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rata-rata Latihan</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Perkembangan</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">Nilai Akhir</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Predikat</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length > 0 ? (
                            filtered.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-blue-50/20 transition-colors">
                                    <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                                        {idx + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{s.nama_siswa}</p>
                                        <p className="text-xs text-slate-400">NIS: {s.no_induk || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-600 text-sm">
                                        {s.nama_kelas || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex flex-col items-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                                                s.kehadiran.persen >= 80 ? 'bg-emerald-50 text-emerald-700' :
                                                s.kehadiran.persen >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                            }`}>
                                                {s.kehadiran.persen}%
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                {s.kehadiran.hadir}/{s.kehadiran.total_pertemuan} Masuk
                                                {s.kehadiran.alfa > 0 && <span className="text-rose-500 font-black ml-1">({s.kehadiran.alfa} Alfa)</span>}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-black text-slate-700 text-base">
                                            {s.rata_rata_latihan > 0 ? s.rata_rata_latihan : '-'}
                                        </span>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            {s.pertemuan_dinilai} pertemuan dinilai
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            s.status_perkembangan === 'Sangat Baik' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            s.status_perkembangan === 'Baik' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            s.status_perkembangan === 'Cukup' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-rose-50 text-rose-700 border-rose-200'
                                        }`}>
                                            {s.status_perkembangan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xl font-black text-[#000080]">
                                            {s.nilai_akhir > 0 ? s.nilai_akhir : '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`w-8 h-8 rounded-xl font-black text-sm inline-flex items-center justify-center ${
                                            s.predikat === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                            s.predikat === 'B' ? 'bg-blue-100 text-blue-700' :
                                            s.predikat === 'C' ? 'bg-amber-100 text-amber-700' :
                                            s.predikat === 'D' ? 'bg-rose-100 text-rose-700' :
                                            'bg-slate-100 text-slate-400'
                                        }`}>
                                            {s.predikat}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-8 py-16 text-center text-slate-400">
                                    <Trophy size={40} className="mx-auto mb-2 opacity-30" />
                                    <p className="font-bold">Tidak ada data siswa yang cocok dengan filter</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PelatihPerkembanganNilai;
