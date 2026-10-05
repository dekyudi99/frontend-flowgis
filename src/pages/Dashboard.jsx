import React, { useState, useRef, useEffect } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import MapViewer from '../components/Map/MapViewer';
import L from 'leaflet';
import { LayerButton } from '@/components/elements/LayerButton';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import BasemapLayout from '@/components/layouts/BasemapLayout';
import LayerPopup from '@/components/popups/LayerPopup';
import FileUploadPopup from '@/components/popups/FileUploadPopup';
import { useNotification } from '@/context/NotificationContext';
import { isLoggedIn } from '@/services/authService';
import { HomeButton } from '@/components/elements/HomeButton';
import { BasemapButton } from '@/components/elements/BasemapButton';
import { aoiService } from '@/services/aoiService';
import Legend from '@/components/commons/Legend'; 
import PrecipitationChart from '@/components/Charts/PrecipitationCharts';
import StatsDashboard from '@/components/Charts/StatsDashboard';
import { InfoButton } from '@/components/elements/InfoButton';
import Loader from '@/components/commons/Loader';
import { projectService } from '@/services/projectService';
import { facilityService } from '@/services/facilityService';
import WaterStationModal from '@/components/modals/WaterStationModal';
import { geosocialService } from '@/services/geosocialService';
import Navbar from '@/components/sections/Navbar';
import shp from 'shpjs';
import { normalizeBbox } from '@/lib/wmsHelper';

