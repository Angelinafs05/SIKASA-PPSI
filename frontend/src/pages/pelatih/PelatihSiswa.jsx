import React, { useState, useEffect } from 'react';
import { Users, Search, Activity, Calendar, Trophy, User } from 'lucide-react';
import api from '../../api/api';

const PelatihSiswa = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dashboardInfo, setDashboardInfo] = useState({
        ekskul_nama: '',
        periode: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Get general dashboard info for the header (ekskul name, period)
                const dashRes = await api.get('/api/pelatih/dashboard');
                if (dashRes.data.success) {
                    setDashboardInfo({
                        ekskul_nama: dashRes.data.data.pelatih?.nama_ekskul || 'Ekskul',
                        periode: `${dashRes.data.data.periode?.tahun_ajaran} - ${dashRes.data.data.periode?.semester}`
                    });
                }

                // Get approved students
                const sisRes = await api.get('/api/pelatih/siswa');
                if (sisRes.data.success) {
                    setStudents(sisRes.data.data);
                } else {
                    setError(sisRes.data.message || 'Gagal mengambil data siswa');
                }
            } catch (err) {
                setError('Terjadi kesalahan koneksi ke server');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredStudents = students.filter(s =>
        s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memuat data siswa...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="px-3 py-1 bg-blue-50 text-[#000080] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 flex items-center gap-1.5">
                            <Trophy size={12} /> {dashboardInfo.ekskul_nama}
                        </div>
                        <div className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100 flex items-center gap-1.5">
                            <Calendar size={12} /> {dashboardInfo.periode}
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight flex items-center gap-3">
                        <Users className="text-[#000080]" size={32} />
                        Daftar Siswa Ekskul
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Daftar siswa yang telah disetujui bergabung di ekstrakurikuler Anda.
                    </p>
                </div>

                {/* HEADER RIGHT: TOTAL KEANGGOTAAN CARD + SEARCH */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {/* TOTAL KEANGGOTAAN BADGE/CARD */}
                    <div className="bg-[#000080] text-white px-5 py-3 rounded-2xl shadow-md shadow-blue-900/10 flex items-center gap-4 relative overflow-hidden">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
                            <Activity className="text-white" size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest leading-none mb-1">Total Keanggotaan</p>
                            <div className="flex items-baseline gap-1.5 leading-none">
                                <span className="text-2xl font-black tabular-nums">{filteredStudents.length}</span>
                                <span className="text-[10px] font-bold text-blue-200 uppercase">Siswa Aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* SEARCH INPUT */}
                    <div className="relative w-full sm:w-64 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#000080] transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama atau kelas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-200 font-bold shadow-sm">
                    <Activity size={18} />
                    {error}
                </div>
            )}

            {/* TABLE VIEW */}
            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">No</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kelas</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tanggal Terdaftar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((siswa, index) => (
                                <tr key={siswa.id_daftar} className="hover:bg-blue-50/50 transition-all duration-200 group">
                                    <td className="px-8 py-5 text-center font-black text-slate-400 text-xs">
                                        {index + 1}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#000080] flex items-center justify-center font-black text-xs group-hover:scale-110 transition-transform shadow-sm border border-white">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-[#000080] group-hover:translate-x-1 transition-transform">{siswa.nama_siswa}</p>
                                                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">SISWA AKTIF</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tighter">
                                            {siswa.nama_kelas}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-slate-500 text-sm">
                                        {new Date(siswa.tanggal_daftar).toLocaleDateString('id-ID', {
                                             day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-8 py-20 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-100">
                                        <Users size={32} className="text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-400 tracking-tight">Tidak Ada Siswa</h3>
                                    <p className="text-slate-400 text-sm font-medium mt-1">Belum ada siswa yang terdaftar atau disetujui.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PelatihSiswa;
