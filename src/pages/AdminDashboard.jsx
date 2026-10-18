import React, { useState, useEffect } from 'react';
import { Lightbulb, MapPin, Maximize2, Minimize2, Layers, Video, Users, ChevronDown, ChevronUp, Table } from 'lucide-react';
import AdminSidebar from '@/components/AdminComponents/AdminSidebar';
import AdminHeader from '@/components/AdminComponents/AdminHeader';
import AdminMapLeaflet from '@/components/AdminComponents/AdminMapLeaflet';
import FacilitySummaryCards from '@/components/AdminComponents/FacilitySummaryCards';
import PublicFacilityForm from '@/components/AdminComponents/PublicFacilityForm';
import PublicFacilityTable from '@/components/AdminComponents/PublicFacilityTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import GeosocialTable from '@/components/AdminComponents/GeosocialTable';
import GeosocialForm from '@/components/AdminComponents/GeosocialForm';
import GeosocialStyleModal from '@/components/AdminComponents/GeosocialStyleModal';
import GeosocialLayerGroupManager from '@/components/AdminComponents/GeosocialLayerGroupManager';
import CctvManagement from '@/components/AdminComponents/CctvManagement';
import UserManagement from '@/components/AdminComponents/UserManagement';
import CctvStreamModal from '@/components/AdminComponents/CctvStreamModal';
import { geosocialService } from '@/services/geosocialService';
import { cctvService } from '@/services/cctvService';
import { facilityService } from '@/services/facilityService';
import { useNotification } from '@/context/NotificationContext';
import ErrorBoundary from '@/components/commons/ErrorBoundary';
import Loader from '@/components/commons/Loader';

const DEFAULT_FACILITIES = [
  { id: 1, name: 'Bangmod Central', category: 'Hospital', lat: 13.651, lng: 100.495, cctvLink: '', cctvPassword: '' },
  { id: 2, name: 'Water Station Thung Khru', category: 'Water Station', lat: 13.645, lng: 100.502, cctvLink: '', cctvPassword: '' },
  { id: 3, name: 'Phra Pathom Chedi Clinic', category: 'Hospital', lat: 13.8189, lng: 100.0617, cctvLink: '', cctvPassword: '' },
];

