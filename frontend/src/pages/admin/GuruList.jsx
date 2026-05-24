import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    UserPlus,
    ArrowLeft,
    Save,
    CheckCircle,
    Phone,
    UserCog,
    Activity,
    Upload,
    Search
} from 'lucide-react';
import api from '../../api/api';

const GuruList = () => {
    const [gurus, setGurus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        nama_guru: '',
        nip: '',
        kode_guru: '',
        no_hp: '',
        username: '',
        password: ''
    });

    useEffect(() => {
        fetchGurus();
    }, []);

    const fetchGurus = async () => {
        try {
            // Cache buster to ensure fresh data from server
            const response = await api.get(`/api/admin/guru?t=${Date.now()}`);
            if (response.data.success) {
                setGurus(response.data.data);
            }
        } catch (err) {
            setError('Gagal mengambil data guru pendamping');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            nama_guru: '',
            nip: '',
            kode_guru: '',
            no_hp: '',
            username: '',
            password: ''
        });
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    const handleEdit = async (item) => {
        setError('');
        setSuccess('');
        try {
            const response = await api.get(`/api/admin/guru/${item.id}`);
            if (response.data.success) {
                const data = response.data.data;
                setFormData({
                    id: data.id,
                    nama_guru: data.nama_guru || '',
                    nip: data.nip || '',
                    kode_guru: data.kode_guru || '',
                    no_hp: data.no_hp || '',
                    username: data.username || '',
                    password: ''
                });
                setIsEditing(true);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError('Gagal mengambil detail guru');
        }
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Basic validation
        if (!formData.nama_guru.trim()) {
            setError('Nama guru tidak boleh kosong');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const url = isEditing ? `/api/admin/guru/${formData.id}` : '/api/admin/guru';
            const method = isEditing ? 'put' : 'post';

            const response = await api[method](url, formData);
            if (response.data.success) {
                const msg = isEditing ? 'Data guru berhasil diperbarui' : 'Guru pendamping baru berhasil ditambahkan';

                // CRITICAL: Await fresh data FIRST
                await fetchGurus();

                // Then update UI state
                setShowForm(false);
                resetForm();
                setSuccess(msg);

                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(response.data.message || 'Gagal menyimpan data guru');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan pada server');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus guru "${nama}"? Akun login terkait juga akan terhapus.`)) {
            try {
                await api.delete(`/api/admin/guru/${id}`);
                setSuccess('Data guru berhasil dihapus');
                fetchGurus();
            } catch (err) {
                setError('Gagal menghapus data guru');
            }
        }
    };

    const filteredGurus = gurus.filter(item =>
        item.nama_guru.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nip && item.nip.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.kode_guru && item.kode_guru.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.username && item.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.no_hp && item.no_hp.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500">Memuat data...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#000080] tracking-tight mb-1 whitespace-nowrap">
                        {showForm ? (isEditing ? 'Edit Guru Pendamping' : 'Tambah Guru Baru') : 'Data Guru Pendamping'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {showForm ? 'Ubah atau lengkapi informasi guru di bawah' : 'Kelola daftar guru pendamping sekolah'}
                    </p>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                {!showForm && (
                    <div className="flex flex-col lg:flex-row lg:items-center justify-end gap-4 flex-1">
                        {/* SEARCH BOX */}
                        <div className="relative w-full lg:w-72 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#000080] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama, NIP, atau kode..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); alert('Fitur import akan segera hadir'); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                                <Upload size={18} className="pointer-events-none" />
                                Import
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); resetForm(); setShowForm(true); }}
                                className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                                <UserPlus size={18} className="pointer-events-none" />
                                Tambah Guru
                            </button>
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* ALERTS */}
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 font-bold text-sm flex items-center gap-2">
                        <CheckCircle size={20} />
                        {success}
                    </div>
                )}
            </div>

            {showForm ? (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold relative z-10 cursor-pointer"
                    >
                        <ArrowLeft size={18} className="pointer-events-none" /> Kembali ke Daftar
                    </button>

                    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 space-y-8 relative z-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Personal Info */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Informasi Pribadi</h3>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nama Lengkap Guru *</label>
                                    <input
                                        type="text"
                                        name="nama_guru"
                                        value={formData.nama_guru}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium"
                                        placeholder="Masukkan nama lengkap..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">NIP</label>
                                        <input
                                            type="text"
                                            name="nip"
                                            value={formData.nip}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium"
                                            placeholder="NIP Guru..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Kode Guru</label>
                                        <input
                                            type="text"
                                            name="kode_guru"
                                            value={formData.kode_guru}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium"
                                            placeholder="Kode..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nomor HP</label>
                                    <input
                                        type="text"
                                        name="no_hp"
                                        value={formData.no_hp}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium"
                                        placeholder="0812..."
                                    />
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Informasi Akun (Login)</h3>

                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium"
                                            placeholder="Username untuk login..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">
                                            {isEditing ? 'Password Baru (Kosongkan jika tetap)' : 'Password'}
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-slate-100 pt-8">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`font-bold py-3.5 px-10 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 shadow-lg ${submitting
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-[#000080] hover:bg-[#000066] text-white'
                                    }`}
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Save size={20} />
                                )}
                                {isEditing ? 'Perbarui Data Guru' : 'Simpan Data Guru'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden p-6">
                    {filteredGurus.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#000080]/5 text-[#000080] font-bold border-b border-slate-100 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="py-4 px-6 whitespace-nowrap">NIP</th>
                                        <th className="py-4 px-6 whitespace-nowrap">Nama Guru</th>
                                        <th className="py-4 px-6 whitespace-nowrap">Kode Guru</th>
                                        <th className="py-4 px-6 whitespace-nowrap">Username</th>
                                        <th className="py-4 px-6 whitespace-nowrap">No HP</th>
                                        <th className="py-4 px-6 text-center whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredGurus.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">{item.nip || '-'}</td>
                                            <td className="py-4 px-6 font-bold text-slate-800 whitespace-nowrap">{item.nama_guru}</td>
                                            <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">{item.kode_guru || '-'}</td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                {item.username ? (
                                                    <span className="font-bold text-[#000080] bg-blue-50 px-2 py-1 rounded text-xs">@{item.username}</span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">Tanpa Akun</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 font-medium whitespace-nowrap">{item.no_hp || '-'}</td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.nama_guru)}
                                                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p className="font-bold text-slate-500">Belum ada data guru pendamping</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GuruList;
