import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, Radio, AlertCircle, Camera, ShieldCheck } from 'lucide-react';
import { cctvService } from '@/services/cctvService';

export default function CctvStreamModal({ station, isOpen, onClose }) {
  const [useSnapshot, setUseSnapshot] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setStreamError(false);
      setUseSnapshot(false);
      setLoading(true);
      setStreamKey(Date.now());
    }
  }, [isOpen, station]);

  if (!isOpen || !station) return null;

  const streamUrl = `${cctvService.getStreamUrl(station.station_code || station.id)}?_t=${streamKey}`;
  const snapshotUrl = `${cctvService.getSnapshotUrl(station.station_code || station.id)}`;

  const handleReload = () => {
    setLoading(true);
    setStreamError(false);
    setStreamKey(Date.now());
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {station.name || 'CCTV Telemetry Camera'}
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                  <Radio className="w-3 h-3 animate-pulse text-red-400" /> LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Code: {station.station_code || 'N/A'} &bull; {station.location || 'Nakhon Pathom Station'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReload}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Reload Stream"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Box */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/70 text-slate-400 text-xs">
              <RefreshCw className="w-7 h-7 animate-spin text-teal-500 mb-2" />
              <span>Menghubungkan ke Feed Kamera...</span>
            </div>
          )}

          {!streamError && !useSnapshot ? (
            <img
              key={streamKey}
              src={streamUrl}
              alt={station.name}
              className="w-full h-full object-contain"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setStreamError(true);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 max-w-md">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
              <h4 className="text-sm font-semibold text-white mb-1">
                Kamera Tidak Merespons Stream Langsung
              </h4>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Kamera CCTV di stasiun ini sedang luring atau membutuhkan autentikasi jaringan lokal. Anda dapat mencoba mode snapshot JPEG.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setUseSnapshot(true);
                    setStreamError(false);
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium"
                >
                  Gunakan Snapshot Terkini
                </button>
                <button
                  onClick={handleReload}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          {useSnapshot && (
            <img
              src={snapshotUrl}
              alt="Snapshot"
              className="w-full h-full object-contain"
              onLoad={() => setLoading(false)}
            />
          )}

          {/* Overlay Coordinates & Auth badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Axis Digest Auth</span>
            <span className="text-slate-500">&bull;</span>
            <span className="font-mono text-teal-400">{station.lat}, {station.lng}</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="truncate max-w-md">
            <span className="text-slate-500">Target Stream URL: </span>
            <span className="font-mono text-[11px] text-slate-300">{station.stream_url}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
