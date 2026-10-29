import axios from 'axios';
import { applyOidcInterceptor } from './oidcTokenService';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Pasang interceptor OIDC & token Bearer terpusat
applyOidcInterceptor(API);

export default API;