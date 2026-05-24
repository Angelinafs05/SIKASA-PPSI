import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    ArrowLeft,
    Save,
    CheckCircle,
    AlertCircle,
    FileText,
    Image as ImageIcon,
    Download,
    Edit2
} from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const AdminHonor = () => {
    const { user } = useAuth();
    const isReadOnly = user?.role === 'kepala_sekolah';
    const [honors, setHonors] = useState([]);
    const [pelatihs, setPelatihs] = useState([]);
    const [gurus, setGurus] = useState([]);
    const [summaryData, setSummaryData] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const currentYear = new Date().getFullYear();
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const [formData, setFormData] = useState({
        pelatih_id: '',
        bulan: months[new Date().getMonth()],
        tahun: currentYear,
        nominal: '',
        tanggal_cair: new Date().toISOString().split('T')[0],
        metode_penyerahan: 'Tunai',
        titip_guru_id: '',
        keterangan: '',
        bukti_transfer: null,
        status: 'sudah dibayar'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [honorRes, pelatihRes, guruRes, summaryRes] = await Promise.all([
                api.get('/api/admin/honor'),
                api.get('/api/admin/pelatih'),
                api.get('/api/admin/guru'),
                api.get('/api/admin/honor/summary')
            ]);
            
            if (honorRes.data.success) setHonors(honorRes.data.data);
            if (pelatihRes.data.success) setPelatihs(pelatihRes.data.data);
            if (guruRes.data.success) setGurus(guruRes.data.data);
            if (summaryRes.data.success) setSummaryData(summaryRes.data.data);
            
        } catch (err) {
            setError('Gagal mengambil data honor pelatih');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        let updates = { [name]: value };
        
        if (name === 'pelatih_id') {
            const selectedPelatih = pelatihs.find(p => p.id.toString() === value.toString());
            if (selectedPelatih) {
                const isExternal = !!selectedPelatih.guru_id;
                
                if (!isExternal && formData.metode_penyerahan === 'Titip_Guru') {
                    updates.metode_penyerahan = 'Tunai';
                    updates.titip_guru_id = '';
                }
                
                if (isExternal) {
                    updates.titip_guru_id = selectedPelatih.guru_id;
                } else {
                    updates.titip_guru_id = '';
                }
            } else {
                updates.titip_guru_id = '';
            }
        }
        
        if (name === 'metode_penyerahan') {
            if (value === 'Titip_Guru') {
                const selectedPelatih = pelatihs.find(p => p.id.toString() === formData.pelatih_id.toString());
                if (selectedPelatih && !!selectedPelatih.guru_id) {
                    updates.titip_guru_id = selectedPelatih.guru_id;
                }
            } else {
                updates.titip_guru_id = '';
            }
        }
        
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, bukti_transfer: e.target.files[0] }));
        }
    };

    const resetForm = () => {
        setFormData({
            pelatih_id: '',
            bulan: months[new Date().getMonth()],
            tahun: currentYear,
            nominal: '',
            tanggal_cair: new Date().toISOString().split('T')[0],
            metode_penyerahan: 'Tunai',
            titip_guru_id: '',
            keterangan: '',
            bukti_transfer: null
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.pelatih_id) {
            setError('Silakan pilih pelatih');
            return;
        }

        if (formData.metode_penyerahan === 'Transfer' && !formData.bukti_transfer) {
            setError('Bukti transfer wajib diunggah untuk metode Transfer');
            return;
        }
        
        if (formData.metode_penyerahan === 'Titip_Guru' && !formData.titip_guru_id) {
            setError('Silakan pilih Guru Pendamping untuk menitipkan honor');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            let response;
            
            // Because we have file, we must use FormData
            const formDataSubmit = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'bukti_transfer') {
                    if (formData.bukti_transfer && formData.metode_penyerahan === 'Transfer') {
                        formDataSubmit.append('bukti_transfer', formData.bukti_transfer);
                    }
                } else if (key === 'titip_guru_id') {
                    if (formData.metode_penyerahan === 'Titip_Guru' && formData.titip_guru_id) {
                         formDataSubmit.append('titip_guru_id', formData.titip_guru_id);
                    }
                } else {
                    formDataSubmit.append(key, formData[key]);
                }
            });

            response = await api.post('/api/admin/honor', formDataSubmit, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                await fetchData();
                setShowForm(false);
                resetForm();
                setSuccess('Honor berhasil dibayarkan');
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(response.data.message || 'Gagal menyimpan data honor');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan pada server');
        } finally {
            setSubmitting(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDelete = async (id, nama, bulan) => {
        if (window.confirm(`Yakin ingin membatalkan/menghapus honor ${nama} untuk bulan ${bulan}?`)) {
            try {
                await api.delete(`/api/admin/honor/${id}`);
                setSuccess('Data honor berhasil dihapus');
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal menghapus data');
                setTimeout(() => setError(''), 3000);
            }
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'sudah dibayar' ? 'belum dibayar' : 'sudah dibayar';
        try {
            const res = await api.put(`/api/admin/honor/${id}/status`, { status: newStatus });
            if (res.data.success) {
                fetchData();
                setSuccess(`Status honor berhasil diubah ke ${newStatus}`);
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Gagal ubah status', err);
            setError('Gagal mengubah status pembayaran');
            setTimeout(() => setError(''), 3000);
        }
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(angka);
    };

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
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight mb-1">
                        {showForm ? 'Pencairan Honor Pelatih' : 'Manajemen Honor Pelatih'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {showForm ? 'Isi formulir pencairan honor bulanan pelatih ekstrakurikuler' : 'Kelola dan rekapitulasi pembayaran gaji/honor bulanan pelatih'}
                    </p>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                    {!showForm && !isReadOnly && (
                        <button
                            type="button"
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                            <Plus size={18} />
                            Bayar Honor
                        </button>
                    )}
                </div>
            </div>

            {/* ALERTS */}
            <div className="space-y-4">
                {error && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 font-bold text-sm flex items-center gap-2">
                        <AlertCircle size={20} />
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

            {/* MONTHLY SUMMARY - Only show on main list view */}
            {!showForm && summaryData.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 px-1">
                        <FileText className="text-[#000080]" size={20} />
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Rekapitulasi Honor Bulanan</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {summaryData.slice(0, 4).map((item, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-blue-50 text-[#000080] rounded-xl group-hover:bg-[#000080] group-hover:text-white transition-colors">
                                        <Save size={18} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.bulan} {item.tahun}</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight">{formatRupiah(item.total_nominal)}</h4>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total {item.jumlah_pelatih} Pelatih</p>
                            </div>
                        ))}
                    </div>

                    {/* Compact Table for full history summary if many months */}
                    {summaryData.length > 4 && (
                        <details className="group">
                            <summary className="text-sm font-bold text-[#000080] hover:underline cursor-pointer flex items-center gap-1 list-none outline-none">
                                <Plus size={14} className="group-open:rotate-45 transition-transform" /> 
                                Lihat Semua Rekap Bulanan
                            </summary>
                            <div className="mt-4 overflow-hidden border border-slate-100 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="p-3 font-bold uppercase tracking-widest text-slate-400">Bulan & Tahun</th>
                                            <th className="p-3 font-bold uppercase tracking-widest text-slate-400 text-center">Jumlah Pelatih</th>
                                            <th className="p-3 font-bold uppercase tracking-widest text-slate-400 text-right">Total Honor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {summaryData.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-3 font-bold text-slate-700">{item.bulan} {item.tahun}</td>
                                                <td className="p-3 text-center font-bold text-slate-500">{item.jumlah_pelatih} Pelatih</td>
                                                <td className="p-3 text-right font-black text-emerald-600">{formatRupiah(item.total_nominal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    )}
                </div>
            )}

            {showForm ? (
                <div className="animate-in fade-in duration-300 space-y-6">
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold relative z-10 cursor-pointer"
                    >
                        <ArrowLeft size={18} /> Kembali ke Daftar
                    </button>

                    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-xl rounded-2xl p-8 space-y-8 relative z-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Data Utama */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Data Pencairan</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Pilih Pelatih Penerima *</label>
                                    <select
                                        name="pelatih_id"
                                        value={formData.pelatih_id}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium bg-white"
                                        required
                                    >
                                        <option value="">-- Pilih Pelatih --</option>
                                        {pelatihs.map(p => (
                                            <option key={p.id} value={p.id}>{p.nama_pelatih} ({p.nama_ekskul || 'Tidak ada ekskul'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Bulan *</label>
                                        <select
                                            name="bulan"
                                            value={formData.bulan}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium bg-white"
                                            required
                                        >
                                            {months.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Tahun *</label>
                                        <input
                                            type="number"
                                            name="tahun"
                                            value={formData.tahun}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium"
                                            min="2020"
                                            max="2050"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Tanggal Cair *</label>
                                    <input
                                        type="date"
                                        name="tanggal_cair"
                                        value={formData.tanggal_cair}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium text-slate-700"
                                        required
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nominal Honor (Rp) *</label>
                                    <input
                                        type="text"
                                        name="nominal"
                                        value={formData.nominal}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            setFormData({...formData, nominal: val});
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium"
                                        placeholder="150.000"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Metode Penyerahan */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[#000080] pl-3">Metode Penyerahan Uang</h3>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Pilih Metode *</label>
                                    <select
                                        name="metode_penyerahan"
                                        value={formData.metode_penyerahan}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium bg-white"
                                        required
                                    >
                                        <option value="Tunai">Langsung / Tunai</option>
                                        <option value="Transfer">Transfer Bank</option>
                                        {/* Tampilkan hanya jika pelatih eksternal (ada guru_id / pendamping) */}
                                        {formData.pelatih_id && pelatihs.find(p => p.id.toString() === formData.pelatih_id.toString())?.guru_id && (
                                            <option value="Titip_Guru">Dititipkan ke Guru Pendamping</option>
                                        )}
                                    </select>
                                </div>

                                {formData.metode_penyerahan === 'Titip_Guru' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-sm font-bold text-slate-700">Guru Penitipan (Otomatis) *</label>
                                        <select
                                            name="titip_guru_id"
                                            value={formData.titip_guru_id}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold outline-none cursor-not-allowed shadow-none"
                                            required
                                            disabled
                                        >
                                            <option value="">-- Pilih Guru --</option>
                                            {gurus.map(g => (
                                                <option key={g.id} value={g.id}>{g.nama_guru}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-emerald-600 font-bold mt-1 inline-flex items-center gap-1.5 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-100">
                                            <CheckCircle size={14} /> Otomatis tertuju pada Guru Pendamping sesuai data pelatih.
                                        </p>
                                    </div>
                                )}

                                {formData.metode_penyerahan === 'Transfer' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-sm font-bold text-slate-700">Upload Bukti Transfer *</label>
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group">
                                            <input 
                                                type="file" 
                                                accept="image/*,.pdf"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                required
                                            />
                                            <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-[#000080] transition-colors">
                                                <FileText size={32} />
                                                <div className="font-bold text-sm">
                                                    {formData.bukti_transfer ? (
                                                        <span className="text-emerald-600">{formData.bukti_transfer.name}</span>
                                                    ) : (
                                                        <span>Klik atau drag berkas ke sini</span>
                                                    )}
                                                </div>
                                                <div className="text-xs font-medium opacity-70">Maks. 5MB (JPG/PNG/PDF)</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 pt-2">
                                    <label className="text-sm font-bold text-slate-700">Catatan / Keterangan Tambahan</label>
                                    <textarea
                                        name="keterangan"
                                        value={formData.keterangan}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium resize-none h-24"
                                        placeholder="Contoh: Ditransfer ke rek BCA atas nama..."
                                    ></textarea>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="text-sm font-bold text-slate-700">Status Pembayaran</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#000080] outline-none font-medium bg-white"
                                    >
                                        <option value="sudah dibayar">Sudah Dibayar (Lunas)</option>
                                        <option value="belum dibayar">Belum Dibayar (Pending)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-slate-100 pt-8 mt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`font-bold py-3.5 px-10 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 shadow-lg ${
                                    submitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#000080] hover:bg-[#000066] text-white'
                                }`}
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Save size={20} />
                                )}
                                Proses Pencairan
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden p-6">
                    {honors.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#000080]/5 text-[#000080] font-bold border-b border-slate-100 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="py-4 px-6 whitespace-nowrap text-center">Periode</th>
                                        <th className="py-4 px-6 whitespace-nowrap">Pelatih (Ekskul)</th>
                                        <th className="py-4 px-6 whitespace-nowrap">Nominal</th>
                                        <th className="py-4 px-6 whitespace-nowrap">Tanggal Cair</th>
                                        <th className="py-4 px-6 whitespace-nowrap">Metode Pembayaran</th>
                                        <th className="py-4 px-6 text-center whitespace-nowrap">Status</th>
                                        {!isReadOnly && <th className="py-4 px-6 text-center whitespace-nowrap">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {honors.map((item) => {
                                        const tglObj = new Date(item.tanggal_cair);
                                        const tglStr = tglObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                                        
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <span className="font-black text-[#000080] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 uppercase tracking-widest text-[10px]">
                                                        {item.bulan.substring(0,3)} {item.tahun}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="font-bold text-slate-800">{item.nama_pelatih}</div>
                                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 mt-0.5">
                                                        {item.nama_ekskul || 'Tanpa Ekskul'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 font-black text-emerald-600 whitespace-nowrap">
                                                    {formatRupiah(item.nominal)}
                                                </td>
                                                <td className="py-4 px-6 text-slate-600 font-bold whitespace-nowrap">
                                                    {tglStr}
                                                </td>
                                                <td className="py-4 px-6 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        {item.metode_penyerahan === 'Transfer' && (
                                                            <span className="inline-flex w-fit items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-amber-200">
                                                                Transfer
                                                            </span>
                                                        )}
                                                        {item.metode_penyerahan === 'Tunai' && (
                                                            <span className="inline-flex w-fit items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                                Langsung / Tunai
                                                            </span>
                                                        )}
                                                        {item.metode_penyerahan === 'Titip_Guru' && (
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="inline-flex w-fit items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-purple-200">
                                                                    Titip Guru
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-500">Via: {item.nama_titip_guru}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    {(item.status === 'sudah dibayar' || !item.status) ? (
                                                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                            Sudah Dibayar
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                                            Belum Dibayar
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {!isReadOnly && (
                                                            <button
                                                                onClick={() => handleToggleStatus(item.id, item.status || 'sudah dibayar')}
                                                                className="inline-flex w-8 h-8 items-center justify-center bg-slate-100 text-slate-600 hover:bg-[#000080] hover:text-white rounded-lg transition-colors font-bold"
                                                                title="Ubah Status"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                        )}
                                                        {item.bukti_transfer && (
                                                            <a
                                                                href={`http://localhost/SIKASA/backend/${item.bukti_transfer}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex w-8 h-8 items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                                                                title="Lihat Bukti"
                                                            >
                                                                <ImageIcon size={14} />
                                                            </a>
                                                        )}
                                                        {!isReadOnly && (
                                                            <button
                                                                onClick={() => handleDelete(item.id, item.nama_pelatih, item.bulan)}
                                                                className="p-2 w-8 h-8 flex justify-center items-center bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                                                                title="Batalkan / Hapus"
                                                            >
                                                                    <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p className="font-bold text-slate-500">Belum ada riwayat pembayaran honor bulan ini</p>
                            {!isReadOnly && (
                                <button
                                    onClick={() => { resetForm(); setShowForm(true); }}
                                    className="mt-4 bg-white hover:bg-slate-50 text-[#000080] font-bold py-2.5 px-6 rounded-xl shadow-sm border border-slate-200 transition-all text-sm inline-flex items-center gap-2"
                                >
                                    <Plus size={16} /> Rekam Honor Baru
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminHonor;
