import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy,
    Clock,
    MapPin,
    User,
    Users,
    Activity,
    AlertCircle,
    ChevronRight,
    CheckCircle2,
    Info,
    Search,
    GraduationCap,
    Calendar as CalendarIcon
} from 'lucide-react';
import api from '../../api/api';

const SiswaEkskul = () => {
    const navigate = useNavigate();
    const [ekskuls, setEkskuls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchEkskuls();
    }, []);

    const fetchEkskuls = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/siswa/ekskul');
            if (response.data.success) {
                setEkskuls(response.data.data);
            } else {
                setError(response.data.message || 'Gagal mengambil daftar ekskul');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    const handleDaftar = async (id) => {
        try {
            setProcessingId(id);
            setError('');
            setSuccessMessage('');

            const response = await api.post('/api/siswa/daftar', { ekskul_id: id });
            if (response.data.success) {
                setSuccessMessage('Pendaftaran berhasil! Silakan tunggu persetujuan pelatih.');
                await fetchEkskuls(); // Refresh list to show 'pending' status
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mendaftar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setProcessingId(null);
        }
    };

    const filteredEkskuls = ekskuls.filter(e =>
        e.nama_ekskul.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                        <CheckCircle2 size={12} /> Terdaftar
                    </div>
                );
            case 'pending':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                        <Clock size={12} /> Menunggu
                    </div>
                );
            case 'rejected':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm">
                        <AlertCircle size={12} /> Ditolak
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-500 animate-pulse">Memuat daftar pilihan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* SEARCH & HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black text-[#000080] tracking-tight">Pilih Ekstrakurikuler</h1>
                    <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Explore your passion & potential</p>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#000080] transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Cari ekskul idamanmu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-3 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#000080] transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* MESSAGE BANNERS */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 shadow-sm animate-shake">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}
            {successMessage && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100 shadow-sm">
                    <CheckCircle2 size={20} />
                    <p className="text-sm font-bold">{successMessage}</p>
                </div>
            )}

            {/* INFO BANNER */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl text-[#000080] shadow-sm">
                    <Info size={24} />
                </div>
                <div>
                    <h4 className="font-black text-[#000080] mb-1 uppercase text-sm tracking-wider">Pemberitahuan Penting</h4>
                    <p className="text-sm text-blue-800/70 font-medium leading-relaxed">
                        Setiap siswa diperbolehkan mengikuti maksimal <strong>4 kegiatan ekstrakurikuler</strong> dalam satu periode. Pastikan jadwal tidak saling bertabrakan ya!
                    </p>
                </div>
            </div>

            {/* EKSKUL LIST - UNIFIED CARD STYLE */}
            {filteredEkskuls.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {filteredEkskuls.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                            {/* Decorative Activity Icon Background */}
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                                <Activity size={180} />
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-5 flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-[#000080] text-white rounded-[1.5rem] shadow-xl shadow-blue-900/30 transform group-hover:rotate-6 transition-transform">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight group-hover:text-[#000080] transition-colors">{item.nama_ekskul}</h3>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                {item.is_seleksi === 1 && (
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                                        Wajib Seleksi
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tersedia untuk Pendaftaran</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-8 pt-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#000080] group-hover:scale-110 transition-transform">
                                                <CalendarIcon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Jadwal</p>
                                                <p className="font-extrabold text-[#000080] text-sm">
                                                    {item.hari || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Waktu</p>
                                                <p className="font-extrabold text-slate-700 text-sm">
                                                    {item.jam || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Lokasi</p>
                                                <p className="font-extrabold text-slate-700 text-sm uppercase">{item.tempat ? `R. ${item.tempat}` : '-'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                                <GraduationCap size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Untuk Kelas</p>
                                                <p className="font-extrabold text-slate-700 text-sm uppercase">
                                                    {(() => {
                                                        try {
                                                            const targets = typeof item.target_kelas === 'string' ? JSON.parse(item.target_kelas) : item.target_kelas;
                                                            if (Array.isArray(targets) && targets.length > 0) {
                                                                return targets.join(', ');
                                                            }
                                                            return 'Semua Kelas';
                                                        } catch (e) {
                                                            return item.target_kelas || 'Semua Kelas';
                                                        }
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pembina Info */}
                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100/60">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#000080] group-hover:text-[#000080] transition-colors">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Pembina & Piket</p>
                                            <p className="text-xs font-bold text-slate-600">
                                                {item.pelatih_nama || '-'} • <span className="text-slate-400">{item.pendamping_nama || 'Tanpa Piket'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto self-end flex flex-col items-end gap-3 pt-4 md:pt-0">
                                    {item.my_status ? (
                                        getStatusBadge(item.my_status)
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/siswa/daftar/${item.id}`)}
                                            className="w-full md:w-auto bg-[#000080] hover:bg-blue-900 text-white px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                                        >
                                            Daftar Sekarang <ChevronRight size={20} className="group-hover/btn:translate-x-1.5 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <Users size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-700">Tidak ada ekskul ditemukan</h3>
                    <p className="text-slate-400 font-medium">Coba gunakan kata kunci pencarian yang lain.</p>
                </div>
            )}
        </div>
    );
};

export default SiswaEkskul;