export default function AdminDashboard() {
  const { notify } = useNotification();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isPickMode, setIsPickMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [editingFacility, setEditingFacility] = useState(null);
  const [adminLoading, setAdminLoading] = useState(null);

  // State untuk Buka-Tutup Panel Tabel List Data
  const [isTableOpen, setIsTableOpen] = useState(true);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fitur Full Map interaktif
  const [isFullMap, setIsFullMap] = useState(false);

  // WMS Layer yang sedang aktif ditampilkan di atas peta Leaflet
  const [activeWmsLayer, setActiveWmsLayer] = useState(null);

  // Modal Video Stream CCTV
  const [activeCctvModal, setActiveCctvModal] = useState(null);

  // Modal Styling Layer Spasial (SLD)
  const [stylingLayer, setStylingLayer] = useState(null);

  // Fasilitas Publik (Hospitals, Water Stations, etc.)
  const [facilities, setFacilities] = useState(() => {
    try {
      const saved = localStorage.getItem('flowgis_admin_facilities');
      return saved ? JSON.parse(saved) : DEFAULT_FACILITIES;
    } catch {
      return DEFAULT_FACILITIES;
    }
  });

  // CCTV Stations dari database
  const [cctvs, setCctvs] = useState([]);

  // Data layer spasial geosocial dari database/GeoServer
  const [geosocialList, setGeosocialList] = useState([]);
  const [isGeosocialLoading, setIsGeosocialLoading] = useState(false);

  const fetchFacilitiesData = async () => {
    try {
      const data = await facilityService.getAllFacilities();
      if (Array.isArray(data) && data.length > 0) {
        setFacilities(data);
      }
    } catch (e) {
      console.warn('Using local facilities cache:', e);
    }
  };

  const fetchCctvsData = async () => {
    try {
      const data = await cctvService.getCctvs();
      setCctvs(data);
    } catch (e) {
      console.warn('Using local CCTV cache:', e);
    }
  };

  const fetchGeosocialLayers = async () => {
    setIsGeosocialLoading(true);
    try {
      const data = await geosocialService.getAllLayers();
      if (Array.isArray(data) && data.length > 0) {
        setGeosocialList(data);
        // ADM-003: Auto-select dan preview layer pertama jika belum ada layer aktif yang dipilih
        setActiveWmsLayer((current) => {
          if (!current && data[0]) {
            const first = data[0];
            return {
              id: first.id,
              url: first.url,
              layer_name: first.layer_name || first.layer_key,
              display_name: first.display_name || first.name || 'WMS Layer',
              minx: first.minx,
              miny: first.miny,
              maxx: first.maxx,
              maxy: first.maxy,
              bbox: first.bbox,
              styles: first.style_name || first.styles,
              _v: first.updated_at || Date.now(),
            };
          }
          return current;
        });
      } else {
        setGeosocialList([
          { id: 1, name: 'Population Density Map of Flood-Prone Areas', layer_key: 'geosocial:population_density', type: 'VECTOR', date: '15 Jan 2026', size: '2.4 MB', is_active: true },
          { id: 2, name: 'Administrative Boundaries of the Subdistrict', layer_key: 'nakhon_pathom:administrative_line', type: 'VECTOR', date: '10 Feb 2026', size: '8.1 MB', is_active: true },
          { id: 3, name: 'Surface Temperature DEM Raster', layer_key: 'geosocial:dem_surface', type: 'WMS', date: '01 Mar 2026', size: '14.5 MB', is_active: false },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch geosocial layers:', err);
    } finally {
      setIsGeosocialLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilitiesData();
    fetchCctvsData();
    fetchGeosocialLayers();
  }, []);

  // Keyboard shortcut Esc untuk keluar dari Full Map
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullMap) {
        setIsFullMap(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullMap]);

  useEffect(() => {
    try {
      localStorage.setItem('flowgis_admin_facilities', JSON.stringify(facilities));
    } catch (e) {
      console.error('Failed to save facilities to localStorage', e);
    }
  }, [facilities]);

  const handleAddFacility = async (newFac) => {
    setAdminLoading({
      message: 'Adding Public Facilities...',
      subtitle: `Saving facilities "${newFac.name}" to the database...`,
      stages: [
        { time: 0, text: 'Verifying facility coordinates and attributes...' },
        { time: 2, text: 'Storing facility entities in a PostGIS database...' },
      ],
    });
    try {
      const res = await facilityService.createFacility(newFac);
      const created = res.data || newFac;
      setFacilities((prev) => [created, ...prev]);
      notify.success(`Facilities "${newFac.name}" successfully added!`);
    } catch (err) {
      setFacilities((prev) => [newFac, ...prev]);
      notify.success(`Facilities "${newFac.name}" successfully saved!`);
    } finally {
      setAdminLoading(null);
    }
    setSelectedLocation(null);
  };

  const handleDeleteFacility = async (id) => {
    setAdminLoading({
      message: 'Removing Public Facilities...',
      subtitle: 'Deleting facility data from the database...',
      stages: [
        { time: 0, text: 'Processing a deletion request...' },
        { time: 2, text: 'Deleting facility data from the database...' },
      ],
    });
    try {
      await facilityService.deleteFacility(id);
      notify.success('Public facilities have been successfully removed!');
    } catch (e) {
      notify.error('Failed to remove public facilities from the database');
    } finally {
      setAdminLoading(null);
    }
    setFacilities((prev) => prev.filter((f) => f.id !== id));
  };

  const handleEditFacility = async (id, updatedData) => {
    setAdminLoading({
      message: 'Upgrading Public Facilities...',
      subtitle: `Saving data changes "${updatedData.name || 'facilities'}"...`,
      stages: [
        { time: 0, text: 'Validating facility data changes...' },
        { time: 2, text: 'Saving data updates to the database...' },
      ],
    });
    try {
      await facilityService.updateFacility(id, updatedData);
      notify.success('Public facility data has been successfully updated!');
    } catch (err) {
      console.warn('API updateFacility failed, updating state:', err);
      notify.error('Failed to update public facilities on the server');
    } finally {
      setAdminLoading(null);
    }
    setFacilities((prev) => prev.map((f) => (f.id === id ? { ...f, ...updatedData } : f)));
  };

  const handleMapClick = (coords) => {
    setSelectedLocation(coords);
  };

  const handleAddGeosocial = (newEntry) => {
    setGeosocialList((prev) => [newEntry, ...prev.filter((x) => x.id !== newEntry.id)]);
    // Langsung aktifkan WMS di peta
    handleSelectLayerToView(newEntry);
    notify.success(`Layer "${newEntry.name || newEntry.display_name}" Uploaded successfully!`);
  };

  const handleDeleteGeosocial = async (id) => {
    const target = geosocialList.find((item) => item.id === id);
    setAdminLoading({
      message: 'Deleting a Spatial Layer...',
      subtitle: `Delete "${target?.display_name || target?.name || 'layer'}" from GeoServer and the database...`,
      stages: [
        { time: 0, text: 'Connecting to the GeoServer REST API...' },
        { time: 2, text: 'Deleting PostGIS layers, datastores, and tables...' },
        { time: 4, text: 'Synchronizing the spatial layer catalog...' },
      ],
    });
    try {
      await geosocialService.deleteLayer(id);
      notify.success('The spatial layer was successfully removed from the system!');
    } catch (err) {
      console.warn('API delete layer failed, updating local state:', err);
      notify.error('Failed to delete the layer from the server');
    } finally {
      setAdminLoading(null);
    }
    setGeosocialList((prev) => prev.filter((item) => item.id !== id));
    if (activeWmsLayer && activeWmsLayer.id === id) {
      setActiveWmsLayer(null);
    }
  };

  const handleSaveEditGeosocial = async (id, newName) => {
    setAdminLoading({
      message: 'Updating a Layer Name...',
      subtitle: `Saving a name "${newName}" into the system...`,
      stages: [
        { time: 0, text: 'Saving layer names to the database...' },
      ],
    });
    try {
      await geosocialService.updateLayer(id, newName);
      notify.success('The layer name was successfully updated!');
    } catch (err) {
      console.warn('API update layer failed, updating local state:', err);
      notify.error('Failed to update the layer name on the server');
    } finally {
      setAdminLoading(null);
    }
    setGeosocialList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName, display_name: newName } : item))
    );
  };

  const handleToggleStatusGeosocial = async (id) => {
    setAdminLoading({
      message: 'Changing the Layer Status...',
      subtitle: 'Synchronizing the publication status of spatial layers...',
      stages: [
        { time: 0, text: 'Update the layer status in the database...' },
      ],
    });
    try {
      await geosocialService.toggleActive(id);
      notify.info('The active layer status has been successfully changed!');
    } catch (err) {
      console.warn('API toggle layer status failed, toggling local state:', err);
      notify.error('Failed to change the layer status on the server');
    } finally {
      setAdminLoading(null);
    }
    setGeosocialList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_active: !item.is_active } : item))
    );
  };

  const handleSaveLayerStyle = async (layerId, styleData) => {
    setAdminLoading({
      message: 'Saving a Style Layer (SLD)...',
      subtitle: 'Creating XML/SLD styles and updating GeoServer...',
      stages: [
        { time: 0, text: 'Setting SLD properties (Fill, Stroke, Opacity)...' },
        { time: 2, text: 'Uploading SLD to GeoServer REST...' },
        { time: 4, text: 'Synchronizing the WMS map layer cache...' },
      ],
    });
    try {
      const res = await geosocialService.updateStyle(layerId, styleData);
      const styleName = res?.data?.style_name || res?.style_name || styleData.style_name;
      const updatedAt = res?.data?.updated_at || res?.updated_at || new Date().toISOString();

      const returnedConfig = res?.data?.style_config || styleData;

      setGeosocialList((prev) =>
        prev.map((item) => (item.id === layerId ? { 
          ...item, 
          legend_url: styleData.fill_color,
          style_name: styleName || item.style_name,
          style_config: returnedConfig,
          updated_at: updatedAt
        } : item))
      );
      // Refresh WMS layer di Leaflet peta admin jika layer yang diedit sedang aktif ditampilkan
      setActiveWmsLayer((prev) => {
        if (prev && prev.id === layerId) {
          return { 
            ...prev, 
            style_name: styleName || prev.style_name,
            styles: styleName || prev.styles,
            _v: updatedAt,
            _t: Date.now() 
          };
        }
        return prev;
      });
      notify.success('The style layer has been successfully updated in GeoServer!');
      return res;
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Failed to update the layer style in GeoServer');
      throw err;
    } finally {
      setAdminLoading(null);
    }
  };

  // Preview layer group geosocial di peta admin (group = satu layer WMS gabungan)
  const handleViewGroup = (group) => {
    if (!group) {
      setActiveWmsLayer((current) => (current?.groupId ? null : current));
      return;
    }
    setActiveWmsLayer({
      id: `group_${group.id}`,
      groupId: group.id,
      url: group.wms_url,
      wms_layers_param: group.wms_layers_param,
      display_name: group.title || group.name,
      bbox: group.bbox,
      _v: Date.now(),
    });
    document.getElementById('admin-leaflet-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Saat admin mengklik "Tampilkan di Peta" pada tabel Geosocial
  const handleSelectLayerToView = (layer) => {
    const rawWmsUrl = layer.url || 'http://localhost:8080/geoserver/wms';
    const layerName = layer.layer_name || layer.layer_key;

    setActiveWmsLayer({
      id: layer.id,
      url: rawWmsUrl,
      layer_name: layerName,
      display_name: layer.display_name || layer.name || 'WMS Layer',
      minx: layer.minx,
      miny: layer.miny,
      maxx: layer.maxx,
      maxy: layer.maxy,
      bbox: layer.bbox,
      styles: layer.style_name || layer.styles,
      _v: layer.updated_at || Date.now(),
    });

    const mapElem = document.getElementById('admin-leaflet-card');
    if (mapElem) {
      mapElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <AdminSidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />

        <ErrorBoundary>
          <main className="p-3 sm:p-4 md:p-6 flex-1 space-y-4 sm:space-y-6 overflow-y-auto">
          
          {/* Summary Cards untuk Fasilitas jika di menu facilities */}
          {activeMenu === 'facilities' && (
            <FacilitySummaryCards facilities={facilities} />
          )}

          {/* Bagian Peta Leaflet Utama & Form (Dashboard, Geosocial, Facilities) */}
          {(activeMenu === 'dashboard' || activeMenu === 'geosocial' || activeMenu === 'facilities') && (
            <div className="space-y-4 sm:space-y-6">
              
              {activeMenu === 'dashboard' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-bold text-gray-800">235</h4>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">Total Execution Analysis</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-bold text-gray-800">{facilities.length}</h4>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">Registered Public Facilities</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-bold text-gray-800">{cctvs.length}</h4>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">CCTV Camera Telemetry</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-bold text-gray-800">
                          {geosocialList.filter((l) => l.is_active !== false).length}
                          <span className="text-sm font-normal text-gray-400"> / {geosocialList.length}</span>
                        </h4>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">Active Geosocial Spatial Layer</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div 
                className={
                  isFullMap 
                    ? "fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-2 sm:p-5 flex flex-col animate-in fade-in duration-200" 
                    : "w-full"
                } 
                id="admin-leaflet-card"
              >
                <Card className={`border-border/60 shadow-sm bg-white overflow-hidden flex flex-col ${isFullMap ? 'h-full flex-1 rounded-2xl shadow-2xl border-slate-700' : ''}`}>
                  <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-2 border-b border-gray-100 shrink-0 gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                        <span>Telemetry Monitoring Map & Spatial Layers</span>
                        {/* {isFullMap && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                            Full Screen (Full View)
                          </span>
                        )} */}
                      </CardTitle>
                      <CardDescription className="text-[11px] sm:text-xs text-gray-500 truncate">
                        Displaying CCTV stations, public facilities, and the AstraGIS GeoServer WMS layer overlay
                      </CardDescription>
                    </div>
                    {/* <Button 
                      size="sm" 
                      variant={isFullMap ? "default" : "outline"}
                      onClick={() => setIsFullMap((prev) => !prev)}
                      className={`h-8 gap-1.5 text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-all ${
                        isFullMap 
                          ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                          : 'hover:bg-slate-100 text-gray-700'
                      }`}
                      title={isFullMap ? "Keluar dari Layar Penuh (Esc)" : "Perbesar Peta Layar Penuh"}
                    >
                      {isFullMap ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" /> 
                          <span>Exit Full Map</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" /> 
                          <span>Full Map</span>
                        </>
                      )}
                    </Button> */}
                  </CardHeader>
                  <CardContent className={`p-2 sm:p-3 relative ${isFullMap ? 'flex-1 h-full min-h-0' : 'h-80 sm:h-[420px] md:h-[480px]'}`}>
                    <AdminMapLeaflet
                      facilities={facilities}
                      cctvStations={cctvs}
                      activeWmsLayer={activeWmsLayer}
                      onRemoveWmsLayer={() => setActiveWmsLayer(null)}
                      selectedLocation={selectedLocation}
                      onMapClick={handleMapClick}
                      isPickMode={isPickMode}
                      onWatchCctv={(st) => setActiveCctvModal(st)}
                    />
                  </CardContent>
                </Card>
              </div>

              {(activeMenu === 'geosocial' || activeMenu === 'facilities') && (
                <div className="w-full">
                  {activeMenu === 'geosocial' && (
                    <GeosocialForm onAddLayer={handleAddGeosocial} />
                  )}

                  {activeMenu === 'facilities' && (
                    <PublicFacilityForm
                      onAddFacility={handleAddFacility}
                      onEditFacility={handleEditFacility}
                      selectedLocation={selectedLocation}
                      isPickMode={isPickMode}
                      setIsPickMode={setIsPickMode}
                      editingFacility={editingFacility}
                      setEditingFacility={setEditingFacility}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Konten Halaman Khusus Menu CCTV Stations */}
          {activeMenu === 'cctv' && (
            <CctvManagement
              facilities={facilities}
              onCctvChanged={fetchCctvsData}
              selectedLocation={selectedLocation}
            />
          )}

          {/* Konten Halaman Khusus Menu User Management */}
          {activeMenu === 'users' && (
            <UserManagement />
          )}

          {/* Tabel Fasilitas Publik dalam bentuk Panel Buka-Tutup */}
          {activeMenu === 'facilities' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-border/60 shadow-sm">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-bold text-gray-800">
                    Public Facility Data Table ({facilities.length} items)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTableOpen((prev) => !prev)}
                  className="h-8 text-xs font-semibold text-gray-600 hover:text-teal-700 flex items-center gap-1.5"
                >
                  <span>{isTableOpen ? 'Hide Panel' : 'Show Panel'}</span>
                  {isTableOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
              {isTableOpen && (
                <PublicFacilityTable
                  facilities={facilities}
                  onDeleteFacility={handleDeleteFacility}
                  onStartEdit={(fac) => setEditingFacility(fac)}
                />
              )}
            </div>
          )}

          {/* Tabel Layer Geosocial dalam bentuk Panel Buka-Tutup */}
          {activeMenu === 'geosocial' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-border/60 shadow-sm">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-bold text-gray-800">
                    Geosocial Spatial Layer List ({geosocialList.length} layers)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsTableOpen((prev) => !prev)}
                  className="h-8 text-xs font-semibold text-gray-600 hover:text-teal-700 flex items-center gap-1.5"
                >
                  <span>{isTableOpen ? 'Hide Panel' : 'Show Panel'}</span>
                  {isTableOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
              {isTableOpen && (
                <GeosocialTable
                  geosocialList={geosocialList}
                  isLoading={isGeosocialLoading}
                  onDeleteLayer={handleDeleteGeosocial}
                  onSaveEdit={handleSaveEditGeosocial}
                  onToggleStatus={handleToggleStatusGeosocial}
                  onSelectLayerToView={handleSelectLayerToView}
                  onOpenStyleModal={(layer) => setStylingLayer(layer)}
                />
              )}
              <GeosocialLayerGroupManager
                geosocialList={geosocialList}
                viewingGroupId={activeWmsLayer?.groupId ?? null}
                onViewGroup={handleViewGroup}
              />
            </div>
          )}

          </main>
        </ErrorBoundary>
      </div>

      {/* Global CCTV Stream Modal */}
      {activeCctvModal && (
        <CctvStreamModal
          station={activeCctvModal}
          isOpen={!!activeCctvModal}
          onClose={() => setActiveCctvModal(null)}
        />
      )}

      {/* Modal Pengaturan & Edit Styling Layer (SLD / OGC GeoServer) */}
      {stylingLayer && (
        <GeosocialStyleModal
          isOpen={!!stylingLayer}
          onClose={() => setStylingLayer(null)}
          layer={stylingLayer}
          onSaveStyle={handleSaveLayerStyle}
        />
      )}

      {/* Global Loader untuk Operasi CRUD Admin */}
      {adminLoading && (
        <Loader
          message={adminLoading.message}
          subtitle={adminLoading.subtitle}
          stages={adminLoading.stages}
          mode={adminLoading.mode}
          progress={adminLoading.progress}
        />
      )}
    </div>
  );
}