
import React, { useState, useEffect } from 'react';
import { Search, Users, Activity, CheckCircle, Clock, AlertCircle, FileText, Download, BarChart3, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const AdminRekapAbsensi = () => {
    const { user } = useAuth();
    const isPendamping = user?.role === 'pendamping';

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

    const filtered = rekapList.filter(s =>
        s.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_ekskul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.no_induk?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Kalkulasi Statistik Dashboard
    const totalSiswa = filtered.length;
    const totalHadirSum = filtered.reduce((acc, curr) => acc + (Number(curr.total_hadir) || 0), 0);
    const totalIzinSum = filtered.reduce((acc, curr) => acc + (Number(curr.total_izin) || 0), 0);
    const totalSakitSum = filtered.reduce((acc, curr) => acc + (Number(curr.total_sakit) || 0), 0);
    const totalAlfaSum = filtered.reduce((acc, curr) => acc + (Number(curr.total_alfa) || 0), 0);
    const totalPertemuanSum = filtered.reduce((acc, curr) => acc + (Number(curr.total_pertemuan) || 0), 0);

    const avgAttendancePct = totalPertemuanSum > 0
        ? Math.round((totalHadirSum / totalPertemuanSum) * 100)
        : 0;

    const countPerluPerhatian = filtered.filter(f => Number(f.total_alfa) >= 3).length;

    // Export CSV
    const handleExportCSV = () => {
        const headers = ["No", "NIS", "Nama Siswa", "Kelas", "Ekstrakurikuler", "Hadir", "Izin", "Sakit", "Alfa", "Total Pertemuan", "Persentase Kehadiran", "Status"];
        const rows = filtered.map((item, index) => {
            const tot = Number(item.total_pertemuan) || 0;
            const had = Number(item.total_hadir) || 0;
            const pct = tot > 0 ? Math.round((had / tot) * 100) : 0;
            const status = Number(item.total_alfa) >= 3 ? "Perlu Pembinaan" : pct >= 85 ? "Sangat Aktif" : "Aktif";
            return [
                index + 1,
                item.no_induk || '-',
                `"${item.nama_siswa}"`,
                item.nama_kelas || '-',
                `"${item.nama_ekskul}"`,
                item.total_hadir || 0,
                item.total_izin || 0,
                item.total_sakit || 0,
                item.total_alfa || 0,
                tot,
                `${pct}%`,
                status
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rekap_Kehadiran_SIKASA_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Rekapitulasi Absensi</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">Dashboard analisis akumulasi kehadiran, persentase keaktifan, dan monitoring absensi per siswa</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        disabled={filtered.length === 0}
                        className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                        <Download size={16} /> Ekspor Data (.CSV)
                    </button>
                </div>
            </div>

            {/* STATISTIK OVERVIEW CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Siswa</span>
                        <Users size={16} />
                    </div>
                    <p className="text-2xl font-black text-slate-800 mt-2">{totalSiswa}</p>
                    <span className="text-xs text-slate-400 font-medium">Terdaftar di Ekskul</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm bg-gradient-to-br from-white to-blue-50/50">
                    <div className="flex items-center justify-between text-[#000080]">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Rata-rata Hadir</span>
                        <TrendingUp size={16} />
                    </div>
                    <p className="text-2xl font-black text-[#000080] mt-2">{avgAttendancePct}%</p>
                    <span className="text-xs text-blue-600 font-medium">Tingkat Keaktifan</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/30">
                    <div className="flex items-center justify-between text-emerald-600">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Hadir</span>
                        <CheckCircle size={16} />
                    </div>
                    <p className="text-2xl font-black text-emerald-700 mt-2">{totalHadirSum}</p>
                    <span className="text-xs text-emerald-600 font-medium">Presensi Masuk</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm bg-blue-50/30">
                    <div className="flex items-center justify-between text-blue-600">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Izin</span>
                        <Clock size={16} />
                    </div>
                    <p className="text-2xl font-black text-blue-700 mt-2">{totalIzinSum}</p>
                    <span className="text-xs text-blue-600 font-medium">Izin Terkonfirmasi</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm bg-amber-50/30">
                    <div className="flex items-center justify-between text-amber-600">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Sakit</span>
                        <AlertCircle size={16} />
                    </div>
                    <p className="text-2xl font-black text-amber-700 mt-2">{totalSakitSum}</p>
                    <span className="text-xs text-amber-600 font-medium">Surat Dokter / Izin</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm bg-rose-50/30">
                    <div className="flex items-center justify-between text-rose-600">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Total Alfa</span>
                        <AlertTriangle size={16} />
                    </div>
                    <p className="text-2xl font-black text-rose-700 mt-2">{totalAlfaSum}</p>
                    <span className="text-xs text-rose-600 font-medium">{countPerluPerhatian} Perlu Perhatian</span>
                </div>
            </div>

            {/* FILTER & PENCARIAN */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                {!isPendamping ? (
                    <div className="w-full md:w-80">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filter Ekstrakurikuler</label>
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
                ) : (
                    <div className="w-full md:w-auto">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ekskul Didampingi</span>
                        <div className="px-4 py-2.5 bg-blue-50 text-[#000080] border border-blue-200 rounded-xl font-bold text-sm flex items-center gap-2">
                            <Trophy size={16} />
                            {ekskuls.map(e => e.nama_ekskul).join(', ') || 'Ekstrakurikuler Pendampingan'}
                        </div>
                    </div>
                )}

                <div className="w-full md:w-96">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pencarian Siswa</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari nama siswa, ekskul, kelas, NIS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#000080]"
                        />
                        <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
                    </div>
                </div>
            </div>

            {/* TABEL REKAPITULASI DENGAN PROGRESS BAR */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="text-[#000080]" size={20} />
                        <h3 className="font-bold text-slate-800">Tabel Rekapitulasi Kehadiran Siswa</h3>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-[#000080]">
                        Total {filtered.length} Siswa
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                                <th className="p-4 text-center w-12">No</th>
                                <th className="p-4">Nama Siswa</th>
                                <th className="p-4 text-center">Kelas</th>
                                <th className="p-4">Ekstrakurikuler</th>
                                <th className="p-4 text-center text-emerald-700">Hadir</th>
                                <th className="p-4 text-center text-blue-700">Izin</th>
                                <th className="p-4 text-center text-amber-700">Sakit</th>
                                <th className="p-4 text-center text-rose-700">Alfa</th>
                                <th className="p-4 text-center font-extrabold">Total Sesi</th>
                                <th className="p-4 w-44">Tingkat Kehadiran</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="11" className="p-8 text-center text-slate-400 font-medium">
                                        Memuat data rekapitulasi absensi...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="p-8 text-center text-slate-400 font-medium">
                                        Tidak ada data yang sesuai dengan pencarian atau filter.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item, index) => {
                                    const total = Number(item.total_pertemuan) || 0;
                                    const hadir = Number(item.total_hadir) || 0;
                                    const pct = total > 0 ? Math.round((hadir / total) * 100) : 0;
                                    const isWarning = Number(item.total_alfa) >= 3;

                                    return (
                                        <tr key={index} className="hover:bg-blue-50/30 transition">
                                            <td className="p-4 text-center font-medium text-slate-400">{index + 1}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{item.nama_siswa}</div>
                                                {item.no_induk && <span className="text-xs text-slate-400 font-mono">NIS: {item.no_induk}</span>}
                                            </td>
                                            <td className="p-4 text-center font-semibold text-slate-600">{item.nama_kelas || '-'}</td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#000080] border border-blue-200">
                                                    {item.nama_ekskul}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center font-bold text-emerald-600">{item.total_hadir || 0}</td>
                                            <td className="p-4 text-center font-bold text-blue-600">{item.total_izin || 0}</td>
                                            <td className="p-4 text-center font-bold text-amber-600">{item.total_sakit || 0}</td>
                                            <td className="p-4 text-center font-bold text-rose-600">{item.total_alfa || 0}</td>
                                            <td className="p-4 text-center font-black text-slate-800">{total}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold w-10 text-right">{pct}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {isWarning ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                                        <AlertTriangle size={12} /> Perlu Pembinaan
                                                    </span>
                                                ) : pct >= 85 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                        <CheckCircle size={12} /> Sangat Aktif
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#000080]">
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
            </div>
        </div>
    );
};

export default AdminRekapAbsensi;
