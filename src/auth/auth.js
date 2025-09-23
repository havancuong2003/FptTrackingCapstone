import { authUsers } from '../mocks/authUsers';

const TOKEN_KEY = 'auth_token';
const USER_ROLE_KEY = 'auth_role';
const USER_INFO_KEY = 'auth_user';

export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

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
  const user = authUsers.find(u => u.username === username);
  if (!user || user.password !== password) {
    throw new Error('Sai username hoặc password');
  }

  const token = `mock-token-${user.id}`;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_ROLE_KEY, user.role);
  localStorage.setItem(USER_INFO_KEY, JSON.stringify({ id: user.id, name: user.name, role: user.role }));
  return { token, role: user.role, user: { id: user.id, name: user.name, role: user.role } };
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_INFO_KEY);
} 