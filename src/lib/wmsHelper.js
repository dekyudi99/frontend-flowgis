/**
 * Centralized WMS Helper for FlowGIS
 * Enforces DRY principles, deterministic versioned cache-busting,
 * robust layer naming resolution, and safe CRS/Bounding Box normalization.
 */

const DEFAULT_GEOSERVER_WMS = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_GEOSERVER_WMS_URL) || 'http://localhost:8080/geoserver/wms';

/**
 * Resolves the WMS layers parameter cleanly from diverse layer schemas:
 * - layer.wms_layers_param (legacy explicit param)
 * - workspace_name:store_name (raster coverage stores)
 * - workspace_name:layer_name (vector feature types)
 * - geoserver_name / layer_key / layer_name
 */
export function resolveWmsLayersParam(layer) {
  if (!layer) return '';
  if (layer.wms_layers_param) return layer.wms_layers_param;

  const ws = layer.workspace_name;
  const store = layer.store_name || layer.geoserver_name;
  const lyrName = layer.layer_name || layer.name;

  if (ws && store) {
    return `${ws}:${store}`;
  }
  if (ws && lyrName) {
    return `${ws}:${lyrName}`;
  }
  if (layer.geoserver_name) return layer.geoserver_name;
  if (layer.layer_key) return layer.layer_key;
  if (layer.layer_name) return layer.layer_name;
  if (layer.name) return layer.name;

  return '';
}

/**
 * Normalizes the base GeoServer WMS URL
 */
export function resolveWmsUrl(layer) {
  const rawUrl = layer?.wms_url || layer?.url || DEFAULT_GEOSERVER_WMS;
  if (!rawUrl) return DEFAULT_GEOSERVER_WMS;

  // Clean trailing query params or slashes
  return rawUrl.split('?')[0].replace(/\/+$/, '');
}

/**
 * Resolves the WMS styles parameter
 */
export function resolveWmsStyleParam(layer) {
  if (!layer) return '';
  return layer.style_name || layer.style || layer.styles || '';
}

/**
 * Normalizes Bounding Box to Leaflet format [[south, west], [north, east]]
 * Handles both dictionary {left, bottom, right, top} and array [minx, miny, maxx, maxy].
 * Detects projected coordinates (e.g. UTM meters in EPSG:32647) to avoid crashing Leaflet.
 */
export function normalizeBbox(rawBbox) {
  if (!rawBbox) return null;

  let minx, miny, maxx, maxy;

  if (Array.isArray(rawBbox) && rawBbox.length >= 4) {
    [minx, miny, maxx, maxy] = rawBbox.map(Number);
  } else if (typeof rawBbox === 'object') {
    minx = Number(rawBbox.left ?? rawBbox.minx ?? rawBbox.west);
    miny = Number(rawBbox.bottom ?? rawBbox.miny ?? rawBbox.south);
    maxx = Number(rawBbox.right ?? rawBbox.maxx ?? rawBbox.east);
    maxy = Number(rawBbox.top ?? rawBbox.maxy ?? rawBbox.north);
  }

  if (isNaN(minx) || isNaN(miny) || isNaN(maxx) || isNaN(maxy)) {
    return null;
  }

  // Sanity check for WGS84 coordinates: longitude in [-180, 180], latitude in [-90, 90]
  const isLikelyProjected = Math.abs(minx) > 180 || Math.abs(maxx) > 180 || Math.abs(miny) > 90 || Math.abs(maxy) > 90;

  if (isLikelyProjected) {
    // If coordinates are projected meters (e.g. UTM Thailand 32647),
    // Leaflet cannot directly fitBounds with meter values without Proj4.
    // Return null or approximate safe center bounds instead of breaking Leaflet map.
    return null;
  }

  return [
    [miny, minx], // [south, west]
    [maxy, maxx]  // [north, east]
  ];
}

/**
 * Builds a uniform Leaflet WMS Layer configuration object
 * Enforces deterministic versioned cache-busting.
 */
export function buildWmsLayerConfig(layer, customOptions = {}) {
  if (!layer) return null;

  const layersParam = resolveWmsLayersParam(layer);
  if (!layersParam) return null;

  const baseUrl = resolveWmsUrl(layer);
  const styleParam = resolveWmsStyleParam(layer);

  // Deterministic cache buster: only updates when the layer's actual version changes
  const versionKey = layer.updated_at || layer._v || layer.version || layer._t || '';
  const finalUrl = versionKey
    ? `${baseUrl}?_v=${encodeURIComponent(versionKey)}`
    : baseUrl;

  const normalizedBounds = normalizeBbox(layer.bbox);

  return {
    id: layer.id || layersParam,
    url: finalUrl,
    layers: layersParam,
    styles: styleParam,
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    zIndex: customOptions.zIndex || 40,
    opacity: layer.opacity !== undefined ? layer.opacity : (customOptions.opacity ?? 0.85),
    bounds: normalizedBounds,
    _v: versionKey,
    ...customOptions
  };
}
