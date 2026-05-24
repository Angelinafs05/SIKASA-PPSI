import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    UserPlus,
    ArrowLeft,
    Save,
    CheckCircle,
    User,
    Users,
    Search,
    X,
    Shield
} from 'lucide-react';
import api from '../../api/api';

const AdminParent = () => {
    const [parents, setParents] = useState([]);
    const [siswaList, setSiswaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        id: null,
        nama: '',
        username: '',
        password: '',
        child_ids: []
    });

    useEffect(() => {
        fetchParents();
        fetchSiswa();
    }, []);

    const fetchParents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/parents');
            if (response.data.success) {
                setParents(response.data.data);
            }
        } catch (err) {
            setError('Gagal mengambil data orang tua');
        } finally {
            setLoading(false);
        }
    };

    const fetchSiswa = async () => {
        try {
            const response = await api.get('/api/admin/siswa');
            if (response.data.success) {
                setSiswaList(response.data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data siswa');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleChild = (siswaId) => {
        setFormData(prev => {
            const isSelected = prev.child_ids.includes(siswaId);
            if (isSelected) {
                return { ...prev, child_ids: prev.child_ids.filter(id => id !== siswaId) };
            } else {
                return { ...prev, child_ids: [...prev.child_ids, siswaId] };
            }
        });
    };

    const resetForm = () => {
        setFormData({
            id: null,
            nama: '',
            username: '',
            password: '',
            child_ids: []
        });
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    const handleEdit = (item) => {
        setFormData({
            id: item.id,
            nama: item.nama,
            username: item.username,
            password: '',
            child_ids: item.children.map(c => c.id)
        });
        setIsEditing(true);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const url = isEditing ? `/api/admin/parents/${formData.id}` : '/api/admin/parents';
            const method = isEditing ? 'put' : 'post';

            const response = await api[method](url, formData);
            if (response.data.success) {
                setSuccess(isEditing ? 'Akun orang tua berhasil diperbarui' : 'Akun orang tua berhasil didaftarkan');
                setShowForm(false);
                resetForm();
                fetchParents();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data orang tua');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus akun orang tua "${nama}"?`)) {
            try {
                await api.delete(`/api/admin/parents/${id}`);
                setSuccess('Akun berhasil dihapus');
                fetchParents();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError('Gagal menghapus akun');
            }
        }
    };

    const filteredSiswa = siswaList.filter(s => 
        s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.no_induk.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && parents.length === 0) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500">Memuat data orang tua...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#000080] tracking-tight mb-1 whitespace-nowrap">
                        {showForm ? (isEditing ? 'Edit Akun Orang Tua' : 'Daftar Orang Tua Baru') : 'Manajemen Orang Tua'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {showForm ? 'Lengkapi data login dan hubungkan dengan anak mereka' : 'Kelola akun akses orang tua dan relasi wali murid'}
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
                                placeholder="Cari nama ortu atau anak..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                            />
                        </div>

                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
                        >
                            <UserPlus size={18} />
                            Tambah Orang Tua
                        </button>
                    </div>
                )}
            </div>

            {/* ALERTS */}
            <div className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold text-sm flex items-center gap-2">
                        <X size={18} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 font-bold text-sm flex items-center gap-2">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}
            </div>

            {showForm ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                    <button
                        onClick={() => setShowForm(false)}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold transition-colors"
                    >
                        <ArrowLeft size={18} /> Kembali ke Daftar
                    </button>

                    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Account Credentials */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-slate-800 border-l-4 border-[#000080] pl-3">Akses Akun</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap Orang Tua *</label>
                                    <input
                                        type="text" name="nama" value={formData.nama} onChange={handleInputChange} required
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                        placeholder="Contoh: Budi Santoso"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username *</label>
                                    <input
                                        type="text" name="username" value={formData.username} onChange={handleInputChange} required
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                        placeholder="username_ortu"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {isEditing ? 'Password Baru (Kosongkan jika tetap)' : 'Password *'}
                                    </label>
                                    <input
                                        type="password" name="password" value={formData.password} onChange={handleInputChange} required={!isEditing}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Linked Children Selection */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-slate-800 border-l-4 border-[#000080] pl-3">Hubungkan Anak (Siswa)</h3>
                                
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cari nama atau NIS anak..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white transition-all outline-none"
                                    />
                                </div>

                                <div className="border border-slate-200 rounded-2xl h-[280px] overflow-y-auto bg-slate-50/30 p-2 space-y-1">
                                    {filteredSiswa.map(s => (
                                        <div 
                                            key={s.id}
                                            onClick={() => toggleChild(s.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                                formData.child_ids.includes(s.id) 
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                                : 'bg-white border-transparent hover:border-slate-200 text-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${formData.child_ids.includes(s.id) ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold leading-tight">{s.nama_siswa}</p>
                                                    <p className="text-[10px] font-medium opacity-70">NIS: {s.no_induk} • Kelas: {s.nama_kelas}</p>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                                formData.child_ids.includes(s.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'
                                            }`}>
                                                {formData.child_ids.includes(s.id) && <CheckCircle size={12} />}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredSiswa.length === 0 && (
                                        <div className="py-10 text-center text-slate-400 text-sm font-medium">Siswa tidak ditemukan</div>
                                    )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                    {formData.child_ids.length} Anak Terpilih
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-3 px-12 rounded-2xl flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:bg-slate-300"
                            >
                                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={20} />}
                                {isEditing ? 'Perbarui Akun' : 'Daftarkan Akun'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {(() => {
                        const filteredParents = parents.filter(p =>
                            p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.children && p.children.some(c => c.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase())))
                        );
                        
                        return filteredParents.map((p) => (
                            <div key={p.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 leading-tight">{p.nama}</h3>
                                        <p className="text-xs font-bold text-slate-400">@{p.username}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(p.id, p.nama)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg" title="Hapus">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50/50 flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 underline decoration-indigo-200 decoration-2 underline-offset-4">Anak Terhubung</span>
                                </div>
                                <div className="space-y-2">
                                    {p.children && p.children.length > 0 ? (
                                        p.children.map(c => {
                                            // Determine status dot color
                                            const adminViewSemester = localStorage.getItem('adminViewSemester');
                                            let dotColor = 'bg-emerald-400'; // Default: Active
                                            
                                            if (c.status === 'alumni') {
                                                dotColor = 'bg-slate-300'; // Alumni
                                            } else if (c.nama_kelas && c.nama_kelas.startsWith('IX') && adminViewSemester === 'Genap') {
                                                dotColor = 'bg-amber-400'; // Grade 9 Even (Restricted)
                                            }

                                            return (
                                                <div key={c.id} className="bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm text-xs font-bold text-slate-700 flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                                                    <span>{c.nama_siswa}</span>
                                                    <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded ml-auto">{c.nama_kelas}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-xs italic text-slate-400 py-2">Belum ada anak yang dihubungkan</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        ));
                    })()}
                    {parents.length > 0 && parents.filter(p => 
                        p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (p.children && p.children.some(c => c.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase())))
                    ).length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-white">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Search size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-700 mb-2">Pencarian Tidak Ditemukan</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">Coba gunakan kata kunci lain.</p>
                        </div>
                    )}
                    {parents.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-white">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Users size={40} />
                            </div>
                            <h3 className="text-xl font-black text-slate-700 mb-2">Belum Ada Akun Orang Tua</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">Silakan klik tombol "Tambah Orang Tua" untuk mulai memberikan akses dashboard kepada wali murid.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminParent;
