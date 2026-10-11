import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { 
  Camera, 
  Video, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Radio, 
  Loader2, 
  AlertCircle,
  Link as LinkIcon,
  Shield,
  Search,
  Map,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Table
} from 'lucide-react';
import { cctvService } from '@/services/cctvService';
import { useNotification } from '@/context/NotificationContext';
import CctvStreamModal from './CctvStreamModal';
import AdminMapLeaflet from './AdminMapLeaflet';
import ConfirmModal from '@/components/popups/ConfirmModal';
import Loader from '@/components/commons/Loader';
import Pagination from '@/components/elements/Pagination';

export default function CctvManagement({ 
  facilities = [], 
  onCctvChanged,
  onPickMapLocation: propOnPickMapLocation,
  selectedLocation: propSelectedLocation
}) {
  const [cctvs, setCctvs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [activeModalCctv, setActiveModalCctv] = useState(null);
  const [editingCctv, setEditingCctv] = useState(null);
  const [saving, setSaving] = useState(false);

  // State Buka-Tutup Panel Tabel List Data CCTV
  const [isTableOpen, setIsTableOpen] = useState(true);

  // Hook global notifikasi toast
  const { notify } = useNotification();

  // Mode pemilih lokasi koordinat di peta Leaflet
  const [isPickMode, setIsPickMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isFullMap, setIsFullMap] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    station_code: '',
    name: '',
    location: '',
    stream_url: '',
    username: 'live',
    password: 'Live2025!',
    lat: '',
    lng: '',
  });

  const fetchCctvs = async () => {
    setLoading(true);
    try {
      const data = await cctvService.getCctvs();
      setCctvs(data);
    } catch (err) {
      console.error('Failed to load CCTVs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCctvs();
  }, []);

  // Update form koordinat jika ada prop selectedLocation dari luar
  useEffect(() => {
    if (propSelectedLocation) {
      setSelectedLocation(propSelectedLocation);
      setFormData((prev) => ({
        ...prev,
        lat: propSelectedLocation.lat,
        lng: propSelectedLocation.lng,
      }));
    }
  }, [propSelectedLocation]);

  // Sinkronisasi titik pin di peta jika formData.lat/lng terisi
  useEffect(() => {
    if (formData.lat && formData.lng && !isNaN(formData.lat) && !isNaN(formData.lng)) {
      setSelectedLocation({
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
      });
    }
  }, [formData.lat, formData.lng]);

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

  // Handler saat user mengklik peta untuk memilih koordinat
  const handleMapClick = (coords) => {
    setSelectedLocation(coords);
    setFormData((prev) => ({
      ...prev,
      lat: coords.lat.toFixed(6),
      lng: coords.lng.toFixed(6),
    }));
    setIsPickMode(false);
  };

  const handleStartEdit = (item) => {
    setEditingCctv(item);
    setFormData({
      station_code: item.station_code || '',
      name: item.name || '',
      location: item.location || '',
      stream_url: item.stream_url || '',
      username: item.username || 'live',
      password: item.password || 'Live2025!',
      lat: item.lat || '',
      lng: item.lng || '',
    });
    if (item.lat && item.lng) {
      setSelectedLocation({ lat: parseFloat(item.lat), lng: parseFloat(item.lng) });
    }
    // Scroll ke form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCctv(null);
    setFormData({
      station_code: '',
      name: '',
      location: '',
      stream_url: '',
      username: 'live',
      password: 'Live2025!',
      lat: '',
      lng: '',
    });
    setSelectedLocation(null);
    setIsPickMode(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lat || !formData.lng) {
      notify.error('Please specify the location coordinates first (you can click "Select a Point on the Map" or enter them manually)!');
      return;
    }

    const isEdit = !!editingCctv;
    setActionLoading({
      message: isEdit ? 'Updating the CCTV Camera...' : 'Adding a CCTV Camera...',
      subtitle: `Saving camera data "${formData.name}" to database...`,
      stages: [
        { time: 0, text: 'Verifying the RTSP/HLS stream configuration and coordinates...' },
        { time: 2, text: 'Saving the camera entity to the telemetry database...' },
      ],
    });
    setSaving(true);

    try {
      if (editingCctv) {
        await cctvService.updateCctv(editingCctv.id, formData);
        notify.success(`CCTV Camera "${formData.name}" successfully updated!`);
        handleCancelEdit();
      } else {
        await cctvService.createCctv(formData);
        notify.success(`New CCTV Camera "${formData.name}" Successfully added to the database!`);
        handleCancelEdit();
      }
      await fetchCctvs();
      if (onCctvChanged) onCctvChanged();
    } catch (err) {
      console.error('Error saving CCTV:', err);
      notify.error(err.response?.data?.message || err.message || 'Failed to save CCTV data');
    } finally {
      setSaving(false);
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (id) => {
    const target = cctvs.find((c) => c.id === id);
    setActionLoading({
      message: 'Changing the CCTV Camera Status...',
      subtitle: `Synchronize camera status "${target?.name || ''}"...`,
      stages: [
        { time: 0, text: 'Updating the camera operational status...' },
      ],
    });
    try {
      await cctvService.toggleActive(id);
      setCctvs((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
      );
      notify.info('The CCTV camera status has been successfully updated!');
      if (onCctvChanged) onCctvChanged();
    } catch (err) {
      console.error('Toggle status error:', err);
      notify.error('Failed to update the CCTV camera status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTarget) return;
    const target = confirmDeleteTarget;
    setConfirmDeleteTarget(null);
    setIsDeleting(true);
    setActionLoading({
      message: 'Removing a CCTV Camera...',
      subtitle: `Deleting a station "${target.name}" from the database...`,
      stages: [
        { time: 0, text: 'Processing a request to remove a station...' },
        { time: 2, text: 'Deleting CCTV data from the database...' },
      ],
    });
    try {
      await cctvService.deleteCctv(target.id);
      setCctvs((prev) => prev.filter((c) => c.id !== target.id));
      notify.success(`Camera "${target.name}" was successfully deleted from the database!`);
      if (onCctvChanged) onCctvChanged();
    } catch (err) {
      console.error('Delete error:', err);
      notify.error('Failed to delete CCTV footage');
    } finally {
      setIsDeleting(false);
      setActionLoading(null);
    }
  };

  const filteredCctvs = cctvs.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.station_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.location || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredCctvs.length / pageSize));

  // Reset ke halaman 1 jika pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Jaga agar halaman tidak out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedCctvs = filteredCctvs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* 3 Kartu Ringkasan CCTV */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Camera CCTV</p>
              <h4 className="text-xl font-bold text-gray-800">{cctvs.length}</h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 animate-pulse text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Active Camera / Live</p>
              <h4 className="text-xl font-bold text-gray-800">
                {cctvs.filter((c) => c.is_active !== false).length}
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Telemetry Region</p>
              <h4 className="text-xl font-bold text-gray-800">Nakhon Pathom</h4>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
      
        <div className={
          isFullMap 
            ? "fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-2 sm:p-5 flex flex-col animate-in fade-in duration-200" 
            : "w-full"
        }>
          <Card className={`border-border/60 shadow-sm bg-white overflow-hidden flex flex-col ${isFullMap ? 'h-full flex-1 rounded-2xl shadow-2xl border-slate-700' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-2 border-b border-gray-100 shrink-0 gap-2">
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-2">
                  <Map className="w-4 h-4 text-teal-600" />
                  <span>Map of CCTV Monitoring Stations</span>
                  {/* {isFullMap && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                      Full Screen
                    </span>
                  )} */}
                </CardTitle>
                <CardDescription className="text-[11px] sm:text-xs text-gray-500 truncate">
                  Visualization of the distribution of CCTV cameras in Nakhon Pathom. Click the button &quot;Select a Point on the Map&quot; to select station coordinates.
                </CardDescription>
              </div>

              {/* <Button
                type="button"
                size="sm"
                variant={isFullMap ? "default" : "outline"}
                onClick={() => setIsFullMap(!isFullMap)}
                className={`h-8 gap-1.5 text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-all ${
                  isFullMap ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'hover:bg-slate-100 text-gray-700'
                }`}
                title={isFullMap ? "Exit Full Screen (Esc)" : "Zoom In on the Map"}
              >
                {isFullMap ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" /> <span>Exit Full Map</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" /> <span>Full Map</span>
                  </>
                )}
              </Button> */}
            </CardHeader>
            <CardContent className={`p-2 sm:p-3 relative ${isFullMap ? 'flex-1 h-full min-h-0' : 'h-80 sm:h-[420px] md:h-[480px]'}`}>
              <AdminMapLeaflet
                facilities={facilities}
                cctvStations={cctvs}
                selectedLocation={selectedLocation}
                onMapClick={handleMapClick}
                isPickMode={isPickMode}
                onWatchCctv={(st) => setActiveModalCctv(st)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          <Card className="border-border/60 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" />
                {editingCctv ? 'Edit CCTV Camera' : 'Add a New CCTV Camera'}
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Connect the Axis camera's live stream to the FlowGIS map telemetry system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Station Code (Station Code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Example: TA130207"
                      value={formData.station_code}
                      onChange={(e) => setFormData({ ...formData, station_code: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Station Name / CCTV <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Example: Tha Chin River Sluice Gate 02"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Location / Regional Information</label>
                  <input
                    type="text"
                    placeholder="Example: Sam Phran, Nakhon Pathom"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5 text-gray-400" /> URL Stream MJPEG / Video <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="http://host:5001/axis-cgi/mjpg/video.cgi"
                    value={formData.stream_url}
                    onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Username Camera</label>
                    <input
                      type="text"
                      placeholder="live"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                        tabIndex="-1"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5 text-gray-500 hover:text-teal-600 transition-colors" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-gray-500 hover:text-teal-600 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Latitude <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="13.7889"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Longitude <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="100.2222"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                {/* Tombol Pemilih Koordinat Peta */}
                <div className="pt-1 space-y-1.5">
                  <Button
                    type="button"
                    variant={isPickMode ? 'default' : 'outline'}
                    onClick={() => setIsPickMode(!isPickMode)}
                    className={`w-full text-xs font-semibold justify-center gap-1.5 py-2 transition-all ${
                      isPickMode 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse shadow-md' 
                        : 'text-teal-700 border-teal-300 hover:bg-teal-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {isPickMode ? 'Click a location on the Leaflet map above...' : 'Select a Point on the Map (Map Picker)'}
                  </Button>

                  {formData.lat && formData.lng && (
                    <div className="text-center text-[11px] text-teal-800 font-mono bg-teal-50/80 py-1 rounded-md border border-teal-200">
                      Coordinate: {Number(formData.lat).toFixed(4)}, {Number(formData.lng).toFixed(4)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {editingCctv && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1 text-xs justify-center"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold justify-center"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCctv ? 'Save Changes' : 'Save CCTV'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>

      <Card className="border-border/60 shadow-sm bg-white overflow-hidden transition-all duration-300">
        <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 bg-slate-50/50">
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <div>
              <CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Video className="w-5 h-5 text-teal-600" /> List of Telemetry CCTV Cameras ({cctvs.length})
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                CCTV data is stored in a database and managed directly by the administrator.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {isTableOpen && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for CCTV name / code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsTableOpen((prev) => !prev)}
              className="text-xs font-semibold text-gray-600 hover:text-teal-700 flex items-center gap-1.5 shrink-0"
            >
              <span>{isTableOpen ? 'Hide Panel' : 'Show Panel'}</span>
              {isTableOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {isTableOpen && (
          <>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                  <span className="text-xs">Loading CCTV camera data from the database...</span>
                </div>
              ) : filteredCctvs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No CCTV footage was found.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 font-semibold">
                      <th className="p-3">Camera Code & Name</th>
                      <th className="p-3">Location / Region</th>
                      <th className="p-3">Coordinate</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Management Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedCctvs.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{item.name}</div>
                              <div className="text-[10px] text-teal-700 font-mono">{item.station_code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600 max-w-xs truncate">{item.location || '-'}</td>
                        <td className="p-3 font-mono text-[11px] text-gray-500">
                          {item.lat}, {item.lng}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleActive(item.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                              item.is_active !== false
                                ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                            }`}
                            title="Click to change the active status"
                          >
                            {item.is_active !== false ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-teal-600" /> Aktive
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-gray-400" /> Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setActiveModalCctv(item)}
                              className="px-2.5 py-1 text-[11px] bg-teal-600 hover:bg-teal-700 text-white rounded font-medium flex items-center gap-1 shadow-sm transition"
                              title="Watch Live Stream"
                            >
                              <Video className="w-3 h-3" /> Live
                            </button>
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit CCTV"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteTarget({ id: item.id, name: item.name })}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete CCTV"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>

            {/* Pagination Footer */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredCctvs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
            />
          </>
        )}
      </Card>

      {/* Modal Video Stream CCTV */}
      {activeModalCctv && (
        <CctvStreamModal
          station={activeModalCctv}
          isOpen={!!activeModalCctv}
          onClose={() => setActiveModalCctv(null)}
        />
      )}

      {/* Confirmation Modal untuk Hapus CCTV */}
      <ConfirmModal
        isOpen={!!confirmDeleteTarget}
        onClose={() => setConfirmDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Remove the CCTV Camera?"
        message={`Are you sure you want to remove the camera? "${confirmDeleteTarget?.name}" from the database? The camera data will no longer be displayed on the monitoring map.`}
        confirmText="Yes, Delete the CCTV Footage"
        cancelText="Cancel"
      />

      {/* Loader Operasi CRUD CCTV */}
      {actionLoading && (
        <Loader
          message={actionLoading.message}
          subtitle={actionLoading.subtitle}
          stages={actionLoading.stages}
        />
      )}
    </div>
  );
}