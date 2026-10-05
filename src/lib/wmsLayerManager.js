import { buildWmsLayerConfig } from './wmsHelper.js';

/** Synchronize Leaflet WMS instances with the currently enabled WMS entries. */
export function syncWmsLayers(map, currentLayers, wmsLayers, createLayer, configBuilder = buildWmsLayerConfig) {
  const incomingKeys = new Set(Object.keys(wmsLayers));

  currentLayers.forEach((entry, key) => {
    if (!incomingKeys.has(key)) {
      map.removeLayer(entry.leafletLayer);
      currentLayers.delete(key);
    }
  });

  Object.entries(wmsLayers).forEach(([key, layer]) => {
    const config = configBuilder(layer);
    if (!config) return;

    const existingEntry = currentLayers.get(key);
    if (existingEntry) {
      const hasChanged = existingEntry.versionKey !== config._v
        || existingEntry.layers !== config.layers
        || existingEntry.styles !== config.styles
        || existingEntry.url !== config.url;

      if (hasChanged) {
        map.removeLayer(existingEntry.leafletLayer);
        currentLayers.delete(key);
      } else {
        existingEntry.leafletLayer.setOpacity?.(config.opacity);
        return;
      }
    }

    const leafletLayer = createLayer(config);
    leafletLayer.addTo(map);
    currentLayers.set(key, {
      leafletLayer,
      versionKey: config._v,
      layers: config.layers,
      styles: config.styles,
      url: config.url,
    });
  });
}

/** Remove all managed Leaflet layers when the manager unmounts. */
export function clearWmsLayers(map, currentLayers) {
  currentLayers.forEach(({ leafletLayer }) => {
    if (map.hasLayer(leafletLayer)) {
      map.removeLayer(leafletLayer);
    }
  });
  currentLayers.clear();
}