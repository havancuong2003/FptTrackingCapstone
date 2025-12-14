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
      // Save full user info according to API response format
      const userData = {
        id: me.id || me.userId || 'u_1',
        semesterId: me.semesterId || null,
        name: me.name || me.fullName || 'User',
        role,
        roleInGroup,
        campusId: me.campusId || null,
        expireDate: me.expireDate || null,
        groups: me.groups || [],
        groupsInfo: me.groupsInfo || [], // Save groupsInfo for supervisor
        majorCategory: me.majorCategory || null // Save majorCategory with size limit
      };
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));

      // Lưu groupId cho student để dùng cho điều hướng tasks
      try {
        const isStudent = String(role).toUpperCase() === 'STUDENT';
        // Lấy groupId từ mảng groups, lấy phần tử đầu tiên
        const groupId = me.groups && me.groups.length > 0 ? me.groups[0] : 
                       me.groupId || me.groupID || me.group?.id || me.currentGroupId || null;
        if (isStudent && groupId) {
          localStorage.setItem('student_group_id', String(groupId));
        }
      } catch {}

      // Lưu roleInGroup riêng biệt để dễ truy cập
      if (roleInGroup) {
        localStorage.setItem('user_role_in_group', String(roleInGroup));
      }

      // Lưu campusId riêng biệt để dễ truy cập
      if (me.campusId) {
        localStorage.setItem('user_campus_id', String(me.campusId));
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
    localStorage.removeItem('user_campus_id');
    localStorage.removeItem(CURRENT_SEMESTER_KEY);
    resetLoading();
    // Redirect về trang login
    window.location.href = '/login';
    return;
  } catch {}
  localStorage.removeItem(USER_ROLE_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem('student_group_id');
  localStorage.removeItem('user_role_in_group');
  localStorage.removeItem(CURRENT_SEMESTER_KEY);
  resetLoading();
  // Redirect về trang login ngay cả khi logout API fail
  window.location.href = '/login';
}

// Refresh user info from API (call after updating group expire date, etc.)
export async function refreshUserInfo() {
  try {
    const meRes = await client.get('/auth/user-info');
    const meBody = meRes?.data;
    const me = meBody?.data || meBody || null;
    if (me) {
      const role = me.role || localStorage.getItem(USER_ROLE_KEY) || 'STUDENT';
      const roleInGroup = me.roleInGroup || me.role_in_group || me.groupRole || null;

      localStorage.setItem(USER_ROLE_KEY, role);
      const userData = {
        id: me.id || me.userId || 'u_1',
        semesterId: me.semesterId || null,
        name: me.name || me.fullName || 'User',
        role,
        roleInGroup,
        campusId: me.campusId || null,
        expireDate: me.expireDate || null,
        groups: me.groups || [],
        groupsInfo: me.groupsInfo || [],
        majorCategory: me.majorCategory || null // Save majorCategory with size limit
      };
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));

      if (roleInGroup) {
        localStorage.setItem('user_role_in_group', String(roleInGroup));
      }

      if (me.campusId) {
        localStorage.setItem('user_campus_id', String(me.campusId));
      }

      return userData;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing user info:', error);
    return null;
  }
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
    if (!userInfo) return null;
    const parsed = JSON.parse(userInfo);
    // Ensure format matches API response
    return {
      id: parsed.id,
      semesterId: parsed.semesterId,
      name: parsed.name,
      role: parsed.role,
      roleInGroup: parsed.roleInGroup || parsed.role_in_group || parsed.groupRole,
      campusId: parsed.campusId,
      expireDate: parsed.expireDate,
      groups: parsed.groups || [],
      groupsInfo: parsed.groupsInfo || [], // Include groupsInfo for supervisor
      majorCategory: parsed.majorCategory || null // Include majorCategory with size limit
    };
  } catch {
    return null;
  }
}

// Helper function to get unique semesters from groupsInfo
export function getUniqueSemesters() {
  try {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.groupsInfo || !Array.isArray(userInfo.groupsInfo)) {
      return [];
    }
    
    const semestersMap = new Map();
    userInfo.groupsInfo.forEach(group => {
      if (group.semesterId) {
        semestersMap.set(group.semesterId, {
          id: group.semesterId,
          name: group.sesesterName || group.semesterName || `Semester ${group.semesterId}`
        });
      }
    });
    
    return Array.from(semestersMap.values());
  } catch {
    return [];
  }
}

