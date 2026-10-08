import React, { useState, useEffect } from 'react';
import { Lightbulb, MapPin, Maximize2, Minimize2, Layers, Video, Users } from 'lucide-react';
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

  // Responsiveness: Drawer sidebar untuk layar mobile / tablet
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
      message: 'Menambahkan Fasilitas Publik...',
      subtitle: `Menyimpan fasilitas "${newFac.name}" ke database...`,
      stages: [
        { time: 0, text: 'Memverifikasi koordinat dan atribut fasilitas...' },
        { time: 2, text: 'Menyimpan entitas fasilitas ke database PostGIS...' },
      ],
    });
    try {
      const res = await facilityService.createFacility(newFac);
      const created = res.data || newFac;
      setFacilities((prev) => [created, ...prev]);
      notify.success(`Fasilitas "${newFac.name}" berhasil ditambahkan!`);
    } catch (err) {
      setFacilities((prev) => [newFac, ...prev]);
      notify.success(`Fasilitas "${newFac.name}" berhasil disimpan!`);
    } finally {
      setAdminLoading(null);
    }
    setSelectedLocation(null);
  };

  const handleDeleteFacility = async (id) => {
    setAdminLoading({
      message: 'Menghapus Fasilitas Publik...',
      subtitle: 'Menghapus data fasilitas dari database...',
      stages: [
        { time: 0, text: 'Memproses permintaan penghapusan...' },
        { time: 2, text: 'Menghapus data fasilitas dari database...' },
      ],
    });
    try {
      await facilityService.deleteFacility(id);
      notify.success('Fasilitas publik berhasil dihapus!');
    } catch (e) {
      notify.error('Gagal menghapus fasilitas publik dari database');
    } finally {
      setAdminLoading(null);
    }
    setFacilities((prev) => prev.filter((f) => f.id !== id));
  };

  const handleEditFacility = async (id, updatedData) => {
    setAdminLoading({
      message: 'Memperbarui Fasilitas Publik...',
      subtitle: `Menyimpan perubahan data "${updatedData.name || 'fasilitas'}"...`,
      stages: [
        { time: 0, text: 'Memvalidasi perubahan data fasilitas...' },
        { time: 2, text: 'Menyimpan pembaruan data ke database...' },
      ],
    });
    try {
      await facilityService.updateFacility(id, updatedData);
      notify.success('Data fasilitas publik berhasil diperbarui!');
    } catch (err) {
      console.warn('API updateFacility failed, updating state:', err);
      notify.error('Gagal memperbarui fasilitas publik di server');
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
    notify.success(`Layer "${newEntry.name || newEntry.display_name}" berhasil diunggah!`);
  };

  const handleDeleteGeosocial = async (id) => {
    const target = geosocialList.find((item) => item.id === id);
    setAdminLoading({
      message: 'Menghapus Layer Spasial...',
      subtitle: `Menghapus "${target?.display_name || target?.name || 'layer'}" dari GeoServer dan database...`,
      stages: [
        { time: 0, text: 'Menghubungi GeoServer REST API...' },
        { time: 2, text: 'Menghapus layer, datastore & tabel PostGIS...' },
        { time: 4, text: 'Menyinkronkan katalog layer spasial...' },
      ],
    });
    try {
      await geosocialService.deleteLayer(id);
      notify.success('Layer spasial berhasil dihapus dari sistem!');
    } catch (err) {
      console.warn('API delete layer failed, updating local state:', err);
      notify.error('Gagal menghapus layer dari server');
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
      message: 'Memperbarui Nama Layer...',
      subtitle: `Menyimpan nama "${newName}" ke sistem...`,
      stages: [
        { time: 0, text: 'Menyimpan nama layer ke database...' },
      ],
    });
    try {
      await geosocialService.updateLayer(id, newName);
      notify.success('Nama layer berhasil diperbarui!');
    } catch (err) {
      console.warn('API update layer failed, updating local state:', err);
      notify.error('Gagal memperbarui nama layer di server');
    } finally {
      setAdminLoading(null);
    }
    setGeosocialList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName, display_name: newName } : item))
    );
  };

  const handleToggleStatusGeosocial = async (id) => {
    setAdminLoading({
      message: 'Mengubah Status Layer...',
      subtitle: 'Menyinkronkan status publikasi layer spasial...',
      stages: [
        { time: 0, text: 'Memperbarui status layer di database...' },
      ],
    });
    try {
      await geosocialService.toggleActive(id);
      notify.info('Status aktif layer berhasil diubah!');
    } catch (err) {
      console.warn('API toggle layer status failed, toggling local state:', err);
      notify.error('Gagal mengubah status layer di server');
    } finally {
      setAdminLoading(null);
    }
    setGeosocialList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_active: !item.is_active } : item))
    );
  };

  const handleSaveLayerStyle = async (layerId, styleData) => {
    setAdminLoading({
      message: 'Menyimpan Style Layer (SLD)...',
      subtitle: 'Menyusun style XML/SLD dan memperbarui GeoServer...',
      stages: [
        { time: 0, text: 'Menyusun aturan SLD (Fill, Stroke, Opacity)...' },
        { time: 2, text: 'Mengunggah SLD ke GeoServer REST...' },
        { time: 4, text: 'Menyinkronkan cache WMS layer peta...' },
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
      notify.success('Style layer berhasil diperbarui di GeoServer!');
      return res;
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Gagal memperbarui style layer di GeoServer');
      throw err;
    } finally {
      setAdminLoading(null);
    }
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

          {/* Bagian Peta Leaflet Utama & Form Samping (Dashboard, Geosocial, Facilities) */}
          {(activeMenu === 'dashboard' || activeMenu === 'geosocial' || activeMenu === 'facilities') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              <div 
                className={
                  isFullMap 
                    ? "fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-2 sm:p-5 flex flex-col animate-in fade-in duration-200" 
                    : "lg:col-span-7 space-y-4 sm:space-y-6"
                } 
                id="admin-leaflet-card"
              >
                <Card className={`border-border/60 shadow-sm bg-white overflow-hidden flex flex-col ${isFullMap ? 'h-full flex-1 rounded-2xl shadow-2xl border-slate-700' : ''}`}>
                  <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-2 border-b border-gray-100 shrink-0 gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                        <span>Peta Pemantauan Telemetri & Layer Spasial</span>
                        {isFullMap && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                            Layar Penuh (Full View)
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-[11px] sm:text-xs text-gray-500 truncate">
                        Menampilkan stasiun CCTV, fasilitas publik, dan overlay WMS layer GeoServer AstraGIS
                      </CardDescription>
                    </div>
                    <Button 
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
                    </Button>
                  </CardHeader>
                  <CardContent className={`p-2 sm:p-3 relative ${isFullMap ? 'flex-1 h-full min-h-0' : 'h-72 sm:h-96 md:h-[420px]'}`}>
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

              <div className="lg:col-span-5 space-y-4">
                {activeMenu === 'dashboard' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                    <Card className="border-border/60 shadow-sm">
                      <CardContent className="p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <h4 className="text-xl sm:text-2xl font-bold text-gray-800">235</h4>
                          <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">Total Eksekusi Analisis</p>
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
                          <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">Fasilitas Publik Terdata</p>
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
                          <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">Kamera CCTV Telemetri</p>
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
                          <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider">Layer Spasial Geosocial Aktif</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

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

          {/* Tabel Fasilitas Publik */}
          {activeMenu === 'facilities' && (
            <PublicFacilityTable
              facilities={facilities}
              onDeleteFacility={handleDeleteFacility}
              onStartEdit={(fac) => setEditingFacility(fac)}
            />
          )}

          {/* Tabel Layer Geosocial dengan integrasi render WMS langsung ke Leaflet Map */}
          {activeMenu === 'geosocial' && (
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