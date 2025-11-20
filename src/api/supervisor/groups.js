import client from '../../utils/axiosClient';

// Get active groups for supervisor
export async function getActiveGroups() {
  try {
    const response = await client.get('/Mentor/getGroups');
    const payload = response.data;
    if (payload.status === 200) {
      return {
        data: payload.data || [],
        status: payload.status,
        message: payload.message || 'Lấy danh sách nhóm thành công',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Lỗi' };
  } catch (error) {
    console.error('Error fetching active groups:', error);
    return { data: [], status: 500, message: 'Lỗi khi lấy danh sách nhóm còn hạn' };
  }
}

// Get expired groups for supervisor
export async function getExpiredGroups() {
  try {
    const response = await client.get('/Mentor/expired-groups');
    const payload = response.data;
    if (payload.status === 200) {
      return {
        data: payload.data || [],
        status: payload.status,
        message: payload.message || 'Lấy danh sách nhóm hết hạn thành công',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Lỗi' };
  } catch (error) {
    console.error('Error fetching expired groups:', error);
    return { data: [], status: 500, message: 'Lỗi khi lấy danh sách nhóm hết hạn' };
  }
}

