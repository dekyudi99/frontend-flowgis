import API from './api';

const DEFAULT_USERS = [
  { id: 1, name: 'Administrator FlowGIS', email: 'admin@flowgis.com', phone: '081234567890', role: 'admin', created_at: '2026-01-10T08:00:00Z' },
  { id: 2, name: 'Dr. Sarah Smith', email: 'sarah.analyst@flowgis.com', phone: '081298765432', role: 'analyst', created_at: '2026-02-14T10:30:00Z' },
  { id: 3, name: 'Budi Santoso', email: 'budi@mitra-gis.id', phone: '081345678901', role: 'user', created_at: '2026-03-01T14:15:00Z' },
  { id: 4, name: 'Nakhon Monitoring Team', email: 'nakhon.tech@water.go.th', phone: '081987654321', role: 'analyst', created_at: '2026-03-12T09:45:00Z' },
];

export const userService = {
  // Ambil daftar seluruh user
  getUsers: async (search = '', role = '') => {
    try {
      const params = {};
      if (search) params.search = search;
      if (role) params.role = role;
      const res = await API.get('/admin/users', { params });
      return res.data?.data || [];
    } catch (err) {
      console.warn('API /admin/users failed, using local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_users');
      let list = saved ? JSON.parse(saved) : DEFAULT_USERS;
      if (search) {
        list = list.filter(u => 
          u.name.toLowerCase().includes(search.toLowerCase()) || 
          u.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (role) {
        list = list.filter(u => u.role === role);
      }
      return list;
    }
  },

  // Tambah user baru
  createUser: async (userData) => {
    try {
      const res = await API.post('/admin/users', userData);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('API create user failed, saving to local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_users');
      const list = saved ? JSON.parse(saved) : DEFAULT_USERS;
      const newUser = {
        id: Date.now(),
        ...userData,
        created_at: new Date().toISOString()
      };
      list.unshift(newUser);
      localStorage.setItem('flowgis_admin_users', JSON.stringify(list));
      return newUser;
    }
  },

  // Update data user
  updateUser: async (id, userData) => {
    try {
      const res = await API.put(`/admin/users/${id}`, userData);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('API update user failed, updating local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_users');
      const list = saved ? JSON.parse(saved) : DEFAULT_USERS;
      const updated = list.map(u => u.id === id ? { ...u, ...userData } : u);
      localStorage.setItem('flowgis_admin_users', JSON.stringify(updated));
      return updated.find(u => u.id === id);
    }
  },

  // Ubah role user (admin <-> analyst / user)
  toggleRole: async (id, targetRole = null) => {
    try {
      const payload = targetRole ? { role: targetRole } : {};
      const res = await API.patch(`/admin/users/${id}/role`, payload);
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('API toggleRole failed, updating local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_users');
      const list = saved ? JSON.parse(saved) : DEFAULT_USERS;
      const updated = list.map(u => {
        if (u.id === id) {
          const nextRole = targetRole || (u.role === 'admin' ? 'analyst' : 'admin');
          return { ...u, role: nextRole };
        }
        return u;
      });
      localStorage.setItem('flowgis_admin_users', JSON.stringify(updated));
      return updated.find(u => u.id === id);
    }
  },

  // Hapus user
  deleteUser: async (id) => {
    try {
      const res = await API.delete(`/admin/users/${id}`);
      return res.data;
    } catch (err) {
      console.warn('API delete user failed, deleting from local fallback:', err);
      const saved = localStorage.getItem('flowgis_admin_users');
      const list = saved ? JSON.parse(saved) : DEFAULT_USERS;
      const filtered = list.filter(u => u.id !== id);
      localStorage.setItem('flowgis_admin_users', JSON.stringify(filtered));
      return { success: true, deleted_id: id };
    }
  },
};
