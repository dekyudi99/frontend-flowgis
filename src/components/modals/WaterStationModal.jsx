import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
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
  TimeScale, 
  Filler 
} from 'chart.js';
import 'chartjs-adapter-date-fns'; 
import { facilityService } from '../../services/facilityService'; 
import { X, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import Loader from '../commons/Loader';
import { useTranslation } from 'react-i18next';

// Registrasi ChartJS
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  TimeScale, 
  Filler
);

const modalStyles = {
  content: {
  top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '1000px',
    height: '80vh',
    padding: '2rem',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
};

const processChartData = (data, labelName, colorConfig) => {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [] };
  }
  const sortedData = data.slice().sort((a, b) => {

    if (!a || !a.valueDateTime || !b || !b.valueDateTime) return 0;
    return new Date(a.valueDateTime) - new Date(b.valueDateTime);
  });
 
  const colors = colorConfig || {
    border: 'rgb(75, 192, 192)',
    bg: 'rgba(75, 192, 192, 0.5)',
  };

  return {
  
    labels: sortedData.map(d => new Date(d.valueDateTime)),
    datasets: [
      {
        label: labelName,

        data: sortedData.map(d => (d.value !== null && d.value !== undefined) ? d.value : NaN),
        
        borderColor: colors.border,
        backgroundColor: colors.bg,
        tension: 0.1,
      },
    ],
  };
};

// const chartOptions = {
//   responsive: true,
//   maintainAspectRatio: false,
//   plugins: {
//     legend: {
//     position: 'top',
//     },
//     title: {
//     display: false, 
//     },
//   },
//   scales: {
//     x: {
//       type: 'time',
//       time: {
//         unit: 'day',
//         tooltipFormat: 'Pp', 
//       },
//       title: {
//         display: true,
//         text: 'Date / Time',
//       },
    
//       ticks: {
//         autoSkip: true,
//         maxTicksLimit: 10,
//       }
//     },
//     y: {
//       title: {
//       display: true,
//       text: 'Value',
//       },
//     },
//   },
// };

const getChartOptions = (t) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: { display: false },
  },
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day',
        tooltipFormat: 'Pp', 
      },
      title: {
        display: true,
        text: t('waterStation.modal.charts.axisDate'), // <-- DIUBAH
      },
      ticks: {
        autoSkip: true,
        maxTicksLimit: 10,
      }
    },
    y: {
      title: {
        display: true,
        text: t('waterStation.modal.charts.axisValue'), // <-- DIUBAH
      },
    },
  },
});

// const rainfallChartOptions = {
//   ...chartOptions,
//   scales: {
//     ...chartOptions.scales,
//     y: {
//       ...chartOptions.scales.y,
//       beginAtZero: true
//     }
//   }
// };

const getRainfallChartOptions = (t) => ({
  ...getChartOptions(t),
  scales: {
    ...getChartOptions(t).scales, 
    y: {
      ...getChartOptions(t).scales.y,
      beginAtZero: true
    }
  }
});

export default function WaterStationModal({ isOpen, onClose, stationCode, stationName, location }) {
  const { t } = useTranslation();
  const [cctvError, setCctvError] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [videoSrc, setVideoSrc] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cctvContainerRef = useRef(null);

  // Update source saat stationCode atau isOpen berubah
  useEffect(() => {
    setCctvError(false);
    setIsBuffering(true);

    if (!isOpen || !stationCode) {
      setVideoSrc('');
      return;
    }

    const newUrl = `${facilityService.getCctvStreamUrl(stationCode)}?_t=${Date.now()}`;
    setVideoSrc(newUrl);

    return () => {
      // Abort previous stream connection instantly
      setVideoSrc('');
    };
  }, [stationCode, isOpen]);

  // Listener untuk perubahan fullscreen browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const element = cctvContainerRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch((err) => {
          console.error("Failed to enter fullscreen:", err);
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleCctvError = () => {
    setCctvError(true);
    setIsBuffering(false);
  };

  const handleRefresh = () => {
    setCctvError(false);
    setIsBuffering(true);
    const refreshed = `${facilityService.getCctvStreamUrl(stationCode)}?_t=${Date.now()}`;
    setVideoSrc(refreshed);
  };

  const renderContent = () => {
    return (
      <div className="flex flex-col gap-4 h-full">
        {/* Detail Stasiun */}
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-gray-700">
          <p className="font-semibold text-teal-800 text-base">{stationName || stationCode}</p>
          <p className="text-gray-600 mt-1">{location || 'Nakhon Pathom Province, Thailand'}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Station Code: <strong className="text-gray-700">{stationCode}</strong></span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry & CCTV
            </span>
          </div>
        </div>

        {/* Video CCTV Section */}
        <div 
          ref={cctvContainerRef}
          className={`relative bg-gray-950 flex justify-center items-center transition-all ${
            isFullscreen 
              ? 'fixed inset-0 z-[9999] w-screen h-screen bg-black' 
              : 'h-[340px] md:h-[440px] rounded-xl overflow-hidden shadow-inner border border-gray-800'
          }`}
        >
          {isBuffering && !cctvError && (
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-xs flex flex-col items-center justify-center z-10 text-white">
              <Loader />
              <p className="text-xs text-gray-300 mt-2 font-medium">Connecting to CCTV stream...</p>
            </div>
          )}

          {!cctvError ? (
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              {videoSrc && (
                <img 
                  key={videoSrc}
                  src={videoSrc} 
                  alt={`Live CCTV ${stationCode}`}
                  className="w-full h-full object-contain select-none"
                  onLoad={() => setIsBuffering(false)}
                  onError={handleCctvError}
                />
              )}

              {/* Status Badge & Station Title (Left side) */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                <div className="bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border border-white/10 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  <span className="font-semibold tracking-wide">REC • LIVE</span>
                </div>
                {isFullscreen && (
                  <div className="hidden sm:flex bg-black/70 backdrop-blur-sm text-gray-200 px-3 py-1.5 rounded-lg text-xs border border-white/10">
                    <span>{stationName || stationCode} ({stationCode})</span>
                  </div>
                )}
              </div>

              {/* Controls (Reload & Fullscreen) */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                <button
                  type="button"
                  onClick={handleRefresh}
                  title="Reload CCTV Stream"
                  className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg text-xs backdrop-blur-sm transition flex items-center gap-1 border border-white/10 hover:border-teal-400/50 shadow-sm"
                >
                  <RefreshCw size={15} className={isBuffering ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Mode"}
                  className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm transition flex items-center gap-1.5 border border-white/10 hover:border-teal-400/50 shadow-sm font-medium"
                >
                  {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  <span className="hidden sm:inline">
                    {isFullscreen ? 'Exit Fullscreen' : 'Layar Penuh'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-white text-center p-6">
              <p className="text-2xl font-bold text-red-400">CAMERA OFFLINE</p>
              <p className="text-sm text-gray-400 mt-1">Signal lost or CCTV camera is currently unreachable.</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-4 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow transition"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
   <Modal
     isOpen={isOpen}
     onRequestClose={onClose}
     style={modalStyles}
     contentLabel={t('waterStation.modal.contentLabel')}
     appElement={document.getElementById('root') || undefined}
   >
     <div className="flex justify-between items-center mb-4">
       <h2 className="text-2xl font-bold">{t('waterStation.modal.title', { stationCode: stationCode })}</h2>
         <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
           <X size={24} />
         </button>
       </div>
 
       {/* Wrapper to ensure content takes up the remaining height */}
       <div className="h-[calc(100%-50px)] overflow-y-auto">
       {renderContent()}
      </div>

     </Modal>
   );
}