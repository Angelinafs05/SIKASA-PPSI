import React, { useState, useEffect } from 'react';
import { Settings, Save, Search, Activity, CheckCircle, Plus, Trash2, ChevronDown, Info } from 'lucide-react';
import api from '../../api/api';

const PILIHAN_ASPEK = [
    { label: 'Kehadiran / Presensi', kategori: 'absensi', desc: 'Otomatis dihitung dari persentase kehadiran pertemuan ekskul' },
    { label: 'Keterampilan & Praktik', kategori: 'pertemuan', desc: 'Dihitung dari rata-rata nilai latihan per pertemuan' },
    { label: 'Penguasaan Materi', kategori: 'pertemuan', desc: 'Dihitung dari rata-rata nilai latihan per pertemuan' },
    { label: 'Kedisiplinan & Sikap', kategori: 'pertemuan', desc: 'Dihitung dari rata-rata nilai latihan per pertemuan' },
    { label: 'Kerjasama Tim & Partisipasi', kategori: 'pertemuan', desc: 'Dihitung dari rata-rata nilai latihan per pertemuan' },
    { label: 'Tugas / Proyek Ekskul', kategori: 'pertemuan', desc: 'Dihitung dari rata-rata nilai latihan per pertemuan' },
    { label: 'Lainnya (Kustom)', kategori: 'kustom', desc: 'Tulis nama aspek secara manual' }
];

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
        setAspects([...aspects, { id: null, nama_aspek: 'Keterampilan & Praktik', bobot: 0, isCustom: false }]);
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

    const handleSelectDropdown = (index, selectedVal) => {
        const newAspects = [...aspects];
        if (selectedVal === 'Lainnya (Kustom)') {
            newAspects[index].isCustom = true;
            newAspects[index].nama_aspek = '';
        } else {
            newAspects[index].isCustom = false;
            newAspects[index].nama_aspek = selectedVal;
        }
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

            if (aspects.some(a => !a.nama_aspek || !a.nama_aspek.trim())) {
                setError(`Nama aspek wajib dipilih / diisi untuk semua baris.`);
                setSaving(false);
                return;
            }

            const response = await api.post('/api/pelatih/bobot-nilai', { aspek: aspects });
            if (response.data.success) {
                setSuccess('Bobot nilai berhasil disimpan!');
                fetchData();
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
                        Tentukan aspek penilaian ekskul dan persentase bobotnya. Pelatih bebas menentukan komposisi asalkan total bobot tepat 100%.
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
                        {totalBobot === 100 ? 'Total bobot sudah pas 100%. Anda dapat menyimpan perubahan.' : 'Sistem hanya akan menyimpan jika total bobot tepat 100%.'}
                    </p>
                </div>
                <div className="text-4xl font-extrabold">
                    {totalBobot}%
                </div>
            </div>

            {/* PETUNJUK SUMBER NILAI */}
            <div className="bg-blue-50/70 border border-blue-100 p-5 rounded-2xl flex items-start gap-3.5 text-sm text-[#000080]">
                <Info size={22} className="shrink-0 mt-0.5 text-blue-600" />
                <div className="space-y-1">
                    <p className="font-bold">Panduan Integrasi Penilaian:</p>
                    <ul className="list-disc list-inside text-xs font-semibold text-slate-600 space-y-0.5">
                        <li>Aspek <strong>"Kehadiran / Presensi"</strong> nilainya dihitung otomatis dari rekap absensi setiap siswa.</li>
                        <li>Aspek lainnya (<strong>Keterampilan, Penguasaan Materi, Sikap, dll</strong>) dihitung otomatis dari akumulasi rata-rata nilai latihan per pertemuan.</li>
                    </ul>
                </div>
            </div>

            {/* ASPECTS LIST */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden p-8 space-y-6">
                {aspects.length > 0 ? (
                    aspects.map((aspect, index) => {
                        const isPreset = PILIHAN_ASPEK.some(p => p.label === aspect.nama_aspek && p.label !== 'Lainnya (Kustom)');
                        const showCustomInput = aspect.isCustom || (!isPreset && aspect.nama_aspek !== '');
                        const isAbsensi = aspect.nama_aspek && (aspect.nama_aspek.toLowerCase().includes('hadir') || aspect.nama_aspek.toLowerCase().includes('absen'));

                        return (
                            <div key={index} className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 border border-slate-100 rounded-2xl hover:border-blue-100 transition-colors">
                                <div className="w-full flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Aspek Penilaian
                                        </label>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${isAbsensi ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {isAbsensi ? 'Otomatis dari Absensi' : 'Otomatis dari Nilai Pertemuan'}
                                        </span>
                                    </div>

                                    {/* DROPDOWN SELECTOR */}
                                    <div className="relative">
                                        <select
                                            value={showCustomInput ? 'Lainnya (Kustom)' : aspect.nama_aspek}
                                            onChange={(e) => handleSelectDropdown(index, e.target.value)}
                                            className="block w-full appearance-none px-4 py-3 bg-white border border-slate-200 rounded-xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-bold text-slate-700 pr-10"
                                        >
                                            <option value="" disabled>-- Pilih Jenis Aspek --</option>
                                            {PILIHAN_ASPEK.map((opt, oIdx) => (
                                                <option key={oIdx} value={opt.label}>
                                                    {opt.label} {opt.kategori === 'absensi' ? '(Rekap Absensi)' : opt.kategori === 'pertemuan' ? '(Latihan Harian)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={18} className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                                    </div>

                                    {/* INPUT CUSTOM JIKA PILIH LAINNYA */}
                                    {showCustomInput && (
                                        <input
                                            type="text"
                                            value={aspect.nama_aspek}
                                            placeholder="Tuliskan nama aspek khusus..."
                                            onChange={(e) => handleAspectChange(index, 'nama_aspek', e.target.value)}
                                            className="block w-full px-4 py-2.5 bg-white border border-dashed border-blue-300 rounded-xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] font-semibold text-slate-700 text-sm"
                                            autoFocus={aspect.isCustom}
                                        />
                                    )}
                                </div>

                                <div className="w-full md:w-36">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Bobot (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={aspect.bobot}
                                            onChange={(e) => handleAspectChange(index, 'bobot', parseInt(e.target.value) || 0)}
                                            className="block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-black text-center text-[#000080] pr-8 text-lg"
                                        />
                                        <span className="absolute right-3.5 top-3.5 font-bold text-slate-400 text-sm">%</span>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto pt-6">
                                    <button
                                        onClick={() => handleRemoveAspect(index)}
                                        className="w-full md:w-auto p-3.5 text-rose-500 hover:bg-rose-100 bg-rose-50 rounded-xl transition-all font-bold flex items-center justify-center"
                                        title="Hapus Aspek"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
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
