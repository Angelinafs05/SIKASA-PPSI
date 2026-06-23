import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Calendar, MapPin, CheckCircle, XCircle, Clock, AlertCircle, FileText, Download } from 'lucide-react';
import api from '../../api/api';

const SiswaLomba = () => {
    const { user } = useAuth();
    const [lombaList, setLombaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLomba();
    }, []);

    const fetchLomba = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/siswa/lomba');
            if (response.data.success) {
                setLombaList(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengambil data lomba');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memuat delegasi lomba...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight mb-1">
                        Delegasi Lomba Sekolah
                    </h1>
                    <p className="text-slate-500 font-medium whitespace-pre-line">
                        {`Halo ${user?.nama || 'Siswa'}, halaman ini berisi daftar kegiatan perlombaan di mana Anda terpilih menjadi delegasi perwakilan sekolah.\nOrang tua Anda dapat memberikan persetujuan melalui dashboard mereka.`}
                    </p>
                </div>
            </div>

            {/* ALERTS */}
            {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div><h3 className="font-bold">Perhatian</h3><p className="text-sm mt-1">{error}</p></div>
                </div>
            )}

            {/* CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {lombaList.length > 0 ? (
                    lombaList.map((lomba) => {
                        const tglObj = new Date(lomba.tanggal_pelaksanaan);
                        const tglStr = tglObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                        const parentApprovalStatus = lomba.parent_approval_status || 'Menunggu';

                        return (
                            <div key={lomba.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                <div className={`p-6 border-b flex flex-col gap-4 ${parentApprovalStatus === 'Menunggu' ? 'bg-amber-50/50 border-amber-100' : (parentApprovalStatus === 'Disetujui' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100')}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2.5 rounded-xl shadow-sm">
                                                <Trophy size={20} className={parentApprovalStatus === 'Menunggu' ? 'text-amber-500' : (parentApprovalStatus === 'Disetujui' ? 'text-emerald-600' : 'text-rose-600')} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800">{lomba.nama_lomba}</h3>
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Tahun Ajaran {lomba.tahun_ajaran} - {lomba.semester}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Status Badge */}
                                        <div className="shrink-0 flex items-center justify-end">
                                            {parentApprovalStatus === 'Disetujui' && <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200"><CheckCircle size={12}/> Disetujui</span>}
                                            {parentApprovalStatus === 'Ditolak' && <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 font-bold text-xs rounded-full border border-rose-200"><XCircle size={12}/> Ditolak</span>}
                                            {parentApprovalStatus === 'Menunggu' && <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-full border border-amber-200 animate-pulse"><Clock size={12}/> Menunggu Persetujuan</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col gap-5">
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-start gap-3">
                                            <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</p>
                                                <p className="text-sm font-bold text-slate-700">{tglStr}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempat</p>
                                                <p className="text-sm font-bold text-slate-700">{lomba.tempat}</p>
                                            </div>
                                        </div>
                                        {lomba.deskripsi && (
                                            <div className="flex items-start gap-3">
                                                <FileText size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi</p>
                                                    <p className="text-sm font-medium text-slate-600 line-clamp-2">{lomba.deskripsi}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Parent Approval Status Section */}
                                    <div className="mt-auto bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Status Persetujuan Orang Tua</p>
                                        
                                        {parentApprovalStatus === 'Menunggu' ? (
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-amber-500 animate-spin" />
                                                <p className="text-sm font-bold text-amber-700">Menunggu persetujuan dari orang tua Anda</p>
                                            </div>
                                        ) : parentApprovalStatus === 'Disetujui' ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle size={16} className="text-emerald-600" />
                                                    <p className="text-sm font-bold text-emerald-700">Disetujui oleh orang tua</p>
                                                </div>
                                                {lomba.parent_approval_date && (
                                                    <p className="text-xs text-slate-500 ml-6">Tanggal: {new Date(lomba.parent_approval_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                )}
                                                {lomba.parent_approval_file && (
                                                    <a href={`http://localhost/SIKASA/backend/${lomba.parent_approval_file}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 ml-6">
                                                        <Download size={12}/> Lihat Surat Persetujuan
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <XCircle size={16} className="text-rose-600" />
                                                    <p className="text-sm font-bold text-rose-700">Ditolak oleh orang tua</p>
                                                </div>
                                                {lomba.parent_approval_reason && (
                                                    <p className="text-xs text-rose-600 ml-6 font-medium">Alasan: {lomba.parent_approval_reason}</p>
                                                )}
                                                {lomba.parent_approval_date && (
                                                    <p className="text-xs text-slate-500 ml-6">Tanggal: {new Date(lomba.parent_approval_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {lomba.surat_edaran && (
                                        <a href={`http://localhost/SIKASA/backend/${lomba.surat_edaran}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold transition-colors">
                                            <Download size={16}/> Unduh Surat Edaran Sekolah
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-700 mb-2">Belum Ada Delegasi Lomba</h3>
                        <p className="text-slate-500 font-medium max-w-md mx-auto">Anda belum terdaftar sebagai kandidat delegasi lomba apapun saat ini. Tetap semangat berlatih!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiswaLomba;
