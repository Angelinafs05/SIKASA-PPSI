import React, { useState, useEffect } from 'react';
import { Trophy, Save, Search, Activity, Calendar, User, ClipboardEdit, CheckCircle, Calculator, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../api/api';

const GuruNilai = () => {
    // Mode: 'pertemuan' (Harian per tanggal & materi) vs 'rekap' (Rangkuman Akhir Semester + Bobot)
    const [mode, setMode] = useState('pertemuan');

    const [ekskuls, setEkskuls] = useState([]);
    const [selectedEkskul, setSelectedEkskul] = useState('');

    // Pertemuan State
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [materi, setMateri] = useState('');
    const [daftarPertemuan, setDaftarPertemuan] = useState([]);
    const [pertemuanStudents, setPertemuanStudents] = useState([]);
    const [isPertemuanSaved, setIsPertemuanSaved] = useState(false);
    const [isEditingPertemuan, setIsEditingPertemuan] = useState(false);
    const [loadingPertemuan, setLoadingPertemuan] = useState(true);
    const [savingPertemuan, setSavingPertemuan] = useState(false);

    // Rekap Semester State
    const [semesterStudents, setSemesterStudents] = useState([]);
    const [period, setPeriod] = useState({ semester: 'Ganjil', tahun: '' });
    const [loadingSemester, setLoadingSemester] = useState(false);

    // Shared State
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedEkskul) {
            if (mode === 'pertemuan') {
                fetchPertemuanData(selectedEkskul, tanggal);
            } else {
                fetchSemesterData(selectedEkskul);
            }
        }
    }, [selectedEkskul, mode, tanggal]);

    const fetchInitialData = async () => {
        try {
            const response = await api.get('/api/pendamping/dashboard');
            if (response.data.success) {
                const ekskulList = response.data.data.ekskuls || [];
                setEkskuls(ekskulList);
                setPeriod({
                    semester: response.data.data.periode?.semester || 'Ganjil',
                    tahun: response.data.data.periode?.tahun_ajaran || ''
                });
                if (ekskulList.length > 0) {
                    setSelectedEkskul(ekskulList[0].id.toString());
                }
            }
        } catch (err) {
            setError('Gagal mengambil data ekskul');
        }
    };

    // Fetch Penilaian Per Pertemuan
    const fetchPertemuanData = async (ekskulId, selectedDate) => {
        try {
            setLoadingPertemuan(true);
            setError('');
            const response = await api.get(`/api/pendamping/nilai/pertemuan?ekskul_id=${ekskulId}&tanggal=${selectedDate}`);
            if (response.data.success) {
                const { materi, daftar_pertemuan, siswa, sudah_tersimpan } = response.data.data;
                setMateri(materi || '');
                setDaftarPertemuan(daftar_pertemuan || []);
                setIsPertemuanSaved(!!sudah_tersimpan);
                setIsEditingPertemuan(!sudah_tersimpan); // Jika belum tersimpan, form aktif
                setPertemuanStudents(siswa.map(s => ({
                    ...s,
                    nilai_pertemuan: s.nilai_pertemuan !== null && s.nilai_pertemuan !== undefined ? s.nilai_pertemuan : (s.status_absensi === 'Hadir' ? 80 : 0),
                    catatan_nilai: s.catatan_nilai || ''
                })));
            } else {
                setError(response.data.message || 'Gagal memuat data nilai pertemuan');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi saat memuat nilai pertemuan');
        } finally {
            setLoadingPertemuan(false);
        }
    };

    // Fetch Rekap Nilai Akhir Semester
    const fetchSemesterData = async (ekskulId) => {
        try {
            setLoadingSemester(true);
            setError('');
            const query = `ekskul_id=${ekskulId}&semester=${period.semester}&tahun=${period.tahun}`;
            const response = await api.get(`/api/pendamping/nilai?${query}`);
            if (response.data.success) {
                const { siswa } = response.data.data;
                setSemesterStudents(siswa.map(s => ({
                    ...s,
                    nilai: parseInt(s.nilai) || 0,
                    keterangan: s.keterangan || ''
                })));
            } else {
                setError(response.data.message || 'Gagal memuat data rekap semester');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi ke server');
        } finally {
            setLoadingSemester(false);
        }
    };

    // Change nilai pertemuan
    const handlePertemuanNilaiChange = (siswaId, val) => {
        let num = parseInt(val) || 0;
        if (num > 100) num = 100;
        if (num < 0) num = 0;
        setPertemuanStudents(prev => prev.map(s => s.id === siswaId ? { ...s, nilai_pertemuan: num } : s));
    };

    const handlePertemuanCatatanChange = (siswaId, val) => {
        setPertemuanStudents(prev => prev.map(s => s.id === siswaId ? { ...s, catatan_nilai: val } : s));
    };

    // Simpan Nilai Pertemuan
    const handleSavePertemuan = async () => {
        try {
            setSavingPertemuan(true);
            setError('');
            setSuccess('');

            const payload = {
                ekskul_id: selectedEkskul,
                tanggal: tanggal,
                materi: materi,
                nilai: pertemuanStudents.map(s => ({
                    siswa_id: s.id,
                    nilai: s.nilai_pertemuan,
                    catatan: s.catatan_nilai
                }))
            };

            const response = await api.post('/api/pendamping/nilai/pertemuan', payload);
            if (response.data.success) {
                setIsPertemuanSaved(true);
                setIsEditingPertemuan(false);
                setSuccess('Nilai pertemuan dan materi berhasil diperbarui! Nilai rapor otomatis disinkronkan.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSuccess(''), 5000);
            } else {
                setError(response.data.message || 'Gagal menyimpan nilai pertemuan');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan nilai');
        } finally {
            setSavingPertemuan(false);
        }
    };

    const getPredicate = (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num === 0) return '-';
        if (num >= 85) return 'A';
        if (num >= 75) return 'B';
        if (num >= 60) return 'C';
        return 'D';
    };

    const filteredPertemuan = pertemuanStudents.filter(s =>
        s.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSemester = semesterStudents.filter(s =>
        s.nama_siswa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nama_kelas?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 font-sans pb-16">
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="px-3 py-1 bg-blue-50 text-[#000080] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 flex items-center gap-1.5">
                            <Trophy size={12} /> Guru Pendamping &bull; Penilaian
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight flex items-center gap-3">
                        Monitoring & Input Nilai Siswa
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Catat nilai setiap pertemuan ekskul dan pantau hasil akhir rapor siswa yang didampingi.
                    </p>
                </div>

                {/* TAB SWITCHER */}
                <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start lg:self-auto">
                    <button
                        onClick={() => setMode('pertemuan')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                            mode === 'pertemuan'
                                ? 'bg-[#000080] text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Calendar size={15} />
                        Nilai Per Pertemuan
                    </button>
                    <button
                        onClick={() => setMode('rekap')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                            mode === 'rekap'
                                ? 'bg-[#000080] text-white shadow-md'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Calculator size={15} />
                        Hasil Rapor Akhir
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-200 font-bold shadow-sm">
                    <Activity size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-emerald-200 font-bold shadow-sm">
                    <CheckCircle size={18} />
                    {success}
                </div>
            )}

            {/* BAR FILTER EKSKUL, TANGGAL & MATERI */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ekskul Didampingi</label>
                    <div className="w-full bg-blue-50 border border-blue-200 text-[#000080] font-bold rounded-xl px-4 py-3 flex items-center gap-2">
                        <Trophy size={16} className="text-[#000080]" />
                        <span>{ekskuls.find(e => String(e.id) === String(selectedEkskul))?.nama_ekskul || (ekskuls.length > 0 ? ekskuls[0].nama_ekskul : '-')}</span>
                    </div>
                </div>

                {mode === 'pertemuan' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={14} className="text-[#000080]" /> Tanggal Pertemuan
                            </label>
                            <input
                                type="date"
                                value={tanggal}
                                onChange={(e) => setTanggal(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080]"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <BookOpen size={14} className="text-[#000080]" /> Materi Pertemuan
                            </label>
                            <input
                                type="text"
                                value={materi}
                                onChange={(e) => setMateri(e.target.value)}
                                disabled={isPertemuanSaved && !isEditingPertemuan}
                                placeholder="Materi yang diajarkan hari ini..."
                                className={`w-full px-4 py-3 rounded-xl font-bold transition-all ${
                                    isPertemuanSaved && !isEditingPertemuan
                                        ? 'bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed'
                                        : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080]'
                                }`}
                            />
                        </div>
                    </>
                )}

                {mode === 'rekap' && (
                    <div className="md:col-span-3 flex items-center gap-2 pt-6 text-xs text-slate-500 font-medium">
                        <AlertCircle size={16} className="text-[#000080]" />
                        <span>Nilai akhir rapor otomatis terakumulasi dari seluruh pertemuan dan bobot semester aktif ({period.semester} - {period.tahun}).</span>
                    </div>
                )}
            </div>

            {/* SEARCH SISWA */}
            <div className="relative group max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#000080] transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Cari siswa atau kelas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all font-medium text-slate-700 shadow-sm"
                />
            </div>

            {/* TABEL VIEW PERTEMUAN */}
            {mode === 'pertemuan' && (
                <div>
                    {loadingPertemuan ? (
                        <div className="p-16 text-center">
                            <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="font-bold text-slate-500">Memuat data pertemuan...</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">No</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kehadiran Hari Ini</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-36">Nilai Materi (0-100)</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Rata-rata Pertemuan</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan / Evaluasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPertemuan.length > 0 ? (
                                        filteredPertemuan.map((siswa, idx) => (
                                            <tr key={siswa.id} className="hover:bg-blue-50/20 transition-colors">
                                                <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800">{siswa.nama_siswa}</p>
                                                    <p className="text-xs text-slate-400 font-medium">Kelas {siswa.nama_kelas || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                        siswa.status_absensi === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        siswa.status_absensi === 'Izin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        siswa.status_absensi === 'Sakit' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        siswa.status_absensi === 'Alfa' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                        'bg-slate-50 text-slate-500 border-slate-200'
                                                    }`}>
                                                        {siswa.status_absensi || 'Belum Absen'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={siswa.nilai_pertemuan}
                                                        onChange={(e) => handlePertemuanNilaiChange(siswa.id, e.target.value)}
                                                        disabled={isPertemuanSaved && !isEditingPertemuan}
                                                        className={`w-24 px-3 py-2 text-center font-black text-lg rounded-xl transition-all ${
                                                            isPertemuanSaved && !isEditingPertemuan
                                                                ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                                                                : 'bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080]'
                                                        }`}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-600">
                                                    {siswa.rata_rata_pertemuan ? Math.round(siswa.rata_rata_pertemuan) : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        value={siswa.catatan_nilai}
                                                        onChange={(e) => handlePertemuanCatatanChange(siswa.id, e.target.value)}
                                                        disabled={isPertemuanSaved && !isEditingPertemuan}
                                                        placeholder="Catatan keaktifan..."
                                                        className={`w-full px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                                                            isPertemuanSaved && !isEditingPertemuan
                                                                ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                                                                : 'bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000080]/20 focus:border-[#000080]'
                                                        }`}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-16 text-center text-slate-400">
                                                <Trophy size={40} className="mx-auto mb-2 opacity-30" />
                                                <p className="font-bold">Tidak ada data siswa</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* SAVE / EDIT BUTTON PERTEMUAN */}
                    {filteredPertemuan.length > 0 && (
                        <div className="flex justify-end pt-4">
                            {isPertemuanSaved && !isEditingPertemuan ? (
                                <button
                                    onClick={() => setIsEditingPertemuan(true)}
                                    className="flex items-center gap-3 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-[2rem] font-black text-sm shadow-xl shadow-amber-900/30 hover:-translate-y-1 active:scale-95 transition-all"
                                >
                                    <ClipboardEdit size={18} />
                                    Edit Nilai & Materi Pertemuan Ini
                                </button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    {isPertemuanSaved && isEditingPertemuan && (
                                        <button
                                            onClick={() => {
                                                setIsEditingPertemuan(false);
                                                fetchPertemuanData(tanggal);
                                            }}
                                            className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[2rem] font-bold text-sm transition-all"
                                        >
                                            Batal
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSavePertemuan}
                                        disabled={savingPertemuan || loadingPertemuan}
                                        className="flex items-center gap-3 px-8 py-4 bg-[#000080] hover:bg-blue-900 text-white rounded-[2rem] font-black text-sm shadow-xl shadow-blue-900/30 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {savingPertemuan ? 'Memperbarui...' : (
                                            <>
                                                <Save size={18} />
                                                {isPertemuanSaved ? 'Update Nilai Pertemuan Ini' : 'Simpan Nilai Pertemuan Ini'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TABEL VIEW REKAP RAPOR */}
            {mode === 'rekap' && (
                <div>
                    {loadingSemester ? (
                        <div className="p-16 text-center">
                            <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="font-bold text-slate-500">Memuat hasil nilai rapor...</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">No</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Siswa</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kelas</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Nilai Akhir Rapor</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Predikat</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSemester.length > 0 ? (
                                        filteredSemester.map((siswa, idx) => (
                                            <tr key={siswa.id} className="hover:bg-blue-50/20 transition-colors">
                                                <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800">{siswa.nama_siswa}</p>
                                                    <p className="text-xs text-slate-400">NIS: {siswa.no_induk || '-'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-600">{siswa.nama_kelas || '-'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xl font-black text-[#000080]">{siswa.nilai || 0}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs border ${
                                                        getPredicate(siswa.nilai) === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        getPredicate(siswa.nilai) === 'B' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        getPredicate(siswa.nilai) === 'C' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {getPredicate(siswa.nilai)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-600">{siswa.keterangan || '-'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-16 text-center text-slate-400">
                                                <Trophy size={40} className="mx-auto mb-2 opacity-30" />
                                                <p className="font-bold">Belum ada data nilai</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GuruNilai;
