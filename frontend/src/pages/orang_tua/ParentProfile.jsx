import React, { useState, useEffect } from 'react';
import { User, KeyRound, AlertCircle, CheckCircle2, Save, Shield, AtSign, Users } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const ParentProfile = () => {
    const { user } = useAuth();
    const [profil, setProfil] = useState({
        nama: '',
        username: ''
    });
    const [passwords, setPasswords] = useState({
        password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfil();
    }, []);

    const fetchProfil = async () => {
        try {
            const response = await api.get('/api/parent/profil');
            if (response.data.success) {
                setProfil({
                    nama: response.data.data.nama,
                    username: response.data.data.username
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
            setMessage({ type: 'error', text: 'Gagal mengambil data profil' });
        } finally {
            setLoading(false);
        }
    };

    const handleProfilChange = (e) => {
        setProfil({ ...profil, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.password && passwords.password !== passwords.confirm_password) {
            setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok!' });
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...profil,
                password: passwords.password || undefined
            };

            const response = await api.put('/api/parent/profil', payload);
            if (response.data.success) {
                setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
                setPasswords({ password: '', confirm_password: '' });
                // If username changed, we might need to refresh auth, but usually it's fine
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Gagal memperbarui profil.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <User className="text-[#000080]" size={36} /> Profil Saya
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Kelola informasi akun Orang Tua Anda di SIKASA.
                    </p>
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 border ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertCircle className="shrink-0 mt-0.5" size={20} />}
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Overview Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#000080]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-[2rem] flex items-center justify-center text-[#000080] shadow-inner mb-4 mx-auto border-4 border-white shadow-xl relative z-10">
                            <span className="text-4xl font-black">{profil.nama.charAt(0)}</span>
                        </div>

                        <h2 className="text-xl font-black text-slate-800 leading-tight relative z-10">{profil.nama}</h2>
                        <p className="text-[#000080] font-bold text-xs uppercase tracking-[0.2em] mt-2 relative z-10">Akun Orang Tua</p>

                        <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <AtSign size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Username</p>
                                    <p className="text-sm font-bold text-slate-700">{profil.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Akun</p>
                                    <p className="text-sm font-bold text-emerald-600">Aktif & Terverifikasi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form Card */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 space-y-8">
                        {/* Section: Basic Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <User className="text-slate-400" size={20} />
                                <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Informasi Dasar</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        name="nama"
                                        value={profil.nama}
                                        onChange={handleProfilChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#000080]/20 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={profil.username}
                                        onChange={handleProfilChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#000080]/20 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Security */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <KeyRound className="text-slate-400" size={20} />
                                <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">Keamanan</h3>
                            </div>
                            
                            <p className="text-xs text-slate-400 font-medium italic">Kosongkan jika tidak ingin mengubah password.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={passwords.password}
                                        onChange={handlePasswordChange}
                                        placeholder="Min. 6 karakter"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#000080]/20 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all"
                                        minLength="6"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ulangi Password</label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        value={passwords.confirm_password}
                                        onChange={handlePasswordChange}
                                        placeholder="Konfirmasi password"
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#000080]/20 focus:bg-white rounded-2xl text-sm font-bold text-slate-700 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${submitting
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-[#000080] text-white hover:bg-blue-900 shadow-2xl shadow-blue-900/20 hover:-translate-y-1'
                                }`}
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Menyimpan Perubahan...
                                </>
                            ) : (
                                <>
                                    <Save size={20} /> Simpan Perubahan Profil
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ParentProfile;
