import API from './api';

export const userService = {
  // Ambil daftar seluruh user langsung dari database melalui API backend
  getUsers: async (search = '', role = '') => {
    const params = {};
    if (search) params.search = search;
    if (role) params.role = role;
    const res = await API.get('/admin/users', { params });
    return res.data?.data || [];
  },

  // Tambah user baru ke database
  createUser: async (userData) => {
    const res = await API.post('/admin/users', userData);
    return res.data?.data || res.data;
  },

  // Update data user di database
  updateUser: async (id, userData) => {
    const res = await API.put(`/admin/users/${id}`, userData);
    return res.data?.data || res.data;
  },

  // Ubah role user (admin <-> analyst / user)
  toggleRole: async (id, targetRole = null) => {
    const payload = targetRole ? { role: targetRole } : {};
    const res = await API.patch(`/admin/users/${id}/role`, payload);
    return res.data?.data || res.data;
  },

  // Hapus user dari database
  deleteUser: async (id) => {
    const res = await API.delete(`/admin/users/${id}`);
    return res.data;
  },
};

export default userService;
