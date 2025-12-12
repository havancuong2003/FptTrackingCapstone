import client from '../../utils/axiosClient';

// ================== Auth APIs ==================

// Get user info from API (chỉ dùng khi login, không dùng ở các nơi khác)
export async function getUserInfoFromAPI() {
  try {
    const response = await client.get('/auth/user-info');
    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

// Get user info (alias for consistency)
export async function getUserInfo() {
  return getUserInfoFromAPI();
}

// Login API
export async function loginAPI({ username, password }) {
  try {
    const response = await client.post('/auth/login', { userName: username, password });
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

// Logout API
export async function logoutAPI() {
  try {
    const response = await client.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

