// /**
//  * API Nhóm Capstone (mô phỏng). Khi tích hợp thật, thay phần comment bằng gọi HTTP thật.
//  */
// import { capstoneGroups } from '../../mocks/mockstaff/groups';
// import { API_BASE_URL } from '../../app/config';

// function normalize(str) {
//   return (str || '').toString().toLowerCase().trim();
// }

// // Simple in-memory cache (5 phút, tối đa 100 mục)
// const CACHE_TTL_MS = 5 * 60 * 1000;
// const LIST_CACHE = new Map();
// const DETAIL_CACHE = new Map();

// function buildListKey(params) {
//   const { major='all', submitted='all', term='all', courseCode='all', search='', page=1, pageSize=10 } = params || {};
//   return JSON.stringify({ major, submitted, term, courseCode, search, page, pageSize });
// }

// function getCached(map, key) {
//   const item = map.get(key);
//   if (!item) return null;
//   if (Date.now() - item.time > CACHE_TTL_MS) { map.delete(key); return null; }
//   return item.value;
// }

// function setCached(map, key, value) {
//   map.set(key, { value, time: Date.now() });
//   if (map.size > 100) {
//     const firstKey = map.keys().next().value;
//     map.delete(firstKey);
//   }
// }

// /**
//  * Liệt kê nhóm capstone với paging, filter và search.
//  *
//  * Response kỳ vọng từ BE:
//  *   {
//  *     data: { items: [...], total: 123, page: 1, pageSize: 10, options: { majors: [], terms: [], courseCodes: [] } },
//  *     status: 200,
//  *     message: "Lấy thành công"
//  *   }
//  *
//  * Request (REST thật dự kiến):
//  *   GET /api/staff/capstone-groups?major=AI&submitted=true&term=Fall24&courseCode=SEP490&search=GV1&page=1&pageSize=10
//  *   Headers: Authorization: Bearer <token>
//  *
//  * @param {Object} params
//  * @param {string} [params.major='all']
//  * @param {string} [params.submitted='all']
//  * @param {string} [params.term='all']
//  * @param {string} [params.courseCode='all']
//  * @param {string} [params.search='']
//  * @param {number} [params.page=1]
//  * @param {number} [params.pageSize=10]
//  * @returns {Promise<{data: {items: Array, total: number, page: number, pageSize: number, options: {majors: string[], terms: string[], courseCodes: string[]}}, status: number, message: string}>}
//  */
// export function listCapstoneGroups(params = {}) {
//   const { major = 'all', submitted = 'all', term = 'all', courseCode = 'all', search = '', page = 1, pageSize = 10 } = params;

//   // Kiểm tra cache trước khi gọi HTTP thật
//   const cacheKey = buildListKey({ major, submitted, term, courseCode, search, page, pageSize });
//   const cached = getCached(LIST_CACHE, cacheKey);
//   if (cached) return Promise.resolve(cached);

//   // API thật (ví dụ): đảm bảo chỉ lấy trang yêu cầu, không lấy full data
//   // return axios.get(`${API_BASE_URL}/api/staff/capstone-groups`, { params: { major, submitted, term, courseCode, search, page, pageSize } })
//   //   .then(res => {
//   //     const payload = res.data; // { data: { items, total, page, pageSize, options }, status, message }
//   //     setCached(LIST_CACHE, cacheKey, payload);
//   //     return payload;
//   //   });

//   // Mock branch
//   const q = normalize(search);

//   let items = capstoneGroups;

//   if (major !== 'all') items = items.filter(g => g.major === major);
//   if (submitted !== 'all') items = items.filter(g => String(g.submittedDocs) === String(submitted));
//   if (term !== 'all') items = items.filter(g => g.term === term);
//   if (courseCode !== 'all') items = items.filter(g => g.courseCode === courseCode);

//   if (q) {
//     items = items.filter(g => {
//       const inGroupId = normalize(g.id).includes(q);
//       const inSupervisor = normalize(g.supervisor).includes(q);
//       const inStudents = (g.students || []).some(s => normalize(s.name).includes(q) || normalize(s.id).includes(q));
//       return inGroupId || inSupervisor || inStudents;
//     });
//   }

//   const total = items.length;
//   const start = Math.max(0, (page - 1) * pageSize);
//   const end = start + pageSize;
//   const pageItems = items.slice(start, end);

//   // Options toàn cục để render dropdown
//   const majors = Array.from(new Set(capstoneGroups.map(g => g.major))).sort();
//   const terms = Array.from(new Set(capstoneGroups.map(g => g.term))).sort();
//   const courseCodes = Array.from(new Set(capstoneGroups.map(g => g.courseCode))).sort();

//   const payload = { data: { items: pageItems, total, page, pageSize, options: { majors, terms, courseCodes } }, status: 200, message: 'Lấy thành công' };
//   setCached(LIST_CACHE, cacheKey, payload);
//   return Promise.resolve(payload);
// }

// /**
//  * Chi tiết 1 nhóm capstone.
//  *
//  * Response kỳ vọng từ BE:
//  *   { data: { ...group }, status: 200, message: "Lấy thành công" }
//  * Request (REST thật dự kiến): GET /api/staff/capstone-groups/:groupId
//  * @param {string} groupId
//  * @returns {Promise<{data: Object, status: number, message: string}>}
//  */
// export function getCapstoneGroupDetail(groupId) {
//   // Cache cho detail
//   const key = String(groupId || '');
//   const cached = getCached(DETAIL_CACHE, key);
//   if (cached) return Promise.resolve(cached);

//   // API thật (ví dụ):
//   // return axios.get(`${API_BASE_URL}/api/staff/capstone-groups/${groupId}`)
//   //   .then(res => {
//   //     const payload = res.data; // { data: {...}, status, message }
//   //     setCached(DETAIL_CACHE, key, payload);
//   //     return payload;
//   //   });

//   const item = capstoneGroups.find(g => g.id === groupId);
//   const payload = item
//     ? { data: item, status: 200, message: 'Lấy thành công' }
//     : { data: null, status: 404, message: 'Không tìm thấy nhóm' };
//   setCached(DETAIL_CACHE, key, payload);
//   return Promise.resolve(payload);
// } 

// =================

import axios from 'axios';
import { capstoneGroups, capstoneGroupDetails } from '../../mocks/mockstaff/groups';
import { API_BASE_URL } from '../../app/config';

const USE_MOCK = true; // đổi false để dùng API thật

// ================== list ==================
export async function listCapstoneGroups({ page = 1, pageSize = 100 } = {}) {
  if (!USE_MOCK) {
    // --- gọi API thật ---
    const res = await axios.get(`${API_BASE_URL}/api/staff/capstone-groups`, {
      params: { page, pageSize },
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });

    // 🔑 Chuẩn hóa response từ backend về cùng format với mock
    const payload = res.data;
    return {
      data: {
        items: payload.data?.items || [],
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
    const res = await axios.get(`${API_BASE_URL}/api/staff/capstone-groups/${groupId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });
    return res.data;
  }

  const item = capstoneGroupDetails[groupId];
  console.log("item", item);
  
  return item
    ? { data: item, status: 200, message: 'Lấy thành công (mock)' }
    : { data: {}, status: 404, message: 'Không tìm thấy nhóm' };
}
