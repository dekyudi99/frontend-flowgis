import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Palette, 
  X, 
  Check, 
  RotateCcw, 
  Loader2, 
  Sparkles,
  Sliders,
  Layers,
  Circle,
  Square,
  Triangle,
  Star,
  Plus
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

const PRESET_PALETTES = [
  { name: 'Teal FlowGIS', fill: '#0d9488', stroke: '#0f766e', label: 'Teal' },
  { name: 'Ocean Blue', fill: '#0284c7', stroke: '#0369a1', label: 'Blue' },
  { name: 'Crimson Alert', fill: '#e11d48', stroke: '#be123c', label: 'Red' },
  { name: 'Sunset Amber', fill: '#d97706', stroke: '#b45309', label: 'Amber' },
  { name: 'Emerald Forest', fill: '#059669', stroke: '#047857', label: 'Green' },
  { name: 'Royal Purple', fill: '#7c3aed', stroke: '#6d28d9', label: 'Purple' },
  { name: 'Slate Gray', fill: '#475569', stroke: '#1e293b', label: 'Slate' },
];

const MARK_OPTIONS = [
  { id: 'circle', label: 'Lingkaran', icon: Circle },
  { id: 'square', label: 'Persegi', icon: Square },
  { id: 'triangle', label: 'Segitiga', icon: Triangle },
  { id: 'star', label: 'Bintang', icon: Star },
  { id: 'cross', label: 'Salib (+)', icon: Plus },
];

const STROKE_DASH_OPTIONS = [
  { id: 'solid', label: 'Garis Utuh', value: null },
  { id: 'dashed', label: 'Putus-putus', value: '6,4' },
  { id: 'dotted', label: 'Titik-titik', value: '2,4' },
];

