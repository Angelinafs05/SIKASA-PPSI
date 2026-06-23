import React, { useState, useEffect } from 'react';
import { Trophy, Save, Search, Activity, Calendar, User, ClipboardEdit, CheckCircle, Calculator } from 'lucide-react';
import api from '../../api/api';

const PelatihNilai = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dashboardInfo, setDashboardInfo] = useState({
        semester: '',
        tahun: '',
        aspek: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/pelatih/nilai');
            if (response.data.success) {
                const { semester, tahun, aspek, siswa } = response.data.data;
                setDashboardInfo({ semester, tahun, aspek: aspek || [] });

                setStudents(siswa.map(s => {
                    // Pre-calculate final score to match current view just in case
                    let finalVal = parseInt(s.nilai) || 0;
                    return {
                        ...s,
                        nilai_aspek: s.detail_nilai || {},
                        nilai: finalVal,
                        keterangan: s.keterangan || ''
                    };
                }));
            } else {
                setError(response.data.message || 'Gagal mengambil data nilai');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi ke server');
        } finally {
            setLoading(false);
        }
    };

    const handleAspectChange = (siswaId, aspectId, value) => {
        let numericValue = value;
        // Limit max to 59 if alfa counts >= 3, else 100

        setStudents(prev => prev.map(s => {
            if (s.id === siswaId) {
                const updatedAspek = { ...s.nilai_aspek, [aspectId]: numericValue };

                let finalScore = 0;
                if (dashboardInfo.aspek.length > 0) {
                    dashboardInfo.aspek.forEach(asp => {
                        const val = parseFloat(updatedAspek[asp.id]) || 0;
                        finalScore += (val * (parseInt(asp.bobot) / 100));
                    });
                    finalScore = Math.round(finalScore);
                } else {
                    finalScore = s.nilai; // if no aspect
                }

                if (s.alfa_count >= 3 && finalScore > 59) {
                    finalScore = 59; // cap the final calculated score
                }

                return { ...s, nilai_aspek: updatedAspek, nilai: finalScore };
            }
            return s;
        }));
    };

    const handleOldNilaiChange = (siswaId, value) => {
        setStudents(prev => prev.map(s => {
            if (s.id === siswaId) {
                return { ...s, nilai: s.alfa_count >= 3 && parseInt(value) > 59 ? 59 : value };
            }
            return s;
        }));
    };

    const handleKeteranganChange = (siswaId, value) => {
        setStudents(prev => prev.map(s => s.id === siswaId ? { ...s, keterangan: value } : s));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const payload = {
                semester: dashboardInfo.semester,
                tahun: dashboardInfo.tahun,
                nilai: students.map(s => ({
                    siswa_id: s.id,
                    nilai_aspek: s.nilai_aspek,
                    nilai: s.nilai,
                    keterangan: s.keterangan
                }))
            };

            const response = await api.post('/api/pelatih/nilai', payload);
            if (response.data.success) {
                setSuccess('Semua nilai berhasil disimpan ke rapot!');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(response.data.message || 'Gagal menyimpan nilai');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const getPredicate = (nilai) => {
        if (!nilai && nilai !== 0) return '-';
        if (nilai >= 90) return 'A';
        if (nilai >= 80) return 'B';
        if (nilai >= 70) return 'C';
        return 'D';
    };

    const filteredStudents = students.filter(s =>
        s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memuat data nilai siswa...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="px-3 py-1 bg-blue-50 text-[#000080] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 flex items-center gap-1.5">
                            <Calendar size={12} /> {dashboardInfo.tahun} - {dashboardInfo.semester}
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight flex items-center gap-3">
                        <Trophy className="text-[#000080]" size={32} />
                        Input Nilai & Deskripsi
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Masukkan nilai per aspek. Nilai akhir dihitung secara otomatis.
                    </p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#000080] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama atau kelas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-200 font-bold shadow-sm animate-shake">
                    <Activity size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-emerald-100 font-bold shadow-sm animate-bounce-short">
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {dashboardInfo.aspek.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] text-amber-700">
                    <h4 className="font-extrabold text-lg flex items-center gap-2 mb-2">Peringatan: Belum Ada Aspek Penilaian</h4>
                    <p className="font-medium text-amber-800/80">
                        Anda belum membuat Bobot Nilai (Aspek) untuk ekstrakurikuler ini. Silakan buat di menu <b>Bobot Nilai</b> agar sistem perhitungan otomatis dapat berfungsi. Saat ini Anda hanya dapat meng-input nilai tunggal secara manual.
                    </p>
                </div>
            )}

            {/* GRADES TABLE */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest" style={{ minWidth: "220px" }}>Siswa (No. Urut & Kelas)</th>

                            {/* Dynamic Aspect Columns */}
                            {dashboardInfo.aspek.map(asp => (
                                <th key={asp.id} className="px-4 py-5 text-[10px] font-black text-[#000080] uppercase tracking-widest text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-slate-500">{asp.nama_aspek}</span>
                                        <span className="bg-blue-100 text-[#000080] px-2 py-0.5 rounded text-[9px] mt-1">{asp.bobot}%</span>
                                    </div>
                                </th>
                            ))}

                            {/* Fallback old nilaj col if no aspects */}
                            {dashboardInfo.aspek.length === 0 && (
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nilai Final (Manual)</th>
                            )}

                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-blue-50/50">Nilai Akhir</th>
                            <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Predikat</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Deskripsi Rapot</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((siswa, index) => (
                                <tr key={siswa.id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-800 text-sm">{siswa.nama_siswa}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Kls {siswa.nama_kelas}</p>
                                                    {siswa.alfa_count >= 3 && (
                                                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black uppercase rounded-md border border-rose-200" title="Sering Alfa">
                                                            Alfa {siswa.alfa_count}x
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Dynamic Inputs */}
                                    {dashboardInfo.aspek.map(asp => (
                                        <td key={asp.id} className="px-4 py-4 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={siswa.nilai_aspek[asp.id] !== undefined ? siswa.nilai_aspek[asp.id] : ''}
                                                onChange={(e) => handleAspectChange(siswa.id, asp.id, e.target.value)}
                                                placeholder="0"
                                                className="block w-20 mx-auto px-2 py-2 border border-slate-200 rounded-lg text-sm font-bold text-center outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#000080]"
                                            />
                                        </td>
                                    ))}

                                    {/* Fallback old nilai if no aspects */}
                                    {dashboardInfo.aspek.length === 0 && (
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={siswa.nilai}
                                                onChange={(e) => handleOldNilaiChange(siswa.id, e.target.value)}
                                                placeholder="0"
                                                className="block w-24 mx-auto px-3 py-2 border border-slate-200 rounded-xl text-lg font-black text-center outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080]"
                                            />
                                        </td>
                                    )}

                                    <td className="px-6 py-4 text-center bg-blue-50/30">
                                        <span className={`text-xl font-black flex items-center justify-center gap-1 ${siswa.alfa_count >= 3 && siswa.nilai >= 59 ? 'text-rose-600' : 'text-[#000080]'}`}>
                                            {dashboardInfo.aspek.length > 0 && <Calculator size={14} className="opacity-50" />}
                                            {siswa.nilai || 0}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm border 
                                            ${getPredicate(siswa.nilai) === 'A' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                getPredicate(siswa.nilai) === 'B' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    getPredicate(siswa.nilai) === 'C' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                        'bg-rose-100 text-rose-700 border-rose-200'
                                            }`}
                                        >
                                            {getPredicate(siswa.nilai)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="relative group/input">
                                            <textarea
                                                rows="2"
                                                value={siswa.keterangan}
                                                onChange={(e) => handleKeteranganChange(siswa.id, e.target.value)}
                                                placeholder="Sangat baik..."
                                                className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all outline-none resize-y hover:bg-white"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5 + dashboardInfo.aspek.length} className="px-8 py-20 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-100">
                                        <Trophy size={32} className="text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-400 tracking-tight">Tidak Ada Siswa</h3>
                                    <p className="text-slate-400 text-sm font-medium mt-1">Belum ada siswa yang bergabung di ekskul Anda.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* SAVE ACTION */}
            {students.length > 0 && (
                <div className="fixed bottom-8 right-8 z-30">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-3 px-8 py-4 bg-[#000080] hover:bg-blue-900 text-white rounded-[2rem] font-black text-sm shadow-2xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95 transition-all group disabled:opacity-70"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save size={20} className="group-hover:rotate-12 transition-transform" />
                                Simpan Seluruh Nilai
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PelatihNilai;
