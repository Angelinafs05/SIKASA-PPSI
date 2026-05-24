import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, MapPin, User, Calendar, Activity, AlertCircle, ChevronRight, CheckCircle2, ChevronLeft, LayoutDashboard, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const SiswaDashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState({
        total_ekskul: 0,
        pending_count: 0,
        my_ekskuls: [],
        today_schedule: [],
        today_name: '',
        periode: { tahun_ajaran: '', semester: '' }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Carousel State
    const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoPlayRef = useRef(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

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

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/siswa/dashboard');
            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError(response.data.message || 'Gagal mengambil data');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-500 animate-pulse">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* GREETING HEADER */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#000050] to-[#0000a0] rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-blue-900/30">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border border-white/10 ${data.is_alumni ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {data.is_alumni ? <GraduationCap size={12} /> : <Activity size={12} />} 
                            {data.is_alumni ? 'Status Alumni' : 'Siswa Aktif'}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                            Halo, {user?.nama || 'Siswa'}! 👋
                        </h1>
                        <p className="text-blue-100/80 font-medium max-w-md">
                            {data.is_alumni 
                                ? 'Selamat atas kelulusanmu! Rekapan kegiatan ekskulmu selama di sekolah tersimpan di sini.'
                                : 'Selamat datang di portal SIKASA. Semangat berkegiatan dan raih prestasimu di berbagai ekstrakurikuler!'
                            }
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-2">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Periode Aktif</p>
                                <p className="text-sm font-bold">{data.periode?.tahun_ajaran} — {data.periode?.semester}</p>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#000080]">
                                <Calendar size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 shadow-lg animate-shake">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            {/* ALUMNI / CLASS 9 ALERT */}
            {data.is_alumni ? (
                <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-blue-900/5 transition-all hover:shadow-2xl">
                    <div className="w-16 h-16 bg-blue-100 text-[#000080] rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <GraduationCap size={32} />
                    </div>
                    <div className="space-y-1 text-center md:text-left">
                        <h3 className="text-lg font-black text-[#000080] uppercase tracking-tight">Anda Telah Lulus (ALUMNI)</h3>
                        <p className="text-blue-800/70 font-bold text-sm leading-relaxed">
                            Akun Anda kini berstatus <span className="text-[#000080] font-black underline decoration-amber-400 decoration-2">ALUMNI SIKASA</span>. 
                            Anda tetap dapat login untuk melihat rekapan riwayat kegiatan ekstrakurikuler selama menempuh pendidikan di sekolah ini. 
                            Tombol pendaftaran ekskul baru telah dinonaktifkan.
                        </p>
                    </div>
                </div>
            ) : data.is_class_9_genap && (
                <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-amber-900/5 transition-all hover:shadow-2xl">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                        <GraduationCap size={32} />
                    </div>
                    <div className="space-y-1 text-center md:text-left">
                        <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight">Persiapan Kelulusan</h3>
                        <p className="text-amber-800/70 font-bold text-sm leading-relaxed">
                            Siswa kelas <span className="text-amber-600 font-black">IX (Sembilan)</span> tidak diperbolehkan mengikuti kegiatan ekstrakurikuler pada <span className="text-amber-600 font-black">Semester 2 (Genap)</span> agar dapat fokus pada persiapan kelulusan. 
                            Terima kasih atas partisipasimu selama ini!
                        </p>
                    </div>
                </div>
            )}

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all hover:shadow-2xl hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm border border-emerald-100">
                            <CheckCircle2 size={24} />
                        </div>
                        <ChevronRight className="text-slate-200 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ekskul Diikuti</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-5xl font-black text-slate-800 tracking-tight">{data.total_ekskul}</h2>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kegiatan</span>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all hover:shadow-2xl hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-sm border border-amber-100">
                            <Clock size={24} />
                        </div>
                        <ChevronRight className="text-slate-200 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Menunggu Persetujuan</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <h2 className="text-5xl font-black text-slate-800 tracking-tight">{data.pending_count}</h2>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pengajuan</span>
                    </div>
                </div>
            </div>

            {/* COMMAND CENTER LAYOUT - 2 COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN (2/3): MY CLUBS LIST */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-slate-800 text-xl font-black flex items-center gap-3 tracking-tight uppercase">
                            <div className="p-2.5 bg-blue-50 text-[#000080] rounded-2xl border border-blue-100/50 shadow-sm">
                                <Trophy size={22} />
                            </div>
                            Daftar Ekskul Saya
                        </h2>
                        
                        {!data.is_alumni && !data.is_class_9_genap && data.my_ekskuls && data.my_ekskuls.length > 0 && (
                            <button 
                                onClick={() => window.location.href = '/siswa/ekskul'}
                                className="bg-[#000080] hover:bg-blue-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                Pilih Ekstrakurikuler <ChevronRight size={14} />
                            </button>
                        )}
                    </div>

                    {data.my_ekskuls && data.my_ekskuls.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5">
                            {data.my_ekskuls.map((ekskul) => (
                                <div key={ekskul.reg_id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                                        <Activity size={180} />
                                    </div>

                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-[#000080] text-white rounded-2xl shadow-lg shadow-blue-900/20">
                                                    <Trophy size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight group-hover:text-[#000080] transition-colors">{ekskul.nama_ekskul}</h3>
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 mt-1">
                                                        <CheckCircle2 size={12} /> Status: Aktif Terverifikasi
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-6 pt-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-[#000080] transition-all">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jadwal</p>
                                                        <p className="text-sm font-bold text-slate-700">{ekskul.hari || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</p>
                                                        <p className="text-sm font-bold text-slate-700">{ekskul.jam || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                                                        <MapPin size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi</p>
                                                        <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">{ekskul.tempat ? `R. ${ekskul.tempat}` : '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-auto h-full flex flex-col justify-end items-end gap-4">
                                            <div className="flex items-center gap-3 text-right">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pembina</p>
                                                    <p className="text-xs font-bold text-slate-600">{ekskul.nama_pelatih || '-'}</p>
                                                </div>
                                                <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300">
                                                    <User size={20} />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => window.location.href = `/siswa/izin/${ekskul.ekskul_id}`}
                                                className="w-full md:w-auto bg-amber-50 hover:bg-amber-100 text-amber-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-amber-200 shadow-sm active:scale-95 transition-all"
                                            >
                                                Ajukan Izin
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100 shadow-inner">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#000080]/30 animate-pulse">
                                <Trophy size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-700 mb-2 uppercase tracking-tight">Belum Ada Ekskul</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-bold text-sm tracking-wide">
                                Kamu belum terdaftar di ekstrakurikuler manapun untuk periode ini. Ayo pilih favoritmu sekarang!
                            </p>
                            <button
                                className="bg-[#000080] hover:bg-blue-900 text-white font-black px-10 py-4 rounded-[1.5rem] shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center gap-3 mx-auto uppercase tracking-widest text-sm"
                                onClick={() => window.location.href = '/siswa/ekskul'}
                            >
                                Pilih Sekarang <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN (1/3): AGENDA CAROUSEL */}
                <div className="lg:col-span-1 flex flex-col h-full">
                    <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 flex flex-col h-full relative overflow-hidden animate-in slide-in-from-right-8 duration-700 group">
                        
                        {/* Interactive Controls Header */}
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h2 className="text-[#000080] text-xl font-black tracking-tight flex items-center gap-2 uppercase">
                                    Agenda Hari Ini
                                    {data.today_schedule?.length > 1 && (
                                        <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-200">
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
                                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#000080] hover:text-white transition-all shadow-sm active:scale-90"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button 
                                        onClick={handleNextAgenda}
                                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#000080] hover:text-white transition-all shadow-sm active:scale-90"
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
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#000080] flex items-center justify-center border border-blue-100 shadow-sm group-hover/time:bg-[#000080] group-hover/time:text-white transition-all duration-300">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-black text-slate-800 tracking-tight">{t.trim()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-tight group-hover:text-[#000080] transition-colors">
                                                {data.today_schedule[currentAgendaIndex].nama_ekskul}
                                            </h3>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4 text-slate-500">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                                                        <User size={18} className="text-[#000080]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pelatih</p>
                                                        <p className="text-sm font-bold text-slate-700">{data.today_schedule[currentAgendaIndex].nama_pelatih || 'Belum Ditentukan'}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-slate-500">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                                                        <MapPin size={18} className="text-[#000080]" />
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
                                                className={`h-1.5 transition-all duration-500 rounded-full ${currentAgendaIndex === i ? 'w-8 bg-[#000080]' : 'w-2 bg-slate-200 hover:bg-slate-300'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/40">
                                    <Calendar size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-slate-800 font-extrabold text-lg uppercase tracking-tight">Tidak Ada Agenda</h3>
                                <p className="text-slate-400 font-bold text-xs mt-2 px-4 italic">Hari ini kamu tidak memiliki kegiatan ekstrakurikuler.</p>
                            </div>
                        )}

                        {/* Decorative Background Icon */}
                        <div className="absolute bottom-[-5%] right-[-5%] opacity-[0.03] text-[#000080] group-hover:scale-110 transition-transform duration-1000">
                            <Activity size={240} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SiswaDashboard;
