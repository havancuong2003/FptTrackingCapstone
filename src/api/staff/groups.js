
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
        message: payload.message || 'Successfully fetched majors list',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Error' };
  } catch (error) {
    console.error('Error fetching majors:', error);
    return { data: [], status: 500, message: 'Error fetching majors list' };
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
        message: payload.message || 'Successfully fetched semesters list',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Error' };
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return { data: [], status: 500, message: 'Error fetching semesters list' };
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
        message: payload.message || 'Successfully fetched course codes list',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Error' };
  } catch (error) {
    console.error('Error fetching course codes:', error);
    return { data: [], status: 500, message: 'Error fetching course codes list' };
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
    message: payload.message || 'Success',
  };
}

// ================== detail ==================
export async function getCapstoneGroupDetail(groupId) {
  try {
    const res = await client.get(`/Staff/capstone-groups/${groupId}`);
    const payload = res.data;
    const raw = payload?.data ?? payload;
    const normalized = raw ? {
      ...raw,
      supervisors: Array.isArray(raw.supervisors)
        ? raw.supervisors
        : (raw.supervisor ? [raw.supervisor] : []),
    } : raw;
    return { data: normalized, status: payload?.status ?? res.status, message: payload?.message || 'Success' };
  } catch (error) {
    console.error('Error fetching capstone group detail:', error);
    return { data: null, status: 500, message: error.response?.data?.message || 'Error fetching group information' };
  }
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
      message: payload.message || 'Email sent successfully',
  };
}

// ================== sync from Call4Project ==================
export async function getMockDataGroups(semesterId) {
  try {
    const res = await client.get('/mock-data/group', {
      params: { semesterId }
    });
    const payload = res.data;
    if (payload.status === 200) {
      return {
        data: payload.data || [],
        status: payload.status,
        message: payload.message || 'Data fetched successfully',
      };
    }
    return { data: [], status: payload.status, message: payload.message || 'Error' };
  } catch (error) {
    console.error('Error fetching mock data groups:', error);
    return { data: [], status: 500, message: 'Error fetching data from Call4Project' };
  }
}

export async function syncMockDataGroups(groupsData) {
  try {
    const res = await client.post('/mock-data/group', groupsData);
    const payload = res.data;
    return {
      data: payload.data,
      status: payload.status ?? res.status,
      message: payload.message || 'Data synced successfully',
    };
  } catch (error) {
    console.error('Error syncing mock data groups:', error);
    return {
      data: null,
      status: 500,
      message: error.response?.data?.message || 'Error syncing data',
    };
  }
}

// ================== update expire date ==================
export async function updateGroupExpireDate(groupId, expireDate) {
  try {
    const res = await client.put(`/group/${groupId}/expire-date`, {
      expireDate: expireDate
    });
    
    const payload = res.data;
    return {
      data: payload.data,
      status: payload.status ?? res.status,
      message: payload.message || 'Expire date updated successfully',
    };
  } catch (error) {
  
    return { data: null, status: 400, message: error || 'Error updating expire date' };
  }
}