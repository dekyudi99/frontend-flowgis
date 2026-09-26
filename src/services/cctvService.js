import API from './api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';

const DEFAULT_CCTV = [
  {
    id: 1,
    station_code: 'TA130204',
    name: 'Bunyarat Prachanuwat Bridge (แม่น้ำท่าจีน)',
    location: 'Sam Phran, Nakhon Pathom',
    stream_url: 'http://ta130204.dyndns.info:5001/axis-cgi/mjpg/video.cgi',
    username: 'live',
    password: 'Live2025!',
    lat: 13.7889,
    lng: 100.2222,
    is_active: true,
  },
  {
    id: 2,
    station_code: 'TA130205',
    name: 'Luang Pho Poen Bridge (หลวงพ่อเปิ่น)',
    location: 'Nakhon Chai Si, Nakhon Pathom',
    stream_url: 'http://ta130205.dyndns.info:5001/axis-cgi/mjpg/video.cgi',
    username: 'live',
    password: 'Live2025!',
    lat: 13.8167,
    lng: 100.1833,
    is_active: true,
  },
  {
    id: 3,
    station_code: 'TA130206',
    name: 'Highway 346 Bridge (สะพานข้ามแม่น้ำท่าจีน)',
    location: 'Bang Len, Nakhon Pathom',
    stream_url: 'http://ta130206.dyndns.info:5001/axis-cgi/mjpg/video.cgi',
    username: 'live',
    password: 'Live2025!',
    lat: 13.9833,
    lng: 100.0500,
    is_active: true,
  },
  {
    id: 4,
    station_code: 'TA100220',
    name: 'Kamphaeng Saen Witthaya School',
    location: 'Kamphaeng Saen, Nakhon Pathom',
    stream_url: 'http://ta100220.dyndns.info:5001/axis-cgi/mjpg/video.cgi',
    username: 'live',
    password: 'Live2025!',
    lat: 13.9831,
    lng: 99.9973,
    is_active: true,
  },
];

export const cctvService = {
  // Ambil daftar seluruh stasiun CCTV
  getCctvs: async () => {
    try {
      const res = await API.get('/admin/cctv?all=true');
      return res.data?.data || [];
    } catch (err) {
      console.warn('API /admin/cctv failed, using local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_cctvs');
      return saved ? JSON.parse(saved) : DEFAULT_CCTV;
    }
  },

  // Tambah stasiun CCTV baru ke database
  createCctv: async (cctvData) => {
    try {
      const res = await API.post('/admin/cctv', cctvData);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('API create CCTV failed, saving to local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_cctvs');
      const list = saved ? JSON.parse(saved) : DEFAULT_CCTV;
      const newItem = {
        id: Date.now(),
        ...cctvData,
        is_active: true,
      };
      list.push(newItem);
      localStorage.setItem('flowgis_admin_cctvs', JSON.stringify(list));
      return newItem;
    }
  },

  // Update stasiun CCTV
  updateCctv: async (id, cctvData) => {
    try {
      const res = await API.put(`/admin/cctv/${id}`, cctvData);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('API update CCTV failed, updating local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_cctvs');
      const list = saved ? JSON.parse(saved) : DEFAULT_CCTV;
      const updated = list.map(c => c.id === id ? { ...c, ...cctvData } : c);
      localStorage.setItem('flowgis_admin_cctvs', JSON.stringify(updated));
      return updated.find(c => c.id === id);
    }
  },

  // Toggle status aktif/nonaktif
  toggleActive: async (id) => {
    try {
      const res = await API.patch(`/admin/cctv/${id}/toggle`);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('API toggleActive CCTV failed, updating local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_cctvs');
      const list = saved ? JSON.parse(saved) : DEFAULT_CCTV;
      const updated = list.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c);
      localStorage.setItem('flowgis_admin_cctvs', JSON.stringify(updated));
      return updated.find(c => c.id === id);
    }
  },

  // Hapus stasiun CCTV
  deleteCctv: async (id) => {
    try {
      const res = await API.delete(`/admin/cctv/${id}`);
      return res.data;
    } catch (err) {
      console.warn('API delete CCTV failed, updating local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_cctvs');
      const list = saved ? JSON.parse(saved) : DEFAULT_CCTV;
      const filtered = list.filter(c => c.id !== id);
      localStorage.setItem('flowgis_admin_cctvs', JSON.stringify(filtered));
      return { success: true, deleted_id: id };
    }
  },

  // URL Stream video proxy
  getStreamUrl: (stationCode) => {
    return `${API_BASE}/facilities/cctv/${stationCode}/stream`;
  },

  // URL Snapshot JPEG proxy
  getSnapshotUrl: (stationCode) => {
    return `${API_BASE}/facilities/cctv/${stationCode}/snapshot?_t=${Date.now()}`;
  },
};
