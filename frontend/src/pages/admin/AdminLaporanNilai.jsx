import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Search, Filter, Calendar, Award, Building, UserCheck } from 'lucide-react';
import api from '../../api/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminLaporanNilai = () => {
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
        semester: 'Ganjil',
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

            const res = await api.get(`/api/admin/rekap-nilai?${params.toString()}`);
            if (res.data.success) {
                setRekapList(res.data.data || []);
            }
        } catch (err) {
            setError('Gagal memuat laporan nilai');
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
        const matchKelas = !selectedKelas || String(s.nama_kelas).toLowerCase() === String(selectedKelas).toLowerCase();
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
        doc.text("LAPORAN RESMI PENILAIAN KEGIATAN EKSTRAKURIKULER", 105, 24, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`Tahun Ajaran: ${settings.tahun_ajaran} | Semester: ${settings.semester}`, 105, 29, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(15, 33, 195, 33);

        // Informasi Tambahan
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Ekstrakurikuler: ${currentEkskulObj ? currentEkskulObj.nama_ekskul : 'Semua Ekstrakurikuler'}`, 15, 40);
        doc.text(`Pembina / Pelatih: ${currentEkskulObj?.pelatih_nama || currentEkskulObj?.pelatih || '-'}`, 15, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 195, 40, { align: 'right' });
        doc.text(`Filter Kelas: ${selectedKelas || 'Semua Kelas'}`, 195, 45, { align: 'right' });

        const tableColumn = ["No", "NIS", "Nama Siswa", "Kelas", "Ekskul", "Nilai", "Predikat", "Keterangan / Deskripsi"];
        const tableRows = filtered.map((item, index) => [
            index + 1,
            item.no_induk || '-',
            item.nama_siswa,
            item.nama_kelas || '-',
            item.nama_ekskul,
            item.nilai !== null ? item.nilai : '-',
            item.predikat,
            item.keterangan || '-'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 128], textColor: 255, halign: 'center', fontStyle: 'bold' },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'center', cellWidth: 20 },
                3: { halign: 'center', cellWidth: 18 },
                5: { halign: 'center', cellWidth: 16 },
                6: { halign: 'center', cellWidth: 18 },
            },
            styles: { fontSize: 8, cellPadding: 2 },
            didDrawPage: (data) => {
                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, 195, 290, { align: 'right' });
            }
        });

        // Lembar Tanda Tangan di bawah tabel
        const finalY = doc.lastAutoTable.finalY + 15;
        if (finalY < 240) {
            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            doc.setFontSize(9);
            doc.text(`Malang, ${today}`, 150, finalY);
            doc.text("Pembina Ekstrakurikuler,", 25, finalY + 6);
            doc.text("Kepala Sekolah,", 150, finalY + 6);

            doc.setFont("helvetica", "bold");
            doc.text(currentEkskulObj?.pelatih_nama || currentEkskulObj?.pelatih || "( .................................... )", 25, finalY + 32);
            doc.text(settings.kepala_sekolah || "( .................................... )", 150, finalY + 32);
        }

        doc.save(`Laporan_Nilai_Resmi_${Date.now()}.pdf`);
    };

    return (
        <div className="space-y-8 font-sans pb-16">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Laporan Nilai Resmi</h1>
                    <p className="text-slate-500 font-medium mt-1">Dokumen rekapitulasi nilai rapor ekstrakurikuler format resmi siap cetak</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrintPDF}
                        disabled={filtered.length === 0}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
                    >
                        <Download size={16} /> Unduh PDF Resmi
                    </button>
                    <button
                        onClick={() => window.print()}
                        disabled={filtered.length === 0}
                        className="px-5 py-2.5 bg-[#000080] hover:bg-[#000066] disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
                    >
                        <Printer size={16} /> Cetak Langsung
                    </button>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Ekstrakurikuler</label>
                    <select
                        value={selectedEkskul}
                        onChange={(e) => setSelectedEkskul(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                    >
                        <option value="">Semua Ekstrakurikuler</option>
                        {ekskuls.map(e => (
                            <option key={e.id} value={e.id}>{e.nama_ekskul}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Kelas</label>
                    <select
                        value={selectedKelas}
                        onChange={(e) => setSelectedKelas(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                    >
                        <option value="">Semua Kelas</option>
                        {kelasList.map(k => (
                            <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cari Nama / NIS</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari siswa atau NIS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* DOKUMEN RESMI PREVIEW (LEMBAR KERTAS CETAK) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 md:p-12 max-w-5xl mx-auto space-y-6 print:shadow-none print:border-none print:p-0">
                {/* KOP RESMI SEKOLAH */}
                <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-wider">SMPK SANTA MARIA 2 MALANG</h2>
                    <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Laporan Resmi Hasil Penilaian Ekstrakurikuler
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                        Tahun Ajaran: {settings.tahun_ajaran} &bull; Semester: {settings.semester}
                    </p>
                </div>

                {/* METADATA LAPORAN */}
                <div className="grid grid-cols-2 text-xs font-medium text-slate-700 py-2 border-b border-slate-100">
                    <div>
                        <p><span className="font-bold text-slate-900">Ekstrakurikuler:</span> {currentEkskulObj ? currentEkskulObj.nama_ekskul : 'Semua Kegiatan'}</p>
                        <p className="mt-1"><span className="font-bold text-slate-900">Pembina / Pelatih:</span> {currentEkskulObj?.pelatih_nama || currentEkskulObj?.pelatih || '-'}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-bold text-slate-900">Filter Kelas:</span> {selectedKelas || 'Semua Kelas'}</p>
                        <p className="mt-1"><span className="font-bold text-slate-900">Tanggal Cetak:</span> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* TABEL NILAI */}
                {loading ? (
                    <div className="py-16 text-center">
                        <div className="w-10 h-10 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm font-bold text-slate-500">Menyiapkan laporan...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <FileText size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-slate-600">Tidak ada data nilai untuk dicetak</p>
                        <p className="text-xs text-slate-400 mt-1">Silakan pilih ekstrakurikuler atau kelas yang memiliki data nilai.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-y-2 border-slate-900 bg-slate-50 font-black text-slate-900 uppercase">
                                    <th className="py-3 px-3 text-center w-10">No</th>
                                    <th className="py-3 px-4 w-28">NIS</th>
                                    <th className="py-3 px-4">Nama Siswa</th>
                                    <th className="py-3 px-3 text-center w-20">Kelas</th>
                                    <th className="py-3 px-4 w-36">Ekskul</th>
                                    <th className="py-3 px-3 text-center w-16">Nilai</th>
                                    <th className="py-3 px-3 text-center w-16">Predikat</th>
                                    <th className="py-3 px-4">Deskripsi / Capaian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                                {filtered.map((item, idx) => (
                                    <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/50">
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                                        <td className="py-2.5 px-4 font-mono">{item.no_induk || '-'}</td>
                                        <td className="py-2.5 px-4 font-bold">{item.nama_siswa}</td>
                                        <td className="py-2.5 px-3 text-center font-bold">{item.nama_kelas || '-'}</td>
                                        <td className="py-2.5 px-4">{item.nama_ekskul}</td>
                                        <td className="py-2.5 px-3 text-center font-black">{item.nilai !== null ? item.nilai : '-'}</td>
                                        <td className="py-2.5 px-3 text-center font-black">{item.predikat || '-'}</td>
                                        <td className="py-2.5 px-4 text-slate-600 italic">{item.keterangan || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* LEMBAR PENGESAHAN / TANDA TANGAN */}
                {filtered.length > 0 && (
                    <div className="pt-10 grid grid-cols-2 text-xs font-medium text-slate-800">
                        <div className="space-y-16">
                            <p>Mengetahui,<br />Pembina Ekstrakurikuler</p>
                            <p className="font-bold underline underline-offset-4">
                                {currentEkskulObj?.pelatih_nama || currentEkskulObj?.pelatih || '( .............................................. )'}
                            </p>
                        </div>
                        <div className="space-y-16 text-right">
                            <p>
                                Malang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                                Kepala Sekolah
                            </p>
                            <p className="font-bold underline underline-offset-4">
                                {settings.kepala_sekolah || '( .............................................. )'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLaporanNilai;

