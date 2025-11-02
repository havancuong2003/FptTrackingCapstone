
import client from '../../utils/axiosClient';

// ================== filter options ==================
export async function getMajors() {
  try {
    const res = await client.get('/Staff/GetMajors');
    const payload = res.data;
    if (payload.status === 200) {
      return {
        data: payload.data || [],
        status: payload.status,
        message: payload.message || 'Lấy danh sách ngành thành công',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Lỗi' };
  } catch (error) {
    console.error('Error fetching majors:', error);
    return { data: [], status: 500, message: 'Lỗi khi lấy danh sách ngành' };
  }
}

export async function getSemesters() {
  try {
    const res = await client.get('/Staff/semester/getAll');
    const payload = res.data;
    
    if (payload.status === 200) {
      return {
        data: payload.data || [],
        status: payload.status,
        message: payload.message || 'Lấy danh sách kỳ học thành công',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Lỗi' };
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return { data: [], status: 500, message: 'Lỗi khi lấy danh sách kỳ học' };
  }
}

export async function getCourseCodes() {
  try {
    const res = await client.get('/Staff/getAllCodeCourse');
    const payload = res.data;
    if (payload.status === 200) {
      // Chỉ lấy các course code đang active
      const activeCourses = (payload.data || []).filter(c => c.isActive === true);
      return {
        data: activeCourses,
        status: payload.status,
        message: payload.message || 'Lấy danh sách môn học thành công',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Lỗi' };
  } catch (error) {
    console.error('Error fetching course codes:', error);
    return { data: [], status: 500, message: 'Lỗi khi lấy danh sách môn học' };
  }
}

// ================== list ==================
export async function listCapstoneGroups({ page = 1, pageSize = 100 } = {}) {
  const res = await client.get(`/Staff/capstone-groups`, {
    params: { page, pageSize },
  });
  const payload = res.data;
  const items = payload.data?.items || [];
  const normalizedItems = items.map(g => ({
    ...g,
    supervisors: Array.isArray(g.supervisors)
      ? g.supervisors
      : (g.supervisor ? [g.supervisor] : []),
  }));
  return {
    data: {
      items: normalizedItems,
      total: payload.data?.total || 0,
      page: payload.data?.page ?? page,
      pageSize: payload.data?.pageSize ?? pageSize,
      options: payload.data?.options || { majors: [], terms: [], courseCodes: [] },
    },
    status: payload.status ?? res.status,
    message: payload.message || 'Lấy thành công',
  };
}

// ================== detail ==================
export async function getCapstoneGroupDetail(groupId) {
  const res = await client.get(`/Staff/capstone-groups/${groupId}`);
  const payload = res.data;
  const raw = payload?.data ?? payload;
  const normalized = raw ? {
    ...raw,
    supervisors: Array.isArray(raw.supervisors)
      ? raw.supervisors
      : (raw.supervisor ? [raw.supervisor] : []),
  } : raw;
  return { data: normalized, status: payload?.status ?? res.status, message: payload?.message || 'Lấy thành công' };
}

// ================== send email ==================
export async function sendEmailToGroup(groupId, content) {
  const res = await client.post(`/Staff/capstone-groups/${groupId}/send-email`, {
    content,
  });
  const payload = res.data;
  return {
    data: payload.data,
    status: payload.status ?? res.status,
    message: payload.message || 'Email đã được gửi thành công',
  };
}

// ================== sync from Call4Project ==================
export async function getMockDataGroups() {
  try {
    const res = await client.get('/mock-data/group');
    const payload = res.data;
    if (payload.status === 200) {
      return {
        data: payload.data || [],
        status: payload.status,
        message: payload.message || 'Lấy dữ liệu thành công',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Lỗi' };
  } catch (error) {
    console.error('Error fetching mock data groups:', error);
    return { data: [], status: 500, message: 'Lỗi khi lấy dữ liệu từ Call4Project' };
  }
}

export async function syncMockDataGroups(groupsData) {
  try {
    const res = await client.post('/mock-data/group', groupsData);
    const payload = res.data;
    return {
      data: payload.data,
      status: payload.status ?? res.status,
      message: payload.message || 'Đồng bộ dữ liệu thành công',
    };
  } catch (error) {
    console.error('Error syncing mock data groups:', error);
    return {
      data: null,
      status: 500,
      message: error.response?.data?.message || 'Lỗi khi đồng bộ dữ liệu',
    };
  }
}