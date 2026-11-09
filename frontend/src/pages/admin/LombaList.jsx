import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, Users, FileText, CheckCircle, XCircle, AlertCircle, Search, Trash, UploadCloud, File, Clock, Download, Trophy, User, X, Eye, Medal, Activity, Image as ImageIcon } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const LombaList = () => {
    const { user } = useAuth();
    const isReadOnly = user?.role === 'kepala_sekolah';
    const [lomba, setLomba] = useState([]);
    const [siswaList, setSiswaList] = useState([]); // Students based on filter
    const [ekskulList, setEkskulList] = useState([]); // All ekskul for filter
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form state
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nama_lomba: '',
        tanggal_pelaksanaan: '',
        tempat: '',
        deskripsi: '',
        tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        semester: 'Ganjil',
        surat_edaran: null,
        tanggal_selesai: ''
    });

    // Peserta Modal state
    const [showPesertaModal, setShowPesertaModal] = useState(false);
    const [activeLomba, setActiveLomba] = useState(null);
    const [selectedEkskulFilter, setSelectedEkskulFilter] = useState('');
    const [checkedSiswaIds, setCheckedSiswaIds] = useState([]);

    // Hasil Lomba Modal state
    const [showHasilModal, setShowHasilModal] = useState(false);
    const [hasilSubmitting, setHasilSubmitting] = useState(false);
    const [hasilFormData, setHasilFormData] = useState({
        prestasi: '',
        foto_hasil: null,
        sertifikat_hasil: null
    });
    const [showResultDetail, setShowResultDetail] = useState(false);

    useEffect(() => {
        fetchLomba();
        fetchEkskul();
    }, []);

    useEffect(() => {
        fetchSiswa(selectedEkskulFilter);
    }, [selectedEkskulFilter]);

    const fetchLomba = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/lomba');
            if (response.data.success) {
                setLomba(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengambil data lomba');
        } finally {
            setLoading(false);
        }
    };

    const fetchEkskul = async () => {
        try {
            const response = await api.get('/api/admin/ekskul');
            if (response.data.success) {
                setEkskulList(response.data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data ekskul', err);
        }
    };

    const fetchSiswa = async (ekskulId = '') => {
        try {
            const url = ekskulId ? `/api/admin/siswa?ekskul_id=${ekskulId}` : '/api/admin/siswa';
            const response = await api.get(url);
            if (response.data.success) {
                setSiswaList(response.data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data siswa', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'surat_edaran') {
            setFormData(prev => ({ ...prev, surat_edaran: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const resetForm = () => {
        setFormData({
            nama_lomba: '',
            tanggal_pelaksanaan: '',
            tempat: '',
            deskripsi: '',
            tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
            semester: 'Ganjil',
            surat_edaran: null,
            tanggal_selesai: ''
        });
        // reset file input visually
        const fileInput = document.getElementById('surat_edaran');
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });

            const response = await api.post('/api/admin/lomba', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setSuccess('Data lomba berhasil ditambahkan');
                setShowForm(false);
                resetForm();
                fetchLomba();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal merekam lomba');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenPeserta = (l) => {
        setActiveLomba(l);
        setShowPesertaModal(true);
    };

    const toggleSiswa = (id) => {
        setCheckedSiswaIds(prev => 
            prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
        );
    };

    const handleSimpanSiswaBatch = async () => {
        if (checkedSiswaIds.length === 0) return;
        
        try {
            const response = await api.post('/api/admin/lomba/peserta', {
                lomba_id: activeLomba.id,
                siswa_ids: checkedSiswaIds
            });
            
            if (response.data.success) {
                setSuccess('Peserta berhasil ditambahkan');
                fetchLomba(); 
                
                setCheckedSiswaIds([]);
                setSelectedEkskulFilter('');
                setShowPesertaModal(false); // Auto close modal
                
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menambah peserta');
        }
    };

    const handleRemovePeserta = async (pesertaId) => {
        if (!window.confirm('Yakin ingin menghapus peserta ini dari lomba?')) return;
        
        try {
            const response = await api.delete(`/api/admin/lomba/peserta/${pesertaId}`);
            if (response.data.success) {
                setSuccess('Peserta dihapus');
                fetchLomba();
                
                // Update active lomba's participants optimistically
                setActiveLomba(prev => ({
                    ...prev,
                    peserta: prev.peserta.filter(p => p.peserta_id !== pesertaId)
                }));
                
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menghapus peserta');
        }
    };

    const handleHapusLomba = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Yakin ingin menghapus lomba ini beserta seluruh data pesertanya?')) return;
        
        try {
            const response = await api.delete(`/api/admin/lomba/${id}`);
            if (response.data.success) {
                setSuccess('Lomba berhasil dihapus');
                fetchLomba();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menghapus lomba');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleOpenHasil = (l) => {
        setActiveLomba(l);
        setHasilFormData({
            prestasi: l.prestasi || '',
            foto_hasil: null,
            sertifikat_hasil: null
        });
        setShowHasilModal(true);
    };

    const handleHasilInputChange = (e) => {
        const { name, value, files } = e.target;
        if (files) {
            setHasilFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setHasilFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleHasilSubmit = async (e) => {
        e.preventDefault();
        setHasilSubmitting(true);
        setError('');
        
        try {
            const data = new FormData();
            data.append('prestasi', hasilFormData.prestasi);
            if (hasilFormData.foto_hasil) data.append('foto_hasil', hasilFormData.foto_hasil);
            if (hasilFormData.sertifikat_hasil) data.append('sertifikat_hasil', hasilFormData.sertifikat_hasil);

            const response = await api.post(`/api/admin/lomba/${activeLomba.id}/hasil`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setSuccess('Hasil lomba berhasil diperbarui');
                setShowHasilModal(false);
                fetchLomba();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan hasil lomba');
        } finally {
            setHasilSubmitting(false);
        }
    };

    const handleViewResult = (l) => {
        setActiveLomba(l);
        setShowResultDetail(true);
    };

    // Helper for rendering status badges
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'Disetujui':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle size={10} /> Disetujui</span>;
            case 'Ditolak':
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200"><XCircle size={10} /> Ditolak</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock size={10} /> Menunggu</span>;
        }
    };

    if (loading && lomba.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-500 animate-pulse">Memuat data lomba...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight mb-1">
                        {showForm ? 'Tambah Lomba Baru' : 'Delegasi Lomba & Kegiatan'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {showForm ? 'Isi formulir untuk mendaftarkan kegiatan lomba baru' : 'Kelola delegasi siswa ke berbagai lomba dan pantau persetujuan orang tua.'}
                    </p>
                </div>
                {!showForm && !isReadOnly && (
                     <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <Plus size={18} /> Tambah Lomba
                    </button>
                )}
            </div>

            {/* ALERTS */}
            {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div><h3 className="font-bold">Terjadi Kesalahan</h3><p className="text-sm mt-1">{error}</p></div>
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div><h3 className="font-bold">Berhasil</h3><p className="text-sm mt-1">{success}</p></div>
                </div>
            )}

            {/* FORM */}
            {showForm && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden mb-8">
                    <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Trophy size={20} /></div>
                            <div><h2 className="text-xl font-black text-slate-800">Form Lomba</h2><p className="text-sm text-slate-500 font-medium">Lengkapi data lomba berikut</p></div>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lomba <span className="text-rose-500">*</span></label>
                                <input
                                    type="text" name="nama_lomba" value={formData.nama_lomba} onChange={handleInputChange} required
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                    placeholder="Contoh: Lomba Olimpiade Sains Nasional"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Mulai <span className="text-rose-500">*</span></label>
                                <input
                                    type="date" name="tanggal_pelaksanaan" value={formData.tanggal_pelaksanaan} onChange={handleInputChange} required
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Selesai</label>
                                <input
                                    type="date" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleInputChange}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                />
                                <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Kosongkan jika hanya 1 hari</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tempat Pelaksanaan <span className="text-rose-500">*</span></label>
                                <input
                                    type="text" name="tempat" value={formData.tempat} onChange={handleInputChange} required
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                    placeholder="Contoh: Universitas Gadjah Mada"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran <span className="text-rose-500">*</span></label>
                                    <select
                                        name="tahun_ajaran" value={formData.tahun_ajaran} onChange={handleInputChange} required
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                    >
                                        {(() => {
                                            const years = [];
                                            const currentYear = new Date().getFullYear();
                                            // Generate 4 years range (e.g., current-1 to current+2)
                                            for (let i = -1; i <= 2; i++) {
                                                const year = currentYear + i;
                                                years.push(`${year}/${year + 1}`);
                                            }
                                            return years.map(y => <option key={y} value={y}>{y}</option>);
                                        })()}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester <span className="text-rose-500">*</span></label>
                                    <select
                                        name="semester" value={formData.semester} onChange={handleInputChange} required
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                    >
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi Singkat</label>
                            <textarea
                                name="deskripsi" value={formData.deskripsi} onChange={handleInputChange} rows="3"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] transition-colors"
                                placeholder="Tuliskan deskripsi kompetisi..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Surat Edaran Ke Orang Tua (PDF/Image)</label>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <input
                                        type="file" id="surat_edaran" name="surat_edaran" accept=".pdf,image/*" onChange={handleInputChange}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#000080]/10 file:text-[#000080] hover:file:bg-[#000080]/20 cursor-pointer border border-slate-200 rounded-xl bg-slate-50"
                                    />
                                </div>
                                <div className="text-xs text-slate-500 font-medium">Opsional, tapi direkomendasikan</div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                type="button" onClick={() => setShowForm(false)} disabled={submitting}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit" disabled={submitting}
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#000080] hover:bg-[#000066] shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2"
                            >
                                {submitting ? 'Menyimpan...' : 'Simpan Lomba'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* LISTING LOMBA */}
            {!showForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lomba.map((l, index) => {
                        const tglObj = new Date(l.tanggal_pelaksanaan);
                        const tglStr = tglObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                        
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const lombaDate = new Date(l.tanggal_pelaksanaan);
                        lombaDate.setHours(0,0,0,0);
                        const endDate = l.tanggal_selesai ? new Date(l.tanggal_selesai) : null;
                        if (endDate) endDate.setHours(0,0,0,0);

                        let statusBadge = { label: 'Dijadwalkan', class: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Calendar size={12} /> };
                        
                        if (endDate) {
                            if (today > endDate) {
                                statusBadge = { label: 'Selesai', class: 'bg-slate-100 text-slate-600 border-slate-200', icon: <CheckCircle size={12} /> };
                            } else if (today >= lombaDate && today <= endDate) {
                                statusBadge = { label: 'Berlangsung', class: 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse', icon: <Activity size={12} /> };
                            }
                        } else {
                            if (lombaDate < today) {
                                statusBadge = { label: 'Selesai', class: 'bg-slate-100 text-slate-600 border-slate-200', icon: <CheckCircle size={12} /> };
                            } else if (lombaDate.getTime() === today.getTime()) {
                                statusBadge = { label: 'Berlangsung', class: 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse', icon: <Activity size={12} /> };
                            }
                        }

                        // To dynamically update if activeLomba changed
                        const LombaDisplay = activeLomba?.id === l.id ? activeLomba : l;

                        return (
                            <div key={index} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                                <div className="bg-slate-50 border-b border-slate-100 p-6 flex flex-col items-start gap-4">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
                                                <Trophy size={24} />
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge.class}`}>
                                                {statusBadge.icon}
                                                {statusBadge.label}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status Delegation</span>
                                            <div className="flex -space-x-2">
                                                {/* Visual dots for participants */}
                                                {(LombaDisplay.peserta || []).slice(0, 3).map((_, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                                                        <User size={10} className="text-slate-500" />
                                                    </div>
                                                ))}
                                                {(LombaDisplay.peserta || []).length > 3 && (
                                                    <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[8px] font-bold text-blue-600">
                                                        +{(LombaDisplay.peserta || []).length - 3}
                                                    </div>
                                                )}
                                                {(LombaDisplay.peserta || []).length === 0 && (
                                                    <span className="text-xs font-bold text-slate-400 mr-2">Belum ada delegasi</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-[#000080] transition-colors">{l.nama_lomba}</h3>
                                            {l.prestasi && (
                                                <div className="bg-amber-100 text-amber-600 p-1 rounded-lg" title={`Prestasi: ${l.prestasi}`}>
                                                    <Trophy size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-lg">
                                                {l.tahun_ajaran} - {l.semester}
                                            </span>
                                            {l.prestasi && (
                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                    {l.prestasi}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</p>
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {tglStr}
                                                    {l.tanggal_selesai && ` - ${new Date(l.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempat</p>
                                                <p className="text-sm font-semibold text-slate-700">{l.tempat}</p>
                                            </div>
                                        </div>
                                        {l.surat_edaran && (
                                            <div className="flex items-start gap-3 pt-2">
                                                <FileText size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Surat Edaran</p>
                                                    <a href={`http://localhost/SIKASA%20PPSI/backend/${l.surat_edaran}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5">
                                                        <Download size={12} /> Unduh Surat
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {(l.foto_hasil || l.sertifikat_hasil) && (
                                            <div className="flex items-start gap-3 pt-2 border-t border-slate-100 mt-2">
                                                <Medal size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasil & Prestasi</p>
                                                    <button 
                                                        onClick={() => handleViewResult(l)}
                                                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-0.5"
                                                    >
                                                        <Eye size={12} /> Lihat Dokumentasi
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 mt-auto flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleOpenPeserta(l)}
                                        className="flex-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold py-2 px-3 rounded-xl transition-all shadow-sm flex justify-center items-center gap-1.5 text-xs"
                                    >
                                        <Users size={14} /> {isReadOnly ? 'Lihat Peserta' : 'Peserta'}
                                    </button>
                                    {!isReadOnly && (
                                        <button
                                            onClick={() => handleOpenHasil(l)}
                                            className="flex-1 bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-700 hover:text-amber-700 font-bold py-2 px-3 rounded-xl transition-all shadow-sm flex justify-center items-center gap-1.5 text-xs"
                                        >
                                            <Trophy size={14} /> Input Hasil
                                        </button>
                                    )}
                                    {!isReadOnly && (
                                        <button
                                            onClick={(e) => handleHapusLomba(e, l.id)}
                                            className="bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold p-2 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0"
                                            title="Hapus Lomba"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {lomba.length === 0 && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Trophy size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-700 mb-1">Belum Ada Agenda Lomba</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">Anda belum mendaftarkan kegiatan lomba apapun. Klik "Tambah Lomba" untuk memulai.</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL KELOLA PESERTA */}
            {showPesertaModal && activeLomba && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => {setShowPesertaModal(false); fetchLomba();}}></div>
                    <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><Users size={20} /></div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">Delegasi Siswa</h2>
                                    <p className="text-xs font-bold text-slate-500">{activeLomba.nama_lomba}</p>
                                </div>
                            </div>
                            <button onClick={() => {setShowPesertaModal(false); fetchLomba();}} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-8">
                            
                            {/* Tambah Peserta Section */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Plus size={16}/> Tambah Delegasi Baru</h3>
                                
                                {/* Ekskul Filter */}
                                <select 
                                    className="w-full bg-white border border-slate-200 text-slate-800 font-semibold rounded-xl px-4 py-2.5 outline-none mb-4"
                                    value={selectedEkskulFilter}
                                    onChange={(e) => {
                                        setSelectedEkskulFilter(e.target.value);
                                        setCheckedSiswaIds([]); // Reset checks
                                    }}
                                >
                                    <option value="">-- Semua Siswa Terdaftar --</option>
                                    {ekskulList.map(e => (
                                        <option key={e.id} value={e.id}>Ekskul: {e.nama_ekskul}</option>
                                    ))}
                                </select>

                                {/* Siswa Checkbox List */}
                                <div className="border border-slate-200 bg-white rounded-xl max-h-48 overflow-y-auto">
                                    {siswaList.length > 0 ? (
                                        <ul className="divide-y divide-slate-100">
                                            {siswaList.map(s => {
                                                const isAlreadyRegistered = activeLomba?.peserta?.some(p => p.siswa_id === s.id);
                                                return (
                                                    <li key={s.id} className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                                        <input 
                                                            type="checkbox" 
                                                            id={`siswa-${s.id}`}
                                                            checked={checkedSiswaIds.includes(s.id) || isAlreadyRegistered}
                                                            onChange={() => toggleSiswa(s.id)}
                                                            disabled={isAlreadyRegistered}
                                                            className="w-4 h-4 rounded border-slate-300 text-[#000080] focus:ring-[#000080]"
                                                        />
                                                        <label htmlFor={`siswa-${s.id}`} className={`flex-1 text-sm font-semibold cursor-pointer ${isAlreadyRegistered ? 'text-slate-400' : 'text-slate-700'}`}>
                                                            {s.nama_kelas} - {s.nama_siswa}
                                                            {isAlreadyRegistered && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Sudah Terdaftar</span>}
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="p-6 text-center text-sm font-medium text-slate-400">Tidak ada siswa ditemukan.</div>
                                    )}
                                </div>
                            </div>

                            {/* Daftar Peserta Table */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center justify-between">
                                    Daftar Delegasi Terpilih
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs">Total: {(activeLomba.peserta || []).length} Siswa</span>
                                </h3>
                                
                                {activeLomba.peserta && activeLomba.peserta.length > 0 ? (
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-sm text-slate-600">
                                            <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Nama Siswa</th>
                                                    <th className="px-6 py-4">Kelas</th>
                                                    <th className="px-6 py-4">Persetujuan Ortu</th>
                                                    <th className="px-6 py-4">Surat Balasan</th>
                                                    <th className="px-6 py-4 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {activeLomba.peserta.map(p => (
                                                    <tr key={p.peserta_id} className="hover:bg-slate-50/50">
                                                        <td className="px-6 py-4 font-bold text-slate-800">{p.nama_siswa}</td>
                                                        <td className="px-6 py-4">{p.kelas}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col items-start gap-1">
                                                                {renderStatusBadge(p.parent_approval_status)}
                                                                {p.parent_approval_status === 'Ditolak' && p.parent_approval_reason && (
                                                                    <span className="text-[10px] text-rose-500 italic max-w-[150px] truncate" title={p.parent_approval_reason}>Alasan: {p.parent_approval_reason}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {p.surat_balasan ? (
                                                                <a href={`http://localhost/SIKASA%20PPSI/backend/${p.surat_balasan}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold pb-0.5 border-b border-emerald-500 text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1 w-max">
                                                                    <FileText size={12}/> Lihat Bukti
                                                                </a>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 italic">Belum diunggah</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button 
                                                                onClick={() => handleRemovePeserta(p.peserta_id)}
                                                                className="text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 p-2 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
                                                                title="Hapus Peserta"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                        <Users size={32} className="text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium text-sm">Belum ada siswa yang didaftarkan untuk lomba ini.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                        
                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => {setShowPesertaModal(false); fetchLomba();}} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors">
                                Tutup Panel
                            </button>
                            <button 
                                onClick={handleSimpanSiswaBatch}
                                disabled={checkedSiswaIds.length === 0}
                                className="bg-[#000080] hover:bg-[#000066] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                            >
                                Simpan Siswa Terpilih ({checkedSiswaIds.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INPUT HASIL LOMBA */}
            {showHasilModal && activeLomba && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowHasilModal(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><Trophy size={20} /></div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">Input Hasil Lomba</h2>
                                    <p className="text-xs font-bold text-slate-500 truncate max-w-[200px]">{activeLomba.nama_lomba}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowHasilModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleHasilSubmit} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pencapaian / Juara</label>
                                <input 
                                    type="text" 
                                    name="prestasi"
                                    value={hasilFormData.prestasi}
                                    onChange={handleHasilInputChange}
                                    placeholder="Contoh: Juara 1, Harapan 2, dll"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Foto Dokumentasi</label>
                                <input 
                                    type="file" 
                                    name="foto_hasil"
                                    accept="image/*"
                                    onChange={handleHasilInputChange}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer border border-slate-200 rounded-xl bg-slate-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sertifikat (PDF/Image)</label>
                                <input 
                                    type="file" 
                                    name="sertifikat_hasil"
                                    accept=".pdf,image/*"
                                    onChange={handleHasilInputChange}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer border border-slate-200 rounded-xl bg-slate-50"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button" onClick={() => setShowHasilModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit" disabled={hasilSubmitting}
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl shadow-md transition-all disabled:opacity-70"
                                >
                                    {hasilSubmitting ? 'Menyimpan...' : 'Simpan Hasil'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL VIEW RESULT DETAIL */}
            {showResultDetail && activeLomba && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowResultDetail(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><Medal size={20} /></div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800">Dokumentasi Hasil Lomba</h2>
                                    <p className="text-xs font-bold text-slate-500">{activeLomba.nama_lomba}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowResultDetail(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activeLomba.prestasi && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Prestasi Diperoleh</p>
                                        <p className="text-xl font-black text-slate-800">{activeLomba.prestasi}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><ImageIcon size={16} className="text-blue-500"/> Foto Kegiatan</h3>
                                    {activeLomba.foto_hasil ? (
                                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 aspect-video">
                                            <img 
                                                src={`http://localhost/SIKASA%20PPSI/backend/${activeLomba.foto_hasil}`} 
                                                alt="Foto Hasil Lomba" 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 aspect-video">
                                            <ImageIcon size={32} className="mb-2 opacity-20" />
                                            <p className="text-xs font-bold">Foto belum diunggah</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><File size={16} className="text-emerald-500"/> Sertifikat</h3>
                                    {activeLomba.sertifikat_hasil ? (
                                        <div className="rounded-2xl border border-slate-200 p-6 bg-emerald-50 flex flex-col items-center justify-center text-center gap-4 aspect-video">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">Sertifikat Tersedia</p>
                                                <p className="text-[10px] text-slate-500 font-medium">Klik tombol di bawah untuk melihat</p>
                                            </div>
                                            <a 
                                                href={`http://localhost/SIKASA%20PPSI/backend/${activeLomba.sertifikat_hasil}`} 
                                                target="_blank" rel="noopener noreferrer"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                                            >
                                                <Download size={14} /> Lihat / Unduh PDF
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-slate-400 aspect-video">
                                            <File size={32} className="mb-2 opacity-20" />
                                            <p className="text-xs font-bold">Sertifikat belum diunggah</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LombaList;
