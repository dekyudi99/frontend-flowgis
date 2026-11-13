import React, { useState } from "react";
import { predictFloodRisk } from "@/services/floodMlService";
import { useNotification } from "@/context/NotificationContext";
import { Loader2, Trash2, Bot, Sparkles, CloudRain, ShieldCheck, Calendar, Clock } from "lucide-react";

const PROVINCE_CONFIG = {
  sukhothai: {
    name: "Sukhothai (Yom Basin - Multi-Horizon RF EWS 28 Features)",
    sourceNote: "Source: GISTDA Open API v2.0 (/features/flood/1d..30d) + GEE Sentinel-1 SAR (365d).",
  },
  suphanburi: {
    name: "Suphan Buri (Tha Chin - Multi-Horizon LightGBM EWS 28 Features)",
    sourceNote: "Source: GISTDA Open API v2.0 (/features/flood/1d..30d) + GEE Sentinel-1 SAR (365d).",
  },
  nakhon_pathom: {
    name: "Nakhon Pathom (Lower Delta - Multi-Horizon EWS 38 Features)",
    sourceNote: "Source: GISTDA Open API v2.0 + HII OpenData Stations (tiservice.hii.or.th) + GEE SAR.",
  },
};

export default function EWSFloodMLAnalysis({
  onEWSResult = null,
  onClearEWS = null,
  hasActiveLayer = false,
}) {
  const { notify } = useNotification();
  const [province, setProvince] = useState("sukhothai");
  const [leadTime, setLeadTime] = useState("1d");
  const [observationDate, setObservationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const activeConfig = PROVINCE_CONFIG[province] || PROVINCE_CONFIG.sukhothai;

  const handleRunForecast = async () => {
    setIsLoading(true);
    try {
      const data = await predictFloodRisk({
        province,
        lead_time: leadTime,
        model_name: "best",
        target_date: observationDate,
        threshold: 0.50,
      });

      setResult(data);
      const validFor = data?.geojson?.metadata?.valid_for_date || "Target Date";
      const horizonLabel = leadTime === "1d" ? "T+1 (24h)" : (leadTime === "3d" ? "T+3 (72h)" : "T+7 (Weekly)");
      notify.success(
        `${horizonLabel} Forecast for ${data.province} (Valid: ${validFor}) completed!`
      );

      if (onEWSResult) {
        onEWSResult(data);
      }
    } catch (err) {
      console.error("EWS Prediction error:", err);
      notify.error(
        `Failed to run EWS prediction: ${err.response?.data?.detail || err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLayer = () => {
    setResult(null);
    if (onClearEWS) {
      onClearEWS();
    }
    notify.info("EWS Flood Risk markers cleared from the map.");
  };

  const meta = result?.geojson?.metadata;
  const meteo = meta?.meteorology;
  const valMetrics = meta?.validation_metrics;

  return (
    <div className="flex flex-col space-y-3.5 text-xs">
      {/* Info Banner */}
      <div className="bg-teal-50/80 border border-teal-100 rounded-xl p-3 flex items-start gap-2.5 text-teal-800">
        <Bot className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Evaluates <strong>1,000 automated spatial monitoring points</strong> using live <strong>GISTDA Open API v2.0</strong> flood extents, <strong>HII OpenData</strong> station telemetry, <strong>GEE Sentinel-1 SAR</strong> satellite observations, and <strong>Open-Meteo GFS</strong> numerical weather predictions integrated directly into the researcher&apos;s machine learning checkpoints.
        </p>
      </div>

      {/* 1. Province Selection */}
      <div>
        <label className="block font-semibold text-gray-700 mb-1.5">
          Select Target Province:
        </label>
        <select
          value={province}
          onChange={(e) => {
            setProvince(e.target.value);
            setResult(null);
          }}
          className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-medium text-gray-700"
        >
          <option value="sukhothai">
            Sukhothai (Yom Basin - RF Multi-Horizon EWS)
          </option>
          <option value="suphanburi">
            Suphan Buri (Tha Chin - LightGBM Multi-Horizon EWS)
          </option>
          <option value="nakhon_pathom">
            Nakhon Pathom (Lower Delta - Multi-Horizon EWS + Stations)
          </option>
        </select>
        <span className="text-[10.5px] text-gray-500 mt-1.5 block leading-snug">
          {activeConfig.sourceNote}
        </span>
      </div>

      {/* 2. Forecast Horizon Selector (T+1, T+3, T+7) */}
      <div>
        <label className="block font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            Forecast Horizon:
          </span>
          <span className="text-[10px] text-teal-700 font-medium">
            {leadTime === "1d" ? "Next-Day (24h)" : (leadTime === "3d" ? "Short-Term (72h)" : "Weekly Cycle (7d)")}
          </span>
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setLeadTime("1d");
              setResult(null);
            }}
            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              leadTime === "1d"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200/80"
            }`}
          >
            <div>T+1</div>
            <div className={`text-[9px] font-normal ${leadTime === "1d" ? "text-teal-100" : "text-gray-500"}`}>24 Hours</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setLeadTime("3d");
              setResult(null);
            }}
            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              leadTime === "3d"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200/80"
            }`}
          >
            <div>T+3</div>
            <div className={`text-[9px] font-normal ${leadTime === "3d" ? "text-teal-100" : "text-gray-500"}`}>72 Hours</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setLeadTime("7d");
              setResult(null);
            }}
            className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              leadTime === "7d"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200/80"
            }`}
          >
            <div>T+7</div>
            <div className={`text-[9px] font-normal ${leadTime === "7d" ? "text-teal-100" : "text-gray-500"}`}>7 Days</div>
          </button>
        </div>
      </div>

      {/* 3. Live Observation Date */}
      <div>
        <label className="block font-semibold text-gray-700 mb-1.5">
          Observation Date (t-1 Satellite Cut-off):
        </label>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
          <input
            type="date"
            value={observationDate}
            min="2016-01-01"
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setObservationDate(e.target.value);
              setResult(null);
            }}
            className="w-full bg-transparent text-xs font-medium text-gray-700 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              setObservationDate(new Date().toISOString().slice(0, 10));
              setResult(null);
            }}
            className="px-2 py-0.5 text-[10px] font-semibold bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-md shrink-0 cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* 4. Run Forecast Button */}
      <div className="flex gap-2">
        <button
          onClick={handleRunForecast}
          disabled={isLoading}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running Live {leadTime === "1d" ? "T+1" : (leadTime === "3d" ? "T+3" : "T+7")} Forecast...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run {leadTime === "1d" ? "Next-Day (T+1)" : (leadTime === "3d" ? "3-Day Surge (T+3)" : "Weekly Cycle (T+7)")} Forecast</span>
            </>
          )}
        </button>

        {(result || hasActiveLayer) && (
          <button
            type="button"
            onClick={handleClearLayer}
            title="Clear EWS markers from map"
            className="px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 5. Forecast Summary & Statistics */}
      {result && (
        <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-teal-100 pb-2">
            <span className="font-bold text-teal-900">EWS Alert Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                result.statistics.overall_alert_level.includes("CRITICAL")
                  ? "bg-red-600 text-white"
                  : result.statistics.overall_alert_level.includes("WARNING")
                  ? "bg-yellow-500 text-black"
                  : "bg-green-600 text-white"
              }`}
            >
              {result.statistics.overall_alert_level}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626] animate-pulse inline-block"></span>
                <span>Very High (≥ 80%)</span>
              </span>
              <span className="font-semibold text-gray-800">
                {result.statistics.very_high_count} pts ({result.statistics.very_high_pct}%)
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] inline-block"></span>
                <span>High Risk (60–80%)</span>
              </span>
              <span className="font-semibold text-gray-800">
                {result.statistics.high_count} pts ({result.statistics.high_pct}%)
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] inline-block"></span>
                <span>Moderate Risk (40–60%)</span>
              </span>
              <span className="font-semibold text-gray-800">
                {result.statistics.moderate_count} pts ({result.statistics.moderate_pct}%)
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2ecc71] inline-block"></span>
                <span>Low Risk (20–40%)</span>
              </span>
              <span className="font-semibold text-gray-800">
                {result.statistics.low_count} pts ({result.statistics.low_pct}%)
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#27ae60] inline-block"></span>
                <span>Very Low (&lt; 20%)</span>
              </span>
              <span className="font-semibold text-gray-800">
                {result.statistics.very_low_count} pts ({result.statistics.very_low_pct}%)
              </span>
            </div>
          </div>

          {meteo && (
            <div className="bg-white/85 rounded-lg p-2.5 border border-teal-100 text-[10px] text-gray-600 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-teal-800">
                <CloudRain className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate" title={meteo.weather_source}>{meteo.weather_source}</span>
              </div>
              <div className="flex justify-between">
                <span>Past 7d Rain: <b>{meteo.past_7d_rain_mm} mm</b></span>
                <span>Projected Rain ({meteo.forecast_horizon || "T+1"}): <b>{meteo.forecast_rain_mm ?? 0} mm</b></span>
              </div>
              {meteo.gistda_active && (
                <div className="flex justify-between text-[9.5px] text-teal-700">
                  <span>GISTDA 30d Flood Pts: <b>{meteo.gistda_30d_points ?? 0}</b></span>
                  <span>GISTDA 7d Flood Pts: <b>{meteo.gistda_7d_points ?? 0}</b></span>
                </div>
              )}
              {meteo.hii_stations_coverage && (
                <div className="flex justify-between text-[9.5px] text-teal-700">
                  <span>HII Rain Stations: <b>{meteo.hii_stations_coverage} active</b></span>
                  <span>365d Antecedent Rain: <b>{meteo.rain_365d_mm} mm</b></span>
                </div>
              )}
              <div className="flex justify-between text-[9.5px] text-gray-500">
                <span>Satellite Cut-off Date (t-1): <b>{meta?.target_date}</b></span>
                <span>Forecast Target Date ({meteo.forecast_horizon || "T+1"}): <b>{meta?.valid_for_date}</b></span>
              </div>
            </div>
          )}

          {valMetrics && (
            <div className="bg-white/90 rounded-lg p-2.5 border border-teal-100 text-[10px] text-gray-700 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-teal-800">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Checkpoint Holdout Benchmark ({valMetrics.holdout_test_period || "2024–2025"})</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                <span>ROC-AUC: <b>{valMetrics.roc_auc}</b></span>
                <span>Accuracy: <b>{valMetrics.accuracy}</b></span>
                <span>Precision: <b>{valMetrics.precision}</b></span>
                <span>Recall: <b>{valMetrics.recall}</b></span>
              </div>
            </div>
          )}

          <div className="text-[10px] text-gray-500 pt-1.5 border-t border-teal-100 flex items-center justify-between">
            <span>Model: {result.model_used.split("(")[0].trim()} ({meta?.features_count} features)</span>
            <span>Time: {result.execution_time_ms} ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
