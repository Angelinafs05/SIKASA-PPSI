import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Activity, UserCog, ArrowLeft, Save, CheckCircle, Globe, Home, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const PelatihList = () => {
    const { user } = useAuth();
    const [pelatih, setPelatih] = useState([]);
    const [ekskulOptions, setEkskulOptions] = useState([]);
    const [guruOptions, setGuruOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form & Logic state
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        nama_pelatih: '',
        no_hp: '',
        alamat: '',
        guru_id: '',
        ekskul_id: '',
        username: '',
        password: ''
    });

    useEffect(() => {
        fetchPelatih();
        fetchEkskul();
        fetchGurus();
    }, []);

    const fetchGurus = async () => {
        try {
            const response = await api.get('/api/admin/guru');
            if (response.data.success) {
                setGuruOptions(response.data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data guru pendamping', err);
        }
    };

    const fetchEkskul = async () => {
        try {
            const response = await api.get('/api/admin/ekskul');
            if (response.data.success) {
                setEkskulOptions(response.data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data ekskul', err);
        }
    };

    const fetchPelatih = async () => {
        try {
            const response = await api.get('/api/admin/pelatih');
            if (response.data.success) {
                setPelatih(response.data.data);
            } else {
                setError(response.data.message || 'Gagal mengambil data pelatih');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setFormData({
            nama_pelatih: item.nama_pelatih || '',
            no_hp: item.no_hp || '',
            alamat: item.alamat || '',
            guru_id: item.guru_id || '',
            ekskul_id: item.ekskul_id || '',
            username: item.username || '',
            password: '' // Don't show password
        });
        setEditId(item.id);
        setIsEditing(true);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus pelatih "${nama}"?`)) {
            try {
                await api.delete(`/api/admin/pelatih/${id}`);
                setSuccess('Pelatih berhasil dihapus');
                fetchPelatih();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal menghapus data pelatih');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'ekskul_id' && value) {
            const chosenEkskul = ekskulOptions.find(e => String(e.id) === String(value));
            // Cek apakah ekskul ini sudah dibina pelatih lain
            const alreadyAssignedPelatih = pelatih.find(p => String(p.ekskul_id) === String(value) && (!isEditing || String(p.id) !== String(editId)));
            if (alreadyAssignedPelatih) {
                setError(`Ekstrakurikuler ${chosenEkskul ? chosenEkskul.nama_ekskul : ''} sudah dibina oleh pelatih ${alreadyAssignedPelatih.nama_pelatih}. Satu ekskul hanya memiliki 1 pelatih utama!`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }

        if (name === 'guru_id' && value) {
            const chosenGuru = guruOptions.find(g => String(g.id) === String(value));
            if (chosenGuru && chosenGuru.assigned_pelatih_id && (!isEditing || String(chosenGuru.assigned_pelatih_id) !== String(editId))) {
                setError(`Guru ${chosenGuru.nama_guru} sudah mendampingi pelatih ${chosenGuru.assigned_pelatih_nama || ''} (${chosenGuru.assigned_ekskul_nama || 'Ekskul lain'}). Satu guru hanya bisa mendampingi 1 kegiatan!`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
        }

        setError('');
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            nama_pelatih: '',
            no_hp: '',
            alamat: '',
            guru_id: '',
            ekskul_id: '',
            username: '',
            password: ''
        });
        setIsEditing(false);
        setEditId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Manual Validation (Required: Nama Pelatih)
        if (!formData.nama_pelatih || formData.nama_pelatih.trim() === '') {
            setError('Nama pelatih wajib diisi!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            // Sanitize
            const submissionData = {
                ...formData,
                ekskul_id: formData.ekskul_id || null,
                guru_id: formData.guru_id || null,
                no_hp: formData.no_hp ? formData.no_hp.trim() : null,
                alamat: formData.alamat ? formData.alamat.trim() : null
            };

            let response;
            if (isEditing) {
                response = await api.put(`/api/admin/pelatih/${editId}`, submissionData);
            } else {
                response = await api.post('/api/admin/pelatih', submissionData);
            }

            if (response.data.success) {
                setSuccess(isEditing ? 'Data pelatih berhasil diperbarui!' : 'Pelatih baru berhasil ditambahkan!');

                // CRITICAL: Immediately show the list and fetch fresh data
                setShowForm(false);
                resetForm();
                fetchPelatih();

                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(response.data.message || 'Terjadi kesalahan saat menyimpan data');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data pelatih. Cek koneksi server.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredPelatih = pelatih.filter(item =>
        item.nama_pelatih.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nama_ekskul && item.nama_ekskul.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.username && item.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.no_hp && item.no_hp.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memuat data pelatih...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#000080] tracking-tight mb-1 whitespace-nowrap">
                        {showForm ? (isEditing ? 'Edit Data Pelatih' : 'Tambah Pelatih Baru') : 'Data Pelatih'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {showForm ? 'Ubah atau lengkapi informasi pelatih di bawah' : 'Kelola daftar pelatih ekstrakurikuler internal dan eksternal'}
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
                                placeholder="Cari nama, ekskul, atau kontak..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                            />
                        </div>

                        {user?.role === 'admin' && (
                            <button
                                onClick={() => { resetForm(); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <UserCog size={18} />
                                Tambah Pelatih
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ALERTS */}
            <div id="alert-zone" className="space-y-4">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Left Section */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Informasi Pribadi</h3>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                            Nama Lengkap Pelatih <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nama_pelatih"
                                            value={formData.nama_pelatih}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                                            placeholder="Masukkan nama lengkap..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Nomor HP / WhatsApp</label>
                                        <input
                                            type="text"
                                            name="no_hp"
                                            value={formData.no_hp}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                                            placeholder="Contoh: 08123456789"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Alamat</label>
                                        <textarea
                                            name="alamat"
                                            value={formData.alamat}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                                            placeholder="Alamat lengkap pelatih..."
                                        />
                                    </div>
                                </div>

                                {/* Right Section */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Penugasan & Status</h3>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Ekstrakurikuler Utama</label>
                                        <select
                                            name="ekskul_id"
                                            value={formData.ekskul_id}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium bg-white"
                                        >
                                            <option value="">Pilih Ekstrakurikuler...</option>
                                            {ekskulOptions.map(option => {
                                                const coach = pelatih.find(p => String(p.ekskul_id) === String(option.id) && (!isEditing || String(p.id) !== String(editId)));
                                                return (
                                                    <option 
                                                        key={option.id} 
                                                        value={option.id}
                                                        disabled={Boolean(coach)}
                                                        className={coach ? "text-slate-400 bg-slate-100 font-normal" : "text-slate-800 font-medium"}
                                                    >
                                                        {option.nama_ekskul} {coach ? `(Sudah dibina ${coach.nama_pelatih})` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-sm font-bold text-slate-700">Guru Pendamping</label>
                                            <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-100 font-bold italic">
                                                Pilih jika pelatih dari luar (External)
                                            </span>
                                        </div>
                                        <select
                                            name="guru_id"
                                            value={formData.guru_id}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium bg-white"
                                        >
                                            <option value="">Tidak ada pendamping (Internal)</option>
                                            {guruOptions.map(g => {
                                                const isAssigned = g.assigned_pelatih_id && (!isEditing || String(g.assigned_pelatih_id) !== String(editId));
                                                return (
                                                    <option 
                                                        key={g.id} 
                                                        value={g.id}
                                                        disabled={Boolean(isAssigned)}
                                                        className={isAssigned ? "text-slate-400 bg-slate-100 font-normal" : "text-slate-800 font-medium"}
                                                    >
                                                        {g.nama_guru} {isAssigned ? `(Sudah mendampingi ${g.assigned_ekskul_nama || g.assigned_pelatih_nama})` : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Informasi Akun (Login)</p>
                                            {isEditing && (
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">Edit Mode</span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600">Username</label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#000080] outline-none text-sm font-bold"
                                                    placeholder="Username..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600">
                                                    {isEditing ? 'Password Baru (Kosongkan jika tetap)' : 'Password'}
                                                </label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-[#000080] outline-none text-sm font-bold"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-slate-500 italic">Pastikan data nama pelatih sudah benar sebelum menyimpan.</p>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                {isEditing && user?.role === 'admin' && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(editId, formData.nama_pelatih)}
                                        className="w-full sm:w-auto font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 transition-all active:scale-95 border border-red-100"
                                    >
                                        <Trash2 size={18} />
                                        Hapus Pelatih
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full sm:w-auto font-bold py-3 px-10 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${submitting
                                        ? 'bg-slate-300 border-slate-400 text-slate-500 cursor-not-allowed scale-[0.98]'
                                        : 'bg-[#000080] hover:bg-[#000066] text-white shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 hover:-translate-y-1 active:scale-95'
                                        }`}
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Save size={20} />
                                    )}
                                    {isEditing ? 'Perbarui Pelatih' : 'Simpan Pelatih'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden p-6 animate-in slide-in-from-top-4 duration-500">
                    {filteredPelatih.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#000080]/5 text-[#000080] font-bold border-b border-slate-100 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="py-4 px-6">Pelatih</th>
                                        <th className="py-4 px-6">Tipe</th>
                                        <th className="py-4 px-6">Guru Pendamping</th>
                                        <th className="py-4 px-6">Ekstrakurikuler</th>
                                        <th className="py-4 px-6">Kontak</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPelatih.map((item) => {
                                        const isExternal = !!item.guru_id;
                                        return (
                                            <tr 
                                                key={item.id} 
                                                onClick={() => user?.role === 'admin' && handleEdit(item)}
                                                className={`transition-colors group ${user?.role === 'admin' ? 'hover:bg-blue-50/50 cursor-pointer' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-800">{item.nama_pelatih}</div>
                                                    {user?.role === 'admin' && item.username && (
                                                        <div className="text-[10px] text-slate-400 font-medium">@{item.username}</div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {isExternal ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                            <Globe size={10} /> External
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                            <Home size={10} /> Internal
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {item.pendamping_nama ? (
                                                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                                                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                                                            {item.pendamping_nama}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 font-medium">
                                                    {item.nama_ekskul || <span className="text-slate-400 italic font-normal">Belum diset</span>}
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 font-medium">{item.no_hp || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <UserCog size={32} className="text-slate-300" />
                            </div>
                            <p className="font-bold text-slate-500 text-lg">Belum ada data pelatih</p>
                            <p className="text-slate-400 text-sm mt-1">Gunakan tombol di atas untuk menambah pelatih baru.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PelatihList;
