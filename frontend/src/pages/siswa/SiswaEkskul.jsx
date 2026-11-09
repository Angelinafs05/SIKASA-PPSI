import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy,
    Clock,
    MapPin,
    User,
    Users,
    Activity,
    AlertCircle,
    ChevronRight,
    CheckCircle2,
    Info,
    Search,
    GraduationCap,
    Calendar as CalendarIcon,
    AlertTriangle,
    X,
    HelpCircle
} from 'lucide-react';
import api from '../../api/api';

// Helper parse range waktu (e.g. "14:00 - 15:30" atau "14.00-15.30")
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

// Logika cek tabrakan jadwal ekskul
const checkScheduleConflict = (hari1, jam1, hari2, jam2) => {
    if (!hari1 || !jam1 || !hari2 || !jam2) return false;
    const h1List = hari1.toLowerCase().split(',').map(s => s.trim());
    const h2List = hari2.toLowerCase().split(',').map(s => s.trim());
    const sameDay = h1List.some(h => h2List.includes(h) && h !== '');
    if (!sameDay) return false;

    const r1 = parseTimeRange(jam1);
    const r2 = parseTimeRange(jam2);
    if (!r1 || !r2) return true; // Anggap bentrok jika hari sama tapi format jam bebas

    // Formula overlap: start1 < end2 && start2 < end1
    return (r1.start < r2.end) && (r2.start < r1.end);
};

