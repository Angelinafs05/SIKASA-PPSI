import React, { useState, useEffect } from 'react';
import { Trophy, Search, Activity, User, CheckCircle2, GraduationCap, AlertCircle, Calendar } from 'lucide-react';
import api from '../../api/api';

const SiswaNilai = () => {
    const [nilaiData, setNilaiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [period, setPeriod] = useState({ semester: '', tahun: '' });

    useEffect(() => {
        fetchNilai();
    }, []);

    const fetchNilai = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/siswa/nilai');
            if (response.data.success) {
                const resData = response.data.data;
                setNilaiData(resData.nilai || []);
                setPeriod(prev => {
                    if (prev.semester === resData.semester && prev.tahun === resData.tahun) {
                        return prev;
                    }
                    return {
                        semester: resData.semester,
                        tahun: resData.tahun
                    };
                });
            }
        } catch (err) {
            setError('Gagal mengambil data nilai. Silakan coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    const getGradeLevel = (nilai) => {
        if (nilai >= 85) return { label: 'A', color: 'text-emerald-600', bg: 'bg-emerald-50' };
        if (nilai >= 75) return { label: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
        if (nilai >= 60) return { label: 'C', color: 'text-amber-600', bg: 'bg-amber-50' };
        return { label: 'D', color: 'text-rose-600', bg: 'bg-rose-50' };
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* HEADER */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#000080]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#000080]/10 rounded-2xl flex items-center justify-center text-[#000080]">
                            <GraduationCap size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Rapot Ekstrakurikuler</h1>
                            <p className="text-slate-500 font-medium">Lihat pencapaian dan nilai ekstrakurikuler kamu.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <Calendar size={16} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-600">{period.semester} {period.tahun}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 text-[#000080]">
                            <Trophy size={16} />
                            <span className="text-sm font-black uppercase tracking-widest">{nilaiData.length} Ekskul</span>
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
            ) : nilaiData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nilaiData.map((item, idx) => {
                        const grade = getGradeLevel(item.nilai);
                        return (
                            <div key={idx} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-[#000080]/5 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-800 group-hover:text-[#000080] transition-colors">{item.nama_ekskul}</h3>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                                            <User size={12} /> {item.nama_pelatih || '-'}
                                        </p>
                                    </div>
                                    <div className={`w-14 h-14 ${grade.bg} ${grade.color} rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm border-2 border-white`}>
                                        {grade.label}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest">
                                            <span>Skor</span>
                                            <span className={`${grade.color}`}>{item.nilai} / 100</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div
                                                className={`h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000 ease-out`}
                                                style={{ width: `${item.nilai}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                            <Activity size={10} /> Catatan Pelatih
                                        </p>
                                        <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                            "{item.keterangan || 'Sangat baik, terus pertahankan performamu!'}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] py-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                        <Trophy size={48} className="text-slate-200" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-400 tracking-tight">Belum Ada Nilai</h2>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Nilai kamu sedang diproses oleh pelatih. Silakan cek kembali nanti.</p>
                </div>
            )}
        </div>
    );
};

export default SiswaNilai;
