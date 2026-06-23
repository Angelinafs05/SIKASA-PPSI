import React, { useState, useEffect } from 'react';
import { 
    Users, 
    User, 
    Calendar, 
    Trophy, 
    ChevronRight, 
    Activity, 
    CheckCircle, 
    XCircle, 
    Clock, 
    FileText,
    Medal,
    Eye,
    Info,
    ExternalLink,
    FileDown,
    MapPin
} from 'lucide-react';
import api from '../../api/api';

const ParentDashboard = () => {
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [childData, setChildData] = useState({
        absensi: [],
        nilai: [],
        lomba: [],
        ekskul: []
    });
    const [dataLoading, setDataLoading] = useState(false);
    const [period, setPeriod] = useState({ tahun_ajaran: '', semester: '' });
    
    // Withdrawal State
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [selectedEkskul, setSelectedEkskul] = useState(null);
    const [withdrawReason, setWithdrawReason] = useState('');
    const [withdrawFile, setWithdrawFile] = useState(null);
    const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);

    // Lomba Detail State
    const [selectedLomba, setSelectedLomba] = useState(null);
    const [isLombaModalOpen, setIsLombaModalOpen] = useState(false);

    // Lomba Approval State
    const [approvalStatus, setApprovalStatus] = useState('');
    const [approvalReason, setApprovalReason] = useState('');
    const [approvalFile, setApprovalFile] = useState(null);
    const [submittingApproval, setSubmittingApproval] = useState(false);
    const [approvalMessage, setApprovalMessage] = useState({ type: '', text: '' });

    const getFileUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        
        // Base URL logic: SIKASA/backend refers to API, SIKASA/ refers to root
        const baseUrl = api.defaults.baseURL.replace('/backend', '');
        
        // 'lomba/' paths are usually in backend/
        if (path.startsWith('lomba/')) {
            return `${api.defaults.baseURL}/${path}`;
        }
        
        // Other paths (like 'uploads/') are usually in root
        return `${baseUrl}/${path}`;
    };

    useEffect(() => {
        fetchChildren();
        
        // Auto-refresh setiap 15 detik untuk update realtime
        const refreshInterval = setInterval(fetchChildren, 15000);
        
        return () => clearInterval(refreshInterval);
    }, []);

    const fetchChildren = async () => {
        try {
            setLoading(true);
            const childResp = await api.get('/api/parent/children');
            
            if (childResp.data.success) {
                setChildren(childResp.data.data);
                if (childResp.data.data.length === 1) {
                    handleSelectChild(childResp.data.data[0]);
                }
            }
        } catch (err) {
            console.error('Gagal mengambil data anak');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedChild) return;
        
        // Fetch child detail data
        const fetchChildData = async () => {
            setDataLoading(true);
            try {
                const [absResp, nilResp, lomResp, eksResp] = await Promise.all([
                    api.get(`/api/parent/child/${selectedChild.id}/absensi`),
                    api.get(`/api/parent/child/${selectedChild.id}/nilai`),
                    api.get(`/api/parent/child/${selectedChild.id}/lomba`),
                    api.get(`/api/parent/child/${selectedChild.id}/ekskul`)
                ]);

                setChildData({
                    absensi: absResp.data.data || [],
                    nilai: nilResp.data.data || [],
                    lomba: lomResp.data.data || [],
                    ekskul: eksResp.data.data || []
                });
            } catch (err) {
                console.error('Gagal mengambil detail data anak');
            } finally {
                setDataLoading(false);
            }
        };
        
        fetchChildData();
        
        // Auto-refresh child data setiap 15 detik
        const refreshInterval = setInterval(fetchChildData, 15000);
        
        return () => clearInterval(refreshInterval);
    }, [selectedChild]);

    const handleSelectChild = (child) => {
        setSelectedChild(child);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
        if (!withdrawReason || !withdrawFile) {
            alert('Alasan dan surat keterangan wajib diisi/diunggah');
            return;
        }

        setSubmittingWithdrawal(true);
        const formData = new FormData();
        formData.append('pendaftaran_id', selectedEkskul.pendaftaran_id);
        formData.append('alasan_keluar', withdrawReason);
        formData.append('surat_keluar', withdrawFile);

        try {
            const response = await api.post('/api/parent/child/withdrawal', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                setWithdrawSuccess(true);
                // Refresh data
                handleSelectChild(selectedChild);
                setTimeout(() => {
                    setIsWithdrawModalOpen(false);
                    setWithdrawSuccess(false);
                    setWithdrawReason('');
                    setWithdrawFile(null);
                    setSelectedEkskul(null);
                }, 2000);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal mengirim permohonan');
        } finally {
            setSubmittingWithdrawal(false);
        }
    };

    const handleLombaApprovalSubmit = async (e) => {
        e.preventDefault();
        if (!approvalStatus) {
            setApprovalMessage({ type: 'error', text: 'Silakan pilih status persetujuan' });
            return;
        }

        if (approvalStatus === 'Disetujui' && !approvalFile) {
            setApprovalMessage({ type: 'error', text: 'Unggah surat persetujuan PDF/Gambar wajib saat menyetujui lomba' });
            return;
        }

        if (approvalStatus === 'Ditolak' && !approvalReason) {
            setApprovalMessage({ type: 'error', text: 'Silakan tuliskan alasan penolakan' });
            return;
        }

        setSubmittingApproval(true);
        const formData = new FormData();
        formData.append('peserta_id', selectedLomba.peserta_id);
        formData.append('status_approval', approvalStatus);
        if (approvalReason) formData.append('reason', approvalReason);
        if (approvalFile) formData.append('approval_file', approvalFile);

        try {
            const response = await api.post('/api/parent/lomba/approve', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setApprovalMessage({ type: 'success', text: 'Persetujuan berhasil disimpan' });
                setApprovalStatus('');
                setApprovalReason('');
                setApprovalFile(null);
                handleSelectChild(selectedChild);
                setTimeout(() => {
                    setApprovalMessage({ type: '', text: '' });
                    setIsLombaModalOpen(false);
                }, 2000);
            }
        } catch (err) {
            setApprovalMessage({ type: 'error', text: err.response?.data?.message || 'Terjadi kesalahan' });
        } finally {
            setSubmittingApproval(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500">Menghubungkan ke data keluarga...</p>
            </div>
        </div>
    );

    if (!selectedChild && children.length > 0) {
        return (
            <div style={{animation: 'fadeIn 0.4s ease'}} className="space-y-8 pb-10 flex flex-col items-center">
                <div className="text-center space-y-2 mb-4">
                    <h1 className="text-4xl font-black text-[#000080]">Selamat Datang, Bapak/Ibu!</h1>
                    <p className="text-slate-500 font-medium italic">Silakan pilih profil anak yang ingin Bapak/Ibu pantau hari ini.</p>
                </div>

                <div className="flex flex-wrap justify-center gap-8 pt-6 px-4 w-full max-w-5xl">
                    {children.map(child => (
                        <div 
                            key={child.id}
                            onClick={() => handleSelectChild(child)}
                            className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl hover:shadow-2xl hover:border-[#000080]/30 hover:-translate-y-2 transition-all cursor-pointer group w-full max-w-[280px]"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner group-hover:bg-[#000080]/5 transition-colors">
                                    <User size={40} className="text-[#000080]/40 group-hover:text-[#000080] transition-all" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight">{child.nama_siswa}</h3>
                                    <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mt-1 inline-block">Kelas: {child.nama_kelas}</p>
                                </div>
                                <div className="pt-2 w-full">
                                    <button className="w-full bg-[#000080] text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 group-hover:bg-[#000066] shadow-lg shadow-blue-900/10">
                                        Pilih Profil <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (children.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <Users size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Akun Belum Terhubung</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Akun Bapak/Ibu belum dihubungkan dengan data siswa oleh Admin. Silakan hubungi bagian IT sekolah.</p>
            </div>
        );
    }

    return (
        <div style={{animation: 'fadeIn 0.4s ease'}} className="space-y-8 pb-10 font-sans">
            {/* Child Header & Selector */}
            <div className="bg-[#000080] rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
                            <User size={36} />
                        </div>
                        <div>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Sedang Memantau</p>
                            <h1 className="text-3xl font-black">{selectedChild.nama_siswa}</h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2 justify-center md:justify-start">
                                <span className="bg-white/20 text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/20 uppercase tracking-wider">Kelas {selectedChild.nama_kelas}</span>
                                <span className="bg-emerald-400 text-emerald-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">NIS: {selectedChild.no_induk}</span>
                            </div>
                        </div>
                    </div>
                    
                    {children.length > 1 && (
                        <button 
                            onClick={() => setSelectedChild(null)}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 backdrop-blur-sm"
                        >
                            Ganti Profil Anak <Users size={16} />
                        </button>
                    )}
                </div>
            </div>

            {dataLoading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <div className="w-8 h-8 border-4 border-[#000080]/10 border-t-[#000080] rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COL: STATS & ABSENSI */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* CLASS 9 SEMESTER 2 ALERT */}
                        {period.semester === 'Genap' && selectedChild?.nama_kelas?.startsWith('IX') && (
                            <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-amber-900/5 transition-all hover:shadow-2xl">
                                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <GraduationCap size={32} />
                                </div>
                                <div className="space-y-1 text-center md:text-left">
                                    <h3 className="text-lg font-black text-amber-900 uppercase tracking-tight">Status Alumni / Persiapan Kelulusan</h3>
                                    <p className="text-amber-800/70 font-bold text-sm leading-relaxed">
                                        Anak Bapak/Ibu (<span className="text-amber-600 font-black">{selectedChild.nama_siswa}</span>) yang berada di kelas <span className="text-amber-600 font-black">IX</span> saat ini sudah memasuki tahap persiapan kelulusan pada <span className="text-amber-600 font-black">Semester 2</span>, sehingga kegiatan ekstrakurikuler telah dinonaktifkan.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ABSENSI SUMMARY */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm overflow-hidden relative">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><Activity size={20} /></div>
                                    Riwayat Absensi
                                </h2>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{childData.absensi.length} Sesi Terakhir</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3">Ekstrakurikuler</th>
                                            <th className="px-4 py-3">Tanggal</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-medium">
                                        {childData.absensi.length > 0 ? (
                                            childData.absensi.map((abs, idx) => (
                                                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <p className="font-bold text-slate-800 uppercase tracking-tight">{abs.nama_ekskul}</p>
                                                        <p className="text-[10px] font-medium text-slate-400">Pelatih: {abs.nama_pelatih}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-500">{new Date(abs.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                                                    <td className="px-4 py-4">
                                                        {abs.status === 'Hadir' ? (
                                                            <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                                                                <CheckCircle size={10} /> Hadir
                                                            </span>
                                                        ) : (
                                                            <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                                                                <XCircle size={10} /> {abs.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs italic text-slate-400 max-w-[150px] truncate">{abs.keterangan || '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-10 text-center text-slate-400 italic">Belum ada data absensi</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* LOMBA & PRESTASI */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                    <div className="bg-amber-50 text-amber-600 p-2 rounded-xl"><Medal size={20} /></div>
                                    Prestasi & Lomba
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {childData.lomba.length > 0 ? (
                                    childData.lomba.map((lom, idx) => {
                                        const parentApprovalStatus = lom.parent_approval_status || 'Menunggu';
                                        return (
                                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 group hover:bg-amber-50/30 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><Trophy size={18} /></div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {parentApprovalStatus === 'Disetujui' ? (
                                                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">DISETUJUI</span>
                                                        ) : (
                                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{parentApprovalStatus.toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 leading-tight mb-1">{lom.nama_lomba}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{lom.tempat} • {new Date(lom.tanggal_pelaksanaan).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p>
                                                </div>
                                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 group-hover:border-amber-100 transition-colors">
                                                    {lom.prestasi ? (
                                                        <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                                            🏅 {lom.prestasi}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">Peserta</span>
                                                    )}
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedLomba(lom);
                                                            setIsLombaModalOpen(true);
                                                        }}
                                                        className="text-[10px] font-black text-[#000080] hover:underline flex items-center gap-1"
                                                    >
                                                        Detail <ChevronRight size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-10 text-center text-slate-400 italic">Anak belum mengikuti agenda lomba</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: SCHEDULE & GRADES SUMMARY */}
                    <div className="space-y-8">
                        {/* JADWAL EKSKUL */}
                        <div className="bg-[#000080] rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-black flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><Calendar size={20} /></div>
                                        Jadwal Mingguan
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    {childData.ekskul.length > 0 ? (
                                        childData.ekskul.map((eksk, idx) => (
                                            <div key={idx} className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/20 transition-all group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-black text-sm uppercase tracking-tight">{eksk.nama_ekskul}</h4>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedEkskul(eksk);
                                                                setIsWithdrawModalOpen(true);
                                                            }}
                                                            className="text-[10px] font-bold text-rose-300 hover:text-rose-100 transition-colors uppercase tracking-tight"
                                                        >
                                                            Keluar
                                                        </button>
                                                        <span className="text-[10px] font-bold bg-emerald-400 text-emerald-900 px-2 py-0.5 rounded-lg">{eksk.hari}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-white/70 text-[10px] font-bold">
                                                        <Clock size={12} /> {eksk.jam} • {eksk.tempat}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-white/70 text-[10px] font-bold">
                                                        <User size={12} /> {eksk.nama_pelatih || 'Pelatih belum ditentukan'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-white/40 italic text-sm">
                                            Belum ada ekskul yang terdaftar
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ABSENSI SUMMARY CARD - gaya SiswaDashboard */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                    <div className="bg-blue-50 text-[#000080] p-2 rounded-xl"><Activity size={20} /></div>
                                    Rekap Kehadiran
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    {childData.absensi.length} Sesi
                                </span>
                            </div>

                            {childData.absensi.length > 0 ? (() => {
                                const hadir  = childData.absensi.filter(a => a.status === 'Hadir').length;
                                const izin   = childData.absensi.filter(a => a.status === 'Izin').length;
                                const alpha  = childData.absensi.filter(a => a.status !== 'Hadir' && a.status !== 'Izin').length;
                                const total  = childData.absensi.length;
                                const pctHadir = total > 0 ? Math.round((hadir / total) * 100) : 0;
                                return (
                                    <div className="space-y-4">
                                        {/* Progress bar kehadiran */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Tingkat Kehadiran</span>
                                                <span className={`text-lg font-black ${pctHadir >= 75 ? 'text-emerald-600' : 'text-rose-500'}`}>{pctHadir}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${pctHadir >= 75 ? 'bg-emerald-500' : 'bg-rose-400'}`}
                                                    style={{ width: `${pctHadir}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div className="grid grid-cols-3 gap-3 pt-1">
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                                                <p className="text-2xl font-black text-emerald-600">{hadir}</p>
                                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Hadir</p>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
                                                <p className="text-2xl font-black text-amber-500">{izin}</p>
                                                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">Izin</p>
                                            </div>
                                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-center">
                                                <p className="text-2xl font-black text-rose-500">{alpha}</p>
                                                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">Alpha</p>
                                            </div>
                                        </div>

                                        {/* 5 sesi terakhir */}
                                        <div className="space-y-2 pt-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">5 Sesi Terakhir</p>
                                            {childData.absensi.slice(0, 5).map((abs, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5">
                                                    <div>
                                                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{abs.nama_ekskul}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">
                                                            {new Date(abs.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    {abs.status === 'Hadir' ? (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                                                            <CheckCircle size={10} /> Hadir
                                                        </span>
                                                    ) : abs.status === 'Izin' ? (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                                                            <Clock size={10} /> Izin
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
                                                            <XCircle size={10} /> {abs.status}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })() : (
                                <div className="py-10 text-center text-slate-400 italic text-sm">
                                    Belum ada data absensi untuk ditampilkan.
                                </div>
                            )}
                        </div>

                        {/* INFO TIP */}
                        <div className="bg-[#000080] rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-white/20 p-2 rounded-xl"><Clock size={18} /></div>
                                <h3 className="font-bold text-sm">Pembaruan Data</h3>
                            </div>
                            <p className="text-xs leading-relaxed text-blue-100">
                                Data absensi diperbarui secara real-time oleh pelatih. Kehadiran &ge;75% adalah standar minimum partisipasi ekskul.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* WITHDRAWAL MODAL */}
            {isWithdrawModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" style={{animation:'fadeIn 0.2s ease'}}>
                    <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden" style={{animation:'scaleIn 0.2s ease'}}>
                        <div className="bg-[#000080] p-6 text-white relative">
                            <h3 className="text-xl font-black uppercase tracking-tight">Pengunduran Diri</h3>
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">{selectedEkskul?.nama_ekskul}</p>
                            <button 
                                onClick={() => setIsWithdrawModalOpen(false)}
                                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-8">
                            {withdrawSuccess ? (
                                <div className="text-center py-8 space-y-4">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 animate-bounce">
                                        <CheckCircle size={40} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800">Permohonan Dikirim!</h4>
                                        <p className="text-slate-500 text-sm italic font-medium">Sedang menunggu persetujuan Admin...</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14} /> Alasan Berhenti
                                        </label>
                                        <textarea 
                                            required
                                            value={withdrawReason}
                                            onChange={(e) => setWithdrawReason(e.target.value)}
                                            placeholder="Misal: Cedera fisik/patah tulang, pindah sekolah, dll..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-[#000080]/5 focus:border-[#000080] transition-all min-h-[120px]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Medal size={14} /> Surat Keterangan / Bukti
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                required
                                                onChange={(e) => setWithdrawFile(e.target.files[0])}
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                className="hidden" 
                                                id="withdraw-file"
                                            />
                                            <label 
                                                htmlFor="withdraw-file"
                                                className={`flex items-center justify-center gap-3 w-full border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all ${withdrawFile ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:border-slate-300'}`}
                                            >
                                                {withdrawFile ? (
                                                    <><CheckCircle size={20} /> <span className="font-bold text-sm truncate">{withdrawFile.name}</span></>
                                                ) : (
                                                    <><Activity size={20} /> <span className="font-bold text-sm">Upload Surat (JPG/PNG/PDF)</span></>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setIsWithdrawModalOpen(false)}
                                            className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                                        >
                                            Batal
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={submittingWithdrawal}
                                            className="flex-1 bg-[#000080] text-white font-bold py-4 rounded-2xl hover:bg-[#000066] transition-all shadow-xl shadow-blue-900/10 uppercase tracking-widest text-[10px] disabled:opacity-50"
                                        >
                                            {submittingWithdrawal ? 'Sedang Mengirim...' : 'Kirim Permohonan'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* LOMBA DETAIL MODAL */}
            {isLombaModalOpen && selectedLomba && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" style={{animation:'fadeIn 0.2s ease'}}>
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{animation:'scaleIn 0.2s ease'}}>
                        <div className="bg-[#000080] p-6 text-white relative shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">{selectedLomba.nama_lomba}</h3>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{selectedLomba.tahun_ajaran} • Semester {selectedLomba.semester}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsLombaModalOpen(false)}
                                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                            {/* Basic Info Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Waktu & Lokasi</p>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#000080]">
                                            <Calendar size={16} />
                                        </div>
                                        <p className="font-bold text-sm">{new Date(selectedLomba.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700 mt-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#000080]">
                                            <MapPin size={16} />
                                        </div>
                                        <p className="font-bold text-sm uppercase">{selectedLomba.tempat}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Partisipasi</p>
                                    <div className="flex items-center gap-3">
                                        {selectedLomba.status_izin === 'Disetujui' ? (
                                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2">
                                                <CheckCircle size={14} /> DISETUJUI SEKOLAH
                                            </span>
                                        ) : (
                                            <span className="text-xs font-black text-slate-500 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl">
                                                {selectedLomba.status_izin.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-3 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <Info size={14} className="text-[#000080]" /> Deskripsi Kegiatan
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed italic">
                                    {selectedLomba.deskripsi || 'Tidak ada deskripsi tambahan untuk lomba ini.'}
                                </p>
                            </div>

                            {/* Documents & Links */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} className="text-[#000080]" /> Dokumen Terkait
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedLomba.surat_edaran && (
                                        <a 
                                            href={getFileUrl(selectedLomba.surat_edaran)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#000080] shadow-sm">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-[#000080] uppercase tracking-tight">Surat Edaran</p>
                                                    <p className="text-[10px] font-bold text-blue-400">Klik untuk melihat</p>
                                                </div>
                                            </div>
                                            <ExternalLink size={16} className="text-blue-300 group-hover:text-[#000080]" />
                                        </a>
                                    )}
                                    
                                    {selectedLomba.sertifikat_hasil && (
                                        <a 
                                            href={getFileUrl(selectedLomba.sertifikat_hasil)} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                                    <Medal size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-tight">Sertifikat</p>
                                                    <p className="text-[10px] font-bold text-emerald-400">Klik untuk unduh</p>
                                                </div>
                                            </div>
                                            <FileDown size={16} className="text-emerald-300 group-hover:text-emerald-600" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Result Photo */}
                            {(selectedLomba.prestasi || selectedLomba.foto_hasil) && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <Trophy size={14} className="text-amber-500" /> Hasil & Prestasi
                                    </h4>
                                    <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                                        {selectedLomba.prestasi && (
                                            <div className="mb-4">
                                                <span className="inline-block text-xl font-black text-amber-700 bg-white px-6 py-2 rounded-2xl shadow-sm">
                                                    🏆 {selectedLomba.prestasi}
                                                </span>
                                            </div>
                                        )}
                                        {selectedLomba.foto_hasil ? (
                                            <div className="rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                                                <img 
                                                    src={getFileUrl(selectedLomba.foto_hasil)} 
                                                    alt="Hasil Lomba" 
                                                    className="w-full h-auto object-cover max-h-[300px]"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://via.placeholder.com/600x400?text=Foto+Hasil+Lomba';
                                                    }}
                                                />
                                            </div>
                                        ) : selectedLomba.prestasi && (
                                            <p className="text-xs font-bold text-amber-600 italic">Foto dokumentasi belum diunggah.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* PARENT APPROVAL SECTION */}
                            <div className="border-t border-slate-100 pt-8">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Persetujuan Orang Tua</p>
                                        {selectedLomba.parent_approval_status && selectedLomba.parent_approval_status !== 'Menunggu' ? (
                                            <div className={`p-4 rounded-2xl border ${selectedLomba.parent_approval_status === 'Disetujui' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                                <div className="flex items-start gap-3">
                                                    {selectedLomba.parent_approval_status === 'Disetujui' ? (
                                                        <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                                                    ) : (
                                                        <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className={`font-bold ${selectedLomba.parent_approval_status === 'Disetujui' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                            {selectedLomba.parent_approval_status === 'Disetujui' ? 'Disetujui oleh Orang Tua' : 'Ditolak oleh Orang Tua'}
                                                        </p>
                                                        {selectedLomba.parent_approval_reason && (
                                                            <p className={`text-sm mt-1 ${selectedLomba.parent_approval_status === 'Disetujui' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                Alasan: {selectedLomba.parent_approval_reason}
                                                            </p>
                                                        )}
                                                        {selectedLomba.parent_approval_file && (
                                                            <a href={getFileUrl(selectedLomba.parent_approval_file)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline mt-2 inline-block">
                                                                Lihat Dokumen Persetujuan
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleLombaApprovalSubmit} className="mt-4 space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                {approvalMessage.text && (
                                                    <div className={`p-3 rounded-xl text-sm font-bold ${approvalMessage.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                        {approvalMessage.text}
                                                    </div>
                                                )}

                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setApprovalStatus('Ditolak'); setApprovalReason(''); setApprovalFile(null); }}
                                                        className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${approvalStatus === 'Ditolak' ? 'bg-rose-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50'}`}
                                                    >
                                                        ✗ Tolak
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setApprovalStatus('Disetujui'); setApprovalReason(''); }}
                                                        className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${approvalStatus === 'Disetujui' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'}`}
                                                    >
                                                        ✓ Setuju
                                                    </button>
                                                </div>

                                                {approvalStatus === 'Ditolak' && (
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Alasan Penolakan *</label>
                                                        <textarea 
                                                            value={approvalReason}
                                                            onChange={(e) => setApprovalReason(e.target.value)}
                                                            rows="2"
                                                            className="w-full bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl px-3 py-2 text-sm"
                                                            placeholder="Jelaskan alasan penolakan..."
                                                        />
                                                    </div>
                                                )}

                                                {approvalStatus === 'Disetujui' && (
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Upload Surat Persetujuan (PDF/Gambar) - Wajib</label>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,image/*"
                                                            onChange={(e) => setApprovalFile(e.target.files?.[0] || null)}
                                                            className="w-full text-sm text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex flex-col gap-3 pt-2">
                                                    <button 
                                                        type="submit"
                                                        disabled={submittingApproval || !approvalStatus}
                                                        className="w-full bg-[#000080] text-white font-bold py-3 rounded-2xl hover:bg-[#000066] transition-all text-sm disabled:opacity-50"
                                                    >
                                                        {submittingApproval ? 'Menyimpan...' : 'Simpan Persetujuan'}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                            <button 
                                onClick={() => setIsLombaModalOpen(false)}
                                className="w-full bg-[#000080] text-white font-black py-4 rounded-2xl hover:bg-[#000066] transition-all shadow-xl shadow-blue-900/10 uppercase tracking-widest text-xs"
                            >
                                Tutup Detail
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParentDashboard;