// Helper function to get groups by semester and expired status
export function getGroupsBySemesterAndStatus(semesterId, isExpired = false) {
  try {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.groupsInfo || !Array.isArray(userInfo.groupsInfo)) {
      return [];
    }
    const filteredGroups = userInfo.groupsInfo.filter(group => {
      const matchesSemester = !semesterId || group.semesterId === semesterId;
      const matchesExpired = group.isExpired === isExpired;

      return matchesSemester && matchesExpired;
    });
    return filteredGroups;
  } catch {
    return [];
  }
}

// Helper function to get current semester ID (from userInfo.semesterId)
export function getCurrentSemesterId() {
  try {
    const userInfo = getUserInfo();
    // current semester get from localstorage. read file auth.js getCurrentSemesterInfo()
    const currentSemesterInfo = getCurrentSemesterInfo();
    return currentSemesterInfo?.id || null;
   // return userInfo?.semesterId || null;
  } catch {
    return null;
  }
}

// Helper function để lấy groupId từ groups (phần tử đầu tiên)
export function getGroupId() {
  try {
    const userInfo = getUserInfo();
    if (userInfo && userInfo.groups && userInfo.groups.length > 0) {
      return userInfo.groups[0];
    }
    return null;
  } catch {
    return null;
  }
}

// Helper function để lấy campusId từ localStorage
export function getCampusId() {
  try {
    const campusId = localStorage.getItem('user_campus_id');
    if (campusId) {
      return parseInt(campusId, 10);
    }
    // Fallback: lấy từ userInfo nếu không có trong localStorage riêng
    const userInfo = getUserInfo();
    if (userInfo && userInfo.campusId) {
      return userInfo.campusId;
    }
    return null;
  } catch {
    return null;
  }
}

// Helper function để parse size limit từ majorCategory
// size có thể là số (MB) hoặc chuỗi với đơn vị (ví dụ: "10MB", "10GB")
// Trả về size limit tính bằng bytes
export function parseSizeLimit(size) {
  if (!size) return null;
  
  // Nếu là số, mặc định là MB
  if (typeof size === 'number') {
    return size * 1024 * 1024; // Convert MB to bytes
  }
  
  // Nếu là chuỗi, parse đơn vị
  if (typeof size === 'string') {
    const trimmed = size.trim().toUpperCase();
    const match = trimmed.match(/^([\d.]+)\s*(MB|GB|KB|B)?$/);
    
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2] || 'MB'; // Mặc định là MB nếu không có đơn vị
      
      switch (unit) {
        case 'GB':
          return value * 1024 * 1024 * 1024; // Convert GB to bytes
        case 'MB':
          return value * 1024 * 1024; // Convert MB to bytes
        case 'KB':
          return value * 1024; // Convert KB to bytes
        case 'B':
          return value; // Already in bytes
        default:
          return value * 1024 * 1024; // Default to MB
      }
    }
  }
  
  return null;
}

// Helper function để lấy size limit từ majorCategory trong localStorage
// Trả về size limit tính bằng bytes, hoặc null nếu không có
export function getFileSizeLimit() {
  try {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.majorCategory || !userInfo.majorCategory.size) {
      return null;
    }
    return parseSizeLimit(userInfo.majorCategory.size);
  } catch {
    return null;
  }
}

// Helper function để format size limit để hiển thị cho người dùng
// Trả về chuỗi như "10 MB" hoặc "1 GB"
export function formatSizeLimit(size) {
  if (!size) return null;
  
  // Nếu là số, mặc định là MB
  if (typeof size === 'number') {
    return `${size} MB`;
  }
  
  // Nếu là chuỗi, giữ nguyên format nhưng chuẩn hóa
  if (typeof size === 'string') {
    const trimmed = size.trim();
    const match = trimmed.match(/^([\d.]+)\s*(MB|GB|KB|B)?$/i);
    
    if (match) {
      const value = match[1];
      const unit = match[2] || 'MB';
      return `${value} ${unit.toUpperCase()}`;
    }
    
    return trimmed; // Trả về nguyên bản nếu không match
  }
  
  return null;
} 