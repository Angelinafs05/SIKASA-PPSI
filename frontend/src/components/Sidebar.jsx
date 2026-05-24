import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    UserRound,
    Trophy,
    Monitor,
    History,
    LogOut,
    ChevronRight,
    Activity,
    ClipboardCheck,
    GraduationCap,
    Wallet,
    UserPlus,
    FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoSekolah from '../assets/logo_sekolah.png';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const getMenuItems = () => {
        switch (user?.role) {
            case 'admin':
                return [
                    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/admin/ekskul', icon: <Activity size={20} />, label: 'Data Ekskul' },
                    { path: '/admin/pelatih', icon: <UserRound size={20} />, label: 'Data Pelatih' },
                    { path: '/admin/guru', icon: <UserRound size={20} />, label: 'Guru Pendamping' },
                    { path: '/admin/siswa', icon: <Users size={20} />, label: 'Data Siswa' },
                    { path: '/admin/orang-tua', icon: <UserPlus size={20} />, label: 'Data Orangtua' },
                    { path: '/admin/lomba', icon: <Trophy size={20} />, label: 'Delegasi Lomba' },
                    { path: '/admin/persetujuan', icon: <FileText size={20} />, label: 'Pendaftaran' },
                    { path: '/admin/honor', icon: <Wallet size={20} />, label: 'Honor Pelatih' },
                    { path: '/admin/monitoring', icon: <Monitor size={20} />, label: 'Monitoring' },
                ];
            case 'pelatih':
                return [
                    { path: '/pelatih', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/pelatih/siswa', icon: <Users size={20} />, label: 'Siswa Ekskul' },
                    ...(user?.is_external ? [] : [{ path: '/pelatih/absensi', icon: <ChevronRight size={20} />, label: 'Absensi' }]),
                    { path: '/pelatih/nilai', icon: <Trophy size={20} />, label: 'Nilai' },
                    { path: '/pelatih/honor', icon: <Wallet size={20} />, label: 'Riwayat Honor' },
                    { path: '/pelatih/profil', icon: <UserRound size={20} />, label: 'Profil Saya' },
                ];
            case 'pendamping':
                return [
                    { path: '/pendamping', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/pendamping/absensi', icon: <ChevronRight size={20} />, label: 'Absensi' },
                    { path: '/pendamping/nilai', icon: <Trophy size={20} />, label: 'Nilai' },
                ];
            case 'siswa':
                return [
                    { path: '/siswa', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/siswa/lomba', icon: <Trophy size={20} />, label: 'Delegasi Lomba' },
                    { path: '/siswa/ekskul', icon: <Trophy size={20} />, label: 'Pilih Ekskul' },
                    { path: '/siswa/kehadiran', icon: <ClipboardCheck size={20} />, label: 'Kehadiran Ekskul' },
                    { path: '/siswa/profil', icon: <UserRound size={20} />, label: 'Profil Saya' },
                ];
            case 'orang_tua':
                return [
                    { path: '/orang_tua', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/orang_tua/profil', icon: <UserRound size={20} />, label: 'Profil Saya' },
                ];
            case 'kepala_sekolah':
                return [
                    { path: '/kepala_sekolah', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/kepala_sekolah/monitoring', icon: <Monitor size={20} />, label: 'Laporan Monitoring' },
                    { path: '/kepala_sekolah/lomba', icon: <Trophy size={20} />, label: 'Laporan Lomba' },
                    { path: '/kepala_sekolah/honor', icon: <Wallet size={20} />, label: 'Laporan Honor' },
                    { path: '/kepala_sekolah/pelatih', icon: <UserRound size={20} />, label: 'Daftar Pelatih' },
                ];
            default:
                return [];
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-top">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img 
                            src={logoSekolah} 
                            alt="Logo Sekolah" 
                            className="w-10 h-10 object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform duration-500" 
                        />
                    </div>
                    <div className="sidebar-header-text">
                        <h2>SIKASA</h2>
                        <p>SMPK Santa Maria 2</p>
                    </div>
                </div>

                <ul className="sidebar-menu">
                    {getMenuItems().map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => isActive ? 'active' : ''}
                                end
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {user?.nama?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </div>
                    <div className="user-details">
                        <p className="user-name">{user?.nama || user?.username}</p>
                        <p className="user-role">{user?.role?.toUpperCase()}</p>
                    </div>
                </div>
                <button onClick={logout} className="logout-btn btn-block">
                    <LogOut size={18} />
                    <span>Keluar Aplikasi</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
