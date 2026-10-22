/**
 * Centralized WMS Helper for FlowGIS
 * Enforces DRY principles, deterministic versioned cache-busting,
 * robust layer naming resolution, and safe CRS/Bounding Box normalization.
 */

const DEFAULT_GEOSERVER_WMS = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_GEOSERVER_WMS_URL) || 'http://localhost:8080/geoserver/wms';

function cleanDuplicateWorkspace(param) {
  if (!param || typeof param !== 'string') return '';
  const trimmed = param.trim();
  const parts = trimmed.split(':');
  // Jika workspace berulang seperti ws_flood:ws_flood:vec_point
  if (parts.length >= 3 && parts[0] === parts[1]) {
    return `${parts[0]}:${parts.slice(2).join(':')}`;
  }
  return trimmed;
}

/**
 * Normalizes a layer key or technical name by stripping workspace prefix,
 * trimming, lowercasing, and removing non-alphanumeric/underscore chars.
 */
export function normalizeLayerKey(key) {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  const withoutWs = trimmed.includes(':') ? trimmed.split(':').pop() : trimmed;
  return withoutWs.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

/**
 * Resolves the WMS layers parameter cleanly from diverse layer schemas:
 * - layer.wms_layers_param (legacy explicit param)
 * - workspace_name:store_name (raster coverage stores)
 * - workspace_name:layer_name (vector feature types)
 * - geoserver_name / layer_key / layer_name
 */
export function resolveWmsLayersParam(layer) {
  if (!layer) return '';
  if (layer.wms_layers_param) return cleanDuplicateWorkspace(layer.wms_layers_param);

  const ws = layer.workspace_name;
  const store = layer.store_name || layer.geoserver_name;
  const lyrName = layer.layer_name || layer.name;

  if (ws && store) {
    if (store.startsWith(`${ws}:`)) return cleanDuplicateWorkspace(store);
    return cleanDuplicateWorkspace(`${ws}:${store}`);
  }
  if (ws && lyrName) {
    if (lyrName.startsWith(`${ws}:`)) return cleanDuplicateWorkspace(lyrName);
    return cleanDuplicateWorkspace(`${ws}:${lyrName}`);
  }
  if (layer.geoserver_name) return cleanDuplicateWorkspace(layer.geoserver_name);
  if (layer.layer_key) return cleanDuplicateWorkspace(layer.layer_key);
  if (layer.layer_name) return cleanDuplicateWorkspace(layer.layer_name);
  if (layer.name) return cleanDuplicateWorkspace(layer.name);

  return '';
}

/**
 * Checks if a layer group has member layers to display.
 */
export function hasGroupMembers(group) {
  return (Array.isArray(group?.layers) && group.layers.length > 0)
    || (Array.isArray(group?.layer_ids) && group.layer_ids.length > 0);
}

/**
 * Alias for backward compatibility. Any group with members supports member visibility.
 */
export function isNamedGroup(group) {
  return hasGroupMembers(group);
}

/** Returns a copy of an active group entry with one member shown or hidden. */
export function toggleGroupMember(entry, layerId, visible) {
  const hidden = new Set((entry?.hidden_layer_ids || []).map(String));
  const idStr = String(layerId);
  if (visible) hidden.delete(idStr);
  else hidden.add(idStr);
  return { ...entry, hidden_layer_ids: [...hidden] };
}

/**
 * Resolves the WMS entry to draw for an active layer group, honouring
 * `hidden_layer_ids` (member layers the user switched off).
 * Returns null when every member is hidden so nothing is drawn.
 */
export function resolveGroupWmsEntry(group) {
  if (!group) return null;
  const members = group.layers || [];
  if (!members.length) return group;

  const hidden = new Set((group.hidden_layer_ids || []).map(String));
  if (hidden.size === 0) return group;

  const visibleMembers = members.filter((member, idx) => {
    const memberId = String(member.id ?? member.layer_id ?? member.geoserver_name ?? member.layer_name ?? idx);
    return !hidden.has(memberId);
  });

  if (visibleMembers.length === 0) return null;

  const visibleNames = visibleMembers
    .map(resolveWmsLayersParam)
    .filter(Boolean);

  if (visibleNames.length === 0) return null;
  return { ...group, wms_layers_param: visibleNames.join(',') };
}

/**
 * Checks whether a layer (from geosocialList or userAnalysisLayers) belongs
 * to any group in the provided group list. Matches by ID, technical name, or display name.
 */
export function isLayerInAnyGroup(layer, groups = []) {
  if (!layer || !Array.isArray(groups)) return false;

  const layerIdStr = String(layer.id ?? '');
  const layerNameNorm = normalizeLayerKey(layer.layer_name || layer.layer_key || layer.name || '');
  const displayNameNorm = normalizeLayerKey(layer.display_name || layer.title || '');

  return groups.some((group) => {
    // 1. Check in group.layer_ids
    const layerIds = (group?.layer_ids || []).map(String);
    if (layerIdStr && layerIds.includes(layerIdStr)) return true;
    if (layerNameNorm && layerIds.some((id) => normalizeLayerKey(id) === layerNameNorm)) return true;
    if (displayNameNorm && layerIds.some((id) => normalizeLayerKey(id) === displayNameNorm)) return true;

    // 2. Check in group.layers
    const members = group?.layers || [];
    return members.some((member) => {
      if (typeof member === 'string') {
        const norm = normalizeLayerKey(member);
        if (layerNameNorm && layerNameNorm === norm) return true;
        if (displayNameNorm && displayNameNorm === norm) return true;
        if (layerIdStr && member === layerIdStr) return true;
        return false;
      }

      const memberIdStr = String(member?.id ?? member?.layer_id ?? '');
      if (layerIdStr && memberIdStr && layerIdStr === memberIdStr) return true;

      const memGeoserverNorm = normalizeLayerKey(member?.geoserver_name || '');
      const memLayerNorm = normalizeLayerKey(member?.layer_name || member?.name || '');

      if (layerNameNorm && (layerNameNorm === memGeoserverNorm || layerNameNorm === memLayerNorm)) return true;
      if (displayNameNorm && (displayNameNorm === memGeoserverNorm || displayNameNorm === memLayerNorm)) return true;

      return false;
    });
  });
}

/**
 * Resolves a human-friendly display label for a group member using the layer catalog.
 */
export function resolveMemberDisplayName(member, catalog = []) {
  if (!member) return '';
  const memberObj = typeof member === 'string' ? { layer_name: member } : member;
  const memberIdStr = String(memberObj.id ?? memberObj.layer_id ?? '');
  const memGeoserverNorm = normalizeLayerKey(memberObj.geoserver_name || '');
  const memLayerNorm = normalizeLayerKey(memberObj.layer_name || memberObj.name || '');

  if (Array.isArray(catalog)) {
    const found = catalog.find((item) => {
      if (memberIdStr && String(item.id) === memberIdStr) return true;
      const itemNameNorm = normalizeLayerKey(item.layer_name || item.layer_key || item.name || '');
      if (itemNameNorm && (itemNameNorm === memGeoserverNorm || itemNameNorm === memLayerNorm)) return true;
      const itemDisplayNorm = normalizeLayerKey(item.display_name || item.title || '');
      if (itemDisplayNorm && (itemDisplayNorm === memGeoserverNorm || itemDisplayNorm === memLayerNorm)) return true;
      return false;
    });
    if (found) {
      return found.display_name || found.name || found.layer_name || memberObj.layer_name || memberObj.geoserver_name;
    }
  }

  const raw = memberObj.layer_name || memberObj.geoserver_name || memberObj.name || String(memberObj.id || '');
  if (raw && raw.includes('_')) {
    return raw.split(':').pop().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return raw;
}

/** Ids of every layer that already belongs to at least one layer group. */
export function collectGroupedLayerIds(groups = []) {
  const ids = new Set();
  groups.forEach((group) => {
    (group?.layer_ids || []).forEach((id) => {
      if (id !== undefined && id !== null) ids.add(String(id));
    });
    (group?.layers || []).forEach((member) => {
      if (member?.id !== undefined && member?.id !== null) ids.add(String(member.id));
      if (member?.layer_id !== undefined && member?.layer_id !== null) ids.add(String(member.layer_id));
    });
  });
  return ids;
}

/** Lower-cased `workspace:name` of every layer that belongs to at least one layer group. */
export function collectGroupedLayerNames(groups = []) {
  const names = new Set();
  groups.forEach((group) => {
    (group?.layers || []).forEach((member) => {
      const name = resolveWmsLayersParam(member);
      if (name) names.add(name.toLowerCase());
      if (member?.geoserver_name) names.add(member.geoserver_name.toLowerCase());
      if (member?.layer_name) names.add(member.layer_name.toLowerCase());
    });
  });
  return names;
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

  const rawBounds = layer.bbox || (layer.minx !== undefined ? [layer.minx, layer.miny, layer.maxx, layer.maxy] : null);
  const normalizedBounds = normalizeBbox(rawBounds);

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
