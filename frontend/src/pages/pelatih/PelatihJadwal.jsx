import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Activity, Trophy, Users, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';
import api from '../../api/api';

const PelatihJadwal = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/pelatih/dashboard');
            if (res.data.success) {
                setDashboardData(res.data.data);
            } else {
                setError(res.data.message || 'Gagal memuat jadwal kegiatan');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi ke server');
        } finally {
            setLoading(false);
        }
    };

    const pelatih = dashboardData?.pelatih;
    const periode = dashboardData?.periode;
    const totalSiswa = dashboardData?.total_siswa || 0;

    // Parse multi-hari dan multi-jam jika ada
    const hariList = pelatih?.hari ? pelatih.hari.split(',').map(h => h.trim()).filter(Boolean) : [];
    const jamList = pelatih?.jam ? pelatih.jam.split(',').map(j => j.trim()).filter(Boolean) : [];

    return (
        <div className="space-y-8 font-sans pb-12">
            {/* HEADER */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-3 py-1 bg-blue-50 text-[#000080] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 flex items-center gap-1.5">
                                <Trophy size={12} /> {pelatih?.nama_ekskul || 'Ekstrakurikuler'}
                            </span>
                            <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100 flex items-center gap-1.5">
                                <Calendar size={12} /> {periode?.tahun_ajaran} - {periode?.semester}
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight flex items-center gap-3">
                            <Calendar className="text-[#000080]" size={32} />
                            Jadwal Ekstrakurikuler
                        </h1>
                        <p className="text-slate-500 font-medium max-w-xl">
                            Informasi waktu, hari pelaksanaan, dan ruangan resmi kegiatan ekstrakurikuler yang Anda bina.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-[#000080] to-[#000066] text-white p-6 rounded-2xl shadow-lg shadow-blue-900/10 flex items-center gap-5 shrink-0">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Users size={24} className="text-blue-200" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Siswa Aktif</p>
                            <p className="text-2xl font-black">{totalSiswa} Siswa</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                        <p className="font-bold text-slate-500">Memuat jadwal...</p>
                    </div>
                </div>
            ) : !pelatih?.nama_ekskul ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                    <Calendar size={56} className="mx-auto mb-3 text-slate-300" />
                    <h3 className="text-lg font-black text-slate-700 mb-1">Belum Ada Ekstrakurikuler Ditugaskan</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        Akun Anda saat ini belum dihubungkan ke ekstrakurikuler manapun oleh administrator.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* KARTU UTAMA JADWAL */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <Sparkles className="text-amber-500" size={22} />
                                Pelaksanaan Kegiatan: {pelatih.nama_ekskul}
                            </h2>
                            <p className="text-xs text-slate-400 font-bold mt-1">
                                Jadwal resmi mingguan semester {periode?.semester} TA {periode?.tahun_ajaran}
                            </p>
                        </div>

                        {/* GRID DETAIL WAKTU & HARI */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* HARI */}
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/60 space-y-3">
                                <div className="flex items-center gap-3 text-[#000080]">
                                    <div className="p-2.5 bg-blue-100 rounded-xl">
                                        <Calendar size={20} />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-wider">Hari Pelaksanaan</h4>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {hariList.length > 0 ? (
                                        hariList.map(h => (
                                            <span key={h} className="px-4 py-2 bg-[#000080] text-white font-extrabold text-xs rounded-xl shadow-sm">
                                                {h}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm font-bold text-slate-500">Belum ditentukan</span>
                                    )}
                                </div>
                            </div>

                            {/* WAKTU / JAM */}
                            <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100/60 space-y-3">
                                <div className="flex items-center gap-3 text-emerald-800">
                                    <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
                                        <Clock size={20} />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-wider">Waktu / Jam Latihan</h4>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {jamList.length > 0 ? (
                                        jamList.map((j, idx) => (
                                            <span key={idx} className="px-4 py-2 bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm">
                                                {j} WIB
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm font-bold text-slate-500">Sesuai pengumuman</span>
                                    )}
                                </div>
                            </div>

                            {/* LOKASI / TEMPAT */}
                            <div className="bg-purple-50/40 p-6 rounded-2xl border border-purple-100/60 space-y-3">
                                <div className="flex items-center gap-3 text-purple-900">
                                    <div className="p-2.5 bg-purple-100 rounded-xl text-purple-700">
                                        <MapPin size={20} />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-wider">Ruangan / Tempat</h4>
                                </div>
                                <p className="text-lg font-black text-slate-800 pt-1">
                                    {pelatih.tempat ? `Ruangan ${pelatih.tempat}` : 'Area Sekolah'}
                                </p>
                            </div>

                            {/* KETENTUAN PESERTA / TARGET KELAS */}
                            <div className="bg-amber-50/40 p-6 rounded-2xl border border-amber-100/60 space-y-3">
                                <div className="flex items-center gap-3 text-amber-900">
                                    <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
                                        <Users size={20} />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-wider">Target Kelas</h4>
                                </div>
                                <p className="text-lg font-black text-slate-800 pt-1">
                                    {(() => {
                                        try {
                                            const targets = typeof pelatih.target_kelas === 'string' ? JSON.parse(pelatih.target_kelas) : pelatih.target_kelas;
                                            if (Array.isArray(targets) && targets.length > 0) {
                                                return `Kelas ${targets.join(', ')}`;
                                            }
                                            return 'Semua Tingkat Kelas';
                                        } catch (e) {
                                            return pelatih.target_kelas || 'Semua Tingkat Kelas';
                                        }
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SIDE PANEL: INFORMASI PEMBINA */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6 flex flex-col justify-between">
                        <div className="space-y-6">
                            <h3 className="text-lg font-black text-slate-800 border-l-4 border-[#000080] pl-3">
                                Data Pembina Ekskul
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Pelatih</p>
                                    <p className="text-base font-extrabold text-slate-800 mt-0.5">{pelatih.nama_pelatih}</p>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe Pelatih</p>
                                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                                        {pelatih.pendamping ? 'Pelatih External' : 'Pelatih Internal (Guru)'}
                                    </p>
                                </div>

                                {pelatih.pendamping && (
                                    <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
                                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Guru Pendamping</p>
                                        <p className="text-base font-extrabold text-amber-900 mt-0.5">{pelatih.pendamping}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-3 text-xs text-blue-900 font-medium">
                            <CheckCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                            <p>
                                Jangan lupa untuk selalu mengisi absensi pada menu <strong>Input Absensi</strong> setiap kali kegiatan ekskul selesai dilaksanakan.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PelatihJadwal;

