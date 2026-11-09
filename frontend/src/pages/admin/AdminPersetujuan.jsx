import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Eye, User, Trophy, Search, AlertCircle, FileText, ExternalLink, Activity } from 'lucide-react';
import api from '../../api/api';

const AdminPersetujuan = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending');

    // Preview Logic
    const [selectedImg, setSelectedImg] = useState(null);

    useEffect(() => {
        fetchRegistrations();
    }, [filterStatus]);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/admin/pendaftaran?status=${filterStatus}`);
            if (response.data.success) {
                setRegistrations(response.data.data);
            } else {
                setError('Gagal mengambil data pendaftaran');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        let confirmMsg = `Yakin ingin ${action === 'approve' ? 'menyetujui' : 'menolak'} pendaftaran ini?`;
        if (action === 'approve-withdrawal') confirmMsg = "Yakin ingin menyetujui pengunduran diri siswa ini?";
        if (action === 'reject-withdrawal') confirmMsg = "Yakin ingin menolak pengunduran diri (kembali ke Aktif)?";
        
        if (!window.confirm(confirmMsg)) return;

        try {
            const response = await api.post(`/api/admin/pendaftaran/${id}/${action}`);
            if (response.data.success) {
                setRegistrations(prev => prev.filter(reg => reg.id !== id));
            } else {
                alert(response.data.message || 'Gagal memproses pendaftaran');
            }
        } catch (err) {
            alert('Gagal memproses permintaan');
        }
    };

    const filteredData = registrations.filter(reg =>
        reg.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.nama_ekskul?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-[#000080] tracking-tight">Persetujuan Ekskul</h1>
                    <p className="text-slate-500 font-medium">Validasi surat izin dan setujui pendaftaran siswa.</p>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 self-start overflow-x-auto max-w-full">
                    {['pending', 'approved', 'rejected', 'pending_withdrawal', 'withdrawn'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`
                                px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap
                                ${filterStatus === status
                                    ? 'bg-[#000080] text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:text-[#000080] hover:bg-slate-50'}
                            `}
                        >
                            {status === 'pending' ? 'Pendaftaran' : 
                             status === 'approved' ? 'Aktif' : 
                             status === 'rejected' ? 'Ditolak' :
                             status === 'pending_withdrawal' ? 'Pengajuan Keluar' : 'Sudah Keluar'}
                        </button>
                    ))}
                </div>
            </div>

            {/* SEARCH & STATS */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#000080] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama siswa atau ekstrakurikuler..."
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="bg-blue-50 text-[#000080] px-6 py-4 rounded-3xl border border-blue-100 font-extrabold flex items-center gap-3 shrink-0 whitespace-nowrap">
                    <Activity size={18} className="animate-pulse" />
                    Total: <span className="text-2xl">{filteredData.length}</span> Permintaan
                </div>
            </div>

            {/* LIST */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                </div>
            ) : filteredData.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredData.map((reg) => (
                        <div key={reg.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6 group">
                            <div className="w-16 h-16 bg-blue-50 text-[#000080] rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                <Trophy size={28} />
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-slate-800 leading-none">{reg.nama_siswa}</h3>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[9px] font-black uppercase tracking-widest">{reg.nama_kelas}</span>
                                </div>
                                <p className="text-slate-500 font-bold">{reg.nama_ekskul}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock size={10} /> {new Date(reg.tanggal_daftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                {reg.surat_ijin && filterStatus !== 'pending_withdrawal' && filterStatus !== 'withdrawn' && (
                                    <button
                                        onClick={() => setSelectedImg(reg.surat_ijin)}
                                        className="flex items-center gap-2 px-5 py-3 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-slate-100"
                                    >
                                        <Eye size={16} /> Izin Ortu
                                    </button>
                                )}

                                {(filterStatus === 'pending_withdrawal' || filterStatus === 'withdrawn') && reg.surat_keluar && (
                                    <button
                                        onClick={() => setSelectedImg(reg.surat_keluar)}
                                        className="flex items-center gap-2 px-5 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-amber-100"
                                    >
                                        <FileText size={16} /> Surat Pemberhentian
                                    </button>
                                )}

                                {filterStatus === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleAction(reg.id, 'reject')}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all border border-rose-100 shadow-sm"
                                            title="Tolak Pendaftaran"
                                        >
                                            <XCircle size={16} /> Tidak Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(reg.id, 'approve')}
                                            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20"
                                            title="Setujui Pendaftaran"
                                        >
                                            <CheckCircle2 size={16} /> Approve
                                        </button>
                                    </>
                                )}

                                {filterStatus === 'pending_withdrawal' && (
                                    <>
                                        <div className="hidden md:block w-[1px] h-10 bg-slate-100 mx-2"></div>
                                        <div className="max-w-[200px] text-xs font-medium italic text-slate-400 mr-4">
                                            "{reg.alasan_keluar}"
                                        </div>
                                        <button
                                            onClick={() => handleAction(reg.id, 'reject-withdrawal')}
                                            className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all border border-rose-100"
                                            title="Tolak Pengunduran Diri"
                                        >
                                            <XCircle size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleAction(reg.id, 'approve-withdrawal')}
                                            className="px-6 py-3 bg-amber-600 text-white hover:bg-amber-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2"
                                        >
                                            Setujui Keluar <CheckCircle2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 shadow-inner">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <FileText size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Tidak ada permintaan</h3>
                    <p className="text-slate-300 font-medium">Semua pendaftaran sudah diproses.</p>
                </div>
            )}

            {/* IMAGE MODAL */}
            {selectedImg && (
                <div className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="relative bg-white rounded-[2.5rem] p-4 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <button
                            onClick={() => setSelectedImg(null)}
                            className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors z-10"
                        >
                            <XCircle size={32} stroke="black" />
                        </button>

                        <div className="flex-1 overflow-auto bg-slate-50 rounded-[2rem] flex items-center justify-center min-h-0">
                            <img
                                src={`http://localhost/SIKASA%20PPSI/backend/${selectedImg}`}
                                alt="Surat Izin"
                                className="max-w-full h-auto object-contain"
                            />
                        </div>

                        <div className="mt-4 flex items-center justify-between px-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#000080]">Lampiran Surat Persetujuan Orang Tua</p>
                            <a
                                href={`http://localhost/SIKASA%20PPSI/backend/${selectedImg}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#000080] hover:underline font-black text-xs flex items-center gap-2"
                            >
                                <ExternalLink size={14} /> Buka di Tab Baru
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPersetujuan;
