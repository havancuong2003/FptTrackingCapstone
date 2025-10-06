// Mock API Response cho Group Tracking
// Endpoint: GET /staff/group-tracking
// Params: groupid, startdate, enddate

export const mockGroupTrackingResponse = {
  status: "200",
  message: "Lấy dữ liệu tracking thành công",
  data: {
    currentWeek: "Week 3: 29/09/2025 - 05/10/2025",
    weeks: [
      { value: "Week 1: 15/09/2025 - 21/09/2025", label: "Week 1: 15/09/2025 - 21/09/2025" },
      { value: "Week 2: 22/09/2025 - 28/09/2025", label: "Week 2: 22/09/2025 - 28/09/2025" },
      { value: "Week 3: 29/09/2025 - 05/10/2025", label: "Week 3: 29/09/2025 - 05/10/2025" },
      { value: "Week 4: 06/10/2025 - 12/10/2025", label: "Week 4: 06/10/2025 - 12/10/2025" }
    ],
    timeSlots: [
      "00:00 - 04:00",
      "04:00 - 08:00",
      "08:00 - 12:00",
      "12:00 - 16:00",
      "16:00 - 20:00",
      "20:00 - 24:00"
    ],
    days: [
      { name: "Monday", date: "22/09" },
      { name: "Tuesday", date: "23/09" },
      { name: "Wednesday", date: "24/09" },
      { name: "Thursday", date: "25/09" },
      { name: "Friday", date: "26/09" },
      { name: "Saturday", date: "27/09" },
      { name: "Sunday", date: "28/09" }
    ],
    groupMembers: [
      {
        id: "SE00001",
        name: "Nguyen Van A",
        isLeader: true
      },
      {
        id: "SE00002",
        name: "Nguyen Van B",
        isLeader: false
      },
      {
        id: "SE00003",
        name: "Nguyen Van C",
        isLeader: false
      },
      {
        id: "SE00004",
        name: "Nguyen Van D",
        isLeader: false
      },
      {
        id: "SE00005",
        name: "Nguyen Van E",
        isLeader: false
      }
    ],
    milestones: [
      {
        name: "Report 1",
        deadline: "23:59 - 28/09/2025",
        status: "submitted"
      },
      {
        name: "Report 2",
        deadline: "23:59 - 12/10/2025",
        status: "late"
      },
      {
        name: "Report 3, Project Breakdown",
        deadline: "23:59 - 26/10/2025",
        status: "not-submitted"
      },
      {
        name: "Report 4",
        deadline: "23:59 - 09/11/2025",
        status: "not-submitted"
      },
      {
        name: "Report 5",
        deadline: "23:59 - 23/11/2025",
        status: "not-submitted"
      },
      {
        name: "Report 6, Test Document",
        deadline: "23:59 - 07/12/2025",
        status: "not-submitted"
      },
      {
        name: "Report 7",
        deadline: "23:59 - 21/12/2025",
        status: "not-submitted"
      }
    ]
  }
};

// Response cho trường hợp lỗi
export const mockErrorResponse = {
  status: "error",
  message: "Không tìm thấy dữ liệu tracking cho nhóm này",
  data: null
};

// Response cho trường hợp không có quyền truy cập
export const mockUnauthorizedResponse = {
  status: "error", 
  message: "Bạn không có quyền truy cập dữ liệu nhóm này",
  data: null
};

// Hàm mock để simulate API call
export function mockGroupTrackingApi(groupId, startDate, endDate) {
  // Simulate delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock validation
      if (!groupId) {
        reject(mockErrorResponse);
        return;
      }
      
      if (groupId === "GR01") {
        resolve(mockGroupTrackingResponse);
      } else {
        reject(mockErrorResponse);
      }
    }, 1000); // 1 second delay
  });
}

// Export default response
export default mockGroupTrackingResponse;