const SiswaEkskul = () => {
    const navigate = useNavigate();
    const [ekskuls, setEkskuls] = useState([]);
    const [myApprovedEkskuls, setMyApprovedEkskuls] = useState([]);
    const [myPendingEkskuls, setMyPendingEkskuls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [conflictModal, setConflictModal] = useState(null); // { target: ekskul, conflictWith: ekskul }

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [resEkskul, resDashboard] = await Promise.all([
                api.get('/api/siswa/ekskul'),
                api.get('/api/siswa/dashboard')
            ]);

            if (resEkskul.data.success) {
                setEkskuls(resEkskul.data.data);
            } else {
                setError(resEkskul.data.message || 'Gagal mengambil daftar ekskul');
            }

            if (resDashboard.data.success) {
                const dash = resDashboard.data.data;
                setMyApprovedEkskuls(dash.my_ekskuls || []);
                setMyPendingEkskuls(dash.pending_ekskuls || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    // Total pendaftaran aktif siswa (Approved + Pending)
    const totalPilihanAktif = myApprovedEkskuls.length + myPendingEkskuls.length;

    // Fungsi klik tombol "Daftar Sekarang"
    const handleKlikDaftar = (targetEkskul) => {
        // Cek kuota maksimal 2 ekstrakurikuler per siswa (termasuk yang masih pending)
        if (totalPilihanAktif >= 2) {
            alert('Batas Maksimal Tercapai: Anda sudah memilih 2 ekstrakurikuler (baik yang sudah disetujui maupun yang masih menunggu persetujuan). Sesuai aturan sekolah, Anda tidak dapat mendaftar ekskul lain. Jika ingin berganti, silakan batalkan pendaftaran yang masih menunggu persetujuan terlebih dahulu.');
            return;
        }

        // Cek apakah jadwal targetEkskul bertabrakan dengan ekskul yang sudah didaftar siswa
        const allSelected = [...myApprovedEkskuls, ...myPendingEkskuls];
        if (allSelected.length > 0) {
            const bentrok = allSelected.find(my =>
                String(my.ekskul_id || my.id) !== String(targetEkskul.id) &&
                checkScheduleConflict(targetEkskul.hari, targetEkskul.jam, my.hari, my.jam)
            );

            if (bentrok) {
                setConflictModal({
                    target: targetEkskul,
                    conflictWith: bentrok
                });
                return;
            }
        }

        // Jika tidak bentrok & belum mencapai 2 ekskul, lanjut ke formulir pendaftaran
        navigate(`/siswa/daftar/${targetEkskul.id}`);
    };

    // Fungsi Pembatalan Pendaftaran (Khusus status 'pending')
    const handleBatalPendaftaran = async (pendaftaranId, namaEkskul) => {
        if (!pendaftaranId) {
            alert('ID pendaftaran tidak ditemukan');
            return;
        }

        const confirmBatal = window.confirm(
            `Apakah Anda yakin ingin membatalkan pendaftaran ekstrakurikuler ${namaEkskul}?\nSetelah dibatalkan, kuota pilihan Anda akan kembali tersedia dan Anda dapat mendaftar ekskul lainnya.`
        );

        if (!confirmBatal) return;

        try {
            setCancellingId(pendaftaranId);
            const res = await api.delete(`/api/siswa/pendaftaran/${pendaftaranId}/batal`);
            if (res.data.success) {
                alert(res.data.message || 'Pendaftaran berhasil dibatalkan.');
                fetchInitialData();
            } else {
                alert(res.data.message || 'Gagal membatalkan pendaftaran');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Terjadi kesalahan saat membatalkan pendaftaran');
        } finally {
            setCancellingId(null);
        }
    };

    const filteredEkskuls = ekskuls.filter(e =>
        e.nama_ekskul.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                        <CheckCircle2 size={12} /> Terdaftar
                    </div>
                );
            case 'pending':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                        <Clock size={12} /> Menunggu
                    </div>
                );
            case 'rejected':
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm">
                        <AlertCircle size={12} /> Ditolak
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-500 animate-pulse">Memuat daftar ekstrakurikuler...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#000080]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-blue-50 text-[#000080] rounded-2xl">
                                <Trophy size={26} />
                            </div>
                            <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Pilihan Ekstrakurikuler</h1>
                        </div>
                        <p className="text-slate-500 font-medium">Temukan dan daftarkan diri pada ekstrakurikuler yang sesuai dengan minat dan bakatmu.</p>
                    </div>

                    <div className="relative min-w-[280px]">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari ekstrakurikuler..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-5 rounded-2xl flex items-center gap-3 border border-rose-100 font-bold text-sm">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* MODAL NOTIFIKASI JADWAL BERTABRAKAN (BENTROK) */}
            {conflictModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl border border-rose-100 relative overflow-hidden animate-scale-up">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>

                        <button
                            onClick={() => setConflictModal(null)}
                            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center shadow-inner border border-rose-100">
                                <AlertTriangle size={36} />
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-black uppercase tracking-wider">
                                Jadwal Bertabrakan!
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                Waktu Latihan Bentrok
                            </h3>

                            <div className="text-sm text-slate-600 font-medium space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left w-full">
                                <div className="flex items-start gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ekskul yang Sudah Anda Ikuti:</p>
                                        <p className="font-extrabold text-[#000080]">
                                            {conflictModal.conflictWith.nama_ekskul}
                                        </p>
                                        <p className="text-xs text-slate-600 font-semibold">
                                            Hari {conflictModal.conflictWith.hari} • Jam {conflictModal.conflictWith.jam}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200/60 pt-2.5 flex items-start gap-2.5">
                                    <span className="w-2 h-2 rounded-full bg-rose-600 mt-2 shrink-0"></span>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ekskul yang Ingin Anda Daftar:</p>
                                        <p className="font-extrabold text-rose-700">
                                            {conflictModal.target.nama_ekskul}
                                        </p>
                                        <p className="text-xs text-slate-600 font-semibold">
                                            Hari {conflictModal.target.hari} • Jam {conflictModal.target.jam}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-xl text-xs font-bold text-amber-900 text-left w-full flex items-start gap-2.5">
                                <HelpCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                                <p className="leading-relaxed">
                                    Karena kedua ekskul dilaksanakan pada hari dan jam yang bersamaan, Anda <strong>diarahkan untuk memilih salah satu</strong> dari ekskul tersebut agar jadwal latihan tidak saling mengganggu.
                                </p>
                            </div>

                            <div className="w-full pt-2">
                                <button
                                    onClick={() => setConflictModal(null)}
                                    className="w-full py-4 bg-[#000080] hover:bg-blue-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-blue-900/20 active:scale-95 transition-all"
                                >
                                    Mengerti, Pilih Ekskul Lain
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DAFTAR EKSKUL */}
            {filteredEkskuls.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {filteredEkskuls.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-[2.5rem] p-8 border border-slate-200/80 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 group-hover:text-[#000080] transition-colors tracking-tight">
                                            {item.nama_ekskul}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Users size={14} className="text-[#000080]" />
                                                {item.total_siswa || 0} Siswa Terdaftar
                                            </span>
                                            {item.is_seleksi === 1 && (
                                                <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider rounded-md border border-purple-100">
                                                    Ada Seleksi
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Grid Informasi Jadwal */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#000080] group-hover:scale-110 transition-transform">
                                                <CalendarIcon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Jadwal</p>
                                                <p className="font-extrabold text-[#000080] text-sm">
                                                    {item.hari || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Waktu</p>
                                                <p className="font-extrabold text-slate-700 text-sm">
                                                    {item.jam || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Lokasi</p>
                                                <p className="font-extrabold text-slate-700 text-sm uppercase">{item.tempat ? `R. ${item.tempat}` : '-'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                                <GraduationCap size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Untuk Kelas</p>
                                                <p className="font-extrabold text-slate-700 text-sm uppercase">
                                                    {(() => {
                                                        try {
                                                            const targets = typeof item.target_kelas === 'string' ? JSON.parse(item.target_kelas) : item.target_kelas;
                                                            if (Array.isArray(targets) && targets.length > 0) {
                                                                return targets.join(', ');
                                                            }
                                                            return 'Semua Kelas';
                                                        } catch (e) {
                                                            return item.target_kelas || 'Semua Kelas';
                                                        }
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pembina Info */}
                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100/60">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#000080] group-hover:text-[#000080] transition-colors">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Pembina & Piket</p>
                                            <p className="text-xs font-bold text-slate-600">
                                                {item.pelatih_nama || '-'} • <span className="text-slate-400">{item.pendamping_nama || 'Tanpa Piket'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto self-end flex flex-col items-end gap-3 pt-4 md:pt-0">
                                    {item.my_status === 'approved' && (
                                        getStatusBadge(item.my_status)
                                    )}

                                    {item.my_status === 'pending' && (
                                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                                            {getStatusBadge(item.my_status)}
                                            <button
                                                onClick={() => handleBatalPendaftaran(item.pendaftaran_id, item.nama_ekskul)}
                                                disabled={cancellingId === item.pendaftaran_id}
                                                className="w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                                                title="Batalkan pendaftaran agar dapat memilih ekskul lain"
                                            >
                                                <X size={14} className="stroke-[2.5]" />
                                                {cancellingId === item.pendaftaran_id ? 'Membatalkan...' : 'Batalkan Pendaftaran'}
                                            </button>
                                        </div>
                                    )}

                                    {item.my_status === 'rejected' && (
                                        <div className="flex flex-col items-end gap-2">
                                            {getStatusBadge(item.my_status)}
                                            <button
                                                onClick={() => handleKlikDaftar(item)}
                                                disabled={totalPilihanAktif >= 2}
                                                className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                    totalPilihanAktif >= 2
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                        : 'bg-[#000080] hover:bg-blue-900 text-white shadow-md'
                                                }`}
                                            >
                                                Daftar Lagi <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {!item.my_status && (
                                        <div className="flex flex-col items-end gap-1 w-full md:w-auto">
                                            <button
                                                onClick={() => handleKlikDaftar(item)}
                                                disabled={totalPilihanAktif >= 2}
                                                className={`w-full md:w-auto px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 group/btn ${
                                                    totalPilihanAktif >= 2
                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                                        : 'bg-[#000080] hover:bg-blue-900 text-white shadow-xl shadow-blue-900/20 active:scale-95'
                                                }`}
                                                title={totalPilihanAktif >= 2 ? 'Batas maksimal 2 ekskul sudah tercapai' : 'Daftar ekskul ini'}
                                            >
                                                Daftar Sekarang <ChevronRight size={20} className={totalPilihanAktif >= 2 ? '' : 'group-hover/btn:translate-x-1.5 transition-transform'} />
                                            </button>
                                            {totalPilihanAktif >= 2 && (
                                                <span className="text-[11px] font-semibold text-amber-600 italic">
                                                    Maksimal 2 pilihan ekskul sudah dipilih
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <Users size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-700">Tidak ada ekskul ditemukan</h3>
                    <p className="text-slate-400 font-medium">Coba gunakan kata kunci pencarian yang lain.</p>
                </div>
            )}
        </div>
    );
};

export default SiswaEkskul;
