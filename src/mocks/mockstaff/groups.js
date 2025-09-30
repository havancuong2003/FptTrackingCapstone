 // Danh sách nhóm (list view)
export const capstoneGroups = [
  {
    id: 'GR1',
    courseCode: 'SEP490',
    term: 'Fall23',
    major: 'AI',
    studentCount: 5,
    supervisor: 'GV1',
    submittedDocs: true,
    projectName: 'AI Chatbot',
    status: 'Delayed',
    risk: 'Medium',
  },
  {
    id: 'GR2',
    courseCode: 'SEP490',
    term: 'Fall24',
    major: 'SE',
    studentCount: 4,
    supervisor: 'GV2',
    submittedDocs: false,
    projectName: 'E-learning Platform',
    status: 'On Track',
    risk: 'Low',
  },
  {
    id: 'GR3',
    courseCode: 'SEP490',
    term: 'Spring25',
    major: 'IoT',
    studentCount: 6,
    supervisor: 'GV3',
    submittedDocs: true,
    projectName: 'Smart Home Hub',
    status: 'On Track',
    risk: 'Low',
  },
  {
    id: 'GR4',
    courseCode: 'SEP490',
    term: 'Spring25',
    major: 'DS',
    studentCount: 3,
    supervisor: 'GV4',
    submittedDocs: true,
    projectName: 'Data Mining Tool',
    status: 'Delayed',
    risk: 'High',
  },
];

// Response mẫu cho list
export const dataGR = {
  data: {
    items: capstoneGroups,
    total: capstoneGroups.length,
  },
  status: 200,
  message: 'Lấy thành công',
};


// Chi tiết nhóm (detail view)
export const capstoneGroupDetails = {
  GR1: {
    id: 'GR1',
    projectName: 'AI Chatbot',
    supervisor: 'GV1',
    status: 'Delayed',
    risk: 'Medium',
    students: [
      { id: 'SE001', name: 'Nguyễn Văn A', role: 'Leader' },
      { id: 'SE002', name: 'Trần Văn B', role: 'Dev' },
      { id: 'SE003', name: 'Lê Thị C', role: 'Tester' },
    ],
    activityLog: [
      {
        timestamp: '2025-09-18 23:00:00',
        content: 'Xóa tài liệu trên Google Drive',
        actor: 'Nguyễn Văn Đạt',
        action: 'Delete',
      },
      {
        timestamp: '2025-09-20 09:15:12',
        content: 'Setup project repo trên GitHub',
        actor: 'Nguyễn Văn A',
        action: 'Create',
      },
    ],
  },
  GR2: {
    id: 'GR2',
    projectName: 'E-learning Platform',
    supervisor: 'GV2',
    status: 'On Track',
    risk: 'Low',
    students: [
      { id: 'SE101', name: 'Phạm Quang D', role: 'Leader' },
      { id: 'SE102', name: 'Đỗ Minh E', role: 'Dev' },
      { id: 'SE103', name: 'Võ Thị F', role: 'Tester' },
      { id: 'SE104', name: 'Ngô Văn G', role: 'BA' },
    ],
    activityLog: [
      {
        timestamp: '2025-09-18 10:00:00',
        content: 'Kickoff project với GV hướng dẫn',
        actor: 'Phạm Quang D',
        action: 'Meeting',
      },
      {
        timestamp: '2025-09-21 14:20:45',
        content: 'Thêm trang đăng ký người dùng',
        actor: 'Đỗ Minh E',
        action: 'Create',
      },
    ],
  },
};

// ✅ Hàm mock trả về đúng format cho API detail
export function getMockGroupDetail(id) {
  const item = capstoneGroupDetails[id];
  return item
    ? { data: item, status: 200, message: 'Lấy thành công' }
    : { data: null, status: 404, message: 'Không tìm thấy nhóm' };
}
