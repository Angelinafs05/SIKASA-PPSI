import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Clock, MapPin, User, Upload, CheckCircle2, AlertCircle, ArrowLeft, Camera } from 'lucide-react';
import api from '../../api/api';

const SiswaDaftarForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ekskul, setEkskul] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        fetchEkskulDetail();
    }, [id]);

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
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <button
                onClick={() => navigate('/siswa/ekskul')}
                className="flex items-center gap-2 text-slate-500 hover:text-[#000080] font-bold transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar
            </button>

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
                                    <p className="text-sm font-bold">R. {ekskul.tempat || '-'}</p>
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
                            Harap unggah foto **Surat Izin Orang Tua** yang sudah ditandatangani untuk melanjutkan pendaftaran.
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
                                flex flex-col items-center justify-center p-6 transition-all cursor-pointer relative overflow-hidden
                                ${preview ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 hover:border-[#000080] hover:bg-slate-50'}
                            `}>
                                <input
                                    type="file"
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
                            disabled={!file || submitting}
                            className={`
                                w-full mt-10 py-4 rounded-2xl font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 shadow-xl
                                ${file && !submitting
                                    ? 'bg-[#000080] text-white hover:bg-blue-900 shadow-blue-900/20 active:scale-95'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                            `}
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Memproses...
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
