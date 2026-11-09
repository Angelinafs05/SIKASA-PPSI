import React, { useState, useEffect } from 'react';
import {
    Users,
    Trophy,
    Clock,
    Calendar,
    ChevronRight,
    TrendingUp,
    Award,
    Activity,
    UserCheck,
    AlertCircle,
    MapPin
} from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const PelatihDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
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
                api.get('/api/pelatih/dashboard'),
                api.get('/api/pelatih/izin')
            ]);

            if (dashRes.data.success) {
                setData(dashRes.data.data);
            } else {
                setError(dashRes.data.message || 'Gagal mengambil data dashboard');
            }

            if (izinRes.data.success) {
                const today = new Date();
                const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
                const dataIzin = izinRes.data.data;

                setIzinHariIni(dataIzin.filter(i => i.tanggal === todayStr));
                setRiwayatIzin(dataIzin.filter(i => i.tanggal !== todayStr));
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

    const coachType = data?.pelatih?.pendamping ? 'External' : 'Internal';
    const coachTypeColor = data?.pelatih?.pendamping ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100';

    return (
        <div className="space-y-8 pb-10">
            {/* WELCOME SECTION */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#000080] to-[#000066] rounded-3xl p-8 text-white shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${coachTypeColor} bg-white/10 border-white/20 text-white`}>
                                <Activity size={12} /> Pelatih {coachType}
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/10 text-white">
                                <Calendar size={12} /> {data?.periode?.tahun_ajaran} - {data?.periode?.semester}
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            Selamat Datang, {user?.nama}! 👋
                        </h1>
                        <p className="text-blue-100 font-medium max-w-md">
                            Anda bertanggung jawab atas ekstrakurikuler <span className="text-white font-bold underline underline-offset-4 decoration-blue-400">{data?.pelatih?.nama_ekskul || 'Belum Ditentukan'}</span>.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Trophy size={32} className="text-blue-200" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Target Ekskul</p>
                            <p className="text-xl font-black">{data?.pelatih?.nama_ekskul || '-'}</p>
                        </div>
                    </div>
                </div>
                {/* Decorative background circles */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Approved Students */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                            <UserCheck size={24} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded">AKTIF</span>
                    </div>
                    <div>
                        <h3 className="text-slate-500 font-bold text-base uppercase tracking-wider">Siswa Terdaftar</h3>
                        <p className="text-5xl font-black text-slate-800 mt-1 tracking-tight">{data?.total_siswa || 0}</p>
                        <p className="text-sm text-slate-400 font-medium mt-1">Siswa telah disetujui admin</p>
                    </div>
                </div>

                {/* Pending Students */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                        </div>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded">PENDING</span>
                    </div>
                    <div>
                        <h3 className="text-slate-500 font-bold text-base uppercase tracking-wider">Menunggu Approval</h3>
                        <p className="text-5xl font-black text-slate-800 mt-1 tracking-tight">{data?.total_pending || 0}</p>
                        <p className="text-sm text-slate-400 font-medium mt-1">Siswa dalam antrean verifikasi</p>
                    </div>
                </div>

                {/* Activity Status */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Award size={24} />
                        </div>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">STATUS</span>
                    </div>
                    <div>
                        <h3 className="text-slate-500 font-bold text-base uppercase tracking-wider">Status Pelatih</h3>
                        <p className="text-3xl font-black text-slate-800 mt-1 tracking-tight">{coachType}</p>
                        <p className="text-sm text-slate-400 font-medium mt-1">
                            {user?.is_external ? 'Ditemani Guru Pendamping' : 'Guru Internal Sekolah'}
                        </p>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS / INFO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Extracurricular Detail */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-black text-[#000080] flex items-center gap-2">
                            <Activity size={20} className="text-blue-500" /> Detail Ekskul
                        </h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Ekskul</p>
                                <p className="font-bold text-slate-800">{data?.pelatih?.nama_ekskul || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Pelatih</p>
                                <p className="font-bold text-slate-800">{coachType}</p>
                            </div>
                            {user?.is_external && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guru Pendamping</p>
                                    <p className="font-bold text-amber-600">{data?.pelatih?.pendamping || '-'}</p>
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jadwal Hari</p>
                                <p className="font-bold text-[#000080] flex items-center gap-1.5">
                                    <Calendar size={14} className="text-blue-500" />
                                    {data?.pelatih?.hari || 'Belum ditentukan'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu / Jam</p>
                                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <Clock size={14} className="text-slate-400" />
                                    {data?.pelatih?.jam || '-'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi / Ruangan</p>
                                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <MapPin size={14} className="text-slate-400" />
                                    {data?.pelatih?.tempat ? `R. ${data?.pelatih?.tempat}` : '-'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontak Admin</p>
                                <p className="font-bold text-slate-800">Hubungi Sekolah</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Information Alert */}
                <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100 flex flex-col justify-center gap-4">
                    <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="text-xl font-black text-blue-900">Informasi Penting</h3>
                    <p className="text-blue-800/70 font-medium leading-relaxed">
                        Pastikan untuk melakukan absensi secara rutin bagi pelatih internal. Untuk pelatih eksternal, absensi akan dikelola oleh guru pendamping yang ditugaskan.
                    </p>
                    <div className="pt-2">
                        <button className="text-blue-600 font-black text-sm flex items-center gap-1 hover:gap-2 transition-all">
                            Lihat Panduan Aplikasi <ChevronRight size={16} />
                        </button>
                    </div>
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
                                {izinHariIni.map((izin, idx) => (
                                    <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-slate-800">{izin.nama_siswa}</p>
                                            <p className="text-sm font-medium text-slate-500 mt-1">
                                                <span className="text-orange-600 font-bold uppercase text-[10px] tracking-widest mr-2">Alasan:</span>
                                                {izin.pesan || '-'}
                                            </p>
                                        </div>
                                        {izin.surat_ijin && (
                                            <a
                                                href={`http://localhost/SIKASA%20PPSI/backend/${izin.surat_ijin}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-sm font-bold border border-orange-200 transition-colors shrink-0"
                                            >
                                                <AlertCircle size={16} /> Lihat Surat
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-500 font-medium">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <UserCheck size={32} />
                                </div>
                                <p>Tidak ada pengajuan izin untuk hari ini.</p>
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

export default PelatihDashboard;
