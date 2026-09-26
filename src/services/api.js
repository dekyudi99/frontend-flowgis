import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor untuk menyisipkan Bearer Token dan menangani FormData
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Jika data berupa FormData (upload berkas), hapus header Content-Type default
    // agar Axios dan browser otomatis menetapkan multipart/form-data beserta boundary yang valid
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      window.dispatchEvent(new Event('auth-change'));
    }
    return Promise.reject(error);
  }
);

export default API;