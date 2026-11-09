import React, { useState, useEffect, useRef } from 'react';
import { Users, LayoutDashboard, CheckCircle, Activity, Check, X, Calendar, Settings as SettingsIcon, Save, Eye, Clock, MapPin, User, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import api from '../../api/api';

const AdminDashboard = () => {
    const [data, setData] = useState({
        total_siswa: 0,
        total_ekskul: 0,
        total_aktif: 0,
        total_pelatih: 0,
        total_kelas: 0,
        pendaftaran_pending: [],
        today_schedule: [],
        periode: { tahun_ajaran: '', semester: '' },
        today_name: ''
    });
    const [periodData, setPeriodData] = useState({
        tahun_ajaran: '2024/2025',
        semester: 'Ganjil'
    });
    const [updatingPeriod, setUpdatingPeriod] = useState(false);
    const [periodMessage, setPeriodMessage] = useState({ type: '', text: '' });
    const [isPeriodConfirmed, setIsPeriodConfirmed] = useState(localStorage.getItem('adminPeriodConfirmed') === 'true');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isGlobalSetting, setIsGlobalSetting] = useState(false);

    // Carousel State
    const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoPlayRef = useRef(null);

    useEffect(() => {
        const checkInitialPeriod = async () => {
            try {
                const response = await api.get('/api/admin/settings');
                if (response.data.success) {
                    setPeriodData(response.data.data);
                    if (isPeriodConfirmed) {
                        fetchDashboardData();
                    }
                }
            } catch (err) {
                console.error("Gagal mengambil periode awal");
            } finally {
                setLoading(false);
            }
        };
        checkInitialPeriod();
    }, [isPeriodConfirmed]);

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
            setError('');
            const response = await api.get('/api/admin/dashboard');
            if (response.data.success) {
                setData(response.data.data);
                if (response.data.data.periode) {
                    setPeriodData(response.data.data.periode);
                }
            } else {
                setError(response.data.message || 'Gagal mengambil data dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
        }
    };

    const handleApprove = async (id) => {
        try {
            const response = await api.post(`/api/admin/pendaftaran/${id}/approve`);
            if (response.data.success) {
                fetchDashboardData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyetujui');
        }
    };

    const handleReject = async (id) => {
        try {
            if (window.confirm('Yakin ingin menolak pendaftaran ini?')) {
                const response = await api.post(`/api/admin/pendaftaran/${id}/reject`);
                if (response.data.success) {
                    fetchDashboardData();
                }
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menolak');
        }
    };

    const handleConfirmPeriod = async () => {
        try {
            setUpdatingPeriod(true);
            setPeriodMessage({ type: '', text: '' });
            
            // Set for local view
            localStorage.setItem('adminViewYear', periodData.tahun_ajaran);
            localStorage.setItem('adminViewSemester', periodData.semester);

            if (isGlobalSetting) {
                // Set explicitly for global
                const response = await api.post('/api/admin/settings', periodData);
                if (!response.data.success) {
                    throw new Error(response.data.message || 'Gagal memperbarui periode secara global di server.');
                }
            }

            // Successfully set for local view (and maybe global)
            await fetchDashboardData();
            localStorage.setItem('adminPeriodConfirmed', 'true');
            setIsPeriodConfirmed(true);
        } catch (err) {
            console.error("DEBUG PERIOD UPDATE ERROR:", err);
            setPeriodMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Gagal memperbarui periode' });
        } finally {
            setUpdatingPeriod(false);
        }
    };

    const handleChangePeriod = () => {
        localStorage.removeItem('adminPeriodConfirmed');
        setIsPeriodConfirmed(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memverifikasi sesi...</p>
            </div>
        </div>
    );

    if (!isPeriodConfirmed) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 w-full max-w-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Calendar size={120} className="text-[#000080]" />
                    </div>

                    <div className="relative z-10 text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-[#000080]">
                            <Calendar size={32} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-black text-[#000080] tracking-tight">Pilih Periode Akademik</h1>
                            <p className="text-slate-500 font-medium mt-1">Silakan pilih tahun ajaran dan semester aktif sebelum melihat dashboard.</p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tahun Ajaran</label>
                                <select
                                    value={periodData.tahun_ajaran}
                                    onChange={(e) => setPeriodData({ ...periodData, tahun_ajaran: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-[#000080] outline-none transition-all"
                                >
                                    {(() => {
                                        // Ambil tahun awal dari pilihan yang sedang aktif (misal "2025/2026" -> 2025)
                                        const selectedYearStart = parseInt(periodData.tahun_ajaran.split('/')[0]) || 2024;
                                        
                                        // Logika sliding window: [Tahun Lalu, Tahun Sekarang, Tahun Depan]
                                        // Namun tetap dibatasi paling minimal adalah 2024
                                        const startYear = Math.max(2024, selectedYearStart - 1);
                                        const years = [];
                                        
                                        // Kita tampilkan 3 tahun (Lalu, Sekarang, Depan)
                                        for (let i = startYear; i <= startYear + 2; i++) {
                                            years.push(`${i}/${i + 1}`);
                                        }
                                        
                                        return years.map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ));
                                    })()}
                                </select>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                                <select
                                    value={periodData.semester}
                                    onChange={(e) => setPeriodData({ ...periodData, semester: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-[#000080] outline-none transition-all"
                                >
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </select>
                            </div>

                            {periodMessage.text && (
                                <div className={`text-sm font-bold p-3 rounded-xl ${periodMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {periodMessage.text}
                                </div>
                            )}

                            <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors mt-2">
                                <div className="pt-0.5">
                                    <input 
                                        type="checkbox" 
                                        checked={isGlobalSetting}
                                        onChange={(e) => setIsGlobalSetting(e.target.checked)}
                                        className="w-4 h-4 text-[#000080] border-slate-300 rounded focus:ring-[#000080]"
                                    />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-700 block leading-tight">Jadikan sebagai Periode Sistem Aktif</span>
                                    <span className="text-[10px] font-medium text-slate-500 leading-tight">Centang ini jika Anda ingin mengubah periode utama untuk seluruh Siswa & Pelatih. Jika tidak dicentang, ini hanya mem-filter tampilan admin Anda saat ini.</span>
                                </div>
                            </label>

                            <button
                                onClick={handleConfirmPeriod}
                                disabled={updatingPeriod}
                                className="w-full bg-[#000080] hover:bg-blue-900 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                            >
                                {updatingPeriod ? 'Menyiapkan...' : (
                                    <>
                                        Tampilkan Dashboard
                                        <X size={18} className="rotate-45 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Dashboard Admin</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Sistem Manajemen SIKASA •{" "}
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

                {/* PERIOD INDICATOR & CHANGE */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <Calendar size={18} className="text-[#000080]" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Periode Aktif</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#000080] rounded-xl font-bold text-sm">
                        {periodData.tahun_ajaran} — {periodData.semester}
                    </div>

                    <button
                        onClick={handleChangePeriod}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#000080] transition-colors"
                        title="Ganti Periode"
                    >
                        <SettingsIcon size={18} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 text-sm font-bold">
                    <Activity size={18} />
                    {error}
                </div>
            )}

            {/* DASHBOARD CARDS - 4 CARDS AS REQUESTED */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {/* Total Siswa */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 text-[#000080]">
                        <Users size={80} />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Siswa</p>
                            <p className="text-4xl font-black text-slate-800 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">{data.total_siswa}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl shadow-lg bg-[#000080] shadow-blue-900/10 transform group-hover:rotate-6 transition-all duration-300">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Total Guru (Pelatih) */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 text-purple-600">
                        <User size={80} />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Pelatih</p>
                            <p className="text-4xl font-black text-slate-800 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">{data.total_pelatih}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl shadow-lg bg-purple-600 shadow-purple-900/10 transform group-hover:rotate-6 transition-all duration-300">
                            <User className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Total Kelas */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 text-emerald-600">
                        <GraduationCap size={80} />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Kelas</p>
                            <p className="text-4xl font-black text-slate-800 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">{data.total_kelas}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl shadow-lg bg-emerald-600 shadow-emerald-900/10 transform group-hover:rotate-6 transition-all duration-300">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Mata Pelajaran (Ekskul) */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 text-amber-500">
                        <LayoutDashboard size={80} />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ekstrakurikuler</p>
                            <p className="text-4xl font-black text-slate-800 mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">{data.total_ekskul}</p>
                        </div>
                        <div className="p-3.5 rounded-2xl shadow-lg bg-amber-500 shadow-amber-900/10 transform group-hover:rotate-6 transition-all duration-300">
                            <LayoutDashboard className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* COMMAND CENTER LAYOUT - 2 COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN (2/3): REGISTRATION TABLE */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden flex flex-col h-full animate-in fade-in duration-700">
                        <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[#000080] text-xl font-black flex items-center gap-3 tracking-tight">
                                    <div className="p-2.5 bg-blue-50 text-[#000080] rounded-2xl border border-blue-100/50 shadow-sm">
                                        <Users size={22} />
                                    </div>
                                    Pendaftaran Menunggu Persetujuan
                                </h2>
                                <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    {data.pendaftaran_pending?.length || 0} Menunggu
                                </span>
                            </div>
                        </div>

                        <div className="p-2 flex-1">
                            {data.pendaftaran_pending && data.pendaftaran_pending.length > 0 ? (
                                <div className="overflow-x-auto rounded-[2rem] border border-slate-50">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[#000080]/5 text-[#000080] font-black border-b border-slate-100 uppercase tracking-[0.1em] text-[10px]">
                                            <tr>
                                                <th className="py-5 px-8">Data Siswa</th>
                                                <th className="py-5 px-8">Ekstrakurikuler</th>
                                                <th className="py-5 px-8 text-center" width="150">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {data.pendaftaran_pending.slice(0, 8).map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                                                    <td className="py-5 px-8">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-slate-800 text-base uppercase tracking-tight group-hover:text-[#000080] transition-colors leading-none">{item.nama_siswa}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 tracking-wider mt-1.5 uppercase">{new Date(item.tanggal_daftar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <span className="bg-blue-50 text-[#000080] border border-blue-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm inline-block">
                                                            {item.nama_ekskul}
                                                        </span>
                                                    </td>
                                                    <td className="py-5 px-8">
                                                        <div className="flex justify-center gap-2">
                                                            {item.surat_ijin && (
                                                                <a
                                                                    href={`http://localhost/SIKASA%20PPSI/backend/${item.surat_ijin}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 bg-blue-50 text-[#000080] hover:bg-[#000080] hover:text-white rounded-xl transition-all shadow-sm"
                                                                    title="Lihat Berkas"
                                                                >
                                                                    <Eye size={16} />
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => handleApprove(item.id)}
                                                                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"
                                                                title="Terima"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(item.id)}
                                                                className="p-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                                                                title="Tolak"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {data.pendaftaran_pending.length > 8 && (
                                        <div className="p-4 text-center border-t border-slate-50">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">+ {data.pendaftaran_pending.length - 8} pendaftaran lainnya</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-20 text-center bg-slate-50/30 rounded-[2rem] m-4">
                                    <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-900/5 rotate-3">
                                        <CheckCircle size={32} className="text-emerald-500" strokeWidth={3} />
                                    </div>
                                    <h3 className="text-slate-800 font-black text-xl uppercase tracking-tight">Sudah Bersih!</h3>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Semua pendaftaran telah diproses.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (1/3): AGENDA CAROUSEL */}
                <div className="lg:col-span-1 flex flex-col h-full">
                    <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 flex flex-col h-full relative overflow-hidden animate-in slide-in-from-right-8 duration-700 group">
                        
                        {/* Interactive Controls Header */}
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h2 className="text-[#000080] text-xl font-black tracking-tight flex items-center gap-2">
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
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-slate-200/40">
                                    <Calendar size={40} className="text-slate-300" />
                                </div>
                                <h3 className="text-slate-800 font-extrabold text-lg uppercase tracking-tight">Tidak Ada Jadwal</h3>
                                <p className="text-slate-400 font-medium text-xs mt-2 px-4 italic">Hari ini tidak ada kegiatan ekstrakurikuler yang berlangsung.</p>
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

export default AdminDashboard;
