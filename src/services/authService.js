import API from './api';
import { getOidcAccessToken } from './oidcTokenService';

export const isLoggedIn = () => {
  if (typeof window === 'undefined') return false;

  // 1. Cek token OIDC in-memory
  if (getOidcAccessToken()) return true;

  // 2. Cek token di localStorage (auth_token atau token)
  if (localStorage.getItem('auth_token') || localStorage.getItem('token')) return true;

  // 3. Cek sessionStorage OIDC user
  try {
    if (window.sessionStorage) {
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith('oidc.user:')) {
          const raw = window.sessionStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.access_token) return true;
          }
        }
      }
    }
  } catch {
    // Abaikan parse error
  }

  return false;
};

export const loginUser = async (credentials) => {
  const response = await API.post('/auth/login', credentials);
  const resData = response.data;

  // Mendukung berbagai format respon Laravel (access_token / token / data.token)
  const token = resData.token || resData.access_token || resData.data?.token || resData.data?.access_token;
  const user = resData.user || resData.data?.user;

  if (token) {
    localStorage.setItem('auth_token', token);
  }
  
  if (user) {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  // Memicu event agar Navbar & Popup langsung ter-refresh secara otomatis
  window.dispatchEvent(new Event("auth-change"));

  return resData;
};

export const logoutUser = async () => {
  try {
    await API.post('/auth/logout');
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    
    // Memicu event refresh
    window.dispatchEvent(new Event("auth-change"));
  }
};

export const registerUser = async (userData) => {
  const response = await API.post('/auth/register', userData); 
  return response.data;
};

export const getMe = async () => {
  const response = await API.get('/me');
  return response.data;
};