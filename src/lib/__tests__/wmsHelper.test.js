import assert from 'node:assert';
import {
  resolveWmsLayersParam,
  resolveWmsUrl,
  resolveWmsStyleParam,
  normalizeBbox,
  buildWmsLayerConfig,
} from '../wmsHelper.js';
import { clearWmsLayers, syncWmsLayers } from '../wmsLayerManager.js';

console.log('--- Running FlowGIS wmsHelper Regression Tests ---');

// Test 1: resolveWmsLayersParam
{
  assert.strictEqual(resolveWmsLayersParam(null), '', 'Null layer returns empty string');
  assert.strictEqual(
    resolveWmsLayersParam({ wms_layers_param: 'explicit:layer' }),
    'explicit:layer',
    'Explicit wms_layers_param takes precedence'
  );
  assert.strictEqual(
    resolveWmsLayersParam({ workspace_name: 'flowgis', store_name: 'raster_store_99' }),
    'flowgis:raster_store_99',
    'Raster store resolution produces workspace:store_name'
  );
  assert.strictEqual(
    resolveWmsLayersParam({ workspace_name: 'flowgis', layer_name: 'weir_vector' }),
    'flowgis:weir_vector',
    'Vector layer resolution produces workspace:layer_name'
  );
  assert.strictEqual(
    resolveWmsLayersParam({ layer_key: 'nakhon:admin_subdistrict' }),
    'nakhon:admin_subdistrict',
    'layer_key fallback works'
  );
  assert.strictEqual(
    resolveWmsLayersParam({ workspace_name: 'ws_flood', layer_name: 'ws_flood:vec_point' }),
    'ws_flood:vec_point',
    'Cleans duplicate workspace prefix when layer_name already has ws:'
  );
  assert.strictEqual(
    resolveWmsLayersParam({ wms_layers_param: 'ws_flood:ws_flood:vec_point' }),
    'ws_flood:vec_point',
    'Cleans duplicate workspace prefix in explicit wms_layers_param'
  );
  console.log('✓ resolveWmsLayersParam tests passed');
}

// Test 2: resolveWmsUrl
{
  assert.strictEqual(
    resolveWmsUrl({ wms_url: 'http://localhost:8080/geoserver/wms?service=wms' }),
    'http://localhost:8080/geoserver/wms',
    'Cleans existing query params'
  );
  assert.strictEqual(
    resolveWmsUrl({ url: 'http://localhost:8080/geoserver/wms/' }),
    'http://localhost:8080/geoserver/wms',
    'Cleans trailing slash'
  );
  console.log('✓ resolveWmsUrl tests passed');
}

// Test 3: resolveWmsStyleParam (ADM-005)
{
  assert.strictEqual(
    resolveWmsStyleParam({ style_name: 'weir_purple_style' }),
    'weir_purple_style',
    'Resolves style_name'
  );
  assert.strictEqual(
    resolveWmsStyleParam({ styles: 'weir_purple_style' }),
    'weir_purple_style',
    'Resolves styles property'
  );
  assert.strictEqual(resolveWmsStyleParam({}), '', 'Returns empty string if no style specified');
  console.log('✓ resolveWmsStyleParam tests passed');
}

