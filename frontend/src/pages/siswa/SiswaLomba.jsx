import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Calendar, MapPin, CheckCircle, XCircle, Clock, AlertCircle, FileText, UploadCloud, Download } from 'lucide-react';
import api from '../../api/api';

const SiswaLomba = () => {
    const { user } = useAuth();
    const [lombaList, setLombaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [activeConfirmation, setActiveConfirmation] = useState(null); // lomba id
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [statusIzin, setStatusIzin] = useState(''); // 'Disetujui' | 'Ditolak'
    const [alasanTolak, setAlasanTolak] = useState('');
    const [suratBalasan, setSuratBalasan] = useState(null);

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

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setSuratBalasan(e.target.files[0]);
        }
    };

    const handleConfirmSubmit = async (e, pesertaId) => {
        e.preventDefault();
        if (!statusIzin) return;

        if (statusIzin === 'Disetujui' && !suratBalasan) {
            setError('Persetujuan lomba wajib menyertakan foto surat pernyataan/balasan yang ditandatangani orang tua.');
            setTimeout(() => setError(''), 5000);
            return;
        }

        if (statusIzin === 'Ditolak' && !alasanTolak) {
            setError('Silakan tuliskan alasan penolakan.');
            setTimeout(() => setError(''), 5000);
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('peserta_id', pesertaId);
            formData.append('status_izin', statusIzin);
            if (alasanTolak) formData.append('alasan_tolak', alasanTolak);
            if (suratBalasan) formData.append('surat_balasan', suratBalasan);

            const response = await api.post('/api/siswa/lomba/konfirmasi', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setSuccess('Konfirmasi berhasil disimpan.');
                setActiveConfirmation(null);
                setStatusIzin('');
                setAlasanTolak('');
                setSuratBalasan(null);
                fetchLomba();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat memproses konfirmasi.');
            setTimeout(() => setError(''), 5000);
        } finally {
            setSubmitting(false);
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
                        {`Halo ${user?.nama || 'Siswa'}, halaman ini berisi daftar kegiatan perlombaan di mana Anda terpilih menjadi delegasi perwakilan sekolah.\nSilakan konfirmasi persetujuan dari orang tua Anda.`}
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
            {success && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div><h3 className="font-bold">Berhasil</h3><p className="text-sm mt-1">{success}</p></div>
                </div>
            )}

            {/* CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {lombaList.length > 0 ? (
                    lombaList.map((lomba) => {
                        const tglObj = new Date(lomba.tanggal_pelaksanaan);
                        const tglStr = tglObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                        const isPending = lomba.status_izin === 'Menunggu';

                        return (
                            <div key={lomba.id} className={`bg-white rounded-3xl border shadow-sm flex flex-col overflow-hidden transition-all ${activeConfirmation === lomba.id ? 'border-[#000080] ring-4 ring-[#000080]/10' : 'border-slate-200'}`}>
                                <div className={`p-6 border-b flex flex-col gap-4 ${isPending ? 'bg-amber-50/50 border-amber-100' : (lomba.status_izin === 'Disetujui' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100')}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2.5 rounded-xl shadow-sm">
                                                <Trophy size={20} className={isPending ? 'text-amber-500' : 'text-[#000080]'} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-800">{lomba.nama_lomba}</h3>
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Tahun Ajaran {lomba.tahun_ajaran} - {lomba.semester}</span>
                                            </div>
                                        </div>
                                        
                                        {/* Status Badge */}
                                        <div className="shrink-0 flex items-center justify-end">
                                            {lomba.status_izin === 'Disetujui' && <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200"><CheckCircle size={12}/> Disetujui</span>}
                                            {lomba.status_izin === 'Ditolak' && <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 font-bold text-xs rounded-full border border-rose-200"><XCircle size={12}/> Ditolak</span>}
                                            {lomba.status_izin === 'Menunggu' && <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-full border border-amber-200 animate-pulse"><Clock size={12}/> Menunggu Verifikasi Ortu</span>}
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

                                    {/* Action Area */}
                                    {isPending ? (
                                        activeConfirmation !== lomba.id ? (
                                            <div className="flex flex-col gap-3 mt-auto">
                                                {lomba.surat_edaran && (
                                                    <a href={`http://localhost/SIKASA/backend/${lomba.surat_edaran}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold transition-colors">
                                                        <Download size={16}/> Unduh Surat Edaran Sekolah
                                                    </a>
                                                )}
                                                <button onClick={() => setActiveConfirmation(lomba.id)} className="w-full bg-[#000080] hover:bg-[#000066] text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
                                                    Klik untuk Konfirmasi Persetujuan
                                                </button>
                                            </div>
                                        ) : (
                                            // FORM KONFIRMASI
                                            <form onSubmit={(e) => handleConfirmSubmit(e, lomba.peserta_id)} className="space-y-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2 mt-auto">
                                                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Status Persetujuan Orang Tua</h4>
                                                
                                                <div className="flex gap-3">
                                                    <label className={`flex-1 flex justify-center items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${statusIzin === 'Disetujui' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                                        <input type="radio" name={`status_${lomba.id}`} value="Disetujui" className="hidden" onChange={(e) => {setStatusIzin(e.target.value); setAlasanTolak('');}}/>
                                                        <CheckCircle size={18}/> <span className="font-bold text-sm">Disetujui</span>
                                                    </label>
                                                    <label className={`flex-1 flex justify-center items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${statusIzin === 'Ditolak' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                                        <input type="radio" name={`status_${lomba.id}`} value="Ditolak" className="hidden" onChange={(e) => setStatusIzin(e.target.value)}/>
                                                        <XCircle size={18}/> <span className="font-bold text-sm">Ditolak</span>
                                                    </label>
                                                </div>

                                                {statusIzin === 'Disetujui' && (
                                                    <div className="space-y-2 pt-2 animate-in fade-in">
                                                        <label className="text-xs font-bold text-slate-500">Unggah Bukti Tanda Tangan Ortu (Wajib) <span className="text-rose-500">*</span></label>
                                                        <input type="file" required accept="image/*,.pdf" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer border border-slate-200 rounded-lg bg-slate-50"/>
                                                    </div>
                                                )}

                                                {statusIzin === 'Ditolak' && (
                                                    <div className="space-y-2 pt-2 animate-in fade-in">
                                                        <label className="text-xs font-bold text-slate-500">Alasan Penolakan Ortu <span className="text-rose-500">*</span></label>
                                                        <textarea required value={alasanTolak} onChange={(e) => setAlasanTolak(e.target.value)} rows="2" className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:border-rose-500" placeholder="Misal: Bertabrakan dengan acara keluarga"/>
                                                    </div>
                                                )}

                                                <div className="pt-3 flex gap-2">
                                                    <button type="button" onClick={() => {setActiveConfirmation(null); setStatusIzin('');}} disabled={submitting} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
                                                    <button type="submit" disabled={submitting || !statusIzin} className="flex-1 bg-[#000080] hover:bg-[#000066] text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50">
                                                        {submitting ? 'Memproses...' : 'Kirim'}
                                                    </button>
                                                </div>
                                            </form>
                                        )
                                    ) : (
                                        // SUDAH MERESPON
                                        <div className="mt-auto bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <p className="text-xs font-bold text-slate-500 mb-2">Respon Anda:</p>
                                            {lomba.status_izin === 'Disetujui' ? (
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold text-emerald-700">Berkas persetujuan telah diserahkan.</p>
                                                    {lomba.surat_balasan && <a href={`http://localhost/SIKASA/backend/${lomba.surat_balasan}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#000080] hover:underline flex items-center gap-1"><FileText size={12}/> Lihat File</a>}
                                                </div>
                                            ) : (
                                                <p className="text-sm font-bold text-rose-700">Alasan penolakan: <span className="font-medium text-rose-600 block mt-1">{lomba.alasan_tolak}</span></p>
                                            )}
                                        </div>
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
