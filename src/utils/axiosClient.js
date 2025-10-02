import axios from 'axios';
import { API_BASE_URL } from '../app/config';
import { startLoading, stopLoading } from './loading';

async function triggerLogout() {
  try {
    const mod = await import('../auth/auth');
    if (typeof mod.logout === 'function') {
      await mod.logout();
    }
  } catch {}
}

const normalizedBaseURL = (API_BASE_URL || '').replace(/\/+$/, '');
const client = axios.create({ baseURL: normalizedBaseURL, withCredentials: true });

// Request Interceptor
client.interceptors.request.use((config) => {
  startLoading();
  return config;
});

// Response Interceptor
client.interceptors.response.use(
  (response) => {
    stopLoading();

    // Luôn format lại cho đồng nhất
    const { status, message, data } = response.data || {};

    if (status === 401) {
      // Token hết hạn → logout
      triggerLogout();
      return Promise.reject({ status, message, data });
    }

    return response;
  },
  async (error) => {
    stopLoading();
    const originalRequest = error.config;

    // Nếu accessToken hết hạn → thử refresh
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await client.post('/auth/refreshToken');
        const { status, message } = refreshResponse.data || {};

        if (status === 200) {
          // refresh thành công → retry request gốc
          return client(originalRequest);
        } else {
          // refresh thất bại → logout
          triggerLogout();
          return Promise.reject(refreshResponse.data);
        }
      } catch (refreshError) {
        // refresh token cũng hết hạn hoặc lỗi mạng
        const resData = refreshError?.response?.data || {
          status: 500,
          message: refreshError.message,
          data: null,
        };

        if (resData.status === 401) {
          triggerLogout();
        }
        return Promise.reject(resData);
      }
    }

    // Các lỗi khác
    const resData = error?.response?.data || {
      status: 500,
      message: error.message,
      data: null,
    };
    return Promise.reject(resData);
  }
);

export default client;
