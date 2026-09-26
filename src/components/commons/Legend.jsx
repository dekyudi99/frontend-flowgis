import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export default function Legend({ 
  title, 
  items, 
  onMouseDown, 
  style = {}, 
  onReset, 
  hasMoved = false, 
  onClose,
  className = "" 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div 
      style={style}
      className={`bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-teal-100/80 z-[500] w-52 pointer-events-auto transition-shadow select-none ${className}`}
    >
      {/* Draggable Header */}
      <div 
        onMouseDown={onMouseDown}
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-teal-50/80 to-emerald-50/80 rounded-t-xl border-b border-teal-100/60 cursor-grab active:cursor-grabbing"
        title="Click and drag to move legend"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></span>
          <h4 className="font-bold text-xs text-teal-900 truncate leading-tight" title={title}>
            {title}
          </h4>
        </div>
        
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {hasMoved && onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Reset legend position"
              className="p-1 text-teal-700 hover:bg-teal-100/80 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand legend" : "Collapse legend"}
            className="p-1 text-gray-400 hover:text-teal-700 hover:bg-teal-100/80 rounded transition-colors"
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Close legend"
              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors text-xs font-bold leading-none ml-0.5"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Legend Items List */}
      {!isCollapsed && (
        <ul className="p-2.5 space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-xs">
              <span
                className="w-3.5 h-3.5 inline-block shrink-0 border border-black/10 rounded shadow-2xs"
                style={{ backgroundColor: item.color }}
              ></span>
              <span className="text-gray-700 text-[11px] leading-tight truncate" title={item.label}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}