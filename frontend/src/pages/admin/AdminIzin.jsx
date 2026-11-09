import React, { useState, useEffect } from 'react';
import { Calendar, Search, Users, Activity, CheckCircle, Clock, AlertCircle, FileText, Check, X, Eye } from 'lucide-react';
import api from '../../api/api';

const AdminIzin = () => {
    const [izinList, setIzinList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedImg, setSelectedImg] = useState(null);

    useEffect(() => {
        fetchIzin();
    }, [filterStatus]);

    const fetchIzin = async () => {
        try {
            setLoading(true);
            const query = filterStatus ? `?status_izin=${filterStatus}` : '';
            const res = await api.get(`/api/admin/izin${query}`);
            if (res.data.success) {
                setIzinList(res.data.data || []);
            }
        } catch (err) {
            setError('Gagal mengambil data permohonan izin');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        const actionLabel = status === 'Disetujui' ? 'menyetujui' : 'menolak';
        const catatan = prompt(`Tambahkan catatan/alasan jika ingin ${actionLabel} izin ini (opsional):`, '');
        if (catatan === null) return;

        try {
            const res = await api.post(`/api/admin/izin/${id}/status`, {
                status_izin: status,
                catatan_izin: catatan
            });
            if (res.data.success) {
                setSuccess(`Izin berhasil diubah menjadi ${status}`);
                fetchIzin();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError('Gagal memproses status izin');
            setTimeout(() => setError(''), 3000);
        }
    };

    const filtered = izinList.filter(i =>
        i.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.nama_ekskul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderStatusBadge = (st) => {
        switch (st) {
            case 'Disetujui':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs"><CheckCircle size={14} /> Disetujui</span>;
            case 'Ditolak':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-xs"><AlertCircle size={14} /> Ditolak</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-xs"><Clock size={14} /> Menunggu</span>;
        }
    };

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Kelola Izin Siswa</h1>
                    <p className="text-slate-500 font-medium mt-1">Daftar dan validasi pengajuan izin siswa untuk kegiatan ekstrakurikuler</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2 font-bold text-sm">
                    <AlertCircle size={18} /> {error}
                </div>
            )}
            {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-2 font-bold text-sm">
                    <CheckCircle size={18} /> {success}
                </div>
            )}

            {/* FILTER & SEARCH */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {['', 'Menunggu', 'Disetujui', 'Ditolak'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                                filterStatus === st
                                    ? 'bg-[#000080] text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {st === '' ? 'Semua Status' : st}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari siswa, ekskul..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none text-sm"
                    />
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <FileText className="text-[#000080]" size={20} />
                        Daftar Pengajuan Izin
                    </h2>
                    <span className="text-xs font-bold bg-blue-50 text-[#000080] px-3 py-1.5 rounded-full border border-blue-100">
                        Total {filtered.length} Pengajuan
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm font-bold text-slate-500">Memuat data pengajuan izin...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <FileText size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-slate-600">Tidak ada pengajuan izin</p>
                        <p className="text-xs text-slate-400 mt-1">Belum ada siswa yang mengajukan izin sesuai filter ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Siswa & Kelas</th>
                                    <th className="px-6 py-4">Ekstrakurikuler</th>
                                    <th className="px-6 py-4">Tanggal Izin</th>
                                    <th className="px-6 py-4">Alasan / Bukti</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filtered.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <span className="font-black text-slate-800 block text-base">{item.nama_siswa}</span>
                                                <span className="text-xs font-bold text-slate-400">{item.nama_kelas || '-'} • NIS {item.no_induk}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-50 text-[#000080] border border-blue-100 rounded-full font-bold text-xs inline-block">
                                                {item.nama_ekskul}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-700">
                                                {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-600 font-medium mb-1">{item.keterangan || '-'}</p>
                                            {item.surat_ijin && (
                                                <button
                                                    onClick={() => setSelectedImg(`http://localhost/SIKASA%20PPSI/backend/${item.surat_ijin}`)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    <Eye size={12} /> Lihat Surat Izin
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {renderStatusBadge(item.status_izin)}
                                            {item.catatan_izin && (
                                                <p className="text-[10px] text-slate-400 mt-1 italic">Catatan: {item.catatan_izin}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.status_izin === 'Menunggu' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleAction(item.id, 'Disetujui')}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1"
                                                        title="Setujui Izin"
                                                    >
                                                        <Check size={14} /> Setujui
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(item.id, 'Ditolak')}
                                                        className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1"
                                                        title="Tolak Izin"
                                                    >
                                                        <X size={14} /> Tolak
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-semibold text-slate-400 italic">
                                                    Selesai Diproses
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* PREVIEW MODAL */}
            {selectedImg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedImg(null)}>
                    <div className="relative bg-white rounded-2xl max-w-2xl max-h-[85vh] p-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <img src={selectedImg} alt="Bukti Surat Izin" className="w-full h-auto max-h-[75vh] object-contain rounded-xl" />
                        <div className="mt-3 text-right">
                            <button onClick={() => setSelectedImg(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminIzin;
