import React, { useState, useEffect } from 'react';
import { Settings, Save, Search, Activity, CheckCircle, Plus, Trash2 } from 'lucide-react';
import api from '../../api/api';

const PelatihBobotNilai = () => {
    const [aspects, setAspects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [ekskulId, setEkskulId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/pelatih/bobot-nilai');
            if (response.data.success) {
                setAspects(response.data.data.aspek || []);
                setEkskulId(response.data.data.ekskul_id);
            } else {
                setError(response.data.message || 'Gagal mengambil data bobot nilai');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAspect = () => {
        setAspects([...aspects, { id: null, nama_aspek: '', bobot: 0 }]);
    };

    const handleRemoveAspect = (index) => {
        const newAspects = [...aspects];
        newAspects.splice(index, 1);
        setAspects(newAspects);
    };

    const handleAspectChange = (index, field, value) => {
        const newAspects = [...aspects];
        newAspects[index][field] = value;
        setAspects(newAspects);
    };

    const calculateTotalBobot = () => {
        return aspects.reduce((sum, aspect) => sum + (parseInt(aspect.bobot) || 0), 0);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const total = calculateTotalBobot();
            if (total !== 100) {
                setError(`Total bobot wajib 100%. Saat ini: ${total}%`);
                setSaving(false);
                return;
            }

            if (aspects.some(a => !a.nama_aspek.trim())) {
                setError(`Nama aspek wajib diisi untuk semua baris.`);
                setSaving(false);
                return;
            }

            const response = await api.post('/api/pelatih/bobot-nilai', { aspek: aspects });
            if (response.data.success) {
                setSuccess('Bobot nilai berhasil disimpan!');
                fetchData(); // Reload to get updated IDs if there were new items
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(response.data.message || 'Gagal menyimpan bobot nilai');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memuat data bobot nilai...</p>
            </div>
        </div>
    );

    const totalBobot = calculateTotalBobot();

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight flex items-center gap-3">
                        <Settings className="text-[#000080]" size={32} />
                        Kelola Bobot Nilai
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Tentukan penamaan aspek penilaian dan persentasenya. Total persentase harus exactly 100%.
                    </p>
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

            {/* TOTAL INFO BANNER */}
            <div className={`p-6 rounded-[2rem] flex items-center justify-between shadow-sm border ${totalBobot === 100 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                <div>
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                        <Activity size={20} /> Total Bobot Saat Ini
                    </h3>
                    <p className="text-sm font-medium mt-1">
                        Sistem hanya akan menyimpan jika total bobot tepat 100%.
                    </p>
                </div>
                <div className="text-4xl font-extrabold">
                    {totalBobot}%
                </div>
            </div>

            {/* ASPECTS LIST */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden p-8 space-y-6">
                {aspects.length > 0 ? (
                    aspects.map((aspect, index) => (
                        <div key={index} className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                            <div className="w-full flex-1">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama Aspek</label>
                                <input
                                    type="text"
                                    value={aspect.nama_aspek}
                                    placeholder="Contoh: Kehadiran"
                                    onChange={(e) => handleAspectChange(index, 'nama_aspek', e.target.value)}
                                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-semibold text-slate-700"
                                />
                            </div>
                            <div className="w-full md:w-32">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Bobot (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={aspect.bobot}
                                    onChange={(e) => handleAspectChange(index, 'bobot', parseInt(e.target.value) || 0)}
                                    className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-black text-center text-[#000080]"
                                />
                            </div>
                            <div className="w-full md:w-auto pt-5">
                                <button
                                    onClick={() => handleRemoveAspect(index)}
                                    className="w-full md:w-auto p-3 text-rose-500 hover:bg-rose-100 bg-rose-50 rounded-xl transition-all font-bold flex items-center justify-center"
                                    title="Hapus Aspek"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-slate-400 py-10">
                        <p className="font-medium">Belum ada aspek penilaian yang dibuat.</p>
                    </div>
                )}

                <button
                    onClick={handleAddAspect}
                    className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 hover:text-[#000080] hover:border-blue-200 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> Tambah Aspek Baru
                </button>
            </div>

            {/* SAVE ACTION */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving || totalBobot !== 100}
                    className="flex items-center gap-3 px-8 py-4 bg-[#000080] hover:bg-blue-900 text-white rounded-[2rem] font-black text-sm shadow-2xl shadow-blue-900/40 hover:-translate-y-1 active:scale-95 transition-all group disabled:opacity-50 disabled:hover:translate-y-0"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save size={20} className={totalBobot === 100 ? "group-hover:scale-110 transition-transform" : ""} />
                            Simpan Perubahan
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PelatihBobotNilai;
