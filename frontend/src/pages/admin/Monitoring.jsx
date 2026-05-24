import React, { useState, useEffect } from 'react';
import { Monitor, Users, User, ClipboardList, BarChart3, Search, Activity, Trophy, CheckCircle, X, Calendar, Download, GraduationCap, ClipboardCheck, MapPin } from 'lucide-react';
import api from '../../api/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Monitoring = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'nilai' or 'absensi'
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalData, setModalData] = useState([]);
    const [modalMeta, setModalMeta] = useState({});
    const [modalLoading, setModalLoading] = useState(false);
    const [modalTanggal, setModalTanggal] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchMonitoringData();
    }, []);

    const fetchMonitoringData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/monitoring');
            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError(response.data.message || 'Gagal mengambil data monitoring');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi ke server');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReportData = async (type, item, date = null) => {
        setModalLoading(true);
        try {
            const endpoint = type === 'nilai'
                ? `/api/admin/monitoring/nilai?ekskul_id=${item.id}`
                : `/api/admin/monitoring/absensi?ekskul_id=${item.id}&tanggal=${date || modalTanggal}`;

            const response = await api.get(endpoint);
            if (response.data.success) {
                setModalData(response.data.data.siswa || []);
                setModalMeta(response.data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil detail laporan', err);
        } finally {
            setModalLoading(false);
        }
    };

    const handleOpenModal = (type, item) => {
        setModalType(type);
        setSelectedItem(item);
        setShowModal(true);
        setModalData([]);
        fetchReportData(type, item);
    };

    const generatePDF = () => {
        if (!selectedItem || modalData.length === 0) return;

        try {
            const doc = new jsPDF();
            const isNilai = modalType === 'nilai';
            const title = isNilai ? 'LAPORAN NILAI EKSTRAKURIKULER' : 'REKAP ABSENSI EKSTRAKURIKULER';

            doc.setFontSize(18);
            doc.setTextColor(0, 0, 128);
            doc.text('SIKASA - SMPK SANTA MARIA 2', 105, 20, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(60, 60, 60);
            doc.text(title, 105, 30, { align: 'center' });

            doc.setDrawColor(200, 200, 200);
            doc.line(20, 35, 190, 35);

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Nama Ekskul:', 20, 45);
            doc.text('Pembina:', 20, 50);
            if (!isNilai) doc.text('Tanggal:', 20, 55);

            doc.setFont(undefined, 'normal');
            doc.text(selectedItem.nama_ekskul, 50, 45);
            doc.text(selectedItem.nama_pelatih || '-', 50, 50);
            if (!isNilai) doc.text(modalTanggal, 50, 55);

            const tableColumn = isNilai
                ? ['No', 'Nama Siswa', 'Kelas', 'Nilai', 'Keterangan']
                : ['No', 'Nama Siswa', 'Kelas', 'Status Kehadiran'];

            const tableRows = modalData.map((s, index) => [
                index + 1,
                s.nama_siswa,
                s.nama_kelas || '-',
                isNilai ? s.nilai || 0 : s.status_absensi || 'Alpa',
                isNilai ? s.keterangan || '-' : undefined
            ].filter(v => v !== undefined));

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: isNilai ? 60 : 65,
                theme: 'grid',
                headStyles: { fillColor: [0, 0, 128], textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 },
            });

            const finalY = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(10);
            doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 20, finalY);
            doc.text('Tanda Tangan Pembina,', 150, finalY);
            doc.text('___________________', 150, finalY + 25);
            doc.text(selectedItem.nama_pelatih || '-', 150, finalY + 30);

            const filename = `${title.replace(/ /g, '_')}_${selectedItem.nama_ekskul.replace(/ /g, '_')}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Gagal membuat PDF.');
        }
    };

    const generateIndividualPDF = (student) => {
        if (!selectedItem || !student) return;

        try {
            const doc = new jsPDF();
            const title = 'LAPORAN NILAI EKSTRAKURIKULER';

            // Header Setup
            doc.setFontSize(18);
            doc.setTextColor(0, 0, 128); // #000080
            doc.text('SIKASA - SMPK SANTA MARIA 2', 105, 20, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(60, 60, 60);
            doc.text(title, 105, 30, { align: 'center' });

            // Horizontal Line
            doc.setDrawColor(0, 0, 128);
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);

            // Student Info Section
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('INFORMASI SISWA', 20, 45);
            doc.setDrawColor(200, 200, 200);
            doc.line(20, 47, 80, 47);

            doc.text('Nama:', 20, 55);
            doc.text('NIS:', 20, 60);
            doc.text('Kelas:', 20, 65);

            doc.setFont(undefined, 'normal');
            doc.text(student.nama_siswa, 50, 55);
            doc.text(student.no_induk || '-', 50, 60);
            doc.text(student.nama_kelas || '-', 50, 65);

            // Ekskul Info Section
            doc.setFont(undefined, 'bold');
            doc.text('INFORMASI KEGIATAN', 110, 45);
            doc.line(110, 47, 170, 47);

            doc.text('Ekstrakurikuler:', 110, 55);
            doc.text('Tahun Ajaran:', 110, 60);
            doc.text('Semester:', 110, 65);

            doc.setFont(undefined, 'normal');
            doc.text(selectedItem.nama_ekskul, 145, 55);
            doc.text(modalMeta.tahun || '-', 145, 60);
            doc.text(modalMeta.semester || '-', 145, 65);

            // Grade Section Box
            doc.setDrawColor(0, 0, 128);
            doc.setFillColor(245, 247, 255);
            doc.roundedRect(20, 75, 170, 40, 3, 3, 'FD');

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('HASIL PENILAIAN', 105, 85, { align: 'center' });

            doc.setFontSize(24);
            doc.setTextColor(0, 0, 128);
            doc.text(student.nilai ? student.nilai.toString() : '0', 105, 100, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const score = parseInt(student.nilai) || 0;
            const grade = score >= 85 ? 'Sangat Baik (A)' :
                          score >= 75 ? 'Baik (B)' :
                          score >= 60 ? 'Cukup (C)' : 'Kurang (D)';
            doc.text(`Predikat: ${grade}`, 105, 110, { align: 'center' });

            // Feedback Section
            doc.setTextColor(60, 60, 60);
            doc.setFont(undefined, 'bold');
            doc.text('CATATAN PEMBINA:', 20, 130);
            doc.setFont(undefined, 'normal');
            const splitCatatan = doc.splitTextToSize(student.keterangan || 'Tidak ada catatan.', 160);
            doc.text(splitCatatan, 20, 135);

            // Footer
            const finalY = 170;
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text(`Dokumen ini dihasilkan secara otomatis oleh SIKASA pada ${new Date().toLocaleString('id-ID')}`, 20, 270);
            
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.text('Kediri, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 140, finalY);
            doc.text('Tanda Tangan Pembina,', 140, finalY + 5);
            doc.text('___________________', 140, finalY + 30);
            doc.text(selectedItem.nama_pelatih || '-', 140, finalY + 35);

            // Save
            const filename = `Rapor_${student.nama_siswa.replace(/ /g, '_')}_${selectedItem.nama_ekskul.replace(/ /g, '_')}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error('Error generating individual PDF:', err);
            alert('Gagal membuat PDF.');
        }
    };

    const filteredData = data.filter(item =>
        item.nama_ekskul.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nama_pelatih && item.nama_pelatih.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500 animate-pulse">Memuat data monitoring...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">
                        Monitoring Ekstrakurikuler
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Pantau aktivitas, jumlah siswa, dan laporan setiap ekstrakurikuler
                    </p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#000080] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari ekskul atau pelatih..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl leading-5 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#000080] transition-all duration-200 font-medium text-slate-700 shadow-sm"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-200 font-bold shadow-sm animate-shake">
                    <Activity size={18} />
                    {error}
                </div>
            )}

            {/* MONITORING LIST */}
            {filteredData.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {filteredData.map((item) => (
                        <div key={item.id} className="relative overflow-hidden p-6 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col lg:flex-row items-center gap-6 group">
                            {/* DECORATIVE BACKGROUND ICONS */}
                            <div className="absolute bottom-[-10%] right-[15%] opacity-[0.03] text-[#000080] group-hover:-rotate-12 transition-transform duration-1000 select-none pointer-events-none">
                                <Activity size={180} />
                            </div>

                            {/* LEFT SECTION: Icon Circle */}
                            <div className="shrink-0 flex items-center justify-center">
                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-[#000050] to-[#000080] rounded-3xl flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                    <Monitor className="text-white relative z-10" size={32} />
                                </div>
                            </div>

                            {/* CENTER SECTION: Content Grid */}
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center gap-3">
                                    <h3 className="text-xl lg:text-2xl font-black text-[#000080] leading-tight tracking-tight uppercase">
                                        {item.nama_ekskul}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                                            <CheckCircle size={10} /> Aktif
                                        </span>
                                        <span className="px-3 py-1 bg-blue-50 text-[#000080] rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                            {item.total_siswa || 0} Siswa
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8 flex-1">
                                    {/* PEMBINA */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#000080] shrink-0 border border-blue-100 transition-colors group-hover:bg-[#000080] group-hover:text-white">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pembina</p>
                                            <p className="text-sm font-extrabold text-slate-800 leading-none truncate max-w-[120px]">{item.nama_pelatih || '-'}</p>
                                        </div>
                                    </div>

                                    {/* JADWAL */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100 transition-colors group-hover:bg-[#000080] group-hover:text-white">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Jadwal & Jam</p>
                                            <p className="text-xs font-extrabold text-slate-800 leading-none">{item.hari} • {item.jam}</p>
                                        </div>
                                    </div>

                                    {/* LOKASI */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 transition-colors group-hover:bg-[#000080] group-hover:text-white">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ruangan</p>
                                            <p className="text-sm font-extrabold text-slate-800 leading-none">R. {item.tempat || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center gap-4">
                                    <div className="p-1 px-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                                        <Users size={12} className="text-slate-400" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">
                                            Piket: <span className="text-slate-700">{item.pendamping || '-'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SECTION: Actions */}
                            <div className="flex flex-col sm:flex-row lg:flex-col justify-center gap-2 lg:pl-8 lg:border-l border-slate-100 shrink-0 w-full lg:w-auto h-full">
                                <button
                                    className="flex items-center justify-center gap-2 w-full lg:w-48 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:border-[#000080] hover:text-[#000080] transition-all group/btn shadow-sm active:scale-95"
                                    onClick={() => handleOpenModal('nilai', item)}
                                >
                                    <BarChart3 size={14} className="text-slate-400 group-hover/btn:text-[#000080]" />
                                    Laporan Nilai
                                </button>
                                <button
                                    className="flex items-center justify-center gap-2 w-full lg:w-48 px-6 py-3 bg-[#000080] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#000066] hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 shadow-lg shadow-blue-900/10"
                                    onClick={() => handleOpenModal('absensi', item)}
                                >
                                    <ClipboardList size={14} className="text-white/60" />
                                    Rekap Absensi
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                    <Monitor size={48} className="text-slate-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-slate-400 uppercase tracking-tight">Data Tidak Ditemukan</h3>
                </div>
            )}

            {/* MODAL SYSTEM */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-zoomIn">
                        {/* MODAL HEADER */}
                        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${modalType === 'nilai' ? 'bg-blue-100 text-[#000080]' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {modalType === 'nilai' ? <GraduationCap size={24} /> : <ClipboardCheck size={24} />}
                                </div>
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase">
                                        {modalType === 'nilai' ? 'Laporan Nilai' : 'Rekap Absensi'}
                                    </h2>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Trophy size={14} className="text-slate-300" /> {selectedItem?.nama_ekskul}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-100"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* MODAL FILTERS (Only for Absensi) */}
                        {modalType === 'absensi' && (
                            <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-slate-400" size={18} />
                                    <input
                                        type="date"
                                        value={modalTanggal}
                                        onChange={(e) => {
                                            setModalTanggal(e.target.value);
                                            fetchReportData('absensi', selectedItem, e.target.value);
                                        }}
                                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:border-[#000080] transition-all"
                                    />
                                </div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Total: <span className="text-[#000080]">{modalData.length} Siswa</span>
                                </div>
                            </div>
                        )}

                        {/* MODAL CONTENT (Scrollable body) */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white custom-scrollbar">
                            {modalLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-[#000080]/10 border-t-[#000080] rounded-full animate-spin"></div>
                                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Sedang memuat data...</p>
                                </div>
                            ) : modalData.length > 0 ? (
                                <div className="border border-slate-100 rounded-[2rem] overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Siswa</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kelas</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                                                    {modalType === 'nilai' ? 'Skor' : 'Status Harian'}
                                                </th>
                                                {modalType === 'nilai' && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>}
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {modalData.map((s, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-extrabold text-slate-700">{s.nama_siswa}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-black text-slate-400 uppercase">{s.nama_kelas || '-'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {modalType === 'nilai' ? (
                                                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-xs ${parseInt(s.nilai) >= 75 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                                {s.nilai || 0}
                                                            </div>
                                                        ) : (
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${s.status_absensi === 'Hadir' ? 'bg-emerald-50 text-emerald-600' :
                                                                s.status_absensi === 'Izin' ? 'bg-blue-50 text-blue-600' :
                                                                    s.status_absensi === 'Sakit' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                                }`}>
                                                                {s.status_absensi || '-'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    {modalType === 'nilai' && (
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-medium text-slate-500 line-clamp-2 max-w-xs">{s.keterangan || '-'}</p>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {modalType === 'nilai' ? (
                                                                <button 
                                                                    onClick={() => generateIndividualPDF(s)}
                                                                    className="p-2 bg-blue-50 text-[#000080] rounded-lg hover:bg-[#000080] hover:text-white transition-all shadow-sm"
                                                                    title="Unduh Rapor Individual"
                                                                >
                                                                    <Download size={14} />
                                                                </button>
                                                            ) : (
                                                                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                                                                    <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">S: {s.total_sakit || 0}</span>
                                                                    <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">I: {s.total_izin || 0}</span>
                                                                    <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">A: {s.total_alfa || 0}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                    <div className="bg-slate-50 w-20 h-20 rounded-[1.5rem] flex items-center justify-center border-2 border-dashed border-slate-200">
                                        <Activity size={32} className="text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 tracking-tight text-lg">Belum Ada Data</p>
                                        <p className="text-slate-400 font-medium text-sm">Pelatih belum mengisi {modalType === 'nilai' ? 'nilai' : 'absensi'} untuk periode ini.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* MODAL FOOTER */}
                        <div className="p-6 border-t border-slate-100 shrink-0 bg-slate-50/50 flex justify-end gap-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                            >
                                Tutup
                            </button>
                            {modalData.length > 0 && (
                                <button
                                    onClick={generatePDF}
                                    className="px-6 py-2.5 bg-[#000080] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2"
                                >
                                    <Download size={16} /> Unduh PDF
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Monitoring;
