import axios from 'axios';
import { API_BASE_URL } from '../app/config';
import { getToken, logout } from '../auth/auth';
import { startLoading, stopLoading } from './loading';

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // bật loading
  startLoading();
  return config;
});

client.interceptors.response.use(
  (response) => {
    stopLoading();
    return response;
  },
  (error) => {
    stopLoading();
    if (error?.response?.status === 401) {
      logout();
    }
    return Promise.reject(normalizeError(error));
  }
);

export function normalizeError(error) {
  const status = error?.response?.status || 0;
  const message = error?.response?.data?.message || error.message || 'Lỗi không xác định';
  return { status, message, raw: error };
}

export default client; 