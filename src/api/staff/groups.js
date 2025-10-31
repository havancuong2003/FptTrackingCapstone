
import client from '../../utils/axiosClient';
import { capstoneGroups, capstoneGroupDetails } from '../../mocks/mockstaff/groups';
import { API_BASE_URL } from '../../app/config';

const USE_MOCK = false; // đổi false để dùng API thật

// ================== list ==================
export async function listCapstoneGroups({ page = 1, pageSize = 100 } = {}) {
  if (!USE_MOCK) {
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

  // --- mock ---
  const total = capstoneGroups.length;
  const start = Math.max(0, (page - 1) * pageSize);
  const end = start + pageSize;
  const pageItems = capstoneGroups.slice(start, end);

  const majors = Array.from(new Set(capstoneGroups.map(g => g.major))).sort();
  const terms = Array.from(new Set(capstoneGroups.map(g => g.term))).sort();
  const courseCodes = Array.from(new Set(capstoneGroups.map(g => g.courseCode))).sort();

  return {
    data: { items: pageItems, total, page, pageSize, options: { majors, terms, courseCodes } },
    status: 200,
    message: 'Lấy thành công (mock)',
  };
}

// ================== detail ==================
export async function getCapstoneGroupDetail(groupId) {
  if (!USE_MOCK) {
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

  const item = capstoneGroupDetails[groupId];
  return item
    ? { data: item, status: 200, message: 'Lấy thành công (mock)' }
    : { data: {}, status: 404, message: 'Không tìm thấy nhóm' };
}

// ================== send email ==================
export async function sendEmailToGroup(groupId, content) {
  if (!USE_MOCK) {
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

  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    data: { sent: true, recipients: ['student1@example.com', 'student2@example.com'] },
    status: 200,
    message: 'Email đã được gửi thành công (mock)',
  };
}