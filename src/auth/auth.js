import { API_BASE_URL } from '../app/config';
import client from '../utils/axiosClient';
import { resetLoading } from '../utils/loading';
import { getCurrentSemester } from '../api/staff/semester';

export const USER_ROLE_KEY = 'auth_role';
export const USER_INFO_KEY = 'auth_user';
export const CURRENT_SEMESTER_KEY = 'current_semester';

// Sử dụng client chung đã cấu hình interceptor

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const role = localStorage.getItem(USER_ROLE_KEY) || 'STUDENT';
  return { id: 'u_1', name: 'Mock User', role };
}

export function getCurrentSemesterInfo() {
  try {
    const raw = localStorage.getItem(CURRENT_SEMESTER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export async function login({ username, password }) {
  if (!username || !password) {
    throw new Error('Thiếu thông tin đăng nhập');
  }



  try {
    const res = await client.post('/auth/login', { userName : username, password });
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Đăng nhập thất bại';
    throw new Error(msg);
  }

  try {
    const meRes = await client.get('/auth/user-info');
    const meBody = meRes?.data;
    const me = meBody?.data || meBody || null;
    
    if (me) {
      const role = me.role || localStorage.getItem(USER_ROLE_KEY) || 'STUDENT';
      const roleInGroup = me.roleInGroup || me.role_in_group || me.groupRole || null;

      localStorage.setItem(USER_ROLE_KEY, role);
      localStorage.setItem(
        USER_INFO_KEY,
        JSON.stringify({ 
          id: me.id || me.userId || 'u_1', 
          name: me.name || me.fullName || 'User', 
          role,
          roleInGroup 
        })
      );

      // Lưu groupId cho student để dùng cho điều hướng tasks
      try {
        const isStudent = String(role).toUpperCase() === 'STUDENT';
        const groupId = me.groupId || me.groupID || me.group?.id || me.currentGroupId || null;
        if (isStudent && groupId) {
          localStorage.setItem('student_group_id', String(groupId));
        }
      } catch {}

      // Lưu roleInGroup riêng biệt để dễ truy cập
      if (roleInGroup) {
        localStorage.setItem('user_role_in_group', String(roleInGroup));
      }
    }
  } catch {}

  // Lấy và lưu thông tin semester hiện tại
  try {
    const semesterRes = await getCurrentSemester();
    const semesterData = semesterRes?.data;
    if (semesterData) {
      localStorage.setItem(CURRENT_SEMESTER_KEY, JSON.stringify(semesterData));
    }
  } catch (error) {
    console.warn('Không thể lấy thông tin semester hiện tại:', error);
  }

  return { message: 'Login successfully' };
}

export async function logout() {
  try {
  
    await client.post('/auth/logout');
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem('student_group_id');
    localStorage.removeItem('user_role_in_group');
    localStorage.removeItem(CURRENT_SEMESTER_KEY);
    resetLoading();
    return;
  } catch {}
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem('student_group_id');
  localStorage.removeItem('user_role_in_group');
  localStorage.removeItem(CURRENT_SEMESTER_KEY);
  resetLoading();
}

// Helper function để lấy roleInGroup từ localStorage
export function getRoleInGroup() {
  try {
    return localStorage.getItem('user_role_in_group') || null;
  } catch {
    return null;
  }
}

// Helper function để lấy thông tin user đầy đủ bao gồm roleInGroup
export function getUserInfo() {
  try {
    const userInfo = localStorage.getItem(USER_INFO_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch {
    return null;
  }
} 