import React, { useState, useEffect } from 'react';
import { User, KeyRound, AlertCircle, CheckCircle2, Save, Calendar, Phone, BookOpen, Shield, Trophy } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const PelatihProfil = () => {
    const { user } = useAuth();
    const [profil, setProfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Password state
    const [passwords, setPasswords] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfil();
    }, []);

    const fetchProfil = async () => {
        try {
            const response = await api.get('/api/pelatih/profil');
            if (response.data.success) {
                setProfil(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwords.new_password !== passwords.confirm_password) {
            setMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok!' });
            return;
        }

        if (passwords.new_password.length < 6) {
            setMessage({ type: 'error', text: 'Password baru minimal 6 karakter!' });
            return;
        }

        try {
            setSubmitting(true);
            const response = await api.put('/api/pelatih/profil/password', {
                old_password: passwords.old_password,
                new_password: passwords.new_password
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message || 'Password berhasil diperbarui!' });
                setPasswords({ old_password: '', new_password: '', confirm_password: '' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Gagal memperbarui password.'
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
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <User className="text-[#000080]" size={36} /> Profil Saya
            </h1>
            <p className="text-slate-500 font-medium pb-4 border-b border-slate-200">
                Kelola informasi pribadi dan keamanan akun Anda.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* LEFT: Profile Info Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#000080]/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                        <div className="relative z-10 flex flex-col items-centertext-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center text-[#000080] shadow-inner mb-4 mx-auto border-4 border-white shadow-xl">
                                <span className="text-4xl font-black">{profil?.nama_pelatih?.charAt(0) || 'U'}</span>
                            </div>

                            <h2 className="text-xl font-black text-slate-800 text-center leading-tight">
                                {profil?.nama_pelatih}
                            </h2>
                            <p className="text-[#000080] font-bold text-sm uppercase tracking-widest text-center mt-1">
                                Pelatih
                            </p>

                            <div className="mt-8 space-y-4 w-full">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Trophy size={16} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ekskul</p>
                                        <p className="font-bold text-slate-700 truncate">{profil?.nama_ekskul || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <User size={16} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Username</p>
                                        <p className="font-bold text-slate-700 truncate">{profil?.username || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Phone size={16} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No. HP</p>
                                        <p className="font-bold text-slate-700 truncate">{profil?.no_hp || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <BookOpen size={16} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guru Pendamping</p>
                                        <p className="font-bold text-slate-700 truncate">
                                            {profil?.pendamping_nama || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Security Settings */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Keamanan Akun</h3>
                                <p className="text-sm text-slate-500 font-medium">Perbarui kata sandi Anda untuk menjaga keamanan akun.</p>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`p-4 rounded-2xl flex items-start gap-3 border mb-6 ${message.type === 'success'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                {message.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={20} /> : <AlertCircle className="shrink-0 mt-0.5" size={20} />}
                                <p className="text-sm font-bold">{message.text}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmitPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password Saat Ini</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <KeyRound size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            name="old_password"
                                            value={passwords.old_password}
                                            onChange={handlePasswordChange}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#000080]/20 focus:bg-white rounded-xl text-sm font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                                            placeholder="Masukkan password saat ini"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password Baru</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                <KeyRound size={18} />
                                            </div>
                                            <input
                                                type="password"
                                                name="new_password"
                                                value={passwords.new_password}
                                                onChange={handlePasswordChange}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#000080]/20 focus:bg-white rounded-xl text-sm font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                                                placeholder="Minimal 6 karakter"
                                                required
                                                minLength="6"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ulangi Password Baru</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                <KeyRound size={18} />
                                            </div>
                                            <input
                                                type="password"
                                                name="confirm_password"
                                                value={passwords.confirm_password}
                                                onChange={handlePasswordChange}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#000080]/20 focus:bg-white rounded-xl text-sm font-bold text-slate-700 outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                                                placeholder="Ulangi password baru"
                                                required
                                                minLength="6"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${submitting
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-[#000080] text-white hover:bg-blue-900 shadow-xl shadow-blue-900/20 hover:-translate-y-0.5'
                                    }`}
                            >
                                {submitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                                        Menyimpan...
                                    </div>
                                ) : (
                                    <>
                                        <Save size={18} /> Simpan Password Baru
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

export default PelatihProfil;
