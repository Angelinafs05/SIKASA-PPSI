import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Calendar, Clock, MapPin, User, Upload, CheckCircle2, AlertCircle, ArrowLeft, FileText, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../api/api';

const SiswaIzinForm = () => {
    const { id } = useParams(); // id is ekskul_id
    const navigate = useNavigate();
    const location = useLocation();
    const [ekskul, setEkskul] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isFinal, setIsFinal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [existingFileUrl, setExistingFileUrl] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'sakit' | 'batalkan'

    // Form fields
    const [tanggal, setTanggal] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('date') ?? '';

    useEffect(() => {
        // We can fetch ekskul detail by ID.
        // Note: the existing endpoint /api/siswa/ekskul/:id works for getting ekskul details.
        fetchEkskulDetail();
    }, [id]);

    useEffect(() => {
        if (id && dateParam) {
            fetchIzinDetail();
        } else {
            setEditMode(false);
            setIsFinal(false);
        }
    }, [id, dateParam]);

    const fetchEkskulDetail = async () => {
        try {
            const response = await api.get(`/api/siswa/ekskul/${id}`);
            if (response.data.success) {
                setEkskul(response.data.data);
            } else {
                setError('Gagal mengambil data ekstrakurikuler');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    const fetchIzinDetail = async () => {
        if (!dateParam) {
            setEditMode(false);
            return;
        }

        try {
            const response = await api.get('/api/siswa/izin', {
                params: { ekskul_id: id, tanggal: dateParam }
            });

            if (response.data.success) {
                const izin = response.data.data?.izin;
                if (izin) {
                    setEditMode(true);
                    setIsFinal(Boolean(Number(izin.is_final || 0)));
                    setTanggal(izin.tanggal || dateParam);
                    setKeterangan(izin.keterangan || '');
                    if (izin.surat_ijin) {
                        const rootUrl = api.defaults.baseURL.replace(/\/backend\/?$/, '');
                        const normalizedPath = izin.surat_ijin.replace(/^\/+/, '');
                        setExistingFileUrl(`${rootUrl}/${normalizedPath}`);
                    }
                } else {
                    setEditMode(false);
                    setIsFinal(false);
                    setTanggal(dateParam);
                    setKeterangan('');
                    setExistingFileUrl('');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Gagal memuat data izin');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tanggal || !keterangan) {
            setError('Harap lengkapi tanggal dan asalan izin');
            return;
        }
        if (!file && !existingFileUrl) {
            setError('Harap unggah surat izin / bukti');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const formData = new FormData();
            formData.append('ekskul_id', id);
            formData.append('tanggal', tanggal);
            formData.append('keterangan', keterangan);
            if (file) {
                formData.append('surat_ijin', file);
            }

            const response = await api.post('/api/siswa/izin', formData);

            if (response.data.success) {
                alert('Surat izin berhasil dikirim!');
                navigate('/siswa');
            } else {
                setError(response.data.message || 'Gagal mengirim izin');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat mengirim izin');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        try {
            setSubmitting(true);
            setError('');

            const response = await api.put('/api/siswa/izin/ubah-status', {
                ekskul_id: id,
                tanggal: tanggal,
                new_status: newStatus
            });

            if (response.data.success) {
                alert(`Status izin berhasil diubah menjadi ${newStatus}!`);
                navigate('/siswa');
            } else {
                setError(response.data.message || `Gagal mengubah status menjadi ${newStatus}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat mengubah status');
        } finally {
            setSubmitting(false);
            setShowConfirmDialog(false);
        }
    };

    const handleCancel = async () => {
        try {
            setSubmitting(true);
            setError('');

            const response = await api.delete('/api/siswa/izin/batalkan', {
                params: { ekskul_id: id, tanggal: tanggal }
            });

            if (response.data.success) {
                alert('Izin berhasil dibatalkan!');
                navigate('/siswa');
            } else {
                setError(response.data.message || 'Gagal membatalkan izin');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat membatalkan izin');
        } finally {
            setSubmitting(false);
            setShowConfirmDialog(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!ekskul && !loading) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-3xl border border-red-100 uppercase font-black tracking-widest text-sm">
                Data ekstrakurikuler tidak ditemukan
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <button
                onClick={() => navigate('/siswa')}
                className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: EKSKUL INFO */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#000080]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                        <div className="relative z-10 space-y-4">
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner border border-orange-100">
                                <FileText size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#000080] uppercase leading-tight mb-2">
                                    {ekskul.nama_ekskul}
                                </h2>
                                <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                    Pengajuan Izin
                                </span>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex items-start gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#000080] shrink-0 mt-0.5">
                                        <Calendar size={16} />
                                    </div>
                                    <div className="text-sm font-bold uppercase tracking-tight flex flex-col">
                                        {ekskul.hari ? ekskul.hari.split(',').map((h, i) => (
                                            <span key={i}>{h.trim()}</span>
                                        )) : <span>-</span>}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                                        <Clock size={16} />
                                    </div>
                                    <div className="text-sm font-bold flex flex-col">
                                        {ekskul.jam ? ekskul.jam.split(',').map((j, i) => (
                                            <span key={i}>{j.trim()}</span>
                                        )) : <span>-</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-emerald-600">
                                        <MapPin size={16} />
                                    </div>
                                    <p className="text-sm font-bold">R. {ekskul.tempat || '-'}</p>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-rose-600">
                                        <User size={16} />
                                    </div>
                                    <p className="text-sm font-bold">{ekskul.pelatih_nama || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: FORM */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 flex flex-col items-center">
                        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-6 shadow-inner border border-orange-100">
                            <FileText size={32} />
                        </div>

                        <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center">
                            {editMode ? 'Edit Pengajuan Izin' : 'Form Pengajuan Izin'}
                        </h1>
                        <p className="text-slate-500 font-medium max-w-md mt-2 mb-4 text-center">
                            Lengkapi form di bawah ini dan unggah foto **Surat Izin** / bukti ketidakhadiranmu.
                        </p>

                        {isFinal && (
                            <div className="w-full bg-amber-50 text-amber-800 p-4 rounded-2xl flex items-center gap-3 border border-amber-100 mb-6 text-left">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-sm font-bold">Izin ini sudah final dan tidak dapat diubah.</p>
                            </div>
                        )}

                        {error && (
                            <div className="w-full bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 mb-6 text-left">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <div className="w-full space-y-5 mb-8 text-left">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Izin <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    value={tanggal}
                                    onChange={(e) => setTanggal(e.target.value)}
                                    disabled={isFinal}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Alasan / Keterangan <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    disabled={isFinal}
                                    placeholder="Contoh: Sakit demam, Acara keluarga, dll"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
                                />
                            </div>
                        </div>

                        {/* UPLOAD AREA */}
                        <div className="w-full group">
                            <label className="block text-sm font-bold text-slate-700 mb-2 text-left">Surat Izin / Bukti <span className="text-red-500">*</span></label>
                            <label className={`
                                w-full min-h-[200px] rounded-[1.8rem] border-2 border-dashed 
                                flex flex-col items-center justify-center p-6 transition-all cursor-pointer relative overflow-hidden
                                ${preview || existingFileUrl ? 'border-orange-500 bg-orange-50/20' : 'border-slate-200 hover:border-orange-500 hover:bg-slate-50'}
                            `}>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    disabled={isFinal}
                                />

                                {preview ? (
                                    <div className="absolute inset-0 w-full h-full p-2 group-hover:opacity-75 transition-opacity">
                                        <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-2xl" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white font-black text-xs uppercase tracking-widest">
                                            Ganti Gambar
                                        </div>
                                    </div>
                                ) : existingFileUrl ? (
                                    <div className="text-slate-500 text-center space-y-3">
                                        <Upload size={40} strokeWidth={1} className="mx-auto" />
                                        <p className="font-black text-sm uppercase tracking-widest">Lampiran Saat Ini</p>
                                        <a href={existingFileUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-orange-600 underline">
                                            {existingFileUrl.split('/').pop()}
                                        </a>
                                        {!isFinal && (
                                            <p className="text-[10px] italic">Unggah file baru untuk mengganti lampiran.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400 group-hover:text-orange-600 transition-colors">
                                        <Upload size={40} strokeWidth={1} className="mb-4" />
                                        <p className="font-black text-sm uppercase tracking-widest">Pilih File / Foto</p>
                                        <p className="text-[10px] mt-1 italic">Maksimal 2MB (JPG, PNG, PDF)</p>
                                    </div>
                                )}
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isFinal || !tanggal || !keterangan || submitting || (!file && !existingFileUrl)}
                            className={`
                                w-full mt-10 py-4 rounded-2xl font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 shadow-xl
                                ${!isFinal && tanggal && keterangan && (file || existingFileUrl) && !submitting
                                    ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20 active:scale-95'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                            `}
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Mengirim...
                                </>
                            ) : (
                                <>
                                    {editMode ? (isFinal ? 'Izin Final' : 'Perbarui Surat Izin') : 'Kirim Surat Izin'} <CheckCircle2 size={18} />
                                </>
                            )}
                        </button>

                        {/* ACTION BUTTONS (EDIT MODE ONLY) */}
                        {editMode && !isFinal && (
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConfirmAction('sakit');
                                        setShowConfirmDialog(true);
                                    }}
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-amber-50 text-amber-700 font-bold rounded-xl hover:bg-amber-100 transition border border-amber-200 disabled:opacity-50"
                                >
                                    <AlertTriangle size={16} className="inline mr-2" />
                                    Ubah ke Sakit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConfirmAction('batalkan');
                                        setShowConfirmDialog(true);
                                    }}
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-rose-50 text-rose-700 font-bold rounded-xl hover:bg-rose-100 transition border border-rose-200 disabled:opacity-50"
                                >
                                    <Trash2 size={16} className="inline mr-2" />
                                    Batalkan Izin
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* CONFIRMATION DIALOG */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <AlertTriangle size={32} />
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 text-center mb-2">
                            {confirmAction === 'sakit' ? 'Ubah ke Sakit?' : 'Batalkan Izin?'}
                        </h3>
                        <p className="text-slate-600 text-center text-sm mb-6">
                            {confirmAction === 'sakit' 
                                ? 'Status izin akan diubah menjadi "Sakit". Tindakan ini tidak dapat dibatalkan.'
                                : 'Izin akan dibatalkan dan dihapus. Data ini tidak dapat dikembalikan.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                disabled={submitting}
                                className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmAction === 'sakit') {
                                        handleUpdateStatus('Sakit');
                                    } else {
                                        handleCancel();
                                    }
                                }}
                                disabled={submitting}
                                className={`flex-1 py-2 font-bold rounded-lg transition disabled:opacity-50 ${
                                    confirmAction === 'sakit'
                                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                                        : 'bg-rose-600 text-white hover:bg-rose-700'
                                }`}
                            >
                                {submitting ? 'Proses...' : 'Lanjutkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiswaIzinForm;
