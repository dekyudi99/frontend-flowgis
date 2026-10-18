import API from './api';

export const projectService = {
  // Endpoint #3: Ambil Semua Proyek
  getProjects: async () => {
    const response = await API.get('/projects');
    return response.data;
  },

  // Endpoint #4: Buat Proyek Baru
  createProject: async (projectData) => {
    const response = await API.post('/projects', projectData);
    return response.data;
  },

  // Endpoint #5: Detail Proyek
  getProjectById: async (id) => {
    const response = await API.get(`/projects/${id}`);
    return response.data;
  },

  // Endpoint #6: Update Proyek
  updateProject: async (id, projectData) => {
    const response = await API.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Endpoint #7: Hapus Proyek
  deleteProject: async (id) => {
    const response = await API.delete(`/projects/${id}`);
    return response.data;
  },

  // Endpoint #9: Jalankan Analisis (Laravel meneruskan request ke Flask)
  runAnalysis: async (projectId, payload, config = {}) => {
    const response = await API.post(`/projects/${projectId}/analyze`, payload, config);
    return response.data;
  },

  // Endpoint #10: Ambil Hasil Analisis (Maps, Legends, Stats)
  getAnalysisResult: async (projectId) => {
    const response = await API.get(`/projects/${projectId}/result`);
    return response.data;
  },

  // Endpoint #11: Ambil URL Download GeoTIFF
  getDownloadUrl: async (projectId) => {
    const response = await API.get(`/projects/${projectId}/download`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(new Blob([response.data], { type: 'image/tiff' }));
  },

  // Endpoint: Simpan hasil analisis aktif ke proyek (AstraGIS S2S)
  saveAnalysis: async (projectId, payload = {}) => {
    const response = await API.post(`/projects/${projectId}/save-analysis`, payload);
    return response.data;
  },

  // Endpoint: Ambil daftar layer hasil analisis milik pengguna dari AstraGIS (khusus project tertentu)
  getUserLayers: async (projectId = null) => {
    const params = projectId ? { project_id: projectId } : {};
    const response = await API.get('/user/layers', { params });
    return response.data;
  },

  // Endpoint: Hapus Layer hasil analisis milik pengguna
  deleteUserLayer: async (id) => {
    const response = await API.delete(`/user/layers/${id}`);
    return response.data;
  },

  // Endpoint: Ambil daftar layer groups milik pengguna
  getUserLayerGroups: async () => {
    const response = await API.get('/user/layer-groups');
    return response.data;
  },

  // Endpoint: Buat Layer Group baru
  createUserLayerGroup: async (groupData) => {
    const response = await API.post('/user/layer-groups', groupData);
    return response.data;
  },

  // Endpoint: Update Layer Group
  updateUserLayerGroup: async (id, groupData) => {
    const response = await API.put(`/user/layer-groups/${id}`, groupData);
    return response.data;
  },

  // Endpoint: Hapus Layer Group
  deleteUserLayerGroup: async (id) => {
    const response = await API.delete(`/user/layer-groups/${id}`);
    return response.data;
  },

  // Endpoint: Download layer hasil analisis dengan style GeoServer (GeoTIFF)
  downloadUserLayer: async (projectId, layer) => {
    const layerId = layer.id || layer.layer_id || layer.layer_name;
    const response = await API.get(`/projects/${projectId}/layers/${layerId}/download`, {
      responseType: 'blob',
    });

    if (response.data?.type === 'application/json') {
      const text = await response.data.text();
      const json = JSON.parse(text);
      throw new Error(json.message || 'Download failed');
    }

    const blob = new Blob([response.data], { type: 'image/geotiff' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    let filename = `${(layer.display_name || layer.layer_name || 'analysis_layer').replace(/[^a-zA-Z0-9_-]/g, '_')}.tif`;
    const disposition = response.headers?.['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  },
};

