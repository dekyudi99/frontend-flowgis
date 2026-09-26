import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

/**
 * Loader Component
 * Mendukung:
 * 1. Mode Determinate (progres riil berbasis angka 0-100%, misal saat Upload File)
 * 2. Mode Indeterminate (komputasi asynchronous cloud/GEE tanpa persentase palsu)
 * 3. Stopwatch waktu pemrosesan riil (Elapsed Time)
 * 4. Tahapan proses informatif (Stages)
 * 5. Fitur pembatalan opsional (onCancel)
 */
function Loader({ 
  message, 
  subtitle,
  mode, 
  progress = null, 
  stages = null, 
  showTimer = true, 
  onCancel = null, 
  tip = null 
}) {
  const { t } = useTranslation();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Otomatis tentukan mode: jika nilai progress numerik diberikan, gunakan determinate
  const isDeterminate = mode === 'determinate' || (mode === undefined && typeof progress === 'number');

  // Stopwatch Waktu Riil Berjalan
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Tahapan default yang cerdas jika tidak disediakan caller
  const defaultStages = [
    { time: 0, text: 'Memverifikasi permintaan & parameter data...' },
    { time: 2, text: 'Menghubungi server & memproses ke database...' },
    { time: 6, text: 'Menyinkronkan transaksi data ke sistem...' },
  ];

  const activeStages = stages && stages.length > 0 ? stages : defaultStages;
  
  // Tentukan teks tahap saat ini berdasarkan detik berjalan
  const currentStageText = isDeterminate
    ? (progress >= 100 
        ? 'Memvalidasi geometri dan menyimpan data...' 
        : progress >= 30
        ? `Mengunggah file ke server (${Math.round(progress)}%)...`
        : 'Membaca & mengekstrak berkas spasial...')
    : ([...activeStages].reverse().find((s) => elapsedSeconds >= s.time)?.text || activeStages[0].text);

  const displayMessage = message || t('common.processing') || 'Memproses Analisis';
  const displaySubtitle = subtitle || (isDeterminate ? 'Proses transmisi data aktif' : 'Sedang memproses permintaan ke server...');

  const loaderContent = (
    <div
      className="fixed inset-0 bg-slate-900/60 z-[999999] flex justify-center items-center backdrop-blur-sm transition-opacity duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="bg-white p-7 rounded-2xl shadow-2xl flex flex-col items-center gap-5 w-full max-w-md mx-4 border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Ikon Satelit / Pulse Modern */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-teal-400/20 animate-pulse"></div>
          <div className="relative flex items-center justify-center w-14 h-14 bg-teal-50 text-teal-600 rounded-full border border-teal-100 shadow-sm">
            <svg className="w-7 h-7 text-teal-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5"></circle>
              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>

        {/* Judul & Pesan Utama */}
        <div className="text-center w-full">
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {displayMessage}
          </h3>
          <p className="text-xs text-slate-500">
            {displaySubtitle}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full">
          {isDeterminate ? (
            /* Progress Bar Riil (Determinate) */
            <div className="space-y-2">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner relative">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${Math.min(Math.max(progress || 0, 0), 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 px-1">
                <span>{progress >= 100 ? 'Selesai Mengunggah' : 'Mengirim'}</span>
                <span className="text-teal-600 font-mono text-sm">{Math.round(progress || 0)}%</span>
              </div>
            </div>
          ) : (
            /* Indeterminate Smooth Bar (Tanpa Angka Palsu) */
            <div className="w-full bg-teal-100/70 rounded-full h-2.5 overflow-hidden relative shadow-inner">
              <div className="absolute top-0 bottom-0 bg-gradient-to-r from-teal-500 to-teal-400 rounded-full animate-indeterminate"></div>
              <div className="absolute top-0 bottom-0 bg-teal-300 rounded-full animate-indeterminate-short"></div>
            </div>
          )}
        </div>

        {/* Kotak Tahapan Informatif */}
        <div className="w-full bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <p className="text-xs text-slate-700 font-medium text-left truncate leading-tight">
            {currentStageText}
          </p>
        </div>

        {/* Status Waktu Riil (Stopwatch) */}
        {showTimer && (
          <div className="flex items-center justify-between w-full text-xs text-slate-400 px-1 border-t border-slate-100 pt-3">
            <span className="text-slate-400">Durasi proses:</span>
            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              ⏱ {formatTime(elapsedSeconds)}
            </span>
          </div>
        )}

        {/* Tip Informatif jika proses memakan waktu > 12 detik */}
        {!isDeterminate && elapsedSeconds >= 12 && (
          <div className="w-full text-[11px] text-amber-800 bg-amber-50/90 border border-amber-200/70 px-3 py-2 rounded-lg text-center leading-relaxed">
            {tip || '💡 Proses membutuhkan waktu lebih lama di server. Mohon tunggu sejenak hingga transaksi selesai.'}
          </div>
        )}

        {/* Tombol Batal Opsional */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors py-1 px-3 rounded-md hover:bg-rose-50 border border-transparent hover:border-rose-100"
          >
            Batalkan Permintaan
          </button>
        )}

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(loaderContent, document.body) : loaderContent;
}

export default Loader;