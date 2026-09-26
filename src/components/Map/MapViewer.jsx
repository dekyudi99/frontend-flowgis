import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, Marker, Popup, Tooltip, CircleMarker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { baseMaps } from '@/lib/basemap';

const hospitalIcon = L.icon({
  iconUrl: '/icons/hospital.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const waterStationIcon = L.icon({
  iconUrl: '/icons/water.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapInitializer({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      if(mapRef) mapRef.current = map;
      
      const style = document.createElement('style');
      style.innerHTML = `
        .leaflet-draw-toolbar {
          display: none !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [map, mapRef]);

  return null;
}

function WmsLayerManager({ wmsLayers = {} }) {
  const map = useMap();
  const layersMapRef = useRef(new Map());

  useEffect(() => {
    if (!map) return;

    const currentMap = layersMapRef.current;
    const incomingKeys = new Set(Object.keys(wmsLayers));

    // Remove layers that are no longer active
    currentMap.forEach((leafletLayer, key) => {
      if (!incomingKeys.has(key)) {
        map.removeLayer(leafletLayer);
        currentMap.delete(key);
      }
    });

    // Add or update layers
    Object.entries(wmsLayers).forEach(([key, layer]) => {
      if (!layer || !layer.wms_url || !layer.wms_layers_param) return;

      const existingWms = currentMap.get(key);
      if (existingWms) {
        if (layer._t && existingWms.options?._t !== layer._t) {
          map.removeLayer(existingWms);
          currentMap.delete(key);
        } else {
          return;
        }
      }

      const wmsUrl = layer._t
        ? `${layer.wms_url}${layer.wms_url.includes('?') ? '&' : '?'}_t=${layer._t}`
        : layer.wms_url;

      const wms = L.tileLayer.wms(wmsUrl, {
        layers: layer.wms_layers_param,
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        zIndex: 40,
        _t: layer._t,
        opacity: layer.opacity !== undefined ? layer.opacity : 0.85,
      });
      wms.addTo(map);
      currentMap.set(key, wms);
    });

    return () => {
      currentMap.forEach((leafletLayer) => {
        map.removeLayer(leafletLayer);
      });
      currentMap.clear();
    };
  }, [map, wmsLayers]);

  return null;
}

function SavedAoiRenderer({ selectedAoi, drawnItemsRef }) {
  const map = useMap();

  useEffect(() => {
    if (!drawnItemsRef?.current) return;

    drawnItemsRef.current.clearLayers();

    if (!selectedAoi || !selectedAoi.geometry) return;

    try {
      let rawGeometry = selectedAoi.geometry;
      if (typeof rawGeometry === 'string') {
        rawGeometry = JSON.parse(rawGeometry);
      }

      const geoJsonData = rawGeometry.type === 'Feature' ? rawGeometry : {
        type: 'Feature',
        geometry: rawGeometry,
        properties: {}
      };

      const geoJsonLayer = L.geoJSON(geoJsonData, {
        style: {
          color: '#0d9488',
          weight: 3,
          opacity: 0.9,
          fillColor: '#0d9488',
          fillOpacity: 0.25
        }
      });

      geoJsonLayer.eachLayer((layer) => {
        drawnItemsRef.current.addLayer(layer);
      });

      
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    } catch (err) {
      console.error("Failed to render geometry AOI:", err);
    }
  }, [selectedAoi, map, drawnItemsRef]);

  return null;
}

export default function MapViewer({ 
  maps, 
  wmsLayers = {},
  basemap = 'osm', 
  mapRef,
  drawnItemsRef,
  onGeometryComplete,
  onAoiCleared,
  selectedAoi,
  hospitals = [],
  hospitalsVisible = false,
  waterStations = [],
  waterStationsVisible = false,
  onWaterStationClick,
  geosocialPointLayers = {},
  // drawnGeometryData 
}) {
  
  const activeBasemap = baseMaps.find(b => b.id === basemap) || baseMaps.find(b => b.id === 'osm');

  const handleCreated = (e) => {
    const { layer, layerType } = e;
    const geoJson = layer.toGeoJSON();
    let data;

    if (layerType === 'polygon' || layerType === 'rectangle') {
      data = {
        type: 'polygon',
        geometry: geoJson.geometry.coordinates,
      };
    } else if (layerType === 'marker') {
      data = {
        type: 'point',
        geometry: geoJson.geometry.coordinates,
      };
    } else if (layerType === 'circle') {
      const center = layer.getLatLng();
      const radius = layer.getRadius();
      data = {
        type: 'circle',
        geometry: { coordinates: [center.lng, center.lat], radius: radius },
      };
    }

    if (data && onGeometryComplete) {
      onGeometryComplete(data, layer);
    }
  };

  return (
    <MapContainer 
      center={[13.8196, 100.0443]} 
      zoom={10} 
      zoomControl={false} 
      style={{ height: '100%', width: '100%' }}
    >
      <MapInitializer mapRef={mapRef} />

      <SavedAoiRenderer selectedAoi={selectedAoi} drawnItemsRef={drawnItemsRef} />

      <TileLayer 
        key={activeBasemap.id} 
        url={activeBasemap.url} 
        attribution={activeBasemap.attribution}
        maxZoom={activeBasemap.maxZoom || 19}
      />

      {/* Dynamic Tile Layers dari GEE */}
      {maps && Object.entries(maps).map(([layerName, tileUrl]) => {
        if (typeof tileUrl !== 'string' || !tileUrl.startsWith('http')) return null;
        return <TileLayer key={layerName} url={tileUrl} />;
      })}

      {/* Dynamic WMS Layers dari AstraGIS (S2S) */}
      <WmsLayerManager wmsLayers={wmsLayers} />

      {/* Hospital Facilities Markers */}
      {hospitalsVisible && hospitals.map((h, i) => {
        const coords = h.geometry?.coordinates || [h.lng, h.lat];
        if (!coords || coords.length < 2) return null;
        const position = [coords[1], coords[0]];
        const p = h.properties || h;
        return (
          <Marker key={`hosp-${p.id || i}`} position={position} icon={hospitalIcon}>
            <Popup className="hospital-popup">
              <div className="p-1 min-w-[220px]">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                  <img src="/icons/hospital.png" alt="Hospital" className="w-6 h-6 object-contain" />
                  <div>
                    <h4 className="font-bold text-sm text-red-700 leading-tight">{p.name}</h4>
                    <span className="text-[10px] uppercase font-semibold text-gray-500 bg-red-50 px-1.5 py-0.5 rounded">Medical Facility</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-1.5">{p.address}</p>
                {p.phone_number && (
                  <p className="text-xs text-gray-700 font-medium mb-1">
                    📞 <a href={`tel:${p.phone_number}`} className="text-teal-600 hover:underline">{p.phone_number}</a>
                  </p>
                )}
                {p.capacity && (
                  <p className="text-xs text-gray-500">
                    Beds Capacity: <strong className="text-gray-700">{p.capacity} beds</strong>
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Water Monitoring Stations & CCTV Markers */}
      {waterStationsVisible && waterStations.map((ws, i) => {
        const coords = ws.geometry?.coordinates || ws.coordinates;
        if (!coords || coords.length < 2) return null;
        const position = [coords[1], coords[0]];
        const p = ws.properties || ws;
        return (
          <Marker 
            key={`ws-${p.stationCode || i}`} 
            position={position} 
            icon={waterStationIcon}
            eventHandlers={{
              click: () => {
                if (onWaterStationClick) {
                  onWaterStationClick(p);
                }
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -28]} opacity={0.95}>
              <div className="text-xs font-semibold text-teal-800 p-0.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{p.stationCode}: {p.stationName}</span>
                </div>
                <div className="text-[10px] text-teal-600 font-normal">🎥 Click to open Live CCTV stream</div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}

      {/* Geosocial Interactive Point Clusters */}
      {geosocialPointLayers && Object.entries(geosocialPointLayers).map(([key, pointData]) => {
        if (!pointData || !pointData.features || pointData.features.length === 0) return null;
        const color = pointData.color || '#0284c7';
        return (
          <MarkerClusterGroup
            key={`cluster-${key}`}
            chunkedLoading={true}
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
          >
            {pointData.features.map((feature, i) => {
              const coords = feature.geometry?.coordinates;
              if (!coords || coords.length < 2) return null;
              const pos = [coords[1], coords[0]];
              const props = feature.properties || {};
              const title = props.name || props.type || props.Title || props.Name || pointData.name || 'Point Facility';
              return (
                <CircleMarker
                  key={`pt-${key}-${i}`}
                  center={pos}
                  radius={5}
                  pathOptions={{
                    fillColor: color,
                    color: '#ffffff',
                    weight: 1.5,
                    opacity: 1,
                    fillOpacity: 0.85
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px] max-w-[280px]">
                      <h4 className="font-bold text-xs text-teal-800 border-b pb-1 mb-1">{title}</h4>
                      <div className="max-h-36 overflow-y-auto text-[11px] space-y-0.5 text-gray-600">
                        {Object.entries(props).map(([k, val]) => (
                          <div key={k} className="flex justify-between gap-1">
                            <span className="font-medium text-gray-500 capitalize">{k}:</span>
                            <span className="text-gray-800 text-right truncate">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MarkerClusterGroup>
        );
      })}

      {/* Layer Editor AOI */}
      <FeatureGroup ref={drawnItemsRef}>
        <EditControl 
          onCreated={handleCreated} 
          onDeleted={onAoiCleared} 
          draw={{
            polyline: false, 
            rectangle: false, 
            circle: true, 
            circlemarker: false, 
            marker: true, 
            polygon: true,
          }}
        />
      </FeatureGroup>
    </MapContainer>
  );
}