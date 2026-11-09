import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Activity, ArrowLeft, Save, CheckCircle, GraduationCap, Calendar, Clock, MapPin, List, LayoutGrid, X, Printer, Trophy, User, Users, Search } from 'lucide-react';
import api from '../../api/api';

const EkskulList = () => {
    const [ekskul, setEkskul] = useState([]);
    const [kelasOptions, setKelasOptions] = useState([]);
    const [pelatihOptions, setPelatihOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
    const [searchTerm, setSearchTerm] = useState('');

    // Form & Logic state
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        nama_ekskul: '',
        tempat: '',
        hari: [], // Array of days
        jam: [''], // Array of time strings
        target_kelas: [], // Array of class IDs
        is_seleksi: 0,
        pelatih_id: null
    });

    useEffect(() => {
        fetchEkskul();
        fetchKelas();
        fetchPelatih();
    }, []);

    const fetchPelatih = async () => {
        try {
            const response = await api.get('/api/admin/pelatih');
            if (response.data.success) {
                setPelatihOptions(response.data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data pelatih', err);
        }
    };

    const fetchKelas = async () => {
        try {
            const response = await api.get('/api/admin/kelas');
            if (response.data.success) {
                setKelasOptions(response.data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data kelas', err);
        }
    };

    const fetchEkskul = async () => {
        try {
            const response = await api.get('/api/admin/ekskul');
            if (response.data.success) {
                setEkskul(response.data.data);
            } else {
                setError(response.data.message || 'Gagal mengambil data ekskul');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (ekskulItem) => {
        setFormData({
            nama_ekskul: ekskulItem.nama_ekskul || '',
            tempat: ekskulItem.tempat || '',
            hari: typeof ekskulItem.hari === 'string' ? ekskulItem.hari.split(', ').filter(Boolean) : [],
            jam: typeof ekskulItem.jam === 'string' ? ekskulItem.jam.split(', ').filter(Boolean) : [''],
            target_kelas: typeof ekskulItem.target_kelas === 'string'
                ? JSON.parse(ekskulItem.target_kelas)
                : (Array.isArray(ekskulItem.target_kelas) ? ekskulItem.target_kelas : []),
            is_seleksi: parseInt(ekskulItem.is_seleksi) || 0,
            pelatih_id: (() => {
                if (ekskulItem.pelatih_id) return ekskulItem.pelatih_id;
                const found = pelatihOptions.find(p =>
                    (p.ekskul_id && p.ekskul_id == ekskulItem.id) ||
                    (p.nama_ekskul && p.nama_ekskul.toLowerCase() === (ekskulItem.nama_ekskul || '').toLowerCase()) ||
                    (p.nama_pelatih && (p.nama_pelatih === ekskulItem.pelatih || p.nama_pelatih === ekskulItem.pelatih_nama))
                );
                return found ? found.id : '';
            })()
        });
        setEditId(ekskulItem.id);
        setIsEditing(true);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus ekstrakurikuler "${nama}"?`)) {
            try {
                await api.delete(`/api/admin/ekskul/${id}`);
                setSuccess('Ekstrakurikuler berhasil dihapus');
                fetchEkskul();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal menghapus data');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'pelatih_id' && value) {
            const chosen = pelatihOptions.find(p => String(p.id) === String(value));
            // Cek apakah pembina/pelatih ini sudah melatih ekskul lain
            if (chosen && chosen.ekskul_id && (!editId || String(chosen.ekskul_id) !== String(editId))) {
                const namaEkskulLain = chosen.ekskul_nama || 'ekstrakurikuler lain';
                setError(`Pembina/Pelatih ${chosen.nama_pelatih} saat ini sudah menjadi pembina dari ekskul ${namaEkskulLain}. Pembina hanya bisa membina 1 ekskul saja.`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }

        setError('');
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleDayToggle = (day) => {
        setFormData(prev => {
            const days = [...prev.hari];
            const updated = days.includes(day)
                ? days.filter(d => d !== day)
                : [...days, day];
            return { ...prev, hari: updated };
        });
    };

    const handleTimeChange = (index, value) => {
        const newTimes = [...formData.jam];
        newTimes[index] = value;
        setFormData({ ...formData, jam: newTimes });
    };

    const addTimeSlot = () => {
        setFormData({ ...formData, jam: [...formData.jam, ''] });
    };

    const removeTimeSlot = (index) => {
        if (formData.jam.length > 1) {
            const newTimes = formData.jam.filter((_, i) => i !== index);
            setFormData({ ...formData, jam: newTimes });
        }
    };

    const handleCheckboxChange = (level) => {
        setFormData(prev => {
            const targetKelas = [...prev.target_kelas];
            const updated = targetKelas.includes(level)
                ? targetKelas.filter(l => l !== level)
                : [...targetKelas, level];
            return { ...prev, target_kelas: updated };
        });
    };

    const resetForm = () => {
        setFormData({
            nama_ekskul: '',
            tempat: '',
            hari: [],
            jam: [''],
            target_kelas: [],
            is_seleksi: 0,
            pelatih_id: null
        });
        setIsEditing(false);
        setEditId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nama_ekskul || formData.nama_ekskul.trim() === '' || formData.hari.length === 0 || formData.jam.some(t => !t || t.trim() === '')) {
            setError('Nama ekskul, paling tidak satu hari, dan seluruh jam pelaksanaan wajib diisi!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const submissionData = {
                ...formData,
                hari: formData.hari.join(', '),
                jam: formData.jam.join(', '),
                target_kelas: formData.target_kelas.length > 0 ? formData.target_kelas : null
            };

            let response;
            if (isEditing) {
                response = await api.put(`/api/admin/ekskul/${editId}`, submissionData);
            } else {
                response = await api.post('/api/admin/ekskul', submissionData);
            }

            if (response.data.success) {
                setSuccess(isEditing ? 'Ekstrakurikuler berhasil diperbarui!' : 'Ekstrakurikuler baru berhasil ditambahkan!');
                setShowForm(false);
                resetForm();
                fetchEkskul();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message || 'Gagal menyimpan data ekskul');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data ekskul. Cek koneksi server.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSubmitting(false);
        }
    };

    const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    const filteredEkskul = ekskul.filter(item =>
        item.nama_ekskul.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.pelatih_nama && item.pelatih_nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.pelatih && item.pelatih.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.tempat && item.tempat.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memuat data ekstrakurikuler...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#000080] tracking-tight mb-1 whitespace-nowrap">
                        {showForm ? (isEditing ? 'Edit Data Ekskul' : 'Tambah Ekskul Baru') : 'Data Ekstrakurikuler'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {showForm ? 'Ubah informasi kegiatan di bawah' : 'Daftar seluruh kegiatan ekstrakurikuler sekolah'}
                    </p>
                </div>
                {!showForm && (
                    <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-4 flex-1">
                        {/* SEARCH BOX */}
                        <div className="relative w-full lg:w-72 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#000080] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari ekskul atau pelatih..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            {viewMode === 'table' && (
                                <button
                                    onClick={() => window.print()}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                                >
                                    <Printer size={18} />
                                    Cetak
                                </button>
                            )}
                            <button
                                onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                                className={`${viewMode === 'table' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-500 hover:bg-slate-600'} text-white font-bold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap`}
                            >
                                <List size={18} />
                                {viewMode === 'table' ? 'Mode Kartu' : 'Daftar Ekskul'}
                            </button>
                            <button
                                onClick={() => { resetForm(); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-2 px-5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                            >
                                <Plus size={18} />
                                Tambah Ekskul
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ALERTS */}
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm border border-red-200 font-bold shadow-sm animate-shake">
                        <div className="bg-red-100 p-1.5 rounded-lg">
                            <Activity size={18} />
                        </div>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 text-sm border border-emerald-200 font-bold shadow-sm">
                        <div className="bg-emerald-100 p-1.5 rounded-lg">
                            <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                        {success}
                    </div>
                )}
            </div>

            {/* CONTENT */}
            {showForm ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <button
                        onClick={() => { setShowForm(false); resetForm(); }}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-50 transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        Kembali ke Daftar
                    </button>

                    <form onSubmit={handleSubmit} noValidate className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-visible">
                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Section: Primary Info */}
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Informasi Utama</h3>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Nama Ekstrakurikuler <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                name="nama_ekskul"
                                                value={formData.nama_ekskul}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                                                placeholder="Contoh: Basket, Pramuka, Musik..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700">Ruangan / Tempat</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                                    <input
                                                        type="text"
                                                        name="tempat"
                                                        value={formData.tempat}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                                                        placeholder="Lap. Basket, Aula..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                                                    <span>Pelatih Ekstrakurikuler</span>
                                                    {formData.pelatih_id && (
                                                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                            Terhubung
                                                        </span>
                                                    )}
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                                    <select
                                                        name="pelatih_id"
                                                        value={formData.pelatih_id || ''}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium bg-white"
                                                    >
                                                        <option value="">-- Pilih Pelatih (Opsional) --</option>
                                                        {pelatihOptions.map(p => {
                                                            const isAssignedElsewhere = p.ekskul_id && (!editId || String(p.ekskul_id) !== String(editId));
                                                            return (
                                                                <option 
                                                                    key={p.id} 
                                                                    value={p.id}
                                                                    disabled={Boolean(isAssignedElsewhere)}
                                                                    className={isAssignedElsewhere ? "text-slate-400 bg-slate-100 font-normal" : "text-slate-800 font-medium"}
                                                                >
                                                                    {p.nama_pelatih} {isAssignedElsewhere ? `(Sudah membina ${p.ekskul_nama || 'Ekskul lain'})` : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                                <p className="text-[11px] text-slate-400">
                                                    Pilih pelatih terdaftar. Relasi ekskul dan pelatih akan otomatis tersinkronisasi.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Multi-Day Selection */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Calendar size={16} /> Hari Pelaksanaan <span className="text-red-500">*</span>
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {daysList.map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleDayToggle(day)}
                                                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${formData.hari.includes(day)
                                                        ? 'bg-[#000080] border-[#000080] text-white shadow-md'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-[#000080]/30'
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Multi-Time Slots */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                <Clock size={16} /> Waktu Pelaksanaan <span className="text-red-500">*</span>
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={addTimeSlot}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#000080] hover:text-[#000066] flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all active:scale-95"
                                            >
                                                <Plus size={12} /> Tambah Jam
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {formData.jam.map((t, index) => (
                                                <div key={index} className="flex gap-2 group">
                                                    <div className="relative flex-1">
                                                        <Clock className="absolute left-3 top-3.5 text-slate-300" size={16} />
                                                        <input
                                                            type="text"
                                                            value={t}
                                                            onChange={(e) => handleTimeChange(index, e.target.value)}
                                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-sm"
                                                            placeholder="Contoh: 14:00 - 16:00"
                                                        />
                                                    </div>
                                                    {formData.jam.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTimeSlot(index)}
                                                            className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Targets & Settings */}
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Target & Keterangan</h3>

                                        <div className="bg-blue-50/50 p-5 rounded-[2rem] border border-blue-100/50 space-y-4">
                                            <label className="text-sm font-extrabold text-[#000080] flex items-center gap-2">
                                                <GraduationCap size={18} /> Jenjang Kelas yang Diperbolehkan
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['7', '8', '9'].map((level) => (
                                                    <label
                                                        key={level}
                                                        className={`flex items-center justify-center py-3 px-1 rounded-2xl border cursor-pointer transition-all duration-200 whitespace-nowrap ${formData.target_kelas.includes(level)
                                                            ? 'bg-white border-[#000080] text-[#000080] font-bold shadow-sm ring-2 ring-blue-100'
                                                            : 'bg-white/50 border-slate-200 text-slate-500 hover:border-[#000080]/30 font-medium'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.target_kelas.includes(level)}
                                                            onChange={() => handleCheckboxChange(level)}
                                                            className="hidden"
                                                        />
                                                        <span className="text-xs sm:text-sm">{level}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                            <label className="flex items-center gap-4 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        name="is_seleksi"
                                                        checked={formData.is_seleksi === 1}
                                                        onChange={handleInputChange}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-14 h-7 rounded-full transition-colors duration-300 ${formData.is_seleksi === 1 ? 'bg-[#000080]' : 'bg-slate-300'}`}></div>
                                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${formData.is_seleksi === 1 ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 group-hover:text-[#000080] transition-colors">Perlu Seleksi Masuk</p>
                                                    <p className="text-xs text-slate-500">Aktifkan jika ekskul ini memiliki kuota terbatas atau syarat khusus.</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-xs text-slate-400 font-medium">Data waktu dan hari yang terpilih akan disatukan otomatis saat disimpan.</p>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); resetForm(); }}
                                    className="flex-1 sm:flex-none py-3 px-8 rounded-xl font-bold text-slate-400 hover:text-slate-600 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`flex-1 sm:flex-none font-bold py-3.5 px-10 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${submitting
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                        : 'bg-[#000080] hover:bg-[#000066] text-white shadow-lg shadow-blue-900/10 hover:shadow-xl hover:-translate-y-1'
                                        }`}
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Save size={20} />
                                    )}
                                    {isEditing ? 'Simpan Perubahan' : 'Terbitkan Ekskul'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    {filteredEkskul.length > 0 ? (
                        <>
                            {viewMode === 'table' ? (
                                <div className="print-container bg-white border-2 border-slate-800 shadow-2xl rounded-sm p-4 md:p-10 animate-in zoom-in-95 duration-500 overflow-x-auto">
                                    {/* OFFICIAL TABLE HEADER - REDESIGN IMAGE 2 */}
                                    <div className="text-center mb-10 space-y-2">
                                        <div className="flex items-center justify-center gap-6 mb-4">
                                            <div className="text-center">
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">JENIS EKSTRAKURIKULER</h2>
                                                <h3 className="text-xl font-bold text-slate-800 tracking-wide uppercase">TAHUN PELAJARAN {JSON.parse(localStorage.getItem('academicPeriod'))?.tahun_ajaran || '2024/2025'}</h3>
                                                <p className="text-lg font-bold text-slate-700 mt-2">SMPK SANTA MARIA 2 MALANG</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-center border-2 border-slate-800 text-[11px] leading-tight font-serif no-rounded">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-900 border-b-2 border-slate-800">
                                                    <th className="py-2 px-2 border-r-2 border-slate-800 w-8">NO</th>
                                                    <th className="py-2 px-4 border-r-2 border-slate-800 text-left">JENIS</th>
                                                    <th className="py-2 px-3 border-r-2 border-slate-800 w-24">KELAS</th>
                                                    <th className="py-2 px-4 border-r-2 border-slate-800" colSpan="2">WAKTU</th>
                                                    <th className="py-2 px-2 border-r-2 border-slate-800 w-16">KET</th>
                                                    <th className="py-2 px-4 border-r-2 border-slate-800 w-28">RUANG</th>
                                                    <th className="py-2 px-4 border-r-2 border-slate-800 text-left">PEMBINA</th>
                                                    <th className="py-2 px-4 border-slate-800 text-left">PIKET</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {filteredEkskul.map((item, idx) => (
                                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b-2 border-slate-800">
                                                        <td className="py-3 px-2 border-r-2 border-slate-800 font-medium text-slate-900">{idx + 1}</td>
                                                        <td className="py-3 px-4 border-r-2 border-slate-800 font-bold text-slate-900 text-left">{item.nama_ekskul}</td>
                                                        <td className="py-3 px-2 border-r-2 border-slate-800 font-medium text-slate-700 whitespace-nowrap">
                                                            {(() => {
                                                                const romanMap = { '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X', '11': 'XI', '12': 'XII' };
                                                                try {
                                                                    const targets = typeof item.target_kelas === 'string' ? JSON.parse(item.target_kelas) : item.target_kelas;
                                                                    if (Array.isArray(targets)) {
                                                                        return targets.map(t => romanMap[t] || t).join(', ');
                                                                    }
                                                                    return romanMap[targets] || targets || '-';
                                                                } catch (e) {
                                                                    return romanMap[item.target_kelas] || item.target_kelas || '-';
                                                                }
                                                            })()}
                                                        </td>
                                                        <td className="py-3 px-2 border-r-2 border-slate-800 font-medium text-slate-900 w-24">
                                                            <div className="flex flex-col gap-1">
                                                                {(() => {
                                                                    const haris = item.hari?.split(',').map(h => h.trim()) || [];
                                                                    const jams = item.jam?.split(',').map(j => j.trim()) || [];
                                                                    const maxLen = Math.max(haris.length, jams.length);
                                                                    return Array.from({ length: maxLen }).map((_, i) => (
                                                                        <div key={i}>{haris[i] || haris[0] || '-'}</div>
                                                                    ));
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2 border-r-2 border-slate-800 font-medium text-slate-700 w-32">
                                                            <div className="flex flex-col gap-1">
                                                                {(() => {
                                                                    const jams = item.jam?.split(',').map(j => j.trim()) || [];
                                                                    const haris = item.hari?.split(',').map(h => h.trim()) || [];
                                                                    const maxLen = Math.max(haris.length, jams.length);
                                                                    return Array.from({ length: maxLen }).map((_, i) => (
                                                                        <div key={i}>{jams[i] || '-'}</div>
                                                                    ));
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2 border-r-2 border-slate-800 font-bold text-slate-800 text-[10px] uppercase">
                                                            {item.is_seleksi == 1 ? 'Seleksi' : '-'}
                                                        </td>
                                                        <td className="py-3 px-4 border-r-2 border-slate-800 font-bold text-slate-800 uppercase text-[10px] text-left">
                                                            {item.tempat ? `R. ${item.tempat}` : '-'}
                                                        </td>
                                                        <td className="py-3 px-4 border-r-2 border-slate-800 text-left">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 text-[11px]">{item.pelatih_nama || item.pelatih || '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-left font-bold text-slate-800 text-[10px]">
                                                            {item.pendamping || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                        @media print {
                                            /* This combined with body padding can often hide browser headers/footers */
                                            @page { 
                                                size: landscape; 
                                                margin: 0; 
                                            }
                                            
                                            body { 
                                                font-family: "Times New Roman", serif; 
                                                background: white !important; 
                                                padding: 1.5cm; /* Re-add margin via padding so content isn't cut off but headers are hidden */
                                                margin: 0;
                                            }
                                            
                                            /* Hide everything by default */
                                            body * { visibility: hidden; }
                                            
                                            /* Only show the table container and its children */
                                            .print-container, .print-container * {
                                                visibility: visible;
                                            }
                                            
                                            .print-container {
                                                position: absolute;
                                                left: 1.5cm;
                                                top: 1.5cm;
                                                right: 1.5cm;
                                                width: auto !important;
                                                padding: 0 !important;
                                                margin: 0 !important;
                                                border: none !important;
                                                box-shadow: none !important;
                                            }

                                            /* Hide specific global UI elements */
                                            nav, aside, footer, .no-print, button, .sidebar, .header-top { 
                                                display: none !important; 
                                            }
                                            
                                            table { 
                                                border-collapse: collapse !important; 
                                                width: 100% !important; 
                                                border: 2.5px solid black !important;
                                                page-break-inside: auto; 
                                            }
                                            
                                            tr { page-break-inside: avoid; page-break-after: auto; }
                                            
                                            th {
                                                background-color: #f8fafc !important;
                                                -webkit-print-color-adjust: exact;
                                                print-color-adjust: exact;
                                                border: 2px solid black !important;
                                                padding: 12px 6px !important;
                                                font-weight: 900 !important;
                                                text-transform: uppercase;
                                            }
                                            
                                            td { 
                                                border: 1.5px solid black !important; 
                                                padding: 10px 8px !important;
                                                vertical-align: middle;
                                                color: black !important;
                                            }
                                            
                                            .text-center h2 { font-size: 24pt !important; margin-bottom: 5pt !important; }
                                            .text-center h3 { font-size: 18pt !important; margin-bottom: 5pt !important; }
                                            .text-center p { font-size: 14pt !important; margin-top: 5pt !important; }

                                            .no-rounded { border-radius: 0 !important; }
                                        }
                                        `
                                    }} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredEkskul.map((item) => (
                                        <div key={item.id} className="relative overflow-hidden p-6 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col md:flex-row items-center gap-6 group">
                                            {/* DECORATIVE BACKGROUND ICONS */}
                                            <div className="absolute bottom-[-10%] right-[15%] opacity-[0.03] text-[#000080] group-hover:-rotate-12 transition-transform duration-1000 select-none pointer-events-none">
                                                <Activity size={180} />
                                            </div>

                                            {/* LEFT SECTION: Icon Circle */}
                                            <div className="shrink-0 flex items-center justify-center">
                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#000050] to-[#000080] rounded-3xl flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                                    <Trophy className="text-white relative z-10" size={32} />
                                                </div>
                                            </div>

                                            {/* CENTER SECTION: Content Grid */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                                    <h3 className="text-xl md:text-2xl font-black text-[#000080] leading-tight tracking-tight uppercase">
                                                        {item.nama_ekskul}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {item.is_seleksi == 1 ? (
                                                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">Wajib Seleksi</span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Reguler</span>
                                                        )}
                                                        <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">Aktif</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 flex-1">
                                                    {/* JADWAL */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#000080] shrink-0 border border-blue-100 transition-colors group-hover:bg-[#000080] group-hover:text-white">
                                                            <Calendar size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Jadwal</p>
                                                            <p className="text-sm font-extrabold text-slate-800 leading-none">{item.hari || '-'}</p>
                                                        </div>
                                                    </div>

                                                    {/* WAKTU */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100 transition-colors group-hover:bg-[#000080] group-hover:text-white">
                                                            <Clock size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Waktu</p>
                                                            <p className="text-sm font-extrabold text-slate-800 leading-none">{item.jam || '-'}</p>
                                                        </div>
                                                    </div>

                                                    {/* LOKASI */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 transition-colors group-hover:bg-[#000080] group-hover:text-white">
                                                            <MapPin size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Lokasi</p>
                                                            <p className="text-sm font-extrabold text-slate-800 leading-none">{item.tempat ? `R. ${item.tempat}` : '-'}</p>
                                                        </div>
                                                    </div>

                                                    {/* TARGET KELAS */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100 transition-colors group-hover:bg-[#000080] group-hover:text-white">
                                                            <GraduationCap size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Untuk Kelas</p>
                                                            <p className="text-sm font-extrabold text-slate-800 leading-none">
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

                                                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 pt-3 border-t border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 px-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                                                            <User size={12} className="text-slate-400" />
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase">
                                                                <span className="text-slate-400">Pembina:</span> <span className="text-slate-700">{item.pelatih_nama || item.pelatih || '-'}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 px-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                                                            <Users size={12} className="text-slate-400" />
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase text-slate-400">
                                                                Piket: <span className="text-slate-700">{item.pendamping || '-'}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1 px-2 rounded-lg bg-blue-50/50 border border-blue-100/50 flex items-center gap-2">
                                                            <GraduationCap size={12} className="text-[#000080]" />
                                                            <p className="text-[10px] font-bold text-[#000080] uppercase">
                                                                {item.total_siswa || 0} Siswa Terdaftar
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT SECTION: Actions */}
                                            <div className="flex flex-row md:flex-col items-center justify-center gap-3 md:pl-8 md:border-l border-slate-100 shrink-0 w-full md:w-auto mt-4 md:mt-0">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="flex-1 md:flex-none w-full md:w-14 h-14 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-[#000080] hover:text-white hover:border-[#000080] transition-all duration-300 shadow-sm"
                                                    title="Edit Data"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.nama_ekskul)}
                                                    className="flex-1 md:flex-none w-full md:w-14 h-14 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300 shadow-sm"
                                                    title="Hapus Data"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner">
                            <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <Plus size={48} className="text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-400 tracking-tight">Belum ada data ekskul</h3>
                            <p className="text-slate-400 font-medium mt-2">Daftarkan ekstrakurikuler baru untuk memulai pemantauan.</p>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
};

export default EkskulList;
