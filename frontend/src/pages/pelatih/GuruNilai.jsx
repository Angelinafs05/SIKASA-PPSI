import React, { useState, useEffect } from 'react';
import { Trophy, Save, Search, Activity, User, CheckCircle, GraduationCap, AlertCircle } from 'lucide-react';
import api from '../../api/api';

const GuruNilai = () => {
    const [ekskuls, setEkskuls] = useState([]);
    const [selectedEkskul, setSelectedEkskul] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [period, setPeriod] = useState({ semester: 'Ganjil', tahun: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedEkskul) {
            fetchNilai(selectedEkskul);
        } else {
            setStudents([]);
        }
    }, [selectedEkskul, period]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/pendamping/dashboard');
            if (response.data.success) {
                const ekskulList = response.data.data.ekskuls || [];
                setEkskuls(ekskulList);
                setPeriod({
                    semester: response.data.data.periode?.semester || 'Ganjil',
                    tahun: response.data.data.periode?.tahun_ajaran || ''
                });
                if (ekskulList.length > 0) {
                    setSelectedEkskul(ekskulList[0].id.toString());
                }
            }
        } catch (err) {
            setError('Gagal mengambil data awal');
        } finally {
            setLoading(false);
        }
    };

    const fetchNilai = async (ekskulId) => {
        try {
            setLoading(true);
            const query = `ekskul_id=${ekskulId}&semester=${period.semester}&tahun=${period.tahun}`;
            const response = await api.get(`/api/pendamping/nilai?${query}`);
            if (response.data.success) {
                setStudents(response.data.data.siswa.map(s => ({
                    ...s,
                    nilai: s.nilai || 0,
                    keterangan: s.keterangan || ''
                })));
            }
        } catch (err) {
            setError('Gagal mengambil data nilai');
        } finally {
            setLoading(false);
        }
    };

    const handleNilaiChange = (id, field, value) => {
        setStudents(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const handleSave = async () => {
        if (!selectedEkskul) return;

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const payload = {
                ekskul_id: parseInt(selectedEkskul),
                semester: period.semester,
                tahun: period.tahun,
                nilai: students.map(s => ({
                    siswa_id: s.id,
                    nilai: parseInt(s.nilai) || 0,
                    keterangan: s.keterangan
                }))
            };

            const response = await api.post('/api/pendamping/nilai', payload);
            if (response.data.success) {
                setSuccess('Nilai berhasil disimpan!');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan nilai');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100 flex items-center gap-1.5">
                            <GraduationCap size={12} /> Penilaian Siswa
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        Rapot Ekstrakurikuler
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">
                        Berikan penilaian dan deskripsi capaian siswa untuk periode <span className="text-[#000080] font-black">{period.semester} {period.tahun}</span>.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* EKSKUL FILTER */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Trophy className="h-5 w-5 text-slate-400" />
                        </div>
                        <select
                            value={selectedEkskul}
                            onChange={(e) => setSelectedEkskul(e.target.value)}
                            className="block w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm appearance-none min-w-[200px]"
                        >
                            <option value="">Pilih Ekskul...</option>
                            {ekskuls.map(e => (
                                <option key={e.id} value={e.id}>{e.nama_ekskul}</option>
                            ))}
                        </select>
                    </div>

                    {/* SEARCH */}
                    <div className="relative group flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#000080] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari kelas/siswa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-rose-100 font-bold shadow-sm">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* INFO BANNER */}
            {selectedEkskul && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-6 flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl text-[#000080] shadow-sm">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h4 className="font-black text-[#000080] mb-1 uppercase text-sm tracking-wider">Sinkronisasi Nilai</h4>
                        <p className="text-sm text-blue-800/70 font-medium leading-relaxed">
                            Nilai ini terhubung langsung dengan <strong>Pelatih Eksternal</strong>. Anda dapat saling melengkapi nilai dan deskripsi rapot siswa secara bersamaan.
                        </p>
                    </div>
                </div>
            )}

            {/* TABLE */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-[#000080] rounded-full animate-spin"></div>
                </div>
            ) : !selectedEkskul ? (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] py-20 text-center shadow-sm">
                    <Trophy size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Pilih Ekstrakurikuler</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[30%]">Siswa</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[10%] text-center">Nilai (0-100)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan / Deskripsi Rapot</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((siswa) => (
                                    <tr key={siswa.id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black group-hover:bg-blue-100 group-hover:text-[#000080] transition-all border border-white">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-800 group-hover:text-[#000080] transition-colors">{siswa.nama_siswa}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Kelas {siswa.nama_kelas || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={siswa.nilai}
                                                onChange={(e) => handleNilaiChange(siswa.id, 'nilai', e.target.value)}
                                                className="w-20 mx-auto block px-3 py-2 text-center bg-slate-50 border-2 border-transparent focus:border-[#000080]/20 focus:bg-white rounded-xl text-sm font-black text-slate-700 outline-none transition-all shadow-inner"
                                            />
                                        </td>
                                        <td className="px-8 py-6">
                                            <textarea
                                                rows="3"
                                                value={siswa.keterangan}
                                                onChange={(e) => handleNilaiChange(siswa.id, 'keterangan', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#000080]/20 focus:bg-white rounded-xl text-sm font-bold text-slate-600 outline-none transition-all placeholder:font-medium placeholder:text-slate-300 shadow-inner resize-y"
                                                placeholder="Contoh: Sangat baik dalam menguasai teknik dasardan aktif dalam tim..."
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-8 py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-100">
                                            <Activity size={32} className="text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-400 tracking-tight">Tidak Ada Siswa</h3>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FLOATING SAVE BUTTON */}
            {students.length > 0 && selectedEkskul && (
                <div className="fixed bottom-8 right-8 z-30">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex items-center gap-3 px-8 py-4 bg-[#000080] hover:bg-blue-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95 transition-all group disabled:opacity-70"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save size={20} className="group-hover:rotate-12 transition-transform" />
                                Simpan Semua Nilai
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GuruNilai;
