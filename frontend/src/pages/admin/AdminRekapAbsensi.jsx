import React, { useState, useEffect } from 'react';
import { Calendar, Search, Users, Activity, CheckCircle, Clock, AlertCircle, FileText, Download, Printer } from 'lucide-react';
import api from '../../api/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminRekapAbsensi = () => {
    const [ekskuls, setEkskuls] = useState([]);
    const [selectedEkskul, setSelectedEkskul] = useState('');
    const [rekapList, setRekapList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEkskuls();
    }, []);

    useEffect(() => {
        fetchRekap(selectedEkskul);
    }, [selectedEkskul]);

    const fetchEkskuls = async () => {
        try {
            const res = await api.get('/api/admin/ekskul');
            if (res.data.success) {
                setEkskuls(res.data.data);
            }
        } catch (err) {
            setError('Gagal memuat daftar ekstrakurikuler');
        }
    };

    const fetchRekap = async (ekskulId = '') => {
        try {
            setLoading(true);
            const query = ekskulId ? `?ekskul_id=${ekskulId}` : '';
            const res = await api.get(`/api/admin/rekap-absensi${query}`);
            if (res.data.success) {
                setRekapList(res.data.data || []);
            }
        } catch (err) {
            setError('Gagal memuat rekap absensi');
        } finally {
            setLoading(false);
        }
    };

    const handlePrintPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 128);
        doc.text('REKAPITULASI LAPORAN ABSENSI EKSTRAKURIKULER', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`SMPK SANTA MARIA 2 - SIKASA`, 105, 27, { align: 'center' });
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 105, 33, { align: 'center' });

        const tableColumn = ["No", "Nama Siswa", "Kelas", "Ekskul", "Hadir", "Izin", "Sakit", "Alfa", "Total"];
        const tableRows = filtered.map((item, index) => [
            index + 1,
            item.nama_siswa,
            item.nama_kelas || '-',
            item.nama_ekskul,
            item.total_hadir,
            item.total_izin,
            item.total_sakit,
            item.total_alfa,
            item.total_pertemuan
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 128], textColor: 255 },
            styles: { fontSize: 8 },
        });

        doc.save(`Rekap_Absensi_SIKASA_${Date.now()}.pdf`);
    };

    const filtered = rekapList.filter(s =>
        s.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_ekskul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Rekapitulasi Absensi</h1>
                    <p className="text-slate-500 font-medium mt-1">Laporan akumulasi kehadiran, izin, sakit, dan alfa seluruh siswa</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrintPDF}
                        disabled={filtered.length === 0}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
                    >
                        <Download size={16} /> Unduh PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
                    >
                        <Printer size={16} /> Cetak
                    </button>
                </div>
            </div>

            {/* FILTER & SEARCH */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Ekstrakurikuler</label>
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pencarian Siswa</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari siswa, ekskul, kelas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Users className="text-[#000080]" size={20} />
                        Rekapitulasi Kehadiran Siswa
                    </h2>
                    <span className="text-xs font-bold bg-blue-50 text-[#000080] px-3 py-1.5 rounded-full border border-blue-100">
                        Total {filtered.length} Data
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm font-bold text-slate-500">Menghitung rekapitulasi absensi...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-slate-600">Tidak ada rekapitulasi</p>
                        <p className="text-xs text-slate-400 mt-1">Belum ada pertemuan atau siswa terdaftar pada filter ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">No</th>
                                    <th className="px-6 py-4">Nama Siswa</th>
                                    <th className="px-6 py-4">Kelas</th>
                                    <th className="px-6 py-4">Ekstrakurikuler</th>
                                    <th className="px-6 py-4 text-center">Hadir</th>
                                    <th className="px-6 py-4 text-center">Izin</th>
                                    <th className="px-6 py-4 text-center">Sakit</th>
                                    <th className="px-6 py-4 text-center">Alfa</th>
                                    <th className="px-6 py-4 text-center">Total Pertemuan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filtered.map((item, idx) => (
                                    <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-6 py-4 font-black text-slate-800">{item.nama_siswa}</td>
                                        <td className="px-6 py-4 font-bold text-slate-600">{item.nama_kelas || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-50 text-[#000080] border border-blue-100 rounded-full font-bold text-xs inline-block">
                                                {item.nama_ekskul}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-emerald-600">{item.total_hadir}</td>
                                        <td className="px-6 py-4 text-center font-bold text-blue-600">{item.total_izin}</td>
                                        <td className="px-6 py-4 text-center font-bold text-amber-600">{item.total_sakit}</td>
                                        <td className="px-6 py-4 text-center font-bold text-rose-600">{item.total_alfa}</td>
                                        <td className="px-6 py-4 text-center font-black text-slate-800">{item.total_pertemuan}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRekapAbsensi;
