import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import logoSekolah from '../assets/logo_sekolah.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const result = await login(username, password);

        if (result.success) {
            if (result.role === 'admin') navigate('/admin');
            else if (result.role === 'pelatih') navigate('/pelatih');
            else if (result.role === 'pendamping') navigate('/pendamping');
            else if (result.role === 'orang_tua') navigate('/orang_tua');
            else if (result.role === 'kepala_sekolah') navigate('/kepala_sekolah');
            else navigate('/siswa');
        } else {
            setError(result.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo" style={{ background: 'transparent' }}>
                        <img src={logoSekolah} alt="Logo SMPK Santa Maria 2 Malang" className="w-full h-full object-contain" />
                    </div>
                    <h2>Login SIKASA</h2>
                    <p>Masuk untuk mengelola kegiatan ekstrakurikuler</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <div className="input-with-icon">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                id="username"
                                placeholder="Masukkan username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                id="password"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
                        {isSubmitting ? 'Memproses...' : 'Masuk sekarang'}
                    </button>
                </form>

                <div className="auth-footer mt-6 text-center">
                    <p className="text-sm font-medium text-slate-500 mb-2">Lupa Password / Membutuhkan Akun?</p>
                    <a
                        href="https://wa.me/6281234567890"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#000080] bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                        <AlertCircle size={16} /> Hubungi Admin SIKASA
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
