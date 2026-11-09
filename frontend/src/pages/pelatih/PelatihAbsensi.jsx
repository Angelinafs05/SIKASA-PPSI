import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, Search, Activity, Calendar, User, CheckCircle, Edit2, BookOpen } from 'lucide-react';
import api from '../../api/api';

const PelatihAbsensi = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [isAlreadySaved, setIsAlreadySaved] = useState(false);
    const [materi, setMateri] = useState('');

    useEffect(() => {
        fetchData(tanggal);
    }, [tanggal]);

    const fetchData = async (selectedDate) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/pelatih/absensi?tanggal=${selectedDate}`);
            if (response.data.success) {
                const siswaList = response.data.data.siswa || [];
                const alreadyRecorded = siswaList.some(s => s.status_absensi !== null && s.status_absensi !== undefined && s.status_absensi !== '');
                setIsAlreadySaved(alreadyRecorded);
                setMateri(response.data.data.materi || '');

                setStudents(siswaList.map(s => ({
                    ...s,
                    status_absensi: s.status_absensi || 'Hadir' // Default Hadir 
                })));
            } else {
                setError(response.data.message || 'Gagal mengambil data absensi');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi ke server');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (id, newStatus) => {
        setStudents(prev => prev.map(s =>
            s.id === id ? { ...s, status_absensi: newStatus } : s
        ));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const payload = {
                tanggal: tanggal,
                materi: materi,
                absensi: students.map(s => ({
                    siswa_id: s.id,
                    status: s.status_absensi
                }))
            };

            const response = await api.post('/api/pelatih/absensi', payload);
            if (response.data.success) {
                setIsAlreadySaved(true);
                setSuccess(isAlreadySaved ? 'Perubahan absensi berhasil diperbarui!' : 'Absensi berhasil disimpan!');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(response.data.message || 'Gagal menyimpan absensi');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan');
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Hadir': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Izin': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Sakit': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Alfa': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const filteredStudents = students.filter(s =>
        s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="px-3 py-1 bg-blue-50 text-[#000080] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 flex items-center gap-1.5">
                            <ClipboardCheck size={12} /> Absensi Ekskul
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight flex items-center gap-3">
                        Daftar Kehadiran Siswa
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Pilih tanggal dan catat kehadiran siswa pada kegiatan ekstrakurikuler.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* TANGGAL FILTER */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                        />
                    </div>

                    {/* SEARCH */}
                    <div className="relative group flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#000080] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari siswa atau kelas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-200 font-bold shadow-sm animate-shake">
                    <Activity size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-emerald-200 font-bold shadow-sm animate-bounce-short">
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {/* MATERI PERTEMUAN INPUT */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={18} className="text-[#000080]" />
                    Materi / Topik Latihan Hari Ini:
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={materi}
                        onChange={(e) => setMateri(e.target.value)}
                        placeholder="Contoh: Pengenalan Teknik Dribbling dan Shooting..."
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all placeholder:text-slate-400 font-sans"
                    />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                    Materi ini otomatis terhubung ke menu <strong>Input Nilai</strong> untuk penilaian performa siswa pada tanggal tersebut.
                </p>
            </div>

            {/* ATTENDANCE TABLE */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Siswa</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[15%] text-center">Kehadiran</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ubah Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((siswa) => (
                                    <tr key={siswa.id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs group-hover:bg-blue-100 group-hover:text-[#000080] transition-all border border-white">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-800 group-hover:text-[#000080] transition-colors">{siswa.nama_siswa}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Kelas {siswa.nama_kelas || '-'}</p>
                                                    {siswa.keterangan && (
                                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                            <Activity size={12} /> Keterangan: {siswa.keterangan}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(siswa.status_absensi)}`}>
                                                {siswa.status_absensi}
                                            </span>
                                            {siswa.status_absensi === 'Izin' && (
                                                <span className={`block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                                    siswa.status_izin === 'Disetujui'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : siswa.status_izin === 'Ditolak'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {siswa.status_izin === 'Disetujui' ? '✓ Disetujui Admin' : siswa.status_izin === 'Ditolak' ? '✗ Ditolak Admin' : '⏳ Menunggu Admin'}
                                                </span>
                                            )}
                                            {siswa.surat_ijin && siswa.status_absensi === 'Izin' && (
                                                <a
                                                    href={`http://localhost/SIKASA%20PPSI/backend/${siswa.surat_ijin}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block mt-2 text-[10px] font-bold text-[#000080] hover:underline"
                                                >
                                                    Lihat Surat
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                {['Hadir', 'Izin', 'Sakit', 'Alfa'].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(siswa.id, status)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${siswa.status_absensi === status
                                                                ? getStatusColor(status) + ' shadow-sm'
                                                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-8 py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-100">
                                            <ClipboardCheck size={32} className="text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-400 tracking-tight">Tidak Ada Data</h3>
                                        <p className="text-slate-400 text-sm font-medium mt-1">Belum ada siswa yang mendaftar atau tidak ada data absensi untuk tanggal ini.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SAVE ACTION */}
            {students.length > 0 && (
                <div className="fixed bottom-8 right-8 z-30">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className={`flex items-center gap-3 px-8 py-4 text-white rounded-[2rem] font-black text-sm shadow-2xl hover:-translate-y-1 active:scale-95 transition-all group disabled:opacity-70 ${
                            isAlreadySaved
                                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-900/30"
                                : "bg-[#000080] hover:bg-blue-900 shadow-blue-900/40"
                        }`}
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                {isAlreadySaved ? "Memperbarui..." : "Menyimpan..."}
                            </>
                        ) : isAlreadySaved ? (
                            <>
                                <Edit2 size={20} className="group-hover:scale-110 transition-transform" />
                                Edit Absensi
                            </>
                        ) : (
                            <>
                                <Save size={20} className="group-hover:rotate-12 transition-transform" />
                                Simpan Absensi
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PelatihAbsensi;
