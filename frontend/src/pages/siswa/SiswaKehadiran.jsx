import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ClipboardCheck, 
    Calendar, 
    User, 
    Activity, 
    CheckCircle2, 
    X, 
    AlertCircle, 
    Clock,
    AlertTriangle 
} from 'lucide-react';
import api from '../../api/api';

const SiswaKehadiran = () => {
    const [kehadiranData, setKehadiranData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState({ semester: '', tahun: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchKehadiran();
        
        // Auto-refresh setiap 10 detik untuk update realtime
        const refreshInterval = setInterval(fetchKehadiran, 10000);
        
        return () => clearInterval(refreshInterval);
    }, []);

    const fetchKehadiran = async () => {
        try {
            const response = await api.get('/api/siswa/kehadiran');
            if (response.data.success) {
                const resData = response.data.data;
                setKehadiranData(resData.kehadiran || []);
                setPeriod({
                    semester: resData.semester,
                    tahun: resData.tahun
                });
                setError(''); // Clear error on success
            } else {
                setError(response.data.message || 'Gagal mengambil data kehadiran');
            }
        } catch (err) {
            setError('Gagal mengambil data kehadiran. Silakan coba lagi nanti.');
            console.error('Error fetching kehadiran:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Hadir': return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 size={16} /> };
            case 'Izin': return { color: 'text-blue-600', bg: 'bg-blue-50', icon: <Clock size={16} /> };
            case 'Sakit': return { color: 'text-amber-600', bg: 'bg-amber-50', icon: <AlertCircle size={16} /> };
            case 'Alfa': return { color: 'text-rose-600', bg: 'bg-rose-50', icon: <X size={16} /> };
            default: return { color: 'text-slate-600', bg: 'bg-slate-50', icon: <Activity size={16} /> };
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* HEADER */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#000080]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#000080]/10 rounded-2xl flex items-center justify-center text-[#000080]">
                            <ClipboardCheck size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kehadiran Ekskul</h1>
                            <p className="text-slate-500 font-medium">Pantau kehadiran kamu di setiap kegiatan ekstrakurikuler.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <Calendar size={16} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-600">{period.semester} — {period.tahun}</span>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-6 rounded-[2rem] flex items-center gap-4 border border-rose-100 animate-shake">
                    <AlertCircle className="shrink-0" size={24} />
                    <p className="font-bold">{error}</p>
                </div>
            )}

            {/* CONTENT */}
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-[#000080] rounded-full animate-spin"></div>
                </div>
            ) : kehadiranData.length > 0 ? (
                <div className="space-y-10">
                    {kehadiranData.map((item, idx) => (
                        <div key={idx} className="space-y-6">
                            {/* EKSKUL CARD */}
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{item.nama_ekskul}</h2>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                            <User size={14} /> Pelatih: {item.nama_pelatih || '-'}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="bg-emerald-50 px-4 py-2 rounded-xl text-center border border-emerald-100 min-w-[70px]">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase">Hadir</p>
                                            <p className="text-lg font-black text-emerald-700">{item.stats.hadir}</p>
                                        </div>
                                        <div className="bg-blue-50 px-4 py-2 rounded-xl text-center border border-blue-100 min-w-[70px]">
                                            <p className="text-[10px] font-black text-blue-600 uppercase">Izin</p>
                                            <p className="text-lg font-black text-blue-700">{item.stats.izin}</p>
                                        </div>
                                        <div className="bg-amber-50 px-4 py-2 rounded-xl text-center border border-amber-100 min-w-[70px]">
                                            <p className="text-[10px] font-black text-amber-600 uppercase">Sakit</p>
                                            <p className="text-lg font-black text-amber-700">{item.stats.sakit}</p>
                                        </div>
                                        <div className="bg-rose-50 px-4 py-2 rounded-xl text-center border border-rose-100 min-w-[70px]">
                                            <p className="text-[10px] font-black text-rose-600 uppercase">Alfa</p>
                                            <p className="text-lg font-black text-rose-700">{item.stats.alfa}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* WARNING BOX (ALFA >= 2) */}
                                {item.stats.alfa >= 2 && (
                                    <div className="mb-8 p-6 bg-rose-50 border-2 border-rose-100 rounded-3xl flex items-start gap-4 animate-pulse">
                                        <AlertTriangle className="text-rose-600 shrink-0" size={32} />
                                        <div className="space-y-1">
                                            <h4 className="text-rose-800 font-black uppercase text-sm tracking-tight">Peringatan Disiplin!</h4>
                                            <p className="text-rose-700 font-bold text-sm leading-relaxed">
                                                Anda telah memiliki <span className="underline decoration-rose-400 decoration-2">{item.stats.alfa} ketidakhadiran tanpa keterangan (Alfa)</span> pada ekskul ini. 
                                                Berdasarkan aturan sekolah, Alfa sebanyak 2 kali atau lebih akan mengakibatkan **pengurangan poin Tatibsi**.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* LOG TABLE */}
                                <div className="overflow-hidden rounded-3xl border border-slate-100">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                                <th className="px-6 py-4">Tanggal</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {item.logs && item.logs.length > 0 ? item.logs.map((log, lidx) => {
                                                const style = getStatusStyle(log.status);
                                                return (
                                                    <tr key={lidx} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                                                            {log.tanggal ? new Date(log.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 space-y-2">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${style.bg} ${style.color}`}>
                                                                    {style.icon}
                                                                    {log.status}
                                                                </div>
                                                                {log.status === 'Izin' && (
                                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                                        log.status_izin === 'Disetujui'
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                            : log.status_izin === 'Ditolak'
                                                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    }`}>
                                                                        {log.status_izin === 'Disetujui' && <CheckCircle2 size={12} />}
                                                                        {log.status_izin === 'Ditolak' && <AlertCircle size={12} />}
                                                                        {(!log.status_izin || log.status_izin === 'Menunggu') && <Clock size={12} />}
                                                                        {log.status_izin || 'Menunggu Persetujuan Admin'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {log.status === 'Izin' && log.catatan_izin && (
                                                                <p className="text-[11px] text-slate-500 italic mt-1">
                                                                    Catatan Admin: {log.catatan_izin}
                                                                </p>
                                                            )}
                                                            {log.status === 'Izin' && !log.is_final && log.ekskul_id && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigate(`/siswa/izin/${log.ekskul_id}?date=${log.tanggal}`)}
                                                                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-blue-100 transition"
                                                                >
                                                                    Edit Izin
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-500 italic">
                                                            {log.keterangan || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-8 text-center text-slate-400 font-medium text-sm italic">
                                                        Belum ada catatan absensi untuk ekskul ini.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] py-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                        <Activity size={48} className="text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-400 tracking-tight">Belum Ada Riwayat</h2>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Data kehadiran kamu belum tercatat di periode ini.</p>
                </div>
            )}
        </div>
    );
};

export default SiswaKehadiran;
