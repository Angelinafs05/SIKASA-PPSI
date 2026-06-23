import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import logoSekolah from '../assets/logo_sekolah.png';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Auto close sidebar when clicking a route in mobile is handled in Sidebar
    return (
        <div className="app-container font-sans bg-[#f8fafc]">
            {/* Mobile Header (Hamburger) */}
            <div className="lg:hidden bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    <img
                        src={logoSekolah}
                        alt="Logo Sekolah"
                        className="w-9 h-9 object-contain"
                    />
                    <div className="flex flex-col">
                        <span className="font-extrabold text-[#000080] tracking-tight leading-none text-lg">SIKASA</span>
                        <span className="text-[9px] font-bold text-slate-400 tracking-wider">SMPK SANTA MARIA 2</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors active:scale-95"
                    aria-label="Toggle Sidebar Navigation"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <main className="content overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
