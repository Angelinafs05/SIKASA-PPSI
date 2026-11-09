import React, { useState, useEffect } from 'react';
import { Calendar, Search, Users, Activity, CheckCircle, Clock, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import api from '../../api/api';

const AdminAbsensi = () => {
    const [ekskuls, setEkskuls] = useState([]);
    const [selectedEkskul, setSelectedEkskul] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [absensiList, setAbsensiList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEkskuls();
    }, []);

    useEffect(() => {
        if (selectedEkskul) {
            fetchAbsensi(selectedEkskul, tanggal);
        }
    }, [selectedEkskul, tanggal]);

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

    const fetchAbsensi = async (ekskulId, tgl) => {
        try {
            setLoading(true);
            const res = await api.get(`/api/admin/monitoring/absensi?ekskul_id=${ekskulId}&tanggal=${tgl}`);
            if (res.data.success) {
                setAbsensiList(res.data.data.siswa || []);
            }
        } catch (err) {
            setError('Gagal memuat absensi');
        } finally {
            setLoading(false);
        }
    };

    const filtered = absensiList.filter(s =>
        s.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Hadir':
                return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-xs flex items-center gap-1.5 w-max"><CheckCircle size={14} /> Hadir</span>;
            case 'Izin':
                return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold text-xs flex items-center gap-1.5 w-max"><Clock size={14} /> Izin</span>;
            case 'Sakit':
                return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-xs flex items-center gap-1.5 w-max"><AlertCircle size={14} /> Sakit</span>;
            case 'Alfa':
                return <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-xs flex items-center gap-1.5 w-max"><AlertCircle size={14} /> Alfa</span>;
            default:
                return <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full font-bold text-xs flex items-center gap-1.5 w-max">Belum Diabsen</span>;
        }
    };

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Data Absensi Siswa</h1>
                    <p className="text-slate-500 font-medium mt-1">Pantau dan kelola kehadiran siswa pada setiap kegiatan ekstrakurikuler</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2 font-bold text-sm">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* FILTER PANEL */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Kegiatan</label>
                    <input
                        type="date"
                        value={tanggal}
                        onChange={(e) => setTanggal(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080] outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pencarian Siswa</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama atau kelas..."
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
                        <Users className="text-[#000080]" size={20} />
                        Daftar Kehadiran Siswa
                    </h2>
                    <span className="text-xs font-bold bg-blue-50 text-[#000080] px-3 py-1.5 rounded-full border border-blue-100">
                        Total {filtered.length} Siswa
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm font-bold text-slate-500">Memuat data absensi...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-slate-600">Tidak ada data absensi</p>
                        <p className="text-xs text-slate-400 mt-1">Belum ada data absensi untuk ekstrakurikuler dan tanggal ini.</p>
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
                                    <th className="px-6 py-4">Status Absensi</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {filtered.map((s, idx) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{s.no_induk || '-'}</td>
                                        <td className="px-6 py-4 font-black text-slate-800">{s.nama_siswa}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                                                {s.nama_kelas || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(s.status_absensi)}</td>
                                        <td className="px-6 py-4 text-slate-500 text-xs italic">{s.keterangan || '-'}</td>
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

export default AdminAbsensi;
