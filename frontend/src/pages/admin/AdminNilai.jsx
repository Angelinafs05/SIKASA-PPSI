import React, { useState, useEffect } from 'react';
import { Award, Search, Users, Activity, CheckCircle, Trophy, BarChart3, ChevronRight, FileSpreadsheet } from 'lucide-react';
import api from '../../api/api';

const AdminNilai = () => {
    const [ekskuls, setEkskuls] = useState([]);
    const [selectedEkskul, setSelectedEkskul] = useState('');
    const [nilaiList, setNilaiList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEkskuls();
    }, []);

    useEffect(() => {
        if (selectedEkskul) {
            fetchNilai(selectedEkskul);
        }
    }, [selectedEkskul]);

    const fetchEkskuls = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/admin/ekskul');
            if (res.data.success) {
                setEkskuls(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedEkskul(res.data.data[0].id.toString());
                }
            }
        } catch (err) {
            setError('Gagal memuat daftar ekstrakurikuler');
        } finally {
            setLoading(false);
        }
    };

    const fetchNilai = async (ekskulId) => {
        try {
            setLoading(true);
            const res = await api.get(`/api/admin/monitoring/nilai?ekskul_id=${ekskulId}`);
            if (res.data.success) {
                setNilaiList(res.data.data.siswa || []);
            }
        } catch (err) {
            setError('Gagal memuat nilai siswa');
        } finally {
            setLoading(false);
        }
    };

    const getGradeLevel = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return { label: '-', color: 'text-slate-400 bg-slate-50' };
        if (num >= 85) return { label: 'A', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        if (num >= 75) return { label: 'B', color: 'text-blue-700 bg-blue-50 border-blue-200' };
        if (num >= 60) return { label: 'C', color: 'text-amber-700 bg-amber-50 border-amber-200' };
        return { label: 'D', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    };

    const filtered = nilaiList.filter(s =>
        s.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Data Penilaian Siswa</h1>
                    <p className="text-slate-500 font-medium mt-1">Pantau dan kelola pencapaian nilai ekstrakurikuler siswa</p>
                </div>
            </div>

            {/* FILTER & SEARCH */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Ekstrakurikuler</label>
                    <select
                        value={selectedEkskul}
                        onChange={(e) => setSelectedEkskul(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                    >
                        {ekskuls.map(e => (
                            <option key={e.id} value={e.id}>{e.nama_ekskul}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pencarian Siswa</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari siswa atau kelas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Trophy className="text-[#000080]" size={20} />
                        Daftar Nilai Siswa
                    </h2>
                    <span className="text-xs font-bold bg-blue-50 text-[#000080] px-3 py-1.5 rounded-full border border-blue-100">
                        Total {filtered.length} Siswa
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm font-bold text-slate-500">Memuat nilai...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Award size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-slate-600">Belum ada nilai</p>
                        <p className="text-xs text-slate-400 mt-1">Belum ada nilai yang diinputkan untuk ekstrakurikuler ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">No</th>
                                    <th className="px-6 py-4">No. Induk</th>
                                    <th className="px-6 py-4">Nama Siswa</th>
                                    <th className="px-6 py-4">Kelas</th>
                                    <th className="px-6 py-4 text-center">Nilai Angka</th>
                                    <th className="px-6 py-4 text-center">Predikat</th>
                                    <th className="px-6 py-4">Keterangan / Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filtered.map((s, idx) => {
                                    const grade = getGradeLevel(s.nilai);
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{s.no_induk || '-'}</td>
                                            <td className="px-6 py-4 font-black text-slate-800">{s.nama_siswa}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                                                    {s.nama_kelas || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-base text-slate-800">
                                                {s.nilai !== null && s.nilai !== undefined ? s.nilai : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full font-black text-xs border ${grade.color}`}>
                                                    {grade.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs italic">
                                                {s.keterangan || 'Tidak ada catatan'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminNilai;
