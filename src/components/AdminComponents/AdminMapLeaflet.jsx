import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, EyeOff, Sliders, Video, Camera, Hospital, Droplet } from 'lucide-react';
import { buildWmsLayerConfig, normalizeBbox } from '@/lib/wmsHelper';

// Fix default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper create custom div icons for categories
const createCustomIcon = (type) => {
  let bgColor = '#0d9488'; // teal default
  let emoji = '📍';

  if (type === 'CCTV Station') {
    bgColor = '#0284c7'; // sky blue
    emoji = '🎥';
  } else if (type === 'Hospital' || type === 'hospital' || type === 'Rumah Sakit') {
    bgColor = '#e11d48'; // rose red
    emoji = '🏥';
  } else if (type === 'Water Station' || type === 'water_station') {
    bgColor = '#2563eb'; // blue
    emoji = '💧';
  } else if (type === 'Evacuation Center' || type === 'evacuation_center' || type === 'Posko Evakuasi') {
    bgColor = '#059669'; // emerald green
    emoji = '⛺';
  } else if (type === 'Fire Station' || type === 'fire_station' || type === 'Pemadam Kebakaran') {
    bgColor = '#ea580c'; // orange
    emoji = '🚒';
  }

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${bgColor};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.35);
        border: 2px solid white;
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
        ${emoji}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function AdminMapLeaflet({ 
  facilities = [], 
  cctvStations = [],
  activeWmsLayer = null,
  onRemoveWmsLayer,
  selectedLocation = null, 
  onMapClick, 
  isPickMode = false,
  onWatchCctv
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const wmsLayerInstanceRef = useRef(null);

  const [wmsOpacity, setWmsOpacity] = useState(0.85);

  // Expose global callback for Leaflet popup click
  useEffect(() => {
    window.__flowgis_watch_cctv__ = (stationId) => {
      const allStations = [...cctvStations, ...facilities];
      const found = allStations.find(s => 
        String(s.id) === String(stationId) || 
        String(s.station_code) === String(stationId) ||
        String(s.raw_id) === String(stationId)
      );
      if (found && onWatchCctv) {
        onWatchCctv(found);
      }
    };
    return () => {
      delete window.__flowgis_watch_cctv__;
    };
  }, [cctvStations, facilities, onWatchCctv]);

  // 1. Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    
    // Center Nakhon Pathom / Bangkok
    const map = L.map(mapContainerRef.current).setView([13.7889, 100.2222], 11);

    // Basemap Carto Positron / OSM
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Auto invalidate size saat kontainer berubah ukuran (Full Map toggle atau mobile resize)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // 2. Handle Klik Peta untuk menentukan koordinat
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleContainerClick = (e) => {
      if (isPickMode && onMapClick) {
        const { lat, lng } = e.latlng;
        onMapClick({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
      }
    };

    map.on('click', handleContainerClick);
    return () => {
      map.off('click', handleContainerClick);
    };
  }, [isPickMode, onMapClick]);

  // 3. Render GeoServer WMS Layer Secara Dinamis
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Hapus WMS layer lama jika ada
    if (wmsLayerInstanceRef.current) {
      map.removeLayer(wmsLayerInstanceRef.current);
      wmsLayerInstanceRef.current = null;
    }

    if (activeWmsLayer) {
      const config = buildWmsLayerConfig(activeWmsLayer, { opacity: wmsOpacity });

      if (config && config.layers) {
        const wms = L.tileLayer.wms(config.url, {
          layers: config.layers,
          styles: config.styles,
          format: config.format,
          transparent: config.transparent,
          version: config.version,
          zIndex: config.zIndex,
          opacity: config.opacity,
        });

        wms.addTo(map);
        wmsLayerInstanceRef.current = wms;

        // Auto zoom ke layer jika koordinat bounds valid tersedia
        const bounds = config.bounds || normalizeBbox(
          activeWmsLayer.minx !== undefined ? [activeWmsLayer.minx, activeWmsLayer.miny, activeWmsLayer.maxx, activeWmsLayer.maxy] : activeWmsLayer.bbox
        );

        if (bounds) {
          try {
            map.fitBounds(bounds, { padding: [40, 40], animate: true });
          } catch (e) {
            console.warn("Could not fitBounds to layer:", e);
          }
        }
      }
    }
  }, [activeWmsLayer, wmsOpacity]);

  // 4. Render Marker Fasilitas & CCTV di Peta
  useEffect(() => {
    if (!markersGroupRef.current) return;
    markersGroupRef.current.clearLayers();

    // Gabungkan CCTV dan fasilitas
    const allMarkers = [
      ...facilities.map(f => ({ ...f, _type: f.category || 'Hospital' })),
      ...cctvStations.map(c => ({ ...c, _type: 'CCTV Station', category: 'CCTV Station' }))
    ];

    allMarkers.forEach((item) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        const isCctv = item._type === 'CCTV Station' || !!item.cctvLink || !!item.stream_url;
        const icon = createCustomIcon(item._type);

        const stationId = item.station_code || item.id;
        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 14px;">${isCctv ? '🎥' : '📍'}</span>
              <strong style="color: #0f172a; font-size: 13px; line-height: 1.2;">${item.name}</strong>
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
              Kategori: <strong style="color: #0d9488;">${item._type}</strong><br/>
              ${item.location ? `Lokasi: ${item.location}<br/>` : ''}
              <span style="font-family: monospace; font-size: 10px;">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
            </div>
            ${isCctv ? `
              <button 
                onclick="window.__flowgis_watch_cctv__('${stationId}')"
                style="
                  display: block;
                  width: 100%;
                  background: #0d9488;
                  color: white;
                  border: none;
                  padding: 6px 10px;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 600;
                  cursor: pointer;
                  text-align: center;
                "
              >
                🎥 Tonton Live Stream CCTV
              </button>
            ` : ''}
          </div>
        `;

        L.marker([lat, lng], { icon })
          .bindPopup(popupContent)
          .addTo(markersGroupRef.current);
      }
    });
  }, [facilities, cctvStations]);

  // 5. Marker Titik Pilihan Sementara
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tempMarkerRef.current) {
      map.removeLayer(tempMarkerRef.current);
      tempMarkerRef.current = null;
    }

    if (selectedLocation) {
      tempMarkerRef.current = L.circleMarker([selectedLocation.lat, selectedLocation.lng], {
        color: '#ef4444',
        fillColor: '#f87171',
        fillOpacity: 0.85,
        radius: 9,
        weight: 3
      }).addTo(map).bindPopup('Titik Lokasi Baru Terpilih').openPopup();

      map.panTo([selectedLocation.lat, selectedLocation.lng]);
    }
  }, [selectedLocation]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-inner">
      {/* Pick Mode Banner */}
      {isPickMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-teal-700 text-white text-xs px-4 py-1.5 rounded-full shadow-lg font-medium animate-pulse">
          Klik lokasi pada peta Leaflet untuk menentukan koordinat
        </div>
      )}

      {/* Floating HUD: Active GeoServer WMS Layer Control */}
      {activeWmsLayer && (
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md border border-teal-200 rounded-xl shadow-lg p-3 w-64 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
            <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
              <Layers className="w-4 h-4 text-teal-600" />
              <span className="truncate max-w-[140px]" title={activeWmsLayer.display_name || activeWmsLayer.name}>
                {activeWmsLayer.display_name || activeWmsLayer.name}
              </span>
            </div>
            {onRemoveWmsLayer && (
              <button
                onClick={onRemoveWmsLayer}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                title="Sembunyikan WMS Layer"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-[10px] text-gray-500 font-mono mb-2 truncate">
            {activeWmsLayer.layer_name || activeWmsLayer.layer_key}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-gray-700 font-medium">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-gray-400" /> Opacity
              </span>
              <span>{Math.round(wmsOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={wmsOpacity}
              onChange={(e) => setWmsOpacity(parseFloat(e.target.value))}
              className="w-full accent-teal-600 h-1 bg-gray-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Kontainer Peta */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[260px] sm:min-h-[360px]" />
    </div>
  );
}