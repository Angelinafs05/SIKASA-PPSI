import React, { useState, useEffect } from 'react';
import {
    Plus, Edit2, Trash2, Activity, UserPlus, ArrowLeft, Save, CheckCircle,
    Upload, Users, AlertTriangle, FileSpreadsheet, GraduationCap
} from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const SiswaList = () => {
    const { user } = useAuth();
    const isReadOnly = user?.role === 'kepala_sekolah';

    const [siswa, setSiswa] = useState([]);
    const [siswaMaster, setSiswaMaster] = useState([]);
    const [kelases, setKelases] = useState([]);
    const [loading, setLoading] = useState(true);

    // View state: 'list', 'form', 'import', 'promote'
    const [activeView, setActiveView] = useState('list');

    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filterKelas, setFilterKelas] = useState('');
    const [filterStatus, setFilterStatus] = useState('aktif');

    const [formData, setFormData] = useState({
        nama_siswa: '', no_induk: '', tanggal_lahir: '', no_hp: '', kota: '', alamat: '',
        nama_ayah: '', pekerjaan_ayah: '', nama_ibu: '', pekerjaan_ibu: '', kelas_id: '',
        username: '', password: '',
        parent_action: 'none', parent_id: '', nama_ortu: '', username_ortu: '', password_ortu: ''
    });

    // States for Import
    const [csvPreview, setCsvPreview] = useState([]);

    // States for Promote
    const [promoteFromKelasId, setPromoteFromKelasId] = useState('');
    const [promoteToKelasId, setPromoteToKelasId] = useState('');
    const [selectedSiswaIds, setSelectedSiswaIds] = useState([]);

    const [parents, setParents] = useState([]);

    useEffect(() => {
        fetchSiswa();
        fetchKelas();
        fetchParents();
    }, [filterStatus]); // Re-fetch when status filter changes

    useEffect(() => {
        if (activeView === 'promote') {
            fetchSiswaMaster();
        }
    }, [activeView]);

    const fetchSiswaMaster = async () => {
        try {
            const response = await api.get('/api/admin/siswa/master');
            if (response.data.success) {
                setSiswaMaster(response.data.data);
            }
        } catch (err) { }
    };

    const fetchSiswa = async () => {
        try {
            const response = await api.get(`/api/admin/siswa?status=${filterStatus}`);
            if (response.data.success) {
                setSiswa(response.data.data);
            }
        } catch (err) {
            setError('Gagal mengambil data siswa');
        } finally {
            setLoading(false);
        }
    };

    const fetchKelas = async () => {
        try {
            const response = await api.get('/api/admin/kelas');
            if (response.data.success) {
                setKelases(response.data.data);
            }
        } catch (err) { }
    };

    const fetchParents = async () => {
        try {
            const response = await api.get('/api/admin/parents');
            if (response.data.success) {
                setParents(response.data.data);
            }
        } catch (err) { }
    };

    const handleBackToList = () => {
        setActiveView('list');
        setError('');
        setSuccess('');
        setIsEditing(false);
        setCsvPreview([]);
        setSelectedSiswaIds([]);
        setPromoteToKelasId('');
    };

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetForm = () => {
        setFormData({
            nama_siswa: '', no_induk: '', tanggal_lahir: '', no_hp: '', kota: '', alamat: '',
            nama_ayah: '', pekerjaan_ayah: '', nama_ibu: '', pekerjaan_ibu: '', kelas_id: '',
            username: '', password: '',
            parent_action: 'none', parent_id: '', nama_ortu: '', username_ortu: '', password_ortu: ''
        });
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    const handleEdit = async (item) => {
        setError('');
        setSuccess('');
        try {
            const response = await api.get(`/api/admin/siswa/${item.id}`);
            if (response.data.success) {
                const data = response.data.data;
                setFormData({
                    id: data.id,
                    nama_siswa: data.nama_siswa || '',
                    no_induk: data.no_induk || '',
                    tanggal_lahir: data.tanggal_lahir || '',
                    no_hp: data.no_hp || '',
                    kota: data.kota || '',
                    alamat: data.alamat || '',
                    nama_ayah: data.nama_ayah || '',
                    pekerjaan_ayah: data.pekerjaan_ayah || '',
                    nama_ibu: data.nama_ibu || '',
                    pekerjaan_ibu: data.pekerjaan_ibu || '',
                    kelas_id: data.kelas_id || '',
                    username: data.username || '',
                    password: '',
                    parent_action: 'none', parent_id: '', nama_ortu: '', username_ortu: '', password_ortu: ''
                });
                setIsEditing(true);
                setActiveView('form');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError('Gagal mengambil detail siswa');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const url = isEditing ? `/api/admin/siswa/${formData.id}` : '/api/admin/siswa';
            const method = isEditing ? 'put' : 'post';

            const response = await api[method](url, formData);
            if (response.data.success) {
                setSuccess(isEditing ? 'Data siswa berhasil diperbarui' : 'Siswa baru berhasil ditambahkan');
                setActiveView('list');
                resetForm();
                fetchSiswa();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan data siswa');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus siswa "${nama}"? Semua data terkait juga akan terhapus.`)) {
            try {
                await api.delete(`/api/admin/siswa/${id}`);
                setSuccess('Data siswa berhasil dihapus');
                fetchSiswa();
            } catch (err) {
                setError('Gagal menghapus data siswa');
            }
        }
    };

    // --- IMPORT CSV LOGIC ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const rows = text.split('\n');
            const data = [];

            // Skip header starting at row 1
            for (let i = 1; i < rows.length; i++) {
                const parts = rows[i].split(',');
                if (parts.length >= 3 && parts[0].trim()) {
                    data.push({
                        nama_siswa: parts[0]?.trim() || '',
                        no_induk: parts[1]?.trim() || '',
                        kelas_id: parts[2]?.trim() || '',
                        username: parts[3]?.trim() || '',
                        password: parts[4]?.trim() || '',
                        no_hp: parts[5]?.trim() || '',
                        kota: parts[6]?.trim() || '',
                        alamat: parts[7]?.trim() || '',
                        nama_ayah: parts[8]?.trim() || '',
                        nama_ibu: parts[9]?.trim() || '',
                    });
                }
            }
            setCsvPreview(data);
        };
        reader.readAsText(file);
    };

    const submitImport = async () => {
        if (csvPreview.length === 0) return;
        setSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.post('/api/admin/siswa/import', { students: csvPreview });
            if (response.data.success) {
                setSuccess(response.data.message || 'Siswa berhasil diimpor');
                setActiveView('list');
                fetchSiswa();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengimpor siswa');
        } finally {
            setSubmitting(false);
        }
    };

    const downloadTemplate = () => {
        const headers = "Nama Siswa (Wajib),NIS,ID Kelas Tujuan (Wajib/Angka),Username,Password,No Telp,Kota,Alamat,Nama Ayah,Nama Ibu\n";
        const sample = "Budi Santoso,12345,1,budi123,pass123,0812,Sidoarjo,Jl Mawar,Pak Santoso,Bu Santoso\n";
        const blob = new Blob([headers + sample], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Template_Siswa_SIKASA.csv";
        a.click();
    };

    // --- KELAS PROMOTION LOGIC ---
    const toggleSiswaSelection = (id) => {
        setSelectedSiswaIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllSiswaPromote = () => {
        const siswaInPromoteKelas = siswaMaster.filter(s => s.kelas_id === parseInt(promoteFromKelasId));
        if (selectedSiswaIds.length === siswaInPromoteKelas.length) {
            setSelectedSiswaIds([]);
        } else {
            setSelectedSiswaIds(siswaInPromoteKelas.map(s => s.id));
        }
    };

    const submitPromotion = async () => {
        if (selectedSiswaIds.length === 0 || !promoteToKelasId) {
            setError('Pilih minimal satu siswa dan kelas tujuan');
            return;
        }

        // Let's ask for confirmation
        const kelasTujuanName = kelases.find(k => k.id == promoteToKelasId)?.nama_kelas;
        if (!window.confirm(`Yakin memindahkan ${selectedSiswaIds.length} siswa ke kelas ${kelasTujuanName}?`)) {
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.put('/api/admin/siswa/pindah-kelas', {
                siswa_ids: selectedSiswaIds,
                to_kelas_id: promoteToKelasId
            });
            if (response.data.success) {
                setSuccess(response.data.message || 'Siswa berhasil dipindahkan');
                setActiveView('list');
                setSelectedSiswaIds([]);
                fetchSiswa();
                fetchSiswaMaster();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memindahkan siswa');
        } finally {
            setSubmitting(false);
        }
    };

    const handleGraduate = async () => {
        if (selectedSiswaIds.length === 0) return;
        if (!window.confirm(`PERINGATAN: ${selectedSiswaIds.length} siswa terpilih akan diluluskan (diubah statusnya menjadi "Alumni" dan akses pendaftaran ekskul ditutup). Lanjutkan?`)) {
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');
        try {
            const response = await api.put('/api/admin/siswa/graduate', { siswa_ids: selectedSiswaIds });
            if (response.data.success) {
                setSuccess(response.data.message || 'Proses kelulusan berhasil!');
                setFilterStatus('alumni');
                setActiveView('list');
                setSelectedSiswaIds([]);
                fetchSiswa();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memproses kelulusan');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to determine grade level (e.g. 7, 8, 9, 10, 11, 12) from class name
    const getGradeLevel = (namaKelas) => {
        if (!namaKelas) return null;
        const normalized = String(namaKelas).trim().toUpperCase();
        // Check Roman numerals first (specifically with word boundaries or space/character boundaries)
        if (/\bIX\b|^IX[\s\-_A-Z0-9]/.test(normalized)) return 9;
        if (/\bVIII\b|^VIII[\s\-_A-Z0-9]/.test(normalized)) return 8;
        if (/\bVII\b|^VII[\s\-_A-Z0-9]/.test(normalized)) return 7;
        if (/\bXII\b|^XII[\s\-_A-Z0-9]/.test(normalized)) return 12;
        if (/\bXI\b|^XI[\s\-_A-Z0-9]/.test(normalized)) return 11;
        if (/\bX\b|^X[\s\-_A-Z0-9]/.test(normalized)) return 10;
        
        // Check Arabic numbers (e.g. "7A", "Kelas 7", "8-1")
        const match = normalized.match(/\b(7|8|9|10|11|12)\b/) || normalized.match(/(?:KELAS\s*|KLS\s*)?(7|8|9|10|11|12)/);
        if (match) return parseInt(match[1]);

        return null;
    };

    const selectedKelasAsal = kelases.find(k => k.id === parseInt(promoteFromKelasId));
    const selectedKelasAsalLevel = selectedKelasAsal ? getGradeLevel(selectedKelasAsal.nama_kelas) : null;
    
    // Can only graduate if it's the final grade (e.g. Grade 9 in SMP, Grade 12 in SMA, or if not determinable but selected)
    const canGraduate = selectedKelasAsalLevel ? (selectedKelasAsalLevel >= 9) : true;

    // Filter available destination classes based on origin class
    const availableDestinationKelases = kelases.filter(k => {
        if (!selectedKelasAsalLevel) {
            // If origin grade is not set or cannot be parsed, allow other classes except the same class
            return !promoteFromKelasId || k.id !== parseInt(promoteFromKelasId);
        }
        const targetLevel = getGradeLevel(k.nama_kelas);
        // Only show classes of next level (e.g. if origin is 7 -> only 8, if origin is 8 -> only 9)
        return targetLevel === selectedKelasAsalLevel + 1;
    });

    const filteredSiswa = filterKelas
        ? siswa.filter(s => s.kelas_id === parseInt(filterKelas))
        : siswa;

    const siswaToPromote = promoteFromKelasId
        ? siswaMaster.filter(s => s.kelas_id === parseInt(promoteFromKelasId))
        : [];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight mb-1 flex items-center gap-3">
                        {activeView === 'form' ? (isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru') :
                            activeView === 'import' ? 'Import Data Siswa' :
                                activeView === 'promote' ? 'Manajemen Kenaikan Kelas' :
                                    'Data Siswa'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-slate-500 font-medium">
                            {activeView === 'list' && 'Kelola daftar siswa yang terdaftar di SIKASA'}
                            {activeView === 'promote' && 'Pindahkan kelas siswa secara massal untuk tahun ajaran baru'}
                            {activeView === 'import' && 'Masukkan daftar siswa baru dengan format CSV'}
                        </p>
                        {activeView === 'list' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#000080] border border-blue-200/70 rounded-full text-xs font-black shadow-sm">
                                <Users size={14} /> Total: {filteredSiswa.length} Siswa
                                {filterKelas && (
                                    <span className="text-slate-500 font-bold">
                                        (Kelas {kelases.find(k => k.id === parseInt(filterKelas))?.nama_kelas || ''})
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    {activeView === 'list' && (
                        <>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-slate-500 whitespace-nowrap">Status:</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="bg-white border text-sm border-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl shadow-sm outline-none"
                                >
                                    <option value="aktif">Aktif</option>
                                    <option value="alumni">Alumni</option>
                                    <option value="all">Semua</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-slate-500 whitespace-nowrap">Filter Kelas:</label>
                                <select
                                    value={filterKelas}
                                    onChange={(e) => setFilterKelas(e.target.value)}
                                    className="bg-white border text-sm border-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl shadow-sm outline-none"
                                >
                                    <option value="">Semua Kelas</option>
                                    {kelases.map(k => (
                                        <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                                    ))}
                                </select>
                            </div>
                            {!isReadOnly && (
                                <>
                                    <button
                                        onClick={() => setActiveView('promote')}
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
                                    >
                                        <Activity size={16} /> Kenaikan Kelas
                                    </button>
                                    <button
                                        onClick={() => setActiveView('import')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
                                    >
                                        <Upload size={16} /> Import CSV
                                    </button>
                                    <button
                                        onClick={() => { resetForm(); setActiveView('form'); }}
                                        className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
                                    >
                                        <UserPlus size={16} /> Tambah Siswa
                                    </button>
                                </>
                            )}
                        </>
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

            {/* VIEWS */}
            {activeView === 'form' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <button onClick={handleBackToList} className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold">
                        <ArrowLeft size={18} /> Kembali ke Daftar
                    </button>
                    {/* Same form as before */}
                    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Personal Info */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Informasi Pribadi</h3>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nama Lengkap Siswa <span className="text-red-500">*</span></label>
                                    <input type="text" name="nama_siswa" value={formData.nama_siswa} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="Masukkan nama lengkap..." required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Kelas *</label>
                                    <select name="kelas_id" value={formData.kelas_id} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium bg-white" required>
                                        <option value="">Pilih Kelas...</option>
                                        {kelases.map(k => (
                                            <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Tanggal Lahir</label>
                                        <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Nomor Induk Siswa</label>
                                        <input type="text" name="no_induk" value={formData.no_induk} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="NIS..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Nomor HP</label>
                                        <input type="text" name="no_hp" value={formData.no_hp} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="0812..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Kota</label>
                                        <input type="text" name="kota" value={formData.kota} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="Kota Domisili..." />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Alamat Lengkap</label>
                                    <textarea name="alamat" value={formData.alamat} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="Alamat lengkap..." rows="2"></textarea>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3 mt-8">Profil Orang Tua (Opsional)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Nama Ayah</label><input type="text" name="nama_ayah" value={formData.nama_ayah} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="Nama Ayah..." /></div>
                                    <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Pekerjaan Ayah</label><input type="text" name="pekerjaan_ayah" value={formData.pekerjaan_ayah} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="Pekerjaan..." /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Nama Ibu</label><input type="text" name="nama_ibu" value={formData.nama_ibu} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="Nama Ibu..." /></div>
                                    <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Pekerjaan Ibu</label><input type="text" name="pekerjaan_ibu" value={formData.pekerjaan_ibu} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="Pekerjaan..." /></div>
                                </div>

                                {!isEditing && (
                                    <>
                                        <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3 mt-8">Integrasi Akun Orang Tua / Wali</h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-4">
                                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                                                    <input type="radio" name="parent_action" value="none" checked={formData.parent_action === 'none'} onChange={handleInputChange} className="w-4 h-4 text-[#000080]" />
                                                    Lewati
                                                </label>
                                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                                                    <input type="radio" name="parent_action" value="create" checked={formData.parent_action === 'create'} onChange={handleInputChange} className="w-4 h-4 text-[#000080]" />
                                                    Buat Akun Baru
                                                </label>
                                                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                                                    <input type="radio" name="parent_action" value="link" checked={formData.parent_action === 'link'} onChange={handleInputChange} className="w-4 h-4 text-[#000080]" />
                                                    Pilih Akun Terdaftar
                                                </label>
                                            </div>

                                            {formData.parent_action === 'create' && (
                                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-700">Nama Akun Orang Tua <span className="text-red-500">*</span></label>
                                                        <input type="text" name="nama_ortu" value={formData.nama_ortu} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="Nama lengkap wali murid..." required={formData.parent_action === 'create'} />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-slate-700">Username <span className="text-red-500">*</span></label>
                                                            <input type="text" name="username_ortu" value={formData.username_ortu} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="username_login" required={formData.parent_action === 'create'} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-slate-700">Password <span className="text-red-500">*</span></label>
                                                            <input type="password" name="password_ortu" value={formData.password_ortu} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="••••••••" required={formData.parent_action === 'create'} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {formData.parent_action === 'link' && (
                                                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-slate-700">Pilih Orang Tua Yang Sudah Terdaftar <span className="text-red-500">*</span></label>
                                                        <select name="parent_id" value={formData.parent_id} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium bg-white" required={formData.parent_action === 'link'}>
                                                            <option value="">-- Pilih Akun Wali --</option>
                                                            {parents.map(p => (
                                                                <option key={p.id} value={p.id}>{p.nama} (@{p.username})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Informasi Akun</h3>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Username</label>
                                        <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="Username login..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">{isEditing ? 'Password Baru (Kosongkan jika tetap)' : 'Password'}</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium" placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end border-t border-slate-100 pt-8">
                            <button type="submit" disabled={submitting} className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-3 px-12 rounded-xl flex items-center gap-2 shadow-lg disabled:bg-slate-300">
                                {submitting ? "Processing..." : (isEditing ? 'Perbarui Siswa' : 'Simpan Siswa')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeView === 'import' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <button onClick={handleBackToList} className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold">
                        <ArrowLeft size={18} /> Kembali ke Daftar
                    </button>
                    <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 space-y-6">
                        <div className="bg-blue-50 text-[#000080] p-6 rounded-xl border border-blue-100 flex gap-4">
                            <FileSpreadsheet size={32} className="flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-lg mb-2">Instruksi Upload Data Siswa Massal (CSV)</h3>
                                <p className="text-sm opacity-90 mb-4">Gunakan file berformat CSV (.csv) yang dipisahkan oleh tanda koma (,). Ikuti urutan kolom yang tepat seperti pada template.</p>
                                <button onClick={downloadTemplate} className="bg-[#000080] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-900 transition-colors inline-block">Download Template CSV</button>
                            </div>
                        </div>

                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#000080] hover:file:bg-blue-100 cursor-pointer"
                            />
                        </div>

                        {csvPreview.length > 0 && (
                            <div className="space-y-4 border-t border-slate-100 pt-6">
                                <h4 className="font-bold text-emerald-600 flex items-center gap-2"><CheckCircle size={18} /> Berhasil membaca {csvPreview.length} baris!</h4>
                                <button
                                    onClick={submitImport}
                                    disabled={submitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg w-full md:w-auto"
                                >
                                    {submitting ? 'Memproses Import...' : 'Simpan Semua ke Database Sistem'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeView === 'promote' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <button onClick={handleBackToList} className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold">
                        <ArrowLeft size={18} /> Kembali ke Daftar
                    </button>
                    <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden flex flex-col md:flex-row">
                        <div className="bg-slate-50 p-6 md:w-1/3 border-r border-slate-200 flex flex-col gap-6">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-800">Transfer Siswa</h3>
                                <p className="text-xs text-slate-500 mt-1">Pilih kelas asal dan kelas tujuan untuk siswa. Siswa yang dicentang akan dipindahkan.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mulai dari (Kelas Asal)</label>
                                <select
                                    value={promoteFromKelasId}
                                    onChange={(e) => { 
                                        setPromoteFromKelasId(e.target.value); 
                                        setPromoteToKelasId('');
                                        setSelectedSiswaIds([]); 
                                    }}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white font-bold text-slate-700 outline-none focus:border-[#000080]"
                                >
                                    <option value="">-- Pilih Kelas Asal --</option>
                                    {kelases.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-center text-slate-300 py-2"><ArrowLeft size={24} className="rotate-[-90deg] md:rotate-180" /></div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-amber-600 uppercase tracking-wider">Dipindahkan ke (Kelas Tujuan)</label>
                                <select
                                    value={promoteToKelasId}
                                    onChange={(e) => setPromoteToKelasId(e.target.value)}
                                    disabled={!promoteFromKelasId || availableDestinationKelases.length === 0}
                                    className="w-full border-2 border-amber-300 rounded-xl px-4 py-3 bg-amber-50 font-bold text-amber-900 outline-none focus:border-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="">
                                        {!promoteFromKelasId 
                                            ? '-- Pilih Kelas Asal Dahulu --' 
                                            : availableDestinationKelases.length === 0 
                                                ? '-- Tidak ada kelas tujuan (Gunakan tombol Luluskan) --' 
                                                : '-- Pilih Kelas Tujuan --'}
                                    </option>
                                    {availableDestinationKelases.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                                </select>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleGraduate}
                                    disabled={submitting || selectedSiswaIds.length === 0 || !canGraduate}
                                    className={`py-3 rounded-xl shadow-md w-full flex items-center justify-center gap-2 font-bold transition-all ${
                                        canGraduate && selectedSiswaIds.length > 0 && !submitting
                                            ? 'bg-slate-800 hover:bg-black text-white cursor-pointer active:scale-95'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70 shadow-none'
                                    }`}
                                    title={!canGraduate ? "Hanya siswa kelas akhir (Kelas 9) yang dapat diluluskan" : "Luluskan Siswa Terpilih"}
                                >
                                    <GraduationCap size={18} /> Luluskan
                                </button>
                                <button
                                    onClick={submitPromotion}
                                    disabled={submitting || selectedSiswaIds.length === 0 || !promoteToKelasId}
                                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-3 rounded-xl shadow-md w-full"
                                >
                                    {submitting ? 'Loading...' : `Pindah`}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 md:w-2/3 max-h-[600px] overflow-y-auto">
                            {!promoteFromKelasId ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                                    <Users size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">Silakan pilih "Kelas Asal" terlebih dahulu untuk melihat daftar siswa.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-slate-700">Daftar Siswa di Kelas Tersebut</h4>
                                        <button
                                            onClick={handleSelectAllSiswaPromote}
                                            className="text-xs font-bold text-[#000080] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                                        >
                                            {selectedSiswaIds.length === siswaToPromote.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                        </button>
                                    </div>
                                    {siswaToPromote.length === 0 ? (
                                        <p className="text-slate-500 italic">Tidak ada siswa di kelas ini.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {siswaToPromote.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => toggleSiswaSelection(s.id)}
                                                    className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedSiswaIds.includes(s.id) ? 'bg-blue-50 border-[#000080]' : 'border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSiswaIds.includes(s.id)}
                                                        onChange={() => { }} // handled by div click
                                                        className="w-5 h-5 text-[#000080]"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm leading-tight">{s.nama_siswa}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">{s.no_induk || 'No NIS'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'list' && (
                <div className="bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden p-6 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">Filter Terpilih:</span>
                            <span className="text-sm font-extrabold text-[#000080]">
                                {filterKelas 
                                    ? `Kelas ${kelases.find(k => k.id === parseInt(filterKelas))?.nama_kelas || ''}` 
                                    : 'Semua Kelas'}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">
                                ({filterStatus === 'all' ? 'Semua Status' : filterStatus === 'alumni' ? 'Alumni' : 'Siswa Aktif'})
                            </span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 text-[#000080] rounded-xl text-xs font-black border border-blue-100">
                            <Users size={15} /> Total: {filteredSiswa.length} Siswa
                        </div>
                    </div>
                    {siswa.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#000080]/5 text-[#000080] font-bold border-b border-slate-100 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="py-4 px-4 whitespace-nowrap">No induk</th>
                                        <th className="py-4 px-4 whitespace-nowrap">Nama Siswa</th>
                                        <th className="py-4 px-4 whitespace-nowrap">Kelas / Status</th>
                                        <th className="py-4 px-4 whitespace-nowrap">Jenis Akun</th>
                                        {!isReadOnly && <th className="py-4 px-4 text-center whitespace-nowrap">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSiswa.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">{item.no_induk || '-'}</td>
                                            <td className="py-4 px-4 font-bold text-slate-800 whitespace-nowrap">{item.nama_siswa}</td>
                                            <td className="py-4 px-4">
                                                {item.status === 'alumni' ? (
                                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black border border-amber-200">
                                                        ALUMNI
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                                        {item.nama_kelas}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {item.username ? (
                                                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><CheckCircle size={14} /> Aktif</span>
                                                ) : <span className="text-slate-400 text-xs italic">Tanpa Akun</span>}
                                            </td>
                                            {!isReadOnly && (
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => handleEdit(item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDelete(item.id, item.nama_siswa)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg" title="Hapus"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p className="font-bold text-slate-500">Belum ada data siswa</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SiswaList;
