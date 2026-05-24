import React, { useState, useEffect } from 'react';
import { Trophy, Save, Search, Activity, Calendar, User, ClipboardEdit, CheckCircle } from 'lucide-react';
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
        tahun: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/pelatih/nilai');
            if (response.data.success) {
                setStudents(response.data.data.siswa.map(s => ({
                    ...s,
                    nilai: s.nilai || '',
                    keterangan: s.keterangan || ''
                })));
                setDashboardInfo({
                    semester: response.data.data.semester,
                    tahun: response.data.data.tahun
                });
            } else {
                setError(response.data.message || 'Gagal mengambil data nilai');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi ke server');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (id, field, value) => {
        setStudents(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
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
                        Masukkan nilai dan keterangan pencapaian siswa untuk rapot ekstrakurikuler.
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

            {/* INFO BANNER */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl text-[#000080] shadow-sm">
                    <Activity size={24} />
                </div>
                <div>
                    <h4 className="font-black text-[#000080] mb-1 uppercase text-sm tracking-wider">Sinkronisasi Nilai</h4>
                    <p className="text-sm text-blue-800/70 font-medium leading-relaxed">
                        Data nilai ini dipantau juga oleh <strong>Guru Pendamping</strong>. Pastikan koordinasi berjalan baik untuk penilaian rapot yang akurat.
                    </p>
                </div>
            </div>

            {/* GRADES TABLE */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-2/5">Siswa</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/5">Nilai (0-100)</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-2/5">Keterangan / Deskripsi Rapot</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((siswa) => (
                                <tr key={siswa.id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs group-hover:bg-blue-100 group-hover:text-[#000080] transition-all border border-white">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-800 group-hover:text-[#000080] transition-colors">{siswa.nama_siswa}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Kelas {siswa.nama_kelas}</p>
                                                    {siswa.alfa_count >= 3 && (
                                                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black uppercase rounded-md border border-rose-200" title="Sering Alfa (Otomatis Maksimal 59)">
                                                            Alfa {siswa.alfa_count}x (Maks. 59)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="relative max-w-[120px]">
                                            <input
                                                type="number"
                                                min="0"
                                                max={siswa.alfa_count >= 3 ? "59" : "100"}
                                                value={siswa.nilai}
                                                onChange={(e) => handleInputChange(siswa.id, 'nilai', siswa.alfa_count >= 3 && parseInt(e.target.value) > 59 ? "59" : e.target.value)}
                                                placeholder={siswa.alfa_count >= 3 ? "Maks 59" : "0"}
                                                className={`block w-full px-4 py-3 border rounded-xl font-black text-center transition-all outline-none ${siswa.alfa_count >= 3 ? 'bg-rose-50 border-rose-200 text-rose-600 focus:ring-4 focus:ring-rose-100' : 'bg-slate-50 border-slate-200 text-[#000080] focus:ring-4 focus:ring-blue-50 focus:border-[#000080]'}`}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-grow relative group/input">
                                                <textarea
                                                    rows="3"
                                                    value={siswa.keterangan}
                                                    onChange={(e) => handleInputChange(siswa.id, 'keterangan', e.target.value)}
                                                    placeholder="Contoh: Sangat baik dalam menguasai teknik dasar..."
                                                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all outline-none resize-y hover:bg-white"
                                                />
                                                <div className="absolute right-3 top-3 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                                    <ClipboardEdit size={14} className="text-slate-300" />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="px-8 py-20 text-center">
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
