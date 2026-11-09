import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Search, Filter, Calendar, Building, UserCheck, ShieldCheck } from 'lucide-react';
import api from '../../api/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminLaporanAbsensi = () => {
    const [ekskuls, setEkskuls] = useState([]);
    const [selectedEkskul, setSelectedEkskul] = useState('');
    const [kelasList, setKelasList] = useState([]);
    const [selectedKelas, setSelectedKelas] = useState('');
    const [rekapList, setRekapList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [settings, setSettings] = useState({
        tahun_ajaran: '2025/2026',
        semester: 'Genap',
        kepala_sekolah: 'Kepala Sekolah SMPK Santa Maria 2'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchLaporanData();
    }, [selectedEkskul, selectedKelas]);

    const fetchInitialData = async () => {
        try {
            const [resEkskul, resKelas, resSettings] = await Promise.all([
                api.get('/api/admin/ekskul'),
                api.get('/api/admin/kelas'),
                api.get('/api/admin/settings').catch(() => ({ data: { data: {} } }))
            ]);

            if (resEkskul.data.success) setEkskuls(resEkskul.data.data);
            if (resKelas.data.success) setKelasList(resKelas.data.data);
            if (resSettings.data?.data) {
                setSettings(prev => ({
                    ...prev,
                    tahun_ajaran: resSettings.data.data.tahun_ajaran_aktif || prev.tahun_ajaran,
                    semester: resSettings.data.data.semester_aktif || prev.semester,
                    kepala_sekolah: resSettings.data.data.nama_kepala_sekolah || prev.kepala_sekolah
                }));
            }
        } catch (err) {
            setError('Gagal memuat data pendukung');
        }
    };

    const fetchLaporanData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedEkskul) params.append('ekskul_id', selectedEkskul);
            if (selectedKelas) params.append('kelas_id', selectedKelas);

            const res = await api.get(`/api/admin/rekap-absensi?${params.toString()}`);
            if (res.data.success) {
                setRekapList(res.data.data || []);
            }
        } catch (err) {
            setError('Gagal memuat laporan absensi');
        } finally {
            setLoading(false);
        }
    };

    const currentEkskulObj = ekskuls.find(e => String(e.id) === String(selectedEkskul));

    const filtered = rekapList.filter(s => {
        const matchSearch = s.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.nama_ekskul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.no_induk?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchKelas = !selectedKelas || String(s.kelas_id) === String(selectedKelas) || String(s.nama_kelas).toLowerCase() === String(selectedKelas).toLowerCase();
        return matchSearch && matchKelas;
    });

    const handlePrintPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');

        // Header KOP Surat Sekolah
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("SMPK SANTA MARIA 2 MALANG", 105, 18, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("LAPORAN RESMI REKAPITULASI PRESENSI / ABSENSI EKSTRAKURIKULER", 105, 24, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Tahun Ajaran: ${settings.tahun_ajaran} | Semester: ${settings.semester}`, 105, 29, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(15, 33, 195, 33);

        // Informasi Tambahan
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Ekstrakurikuler: ${currentEkskulObj ? currentEkskulObj.nama_ekskul : 'Semua Ekstrakurikuler'}`, 15, 40);
        doc.setFont("helvetica", "normal");
        if (currentEkskulObj) {
            doc.text(`Pembina / Pelatih: ${currentEkskulObj.pelatih || currentEkskulObj.pelatih_nama || '-'}`, 15, 45);
            doc.text(`Guru Pendamping: ${currentEkskulObj.pendamping || '-'}`, 15, 50);
            doc.text(`Jadwal & Tempat: ${currentEkskulObj.hari || '-'} (${currentEkskulObj.jam || '-'}) - ${currentEkskulObj.tempat || '-'}`, 15, 55);
        }

        const startYPos = currentEkskulObj ? 62 : 47;

        const tableColumn = ["No", "No. Induk", "Nama Siswa", "Kelas", "Hadir", "Izin", "Sakit", "Alfa", "Total", "% Hadir", "Status"];
        const tableRows = filtered.map((item, index) => {
            const total = Number(item.total_pertemuan) || 0;
            const hadir = Number(item.total_hadir) || 0;
            const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
            let status = 'Aktif';
            if (Number(item.total_alfa) >= 3) status = 'Perlu Perhatian';
            else if (pct >= 85) status = 'Sangat Aktif';

            return [
                index + 1,
                item.no_induk || '-',
                item.nama_siswa,
                item.nama_kelas || '-',
                item.total_hadir || 0,
                item.total_izin || 0,
                item.total_sakit || 0,
                item.total_alfa || 0,
                total,
                `${pct}%`,
                status
            ];
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startYPos,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 128], textColor: 255, halign: 'center', fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 8 },
                1: { halign: 'center', cellWidth: 18 },
                2: { cellWidth: 42 },
                3: { halign: 'center', cellWidth: 15 },
                4: { halign: 'center', cellWidth: 12 },
                5: { halign: 'center', cellWidth: 12 },
                6: { halign: 'center', cellWidth: 12 },
                7: { halign: 'center', cellWidth: 12 },
                8: { halign: 'center', cellWidth: 14 },
                9: { halign: 'center', cellWidth: 16 },
                10: { halign: 'center', cellWidth: 20 }
            }
        });

        // Tanda Tangan Pengesahan
        const finalY = (doc).lastAutoTable.finalY + 15;
        const pageHeight = doc.internal.pageSize.height;

        if (finalY + 45 > pageHeight) {
            doc.addPage();
            doc.text(`Malang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, 20);
            doc.text("Pembina Ekstrakurikuler,", 20, 26);
            doc.text("Kepala Sekolah,", 140, 26);
            doc.setFont("helvetica", "bold");
            doc.text(currentEkskulObj?.pelatih || currentEkskulObj?.pelatih_nama || "( .................................... )", 20, 50);
            doc.text(settings.kepala_sekolah || "( .................................... )", 140, 50);
        } else {
            doc.text(`Malang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, finalY);
            doc.text("Pembina Ekstrakurikuler,", 20, finalY + 6);
            doc.text("Kepala Sekolah,", 140, finalY + 6);
            doc.setFont("helvetica", "bold");
            doc.text(currentEkskulObj?.pelatih || currentEkskulObj?.pelatih_nama || "( .................................... )", 20, finalY + 30);
            doc.text(settings.kepala_sekolah || "( .................................... )", 140, finalY + 30);
        }

        doc.save(`Laporan_Resmi_Absensi_${currentEkskulObj ? currentEkskulObj.nama_ekskul.replace(/\s+/g, '_') : 'Semua'}_${Date.now()}.pdf`);
    };

    return (
        <div className="space-y-6 font-sans pb-12">
            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-[#000080]">DOKUMEN RESMI</span>
                        <span className="text-xs text-slate-400 font-semibold">• Tahun Ajaran {settings.tahun_ajaran} ({settings.semester})</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#000080] tracking-tight mt-1">Laporan Resmi Absensi</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Format cetak dan arsip resmi rekapitulasi kehadiran siswa ekstrakurikuler</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrintPDF}
                        disabled={filtered.length === 0}
                        className="inline-flex items-center gap-2 bg-[#000080] hover:bg-blue-900 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        <Download size={17} /> Unduh PDF Resmi
                    </button>
                    <button
                        onClick={() => window.print()}
                        disabled={filtered.length === 0}
                        className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        <Printer size={17} /> Cetak
                    </button>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pilih Ekstrakurikuler</label>
                    <select
                        value={selectedEkskul}
                        onChange={(e) => setSelectedEkskul(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#000080]"
                    >
                        <option value="">Semua Ekstrakurikuler</option>
                        {ekskuls.map(e => (
                            <option key={e.id} value={e.id}>{e.nama_ekskul}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter Kelas</label>
                    <select
                        value={selectedKelas}
                        onChange={(e) => setSelectedKelas(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#000080]"
                    >
                        <option value="">Semua Kelas</option>
                        {kelasList.map(k => (
                            <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cari Data Siswa</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari NIS, nama siswa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#000080]"
                        />
                        <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
                    </div>
                </div>
            </div>

            {/* PREVIEW KERTAS LAPORAN DOKUMEN RESMI */}
            <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 md:p-12 print:p-0 print:border-none print:shadow-none">
                {/* KOP SURAT */}
                <div className="text-center border-b-2 border-slate-800 pb-5 mb-6">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-wider">SMPK SANTA MARIA 2 MALANG</h2>
                    <h3 className="text-sm md:text-base font-bold text-slate-700 uppercase mt-0.5">Laporan Rekapitulasi Presensi & Kehadiran Ekstrakurikuler</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Tahun Ajaran: <span className="font-semibold text-slate-700">{settings.tahun_ajaran}</span> | Semester: <span className="font-semibold text-slate-700">{settings.semester}</span>
                    </p>
                </div>

                {/* METADATA EKSKUL */}
                {currentEkskulObj && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-sm">
                        <div>
                            <span className="text-slate-500 text-xs font-semibold block">EKSTRAKURIKULER</span>
                            <span className="font-bold text-[#000080] text-base">{currentEkskulObj.nama_ekskul}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs font-semibold block">PEMBINA / PELATIH</span>
                            <span className="font-bold text-slate-800">{currentEkskulObj.pelatih || currentEkskulObj.pelatih_nama || '-'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs font-semibold block">GURU PENDAMPING</span>
                            <span className="font-semibold text-slate-700">{currentEkskulObj.pendamping || '-'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 text-xs font-semibold block">JADWAL & TEMPAT</span>
                            <span className="font-semibold text-slate-700">{currentEkskulObj.hari || '-'} ({currentEkskulObj.jam || '-'}) - {currentEkskulObj.tempat || '-'}</span>
                        </div>
                    </div>
                )}

                {/* TABEL LAPORAN RESMI */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-300 text-xs md:text-sm">
                        <thead>
                            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                                <th className="p-2.5 border border-slate-300 text-center w-12">No</th>
                                <th className="p-2.5 border border-slate-300 text-center w-28">No. Induk</th>
                                <th className="p-2.5 border border-slate-300">Nama Siswa</th>
                                <th className="p-2.5 border border-slate-300 text-center w-20">Kelas</th>
                                {!currentEkskulObj && <th className="p-2.5 border border-slate-300">Ekstrakurikuler</th>}
                                <th className="p-2.5 border border-slate-300 text-center w-16 bg-emerald-50 text-emerald-800">Hadir</th>
                                <th className="p-2.5 border border-slate-300 text-center w-16 bg-blue-50 text-blue-800">Izin</th>
                                <th className="p-2.5 border border-slate-300 text-center w-16 bg-amber-50 text-amber-800">Sakit</th>
                                <th className="p-2.5 border border-slate-300 text-center w-16 bg-rose-50 text-rose-800">Alfa</th>
                                <th className="p-2.5 border border-slate-300 text-center w-20 font-extrabold">Total Sesi</th>
                                <th className="p-2.5 border border-slate-300 text-center w-24">% Hadir</th>
                                <th className="p-2.5 border border-slate-300 text-center w-28">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={currentEkskulObj ? 11 : 12} className="p-8 text-center text-slate-400">
                                        Memuat data laporan absensi...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={currentEkskulObj ? 11 : 12} className="p-8 text-center text-slate-400">
                                        Tidak ada data absensi untuk filter yang dipilih.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item, index) => {
                                    const total = Number(item.total_pertemuan) || 0;
                                    const hadir = Number(item.total_hadir) || 0;
                                    const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
                                    const isWarning = Number(item.total_alfa) >= 3;

                                    return (
                                        <tr key={index} className="hover:bg-slate-50 transition border-b border-slate-200">
                                            <td className="p-2.5 border border-slate-300 text-center font-medium text-slate-500">{index + 1}</td>
                                            <td className="p-2.5 border border-slate-300 text-center font-mono text-slate-600">{item.no_induk || '-'}</td>
                                            <td className="p-2.5 border border-slate-300 font-bold text-slate-800">{item.nama_siswa}</td>
                                            <td className="p-2.5 border border-slate-300 text-center font-semibold text-slate-600">{item.nama_kelas || '-'}</td>
                                            {!currentEkskulObj && (
                                                <td className="p-2.5 border border-slate-300 font-semibold text-[#000080]">{item.nama_ekskul}</td>
                                            )}
                                            <td className="p-2.5 border border-slate-300 text-center font-bold text-emerald-700">{item.total_hadir || 0}</td>
                                            <td className="p-2.5 border border-slate-300 text-center font-bold text-blue-700">{item.total_izin || 0}</td>
                                            <td className="p-2.5 border border-slate-300 text-center font-bold text-amber-700">{item.total_sakit || 0}</td>
                                            <td className="p-2.5 border border-slate-300 text-center font-bold text-rose-700">{item.total_alfa || 0}</td>
                                            <td className="p-2.5 border border-slate-300 text-center font-black text-slate-900 bg-slate-50">{total}</td>
                                            <td className="p-2.5 border border-slate-300 text-center font-bold">
                                                <span className={pct >= 80 ? 'text-emerald-700' : pct >= 60 ? 'text-amber-700' : 'text-rose-700'}>
                                                    {pct}%
                                                </span>
                                            </td>
                                            <td className="p-2.5 border border-slate-300 text-center">
                                                {isWarning ? (
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                                        Perlu Perhatian
                                                    </span>
                                                ) : pct >= 85 ? (
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                                        Sangat Aktif
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                                                        Aktif
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* AREA TANDA TANGAN PENGESAHAN */}
                <div className="mt-12 grid grid-cols-2 text-center text-sm font-medium text-slate-800 pt-4 border-t border-slate-200">
                    <div>
                        <p className="text-slate-500 text-xs">Mengetahui,</p>
                        <p className="font-bold mt-1">Pembina / Pelatih Ekstrakurikuler</p>
                        <div className="h-20 flex items-end justify-center">
                            <span className="font-bold underline uppercase">
                                {currentEkskulObj?.pelatih || currentEkskulObj?.pelatih_nama || '...........................................'}
                            </span>
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs">Malang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="font-bold mt-1">Kepala Sekolah SMPK Santa Maria 2</p>
                        <div className="h-20 flex items-end justify-center">
                            <span className="font-bold underline uppercase">
                                {settings.kepala_sekolah || '...........................................'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLaporanAbsensi;

