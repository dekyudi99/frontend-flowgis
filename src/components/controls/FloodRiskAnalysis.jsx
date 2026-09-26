import React, { useState, useEffect } from "react";
import { useAnalysis } from "@/context/AnalysisContext";
import { Loader2 } from "lucide-react";

export default function FloodRiskAnalysis({ 
  onAnalyze, 
  activeLayers = {}, 
  onToggleLayer,
  userAnalysisLayers = [],
  activeUserLayers = {},
  onToggleComponentLayer,
  loadingComponentLayer = {},
  selectedAoi = null,
  drawnGeometryData = null,
  onParametersChange = null
}) {
  const { analysisResult } = useAnalysis();

  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-01-31");

  const [weights, setWeights] = useState({
    rain: 0.3,
    elevation: 0.2,
    distance: 0.2,
    topo: 0.1,
    wetness: 0.1,
    vegetation: 0.1,
  });

  // Komponen layer tetap bisa digunakan jika ada hasil analisis atau histori layer
  const resultData = analysisResult?.data || analysisResult;
  const hasCompletedAnalysis = Boolean(
    resultData?.analysis_type === 'flood_risk' || 
    resultData?.wms_layer || 
    (userAnalysisLayers && userAnalysisLayers.length > 0)
  );

  useEffect(() => {
    const data = analysisResult?.data || analysisResult;
    if (data?.analysis_type === 'flood_risk' && data?.parameters) {
      const nextStart = data.parameters.start_date || startDate;
      const nextEnd = data.parameters.end_date || endDate;
      const nextWeights = (data.parameters.weights && Object.keys(data.parameters.weights).length > 0) ? data.parameters.weights : weights;

      if (data.parameters.start_date) setStartDate(data.parameters.start_date);
      if (data.parameters.end_date) setEndDate(data.parameters.end_date);
      if (data.parameters.weights && Object.keys(data.parameters.weights).length > 0) {
        setWeights(data.parameters.weights);
      }
      onParametersChange?.({ startDate: nextStart, endDate: nextEnd, weights: nextWeights });
    }
  }, [analysisResult]);

  const handleWeightChange = (key, value) => {
    const nextWeights = {
      ...weights,
      [key]: parseFloat(value) || 0,
    };
    setWeights(nextWeights);
    onParametersChange?.({ startDate, endDate, weights: nextWeights });
  };

  const handleRunAnalysis = () => {
    const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);
    
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      alert(`Error: Total weights must equal exactly 1.0 (100%). Your current total is: ${totalWeight.toFixed(2)}`);
      return;
    }

    if (!startDate || !endDate) {
      alert("Please enter both Start Date and End Date first.");
      return;
    }

    const payload = {
      analysis_type: "flood_risk",
      aoi_id: selectedAoi ? selectedAoi.id : null,
      aoi_type: "polygon",
      start_date: startDate,
      end_date: endDate,
      startDate: startDate,
      endDate: endDate,
      weights: weights
    };

    onAnalyze(payload);
  };

  // Cek apakah komponen ini sudah dianalisis dan AKTIF di peta untuk AOI saat ini
  const isComponentChecked = (id) => {
    const key = id.toLowerCase();
    
    // Cek apakah ada layer aktif di activeUserLayers yang merupakan komponen ini dan cocok dengan AOI
    const isUserLayerActive = Object.values(activeUserLayers || {}).some(l => {
      const meta = l.metadata || {};
      const metaType = (meta.analysis_type || '').toLowerCase();
      const metaComp = (meta.component || '').toLowerCase();
      const name = (l.layer_name || l.title || l.name || '').toLowerCase();
      const isCompMatch = metaComp === key || metaType === `component_${key}` || metaType === key || name.includes(key);
      if (!isCompMatch) return false;

      // Pastikan juga cocok dengan AOI saat ini jika AOI dipilih
      const layerAoiId = meta.aoi_id || meta.extra?.aoi_id;
      if (selectedAoi?.id && layerAoiId && String(layerAoiId) !== String(selectedAoi.id)) {
        return false;
      }
      return true;
    });

    if (isUserLayerActive) return true;
    if (activeLayers && (activeLayers[id] || activeLayers[key])) return true;

    return false;
  };

  const componentList = [
    { id: "Rainfall", label: "Rainfall" },
    { id: "Elevation", label: "Elevation" },
    { id: "Distance", label: "Distance from Water" },
    { id: "TPI", label: "Topographic Position Index (TPI)" },
    { id: "NDVI", label: "Vegetation (NDVI)" },
    { id: "NDWI", label: "Wetness (NDWI)" },
  ];

  return (
    <div className="flex flex-col space-y-5">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              const val = e.target.value;
              setStartDate(val);
              onParametersChange?.({ startDate: val, endDate, weights });
            }}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              const val = e.target.value;
              setEndDate(val);
              onParametersChange?.({ startDate, endDate: val, weights });
            }}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 text-sm"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between items-end mb-2">
          <label className="block text-sm font-semibold text-teal-700">RISK WEIGHTS</label>
          <span className="text-xs text-gray-500 font-medium">(Total = 1.0)</span>
        </div>

        {[
          { key: "rain", label: "Rainfall" },
          { key: "elevation", label: "Elevation (DEM)" },
          { key: "distance", label: "Distance from River" },
          { key: "topo", label: "Topography (TPI)" },
          { key: "wetness", label: "Water Index (NDWI)" },
          { key: "vegetation", label: "Vegetation (NDVI)" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
            <span className="text-sm text-gray-700">{item.label}</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={weights[item.key]}
              onChange={(e) => handleWeightChange(item.key, e.target.value)}
              className="w-20 p-1 text-center border border-gray-300 rounded focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleRunAnalysis}
        className="w-full bg-teal-600 text-white font-medium py-2.5 rounded-lg hover:bg-teal-700 transition-colors shadow-sm mt-2"
      >
        Run Spatial Analysis
      </button>

      {/* Komponen layer tetap bisa digunakan setelah analisis selesai atau jika sudah ada histori */}
      {hasCompletedAnalysis && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-teal-700">Component Layers</label>
            <span className="text-[10px] text-gray-500 font-medium">
              {selectedAoi ? `(${selectedAoi.name || 'AOI Aktif'})` : '(Komponen Analisis)'}
            </span>
          </div>
          <div className="space-y-2.5">
            {componentList.map((layer) => {
              const isLoading = !!loadingComponentLayer[layer.id];
              const isChecked = isComponentChecked(layer.id);

              return (
                <label key={layer.id} className="flex items-center justify-between cursor-pointer group py-1">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isLoading}
                      onChange={(e) => {
                        if (onToggleComponentLayer) {
                          onToggleComponentLayer(layer.id, e.target.checked, {
                            startDate,
                            endDate,
                            start_date: startDate,
                            end_date: endDate
                          });
                        } else if (onToggleLayer) {
                          onToggleLayer(layer.id, e.target.checked);
                        }
                      }}
                      className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-teal-700">{layer.label}</span>
                  </div>

                  {isLoading && (
                    <span className="flex items-center text-xs text-teal-600 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      Analyze...
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}