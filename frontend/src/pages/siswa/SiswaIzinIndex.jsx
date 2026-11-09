import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Clock, MapPin, User, ArrowRight, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../api/api';

const SiswaIzinIndex = () => {
    const [ekskuls, setEkskuls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyEkskuls();
    }, []);

    const fetchMyEkskuls = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/siswa/dashboard');
            if (res.data.success) {
                // Ambil daftar ekskul siswa yang sudah disetujui (my_ekskuls)
                const list = res.data.data.my_ekskuls || [];
                setEkskuls(list);
            } else {
                setError('Gagal memuat data ekstrakurikuler Anda');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-500 animate-pulse">Memuat data ekstrakurikuler...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12 font-sans">
            {/* HEADER */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-black uppercase tracking-wider border border-orange-100">
                            <FileText size={14} /> Pengajuan Izin Tidak Masuk Ekskul
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ajukan Izin Ekskul</h1>
                        <p className="text-slate-500 font-medium">
                            Pilih ekstrakurikuler yang Anda ikuti untuk membuat surat izin ketidakhadiran / sakit.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-6 rounded-[2rem] flex items-center gap-4 border border-rose-100">
                    <AlertCircle className="shrink-0" size={24} />
                    <p className="font-bold">{error}</p>
                </div>
            )}

            {/* DAFTAR EKSKUL YANG DIIKUTI */}
            {ekskuls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ekskuls.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between group"
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="w-14 h-14 bg-blue-50 text-[#000080] rounded-2xl flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                                        <FileText size={28} />
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Anggota Aktif
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-[#000080] transition-colors">
                                        {item.nama_ekskul}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                                        <User size={14} /> Pelatih: {item.nama_pelatih || item.pelatih_nama || '-'}
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-50 text-xs text-slate-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-[#000080]" />
                                        <span>Hari: <strong>{item.hari || '-'}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-[#000080]" />
                                        <span>Jam: {item.jam || (item.jam_mulai ? `${item.jam_mulai.substring(0, 5)} - ${item.jam_selesai ? item.jam_selesai.substring(0, 5) : ''} WIB` : '-')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-[#000080]" />
                                        <span>Tempat: {item.tempat ? `R. ${item.tempat}` : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 mt-4 border-t border-slate-100">
                                <button
                                    onClick={() => navigate(`/siswa/izin/${item.ekskul_id}`)}
                                    className="w-full py-3.5 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                                >
                                    <span>Buat Surat Izin</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] py-16 px-6 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Activity size={36} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Belum Ada Ekstrakurikuler yang Diikuti</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                        Anda belum terdaftar atau disetujui pada ekstrakurikuler manapun di semester ini, sehingga belum dapat mengajukan surat izin.
                    </p>
                    <button
                        onClick={() => navigate('/siswa/ekskul')}
                        className="mt-6 px-6 py-3 bg-[#000080] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors"
                    >
                        Daftar Ekstrakurikuler Sekarang
                    </button>
                </div>
            )}
        </div>
    );
};

export default SiswaIzinIndex;

