import React, { useState, useEffect } from 'react';
import {
    Users,
    Trophy,
    Clock,
    Calendar,
    ChevronRight,
    Activity,
    UserCheck,
    AlertCircle,
    UserRound
} from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const GuruDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [izinHariIni, setIzinHariIni] = useState([]);
    const [riwayatIzin, setRiwayatIzin] = useState([]);
    const [activeTab, setActiveTab] = useState('hari_ini');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
        
        // Auto-refresh setiap 10 detik untuk update realtime
        const refreshInterval = setInterval(fetchDashboardData, 10000);
        
        return () => clearInterval(refreshInterval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashRes, izinRes] = await Promise.all([
                api.get('/api/pendamping/dashboard'),
                api.get('/api/pendamping/izin')
            ]);

            if (dashRes.data.success) {
                setData(dashRes.data.data);
            } else {
                setError(dashRes.data.message || 'Gagal mengambil data dashboard');
            }

            if (izinRes.data.success) {
                const today = new Date();
                const todayFormatted = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                const dataIzin = izinRes.data.data;

                setIzinHariIni(dataIzin.filter(i => i.tanggal === todayFormatted));
                setRiwayatIzin(dataIzin.filter(i => i.tanggal !== todayFormatted));
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi ke server');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memuat dashboard Anda...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* WELCOME SECTION */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#000080] to-[#000066] rounded-3xl p-8 text-white shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-white/10 border-white/20 text-white">
                                <UserRound size={12} /> Guru Pendamping
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/10 text-white">
                                <Calendar size={12} /> {data?.periode?.tahun_ajaran} - {data?.periode?.semester}
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            Halo, {user?.nama}! 👋
                        </h1>
                        <p className="text-blue-100 font-medium max-w-md">
                            Anda mendampingi <span className="text-white font-bold">{data?.ekskuls?.length || 0} kegiatan</span> ekstrakurikuler di SIKASA.
                        </p>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Activity */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Activity size={24} />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">EKSKUL</span>
                    </div>
                    <div>
                        <h3 className="text-slate-500 font-bold text-base uppercase tracking-wider">Ekskul Didampingi</h3>
                        <p className="text-5xl font-black text-slate-800 mt-1 tracking-tight">{data?.ekskuls?.length || 0}</p>
                        <p className="text-sm text-slate-400 font-medium mt-1">Kegiatan yang Anda bantu awasi</p>
                    </div>
                </div>

                {/* Total Students Across All Assigned Activities */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">TOTAL SISWA</span>
                    </div>
                    <div>
                        <h3 className="text-slate-500 font-bold text-base uppercase tracking-wider">Siswa Aktif</h3>
                        <p className="text-5xl font-black text-slate-800 mt-1 tracking-tight">{data?.total_siswa || 0}</p>
                        <p className="text-sm text-slate-400 font-medium mt-1">Siswa dari semua kegiatan pendampingan</p>
                    </div>
                </div>
            </div>

            {/* ACTIVITIES LIST */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-black text-[#000080] flex items-center gap-2">
                        <Trophy size={20} className="text-blue-500" /> Daftar Ekskul Pendampingan
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-8 py-5">Ekstrakurikuler</th>
                                <th className="px-8 py-5">Pelatih Utama</th>
                                <th className="px-8 py-5">Jadwal & Tempat</th>
                                <th className="px-8 py-5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data?.ekskuls?.map((ekskul) => (
                                <tr key={ekskul.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-slate-800">{ekskul.nama_ekskul}</div>
                                        <div className="text-xs text-slate-400">
                                            {(() => {
                                                const romanMap = { '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII' };
                                                try {
                                                    const targets = typeof ekskul.target_kelas === 'string' ? JSON.parse(ekskul.target_kelas) : ekskul.target_kelas;
                                                    if (Array.isArray(targets)) {
                                                        return targets.map(t => romanMap[t] || t).join(', ');
                                                    }
                                                    return romanMap[targets] || targets || '-';
                                                } catch (e) { return romanMap[ekskul.target_kelas] || ekskul.target_kelas || '-'; }
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#000080] font-black text-[10px]">
                                                {ekskul.nama_pelatih?.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-700">{ekskul.nama_pelatih}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                <Calendar size={14} className="text-[#000080]" /> {ekskul.hari}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <Clock size={14} /> {ekskul.jam} • {ekskul.tempat}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="bg-[#000080] hover:bg-blue-700 text-white font-black text-[10px] px-4 py-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 uppercase tracking-widest">
                                            Lihat Siswa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!data?.ekskuls?.length && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-12 text-center text-slate-400 font-bold italic">
                                        Belum ada kegiatan ekstrakurikuler yang ditugaskan kepada Anda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MANAJEMEN IZIN */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    <button
                        onClick={() => setActiveTab('hari_ini')}
                        className={`flex-1 p-4 md:p-5 text-center font-bold text-sm md:text-base transition-colors relative ${activeTab === 'hari_ini' ? 'text-orange-600 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <UserCheck size={20} />
                            Izin Hari Ini
                            <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full ${activeTab === 'hari_ini' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                                {izinHariIni.length}
                            </span>
                        </div>
                        {activeTab === 'hari_ini' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>}
                    </button>
                    <div className="w-px bg-slate-200"></div>
                    <button
                        onClick={() => setActiveTab('riwayat')}
                        className={`flex-1 p-4 md:p-5 text-center font-bold text-sm md:text-base transition-colors relative ${activeTab === 'riwayat' ? 'text-slate-700 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Activity size={20} />
                            Pemberitahuan Izin
                            <span className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full ${activeTab === 'riwayat' ? 'bg-slate-200 text-slate-700' : 'bg-slate-200 text-slate-500'}`}>
                                {riwayatIzin.length}
                            </span>
                        </div>
                        {activeTab === 'riwayat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700"></div>}
                    </button>
                </div>

                <div className="p-0">
                    {activeTab === 'hari_ini' && (
                        izinHariIni.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {izinHariIni.map((izin, idx) => {
                                    const tglObj = new Date(izin.tanggal);
                                    const tglStr = tglObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                                    return (
                                        <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-800">{izin.nama_siswa}</p>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">
                                                    <span className="text-orange-600 font-bold uppercase text-[10px] tracking-widest mr-2">Alasan:</span>
                                                    {izin.pesan || '-'}
                                                </p>
                                            </div>
                                            {izin.surat_ijin && (
                                                <a
                                                    href={`http://localhost/SIKASA/backend/${izin.surat_ijin}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-sm font-bold border border-orange-200 transition-colors shrink-0"
                                                >
                                                    <AlertCircle size={16} /> Lihat Surat
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-500 font-medium">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <UserCheck size={32} />
                                </div>
                                <p>Belum ada pengajuan izin untuk hari ini dari kelas pendampingan Anda.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'riwayat' && (
                        riwayatIzin.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {riwayatIzin.map((izin, idx) => {
                                    const tglObj = new Date(izin.tanggal);
                                    const tglStr = tglObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                                    return (
                                        <div key={idx} className="p-4 px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-700">{izin.nama_siswa}</p>
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{tglStr}</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">
                                                    {izin.pesan || '-'}
                                                </p>
                                            </div>
                                            {izin.surat_ijin && (
                                                <a
                                                    href={`http://localhost/SIKASA/backend/${izin.surat_ijin}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors shrink-0"
                                                >
                                                    <AlertCircle size={14} /> Lihat Surat
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400 font-medium">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                    <Activity size={32} />
                                </div>
                                <p>Belum ada pemberitahuan pengajuan izin.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuruDashboard;
