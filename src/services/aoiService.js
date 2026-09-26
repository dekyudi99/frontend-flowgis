import API from './api';

export const aoiService = {
  createAoi: async (formData, config = {}) => {
      return await API.post('/aois', formData, config);
  },

  // Detail AOI berdasarkan ID
  getAoiById: async (id) => {
    const response = await API.get(`/aois/${id}`);
    return response.data;
  },

  getAoisByProject: async (projectId) => {
    const response = await API.get(`/projects/${projectId}/aois`);
    return response.data;
  },

  getUserAois: async () => {
    const response = await API.get('/aois/user');
    return response.data;
  },
};