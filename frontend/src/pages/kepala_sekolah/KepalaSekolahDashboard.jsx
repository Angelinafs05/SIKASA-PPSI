import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, CheckCircle, Activity, Calendar, MapPin, User, GraduationCap, ChevronLeft, ChevronRight, Clock, FileBarChart } from 'lucide-react';
import api from '../../api/api';

const KepalaSekolahDashboard = () => {
    const [data, setData] = useState({
        total_siswa: 0,
        total_ekskul: 0,
        total_aktif: 0,
        total_pelatih: 0,
        total_kelas: 0,
        today_schedule: [],
        periode: { tahun_ajaran: '', semester: '' },
        today_name: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoPlayRef = useRef(null);
    const navigate = useNavigate();

    // Carousel Logic
    useEffect(() => {
        if (isAutoPlaying && data.today_schedule && data.today_schedule.length > 1) {
            autoPlayRef.current = setInterval(() => {
                setCurrentAgendaIndex((prev) => (prev + 1) % data.today_schedule.length);
            }, 5000);
        }
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [isAutoPlaying, data.today_schedule, currentAgendaIndex]);

    const handleNextAgenda = () => {
        if (data.today_schedule.length > 0) {
            setCurrentAgendaIndex((prev) => (prev + 1) % data.today_schedule.length);
            resetAutoPlay();
        }
    };

    const handlePrevAgenda = () => {
        if (data.today_schedule.length > 0) {
            setCurrentAgendaIndex((prev) => (prev - 1 + data.today_schedule.length) % data.today_schedule.length);
            resetAutoPlay();
        }
    };

    const resetAutoPlay = () => {
        setIsAutoPlaying(false);
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        // Resume auto play after 10 seconds of manual interaction
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/dashboard');
            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError(response.data.message || 'Gagal mengambil data dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500">Memuat Laporan Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-emerald-800 tracking-tight">Dashboard Kepala Sekolah</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Monitoring Kegiatan Siswa SIKASA •{" "}
                        <span className="font-semibold text-slate-700">
                            {new Date().toLocaleDateString("id-ID", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm border border-emerald-100">
                    <Calendar size={18} />
                    {data.periode?.tahun_ajaran} — {data.periode?.semester}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-bold">
                    <Activity size={18} />
                    {error}
                </div>
            )}

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Siswa */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Siswa</p>
                            <p className="text-4xl font-black text-slate-800 mt-2">{data.total_siswa}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Ekskul */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ekstrakurikuler</p>
                            <p className="text-4xl font-black text-slate-800 mt-2">{data.total_ekskul}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
                            <LayoutDashboard size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Pelatih */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Pelatih</p>
                            <p className="text-4xl font-black text-slate-800 mt-2">{data.total_pelatih}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600">
                            <User size={24} />
                        </div>
                    </div>
                </div>

                {/* Siswa Aktif */}
                <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Siswa Aktif</p>
                            <p className="text-4xl font-black text-slate-800 mt-2">{data.total_aktif}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* AGENDA HARI INI */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2.5rem] p-8 h-full relative overflow-hidden group">
                        
                        {/* Interactive Controls Header */}
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h2 className="text-slate-800 text-xl font-black tracking-tight flex items-center gap-2">
                                    Agenda Hari Ini
                                    {data.today_schedule?.length > 1 && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-200">
                                            {currentAgendaIndex + 1}/{data.today_schedule.length}
                                        </span>
                                    )}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{data.today_name || 'Jadwal Libur'}</p>
                            </div>

                            {data.today_schedule?.length > 1 && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handlePrevAgenda}
                                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button 
                                        onClick={handleNextAgenda}
                                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {data.today_schedule && data.today_schedule.length > 0 ? (
                            <div className="flex-1 flex flex-col justify-center gap-6 relative z-10 transition-all duration-500">
                                {/* The Sliding Item */}
                                <div key={currentAgendaIndex} className="animate-in slide-in-from-right-4 fade-in duration-500 space-y-10">
                                    
                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-4">
                                            {data.today_schedule[currentAgendaIndex].jam.split(',').map((t, i) => (
                                                <div key={i} className="flex items-center gap-4 group/time">
                                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm group-hover/time:bg-emerald-600 group-hover/time:text-white transition-all duration-300">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div>
                                                        
                                                        <p className="text-xl font-black text-slate-800 tracking-tight">{t.trim()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-tight group-hover:text-emerald-700 transition-colors">
                                                {data.today_schedule[currentAgendaIndex].nama_ekskul}
                                            </h3>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4 text-slate-500">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                                                        <User size={18} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pelatih</p>
                                                        <p className="text-sm font-bold text-slate-700">{data.today_schedule[currentAgendaIndex].nama_pelatih || 'Belum Ditentukan'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-slate-500">
                                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                                                        <MapPin size={18} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lokasi</p>
                                                        <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">{data.today_schedule[currentAgendaIndex].tempat || 'Lapangan Sekolah'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Dots */}
                                {data.today_schedule.length > 1 && (
                                    <div className="flex justify-center gap-2 mt-8">
                                        {data.today_schedule.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setCurrentAgendaIndex(i); resetAutoPlay(); }}
                                                className={`h-1.5 transition-all duration-500 rounded-full ${currentAgendaIndex === i ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-200 hover:bg-slate-300'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/40">
                                    <Calendar size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-slate-800 font-extrabold text-lg uppercase tracking-tight">Tidak Ada Jadwal</h3>
                                <p className="text-slate-400 font-medium text-xs mt-2 px-4 italic">Hari ini tidak ada kegiatan ekstrakurikuler yang berlangsung.</p>
                            </div>
                        )}

                        {/* Decorative Background Icon */}
                        <div className="absolute bottom-[-5%] right-[-5%] opacity-[0.03] text-emerald-600 group-hover:scale-110 transition-transform duration-1000">
                            <Activity size={240} />
                        </div>
                    </div>
                </div>

                {/* AKSES LAPORAN QUICK LINKS */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-[2.5rem] p-8 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-slate-800 text-xl font-black tracking-tight flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
                                    <FileBarChart size={22} />
                                </div>
                                Ringkasan Laporan
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div 
                                onClick={() => navigate('/kepala_sekolah/monitoring')}
                                className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-xl transition-all group cursor-pointer"
                            >
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-2">Laporan Monitoring</h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">Pantau tingkat kehadiran dan nilai siswa di setiap kegiatan ekstrakurikuler.</p>
                                <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Lihat Detail Laporan <ChevronRight size={14} />
                                </div>
                            </div>

                            <div 
                                onClick={() => navigate('/kepala_sekolah/monitoring-siswa')}
                                className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-xl transition-all group cursor-pointer"
                            >
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-2">Data Siswa</h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">Informasi lengkap profil dan riwayat kelas seluruh siswa aktif.</p>
                                <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Lihat Data Siswa <ChevronRight size={14} />
                                </div>
                            </div>

                            <div 
                                onClick={() => navigate('/kepala_sekolah/laporan-absensi')}
                                className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-xl transition-all group cursor-pointer"
                            >
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-2">Laporan Absensi</h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">Rekapitulasi resmi kehadiran siswa per ekstrakurikuler dan kelas.</p>
                                <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Lihat Laporan Absensi <ChevronRight size={14} />
                                </div>
                            </div>

                            <div 
                                onClick={() => navigate('/kepala_sekolah/laporan-nilai')}
                                className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-xl transition-all group cursor-pointer"
                            >
                                <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-2">Laporan Nilai</h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">Dokumen rekap nilai akhir rapor ekstrakurikuler siswa.</p>
                                <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Lihat Laporan Nilai <ChevronRight size={14} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default KepalaSekolahDashboard;
