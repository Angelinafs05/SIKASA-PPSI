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
    FileText,
    CalendarDays,
    Calendar,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoSekolah from '../assets/logo_sekolah.png';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();

    const getMenuItems = () => {
        switch (user?.role) {
            case 'admin':
                return [
                    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    { path: '/admin/tahun-ajaran', icon: <CalendarDays size={20} />, label: 'Tahun Ajaran' },
                    // Master Data
                    { path: '/admin/siswa', icon: <Users size={20} />, label: 'Data Siswa' },
                    { path: '/admin/kelas', icon: <GraduationCap size={20} />, label: 'Data Kelas' },
                    { path: '/admin/ekskul', icon: <Activity size={20} />, label: 'Data Ekstrakurikuler' },
                    { path: '/admin/pelatih', icon: <UserRound size={20} />, label: 'Data Pelatih' },
                    { path: '/admin/guru', icon: <UserRound size={20} />, label: 'Data Guru Pendamping' },
                    // Pendaftaran Ekstrakurikuler
                    { path: '/admin/persetujuan', icon: <ClipboardCheck size={20} />, label: 'Pendaftaran Ekstrakurikuler' },
                    // Absensi
                    { path: '/admin/absensi', icon: <ChevronRight size={20} />, label: 'Lihat Absensi' },
                    { path: '/admin/rekap-absensi', icon: <FileText size={20} />, label: 'Rekap Absensi' },
                    // Izin
                    { path: '/admin/izin', icon: <FileText size={20} />, label: 'Kelola Izin' },
                    // Penilaian
                    { path: '/admin/nilai', icon: <Trophy size={20} />, label: 'Lihat Nilai' },
                    { path: '/admin/rekap-nilai', icon: <Trophy size={20} />, label: 'Rekap Nilai' },
                    // Monitoring
                    { path: '/admin/monitoring', icon: <Monitor size={20} />, label: 'Monitoring' },
                    // Laporan
                    { path: '/admin/rekap-absensi?tab=laporan', icon: <FileText size={20} />, label: 'Laporan Absensi' },
                    { path: '/admin/laporan-nilai', icon: <FileText size={20} />, label: 'Laporan Nilai' },
                ];
            case 'pelatih':
                return [
                    { path: '/pelatih', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    // Ekstrakurikuler
                    { path: '/pelatih/jadwal', icon: <Calendar size={20} />, label: 'Jadwal Ekstrakurikuler' },
                    { path: '/pelatih/siswa', icon: <Users size={20} />, label: 'Data Siswa Ekskul' },
                    // Absensi
                    { path: '/pelatih/absensi', icon: <ChevronRight size={20} />, label: 'Input Absensi' },
                    // Penilaian
                    { path: '/pelatih/bobot-nilai', icon: <History size={20} />, label: 'Bobot Nilai' },
                    { path: '/pelatih/nilai', icon: <Trophy size={20} />, label: 'Input Nilai' },
                    // Monitoring
                    { path: '/pelatih/monitoring-nilai', icon: <Monitor size={20} />, label: 'Perkembangan Nilai' },
                    // Profil
                    { path: '/pelatih/profil', icon: <UserRound size={20} />, label: 'Profil Saya' },
                ];
            case 'pendamping':
                return [
                    { path: '/pendamping', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    // Ekstrakurikuler & Siswa
                    { path: '/pendamping/ekskul', icon: <Activity size={20} />, label: 'Ekskul Didampingi' },
                    // Absensi
                    { path: '/pendamping/absensi', icon: <ChevronRight size={20} />, label: 'Input / Lihat Absensi' },
                    { path: '/pendamping/rekap-absensi', icon: <FileText size={20} />, label: 'Rekap Absensi' },
                    // Izin
                    { path: '/pendamping/izin', icon: <FileText size={20} />, label: 'Lihat Izin' },
                    // Penilaian
                    { path: '/pendamping/nilai', icon: <Trophy size={20} />, label: 'Monitoring Nilai' },
                    // Profil
                    { path: '/pendamping/profil', icon: <UserRound size={20} />, label: 'Profil Saya' },
                ];
            case 'siswa':
                return [
                    { path: '/siswa', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    // Ekstrakurikuler
                    { path: '/siswa/ekskul', icon: <Activity size={20} />, label: 'Daftar Ekstrakurikuler' },
                    // Jadwal / Kegiatan
                    { path: '/siswa/jadwal', icon: <ClipboardCheck size={20} />, label: 'Lihat Jadwal' },
                    // Izin
                    { path: '/siswa/izin', icon: <FileText size={20} />, label: 'Ajukan Izin' },
                    // Absensi
                    { path: '/siswa/kehadiran', icon: <ChevronRight size={20} />, label: 'Riwayat Absensi' },
                    // Nilai
                    { path: '/siswa/nilai', icon: <Trophy size={20} />, label: 'Lihat Nilai' },
                    // Profil
                    { path: '/siswa/profil', icon: <UserRound size={20} />, label: 'Profil Saya' },
                ];
            case 'kepala_sekolah':
                return [
                    { path: '/kepala_sekolah', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
                    // Monitoring
                    { path: '/kepala_sekolah/monitoring', icon: <Monitor size={20} />, label: 'Monitoring Ekskul' },
                    { path: '/kepala_sekolah/monitoring-siswa', icon: <Users size={20} />, label: 'Data Siswa' },
                    { path: '/kepala_sekolah/absensi', icon: <ChevronRight size={20} />, label: 'Kehadiran' },
                    { path: '/kepala_sekolah/nilai', icon: <Trophy size={20} />, label: 'Nilai' },
                    // Laporan
                    { path: '/kepala_sekolah/laporan-absensi', icon: <FileText size={20} />, label: 'Laporan Absensi' },
                    { path: '/kepala_sekolah/laporan-nilai', icon: <FileText size={20} />, label: 'Laporan Nilai' },
                    // Profil
                    { path: '/kepala_sekolah/profil', icon: <UserRound size={20} />, label: 'Profil Saya' },
                ];
            default:
                return [];
        }
    };

    const handleMenuClick = () => {
        // Close sidebar on mobile after clicking a link
        if (setIsOpen && window.innerWidth <= 1024) {
            setIsOpen(false);
        }
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-top">
                <div className="sidebar-header flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="sidebar-logo">
                            <img
                                src={logoSekolah}
                                alt="Logo Sekolah"
                                className="w-10 h-10 object-contain filter drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                        <div className="sidebar-header-text">
                            <h2>SIKASA</h2>
                            <p>SMPK S. Maria 2</p>
                        </div>
                    </div>
                </div>

                <ul className="sidebar-menu pb-10 custom-scrollbar">
                    {getMenuItems().map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                onClick={handleMenuClick}
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
                    <div className="user-avatar text-xl shrink-0">
                        {user?.nama?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </div>
                    <div className="user-details overflow-hidden">
                        <p className="user-name truncate">{user?.nama || user?.username}</p>
                        <p className="user-role uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                    </div>
                </div>
                <button onClick={logout} className="logout-btn btn-block py-3 hover:scale-[1.02] active:scale-95 transition-all">
                    <LogOut size={18} />
                    <span>Keluar Aplikasi</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
