import React, { useState, useEffect } from 'react';
import { Award, Search, Users, Activity, CheckCircle, Trophy, BarChart3, ChevronRight, FileSpreadsheet, Download, Printer } from 'lucide-react';
import api from '../../api/api';

const AdminRekapNilai = () => {
    const [ekskuls, setEkskuls] = useState([]);
    const [selectedEkskul, setSelectedEkskul] = useState('');
    const [rekapList, setRekapList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEkskuls();
    }, []);

    useEffect(() => {
        fetchRekap(selectedEkskul);
    }, [selectedEkskul]);

    const fetchEkskuls = async () => {
        try {
            const res = await api.get('/api/admin/ekskul');
            if (res.data.success) {
                setEkskuls(res.data.data);
            }
        } catch (err) {
            setError('Gagal memuat daftar ekstrakurikuler');
        }
    };

    const fetchRekap = async (ekskulId = '') => {
        try {
            setLoading(true);
            const query = ekskulId ? `?ekskul_id=${ekskulId}` : '';
            const res = await api.get(`/api/admin/rekap-nilai${query}`);
            if (res.data.success) {
                setRekapList(res.data.data || []);
            }
        } catch (err) {
            setError('Gagal memuat rekap nilai');
        } finally {
            setLoading(false);
        }
    };

    const filtered = rekapList.filter(s =>
        s.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_ekskul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Statistik Rekapitulasi
    const totalSiswa = filtered.length;
    const nilaiValid = filtered.filter(f => f.nilai !== null && f.nilai !== undefined && !isNaN(Number(f.nilai)));
    const avgNilai = nilaiValid.length > 0 
        ? (nilaiValid.reduce((acc, curr) => acc + Number(curr.nilai), 0) / nilaiValid.length).toFixed(1)
        : 0;
    const countA = filtered.filter(f => f.predikat === 'A').length;
    const countB = filtered.filter(f => f.predikat === 'B').length;
    const countC = filtered.filter(f => f.predikat === 'C').length;
    const countD = filtered.filter(f => f.predikat === 'D').length;

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Rekapitulasi Nilai</h1>
                    <p className="text-slate-500 font-medium mt-1">Dashboard analisis dan statistik capaian nilai siswa per ekstrakurikuler</p>
                </div>
            </div>

            {/* STATISTIK CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Siswa</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{totalSiswa}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm bg-gradient-to-br from-white to-blue-50/40">
                    <p className="text-xs font-bold text-[#000080] uppercase tracking-wider">Rata-Rata</p>
                    <p className="text-2xl font-black text-[#000080] mt-1">{avgNilai}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/30">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Predikat A</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1">{countA}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm bg-blue-50/30">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Predikat B</p>
                    <p className="text-2xl font-black text-blue-700 mt-1">{countB}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm bg-amber-50/30">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Predikat C</p>
                    <p className="text-2xl font-black text-amber-700 mt-1">{countC}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm bg-rose-50/30">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Predikat D</p>
                    <p className="text-2xl font-black text-rose-700 mt-1">{countD}</p>
                </div>
            </div>

            {/* FILTER & SEARCH */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Ekstrakurikuler</label>
                    <select
                        value={selectedEkskul}
                        onChange={(e) => setSelectedEkskul(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                    >
                        <option value="">Semua Ekstrakurikuler</option>
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
                            placeholder="Cari siswa, kelas, ekskul..."
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
                        Rekapitulasi Nilai Siswa
                    </h2>
                    <span className="text-xs font-bold bg-blue-50 text-[#000080] px-3 py-1.5 rounded-full border border-blue-100">
                        Total {filtered.length} Data
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm font-bold text-slate-500">Memuat rekapitulasi nilai...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Award size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-slate-600">Tidak ada rekapitulasi nilai</p>
                        <p className="text-xs text-slate-400 mt-1">Belum ada nilai yang terdata pada kriteria ini.</p>
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
                                    <th className="px-6 py-4">Ekstrakurikuler</th>
                                    <th className="px-6 py-4 text-center">Nilai Angka</th>
                                    <th className="px-6 py-4 text-center">Predikat</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filtered.map((item, idx) => (
                                    <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{item.no_induk || '-'}</td>
                                        <td className="px-6 py-4 font-black text-slate-800">{item.nama_siswa}</td>
                                        <td className="px-6 py-4 font-bold text-slate-600">{item.nama_kelas || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-50 text-[#000080] border border-blue-100 rounded-full font-bold text-xs inline-block">
                                                {item.nama_ekskul}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-black text-slate-800">
                                            {item.nilai !== null ? item.nilai : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full font-black text-xs ${
                                                item.predikat === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                item.predikat === 'B' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                item.predikat === 'C' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                item.predikat === 'D' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                                {item.predikat}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs italic">{item.keterangan || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRekapNilai;
