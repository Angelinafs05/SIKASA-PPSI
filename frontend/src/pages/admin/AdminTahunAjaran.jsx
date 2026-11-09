import React, { useState, useEffect } from 'react';
import {
    CalendarDays, Plus, CheckCircle2, AlertTriangle, Trash2, ArrowRight,
    Users, GraduationCap, RefreshCw, Check, Sparkles, BookOpen
} from 'lucide-react';
import api from '../../api/api';

const AdminTahunAjaran = () => {
    const [periods, setPeriods] = useState([]);
    const [activePeriod, setActivePeriod] = useState({ tahun_ajaran: '', semester: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal/Form State
    const [showModal, setShowModal] = useState(false);
    const [yearStart, setYearStart] = useState(new Date().getFullYear());
    const [semester, setSemester] = useState('Ganjil');

    const nextAcademicYear = `${yearStart}/${Number(yearStart) + 1}`;
    const targetPeriodName = `${nextAcademicYear} ${semester}`;

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/tahun-ajaran');
            if (response.data.success) {
                setPeriods(response.data.data.periods || []);
                setActivePeriod(response.data.data.active_period || { tahun_ajaran: '', semester: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat daftar tahun ajaran');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePeriod = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.post('/api/admin/tahun-ajaran', {
                tahun: nextAcademicYear,
                semester: semester
            });

            if (response.data.success) {
                const resData = response.data.data;
                let msg = response.data.message || 'Tahun ajaran berhasil dibuat!';
                if (resData.mode === 'new_year') {
                    msg += ` (Otomatis: ${resData.graduated} siswa Kelas 9 diluluskan, ${resData.promoted} siswa Kelas 7 & 8 naik tingkat)`;
                }
                setSuccess(msg);
                setShowModal(false);
                fetchPeriods();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal membuat tahun ajaran');
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivatePeriod = async (item) => {
        if (!window.confirm(`Aktifkan periode "${item.nama}" sebagai tahun ajaran aktif sistem sekarang?`)) {
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.put('/api/admin/tahun-ajaran/activate', { id: item.id });
            if (response.data.success) {
                setSuccess(`Periode ${item.nama} telah aktif!`);
                // Update local storage admin view period agar sinkron
                localStorage.setItem('adminViewYear', item.tahun);
                localStorage.setItem('adminViewSemester', item.semester);
                fetchPeriods();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengaktifkan tahun ajaran');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePeriod = async (item) => {
        if (item.status === 'aktif') {
            alert('Tidak dapat menghapus tahun ajaran yang sedang aktif!');
            return;
        }

        if (!window.confirm(`Yakin ingin menghapus periode "${item.nama}"?`)) {
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.delete(`/api/admin/tahun-ajaran/${item.id}`);
            if (response.data.success) {
                setSuccess(response.data.message || 'Tahun ajaran berhasil dihapus');
                fetchPeriods();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menghapus tahun ajaran');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight mb-1 flex items-center gap-3">
                        <CalendarDays className="text-[#000080]" size={32} /> Manajemen Tahun Ajaran
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Kelola periode akademik, kenaikan kelas otomatis, dan kelulusan siswa.
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#000080] hover:bg-[#000066] text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
                    >
                        <Plus size={18} /> Buat Periode Baru
                    </button>
                </div>
            </div>

            {/* ALERTS */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold text-sm flex items-center gap-2">
                    <AlertTriangle size={18} /> {error}
                </div>
            )}
            {success && (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 font-bold text-sm flex items-center gap-2">
                    <CheckCircle2 size={18} /> {success}
                </div>
            )}

            {/* ACTIVE PERIOD HIGHLIGHT CARD */}
            <div className="bg-gradient-to-r from-blue-900 to-[#000080] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                        <CalendarDays size={36} className="text-amber-400" />
                    </div>
                    <div>
                        <span className="bg-amber-400 text-blue-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Periode Aktif Sistem
                        </span>
                        <h2 className="text-2xl font-black mt-1">
                            {activePeriod.tahun_ajaran} — Semester {activePeriod.semester}
                        </h2>
                        <p className="text-xs text-blue-200 mt-0.5">
                            Semua pencatatan absensi, ekskul, dan penempatan kelas saat ini merujuk ke periode ini.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-xl">
                        <Check size={14} /> Beroperasi Normal
                    </span>
                </div>
            </div>

            {/* LIST TAHUN AJARAN */}
            <div className="bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-[#000080]" /> Riwayat & Daftar Periode Akademik
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <RefreshCw className="animate-spin text-[#000080]" size={32} />
                    </div>
                ) : periods.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">Belum ada data tahun ajaran.</div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#000080]/5 text-[#000080] font-bold border-b border-slate-100 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="py-4 px-4">Nama Periode</th>
                                    <th className="py-4 px-4">Tahun</th>
                                    <th className="py-4 px-4">Semester</th>
                                    <th className="py-4 px-4 text-center">Siswa Aktif</th>
                                    <th className="py-4 px-4 text-center">Status</th>
                                    <th className="py-4 px-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {periods.map((item) => {
                                    const isCurrentActive = item.status === 'aktif';
                                    return (
                                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isCurrentActive ? 'bg-blue-50/40' : ''}`}>
                                            <td className="py-4 px-4 font-bold text-slate-800">
                                                {item.nama}
                                            </td>
                                            <td className="py-4 px-4 text-slate-600 font-medium">
                                                {item.tahun}
                                            </td>
                                            <td className="py-4 px-4 text-slate-600 font-semibold">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${item.semester === 'Ganjil' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}`}>
                                                    {item.semester}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center font-bold text-slate-700">
                                                {item.total_siswa_aktif} Siswa
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                {isCurrentActive ? (
                                                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1">
                                                        <CheckCircle2 size={13} /> AKTIF
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-semibold">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {!isCurrentActive ? (
                                                        <button
                                                            onClick={() => handleActivatePeriod(item)}
                                                            disabled={submitting}
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-[#000080] text-[#000080] hover:text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                                                            title="Jadikan periode aktif sistem"
                                                        >
                                                            Aktifkan
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-bold text-emerald-600 italic">Sedang Berjalan</span>
                                                    )}

                                                    {!isCurrentActive && (
                                                        <button
                                                            onClick={() => handleDeletePeriod(item)}
                                                            disabled={submitting}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus periode ini"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL CREATE PERIOD */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="text-xl font-bold text-[#000080] flex items-center gap-2">
                                <Sparkles size={20} className="text-amber-500" /> Buat Tahun Ajaran Baru
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
                        </div>

                        <form onSubmit={handleCreatePeriod} className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <Sparkles size={14} /> Aturan Logika Kenaikan & Kelulusan (ame-me/sistem_presensi):
                                </p>
                                <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-90">
                                    <li><strong>Tahun Ajaran Baru (misal 2026/2027)</strong>: Otomatis meluluskan siswa <strong>Kelas IX / 9</strong> (status: Alumni), dan menaikkan siswa <strong>Kelas VII &rarr; VIII</strong> serta <strong>Kelas VIII &rarr; IX</strong>.</li>
                                    <li><strong>Pergantian Semester</strong>: Jika hanya semester (Ganjil &rarr; Genap) dalam tahun yang sama, siswa tetap di kelasnya masing-masing.</li>
                                </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Tahun Mulai</label>
                                    <input
                                        type="number"
                                        value={yearStart}
                                        onChange={(e) => setYearStart(e.target.value)}
                                        min="2020"
                                        max="2040"
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 font-bold outline-none focus:border-[#000080]"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700">Semester</label>
                                    <select
                                        value={semester}
                                        onChange={(e) => setSemester(e.target.value)}
                                        className="w-full border border-slate-300 rounded-xl px-4 py-2.5 font-bold outline-none focus:border-[#000080] bg-white"
                                    >
                                        <option value="Ganjil">Ganjil</option>
                                        <option value="Genap">Genap</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <p className="text-xs text-slate-500 font-medium">Periode yang akan dibuat:</p>
                                <p className="text-base font-extrabold text-[#000080] mt-0.5">{targetPeriodName}</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-[#000080] hover:bg-[#000066] text-white font-bold rounded-xl shadow-md text-sm disabled:bg-slate-300"
                                >
                                    {submitting ? 'Memproses...' : 'Buat Periode'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTahunAjaran;

