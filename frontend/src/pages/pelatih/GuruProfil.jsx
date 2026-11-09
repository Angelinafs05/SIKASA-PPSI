import React, { useState, useEffect } from 'react';
import { User, KeyRound, AlertCircle, CheckCircle2, Save, Calendar, Phone, BookOpen, Shield } from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const GuruProfil = () => {
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
            const response = await api.get('/api/pendamping/profil');
            if (response.data.success) {
                setProfil(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch guru profile', error);
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
            const response = await api.put('/api/pendamping/profil/password', {
                old_password: passwords.old_password,
                new_password: passwords.new_password
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Password berhasil diubah!' });
                setPasswords({ old_password: '', new_password: '', confirm_password: '' });
            } else {
                setMessage({ type: 'error', text: response.data.message || 'Gagal mengubah password' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Terjadi kesalahan saat mengubah password'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-500 animate-pulse">Memuat profil guru...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans pb-10 max-w-5xl mx-auto">
            {/* HEADER */}
            <div className="border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Profil Guru Pendamping</h1>
                <p className="text-slate-500 font-medium mt-1">Kelola informasi akun dan pengaturan keamanan kata sandi Anda</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                    message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="text-sm font-bold">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* PROFILE CARD */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
                    <div className="w-24 h-24 bg-[#000080]/10 rounded-full flex items-center justify-center text-[#000080] text-3xl font-black">
                        {profil?.nama_guru?.charAt(0) || 'G'}
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-slate-800">{profil?.nama_guru}</h2>
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold mt-1 inline-block">
                            Guru Pendamping
                        </span>
                    </div>

                    <div className="w-full pt-4 border-t border-slate-100 text-left space-y-3 text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Username</span>
                            <span className="font-bold text-slate-800">{profil?.username}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">NIP</span>
                            <span className="font-bold text-slate-800">{profil?.nip || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kode Guru</span>
                            <span className="font-bold text-slate-800">{profil?.kode_guru || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">No. WhatsApp</span>
                            <span className="font-bold text-slate-800">{profil?.no_hp || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* CHANGE PASSWORD */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-[#000080] rounded-2xl">
                            <KeyRound size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800">Ubah Kata Sandi</h3>
                            <p className="text-xs text-slate-400 font-medium">Perbarui password akun Anda secara berkala</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitPassword} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password Lama</label>
                            <input
                                type="password"
                                name="old_password"
                                value={passwords.old_password}
                                onChange={handlePasswordChange}
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none text-sm"
                                placeholder="Masukkan password saat ini"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password Baru</label>
                            <input
                                type="password"
                                name="new_password"
                                value={passwords.new_password}
                                onChange={handlePasswordChange}
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none text-sm"
                                placeholder="Minimal 6 karakter"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Konfirmasi Password Baru</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={passwords.confirm_password}
                                onChange={handlePasswordChange}
                                required
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none text-sm"
                                placeholder="Ulangi password baru"
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-3 bg-[#000080] hover:bg-blue-900 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition-all text-sm"
                            >
                                <Save size={16} /> {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GuruProfil;
