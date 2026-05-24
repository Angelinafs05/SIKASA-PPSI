import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Plus, ArrowLeft, User, Phone, MapPin, Eye, Edit2, Trash2, Users } from 'lucide-react';
import api from '../../api/api';

const KelasList = () => {
    const [kelas, setKelas] = useState([]);
    const [selectedKelas, setSelectedKelas] = useState(null);
    const [siswaList, setSiswaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSiswa, setLoadingSiswa] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchKelas();
    }, []);

    const fetchKelas = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/kelas');
            if (response.data.success) {
                setKelas(response.data.data);
            }
        } catch (err) {
            console.error("Gagal mengambil data kelas", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectKelas = async (item) => {
        try {
            setLoadingSiswa(true);
            setSelectedKelas(item);
            const response = await api.get(`/api/admin/siswa?kelas_id=${item.id}`);
            if (response.data.success) {
                setSiswaList(response.data.data);
            }
        } catch (err) {
            console.error("Gagal mengambil data siswa", err);
        } finally {
            setLoadingSiswa(false);
        }
    };

    const handleBack = () => {
        setSelectedKelas(null);
        setSiswaList([]);
        setSearchTerm('');
    };

    const filteredKelas = kelas.filter(k => 
        k.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSiswa = siswaList.filter(s =>
        s.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.no_induk?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="font-bold text-slate-500">Memuat data kelas...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-[#000080] tracking-tight">
                        {selectedKelas ? `Daftar Siswa : ${selectedKelas.nama_kelas}` : 'Data Kelas'}
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.3em] opacity-60">
                        {selectedKelas ? 'Kelola anggota kelas terpilih' : 'Pilih kelas untuk melihat data siswa'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {selectedKelas && (
                        <button 
                            onClick={handleBack}
                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-sm"
                        >
                            <ArrowLeft size={18} /> Kembali
                        </button>
                    )}
                    <button className="flex items-center gap-3 bg-[#000080] hover:bg-blue-900 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 transition-all">
                        <Plus size={20} /> {selectedKelas ? 'Tambah Siswa' : 'Tambah Kelas'}
                    </button>
                </div>
            </div>

            {/* SELECTION VIEW vs DETAIL VIEW */}
            {!selectedKelas ? (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Search bar for classes */}
                    <div className="relative group max-w-md mx-auto md:mx-0">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#000080] transition-colors" size={22} />
                        <input
                            type="text"
                            placeholder="Cari nama kelas..."
                            className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-100 focus:border-[#000080] transition-all shadow-xl shadow-slate-100/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Class Cards Grid */}
                    {filteredKelas.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredKelas.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => handleSelectKelas(item)}
                                    className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative cursor-pointer overflow-hidden border-b-4 border-b-transparent hover:border-b-[#000080]"
                                >
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                                        <GraduationCap size={150} />
                                    </div>
                                    
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className="p-5 bg-blue-50 text-[#000080] rounded-[1.8rem] group-hover:bg-[#000080] group-hover:text-white transition-all duration-500 shadow-sm border border-blue-100 group-hover:border-transparent">
                                            <GraduationCap size={28} />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                            Aktif
                                        </div>
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter group-hover:text-[#000080] transition-colors uppercase leading-none">{item.nama_kelas}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic group-hover:text-slate-500 transition-colors">Lihat Daftar Siswa <ArrowLeft size={10} className="inline rotate-180 ml-1" /></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100">
                            <GraduationCap size={64} className="text-slate-100 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight">Tidak ada kelas ditemukan</h3>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in slide-in-from-bottom-8 duration-500 space-y-6">
                    {/* Search bar for students in selected class */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="relative group w-full md:w-96">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#000080]" size={20} />
                            <input
                                type="text"
                                placeholder={`Cari siswa di kelas ${selectedKelas.nama_kelas}...`}
                                className="w-full bg-white border border-slate-200 rounded-[1.8rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-100 focus:border-[#000080] transition-all shadow-xl shadow-slate-100/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-4 py-2 rounded-xl bg-slate-50">
                            Total: {filteredSiswa.length} Siswa Terdaftar
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden relative">
                        {loadingSiswa ? (
                            <div className="py-20 text-center">
                                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="font-bold text-slate-400">Mengambil data anggota...</p>
                            </div>
                        ) : filteredSiswa.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#000080]/5 text-[#000080] font-black border-b border-slate-100 uppercase tracking-widest text-[10px]">
                                        <tr>
                                            <th className="py-6 px-8">No Induk</th>
                                            <th className="py-6 px-8">Nama Lengkap Siswa</th>
                                            <th className="py-6 px-8">No. HP</th>
                                            <th className="py-6 px-8">Kota</th>
                                            <th className="py-6 px-8 text-center" width="150">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredSiswa.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                                                <td className="py-5 px-8 font-extrabold text-slate-400 text-xs tracking-wider">{item.no_induk || '-'}</td>
                                                <td className="py-5 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#000080] flex items-center justify-center font-black text-xs border border-blue-100 shadow-sm transition-transform group-hover:scale-110">
                                                            {item.nama_siswa.charAt(0)}
                                                        </div>
                                                        <span className="font-black text-slate-800 text-base uppercase tracking-tight group-hover:text-[#000080] transition-colors">{item.nama_siswa}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-8">
                                                    <div className="flex items-center gap-2 font-bold text-slate-600">
                                                        <Phone size={14} className="opacity-40" /> {item.no_hp || '-'}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-8">
                                                    <div className="flex items-center gap-2 font-bold text-slate-600">
                                                        <MapPin size={14} className="opacity-40" /> {item.kota || '-'}
                                                    </div>
                                                </td>
                                                <td className="py-5 px-8">
                                                    <div className="flex justify-center gap-2">
                                                        <button className="p-3 bg-blue-50 text-[#000080] hover:bg-[#000080] hover:text-white rounded-xl transition-all shadow-sm active:scale-90" title="Detail">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-[#000080] hover:border-[#000080] rounded-xl transition-all shadow-sm active:scale-90" title="Edit">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90" title="Hapus">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-32 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
                                    <Users size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight">Belum Ada Siswa</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Kelas {selectedKelas.nama_kelas} masih kosong.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default KelasList;
