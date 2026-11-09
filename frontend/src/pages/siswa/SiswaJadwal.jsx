import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, Activity, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../api/api';

const SiswaJadwal = () => {
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDay, setFilterDay] = useState('');
    const [error, setError] = useState('');
    const [periode, setPeriode] = useState({ tahun_ajaran: '', semester: '' });

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/siswa/dashboard');
            if (res.data.success) {
                // my_ekskuls di dashboard hanya berisi ekskul yang disetujui (approved) milik siswa tersebut
                const approvedEkskuls = res.data.data.my_ekskuls || [];
                setSchedule(approvedEkskuls);
                if (res.data.data.periode) {
                    setPeriode(res.data.data.periode);
                }
            } else {
                setError('Gagal memuat jadwal kegiatan');
            }
        } catch (err) {
            setError('Gagal memuat jadwal kegiatan. Pastikan koneksi server aktif.');
        } finally {
            setLoading(false);
        }
    };

    const days = ['Semua Hari', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const filtered = schedule.filter(item => {
        if (!filterDay || filterDay === 'Semua Hari') return true;
        return item.hari?.toLowerCase().includes(filterDay.toLowerCase());
    });

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#000080]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-blue-50 text-[#000080] rounded-2xl">
                                <Calendar size={26} />
                            </div>
                            <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">Jadwal Ekskul Saya</h1>
                        </div>
                        <p className="text-slate-500 font-medium max-w-2xl">
                            Daftar jadwal kegiatan ekstrakurikuler yang kamu ikuti secara aktif pada periode ini.
                        </p>
                    </div>

                    {periode.tahun_ajaran && (
                        <div className="px-4 py-2 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs font-black text-[#000080] uppercase tracking-wider self-start md:self-auto">
                            Tahun: {periode.tahun_ajaran} • Sem: {periode.semester}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 text-rose-600 p-5 rounded-2xl flex items-center gap-3 border border-rose-100 font-bold text-sm">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* DAY FILTER */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {days.map((d) => (
                    <button
                        key={d}
                        onClick={() => setFilterDay(d === 'Semua Hari' ? '' : d)}
                        className={`px-5 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all ${
                            (filterDay === d || (!filterDay && d === 'Semua Hari'))
                                ? 'bg-[#000080] text-white shadow-md shadow-blue-900/10'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {d}
                    </button>
                ))}
            </div>

            {/* SCHEDULE CARDS */}
            {loading ? (
                <div className="p-16 text-center">
                    <div className="w-10 h-10 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm font-bold text-slate-500">Memuat jadwal kegiatan ekskul...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200">
                    <Calendar size={56} className="mx-auto mb-3 text-slate-300" />
                    <h3 className="text-xl font-black text-slate-700 mb-2">
                        {filterDay ? `Tidak Ada Jadwal di Hari ${filterDay}` : 'Belum Ada Jadwal Ekskul'}
                    </h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto font-medium">
                        {filterDay
                            ? `Ekskul yang kamu ikuti tidak memiliki jadwal latihan pada hari ${filterDay}.`
                            : 'Kamu belum terdaftar aktif pada ekstrakurikuler manapun di periode ini.'}
                    </p>
                    {!filterDay && (
                        <button
                            onClick={() => navigate('/siswa/ekskul')}
                            className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 bg-[#000080] text-white rounded-2xl font-bold text-sm hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                        >
                            <span>Daftar Ekstrakurikuler</span>
                            <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((item, idx) => (
                        <div
                            key={item.reg_id || item.ekskul_id || idx}
                            className="bg-white rounded-[2rem] border border-slate-200/90 shadow-sm p-7 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all flex flex-col justify-between group"
                        >
                            <div className="space-y-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="w-12 h-12 bg-blue-50 text-[#000080] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Activity size={24} />
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider rounded-full">
                                        Anggota Aktif
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-[#000080] transition-colors">
                                        {item.nama_ekskul}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1.5">
                                        <User size={13} /> Pembina: {item.nama_pelatih || item.pelatih || '-'}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#000080] flex items-center justify-center shrink-0">
                                            <Calendar size={15} />
                                        </div>
                                        <span>Hari Latihan: <strong className="text-slate-800 font-black">{item.hari}</strong></span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            <Clock size={15} />
                                        </div>
                                        <span>Waktu: <strong className="text-slate-800 font-black">{item.jam || '-'}</strong></span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <MapPin size={15} />
                                        </div>
                                        <span>Tempat: <strong className="text-slate-800 font-black">{item.tempat ? `R. ${item.tempat}` : 'Area Sekolah'}</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SiswaJadwal;
