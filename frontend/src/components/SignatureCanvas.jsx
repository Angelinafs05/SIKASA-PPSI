import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, X } from 'lucide-react';

const SignatureCanvas = ({ onSave, onClear }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#000080';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        const { x, y } = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasDrawn(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const { x, y } = getPos(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (onSave && canvasRef.current) {
                onSave(canvasRef.current.toDataURL('image/png'));
            }
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
        if (onClear) onClear();
        if (onSave) onSave(null);
    };

    return (
        <div className="space-y-2">
            <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden shadow-inner">
                <canvas
                    ref={canvasRef}
                    width={380}
                    height={120}
                    className="w-full h-[120px] touch-none cursor-crosshair block"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 font-bold text-xs uppercase tracking-widest gap-2">
                        <PenTool size={16} /> Goreskan Tanda Tangan Orang Tua di Sini
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>Gunakan mouse atau layar sentuh</span>
                <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                    <RotateCcw size={12} /> Hapus & Ulangi
                </button>
            </div>
        </div>
    );
};

export default SignatureCanvas;

