import React, { useState, useEffect, useMemo } from 'react';
import { History, Activity, AlertCircle, CheckCircle, Calculator, Info } from 'lucide-react';
import api from '../../api/api';

const AdminBobotNilai = () => {
    const [aspects, setAspects] = useState([]);
    const [ekskuls, setEkskuls] = useState([]);
    const [selectedEkskul, setSelectedEkskul] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch both ekskuls and aspects concurrently
            const [ekskulRes, aspekRes] = await Promise.all([
                api.get('/api/admin/ekskul'),
                api.get('/api/admin/bobot-nilai')
            ]);

            if (ekskulRes.data.success && aspekRes.data.success) {
                const ekskulsData = ekskulRes.data.data || [];
                setEkskuls(ekskulsData);
                setAspects(aspekRes.data.data || []);

                // Select first ekskul automatically if available
                if (ekskulsData.length > 0) {
                    setSelectedEkskul(ekskulsData[0].id.toString());
                }
            } else {
                setError('Gagal mengambil data dari server');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const filteredAspects = useMemo(() => {
        if (!selectedEkskul) return [];
        return aspects.filter(a => a.ekskul_id.toString() === selectedEkskul);
    }, [aspects, selectedEkskul]);

    const totalBobot = useMemo(() => {
        return filteredAspects.reduce((sum, asp) => sum + parseInt(asp.bobot || 0), 0);
    }, [filteredAspects]);

    // Handle initial loading purely
    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memuat data bobot nilai ekskul...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight flex items-center gap-3">
                        <History className="text-[#000080]" size={32} />
                        Pantau Bobot Nilai
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Pantau konfigurasi aspek penilaian. Hanya ekstrakurikuler dengan total bobot persis 100% yang valid.
                    </p>
                </div>

                <div className="w-full md:w-80">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                        Pilih Ekstrakurikuler
                    </label>
                    <select
                        value={selectedEkskul}
                        onChange={(e) => setSelectedEkskul(e.target.value)}
                        className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                    >
                        {ekskuls.length === 0 && <option value="">Tidak ada ekstrakurikuler</option>}
                        {ekskuls.map(e => (
                            <option key={e.id} value={e.id}>{e.nama_ekskul}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-200 font-bold shadow-sm animate-shake">
                    <Activity size={18} />
                    {error}
                </div>
            )}

            {/* Validation Banner Indicator */}
            {selectedEkskul && filteredAspects.length > 0 && (
                <div className={`p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm border transition-colors duration-300 ${totalBobot === 100 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl ${totalBobot === 100 ? 'bg-emerald-200/50 text-emerald-600' : 'bg-red-200/50 text-red-600'}`}>
                            {totalBobot === 100 ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <div>
                            <h3 className="font-black text-lg tracking-tight mb-1">
                                Status Konfigurasi: {totalBobot === 100 ? 'VALID' : 'TIDAK VALID'}
                            </h3>
                            <p className="text-sm font-medium opacity-90">
                                {totalBobot === 100
                                    ? 'Pelatih telah mengonfigurasi total persentase bobot dengan sempurna (100%). Sistem kalkulasi rapot ekstrakurikuler akan berjalan normal.'
                                    : 'Total persentase bobot saat ini bertotalkan ' + totalBobot + '%. Pelatih wajib menyesuaikan agar tepat di angka 100% sebelum dapat menyimpan penilaian.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {selectedEkskul && filteredAspects.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 text-slate-500 p-6 flex flex-col items-center justify-center rounded-[2rem] py-16">
                    <Info size={48} className="text-slate-300 mb-4" />
                    <h3 className="font-extrabold text-lg text-slate-700">Belum Ada Aspek Dibuat</h3>
                    <p className="font-medium mt-1">Pelatih ekskul ini belum mengonfigurasi satupun aspek penilaian.</p>
                </div>
            )}

            {/* Table Section */}
            {selectedEkskul && filteredAspects.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest w-2/3">Nama Aspek Penilaian</th>
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center w-1/3">Bobot (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAspects.map((aspect) => (
                                <tr key={aspect.id} className="hover:bg-blue-50/20 transition-all duration-200 group">
                                    <td className="px-8 py-5 font-bold text-slate-700 border-r border-slate-50 group-hover:text-[#000080] transition-colors">{aspect.nama_aspek}</td>
                                    <td className="px-8 py-5 text-center font-extrabold text-[#000080] text-lg bg-slate-50/30 group-hover:bg-blue-50/50 transition-colors">{aspect.bobot}%</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className={`${totalBobot === 100 ? 'bg-emerald-50 text-emerald-800 border-t-2 border-emerald-200' : 'bg-red-50 text-red-800 border-t-2 border-red-200'}`}>
                                <td className="px-8 py-6 text-right font-black uppercase tracking-widest text-sm">
                                    <div className="flex items-center justify-end gap-2">
                                        <Calculator size={18} /> Total Bobot Keseluruhan
                                    </div>
                                </td>
                                <td className={`px-8 py-6 text-center font-black text-2xl tracking-tighter ${totalBobot === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {totalBobot}%
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminBobotNilai;
