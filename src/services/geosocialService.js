import API from './api';
import axios from 'axios';

const FASTAPI_URL = import.meta.env.VITE_ASTRAGIS_API_URL || 'http://localhost:8000';

export const geosocialService = {
  // Ambil katalog layer geosocial aktif (untuk tampilan publik / map viewer)
  getLayers: async () => {
    const response = await API.get('/geosocial/layers');
    return response.data?.data || [];
  },

  // Ambil seluruh layer (aktif & nonaktif) untuk Admin Dashboard
  getAllLayers: async () => {
    try {
      const response = await API.get('/geosocial/layers?all=true');
      return response.data?.data || [];
    } catch (err) {
      console.warn('Fallback getting public layers:', err);
      const response = await API.get('/geosocial/layers');
      return response.data?.data || [];
    }
  },

  // Upload layer spasial selalu melalui Laravel business process, lalu Laravel meneruskan ke AstraGIS
  uploadLayer: async (formData, config = {}) => {
    const response = await API.post('/geosocial/layers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
    return response.data;
  },

  // Update nama layer
  updateLayer: async (id, name) => {
    const response = await API.put(`/geosocial/layers/${id}`, { name });
    return response.data;
  },

  // Toggle status aktif/nonaktif layer
  toggleActive: async (id) => {
    const response = await API.patch(`/geosocial/layers/${id}/toggle`);
    return response.data;
  },

  // Hapus layer
  deleteLayer: async (id) => {
    const response = await API.delete(`/geosocial/layers/${id}`);
    return response.data;
  },

  // Update style visual SLD layer
  updateStyle: async (id, styleData) => {
    const response = await API.post(`/geosocial/layers/${id}/style`, styleData);
    return response.data;
  },

  // Ambil GeoJSON titik fasilitas untuk MarkerCluster
  getPointData: async (pointKey) => {
    const response = await API.get(`/geosocial/layers/points/${pointKey}`);
    return response.data;
  },
};
