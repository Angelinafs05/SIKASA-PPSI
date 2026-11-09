import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Trophy,
    Clock,
    Calendar,
    ChevronRight,
    ChevronDown,
    Activity,
    UserCheck,
    AlertCircle,
    UserRound,
    MapPin,
    ArrowRight,
    GraduationCap,
    CheckCircle2,
    Clock3
} from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const GuruDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [izinHariIni, setIzinHariIni] = useState([]);
    const [riwayatIzin, setRiwayatIzin] = useState([]);
    const [activeTab, setActiveTab] = useState('hari_ini');
    const [expandedEkskul, setExpandedEkskul] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
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
                const dataIzin = izinRes.data.data || [];

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
                <p className="font-bold text-slate-500 animate-pulse">Memuat dashboard pendampingan...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10 font-sans">
            {/* WELCOME SECTION */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#000080] to-[#000066] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-white/10 border-white/20 text-white">
                                <UserRound size={12} /> Guru Pendamping
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/10 text-white">
                                <Calendar size={12} /> {data?.periode?.tahun_ajaran} - Semester {data?.periode?.semester}
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            Halo, {user?.nama}! 👋
                        </h1>
                        <p className="text-blue-100 font-medium max-w-xl text-sm leading-relaxed">
                            Selamat bertugas. Anda mendampingi <span className="text-white font-extrabold">{data?.ekskuls?.length || 0} ekstrakurikuler</span> dengan total <span className="text-white font-extrabold">{data?.total_siswa || 0} siswa</span> aktif pada semester ini.
                        </p>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 border border-rose-100 font-bold text-sm">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3.5 bg-blue-50 text-[#000080] rounded-2xl group-hover:scale-110 transition-transform">
                            <Activity size={24} />
                        </div>
                        <span className="text-[10px] font-black text-[#000080] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Ekskul</span>
                    </div>
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Ekskul Didampingi</h3>
                        <p className="text-4xl font-black text-slate-800 mt-1">{data?.ekskuls?.length || 0}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Kegiatan ekskul yang Anda dampingi</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Anggota</span>
                    </div>
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Total Siswa Aktif</h3>
                        <p className="text-4xl font-black text-slate-800 mt-1">{data?.total_siswa || 0}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Siswa dari seluruh ekskul pendampingan</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <UserCheck size={24} />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Izin Hari Ini</span>
                    </div>
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Pemberitahuan Izin</h3>
                        <p className="text-4xl font-black text-slate-800 mt-1">{izinHariIni.length}</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Siswa izin tidak hadir hari ini</p>
                    </div>
                </div>
            </div>

            {/* KARTU EKSKUL DIDAMPINGI */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black text-[#000080] tracking-tight flex items-center gap-2">
                            <Trophy size={22} className="text-[#000080]" /> Ekstrakurikuler yang Didampingi
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                            Daftar ekskul resmi yang menjadi tugas pendampingan Anda di semester ini
                        </p>
                    </div>
                </div>

                {data?.ekskuls && data.ekskuls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.ekskuls.map((ekskul) => (
                            <div
                                key={ekskul.id}
                                className="bg-white rounded-[2rem] p-7 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all flex flex-col justify-between group"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="w-14 h-14 bg-blue-50 text-[#000080] rounded-2xl flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                                            <Trophy size={28} />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-100">
                                                {ekskul.jumlah_siswa || 0} Siswa Terdaftar
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                {ekskul.total_pertemuan || 0} Kali Pertemuan
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-2xl font-black text-slate-800 group-hover:text-[#000080] transition-colors tracking-tight">
                                            {ekskul.nama_ekskul}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-bold mt-1">
                                            Pelatih Utama: <span className="text-slate-800">{ekskul.nama_pelatih || '-'}</span>
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-[#000080]" />
                                            <span>Hari: <strong>{ekskul.hari || '-'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-[#000080]" />
                                            <span>Waktu: <strong>{ekskul.jam || '-'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2 col-span-2">
                                            <MapPin size={14} className="text-[#000080]" />
                                            <span>Tempat: <strong>{ekskul.tempat ? `R. ${ekskul.tempat}` : '-'}</strong></span>
                                        </div>
                                    </div>

                                    {/* DAFTAR SISWA YANG MENDAFTAR (ACCORDION) */}
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedEkskul(prev => ({ ...prev, [ekskul.id]: !prev[ekskul.id] }))}
                                            className="w-full flex items-center justify-between py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors text-xs font-bold"
                                        >
                                            <span className="flex items-center gap-2">
                                                <GraduationCap size={15} className="text-[#000080]" />
                                                Daftar Siswa Mendaftar ({ekskul.daftar_siswa?.length || 0})
                                            </span>
                                            {expandedEkskul[ekskul.id] ? <ChevronDown size={15} className="text-slate-500" /> : <ChevronRight size={15} className="text-slate-500" />}
                                        </button>

                                        {expandedEkskul[ekskul.id] && (
                                            <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                                {ekskul.daftar_siswa && ekskul.daftar_siswa.length > 0 ? (
                                                    ekskul.daftar_siswa.map((sw, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            className="flex items-center justify-between p-2 bg-slate-50/70 rounded-xl border border-slate-100 text-xs"
                                                        >
                                                            <div className="flex items-center gap-2 truncate">
                                                                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#000080] font-black text-[10px] flex items-center justify-center shrink-0">
                                                                    {sIdx + 1}
                                                                </span>
                                                                <div className="truncate">
                                                                    <p className="font-bold text-slate-800 truncate">{sw.nama_siswa}</p>
                                                                    <p className="text-[10px] text-slate-400 font-semibold">{sw.nama_kelas || 'Kelas -'} • NIS: {sw.no_induk || '-'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 ml-2">
                                                                {sw.status === 'approved' ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                        <CheckCircle2 size={10} /> Aktif
                                                                    </span>
                                                                ) : sw.status === 'pending' ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100">
                                                                        <Clock3 size={10} /> Menunggu
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                                                        {sw.status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center py-4 text-xs font-semibold text-slate-400">
                                                        Belum ada siswa yang mendaftar di ekskul ini.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-6 mt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => navigate(`/pendamping/absensi?ekskul_id=${ekskul.id}`)}
                                        className="py-3 px-4 bg-blue-50 hover:bg-blue-100 text-[#000080] rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-blue-100 transition-all active:scale-95"
                                    >
                                        Absensi Ekskul
                                    </button>
                                    <button
                                        onClick={() => navigate(`/pendamping/nilai?ekskul_id=${ekskul.id}`)}
                                        className="py-3 px-4 bg-[#000080] hover:bg-blue-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-900/10 transition-all active:scale-95"
                                    >
                                        Nilai Siswa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200">
                        <Trophy size={48} className="mx-auto mb-3 text-slate-300" />
                        <h4 className="text-lg font-black text-slate-700">Belum Ada Ekskul Pendampingan</h4>
                        <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 font-medium">
                            Anda belum ditugaskan untuk mendampingi ekstrakurikuler manapun pada periode ini. Hubungi Admin jika ada kekeliruan.
                        </p>
                    </div>
                )}
            </div>

            {/* MANAJEMEN IZIN */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    <button
                        onClick={() => setActiveTab('hari_ini')}
                        className={`flex-1 p-5 text-center font-bold text-sm transition-colors relative ${activeTab === 'hari_ini' ? 'text-orange-600 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <UserCheck size={18} />
                            Izin Hari Ini
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${activeTab === 'hari_ini' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                                {izinHariIni.length}
                            </span>
                        </div>
                        {activeTab === 'hari_ini' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('riwayat')}
                        className={`flex-1 p-5 text-center font-bold text-sm transition-colors relative ${activeTab === 'riwayat' ? 'text-slate-800 bg-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Activity size={18} />
                            Semua Riwayat Izin
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${activeTab === 'riwayat' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200 text-slate-500'}`}>
                                {riwayatIzin.length}
                            </span>
                        </div>
                        {activeTab === 'riwayat' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 rounded-t-full"></div>}
                    </button>
                </div>

                <div>
                    {activeTab === 'hari_ini' && (
                        izinHariIni.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {izinHariIni.map((izin, idx) => (
                                    <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="font-extrabold text-slate-800">{izin.nama_siswa}</p>
                                            <p className="text-xs font-medium text-slate-500">
                                                <span className="text-orange-600 font-bold uppercase tracking-wider mr-2">Alasan:</span>
                                                {izin.pesan || '-'}
                                            </p>
                                        </div>
                                        {izin.surat_ijin && (
                                            <a
                                                href={`http://localhost/SIKASA%20PPSI/backend/${izin.surat_ijin}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-xs font-bold border border-orange-200 transition-colors shrink-0"
                                            >
                                                <AlertCircle size={15} /> Lihat Surat Izin
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-16 text-center text-slate-400 font-medium">
                                <UserCheck size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                                <p className="text-sm font-bold">Tidak ada pengajuan izin untuk hari ini dari ekskul pendampingan Anda.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'riwayat' && (
                        riwayatIzin.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {riwayatIzin.map((izin, idx) => {
                                    const tglStr = new Date(izin.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                    return (
                                        <div key={idx} className="p-5 px-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800">{izin.nama_siswa}</p>
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{tglStr}</span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-500">{izin.pesan || '-'}</p>
                                            </div>
                                            {izin.surat_ijin && (
                                                <a
                                                    href={`http://localhost/SIKASA%20PPSI/backend/${izin.surat_ijin}`}
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
                            <div className="p-16 text-center text-slate-400 font-medium">
                                <Activity size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                                <p className="text-sm font-bold">Belum ada riwayat izin yang diajukan.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuruDashboard;