export default function Dashboard() {
  const { activeProject, analysisResult, isNewAnalysis, executeAnalysis, cancelAnalysis, loading, error } = useAnalysis();
  const mapRef = useRef();
  const drawnItemsRef = useRef();
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const [isBasemapOpen, setIsBasemapOpen] = useState(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [selectedBasemapId, setSelectedBasemapId] = useState('osm');
  const { notify, addNotification } = useNotification();
  const [activeTool, setActiveTool] = useState(null);
  const [drawnGeometryData, setDrawnGeometryData] = useState(null);
  const [aoiDisplayText, setAoiDisplayText] = useState('');
  const [selectedAoi, setSelectedAoi] = useState(null);
  const [activeLayers, setActiveLayers] = useState({});
  const [activeLegend, setActiveLegend] = useState(null);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [isAnalysisSaved, setIsAnalysisSaved] = useState(false);
  const [userAnalysisLayers, setUserAnalysisLayers] = useState([]);
  const [activeUserLayers, setActiveUserLayers] = useState({});
  const [selectedComponentLayers, setSelectedComponentLayers] = useState({});
  const [componentSavePending, setComponentSavePending] = useState(false);
  const [userLayerGroups, setUserLayerGroups] = useState([]);
  const [activeUserGroups, setActiveUserGroups] = useState({});
  const [loadingUserLayers, setLoadingUserLayers] = useState(false);
  const userListRequestsRef = useRef({ layers: new Map(), groups: new Map() });
  const userListCacheRef = useRef({ layers: new Map(), groups: null });
  const authGenerationRef = useRef(0);
  const activeProjectIdRef = useRef(activeProject?.id);
  activeProjectIdRef.current = activeProject?.id;
  const [selectedLayerStats, setSelectedLayerStats] = useState(null);
  const [chartPos, setChartPos] = useState({ x: 0, y: 0 });
  const isDraggingChartRef = useRef(false);
  const chartDragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Facility Data States
  const [hospitalsData, setHospitalsData] = useState([]);
  const [waterStationsData, setWaterStationsData] = useState([]);
  const [selectedWaterStation, setSelectedWaterStation] = useState(null);
  const [isWaterStationModalOpen, setIsWaterStationModalOpen] = useState(false);

  // Geosocial Map Layers States
  const [geosocialList, setGeosocialList] = useState([]);
  const [visibleGeosocial, setVisibleGeosocial] = useState({});
  const [activeGeosocialWms, setActiveGeosocialWms] = useState({});
  const [activeGeosocialPoints, setActiveGeosocialPoints] = useState({});

  // Load Hospitals when layer is toggled on
  useEffect(() => {
    if (activeLayers['hospital'] && hospitalsData.length === 0) {
      facilityService.getHospitals()
        .then((res) => {
          if (res && res.features) {
            setHospitalsData(res.features);
          }
        })
        .catch((err) => console.error("Failed to load hospitals:", err));
    }
  }, [activeLayers['hospital'], hospitalsData.length]);

  // Load Water Stations when layer is toggled on
  useEffect(() => {
    if (activeLayers['water_station'] && waterStationsData.length === 0) {
      facilityService.getWaterStations()
        .then((res) => {
          if (res && res.features) {
            setWaterStationsData(res.features);
          }
        })
        .catch((err) => console.error("Failed to load water stations:", err));
    }
  }, [activeLayers['water_station'], waterStationsData.length]);

  const handleChartMouseDown = (e) => {
    if (e.target.closest('button')) return;
    isDraggingChartRef.current = true;
    chartDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: chartPos.x,
      initY: chartPos.y,
    };

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingChartRef.current) return;
      const dx = moveEvent.clientX - chartDragStartRef.current.startX;
      const dy = moveEvent.clientY - chartDragStartRef.current.startY;
      setChartPos({
        x: chartDragStartRef.current.initX + dx,
        y: chartDragStartRef.current.initY + dy,
      });
    };

    const handleMouseUp = () => {
      isDraggingChartRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const [legendPos, setLegendPos] = useState({ x: 0, y: 0 });
  const isDraggingLegendRef = useRef(false);
  const legendDragStartRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  const handleLegendMouseDown = (e) => {
    if (e.target.closest('button')) return;
    isDraggingLegendRef.current = true;
    legendDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: legendPos.x,
      initY: legendPos.y,
    };

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingLegendRef.current) return;
      const dx = moveEvent.clientX - legendDragStartRef.current.startX;
      const dy = moveEvent.clientY - legendDragStartRef.current.startY;
      setLegendPos({
        x: legendDragStartRef.current.initX + dx,
        y: legendDragStartRef.current.initY + dy,
      });
    };

    const handleMouseUp = () => {
      isDraggingLegendRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  
  const resultData = analysisResult?.data || analysisResult;
  const availableMaps = resultData?.maps || {};
  const availableLegends = resultData?.legends || {};
  const statisticsData = resultData?.statistics || null;

  const resolveLayerLegend = (layer, fallbackLegends = {}) => {
    if (!layer && !fallbackLegends) return null;
    const legends = layer?.metadata?.legends || layer?.legends || fallbackLegends;
    if (!legends || typeof legends !== 'object') return null;

    const analysisType = (layer?.metadata?.analysis_type || '').toLowerCase();
    const name = (layer?.layer_name || layer?.name || '').toLowerCase();

    if (analysisType === 'flood_risk' || name.includes('flood risk') || name.includes('risiko banjir') || legends.FloodRisk) {
      if (legends.FloodRisk) return legends.FloodRisk;
    }
    if (analysisType === 'flood_event' || name.includes('flood event') || name.includes('kejadian banjir') || legends.FloodEvent || legends.NewFloodedArea) {
      return legends.FloodEvent || legends.NewFloodedArea || null;
    }
    if (analysisType === 'rainfall' || analysisType.includes('rainfall') || name.includes('rainfall') || name.includes('curah hujan') || name.includes('precipitation') || legends.Rainfall || legends.DailyPrecipitation) {
      return legends.Rainfall || legends.DailyPrecipitation || null;
    }
    if (analysisType.includes('elevation') || name.includes('elevation') || legends.Elevation) {
      if (legends.Elevation) return legends.Elevation;
    }
    if (analysisType.includes('distance') || name.includes('distance') || legends.Distance) {
      if (legends.Distance) return legends.Distance;
    }
    if (analysisType.includes('tpi') || name.includes('tpi') || legends.TPI) {
      if (legends.TPI) return legends.TPI;
    }
    if (analysisType.includes('ndvi') || name.includes('ndvi') || legends.NDVI) {
      if (legends.NDVI) return legends.NDVI;
    }
    if (analysisType.includes('ndwi') || name.includes('ndwi') || legends.NDWI) {
      if (legends.NDWI) return legends.NDWI;
    }

    return legends.FloodRisk || legends.FloodEvent || legends.Rainfall || Object.values(legends)[0] || null;
  };

  useEffect(() => {
    const data = analysisResult?.data || analysisResult;
    if (!data) return; 

    const loadedMaps = data.maps || {};
    const loadedLegends = data.legends || {};
    const loadedAoi = data.aoi || null;

    if (loadedAoi && drawnItemsRef.current) {
        drawnItemsRef.current.clearLayers();
        
        try {
            const geoJsonLayer = L.geoJSON(loadedAoi, {
                style: { color: '#0d9488', weight: 2, fillOpacity: 0.2 }
            });
            geoJsonLayer.eachLayer((layer) => {
                drawnItemsRef.current.addLayer(layer);
            });

            if (mapRef.current) {
                mapRef.current.fitBounds(geoJsonLayer.getBounds());
            }

            let rawCoordinates = [];
            if (loadedAoi.type === 'Polygon') {
                rawCoordinates = loadedAoi.coordinates;
            } else if (loadedAoi.type === 'MultiPolygon') {
                rawCoordinates = loadedAoi.coordinates[0];
            }

            setDrawnGeometryData({
                type: 'polygon', 
                geometry: rawCoordinates 
            });

            if (rawCoordinates && rawCoordinates[0]) {
                const coordStrings = rawCoordinates[0].slice(0, 3).map(p => `[${p[1].toFixed(5)}, ${p[0].toFixed(5)}]`);
                setAoiDisplayText(`Type: Polygon (History)\nPoints:\n${coordStrings.join('\n')}\n... (+ other points)`);
            }
        } catch (error) {
            console.error("Failed to redraw AOI from history:", error);
        }
    }

    // Kasus 1: WMS Layer dari AstraGIS (Layer yang sudah tersimpan di GeoServer)
    if (data.wms_layer) {
      const wmsLayer = {
        ...data.wms_layer,
        _v: data.wms_layer.updated_at || data.wms_layer._v || new Date().toISOString()
      };
      setIsAnalysisSaved(true);
      setSelectedComponentLayers({});
      setComponentSavePending(false);
      // Keep the saved WMS available in Analysis Results without activating it.
      setActiveLayers({});
      setActiveUserLayers({});

      // Tambahkan ke list userAnalysisLayers
      setUserAnalysisLayers((prev) => {
        const filtered = prev.filter((l) => l.id !== wmsLayer.id);
        return [wmsLayer, ...filtered];
      });

      // Otomatis arahkan map ke batas (bbox) hasil analisis WMS
      if (wmsLayer.bbox && mapRef.current) {
        const bounds = normalizeBbox(wmsLayer.bbox);
        if (bounds) {
          mapRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
        }
      }

      const stats = wmsLayer.metadata?.statistics || wmsLayer.statistics || data.statistics;
      if (stats && Object.keys(stats).length > 0) {
        setSelectedLayerStats(stats);
      }
      if (isNewAnalysis) {
        setIsChartOpen(true);
      }
    }
    // Kasus 2: Hasil Cepat Langsung dari GEE (Direct XYZ Tiles & Statistics)
    else if (loadedMaps && Object.keys(loadedMaps).length > 0) {
      setIsAnalysisSaved(Boolean(data.is_saved));
      const componentNames = ['Rainfall', 'Elevation', 'Distance', 'TPI', 'NDVI', 'NDWI'];
      const componentPreviews = Object.fromEntries(
        Object.entries(loadedMaps).filter(([key, url]) =>
          componentNames.some((name) => name.toLowerCase() === key.toLowerCase())
          && typeof url === 'string'
          && url.startsWith('http')
        )
      );

      const hasComponentPreviews = componentNames.some((name) =>
        Object.keys(componentPreviews).some((key) => key.toLowerCase() === name.toLowerCase())
      );

      if (isNewAnalysis && hasComponentPreviews) {
        // Show the main FloodRisk preview immediately; component previews remain checkbox-controlled.
        setSelectedComponentLayers({});
        setComponentSavePending(false);
        const floodRiskUrl = loadedMaps.FloodRisk;
        setActiveLayers(
          typeof floodRiskUrl === 'string' && floodRiskUrl.startsWith('http')
            ? { FloodRisk: floodRiskUrl }
            : {}
        );
        setActiveUserLayers({});
        if (loadedLegends.FloodRisk) setActiveLegend(loadedLegends.FloodRisk);
        setIsChartOpen(true);
      }

      let activeMapKey = null;
      let activeMapObj = null;
      let legObj = null;

      if (loadedMaps.FloodRisk) {
        activeMapKey = 'FloodRisk';
        activeMapObj = loadedMaps.FloodRisk;
        legObj = loadedLegends.FloodRisk;
      } else if (loadedMaps.NewFloodedArea) {
        activeMapKey = 'NewFloodedArea';
        activeMapObj = loadedMaps.NewFloodedArea;
        legObj = loadedLegends.FloodEvent;
      } else if (loadedMaps.DailyPrecipitation) {
        activeMapKey = 'DailyPrecipitation';
        activeMapObj = loadedMaps.DailyPrecipitation;
        legObj = loadedLegends.Rainfall;
      } else {
        const firstKey = Object.keys(loadedMaps)[0];
        activeMapKey = firstKey;
        activeMapObj = loadedMaps[firstKey];
        legObj = loadedLegends[firstKey] || Object.values(loadedLegends)[0];
      }

      if (activeMapKey && activeMapObj) {
        // Keep displaying FloodRisk after Run, even when component previews are also available.
        if (isNewAnalysis && !hasComponentPreviews) {
          setActiveLayers({ [activeMapKey]: activeMapObj });
          if (legObj) setActiveLegend(legObj);
          setIsChartOpen(true);
        } else if (!isNewAnalysis) {
          setActiveLayers({});
        }

        // Set data statistik agar data summary tetap terbaca
        const stats = data.statistics || {};
        if (stats && Object.keys(stats).length > 0) {
          setSelectedLayerStats(stats);
        }
      }
    }
  }, [analysisResult, isNewAnalysis]);

  // Reset semua layer dan status ketika project berganti atau kembali ke daftar project
  useEffect(() => {
    // 1. Matikan semua layer aktif dari project sebelumnya
    setActiveLayers({});
    setActiveUserLayers({});
    setActiveUserGroups({});
    setActiveGeosocialWms({});
    setActiveGeosocialPoints({});
    
    // 2. Bersihkan visualisasi & status simpan
    setIsChartOpen(false);
    setSelectedLayerStats(null);
    setActiveLegend(null);
    setActiveTool(null);
    setIsAnalysisSaved(false);
    setSelectedComponentLayers({});
    setComponentSavePending(false);
    
    // 3. Bersihkan AOI dan gambar di peta
    setAoiDisplayText('');
    setDrawnGeometryData(null);
    setSelectedAoi(null);
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }

    // Clear previous project lists; the dedicated loader effect fetches the active project's lists once.
    setUserAnalysisLayers([]);
    setUserLayerGroups([]);
    setLoadingUserLayers(false);
  }, [activeProject?.id]); 
  
  useEffect(() => {
    if (error) {
      notify.error(error);
    }
  }, [error]);

  const handleProjectCreated = (project) => {
    // Proyek baru telah dinotifikasi di SidebarLayout
  };

  const handleFileUploadSubmit = async (file) => {
    if (!isLoggedIn()) {
      notify.error("Silakan login terlebih dahulu sebelum mengunggah file!");
      setIsFileUploadOpen(false);
      return;
    }

    if (!activeProject) {
      notify.error("Silakan pilih atau buat proyek terlebih dahulu di Sidebar sebelum mengunggah file!");
      setIsFileUploadOpen(false);
      return;
    }

    // Langsung tutup popup form upload agar tidak menghalangi layar
    setIsFileUploadOpen(false);
    setIsUploading(true);
    setUploadProgress(15);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', activeProject.id); 
      formData.append('name', file.name.split('.')[0]); 
      
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'zip') formData.append('source_type', 'upload_shp');
      else if (ext === 'kml' || ext === 'xml') formData.append('source_type', 'upload_kml');
      else formData.append('source_type', 'upload_geojson');

      // Ekstraksi geometri client-side untuk format SHP (ZIP) dan GeoJSON
      if (ext === 'zip') {
        try {
          setUploadProgress(25);
          const arrayBuffer = await file.arrayBuffer();
          const geojsonData = await shp(arrayBuffer);
          const fc = Array.isArray(geojsonData) ? geojsonData[0] : geojsonData;
          if (fc && fc.features && fc.features.length > 0) {
            let geometryToSend = null;
            if (fc.features.length === 1) {
              geometryToSend = fc.features[0].geometry;
            } else {
              const isAllPolygons = fc.features.every(f => f.geometry?.type === 'Polygon');
              if (isAllPolygons) {
                geometryToSend = {
                  type: 'MultiPolygon',
                  coordinates: fc.features.map(f => f.geometry.coordinates)
                };
              } else {
                geometryToSend = fc.features[0].geometry;
              }
            }
            if (geometryToSend) {
              formData.append('geometry', JSON.stringify(geometryToSend));
            }
            if (fc.features[0].properties && Object.keys(fc.features[0].properties).length > 0) {
              formData.append('metadata', JSON.stringify(fc.features[0].properties));
            }
          }
        } catch (shpErr) {
          console.warn("Client-side shpjs parsing notice:", shpErr);
        }
      } else if (ext === 'json' || ext === 'geojson') {
        try {
          setUploadProgress(25);
          const text = await file.text();
          const parsed = JSON.parse(text);
          const geom = parsed.geometry || (parsed.features && parsed.features[0] && parsed.features[0].geometry) || parsed;
          if (geom) {
            formData.append('geometry', JSON.stringify(geom));
            const props = (parsed.features && parsed.features[0] && parsed.features[0].properties) || {};
            if (Object.keys(props).length > 0) {
              formData.append('metadata', JSON.stringify(props));
            }
          }
        } catch (jsonErr) {
          console.warn("Client-side GeoJSON parsing notice:", jsonErr);
        }
      }

      setUploadProgress(35);

      const response = await aoiService.createAoi(formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const ratio = progressEvent.loaded / progressEvent.total;
            const percent = Math.round(35 + ratio * 60);
            setUploadProgress(percent);
          }
        }
      });
      setUploadProgress(100);
      const savedAoi = response.data?.data || response.data;

      if (savedAoi && savedAoi.geometry) {
          if (drawnItemsRef.current) drawnItemsRef.current.clearLayers();
          setActiveLayers({});
          setActiveLegend(null);
          setIsChartOpen(false);

          const geoJsonLayer = L.geoJSON(savedAoi.geometry, {
              style: { color: '#0d9488', weight: 2, fillOpacity: 0.2 }
          });
          geoJsonLayer.eachLayer((layer) => {
              drawnItemsRef.current.addLayer(layer);
          });
          if (mapRef.current) {
              mapRef.current.fitBounds(geoJsonLayer.getBounds());
          }

          let rawCoordinates = [];
          if (savedAoi.geometry.type === 'Polygon') {
              rawCoordinates = savedAoi.geometry.coordinates;
          } else if (savedAoi.geometry.type === 'MultiPolygon') {
              rawCoordinates = savedAoi.geometry.coordinates[0]; 
          } else {
              rawCoordinates = savedAoi.geometry.coordinates;
          }

          setDrawnGeometryData({
              type: 'polygon', 
              geometry: rawCoordinates 
          });
      }
      
      setAoiDisplayText(`Type: Uploaded File\nFile Name: ${file.name}\nExtension: ${ext.toUpperCase()}`);
      addNotification('success', `File ${file.name} uploaded successfully!`);
      setIsFileUploadOpen(false);
      
    } catch (error) {
      console.error("Upload error:", error);
      const errMsg = error.response?.data?.message || 'Failed to upload file.';
      addNotification('error', errMsg);
    } finally {
      setIsUploading(false); 
    }
  };

  const handleSelectSavedAoi = (aoi) => {
    setSelectedAoi(aoi);

    if (!aoi) {
      setAoiDisplayText('');
      setDrawnGeometryData(null);
      return;
    }

    let geom = aoi.geometry;
    if (typeof geom === 'string') {
      try { 
        geom = JSON.parse(geom); 
      } catch (e) { 
        console.error("Failed to parse geometry:", e); 
      }
    }

    if (geom) {
      let rawCoordinates = geom.coordinates || geom;
      let rawType = (geom.type || 'polygon').toLowerCase();

      if (rawType === 'multipolygon' && Array.isArray(rawCoordinates)) {
        rawCoordinates = rawCoordinates[0]; 
        rawType = 'polygon';
      }

      setDrawnGeometryData({
        type: rawType,
        geometry: rawCoordinates
      });

      const points = Array.isArray(rawCoordinates[0]) ? rawCoordinates[0] : rawCoordinates;
      setAoiDisplayText(`Name: ${aoi.name}\nType: ${rawType.toUpperCase()}\nTotal Points: ${points.length}`);
    }
  };

  const handleGeometryComplete = (data, layer) => {
    if (drawnItemsRef.current && layer) {
      drawnItemsRef.current.clearLayers();
      drawnItemsRef.current.addLayer(layer);
    }
    
    setDrawnGeometryData(data);
    setActiveTool(null); 

    let text = '';
    if (data.type === 'polygon' || data.type === 'rectangle') {
      const coords = data.geometry[0]; 
      if (coords) {
        const coordStrings = coords.map(p => `[${p[1].toFixed(5)}, ${p[0].toFixed(5)}]`);
        text = `Type: Polygon\nPoints:\n${coordStrings.join('\n')}`;
      }
    } else if (data.type === 'point') {
      text = `Type: Point\nCoordinates:\n[${data.geometry[1].toFixed(5)}, ${data.geometry[0].toFixed(5)}]`;
    } else if (data.type === 'circle') {
      text = `Type: Circle\nCenter Point: [${data.geometry.coordinates[1].toFixed(5)}, ${data.geometry.coordinates[0].toFixed(5)}]\nRadius: ${data.geometry.radius.toFixed(2)} meters`;
    }
    setAoiDisplayText(text); 
    addNotification('info', `Area of Interest (${data.type}) created successfully!`);
  };

  const handleClearAoi = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }
    setSelectedAoi(null);
    setDrawnGeometryData(null);
    setActiveTool(null);
    setAoiDisplayText('');
    
    setActiveLayers({});
    setActiveLegend(null);
    setIsChartOpen(false);
  };

  const handleDelete = () => {
    handleClearAoi();
    addNotification('info', 'All drawings and areas have been cleared.');
  };

  const handleDrawPolygon = () => {
    setActiveTool('polygon');
    if (mapRef.current) {
      new L.Draw.Polygon(mapRef.current, {
        allowIntersection: false,
        shapeOptions: { color: '#0d9488' }
      }).enable();
    }
  };

  const handleInsertPoint = () => {
    setActiveTool('point');
    if (mapRef.current) {
      new L.Draw.Marker(mapRef.current).enable();
    }
  };

  const handleDrawCircle = () => {
    setActiveTool('circle');
    if (mapRef.current) {
      new L.Draw.Circle(mapRef.current, {
        shapeOptions: { color: '#0d9488' }
      }).enable();
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleLayerToggle = (layerName, isChecked) => {
    setActiveLayers(prev => {
        const newLayers = { ...prev };
        
        const tileUrl = availableMaps[layerName] || getStaticLayerUrl(layerName) || (typeof isChecked === 'string' ? isChecked : null);

        if (isChecked && typeof tileUrl === 'string' && tileUrl.startsWith('http')) {
            newLayers[layerName] = tileUrl;
        } else {
            delete newLayers[layerName];
        }

        const activeLayerNames = Object.keys(newLayers);
        if (activeLayerNames.length > 0) {
            const topLayerName = activeLayerNames[activeLayerNames.length - 1];
            
            if (availableLegends[topLayerName]) {
                setActiveLegend(availableLegends[topLayerName]);
            } else if (availableLegends.FloodEvent) {
                setActiveLegend(availableLegends.FloodEvent);
            } else {
                if (!availableLegends[topLayerName] && topLayerName === 'province' || topLayerName === 'district') {
                    setActiveLegend(null); 
                }
            }
        } else {
            setActiveLegend(null);
        }

        return newLayers;
    });
  };

  const getStaticLayerUrl = (layerName) => {
    const staticMap = {
      'province': null, 
      'district': null,
      'hospital': null,
      'water_station': null,
      'river_thailand': null,
      'urban_thailand': null,
    };
    return staticMap[layerName] || null;
  };

  // Muat histori layer analisis pengguna dari AstraGIS via backend (khusus milik pengguna saat ini dan project saat ini)
  const loadUserAnalysisLayers = async (projectId = null, force = false) => {
    const targetProjectId = projectId || activeProject?.id;
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token || !targetProjectId) {
      setUserAnalysisLayers([]);
      return [];
    }

    const requestKey = String(targetProjectId);
    const cached = userListCacheRef.current.layers.get(requestKey);
    if (cached && !force) {
      if (String(activeProject?.id) === requestKey) setUserAnalysisLayers(cached);
      return cached;
    }
    const pending = userListRequestsRef.current.layers.get(requestKey);
    if (pending) return pending;
    if (force) userListCacheRef.current.layers.delete(requestKey);

    const authGeneration = authGenerationRef.current;
    const request = (async () => {
      if (String(activeProjectIdRef.current) === requestKey) setLoadingUserLayers(true);
      try {
        const response = await projectService.getUserLayers(targetProjectId);
        const list = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : null);
        if (!list) throw new Error('Invalid analysis-layer list response.');

        const normalized = list.map((layer) => ({
          ...layer,
          _v: layer.updated_at || layer._v || layer.created_at || Date.now(),
        }));
        const filtered = normalized.filter((layer) => {
          const projectOwner = layer.flowgis_project_id
            || layer.metadata?.flowgis_project_id
            || layer.project_id
            || layer.metadata?.project_id;
          return projectOwner !== undefined && String(projectOwner) === requestKey;
        });
        userListCacheRef.current.layers.set(requestKey, filtered);
        if (authGeneration === authGenerationRef.current && String(activeProjectIdRef.current) === requestKey) {
          setUserAnalysisLayers(filtered);
        }
        return filtered;
      } catch (error) {
        if (error.response?.status !== 401) console.error('Gagal memuat layer analisis pengguna:', error);
        return [];
      } finally {
        if (userListRequestsRef.current.layers.get(requestKey) === request) {
          userListRequestsRef.current.layers.delete(requestKey);
        }
        if (authGeneration === authGenerationRef.current && String(activeProjectIdRef.current) === requestKey) {
          setLoadingUserLayers(false);
        }
      }
    })();

    userListRequestsRef.current.layers.set(requestKey, request);
    return request;
  };

  const loadUserLayerGroups = async (force = false) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) {
      setUserLayerGroups([]);
      return [];
    }
    if (userListCacheRef.current.groups !== null && !force) {
      setUserLayerGroups(userListCacheRef.current.groups);
      return userListCacheRef.current.groups;
    }

    const requestKey = 'current-user';
    const currentRequest = userListRequestsRef.current.groups.get(requestKey);
    if (currentRequest) return currentRequest;
    if (force) userListCacheRef.current.groups = null;

    const authGeneration = authGenerationRef.current;
    const request = (async () => {
      try {
        const response = await projectService.getUserLayerGroups();
        const list = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : null);
        if (!list) throw new Error('Invalid layer-group list response.');

        userListCacheRef.current.groups = list;
        if (authGeneration === authGenerationRef.current) setUserLayerGroups(list);
        return list;
      } catch (error) {
        if (error.response?.status !== 401) console.error('Gagal memuat layer group pengguna:', error);
        return [];
      } finally {
        if (userListRequestsRef.current.groups.get(requestKey) === request) {
          userListRequestsRef.current.groups.delete(requestKey);
        }
      }
    })();

    userListRequestsRef.current.groups.set(requestKey, request);
    return request;
  };
  // Muat layer geosocial dari backend (WMS & Vector)
  const loadGeosocialLayers = async () => {
    try {
      const data = await geosocialService.getLayers();
      if (Array.isArray(data)) {
        setGeosocialList(data);
      }
    } catch (err) {
      console.error("Gagal memuat daftar layer Geosocial:", err);
    }
  };

  useEffect(() => {
    if (activeProject?.id) {
      loadUserAnalysisLayers(activeProject.id);
      loadUserLayerGroups();
    }
    loadGeosocialLayers();

    // Dengarkan sinyal auth-change (login / logout / ganti akun)
    const handleAuthChange = () => {
      authGenerationRef.current += 1;
      userListCacheRef.current.layers.clear();
      userListCacheRef.current.groups = null;
      userListRequestsRef.current.layers.clear();
      userListRequestsRef.current.groups.clear();
      if (activeProject?.id) {
        loadUserAnalysisLayers(activeProject.id);
        loadUserLayerGroups();
      } else {
        setUserAnalysisLayers([]);
        setUserLayerGroups([]);
      }
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [activeProject?.id]);

  const isGeosocialWmsLayer = (layer) => {
    if (!layer) return false;
    if (layer.type === 'wms') return true;
    if (layer.url && (layer.url.includes('/wms') || layer.url.includes('/geoserver/'))) return true;
    if (layer.layer_name && (layer.layer_name.includes(':') || layer.layer_name.startsWith('ws_'))) return true;
    return false;
  };

  const handleGeosocialToggle = async (layerId, isChecked) => {
    const layer = geosocialList.find((l) => l.id === layerId);
    if (!layer) return;

    setVisibleGeosocial((prev) => {
      const next = { ...prev };
      if (isChecked) {
        next[layerId] = true;
      } else {
        delete next[layerId];
      }
      return next;
    });

    const isWms = isGeosocialWmsLayer(layer);

    if (isWms) {
      setActiveGeosocialWms((prev) => {
        const next = { ...prev };
        if (isChecked) {
          next[layer.id] = {
            id: `geosocial_${layer.id}`,
            name: layer.display_name,
            wms_url: layer.url || import.meta.env.VITE_GEOSERVER_WMS_URL || 'http://localhost:8080/geoserver/wms',
            wms_layers_param: layer.layer_name,
            opacity: 0.85,
          };
        } else {
          delete next[layer.id];
        }
        return next;
      });
    } else if (layer.type === 'vector') {
      if (isChecked) {
        try {
          const pointGeoJson = await geosocialService.getPointData(layer.layer_name);
          setActiveGeosocialPoints((prev) => ({
            ...prev,
            [layer.layer_name]: {
              name: layer.display_name,
              color: layer.legend_url || '#0284c7',
              features: pointGeoJson?.features || [],
            },
          }));
        } catch (err) {
          console.error(`Gagal memuat data titik geosocial ${layer.layer_name}:`, err);
          addNotification('error', `Gagal memuat titik ${layer.display_name}`);
        }
      } else {
        setActiveGeosocialPoints((prev) => {
          const next = { ...prev };
          delete next[layer.layer_name];
          return next;
        });
      }
    }
  };

  const handleGeosocialToggleAll = async (isChecked) => {
    if (!isChecked) {
      setVisibleGeosocial({});
      setActiveGeosocialWms({});
      setActiveGeosocialPoints({});
      return;
    }

    const nextVisible = {};
    const nextWms = {};
    const vectorLayersToFetch = [];

    geosocialList.forEach((layer) => {
      nextVisible[layer.id] = true;
      if (isGeosocialWmsLayer(layer)) {
        nextWms[layer.id] = {
          id: `geosocial_${layer.id}`,
          name: layer.display_name,
          wms_url: layer.url || import.meta.env.VITE_GEOSERVER_WMS_URL || 'http://localhost:8080/geoserver/wms',
          wms_layers_param: layer.layer_name,
          opacity: 0.85,
        };
      } else if (layer.type === 'vector') {
        vectorLayersToFetch.push(layer);
      }
    });

    setVisibleGeosocial(nextVisible);
    setActiveGeosocialWms(nextWms);

    if (vectorLayersToFetch.length > 0) {
      try {
        const results = await Promise.all(
          vectorLayersToFetch.map(async (layer) => {
            try {
              const data = await geosocialService.getPointData(layer.layer_name);
              return { layer, data };
            } catch (e) {
              return { layer, data: null };
            }
          })
        );

        setActiveGeosocialPoints((prev) => {
          const nextPoints = { ...prev };
          results.forEach(({ layer, data }) => {
            if (data?.features) {
              nextPoints[layer.layer_name] = {
                name: layer.display_name,
                color: layer.legend_url || '#0284c7',
                features: data.features,
              };
            }
          });
          return nextPoints;
        });
      } catch (err) {
        console.error("Gagal memuat layer titik Geosocial:", err);
      }
    }
  };

  const handleUserLayerToggle = (layer, isChecked) => {
    setActiveUserLayers((prev) => {
      const updated = { ...prev };
      if (isChecked) {
        updated[layer.id] = layer;
        const mainLeg = resolveLayerLegend(layer);
        if (mainLeg) setActiveLegend(mainLeg);

        // Ekstrak data statistik layer untuk visualisasi
        const stats = layer?.metadata?.statistics || layer?.statistics;
        if (stats && Object.keys(stats).length > 0) {
          setSelectedLayerStats(stats);
          setIsChartOpen(true);
        }
      } else {
        delete updated[layer.id];
        const remaining = Object.values(updated);
        if (remaining.length > 0) {
          const nextLayer = remaining[remaining.length - 1];
          const nextLeg = resolveLayerLegend(nextLayer);
          if (nextLeg) setActiveLegend(nextLeg);
          const nextStats = nextLayer?.metadata?.statistics || nextLayer?.statistics;
          if (nextStats) {
            setSelectedLayerStats(nextStats);
          }
        } else {
          setActiveLegend(null);
          setIsChartOpen(false);
        }
      }
      return updated;
    });
  };

  const handleUserLayerToggleAll = (isChecked) => {
    if (isChecked) {
      const allActive = {};
      userAnalysisLayers.forEach((layer) => {
        allActive[layer.id] = layer;
      });
      setActiveUserLayers(allActive);
      if (userAnalysisLayers.length > 0) {
        const firstLeg = resolveLayerLegend(userAnalysisLayers[0]);
        if (firstLeg) setActiveLegend(firstLeg);
      }
    } else {
      setActiveUserLayers({});
      setActiveLegend(null);
      setIsChartOpen(false);
    }
  };

  const handleZoomToUserLayer = (layer) => {
    if (!mapRef.current || !layer.bbox) return;
    try {
      const bounds = normalizeBbox(layer.bbox);
      if (bounds) {
        mapRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
      }
    } catch (e) {
      console.error("Error zooming to user layer:", e);
    }
  };

  // Handlers untuk Layer Group
  const handleUserGroupToggle = (group, isChecked) => {
    setActiveUserGroups((prev) => {
      const updated = { ...prev };
      if (isChecked) {
        updated[group.id] = group;

        // Ambil legenda dan statistik dari layer teratas group
        const firstMemberId = group.layers?.[0]?.id;
        const memberLayer = userAnalysisLayers.find(l => l.id === firstMemberId);
        if (memberLayer) {
          const leg = resolveLayerLegend(memberLayer);
          if (leg) setActiveLegend(leg);
          const stats = memberLayer.metadata?.statistics || memberLayer.statistics;
          if (stats) {
            setSelectedLayerStats(stats);
            setIsChartOpen(true);
          }
        }
      } else {
        delete updated[group.id];
        const remainingLayers = Object.values(activeUserLayers);
        if (remainingLayers.length > 0) {
          const nextLeg = resolveLayerLegend(remainingLayers[remainingLayers.length - 1]);
          if (nextLeg) setActiveLegend(nextLeg);
        } else {
          setActiveLegend(null);
        }
      }
      return updated;
    });
  };

  const handleZoomToUserGroup = (group) => {
    if (!mapRef.current || !group.bbox) return;
    try {
      const [minx, miny, maxx, maxy] = group.bbox;
      mapRef.current.fitBounds([
        [miny, minx],
        [maxy, maxx],
      ], { padding: [40, 40], animate: true });
    } catch (e) {
      console.error("Error zooming to group bbox:", e);
    }
  };

  const handleCreateUserGroup = async (groupData) => {
    const res = await projectService.createUserLayerGroup(groupData);
    userListCacheRef.current.groups = null;
    addNotification('success', `Layer Group "${groupData.title}" created successfully!`);
    await loadUserLayerGroups(true);
    return res;
  };

  const handleDeleteUserGroup = async (groupId) => {
    try {
      await projectService.deleteUserLayerGroup(groupId);
      userListCacheRef.current.groups = null;
      addNotification('info', 'Layer Group deleted successfully.');
      setActiveUserGroups((prev) => {
        const updated = { ...prev };
        delete updated[groupId];
        return updated;
      });
      await loadUserLayerGroups(true);
    } catch (err) {
      console.error("Failed to delete layer group:", err);
      addNotification('error', 'Failed to delete layer group.');
    }
  };

  const handleUpdateUserGroup = async (groupId, groupData) => {
    try {
      const res = await projectService.updateUserLayerGroup(groupId, groupData);
      userListCacheRef.current.groups = null;
      addNotification('success', `Layer Group "${groupData.title}" updated successfully!`);
      const updatedGroups = await loadUserLayerGroups(true);
      const freshGroup = updatedGroups?.find((g) => g.id === groupId) || res?.data;

      // Auto-refresh instantly on map using cache buster _t
      setActiveUserGroups((prev) => {
        if (prev[groupId]) {
          return {
            ...prev,
            [groupId]: {
              ...(freshGroup || prev[groupId]),
              _t: Date.now(),
            },
          };
        }
        return prev;
      });

      // Update legend and visualization if group is active
      if (freshGroup?.layers && freshGroup.layers.length > 0) {
        const topLayerId = freshGroup.layers[0].id;
        const topLayer = userAnalysisLayers.find((l) => l.id === topLayerId);
        if (topLayer) {
          const leg = resolveLayerLegend(topLayer);
          if (leg) setActiveLegend(leg);
          const stats = topLayer.metadata?.statistics || topLayer.statistics;
          if (stats) setSelectedLayerStats(stats);
        }
      }
    } catch (err) {
      console.error("Failed to update layer group:", err);
      addNotification('error', 'Failed to update layer group.');
      throw err;
    }
  };

  const handleDeleteUserLayer = async (layerId) => {
    try {
      await projectService.deleteUserLayer(layerId);
      userListCacheRef.current.layers.delete(String(activeProject?.id));
      userListCacheRef.current.groups = null;
      addNotification('info', 'Analysis result deleted successfully.');
      setActiveUserLayers((prev) => {
        const updated = { ...prev };
        delete updated[layerId];
        return updated;
      });
      setUserAnalysisLayers((prev) => prev.filter((l) => l.id !== layerId));
      await loadUserAnalysisLayers(activeProject?.id, true);
      await loadUserLayerGroups(true);
    } catch (err) {
      console.error("Failed to delete analysis layer:", err);
      addNotification('error', 'Failed to delete analysis layer.');
    }
  };

  // Helper untuk mengecek apakah layer cocok dengan AOI yang sedang aktif di peta
  const isLayerMatchesCurrentAoi = (layer) => {
    if (!layer) return false;
    const meta = layer.metadata || {};
    const title = (layer.layer_name || layer.title || layer.name || '').toLowerCase();
    const layerAoiId = meta.aoi_id || meta.extra?.aoi_id;

    // 1. Jika pengguna sedang memilih Saved AOI (dari dropdown / list AOI)
    if (selectedAoi?.id) {
      if (layerAoiId && String(layerAoiId) === String(selectedAoi.id)) {
        return true;
      }
      if (selectedAoi.name && title.includes(selectedAoi.name.toLowerCase())) {
        return true;
      }
      if (layerAoiId && String(layerAoiId) !== String(selectedAoi.id)) {
        return false;
      }
    }

    // 2. Jika pengguna sedang menggambar poligon manual baru
    const layerGeom = meta.geometry || meta.extra?.geometry;
    if (drawnGeometryData?.geometry && layerGeom) {
      try {
        const metaGeom = typeof layerGeom === 'string' ? JSON.parse(layerGeom) : layerGeom;
        if (JSON.stringify(drawnGeometryData.geometry) === JSON.stringify(metaGeom)) {
          return true;
        }
      } catch (e) {}
      if (layerAoiId && !selectedAoi) {
        return false;
      }
    }

    if (!selectedAoi && !drawnGeometryData) {
      return true;
    }

    return false;
  };

  // Helper cerdas: mencari apakah ada layer yang SUDAH TERSIMPAN di proyek
  // yang memiliki tipe/komponen yang sama, AOI yang sama, DAN rentang waktu yang sama
  const findMatchingSavedLayer = (typeOrComp, targetAoi, startDate, endDate, weights = null) => {
    if (!userAnalysisLayers || userAnalysisLayers.length === 0) return null;
    const searchKey = (typeOrComp || '').toLowerCase().replace('component_', '');

    return userAnalysisLayers.find((layer) => {
      const meta = layer.metadata || {};
      const layerParams = meta.parameters || meta.extra?.parameters || meta.statistics?.parameters || {};
      const title = (layer.layer_name || layer.title || layer.name || '').toLowerCase();
      const metaType = (meta.analysis_type || '').toLowerCase();
      const metaComp = (meta.component || '').toLowerCase();

      // 1. Cek kecocokan tipe / komponen analisis
      let matchesType = false;
      if (searchKey === 'flood_risk' || searchKey === 'risk') {
        matchesType = metaType === 'flood_risk' || metaComp === 'flood_risk' || (title.includes('flood risk') && !title.includes('component'));
      } else if (searchKey === 'flood_event' || searchKey === 'event') {
        matchesType = metaType === 'flood_event' || title.includes('flood event');
      } else if (searchKey === 'rainfall' && !metaType.includes('component')) {
        matchesType = metaType === 'rainfall' || metaComp === 'rainfall' || (title.includes('rainfall') && !metaType.includes('component_'));
      } else {
        // Komponen spesifik: rainfall, elevation, distance, tpi, ndvi, ndwi
        matchesType = metaComp === searchKey ||
                      metaType === `component_${searchKey}` ||
                      metaType === searchKey ||
                      title.includes(searchKey);
      }

      if (!matchesType) return false;

      // 2. Cek kecocokan AOI
      if (!isLayerMatchesCurrentAoi(layer)) return false;

      // 3. Cek kecocokan rentang waktu (WAKTU HARUS SAMA PERSIS)
      const layerStart = layerParams.start_date || layerParams.startDate;
      const layerEnd = layerParams.end_date || layerParams.endDate;

      if (startDate || endDate) {
        if (!layerStart || !layerEnd) return false;
        if (startDate && layerStart !== startDate) return false;
        if (endDate && layerEnd !== endDate) return false;
      }

      // 4. Cek bobot jika analisis flood_risk
      if ((searchKey === 'flood_risk' || searchKey === 'risk') && weights && layerParams.weights) {
        try {
          const w1 = typeof weights === 'string' ? JSON.parse(weights) : weights;
          const w2 = typeof layerParams.weights === 'string' ? JSON.parse(layerParams.weights) : layerParams.weights;
          for (const k of Object.keys(w1)) {
            if (Math.abs((parseFloat(w1[k]) || 0) - (parseFloat(w2[k]) || 0)) > 0.01) {
              return false;
            }
          }
        } catch (e) {
          return false;
        }
      }

      return true;
    });
  };

  const handleToggleComponentLayer = (layerId, isChecked) => {
    setIsAnalysisSaved(false);
    const compKey = layerId.toLowerCase();
    const previewKey = Object.keys(availableMaps).find(
      (key) => key.toLowerCase() === compKey
    );
    const previewUrl = previewKey ? availableMaps[previewKey] : null;

    if (isChecked && (typeof previewUrl !== 'string' || !previewUrl.startsWith('http'))) {
      addNotification('info', `Preview layer ${layerId} belum tersedia. Jalankan analisis terlebih dahulu.`);
      return;
    }

    if (isChecked) {
      const nextSelectedComponents = { ...selectedComponentLayers, [compKey]: true };
      setSelectedComponentLayers(nextSelectedComponents);
      setComponentSavePending(true);
    } else if (!isChecked) {
      const nextSelectedComponents = { ...selectedComponentLayers };
      delete nextSelectedComponents[compKey];
      setSelectedComponentLayers(nextSelectedComponents);
      setComponentSavePending(Object.keys(nextSelectedComponents).length > 0);
    }
    setActiveLayers((previous) => {
      const next = { ...previous };
      delete next[previewKey || layerId];
      if (isChecked) next[previewKey || layerId] = previewUrl;
      return next;
    });

    if (isChecked) {
      const legend = previewKey ? availableLegends[previewKey] : null;
      if (legend) setActiveLegend(legend);
      if (statisticsData && Object.keys(statisticsData).length > 0) {
        setSelectedLayerStats(statisticsData);
        setIsChartOpen(true);
      }
    } else {
      const remainingPreviewCount = Object.keys(activeLayers).filter((key) => key !== (previewKey || layerId)).length;
      if (remainingPreviewCount === 0) {
        setActiveLegend(null);
        setIsChartOpen(false);
      }
    }
  };
  const handleRunAnalysis = async (projectId, payload) => {
    if (!projectId) {
      addNotification('error', 'Silakan pilih proyek terlebih dahulu.');
      return;
    }

    // Pastikan area analisis (AOI) sudah ditentukan
    const hasDrawnGeom = drawnGeometryData && drawnGeometryData.geometry && (
      Array.isArray(drawnGeometryData.geometry) ? drawnGeometryData.geometry.length > 0 : true
    );
    if (!selectedAoi && !hasDrawnGeom) {
      addNotification('error', 'Silakan tentukan area (AOI) terlebih dahulu dengan menggambar di peta atau memilih dari daftar AOI tersimpan.');
      return;
    }
    const finalPayload = {
      ...payload,
      aoi_id: selectedAoi ? selectedAoi.id : (payload.aoi_id || null),
      aoi_type: drawnGeometryData ? drawnGeometryData.type : (payload.aoi_type || 'polygon'),
      geometry: drawnGeometryData ? drawnGeometryData.geometry : (payload.geometry || [])
    };

    setIsAnalysisSaved(false);
    setSelectedComponentLayers({});
    setComponentSavePending(false);

    try {
      const res = await executeAnalysis(projectId, finalPayload);
      const analysisData = res?.data || res;

      setIsAnalysisSaved(false);
      if (analysisData?.id) {
        addNotification('success', 'Analisis selesai. Pilih component layer melalui checkbox; tekan Save jika ingin menyimpannya ke GeoServer.');
      }
    } catch (err) {
      console.error("Execute analysis error:", err);
      const msg = err.response?.data?.message || err.message || 'Gagal menjalankan analisis spasial.';
      addNotification('error', msg);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!activeProject?.id) {
      addNotification('error', 'Silakan pilih proyek terlebih dahulu.');
      return;
    }

    const latestAnalysisId = analysisResult?.data?.id || analysisResult?.id;
    if (!latestAnalysisId) {
      addNotification('info', 'Tidak ada hasil analisis baru yang perlu disimpan.');
      return;
    }

    try {
      setIsSavingAnalysis(true);
      const componentNames = { rainfall: 'Rainfall', elevation: 'Elevation', distance: 'Distance', tpi: 'TPI', ndvi: 'NDVI', ndwi: 'NDWI' };
      const selectedComponents = Object.keys(selectedComponentLayers)
        .filter((key) => selectedComponentLayers[key])
        .map((key) => componentNames[key])
        .filter(Boolean);
      const saveRes = await projectService.saveAnalysis(activeProject.id, {
        analysis_id: latestAnalysisId,
        components: selectedComponents
      });
      const savedWms = saveRes?.data?.wms_layer;
      const savedComponents = saveRes?.data?.saved_layers || {};
      const savedComponentEntries = Object.entries(savedComponents).map(([component, layer]) => {
        const versionedLayer = {
          ...layer,
          id: layer.id || layer.layer_name || layer.store_name || `component-${latestAnalysisId}-${component.toLowerCase()}`,
          layer_name: layer.layer_name || layer.store_name || `analysis_component_${component.toLowerCase()}_${latestAnalysisId}`,
          display_name: layer.display_name || `${component} ${analysisResult?.data?.parameters?.start_date?.slice(0, 4) || ''}`.trim(),
          _v: layer.updated_at || new Date().toISOString(),
        };
        return [component.toLowerCase(), versionedLayer];
      });

      if (savedComponentEntries.length > 0) {
        setUserAnalysisLayers((previous) => [
          ...savedComponentEntries.map(([, layer]) => layer),
          ...previous.filter((layer) => !savedComponentEntries.some(([, saved]) => saved.layer_name === layer.layer_name)),
        ]);
      }

      if (savedWms) {
        const versionedWms = {
          ...savedWms,
          _v: savedWms.updated_at || new Date().toISOString()
        };
        setUserAnalysisLayers((prev) => [versionedWms, ...prev.filter((l) => l.id !== versionedWms.id)]);
      }
      const failedComponents = saveRes?.data?.failed_components || {};
      if (!savedWms) {
        throw new Error('FloodRisk utama belum berhasil disimpan ke Analysis Results.');
      }
      if (Object.keys(failedComponents).length > 0) {
        const remainingSelectedComponents = Object.fromEntries(
          Object.entries(selectedComponentLayers).filter(([key]) => {
            const component = ({ rainfall: 'Rainfall', elevation: 'Elevation', distance: 'Distance', tpi: 'TPI', ndvi: 'NDVI', ndwi: 'NDWI' })[key];
            return failedComponents[component];
          })
        );
        setSelectedComponentLayers(remainingSelectedComponents);
        setComponentSavePending(true);
        addNotification('error', `Sebagian komponen gagal disimpan: ${Object.keys(failedComponents).join(', ')}. Tekan Save lagi untuk mencoba ulang.`);
        return;
      }
      setComponentSavePending(false);
      setIsAnalysisSaved(true);
      userListCacheRef.current.layers.delete(String(activeProject.id));
      userListCacheRef.current.groups = null;
      await loadUserAnalysisLayers(activeProject.id, true);
      await loadUserLayerGroups(true);
      addNotification('success', selectedComponents.length > 0
        ? 'FloodRisk dan component layer yang dipilih berhasil disimpan ke proyek.'
        : 'FloodRisk berhasil disimpan ke proyek.');
    } catch (err) {
      console.error('Save analysis error:', err);
      setComponentSavePending(false);
      const msg = err.response?.data?.message || 'Gagal menyimpan hasil analisis ke proyek.';
      addNotification('error', msg);
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  const handleAnalysisParamsChange = ({ startDate, endDate, weights }) => {
    const matched = findMatchingSavedLayer('flood_risk', selectedAoi, startDate, endDate, weights);
    setIsAnalysisSaved(Boolean(matched));
  };

  // const handleDownloadProject = (projectId) => {
  //   if (!projectId) {
  //     addNotification('error', 'Please select a project first before downloading.');
  //     return;
  //   }
    
  //   const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';
  //   const downloadUrl = `${apiBase}/projects/${projectId}/download`;
  //   window.open(downloadUrl, '_blank');
  //   addNotification('info', 'Starting GeoTIFF map download...');
  // };

  const handleDownloadProject = async (projectId) => {
    if (!projectId) {
      addNotification('error', 'Please select a project first before downloading.');
      return;
    }
    
    try {
      addNotification('info', 'Generating download URL...');

      const downloadUrl = await projectService.getDownloadUrl(projectId);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `project_${projectId}_result.tif`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      notify.success('File GeoTIFF berhasil diunduh!');
    } catch (err) {
      console.error("Download failed:", err);
      notify.error('Gagal mengunduh file GeoTIFF.');
    }
  };


  const handleSaveProject = () => {
    notify.success('Status peta dan konfigurasi berhasil disimpan sementara!');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Navbar className="shrink-0 z-[1000]"/>
      <div className="relative flex-1 w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <MapViewer 
            maps={activeLayers} 
            wmsLayers={{
              ...Object.fromEntries(Object.entries(activeUserLayers).map(([key, layer]) => [`user:${key}`, layer])),
              ...Object.fromEntries(Object.entries(activeUserGroups).map(([key, layer]) => [`group:${key}`, layer])),
              ...Object.fromEntries(Object.entries(activeGeosocialWms).map(([key, layer]) => [`geosocial:${key}`, layer])),
            }}
            geosocialPointLayers={activeGeosocialPoints}
            basemap={selectedBasemapId} 
            mapRef={mapRef}
            drawnItemsRef={drawnItemsRef}
            onGeometryComplete={handleGeometryComplete}
            onAoiCleared={handleClearAoi}
            drawnGeometryData={drawnGeometryData}
            selectedAoi={selectedAoi}
            hospitals={hospitalsData}
            hospitalsVisible={!!activeLayers['hospital']}
            waterStations={waterStationsData}
            waterStationsVisible={!!activeLayers['water_station']}
            onWaterStationClick={(station) => {
              setSelectedWaterStation(station);
              setIsWaterStationModalOpen(true);
            }}
          />


        </div>
      </div>
      


      {/* Floating Draggable Data Analysis Visualization */}
      {selectedLayerStats && isChartOpen && (() => {
        const stats = selectedLayerStats;
        return (
          <div 
            style={{
              transform: `translate(calc(-50% + ${chartPos.x}px), ${chartPos.y}px)`,
            }}
            className="fixed bottom-8 left-1/2 z-[600] pointer-events-auto bg-white rounded-2xl shadow-2xl w-[330px] max-w-[92vw] border border-teal-200 select-none flex flex-col transition-shadow duration-200"
          >
            {/* Draggable Header */}
            <div 
              onMouseDown={handleChartMouseDown}
              className="flex justify-between items-center px-4 py-2.5 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 rounded-t-2xl border-b border-teal-100 cursor-grab active:cursor-grabbing shrink-0"
              title="Click and drag to move this window"
            >
              <div className="flex items-center gap-2">
                <span className="p-1 bg-teal-600 text-white rounded-md shadow-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </span>
                <div>
                  <h3 className="font-bold text-teal-900 text-xs leading-tight">Data Analysis Visualization</h3>
                  <span className="text-[9px] text-gray-400 block font-normal leading-none mt-0.5">Draggable window</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {(chartPos.x !== 0 || chartPos.y !== 0) && (
                  <button
                    onClick={() => setChartPos({ x: 0, y: 0 })}
                    title="Reset to center-bottom position"
                    className="text-[10px] px-1.5 py-0.5 text-teal-700 hover:bg-teal-100 rounded transition-colors font-medium border border-teal-200"
                  >
                    Reset
                  </button>
                )}
                <button 
                  onClick={() => setIsChartOpen(false)} 
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
                  title="Close visualization"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-3 custom-scrollbar">
              {/* 1. Full Flood Risk Analysis */}
              {(activeLayers['FloodRisk'] || stats.risk_distribution || (stats.avg_elevation_m !== undefined && stats.avg_rainfall_mm !== undefined && stats.avg_ndvi !== undefined)) && (
                <StatsDashboard statistics={stats} />
              )}

              {/* 2. Flood Event Analysis */}
              {(activeLayers['NewFloodedArea'] || stats.new_flooded_area_km2 !== undefined) && !stats.risk_distribution && (
                <div className="flex flex-col space-y-4">
                  <div className="bg-red-50 border border-red-100 p-5 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-red-800 font-medium text-sm mb-2">Total Estimated New Flooded Area:</span>
                    <span className="font-bold text-red-600 text-4xl">
                      {stats.new_flooded_area_km2 !== undefined ? stats.new_flooded_area_km2 : '0'} 
                      <span className="text-xl ml-1">km²</span>
                    </span>
                    <p className="text-xs text-red-500 mt-3 bg-red-100 px-3 py-1 rounded-full">
                      Based on water body change detection within the AOI boundary.
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Rainfall Component */}
              {(stats.total_accumulated_rainfall_mm !== undefined || stats.avg_rainfall_mm !== undefined || stats.time_series_data) && !stats.risk_distribution && !stats.new_flooded_area_km2 && !stats.avg_ndvi && (
                <div className="flex flex-col space-y-3">
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                    <span className="text-blue-800 font-medium text-xs block mb-1">Rainfall:</span>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-xs">Average:</span>
                      <span className="font-bold text-blue-700 text-base">{stats.avg_rainfall_mm ?? stats.total_accumulated_rainfall_mm ?? 0} mm</span>
                    </div>
                    {stats.max_rainfall_mm !== undefined && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-600 text-xs">Maximum:</span>
                        <span className="font-bold text-blue-800 text-sm">{stats.max_rainfall_mm} mm</span>
                      </div>
                    )}
                  </div>
                  {stats.time_series_data && (
                    <div className="h-48 w-full bg-white p-2 border border-gray-100 rounded-lg shadow-inner">
                      <PrecipitationChart chartData={stats.time_series_data} />
                    </div>
                  )}
                </div>
              )}

              {/* 4. Vegetation (NDVI) Component */}
              {stats.avg_ndvi !== undefined && !stats.risk_distribution && (
        <div className="bg-green-50 border border-green-100 p-3.5 rounded-xl space-y-2">
                  <span className="text-emerald-800 font-semibold text-xs block">Vegetation Index (NDVI)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600 text-xs">Average NDVI:</span>
                    <span className="font-bold text-emerald-700 text-2xl">{stats.avg_ndvi}</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 bg-emerald-100/70 p-2 rounded-lg mt-1">
                    {stats.avg_ndvi > 0.5 ? 'Dense Vegetation (Forest/Plantation)' : stats.avg_ndvi > 0.2 ? 'Moderate Vegetation (Farmland/Shrub)' : 'Non-Vegetation / Bare Soil'}
                  </div>
                </div>
              )}

              {/* 5. Wetness (NDWI) Component */}
              {stats.avg_ndwi !== undefined && !stats.risk_distribution && (
                <div className="bg-cyan-50 border border-cyan-100 p-3.5 rounded-xl space-y-2">
                  <span className="text-cyan-800 font-semibold text-xs block">Water / Moisture Index (NDWI)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600 text-xs">Average NDWI:</span>
                    <span className="font-bold text-cyan-700 text-2xl">{stats.avg_ndwi}</span>
                  </div>
                  <div className="text-[11px] text-cyan-600 bg-cyan-100/70 p-2 rounded-lg mt-1">
                    {stats.avg_ndwi > 0.2 ? 'High Moisture / Surface Water' : stats.avg_ndwi > -0.1 ? 'Moderate Moisture' : 'Dry Land'}
                  </div>
                </div>
              )}

              {/* 6. Elevation Component */}
              {stats.avg_elevation_m !== undefined && !stats.risk_distribution && (
                <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl space-y-2">
                  <span className="text-amber-800 font-semibold text-xs block">Elevation (SRTM DEM)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600 text-xs">Average Elevation:</span>
                    <span className="font-bold text-amber-700 text-xl">{stats.avg_elevation_m} m</span>
                  </div>
                  {stats.min_elevation_m !== undefined && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Min: {stats.min_elevation_m} m</span>
                      <span>Max: {stats.max_elevation_m} m</span>
                    </div>
                  )}
                </div>
              )}

              {/* 7. Distance from Water Component */}
              {stats.avg_distance_m !== undefined && (
                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl space-y-2">
                  <span className="text-blue-800 font-semibold text-xs block">Distance from Water</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600 text-xs">Average Distance:</span>
                    <span className="font-bold text-blue-700 text-xl">{stats.avg_distance_m} m</span>
                  </div>
                  <div className="text-[11px] text-blue-600 bg-blue-100/70 p-2 rounded-lg">
                    {stats.avg_distance_m <= 300 ? 'Very Close to Water Bodies (Flood Prone)' : stats.avg_distance_m <= 1000 ? 'Floodplain Zone' : 'Safe Distance from Riverways'}
                  </div>
                </div>
              )}

              {/* 8. Topographic Position Index (TPI) */}
              {stats.avg_tpi !== undefined && (
                <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl space-y-2">
                  <span className="text-indigo-800 font-semibold text-xs block">Topographic Position Index (TPI)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-600 text-xs">Average TPI:</span>
                    <span className="font-bold text-indigo-700 text-xl">{stats.avg_tpi}</span>
                  </div>
                  <div className="text-[11px] text-indigo-600 bg-indigo-100/70 p-2 rounded-lg">
                    {stats.avg_tpi < -2 ? 'Valley / Basin (Water Inflow Area)' : stats.avg_tpi > 2 ? 'Ridge / Hilltop Area' : 'Flat Plains / Gentle Slope'}
                  </div>
                </div>
              )}

              {/* Indeks Warna Terintegrasi di Visualisasi */}
              {activeLegend && activeLegend.items && (
                <div className="pt-2.5 border-t border-gray-100 mt-2">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1.5">
                    Color Legend ({activeLegend.title})
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {activeLegend.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50/80 px-2 py-1 rounded border border-gray-100">
                        <span className="w-3.5 h-3.5 rounded-xs shrink-0 border border-black/10 shadow-2xs" style={{ backgroundColor: it.color }}></span>
                        <span className="text-gray-700 text-[11px] truncate">{it.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <SidebarLayout
        className="relative z-20" 
        aoiDisplayText={aoiDisplayText}
        onSelectSavedAoi={handleSelectSavedAoi}
        onFloodRiskAnalysis={handleRunAnalysis}
        onFloodEventAnalysis={handleRunAnalysis}
        onRainfallAnalysis={handleRunAnalysis}
        
        onLayerToggle={handleLayerToggle}
        activeLayers={activeLayers}
        selectedComponentLayers={selectedComponentLayers}
        userAnalysisLayers={userAnalysisLayers}
        activeUserLayers={activeUserLayers}
        onToggleUserLayer={handleUserLayerToggle}
        onToggleComponentLayer={handleToggleComponentLayer}
        selectedAoi={selectedAoi}

        onClearAoi={handleClearAoi}
        onProjectCreated={handleProjectCreated}
        onUploadFile={() => setIsFileUploadOpen(true)}
        onSaveAnalysis={handleSaveAnalysis}
        isSavingAnalysis={isSavingAnalysis}
        isAnalysisSaved={isAnalysisSaved}
        hasAnalysisToSave={Boolean(analysisResult?.data || analysisResult || Object.keys(activeUserLayers).length > 0 || Object.keys(activeLayers).length > 0 || componentSavePending)}
        onParametersChange={handleAnalysisParamsChange}
        onDownloadProject={handleDownloadProject}
        onSaveProject={handleSaveProject}
        drawnGeometryData={drawnGeometryData}
        
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        
        onDrawPolygon={handleDrawPolygon}
        onDrawCircle={handleDrawCircle}
        onInsertPoint={handleInsertPoint}
        onDelete={handleDelete}
      />

      <div className="z-50">
        <HomeButton /> 
        <LayerButton 
          isOpen={isLayerOpen} 
          onClick={() => setIsLayerOpen(!isLayerOpen)} 
        /> 
        <BasemapButton 
          onClick={() => setIsBasemapOpen(true)} 
        /> 
        <InfoButton />
      </div>

      <BasemapLayout 
        isOpen={isBasemapOpen} 
        onClose={() => setIsBasemapOpen(false)}
        selectedBasemapId={selectedBasemapId}
        onSelectBasemap={(basemap) => setSelectedBasemapId(basemap.id)}
      />

      <LayerPopup 
        isOpen={isLayerOpen} 
        onClose={() => setIsLayerOpen(false)} 
        
        onAdminLayerToggle={handleLayerToggle}
        adminStatus={activeLayers['province'] ? 'province' : (activeLayers['district'] ? 'district' : null)}
        
        onThematicLayerToggle={handleLayerToggle}
        thematicStatus={activeLayers}

        onInfrastructureToggle={handleLayerToggle}
        onWaterStationApiToggle={(isChecked) => handleLayerToggle('water_station', isChecked)}
        facilitiesStatus={activeLayers}

        geosocialList={geosocialList}
        geosocialStatus={visibleGeosocial}
        onGeosocialToggle={handleGeosocialToggle}
        onGeosocialToggleAll={handleGeosocialToggleAll}

        userAnalysisList={userAnalysisLayers}
        userAnalysisStatus={activeUserLayers}
        userGroupList={userLayerGroups}
        userGroupStatus={activeUserGroups}
        onUserAnalysisToggle={handleUserLayerToggle}
        onUserAnalysisToggleAll={handleUserLayerToggleAll}
        onUserGroupToggle={handleUserGroupToggle}
        onZoomToUserLayer={handleZoomToUserLayer}
        onZoomToUserGroup={handleZoomToUserGroup}
        onRefreshUserLayers={() => {
          userListCacheRef.current.layers.delete(String(activeProject?.id));
          userListCacheRef.current.groups = null;
          loadUserAnalysisLayers(activeProject?.id, true);
          loadUserLayerGroups(true);
        }}
        onCreateUserGroup={handleCreateUserGroup}
        onUpdateUserGroup={handleUpdateUserGroup}
        onDeleteUserGroup={handleDeleteUserGroup}
        onDeleteLayer={handleDeleteUserLayer}
        loadingUserLayers={loadingUserLayers}
      />

      <FileUploadPopup 
        isOpen={isFileUploadOpen} 
        onClose={() => setIsFileUploadOpen(false)}
        onFileSubmit={handleFileUploadSubmit}
      />

      {/* Live CCTV & Water Station Modal */}
      {selectedWaterStation && (
        <WaterStationModal
          isOpen={isWaterStationModalOpen}
          onClose={() => {
            setIsWaterStationModalOpen(false);
            setSelectedWaterStation(null);
          }}
          stationCode={selectedWaterStation.stationCode}
          stationName={selectedWaterStation.stationName}
          location={selectedWaterStation.location}
        />
      )}

      {loading && (
        <Loader 
          message="Memproses Analisis Google Earth Engine"
          onCancel={cancelAnalysis}
          stages={[
            { time: 0, text: 'Memvalidasi geometri AOI & parameter analisis...' },
            { time: 3, text: 'Menghubungkan ke layanan Google Earth Engine...' },
            { time: 8, text: 'Mengambil citra satelit & reduksi matriks piksel...' },
            { time: 18, text: 'Menyusun visualisasi spasial dan layer peta...' },
            { time: 24, text: 'Menyiapkan preview FloodRisk dan component layers...' }
          ]}
        />
      )}

      {isUploading && (
        <Loader 
          mode="determinate"
          progress={uploadProgress}
          message={uploadProgress >= 100 ? "Memvalidasi Geometri AOI..." : "Mengunggah File Spasial..."}
        />
      )}
    </div>
  );
}