import { API_BASE_URL } from '../app/config';
import client from '../utils/axiosClient';
import { resetLoading } from '../utils/loading';

export const USER_ROLE_KEY = 'auth_role';
export const USER_INFO_KEY = 'auth_user';

// Sử dụng client chung đã cấu hình interceptor

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const role = localStorage.getItem(USER_ROLE_KEY) || 'STUDENT';
  return { id: 'u_1', name: 'Mock User', role };
}

export async function login({ username, password }) {
  if (!username || !password) {
    throw new Error('Thiếu thông tin đăng nhập');
  }

  // Mock login cho testing
  if (username === 'abc' && password === '123') {
    console.log('Mock login: abc/123 detected, setting as staff');
    const mockUser = {
      id: 'mock_staff_1',
      name: 'Mock Staff User',
      role: 'STAFF'
    };
    localStorage.setItem(USER_ROLE_KEY, 'STAFF');
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(mockUser));
    return { message: 'Mock login successfully' };
  }

  // Mock login cho SUPERVISOR testing
  if (username === 'supervisor' && password === '123') {
    console.log('Mock login: supervisor/123 detected, setting as supervisor');
    const mockUser = {
      id: 'mock_supervisor_1',
      name: 'Mock Supervisor User',
      role: 'SUPERVISOR'
    };
    localStorage.setItem(USER_ROLE_KEY, 'SUPERVISOR');
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(mockUser));
    return { message: 'Mock login successfully' };
  }

  try {
    const res = await client.post('/auth/login', { userName : username, password });
    console.log("res login", res);
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Đăng nhập thất bại';
    throw new Error(msg);
  }

  try {
    const meRes = await client.get('/auth/user-info');
    const meBody = meRes?.data;
    const me = meBody?.data || meBody || null;
    if (me) {
      console.log("me", me);
      const role = me.role || localStorage.getItem(USER_ROLE_KEY) || 'STUDENT';
      console.log("role", role);
      localStorage.setItem(USER_ROLE_KEY, role);
      localStorage.setItem(
        USER_INFO_KEY,
        JSON.stringify({ id: me.id || me.userId || 'u_1', name: me.name || me.fullName || 'User', role })
      );
    }
  } catch {}

  return { message: 'Login successfully' };
}

export async function logout() {
  try {
  
    await client.post('/auth/logout');
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    resetLoading();
    return;
  } catch {}
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  resetLoading();
} 