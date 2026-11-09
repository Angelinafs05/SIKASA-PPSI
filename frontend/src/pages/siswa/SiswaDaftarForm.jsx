import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Clock, MapPin, User, Upload, CheckCircle2, AlertCircle, ArrowLeft, Camera, AlertTriangle, HelpCircle } from 'lucide-react';
import api from '../../api/api';

// Helper parsing range waktu (e.g. "14:00 - 15:30")
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
    if (!r1 || !r2) return true; // Anggap bentrok jika hari sama tapi format jam bebas

    return (r1.start < r2.end) && (r2.start < r1.end);
};

const SiswaDaftarForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ekskul, setEkskul] = useState(null);
    const [myEkskuls, setMyEkskuls] = useState([]);
    const [conflictEkskul, setConflictEkskul] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [resTarget, resDashboard] = await Promise.all([
                api.get(`/api/siswa/ekskul/${id}`),
                api.get('/api/siswa/dashboard')
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

        if (conflictEkskul) {
            setError(`Jadwal bertabrakan dengan ekskul ${conflictEkskul.nama_ekskul}. Anda harus memilih salah satu.`);
            return;
        }

        if (!file) {
            setError('Harap unggah foto surat izin orang tua');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            const formData = new FormData();
            formData.append('ekskul_id', id);
            formData.append('surat_ijin', file);

            const response = await api.post('/api/siswa/daftar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                alert('Pendaftaran berhasil! Tunggu persetujuan dari Admin.');
                navigate('/siswa/ekskul');
            } else {
                setError(response.data.message || 'Gagal mendaftar');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat mendaftar');
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
        <div className="max-w-4xl mx-auto space-y-8 pb-10 font-sans">
            <button
                onClick={() => navigate('/siswa/ekskul')}
                className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar Ekskul
            </button>

            {/* MODAL / BANNER PERINGATAN JADWAL BERTABRAKAN */}
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
                                Anda sudah terdaftar pada ekstrakurikuler <strong className="underline decoration-rose-500 decoration-2">{conflictEkskul.nama_ekskul}</strong> dengan jadwal latihan hari <strong>{conflictEkskul.hari}</strong> pukul <strong>{conflictEkskul.jam}</strong>.
                            </p>
                            <p className="text-rose-800 font-semibold text-sm leading-relaxed">
                                Ekskul <strong className="underline decoration-rose-500 decoration-2">{ekskul.nama_ekskul}</strong> yang ingin Anda daftar juga dilaksanakan pada hari <strong>{ekskul.hari}</strong> pukul <strong>{ekskul.jam}</strong>.
                            </p>
                            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-rose-200 text-xs font-bold text-slate-700 space-y-1">
                                <p className="text-rose-700 font-black flex items-center gap-1.5 uppercase tracking-wide">
                                    <HelpCircle size={15} /> Arahan Sistem:
                                </p>
                                <p>
                                    Anda <strong>hanya dapat memilih salah satu</strong> dari kedua ekstrakurikuler tersebut agar kehadiran dan jadwal latihan Anda tidak saling mengganggu.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button
                                    onClick={() => navigate('/siswa/ekskul')}
                                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md shadow-rose-600/30 active:scale-95 transition-all"
                                >
                                    Pilih Ekskul Lain
                                </button>
                                <button
                                    onClick={() => navigate('/siswa')}
                                    className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 shadow-sm active:scale-95 transition-all"
                                >
                                    Kembali ke Dashboard Saya
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: EKSKUL INFO */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#000080]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

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
                                    <p className="text-sm font-bold">{ekskul.tempat ? `R. ${ekskul.tempat}` : '-'}</p>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-rose-600">
                                        <User size={16} />
                                    </div>
                                    <p className="text-sm font-bold">{ekskul.nama_pelatih || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: FORM UPLOAD */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
                            <Camera size={32} />
                        </div>

                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Form Pendaftaran</h1>
                        <p className="text-slate-500 font-medium max-w-md mt-2 mb-8">
                            Harap unggah foto <strong>Surat Izin Orang Tua</strong> yang sudah ditandatangani untuk melanjutkan pendaftaran.
                        </p>

                        {error && (
                            <div className="w-full bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 mb-6 text-left">
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        {/* UPLOAD AREA */}
                        <div className="w-full group">
                            <label className={`
                                w-full min-h-[250px] rounded-[1.8rem] border-2 border-dashed 
                                flex flex-col items-center justify-center p-6 transition-all relative overflow-hidden
                                ${conflictEkskul ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed' : preview ? 'border-emerald-500 bg-emerald-50/20 cursor-pointer' : 'border-slate-200 hover:border-[#000080] hover:bg-slate-50 cursor-pointer'}
                            `}>
                                <input
                                    type="file"
                                    disabled={Boolean(conflictEkskul)}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                />

                                {preview ? (
                                    <div className="absolute inset-0 w-full h-full p-2 group-hover:opacity-75 transition-opacity">
                                        <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-2xl" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white font-black text-xs uppercase tracking-widest">
                                            Ganti Gambar
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400 group-hover:text-[#000080] transition-colors">
                                        <Upload size={48} strokeWidth={1} className="mb-4" />
                                        <p className="font-black text-sm uppercase tracking-widest">Pilih File / Foto</p>
                                        <p className="text-[10px] mt-1 italic">Maksimal 2MB (JPG, PNG, PDF)</p>
                                    </div>
                                )}
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={!file || submitting || Boolean(conflictEkskul)}
                            className={`
                                w-full mt-10 py-4 rounded-2xl font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 shadow-xl
                                ${file && !submitting && !conflictEkskul
                                    ? 'bg-[#000080] text-white hover:bg-blue-900 shadow-blue-900/20 active:scale-95'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                            `}
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Memproses...
                                </>
                            ) : conflictEkskul ? (
                                <>
                                    Jadwal Bertabrakan (Pilih Salah Satu)
                                </>
                            ) : (
                                <>
                                    Daftar Sekarang <CheckCircle2 size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SiswaDaftarForm;
