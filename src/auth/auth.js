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
 
  // --- mock staff ---
  if (username === 'staff' && password === 'staff123') {
    localStorage.setItem(USER_ROLE_KEY, 'STAFF');
    localStorage.setItem(USER_INFO_KEY, JSON.stringify({ id: 'u_1', name: 'Staff', role: 'STAFF' }));
    
    return { message: 'Login successfully' };
  }
 
 
  if (!username || !password) {
    throw new Error('Thiếu thông tin đăng nhập');
  }

  try {
    await client.post('/auth/login', { username, password });
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Đăng nhập thất bại';
    throw new Error(msg);
  }

  try {
    const meRes = await client.get('/auth/me');
    const meBody = meRes?.data;
    const me = meBody?.data || meBody || null;
    if (me) {
      const role = me.role || localStorage.getItem(USER_ROLE_KEY) || 'STUDENT';
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
    // mock logout
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    resetLoading();
    return;
   // await client.post('/auth/logout');
  } catch {}
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  resetLoading();
} 