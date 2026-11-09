import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Trophy, Calendar, Clock, MapPin, User, Upload, CheckCircle2, 
    AlertCircle, ArrowLeft, Camera, AlertTriangle, HelpCircle, 
    FileText, Download, Eye, PenTool, Sparkles, ShieldCheck
} from 'lucide-react';
import api from '../../api/api';
import SignatureCanvas from '../../components/SignatureCanvas';
import { generateAngketPendaftaranPDF } from '../../utils/angketPdfGenerator';

// Helper parsing range waktu
const parseTimeRange = (timeStr) => {
    if (!timeStr) return null;
    const clean = timeStr.replace(/\./g, ':');
    const match = clean.match(/(\d{1,2}:\d{2})\s*[-–s\/d]+\s*(\d{1,2}:\d{2})/);
    if (!match) return null;
    const toMinutes = (s) => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m;
    };
    return { start: toMinutes(match[1]), end: toMinutes(match[2]) };
};

const checkConflict = (hari1, jam1, hari2, jam2) => {
    if (!hari1 || !jam1 || !hari2 || !jam2) return false;
    const h1List = hari1.toLowerCase().split(',').map(s => s.trim());
    const h2List = hari2.toLowerCase().split(',').map(s => s.trim());
    const sameDay = h1List.some(h => h2List.includes(h) && h !== '');
    if (!sameDay) return false;

    const r1 = parseTimeRange(jam1);
    const r2 = parseTimeRange(jam2);
    if (!r1 || !r2) return true;

    return (r1.start < r2.end) && (r2.start < r1.end);
};

const SiswaDaftarForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [ekskul, setEkskul] = useState(null);
    const [allEkskuls, setAllEkskuls] = useState([]);
    const [myEkskuls, setMyEkskuls] = useState([]);
    const [siswaProfile, setSiswaProfile] = useState(null);
    const [conflictEkskul, setConflictEkskul] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('template'); // 'template' (Otomatis) | 'upload' (Manual)

    // Form Angket Persetujuan Orang Tua
    const [angketData, setAngketData] = useState({
        namaOrangTua: '',
        hubungan: 'Orang Tua / Wali',
        pilihan2: '',
        pernyataanSetuju: true
    });
    const [signatureDataUrl, setSignatureDataUrl] = useState(null);
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
    const [previewPdfUrl, setPreviewPdfUrl] = useState(null);

    // Form Upload Manual
    const [manualFile, setManualFile] = useState(null);
    const [manualPreview, setManualPreview] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [resTarget, resDashboard, resProfil, resEkskulList] = await Promise.all([
                api.get(`/api/siswa/ekskul/${id}`),
                api.get('/api/siswa/dashboard'),
                api.get('/api/siswa/profil'),
                api.get('/api/siswa/ekskul').catch(() => ({ data: { data: [] } }))
            ]);

            let target = null;
            if (resTarget.data.success) {
                target = resTarget.data.data;
                setEkskul(target);
            } else {
                setError('Gagal mengambil data ekstrakurikuler');
            }

            let myApproved = [];
            if (resDashboard.data.success) {
                myApproved = resDashboard.data.data.my_ekskuls || [];
                setMyEkskuls(myApproved);
            }

            if (resProfil.data.success) {
                const sp = resProfil.data.data;
                setSiswaProfile(sp);
                // Pre-fill nama orang tua jika sudah ada di database siswa
                setAngketData(prev => ({
                    ...prev,
                    namaOrangTua: sp.nama_ayah || sp.nama_ibu || ''
                }));
            }

            if (resEkskulList.data.success) {
                setAllEkskuls(resEkskulList.data.data || []);
            }

            // Validasi batas kuota maksimal 2 ekskul
            if (myApproved.length >= 2) {
                setError('Anda telah terdaftar pada 2 ekstrakurikuler. Sesuai kebijakan sekolah, setiap siswa hanya diperbolehkan mengikuti maksimal 2 ekstrakurikuler.');
            }

            // Validasi tabrakan / bentrok jadwal
            if (target && myApproved.length > 0) {
                const bentrok = myApproved.find(my =>
                    String(my.ekskul_id || my.id) !== String(target.id) &&
                    checkConflict(target.hari, target.jam, my.hari, my.jam)
                );
                if (bentrok) {
                    setConflictEkskul(bentrok);
                }
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    const handleManualFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setManualFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setManualPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    // Generate dan Download Dokumen Angket Resmi
    const handleDownloadAngketPDF = async () => {
        if (!siswaProfile || !ekskul) return;
        try {
            const result = await generateAngketPendaftaranPDF({
                namaSiswa: siswaProfile.nama_siswa,
                kelasNama: siswaProfile.nama_kelas,
                noInduk: siswaProfile.no_induk,
                namaEkskulPilihan1: ekskul.nama_ekskul,
                namaEkskulPilihan2: angketData.pilihan2 || '-',
                tahunPelajaran: '2025 - 2026',
                namaOrangTua: angketData.namaOrangTua || 'Orang Tua / Wali Siswa',
                hubungan: angketData.hubungan,
                tandaTanganDataUrl: signatureDataUrl
            });
            result.save();
        } catch (err) {
            alert('Gagal membuat file PDF angket: ' + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (conflictEkskul) {
            setError(`Jadwal bertabrakan dengan ekskul ${conflictEkskul.nama_ekskul}. Anda harus memilih salah satu.`);
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            let fileToUpload = null;

            if (activeTab === 'template') {
                if (!angketData.namaOrangTua.trim()) {
                    setError('Mohon masukkan nama Orang Tua / Wali yang menyetujui angket.');
                    setSubmitting(false);
                    return;
                }
                if (!signatureDataUrl) {
                    setError('Mohon goreskan tanda tangan Orang Tua / Wali pada area digital.');
                    setSubmitting(false);
                    return;
                }
                if (!angketData.pernyataanSetuju) {
                    setError('Pernyataan persetujuan harus dicentang.');
                    setSubmitting(false);
                    return;
                }

                // Generate PDF Dokumen Angket secara otomatis di client!
                const pdfResult = await generateAngketPendaftaranPDF({
                    namaSiswa: siswaProfile.nama_siswa,
                    kelasNama: siswaProfile.nama_kelas,
                    noInduk: siswaProfile.no_induk,
                    namaEkskulPilihan1: ekskul.nama_ekskul,
                    namaEkskulPilihan2: angketData.pilihan2 || '-',
                    tahunPelajaran: '2025 - 2026',
                    namaOrangTua: angketData.namaOrangTua,
                    hubungan: angketData.hubungan,
                    tandaTanganDataUrl: signatureDataUrl
                });

                fileToUpload = new File([pdfResult.blob], pdfResult.fileName, { type: 'application/pdf' });
            } else {
                if (!manualFile) {
                    setError('Harap pilih berkas foto / dokumen surat izin untuk diunggah.');
                    setSubmitting(false);
                    return;
                }
                fileToUpload = manualFile;
            }

            const formData = new FormData();
            formData.append('ekskul_id', id);
            formData.append('surat_ijin', fileToUpload);

            const response = await api.post('/api/siswa/daftar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                alert('Pendaftaran berhasil! Dokumen angket persetujuan orang tua telah terisi dan terkirim otomatis ke Admin.');
                navigate('/siswa/ekskul');
            } else {
                setError(response.data.message || 'Gagal mendaftar');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat memproses pendaftaran');
        } finally {
            setSubmitting(false);
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
        <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
            <button
                onClick={() => navigate('/siswa/ekskul')}
                className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold transition-colors group cursor-pointer"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar Ekskul
            </button>

            {/* PERINGATAN JADWAL BERTABRAKAN */}
            {conflictEkskul && (
                <div className="bg-gradient-to-br from-rose-50 to-orange-50 border-2 border-rose-300 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden animate-shake">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                            <AlertTriangle size={36} />
                        </div>
                        <div className="space-y-3 flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-200/60 text-rose-800 rounded-full text-xs font-black uppercase tracking-wider">
                                Peringatan: Jadwal Bertabrakan (Bentrok)
                            </div>
                            <h2 className="text-2xl font-black text-rose-900 tracking-tight">
                                Waktu Latihan Bertabrakan!
                            </h2>
                            <p className="text-rose-800 font-semibold text-sm leading-relaxed">
                                Anda sudah terdaftar pada ekskul <strong className="underline decoration-rose-500 decoration-2">{conflictEkskul.nama_ekskul}</strong> ({conflictEkskul.hari} jam {conflictEkskul.jam}).
                            </p>
                            <p className="text-rose-800 font-semibold text-sm leading-relaxed">
                                Ekskul <strong className="underline decoration-rose-500 decoration-2">{ekskul.nama_ekskul}</strong> juga dilaksanakan pada hari yang sama ({ekskul.hari} jam {ekskul.jam}).
                            </p>
                            <div className="bg-white/80 p-4 rounded-2xl border border-rose-200 text-xs font-bold text-slate-700">
                                Siswa hanya diperbolehkan memilih salah satu agar kegiatan tidak terganggu.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: EKSKUL INFO & ANGKET PREVIEW */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 overflow-hidden relative">
                        <div className="relative z-10 space-y-4">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#000080] shadow-inner border border-blue-100">
                                <Trophy size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-[#000080] uppercase leading-tight mb-2">
                                    {ekskul.nama_ekskul}
                                </h2>
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                    Pendaftaran Baru
                                </span>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100 text-sm">
                                <div className="flex items-start gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#000080] shrink-0 mt-0.5">
                                        <Calendar size={16} />
                                    </div>
                                    <div className="font-bold uppercase tracking-tight flex flex-col">
                                        <span>{ekskul.hari || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                                        <Clock size={16} />
                                    </div>
                                    <div className="font-bold">
                                        <span>{ekskul.jam || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-emerald-600">
                                        <MapPin size={16} />
                                    </div>
                                    <p className="font-bold">{ekskul.tempat ? `R. ${ekskul.tempat}` : '-'}</p>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-rose-600">
                                        <User size={16} />
                                    </div>
                                    <p className="font-bold">{ekskul.nama_pelatih || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PREVIEW KOTAK INFO TEMPLATE */}
                    <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-6 rounded-[2rem] border border-blue-100 space-y-3">
                        <div className="flex items-center gap-2 text-[#000080] font-black text-xs uppercase tracking-wider">
                            <Sparkles size={16} /> Template Angket Otomatis
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            Formulir ini menggunakan format resmi <strong>SMP Katolik Santa Maria II</strong>. Dokumen PDF akan digenerate otomatis beserta kop surat, nomor surat, dan tanda tangan digital.
                        </p>
                        <button
                            type="button"
                            onClick={handleDownloadAngketPDF}
                            className="w-full mt-2 py-2.5 px-4 bg-white hover:bg-slate-50 text-[#000080] border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                            <Download size={14} /> Download Lembar Template (PDF)
                        </button>
                    </div>
                </div>

                {/* RIGHT: FORM ANGKET & PERSETUJUAN ORANG TUA */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                        {/* TAB PILIHAN METODE */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                            <button
                                type="button"
                                onClick={() => setActiveTab('template')}
                                className={`flex-1 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === 'template'
                                        ? 'bg-[#000080] text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Sparkles size={16} /> Isi Angket Otomatis (Direkomendasikan)
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('upload')}
                                className={`flex-1 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    activeTab === 'upload'
                                        ? 'bg-[#000080] text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Camera size={16} /> Upload Foto Fisik
                            </button>
                        </div>

                        {error && (
                            <div className="w-full bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 mb-6 text-left">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {activeTab === 'template' ? (
                                <>
                                    {/* DATA SISWA (READ-ONLY) */}
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-left">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Data Calon Peserta Ekskul</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-xs text-slate-400 block font-bold">Nama Lengkap</span>
                                                <span className="font-bold text-slate-800">{siswaProfile?.nama_siswa || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block font-bold">Kelas / No. Induk</span>
                                                <span className="font-bold text-slate-800">{siswaProfile?.nama_kelas || '-'} / {siswaProfile?.no_induk || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PILIHAN EKSTRAKURIKULER */}
                                    <div className="space-y-4 text-left">
                                        <div>
                                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                                                1. Pilihan Ekstrakurikuler Utama (Pilihan 1)
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={ekskul.nama_ekskul}
                                                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-[#000080] outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                                                2. Pilihan Ekstrakurikuler Kedua (Opsional)
                                            </label>
                                            <select
                                                value={angketData.pilihan2}
                                                onChange={(e) => setAngketData({ ...angketData, pilihan2: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                                            >
                                                <option value="">-- Tidak Memilih Pilihan 2 (-) --</option>
                                                {allEkskuls
                                                    .filter(e => String(e.id) !== String(ekskul.id))
                                                    .map(e => (
                                                        <option key={e.id} value={e.nama_ekskul}>
                                                            {e.nama_ekskul} ({e.hari || 'Jadwal belum ditentukan'})
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    {/* DATA ORANG TUA / WALI */}
                                    <div className="space-y-4 text-left pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
                                            <ShieldCheck size={18} className="text-[#000080]" />
                                            Persetujuan Orang Tua / Wali Siswa
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                                                    Nama Lengkap Orang Tua / Wali *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Contoh: Bpk. Stefanus / Suster Emiliana"
                                                    value={angketData.namaOrangTua}
                                                    onChange={(e) => setAngketData({ ...angketData, namaOrangTua: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                                                    Status Hubungan
                                                </label>
                                                <select
                                                    value={angketData.hubungan}
                                                    onChange={(e) => setAngketData({ ...angketData, hubungan: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                                                >
                                                    <option value="Orang Tua / Wali">Orang Tua / Wali</option>
                                                    <option value="Ayah Kandung">Ayah Kandung</option>
                                                    <option value="Ibu Kandung">Ibu Kandung</option>
                                                    <option value="Suster / Asrama">Suster / Wali Asrama</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* TANDA TANGAN DIGITAL */}
                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                                <span>Tanda Tangan Digital Orang Tua / Wali *</span>
                                                {signatureDataUrl && (
                                                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle2 size={13} /> Tanda tangan terekam
                                                    </span>
                                                )}
                                            </label>
                                            <SignatureCanvas
                                                onSave={(dataUrl) => setSignatureDataUrl(dataUrl)}
                                                onClear={() => setSignatureDataUrl(null)}
                                            />
                                        </div>

                                        {/* CHECKBOX PERNYATAAN */}
                                        <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={angketData.pernyataanSetuju}
                                                onChange={(e) => setAngketData({ ...angketData, pernyataanSetuju: e.target.checked })}
                                                className="mt-1 w-4 h-4 text-[#000080] rounded focus:ring-[#000080]"
                                            />
                                            <span className="text-xs text-slate-600 font-medium leading-relaxed">
                                                Kami menyatakan dengan sebenarnya bahwa ekstrakurikuler tersebut adalah kegiatan yang kami pilih dan jalani selama Tahun Pelajaran 2025 - 2026 di SMP Katolik Santa Maria II Malang.
                                            </span>
                                        </label>
                                    </div>
                                </>
                            ) : (
                                /* TAB UPLOAD BERKAS MANUAL */
                                <div className="space-y-4 text-center">
                                    <p className="text-slate-500 font-medium text-sm">
                                        Unggah foto angket fisik yang sudah dicetak dan ditandatangani manual oleh orang tua.
                                    </p>

                                    <div className="w-full group">
                                        <label className={`
                                            w-full min-h-[220px] rounded-[1.8rem] border-2 border-dashed 
                                            flex flex-col items-center justify-center p-6 transition-all relative overflow-hidden
                                            ${manualPreview ? 'border-emerald-500 bg-emerald-50/20 cursor-pointer' : 'border-slate-200 hover:border-[#000080] hover:bg-slate-50 cursor-pointer'}
                                        `}>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={handleManualFileChange}
                                            />

                                            {manualPreview ? (
                                                <div className="absolute inset-0 w-full h-full p-2 group-hover:opacity-75 transition-opacity">
                                                    <img src={manualPreview} alt="Preview" className="w-full h-full object-contain rounded-2xl" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white font-black text-xs uppercase tracking-widest">
                                                        Ganti Gambar
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400 group-hover:text-[#000080] transition-colors">
                                                    <Upload size={44} strokeWidth={1} className="mb-3" />
                                                    <p className="font-black text-sm uppercase tracking-widest">Pilih File / Foto Angket</p>
                                                    <p className="text-[10px] mt-1 italic">Maksimal 2MB (JPG, PNG, PDF)</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                disabled={submitting || Boolean(conflictEkskul)}
                                className={`
                                    w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 shadow-xl cursor-pointer
                                    ${!submitting && !conflictEkskul
                                        ? 'bg-[#000080] text-white hover:bg-blue-900 shadow-blue-900/20 active:scale-95'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Membuat Dokumen Angket & Mendaftar...
                                    </>
                                ) : conflictEkskul ? (
                                    <>Jadwal Bertabrakan (Pilih Salah Satu)</>
                                ) : (
                                    <>
                                        Daftar & Kirim Angket Resmi <CheckCircle2 size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiswaDaftarForm;
