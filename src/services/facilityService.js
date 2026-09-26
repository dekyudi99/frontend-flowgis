import API from './api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

export const facilityService = {
  // Ambil semua fasilitas publik dari backend
  getAllFacilities: async () => {
    try {
      const response = await API.get('/facilities/all');
      return response.data?.data || [];
    } catch (err) {
      console.warn('Failed to load /facilities/all, fallback to local storage:', err);
      const saved = localStorage.getItem('flowgis_admin_facilities');
      return saved ? JSON.parse(saved) : [];
    }
  },

  // Simpan fasilitas publik baru
  createFacility: async (facilityData) => {
    try {
      const response = await API.post('/admin/facilities', facilityData);
      return response.data?.data || response.data;
    } catch (err) {
      console.warn('Failed to post /admin/facilities:', err);
      throw err;
    }
  },

  // Update fasilitas publik
  updateFacility: async (id, facilityData) => {
    try {
      const response = await API.put(`/admin/facilities/${id}`, facilityData);
      return response.data?.data || response.data;
    } catch (err) {
      console.warn('Failed to put /admin/facilities:', err);
      throw err;
    }
  },

  // Hapus fasilitas publik
  deleteFacility: async (id) => {
    try {
      const response = await API.delete(`/admin/facilities/${id}`);
      return response.data;
    } catch (err) {
      console.warn('Failed to delete /admin/facilities:', err);
      throw err;
    }
  },

  getHospitals: async () => {
    const response = await API.get('/facilities/hospitals');
    return response.data;
  },

  getWaterStations: async () => {
    const response = await API.get('/facilities/water-stations');
    return response.data;
  },

  getCctvStreamUrl: (stationCode) => {
    return `${API_BASE}/facilities/cctv/${stationCode}/stream`;
  },

  getCctvSnapshotUrl: (stationCode) => {
    return `${API_BASE}/facilities/cctv/${stationCode}/snapshot?_t=${Date.now()}`;
  },
};