// Test 4: normalizeBbox (ADM-003)
{
  // Array [minx, miny, maxx, maxy] -> [[south, west], [north, east]] = [[miny, minx], [maxy, maxx]]
  const arrBbox = [100.0, 13.5, 100.5, 14.0];
  const normalizedArr = normalizeBbox(arrBbox);
  assert.deepStrictEqual(
    normalizedArr,
    [[13.5, 100.0], [14.0, 100.5]],
    'Array bbox normalized to Leaflet [[lat, lng], [lat, lng]]'
  );

  // Dict { left, bottom, right, top }
  const dictBbox = { left: 100.1, bottom: 13.6, right: 100.6, top: 14.1 };
  const normalizedDict = normalizeBbox(dictBbox);
  assert.deepStrictEqual(
    normalizedDict,
    [[13.6, 100.1], [14.1, 100.6]],
    'Dictionary bbox normalized to Leaflet bounds'
  );

  // Projected UTM meters (e.g. Thailand EPSG:32647) -> Must return null to avoid Leaflet crash
  const projectedUtmBbox = [650000, 1500000, 660000, 1510000];
  assert.strictEqual(
    normalizeBbox(projectedUtmBbox),
    null,
    'Projected UTM coordinates return null to prevent Leaflet crash'
  );

  assert.strictEqual(normalizeBbox(null), null, 'Null bbox returns null');
  console.log('✓ normalizeBbox tests passed');
}

// Test 5: buildWmsLayerConfig (USR-012, ADM-005, ADM-003)
{
  const layer = {
    id: 42,
    workspace_name: 'flowgis',
    store_name: 'ana_p1_floodrisk_2026',
    style_name: 'risk_colormap_v2',
    updated_at: '2026-10-01T21:00:00Z',
    bbox: [100.0, 13.5, 100.5, 14.0],
    wms_url: 'http://localhost:8080/geoserver/wms'
  };

  const config = buildWmsLayerConfig(layer);
  assert.strictEqual(config.layers, 'flowgis:ana_p1_floodrisk_2026', 'Layer name correctly resolved');
  assert.strictEqual(config.styles, 'risk_colormap_v2', 'Style param correctly configured');
  assert.strictEqual(
    config.url,
    'http://localhost:8080/geoserver/wms?_v=2026-10-01T21%3A00%3A00Z',
    'Deterministic cache buster attached to URL'
  );
  assert.deepStrictEqual(
    config.bounds,
    [[13.5, 100.0], [14.0, 100.5]],
    'Leaflet bounds correctly included in config'
  );

  console.log('✓ buildWmsLayerConfig tests passed');
}

console.log('🎉 ALL wmsHelper regression tests passed successfully!');

// Test WMS visibility state independently from the GEE preview map state.
{
  const mapLayers = new Set();
  const map = {
    hasLayer: (layer) => mapLayers.has(layer),
    removeLayer: (layer) => mapLayers.delete(layer),
  };
  const managedLayers = new Map();
  let layerCreations = 0;
  const createTrackedLayer = () => {
    layerCreations += 1;
    const trackedLayer = {
      addTo: () => mapLayers.add(trackedLayer),
      setOpacity: () => {},
    };
    return trackedLayer;
  };
  const savedWms = { id: 'saved-1', layer_name: 'analysis:floodrisk_1' };

  syncWmsLayers(map, managedLayers, { 'user:saved-1': savedWms }, createTrackedLayer);
  assert.strictEqual(mapLayers.size, 1, 'Checking Analysis Results adds WMS to Leaflet map');

  syncWmsLayers(map, managedLayers, {}, createTrackedLayer);
  assert.strictEqual(mapLayers.size, 0, 'Unchecking Analysis Results removes WMS from Leaflet map');
  assert.strictEqual(managedLayers.size, 0, 'Unchecking removes its managed key');

  syncWmsLayers(map, managedLayers, { 'user:saved-1': savedWms }, createTrackedLayer);
  syncWmsLayers(map, managedLayers, {}, createTrackedLayer);
  syncWmsLayers(map, managedLayers, { 'user:saved-1': savedWms }, createTrackedLayer);
  assert.strictEqual(layerCreations, 3, 'Repeated off/on transitions create only one WMS per enabled transition');
  assert.strictEqual(mapLayers.size, 1, 'Repeated toggles leave exactly one WMS active');

  clearWmsLayers(map, managedLayers);
  assert.strictEqual(mapLayers.size, 0, 'Unmount cleanup removes all managed WMS instances');
  console.log('✓ WMS Analysis Results on/off regression test passed');
}
