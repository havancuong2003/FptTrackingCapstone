import axios from 'axios';
import { API_BASE_URL } from '../app/config';
import { startLoading, stopLoading } from './loading';

async function triggerLogout() {
  // Chỉ logout một lần, tránh gọi nhiều lần
  if (isLoggingOut) {
    return;
  }
  isLoggingOut = true;
  try {
    const mod = await import('../auth/auth');
    if (typeof mod.logout === 'function') {
      await mod.logout();
    }
  } catch {} finally {
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
  }
}

const normalizedBaseURL = (API_BASE_URL || '').replace(/\/+$/, '');
const client = axios.create({ baseURL: normalizedBaseURL, withCredentials: true });

// Quản lý refresh token để tránh nhiều request cùng refresh
let isRefreshing = false;
let refreshSubscribers = [];
let refreshTokenFailed = false;
let isLoggingOut = false;

function onRefreshed(success) {
  refreshSubscribers.forEach(cb => cb(success));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

function navigateHomeWithAlert(message) {
  try {
    if (message) {
      window.alert(message);
    }
    window.location.replace('/');
  } catch {}
}

// Request Interceptor
client.interceptors.request.use((config) => {
  startLoading();
  
  // Đánh dấu request refresh token và logout để tránh vòng lặp
  if (config.url?.includes('/auth/refreshToken')) {
    config._isRefreshToken = true;
  }
  if (config.url?.includes('/auth/logout')) {
    config._isLogout = true;
  }
  
  // Reset flags khi login thành công
  if (config.url?.includes('/auth/login')) {
    refreshTokenFailed = false;
    isRefreshing = false;
    refreshSubscribers = [];
    isLoggingOut = false;
  }
  
  return config;
});

// Response Interceptor
client.interceptors.response.use(
  (response) => {
    stopLoading();
    const { status, message, data } = response.data || {};

    // Reset flags khi login thành công
    if (response.config?.url?.includes('/auth/login') && (status === 200 || !status)) {
      refreshTokenFailed = false;
      isRefreshing = false;
      refreshSubscribers = [];
      isLoggingOut = false;
    }

    if (status === 401) {
      triggerLogout();
      return Promise.reject({ status, message, data });
    }

    if (status === 403) {
      navigateHomeWithAlert('Bạn không có quyền truy cập.');
      return Promise.reject({ status, message, data });
    }

    return response;
  },
  async (error) => {
    stopLoading();
    const originalRequest = error.config;

    // Kiểm tra loại request
    const isRefreshTokenRequest = originalRequest?.url?.includes('/auth/refreshToken') || 
                                  originalRequest?._isRefreshToken;
    const isLogoutRequest = originalRequest?.url?.includes('/auth/logout') || 
                           originalRequest?._isLogout;

    // Nếu là refresh token request và trả về 401 → logout ngay
    if (error?.response?.status === 401 && isRefreshTokenRequest) {
      isRefreshing = false;
      refreshTokenFailed = true;
      onRefreshed(false);
      triggerLogout();
      return Promise.reject(error?.response?.data || {
        status: 401,
        message: 'Refresh token đã hết hạn',
        data: null,
      });
    }

    // Nếu là logout request và trả về 401 → bỏ qua (bình thường)
    if (error?.response?.status === 401 && isLogoutRequest) {
      return Promise.reject(error?.response?.data || {
        status: 401,
        message: error?.response?.statusText || 'Unauthorized',
        data: null,
      });
    }

    // Nếu refresh token đã fail trước đó → reject ngay
    if (refreshTokenFailed) {
      return Promise.reject(error?.response?.data || {
        status: 401,
        message: 'Phiên đăng nhập đã hết hạn',
        data: null,
      });
    }

    // Nếu accessToken hết hạn → thử refresh
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Nếu đang có request refresh token khác đang chạy → chờ kết quả
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((success) => {
            if (success) {
              resolve(client(originalRequest));
            } else {
              reject(error?.response?.data || {
                status: 401,
                message: 'Phiên đăng nhập đã hết hạn',
                data: null,
              });
            }
          });
        });
      }

      // Bắt đầu refresh token
      isRefreshing = true;
      try {
        const refreshResponse = await client.post('/auth/refreshToken');
        const { status } = refreshResponse.data || {};

        isRefreshing = false;

        if (status === 200) {
          // Refresh thành công → thông báo cho các request đang chờ và retry request gốc
          onRefreshed(true);
          return client(originalRequest);
        } else {
          // Refresh thất bại → logout
          refreshTokenFailed = true;
          onRefreshed(false);
          triggerLogout();
          return Promise.reject(refreshResponse.data);
        }
      } catch (refreshError) {
        // Refresh token hết hạn hoặc lỗi mạng
        isRefreshing = false;
        refreshTokenFailed = true;
        onRefreshed(false);
        
        // Nếu refresh token trả về 401 → logout
        if (refreshError?.response?.status === 401) {
          triggerLogout();
        }
        
        return Promise.reject(refreshError?.response?.data || {
          status: refreshError?.response?.status || 500,
          message: refreshError.message || 'Lỗi khi refresh token',
          data: null,
        });
      }
    }

    // Các lỗi khác
    const resData = error?.response?.data || {
      status: error?.response?.status || 500,
      message: error.message || 'Có lỗi xảy ra',
      data: null,
    };

    // Chặn 403 ở nhánh lỗi HTTP
    if (error?.response?.status === 403) {
      navigateHomeWithAlert('Bạn không có quyền truy cập.');
      return Promise.reject(resData);
    }
    
    return Promise.reject(resData);
  }
);

export default client;
