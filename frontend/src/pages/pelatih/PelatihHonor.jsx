import React, { useState, useEffect, useRef } from 'react';
import {
    Wallet,
    Calendar,
    AlertCircle,
    FileText,
    Image as ImageIcon,
    Printer,
    X
} from 'lucide-react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const PelatihHonor = () => {
    const { user } = useAuth();
    const [honors, setHonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFaktur, setSelectedFaktur] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/pelatih/honor');
            if (response.data.success) {
                setHonors(response.data.data);
            }
        } catch (err) {
            setError('Gagal mengambil riwayat honor');
        } finally {
            setLoading(false);
        }
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(angka);
    };

    const handlePrint = () => {
        if (selectedFaktur) {
            const printContent = document.getElementById('faktur-print-area').innerHTML;
            const originalContent = document.body.innerHTML;
            
            document.body.innerHTML = printContent;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload(); 
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
                <p className="font-bold text-slate-500">Memuat riwayat honor...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-sans pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 print:hidden">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight mb-1">
                        Riwayat Honor
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Catatan pencairan honor atau gaji bulanan ekstrakurikuler Anda.
                    </p>
                </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200 font-bold text-sm flex items-center gap-2 print:hidden">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 print:hidden">
                {honors.length > 0 ? (
                    honors.map((item) => {
                        const tglObj = new Date(item.tanggal_cair);
                        const tglStr = tglObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                        const isSudahDibayar = item.status === 'sudah dibayar' || !item.status; // fallbacks to paid if no status column in some old rows
                        
                        return (
                            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700">
                                        <Wallet size={28} className="mb-1" />
                                        <span className="text-[10px] uppercase font-black tracking-widest">{item.tahun}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-slate-800">Honor {item.bulan} {item.tahun}</h3>
                                            {isSudahDibayar ? (
                                                 <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                    Sudah Dibayar
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                                    Belum Dibayar
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-slate-400" />
                                                Dicairkan pada: <span className="text-slate-700 font-bold">{tglStr}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                Via: <span className="text-[#000080] font-bold">
                                                    {item.metode_penyerahan === 'Transfer' ? 'Transfer Bank' : 
                                                     item.metode_penyerahan === 'Titip_Guru' ? `Titip Guru (${item.nama_titip_guru})` : 'Tunai / Langsung'}
                                                </span>
                                            </div>
                                        </div>
                                        {item.keterangan && (
                                            <div className="text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3 mt-2">
                                                "{item.keterangan}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                                    <div className="text-2xl md:text-3xl font-black text-slate-800">
                                        {formatRupiah(item.nominal)}
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        {item.metode_penyerahan === 'Transfer' && item.bukti_transfer && (
                                            <a
                                                href={`http://localhost/SIKASA%20PPSI/backend/${item.bukti_transfer}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-[#000080] text-slate-600 hover:text-white rounded-xl text-xs font-bold border border-slate-200 hover:border-[#000080] transition-colors"
                                            >
                                                <ImageIcon size={14} /> Lihat Bukti Transfer
                                            </a>
                                        )}
                                        {isSudahDibayar && (
                                            <button
                                                onClick={() => setSelectedFaktur(item)}
                                                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
                                            >
                                                <Printer size={14} /> Cetak Faktur / Bukti
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100 shadow-inner">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-300">
                            <FileText size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-700 mb-2">Belum ada riwayat honor</h3>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium">
                            Catatan honor bulanan Anda akan muncul di sini setelah diproses oleh Admin.
                        </p>
                    </div>
                )}
            </div>

            {/* FAKTUR MODAL */}
            {selectedFaktur && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block">
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-full print:shadow-none print:rounded-none">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 print:hidden">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <FileText className="text-[#000080]" /> Detail Bukti Pembayaran
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="bg-[#000080] hover:bg-[#000066] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm"
                                >
                                    <Printer size={16} /> Cetak (A4)
                                </button>
                                <button
                                    onClick={() => setSelectedFaktur(null)}
                                    className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-8 overflow-y-auto print:overflow-visible print:p-8" id="faktur-print-area">
                            {/* Invoice Header */}
                            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                                <div className="flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-[#000080] text-white rounded-full flex items-center justify-center font-black text-2xl tracking-tighter">
                                        SM
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black text-[#000080] mb-1">SMPK Santa Maria II</h1>
                                        <p className="text-sm font-semibold text-slate-800">No. Izin Sekolah : 421.3/2800/35.73.307/2012</p>
                                        <p className="text-sm text-slate-600 max-w-xs mt-1">Jl. Panderman No.7A, Gading Kasri, Kec. Klojen, Kota Malang, Jawa Timur 65115</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-black tracking-widest text-slate-800 uppercase mb-2" style={{ fontFamily: 'monospace' }}>FAKTUR</h2>
                                </div>
                            </div>
                            
                            {/* Info Section */}
                            <div className="flex justify-between items-start mb-8 text-sm">
                                <div>
                                    <table className="text-slate-700">
                                        <tbody>
                                            <tr>
                                                <td className="font-bold py-1 pr-4">Nama</td>
                                                <td>: {user?.nama || '-'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <table className="text-slate-700">
                                        <tbody>
                                            <tr>
                                                <td className="font-bold py-1 pr-4">Kasir / Admin</td>
                                                <td>: Administrator / Tata Usaha</td>
                                            </tr>
                                            <tr>
                                                <td className="font-bold py-1 pr-4">Tanggal Cair</td>
                                                <td>: {new Date(selectedFaktur?.tanggal_cair).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            </tr>
                                            <tr>
                                                <td className="font-bold py-1 pr-4">Pembayaran</td>
                                                <td className="uppercase font-bold tracking-wider">: {selectedFaktur?.metode_penyerahan === 'Titip_Guru' ? 'DITITIPKAN GURU PENDAMPING' : selectedFaktur?.metode_penyerahan}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Table */}
                            <table className="w-full text-sm border-collapse mb-8 border border-slate-800">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-800 border border-slate-800">
                                        <th className="py-3 px-4 border border-slate-800 w-12 text-center">No</th>
                                        <th className="py-3 px-4 border border-slate-800 text-left">Nama Barang / Keterangan</th>
                                        <th className="py-3 px-4 border border-slate-800 text-center w-20">Qty</th>
                                        <th className="py-3 px-4 border border-slate-800 text-center w-28">Satuan</th>
                                        <th className="py-3 px-4 border border-slate-800 text-right w-40">Harga</th>
                                        <th className="py-3 px-4 border border-slate-800 text-right font-bold w-40">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border border-slate-800">
                                        <td className="py-5 px-4 border border-slate-800 text-center align-top">1</td>
                                        <td className="py-5 px-4 border border-slate-800 align-top">
                                            <div className="font-bold text-base">Honor Ekstrakurikuler Periode {selectedFaktur?.bulan} {selectedFaktur?.tahun}</div>
                                            <div className="text-xs text-slate-600 mt-1.5">{selectedFaktur?.keterangan || 'Gaji Pelatih Ekstrakurikuler bulanan rutin'}</div>
                                        </td>
                                        <td className="py-5 px-4 border border-slate-800 text-center align-top">1</td>
                                        <td className="py-5 px-4 border border-slate-800 text-center align-top">Bulan</td>
                                        <td className="py-5 px-4 border border-slate-800 text-right align-top">{formatRupiah(selectedFaktur?.nominal)}</td>
                                        <td className="py-5 px-4 border border-slate-800 text-right align-top">{formatRupiah(selectedFaktur?.nominal)}</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="py-4 px-4 border border-slate-800 text-right font-bold" colSpan={5}>
                                            Total :
                                        </td>
                                        <td className="py-4 px-4 border border-slate-800 text-right font-black text-lg">{formatRupiah(selectedFaktur?.nominal)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PelatihHonor;
