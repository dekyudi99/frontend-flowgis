import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2'; 
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler 
} from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function PrecipitationChart({ chartData }) {
  const { t } = useTranslation();

  const [isMonthlyView, setIsMonthlyView] = useState(false);

  useEffect(() => {
    if (chartData && chartData.length > 60) {
        setIsMonthlyView(true);
    } else {
        setIsMonthlyView(false);
    }
  }, [chartData]);

  const processedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    if (isMonthlyView) {
      const monthlyMap = {};
      
      chartData.forEach(d => {
        if (d.date) {
          // Potong string "2024-05-24" menjadi "2024-05"
          const monthYear = d.date.substring(0, 7); 
          if (!monthlyMap[monthYear]) {
            monthlyMap[monthYear] = 0;
          }
          monthlyMap[monthYear] += d.precipitation; 
        }
      });

      return Object.keys(monthlyMap).map(key => {
        const dateObj = new Date(key + '-01');
        const label = dateObj.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        
        return { 
            label: label, 
            precipitation: monthlyMap[key] 
        };
      });
    }

    return chartData.map(d => ({
      label: d.date,
      precipitation: d.precipitation
    }));
  }, [chartData, isMonthlyView]);

  if (!chartData || chartData.length === 0) { 
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        There is no rainfall data for this area.
      </div>
    );
  }

  const data = {
    labels: processedData.map(d => d.label), 
    datasets: [
      {
        label: isMonthlyView ? 'Monthly Accumulation (mm)' : 'Daily Rainfall (mm)', 
        data: processedData.map(d => d.precipitation),
        fill: true, 
        backgroundColor: 'rgba(54, 162, 235, 0.2)', 
        borderColor: 'rgba(54, 162, 235, 1)', 
        borderWidth: 2, 
        pointRadius: isMonthlyView ? 4 : 1, 
        pointHoverRadius: 6, 
        tension: 0.3 
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          autoSkip: true, 
          maxRotation: 0, 
          minRotation: 0,
          maxTicksLimit: isMonthlyView ? 12 : 8 
        },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        title: {
            display: true,
            text: 'Curah Hujan (mm)',
            font: { size: 10 }
        },
        grid: { color: 'rgba(200, 200, 200, 0.2)' }
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 15, font: { size: 11 } }
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            return ` ${context.parsed.y.toFixed(2)} mm`;
          }
        }
      }
    },
  };

  return (
    <div className="h-full w-full flex flex-col relative group">
      {/* Tombol Toggle yang muncul saat kursor diarahkan ke area grafik */}
      <div className="absolute top-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => setIsMonthlyView(!isMonthlyView)}
          className="text-[10px] bg-white hover:bg-teal-50 text-teal-600 px-2 py-1 rounded border border-teal-200 shadow-sm transition-colors cursor-pointer"
        >
          View Mode {isMonthlyView ? 'Daily' : 'Monthly'}
        </button>
      </div>
      
      <div className="flex-grow">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default PrecipitationChart;