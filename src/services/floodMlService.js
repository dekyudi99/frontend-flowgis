import axios from 'axios';

const FLOOD_ML_BASE_URL = import.meta.env.VITE_FLOOD_ML_API_URL || 'http://localhost:8008/api/v1';

const mlClient = axios.create({
  baseURL: FLOOD_ML_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 60000,
});

/**
 * Mendapatkan daftar provinsi & model yang didukung EWS ML
 */
export async function getSupportedProvinces() {
  const resp = await mlClient.get('/provinces');
  return resp.data;
}

/**
 * Menjalankan prediksi risiko banjir EWS ML (1.000 titik pantau spasial)
 * @param {Object} payload { province, lead_time, model_name, threshold }
 */
export async function predictFloodRisk(payload) {
  const resp = await mlClient.post('/predict', payload);
  return resp.data;
}

/**
 * Mengambil data sesi preview aktif berdasarkan preview_id
 */
export async function getPreviewSession(previewId) {
  const resp = await mlClient.get(`/preview/${previewId}`);
  return resp.data;
}

export default {
  getSupportedProvinces,
  predictFloodRisk,
  getPreviewSession,
};
