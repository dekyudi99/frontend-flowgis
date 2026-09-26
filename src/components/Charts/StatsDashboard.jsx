import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function StatsDashboard({ statistics }) {
  if (!statistics) return null;

  const riskChartData = Object.entries(statistics.risk_distribution || {}).map(([level, count]) => ({
    level: `Level ${level}`,
    count: count,
  }));

  return (
    <div style={{ padding: '15px' }}>
      <h3>Area Analysis Summary</h3>
      
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        <div><small>Average Rainfall</small><h4>{statistics.avg_rainfall_mm} mm</h4></div>
        <div><small>Average Elevation</small><h4>{statistics.avg_elevation_m} m</h4></div>
        <div><small>Vegetation Index (NDVI)</small><h4>{statistics.avg_ndvi}</h4></div>
        <div><small>Water Index (NDWI)</small><h4>{statistics.avg_ndwi}</h4></div>
      </div>

      {/* Bar Chart Distribusi Risiko */}
      <div style={{ height: '200px', marginTop: '20px' }}>
        <h4>Flood Risk Pixel Distribution</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={riskChartData}>
            <XAxis dataKey="level" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3182ce" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}