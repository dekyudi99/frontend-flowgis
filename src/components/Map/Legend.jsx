import React from 'react';

export default function Legend({ legends }) {
  if (!legends) return null;

  return (
    <div style={{ padding: '10px', background: '#fff', borderRadius: '8px' }}>
      <h4>Layer Legend</h4>
      {Object.entries(legends).map(([layerKey, legendData]) => (
        <div key={layerKey} style={{ marginBottom: '12px' }}>
          <strong>{legendData.title}</strong>
          {legendData.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '14px', height: '14px', backgroundColor: item.color, display: 'inline-block' }}></span>
              <small>{item.label}</small>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}