export default function GeosocialStyleModal({
  isOpen,
  onClose,
  layer,
  onSaveStyle,
}) {
  const { notify } = useNotification();
  const [fillColor, setFillColor] = useState('#0d9488');
  const [strokeColor, setStrokeColor] = useState('#0f766e');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillOpacity, setFillOpacity] = useState(0.65);
  const [strokeOpacity, setStrokeOpacity] = useState(1.0);
  const [pointSize, setPointSize] = useState(8);
  const [mark, setMark] = useState('circle');
  const [strokeDash, setStrokeDash] = useState('solid');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (layer) {
      setErrorMsg(null);
      const cfg = layer.style_config || {};
      const existingFill = cfg.fill_color || (layer.legend_url?.startsWith('#') ? layer.legend_url : null);
      
      setFillColor(existingFill || '#0d9488');
      setStrokeColor(cfg.stroke_color || '#0f766e');
      setStrokeWidth(cfg.stroke_width !== undefined ? Number(cfg.stroke_width) : 2);
      setFillOpacity(cfg.fill_opacity !== undefined ? Number(cfg.fill_opacity) : 0.65);
      setStrokeOpacity(cfg.stroke_opacity !== undefined ? Number(cfg.stroke_opacity) : 1.0);
      setPointSize(cfg.point_size !== undefined ? Number(cfg.point_size) : 8);
      setMark(cfg.mark || 'circle');

      if (cfg.stroke_dasharray === '2,4') {
        setStrokeDash('dotted');
      } else if (cfg.stroke_dasharray) {
        setStrokeDash('dashed');
      } else {
        setStrokeDash('solid');
      }
    }
  }, [layer, isOpen]);

  if (!isOpen || !layer) return null;

  const handleApplyPreset = (preset) => {
    setFillColor(preset.fill);
    setStrokeColor(preset.stroke);
  };

  const handleReset = () => {
    setFillColor('#0d9488');
    setStrokeColor('#0f766e');
    setStrokeWidth(2);
    setFillOpacity(0.65);
    setStrokeOpacity(1.0);
    setPointSize(8);
    setMark('circle');
    setStrokeDash('solid');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const dashParam = STROKE_DASH_OPTIONS.find((opt) => opt.id === strokeDash)?.value || null;

    try {
      await onSaveStyle(layer.id, {
        fill_color: fillColor,
        stroke_color: strokeColor,
        stroke_width: strokeWidth,
        fill_opacity: fillOpacity,
        stroke_opacity: strokeOpacity,
        point_size: pointSize,
        mark: mark,
        stroke_dasharray: dashParam,
      });
      onClose();
    } catch (err) {
      console.error('Save style error:', err);
      let errMsg = err.response?.data?.message || err.response?.data?.detail || err.message || 'Gagal menyimpan style ke GeoServer.';
      if (typeof errMsg === 'object') {
        errMsg = JSON.stringify(errMsg);
      }
      setErrorMsg(errMsg);
      notify.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const displayName = layer.display_name || layer.name || 'Unnamed Layer';
  const layerKey = layer.layer_name || layer.layer_key || '-';
  const svgDashArray = strokeDash === 'dashed' ? '6,4' : strokeDash === 'dotted' ? '2,4' : undefined;

  // Render SVG Marker sesuai bentuk (mark)
  const renderPointPreview = () => {
    const s = Math.min(24, Math.max(8, pointSize * 1.5));
    const cx = 22;
    const cy = 22;

    switch (mark) {
      case 'square':
        return (
          <rect
            x={cx - s / 2}
            y={cy - s / 2}
            width={s}
            height={s}
            rx="1"
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={Math.min(3, strokeWidth)}
            strokeOpacity={strokeOpacity}
          />
        );
      case 'triangle':
        return (
          <polygon
            points={`${cx},${cy - s / 2} ${cx + s / 2},${cy + s / 2} ${cx - s / 2},${cy + s / 2}`}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={Math.min(3, strokeWidth)}
            strokeOpacity={strokeOpacity}
          />
        );
      case 'star': {
        const rOuter = s / 2;
        const rInner = rOuter * 0.45;
        const points = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? rOuter : rInner;
          points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return (
          <polygon
            points={points.join(' ')}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={Math.min(2.5, strokeWidth)}
            strokeOpacity={strokeOpacity}
          />
        );
      }
      case 'cross':
      case 'x': {
        const half = s / 2;
        return (
          <g>
            <line
              x1={cx - half}
              y1={cy}
              x2={cx + half}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={Math.min(4, Math.max(2, strokeWidth))}
              strokeOpacity={strokeOpacity}
            />
            <line
              x1={cx}
              y1={cy - half}
              x2={cx}
              y2={cy + half}
              stroke={strokeColor}
              strokeWidth={Math.min(4, Math.max(2, strokeWidth))}
              strokeOpacity={strokeOpacity}
            />
          </g>
        );
      }
      case 'circle':
      default:
        return (
          <circle
            cx={cx}
            cy={cy}
            r={Math.min(16, Math.max(4, pointSize))}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={Math.min(3, strokeWidth)}
            strokeOpacity={strokeOpacity}
          />
        );
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Atur Style Layer Spasial
              </h3>
              <p className="text-[11px] text-gray-500 font-mono truncate max-w-xs" title={layerKey}>
                {layerKey}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Info Layer */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Layer Target</span>
              <span className="text-xs font-semibold text-gray-800 truncate block">{displayName}</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800 uppercase shrink-0">
              {layer.type || 'WMS'}
            </span>
          </div>

          {/* Preset Palet Warna Cepat */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Preset Warna Cepat
            </label>
            <div className="grid grid-cols-7 gap-2">
              {PRESET_PALETTES.map((preset) => {
                const isSelected = fillColor.toLowerCase() === preset.fill.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    title={preset.name}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-200 shadow-xs' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div 
                      className="w-6 h-6 rounded-full border border-black/10 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: preset.fill }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </div>
                    <span className="text-[9px] font-medium text-gray-600 truncate w-full text-center">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 bg-gradient-to-b from-gray-50 to-slate-100/70 border border-gray-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3 h-3 text-teal-600" /> Pratinjau Tampilan (Live Preview)
              </span>
              <span className="text-[10px] text-gray-400 font-mono">SLD Vector Preview</span>
            </div>

            <div className="h-20 bg-white rounded-lg border border-gray-200 flex items-center justify-around px-4 relative overflow-hidden shadow-inner">
              {/* Preview Polygon */}
              <div className="flex flex-col items-center gap-1">
                <svg width="44" height="44" className="drop-shadow-xs">
                  <polygon
                    points="22,4 40,16 34,40 10,40 4,16"
                    fill={fillColor}
                    fillOpacity={fillOpacity}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={svgDashArray}
                  />
                </svg>
                <span className="text-[9px] font-medium text-gray-400">Poligon</span>
              </div>

              {/* Preview Line */}
              <div className="flex flex-col items-center gap-1">
                <svg width="44" height="44">
                  <path
                    d="M 4,36 Q 22,4 40,36"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeLinecap="round"
                    strokeDasharray={svgDashArray}
                  />
                </svg>
                <span className="text-[9px] font-medium text-gray-400">Garis</span>
              </div>

              {/* Preview Point with Dynamic Marker Shape */}
              <div className="flex flex-col items-center gap-1">
                <svg width="44" height="44">
                  {renderPointPreview()}
                </svg>
                <span className="text-[9px] font-medium text-teal-700 font-semibold capitalize">
                  {mark} ({pointSize}px)
                </span>
              </div>
            </div>
          </div>

          {/* Pilihan Bentuk Marker (Point Mark) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Bentuk Marker Titik (Point Mark)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {MARK_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = mark === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMark(opt.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 text-teal-800 font-semibold shadow-xs ring-1 ring-teal-200'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                    <span className="text-[10px]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Kontrol Warna */}
          <div className="grid grid-cols-2 gap-4">
            {/* Fill Color */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Warna Isian (Fill Color)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-gray-300 p-0.5 cursor-pointer bg-white shrink-0"
                />
                <input
                  type="text"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono uppercase border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Stroke Color */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Warna Garis Tepi (Stroke)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-gray-300 p-0.5 cursor-pointer bg-white shrink-0"
                />
                <input
                  type="text"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono uppercase border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Tipe Garis Tepi (Stroke Style) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Pola Garis Tepi (Stroke Style)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STROKE_DASH_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStrokeDash(opt.id)}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-medium text-center transition ${
                    strokeDash === opt.id
                      ? 'border-teal-500 bg-teal-50 text-teal-800 font-semibold ring-1 ring-teal-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider Transparansi & Ketebalan */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* Fill Opacity */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-semibold text-gray-700">
                <span>Transparansi Isian</span>
                <span className="font-mono text-teal-700 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {Math.round(fillOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={fillOpacity}
                onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                className="w-full accent-teal-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Stroke Opacity */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-semibold text-gray-700">
                <span>Transparansi Garis</span>
                <span className="font-mono text-teal-700 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {Math.round(strokeOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={strokeOpacity}
                onChange={(e) => setStrokeOpacity(parseFloat(e.target.value))}
                className="w-full accent-teal-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Stroke Width */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-semibold text-gray-700">
                <span>Ketebalan Garis</span>
                <span className="font-mono text-teal-700 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {strokeWidth} px
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                className="w-full accent-teal-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Point Size */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-semibold text-gray-700">
                <span>Ukuran Marker</span>
                <span className="font-mono text-teal-700 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {pointSize} px
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="1"
                value={pointSize}
                onChange={(e) => setPointSize(parseInt(e.target.value, 10))}
                className="w-full accent-teal-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Default
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menerapkan ke GeoServer...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Simpan & Terapkan Style
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
