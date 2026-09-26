import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { geosocialService } from '@/services/geosocialService';
import { useNotification } from '@/context/NotificationContext';
import Loader from '@/components/commons/Loader';

export default function GeosocialForm({ onAddLayer }) {
  const { notify } = useNotification();
  const [file, setFile] = useState(null);
  const [layerName, setLayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [reductionStats, setReductionStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setErrorMsg(null);
    setReductionStats(null);

    if (selected) {
      if (selected.name.toLowerCase().endsWith('.shp')) {
        setErrorMsg('Format ESRI Shapefile (.shp) membutuhkan berkas pendamping (.shx, .dbf, .prj). Mohon satukan seluruh berkas tersebut ke dalam satu berkas .zip sebelum diunggah.');
      }

      if (!layerName) {
        // Auto-suggest layer name from file name
        const cleanName = selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setLayerName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !layerName) return;

    if (file.name.toLowerCase().endsWith('.shp')) {
      const shpErr = 'Format ESRI Shapefile (.shp) tidak bisa diunggah mandiri tanpa file pendampingnya (.shx, .dbf, .prj). Mohon kompres semua file tersebut ke dalam format .zip lalu unggah kembali.';
      setErrorMsg(shpErr);
      notify.error(shpErr);
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setErrorMsg(null);
    setReductionStats(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', layerName);
      formData.append('title', layerName);
      formData.append('workspace_name', 'geosocial');

      const response = await geosocialService.uploadLayer(formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      const newLayer = response.data || response;
      const stats = newLayer?.simplification || response?.simplification;

      if (stats) {
        setReductionStats(stats);
      }

      const extension = file.name.split('.').pop().toUpperCase();
      const bbox = newLayer?.bbox || [];
      const createdItem = {
        id: newLayer?.id || Date.now(),
        name: newLayer?.display_name || layerName,
        layer_name: newLayer?.layer_name || newLayer?.layer_key || `geosocial:${layerName.toLowerCase().replace(/\s+/g, '_')}`,
        type: newLayer?.type?.toUpperCase() || extension,
        url: newLayer?.url || newLayer?.wms_url || 'http://localhost:8080/geoserver/wms',
        minx: bbox[0],
        miny: bbox[1],
        maxx: bbox[2],
        maxy: bbox[3],
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: 'Active',
        is_active: true,
      };

      if (onAddLayer) {
        onAddLayer(createdItem);
      } else {
        notify.success(`Layer "${createdItem.name || layerName}" berhasil diunggah!`);
      }

      setFile(null);
      setLayerName('');
      // Reset input file element
      const fileInput = document.getElementById('geosocial-file-input');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('Upload layer error:', err);
      const validationErrors = err.response?.data?.errors;
      let msg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to upload and process layer.';
      if (validationErrors && typeof validationErrors === 'object') {
        const details = Object.values(validationErrors).flat().join(', ');
        if (details) msg = `${msg}: ${details}`;
      }
      setErrorMsg(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-teal-600" /> Upload Geosocial Spatial Layer
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Support ESRI Shapefile (.shp / .zip), GeoJSON (.geojson), GeoPackage (.gpkg), CSV koordinat, atau Raster GeoTIFF (.tif)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Layer Display Name</label>
              <input
                type="text"
                placeholder="Example: Map of Flood Vulnerability Boundaries"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Spatial File (.zip, .geojson, .shp, .gpkg, .csv, .tif)
              </label>
              <input
                id="geosocial-file-input"
                type="file"
                accept=".shp,.zip,.tif,.tiff,.geojson,.json,.gpkg,.csv"
                onChange={handleFileChange}
                className="w-full text-xs text-gray-500 border border-gray-300 rounded-lg p-1.5 focus:outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                required
              />
            </div>

            {/* Notifikasi Error */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="text-[11px]">{errorMsg}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !file || !layerName}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold w-full justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunggah & Memproses Layer...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 mr-2" /> Upload & Publikasikan Layer
              </>
            )}
          </Button>
        </form>
      </CardContent>

      {/* Loading Modal Serupa dengan User AOI Upload */}
      {loading && (
        <Loader
          mode={uploadProgress >= 100 ? "indeterminate" : "determinate"}
          progress={uploadProgress}
          message={uploadProgress >= 100 ? "Memproses & Menerbitkan ke GeoServer..." : "Mengunggah Berkas Spasial..."}
          subtitle={uploadProgress >= 100 ? "Mengekstrak geometri, registrasi PostGIS & publikasi WMS..." : `Mengirim berkas ${file?.name} (${Math.round(uploadProgress)}%)...`}
          stages={[
            { time: 0, text: 'Membaca dan memvalidasi berkas spasial...' },
            { time: 2, text: 'Mengunggah berkas spasial ke backend FlowGIS...' },
            { time: 6, text: 'Mengekstrak geometri & reproyeksi WGS84 (EPSG:4326)...' },
            { time: 12, text: 'Menyimpan ke PostGIS & mempublikasikan WMS GeoServer...' },
          ]}
        />
      )}
    </Card>
  );
}