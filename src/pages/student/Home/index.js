import React from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../../utils/axiosClient';
import { formatDate } from '../../../utils/date';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import DataTable from '../../../components/DataTable/DataTable';
import { getUserInfo } from '../../../auth/auth';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function StudentHome() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = React.useState(null);
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [semesterInfo, setSemesterInfo] = React.useState(null);
  const [weeks, setWeeks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [meetings, setMeetings] = React.useState([]);
  const [selectedWeek, setSelectedWeek] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [detailModal, setDetailModal] = React.useState(false);
  const [meetingModal, setMeetingModal] = React.useState(false);
  const [milestoneDetails, setMilestoneDetails] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [minuteData, setMinuteData] = React.useState(null);
  const [meetingIssues, setMeetingIssues] = React.useState([]);
  const [timeSlots, setTimeSlots] = React.useState([]); // Slots từ API
  const [attendanceList, setAttendanceList] = React.useState([]); // [{ studentId, name, rollNumber, attended: boolean, reason: string }]
  const [meetingGroupInfo, setMeetingGroupInfo] = React.useState(null);
  const [hasSelectedFreeTime, setHasSelectedFreeTime] = React.useState(true); // Kiểm tra xem sinh viên đã chọn lịch rảnh chưa

  // Load user info từ localStorage, không gọi API
  React.useEffect(() => {
    const user = getUserInfo();
    setUserInfo(user);
  }, []);

  // Load slots từ API dựa trên campusId
  React.useEffect(() => {
    let mounted = true;
    async function loadSlots() {
      if (!userInfo?.campusId) return;
      try {
        const res = await client.get(`https://160.30.21.113:5000/api/v1/slot/ById/${userInfo.campusId}`);
        if (res.data.status === 200 && res.data.data?.slots) {
          const slots = res.data.data.slots;
          // Chuyển đổi slots từ API thành format phù hợp
          const formattedSlots = slots.map(slot => {
            // Parse thời gian từ "7:30 AM" hoặc "1:00 PM" format
            const parseTime = (timeStr) => {
              const time = timeStr.trim();
              const isPM = time.toUpperCase().includes('PM');
              const timePart = time.replace(/[AP]M/gi, '').trim();
              const [hours, minutes] = timePart.split(':').map(Number);
              let hour24 = hours;
              if (isPM && hours !== 12) hour24 = hours + 12;
              if (!isPM && hours === 12) hour24 = 0;
              return hour24 + (minutes || 0) / 60;
            };
            
            return {
              id: slot.id,
              label: `${slot.startAt} - ${slot.endAt}`,
              nameSlot: slot.nameSlot,
              start: parseTime(slot.startAt),
              end: parseTime(slot.endAt),
              startAt: slot.startAt,
              endAt: slot.endAt
            };
          });
          
          if (!mounted) return;
          setTimeSlots(formattedSlots);
        }
      } catch (error) {
        console.error('Error loading slots:', error);
        if (!mounted) return;
        // Fallback về TIME_SLOTS mặc định nếu lỗi
        setTimeSlots([
          { label: '00:00-04:00', start: 0, end: 4 },
          { label: '04:00-08:00', start: 4, end: 8 },
          { label: '08:00-12:00', start: 8, end: 12 },
          { label: '12:00-16:00', start: 12, end: 16 },
          { label: '16:00-20:00', start: 16, end: 20 },
          { label: '20:00-24:00', start: 20, end: 24 }
        ]);
      }
    }
    loadSlots();
    return () => { mounted = false; };
  }, [userInfo?.campusId]);

  // Load group info
  React.useEffect(() => {
    let mounted = true;
    async function loadGroupInfo() {
      if (!userInfo?.groups || userInfo.groups.length === 0) return;
      try {
        // Lấy group đầu tiên từ danh sách groups
        const groupId = userInfo.groups[0];
        const res = await client.get(`https://160.30.21.113:5000/api/v1/Staff/capstone-groups/${groupId}`);
        const group = res?.data?.data || null;
        if (!mounted) return;
        setGroupInfo(group);
      } catch {
        if (!mounted) return;
        setGroupInfo(null);
      }
    }
    loadGroupInfo();
    return () => { mounted = false; };
  }, [userInfo?.groups]);

  // Load semester info and weeks
  React.useEffect(() => {
    let mounted = true;
    async function loadSemesterInfo() {
      if (!groupInfo?.semesterId) return;
      try {
        const res = await client.get(`https://160.30.21.113:5000/api/v1/Staff/semester/getSemesterBy/${groupInfo.semesterId}`);
        const semester = res?.data?.data || null;
        if (!mounted) return;
        setSemesterInfo(semester);
        setWeeks(semester?.weeks || []);
        if (semester?.weeks?.length > 0) {
          setSelectedWeek(semester.weeks[0].weekNumber);
        }
      } catch {
        if (!mounted) return;
        setSemesterInfo(null);
        setWeeks([]);
      }
    }
    loadSemesterInfo();
    return () => { mounted = false; };
  }, [groupInfo?.semesterId]);

  // Load milestones
  React.useEffect(() => {
    let mounted = true;
    async function loadMilestones() {
      if (!userInfo?.groups || userInfo.groups.length === 0) return;
      try {
        // Lấy group đầu tiên từ danh sách groups
        const groupId = userInfo.groups[0];
        const res = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/${groupId}`);
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!mounted) return;
        setMilestones(list);
      } catch {
        if (!mounted) return;
        setMilestones([]);
      }
    }
    loadMilestones();
    return () => { mounted = false; };
  }, [userInfo?.groups]);

  // Load tasks assigned to logged-in student
  React.useEffect(() => {
    let mounted = true;
    async function loadTasks() {
      if (!userInfo) return;
      try {
        const res = await client.get(`https://160.30.21.113:5000/api/v1/Student/Task/assignee`);
        if (res.data.statusCode === 200) {
          const tasksData = res.data.data || [];
          if (!mounted) return;
          setTasks(Array.isArray(tasksData) ? tasksData : []);
        }
      } catch (error) {
        console.error('Error loading assigned tasks:', error);
        if (!mounted) return;
        setTasks([]);
      }
    }
    loadTasks();
    return () => { mounted = false; };
  }, [userInfo]);

  // Load meetings
  React.useEffect(() => {
    let mounted = true;
    async function loadMeetings() {
      if (!userInfo?.groups || userInfo.groups.length === 0) return;
      try {
        // Lấy group đầu tiên từ danh sách groups
        const groupId = userInfo.groups[0];
        const res = await client.get(`https://160.30.21.113:5000/api/v1/Student/Meeting/group/${groupId}/schedule-dates`);
        if (res.data.status === 200) {
          const meetingsData = res.data.data;
          if (!mounted) return;
          setMeetings(meetingsData || []);
        }
      } catch {
        if (!mounted) return;
        setMeetings([]);
      }
    }
    loadMeetings();
    return () => { mounted = false; };
  }, [userInfo?.groups]);

  // Kiểm tra xem sinh viên đã chọn lịch rảnh chưa
  React.useEffect(() => {
    let mounted = true;
    async function checkFreeTime() {
      if (!userInfo?.groups || userInfo.groups.length === 0 || !userInfo.id) return;
      try {
        const groupId = userInfo.groups[0];
        const response = await client.get(`https://160.30.21.113:5000/api/v1/Student/Meeting/groups/${groupId}/schedule/free-time`);
        if (response.data.status === 200 && response.data.data?.students) {
          const students = response.data.data.students;
          const currentStudent = students.find(s => s.studentId === userInfo.id);
          if (currentStudent) {
            // Kiểm tra xem freeTimeSlots có rỗng không
            const hasFreeTime = currentStudent.freeTimeSlots && currentStudent.freeTimeSlots.length > 0;
            if (!mounted) return;
            setHasSelectedFreeTime(hasFreeTime);
          } else {
            if (!mounted) return;
            setHasSelectedFreeTime(false);
          }
        }
      } catch (error) {
        console.error('Error checking free time:', error);
        if (!mounted) return;
        setHasSelectedFreeTime(false);
      }
    }
    checkFreeTime();
    return () => { mounted = false; };
  }, [userInfo?.groups, userInfo?.id]);

  // Set loading false when all data loaded
  React.useEffect(() => {
    if (userInfo && groupInfo && semesterInfo && weeks.length > 0) {
      setLoading(false);
    }
  }, [userInfo, groupInfo, semesterInfo, weeks]);

  // Get milestones for selected week
  const getMilestonesForWeek = () => {
    if (!selectedWeek || !milestones.length) return [];
    
    const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);
    if (!selectedWeekData) return [];
    
    const weekStart = new Date(selectedWeekData.startAt);
    const weekEnd = new Date(selectedWeekData.endAt);
    
    // Set week end to 23:59:59 to include the entire last day
    weekEnd.setHours(23, 59, 59, 999);
    
    return milestones.filter(milestone => {
      if (!milestone.endAt) return false;
      const deadline = new Date(milestone.endAt);
      return deadline >= weekStart && deadline <= weekEnd;
    });
  };

  // Get meetings for selected week
  const getMeetingsForWeek = () => {
    if (!selectedWeek || !meetings.length) return [];
    
    const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);
    if (!selectedWeekData) return [];
    
    const weekStart = new Date(selectedWeekData.startAt);
    const weekEnd = new Date(selectedWeekData.endAt);
    
    // Set week end to 23:59:59 to include the entire last day
    weekEnd.setHours(23, 59, 59, 999);
    
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.meetingDate);
      return meetingDate >= weekStart && meetingDate <= weekEnd;
    });
  };

  // Get tasks for selected week (only tasks assigned to logged-in student and isActive === true)
  const getTasksForWeek = () => {
    if (!selectedWeek || !tasks.length) return [];
    
    const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);
    if (!selectedWeekData) {
      return [];
    }
    
    const weekStart = new Date(selectedWeekData.startAt);
    const weekEnd = new Date(selectedWeekData.endAt);
    
    // Set week end to 23:59:59 to include the entire last day
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekTasks = tasks.filter(task => {
      // Chỉ lấy task có isActive === true
      if (task.isActive !== true) return false;
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return deadline >= weekStart && deadline <= weekEnd;
    });
    
    return weekTasks;
  };

  // Get milestones for specific day and time slot (returns array to handle multiple milestones)
  const getMilestonesForSlot = (day, timeSlot) => {
    const weekMilestones = getMilestonesForWeek();
    if (!weekMilestones.length) return [];
    
    // Tìm tất cả milestones phù hợp với ngày và giờ
    const matchedMilestones = [];
    for (const milestone of weekMilestones) {
      const deadline = new Date(milestone.endAt);
      const dayOfWeek = deadline.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = deadline.getHours();
      
      // Convert Sunday=0 to Monday=0 format
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (adjustedDay === day && hour >= timeSlot.start && hour < timeSlot.end) {
        matchedMilestones.push(milestone);
      }
    }
    
    return matchedMilestones;
  };

  // Get meetings for specific day and time slot (returns array to handle multiple meetings)
  const getMeetingsForSlot = (day, timeSlot) => {
    const weekMeetings = getMeetingsForWeek();
    if (!weekMeetings.length) return [];
    
    // Tìm tất cả meetings phù hợp với ngày và giờ
    const matchedMeetings = [];
    for (const meeting of weekMeetings) {
      const meetingDate = new Date(meeting.meetingDate);
      const dayOfWeek = meetingDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Convert Sunday=0 to Monday=0 format
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (adjustedDay !== day) continue;
      
      // Lấy giờ từ meeting.startAt hoặc meeting.time
      let meetingHour = 0;
      if (meeting.startAt) {
        // Nếu có startAt (format "HH:mm:ss" hoặc "HH:mm" hoặc "YYYY-MM-DDTHH:mm:ss")
        let timeStr = meeting.startAt;
        // Nếu có format datetime, lấy phần thời gian
        if (timeStr.includes('T')) {
          timeStr = timeStr.split('T')[1];
        }
        if (timeStr.includes(' ')) {
          timeStr = timeStr.split(' ')[0];
        }
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          meetingHour = parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 60;
        } else {
          continue; // Không parse được, bỏ qua
        }
      } else if (meeting.time) {
        // Nếu có time (format "HH:mm")
        const parts = meeting.time.split(':');
        if (parts.length >= 2) {
          meetingHour = parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 60;
        } else {
          continue; // Không parse được, bỏ qua
        }
      } else {
        // Không có thời gian, bỏ qua meeting này
        continue;
      }
      
      // Kiểm tra xem meeting có nằm trong slot không
      if (meetingHour >= timeSlot.start && meetingHour < timeSlot.end) {
        matchedMeetings.push(meeting);
      }
    }
    
    return matchedMeetings;
  };

  // Get tasks for specific day and time slot (returns array to handle multiple tasks)
  const getTasksForSlot = (day, timeSlot) => {
    const weekTasks = getTasksForWeek();
    if (!weekTasks.length) return [];
    
    // Tìm tất cả tasks phù hợp với ngày và giờ
    const matchedTasks = [];
    for (const task of weekTasks) {
      const deadline = new Date(task.deadline);
      const dayOfWeek = deadline.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = deadline.getHours();
      
      // Convert Sunday=0 to Monday=0 format
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (adjustedDay === day && hour >= timeSlot.start && hour < timeSlot.end) {
        matchedTasks.push(task);
      }
    }
    
    return matchedTasks;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return '#059669'; // Green
      case 'LATE':
        return '#dc2626'; // Red
      case 'Pending':
        return '#d97706'; // Orange/Yellow
      case 'PENDING':
        return '#d97706'; // Orange/Yellow
      case 'UNSUBMITTED':
        return '#64748b'; // Gray
      case 'REJECTED':
        return '#dc2626'; // Red
      default:
        return '#64748b'; // Gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return '✓ Submitted';
      case 'LATE':
        return '⚠ Late';
      case 'Pending':
        return '⏳ Pending Review';
      case 'PENDING':
        return '⏳ Pending Review';
      case 'UNSUBMITTED':
        return '✗ Unsubmitted';
      case 'REJECTED':
        return '❌ Rejected';
      default:
        return '❓ Unknown';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'ToDo':
        return '#64748b'; // Gray
      case 'Todo':
        return '#64748b'; // Gray
      case 'InProgress':
        return '#d97706'; // Orange
      case 'Done':
        return '#059669'; // Green
      case 'InReview':
        return '#3b82f6'; // Blue
      default:
        return '#64748b'; // Gray
    }
  };

  const getTaskStatusText = (status) => {
    switch (status) {
      case 'ToDo':
        return '📋 To Do';
      case 'Todo':
        return '📋 To Do';
      case 'InProgress':
        return '🔄 In Progress';
      case 'Done':
        return '✅ Done';
      case 'InReview':
        return '👀 In Review';
      default:
        return '❓ Unknown';
    }
  };

  const getMeetingStatusColor = (meeting) => {
    if (meeting.isMeeting === true) {
      return '#059669'; // Green - completed
    } else {
      return '#d97706'; // Orange - not yet held
    }
  };

  const getMeetingStatusText = (meeting) => {
    if (meeting.isMeeting === true) {
      return '✅ Completed';
    } else {
      return '⏳ Not Yet Held';
    }
  };

  const openDetailModal = async (milestone) => {
    setSelectedMilestone(milestone);
    setDetailModal(true);
    
    // Load milestone details
    try {
      const res = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${userInfo.groups[0]}&deliverableId=${milestone.id}`);
      setMilestoneDetails(res?.data || null);
    } catch (error) {
      console.error('Error loading milestone details:', error);
      setMilestoneDetails(null);
    }
  };

  const openTaskDetail = (task) => {
    // Use task.group.id if available, otherwise fallback to userInfo.groups[0]
    const groupId = task?.group?.id || (userInfo?.groups?.[0]);
    if (!groupId || !task?.id) return;
    navigate(`/student/task-detail/${groupId}?taskId=${task.id}`);
  };

  // Hàm lấy thông tin nhóm
  const fetchGroupInfo = async (groupId) => {
    try {
      const response = await client.get(`https://160.30.21.113:5000/api/v1/Staff/capstone-groups/${groupId}`);
      if (response.data.status === 200) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching group info:', error);
      return null;
    }
  };

  // Hàm parse attendance text thành danh sách
  const parseAttendance = (attendanceText, students) => {
    if (!students || students.length === 0) {
      return [];
    }

    if (!attendanceText || !attendanceText.trim()) {
      return students.map(student => ({
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        role: student.role || '',
        attended: false,
        reason: ''
      }));
    }

    const lines = attendanceText.split('\n').filter(line => line.trim());
    const parsed = new Map();

    lines.forEach(line => {
      const match = line.match(/^(.+?)\s*\(([^)]+)\):\s*(.+)$/);
      if (match) {
        const [, name, rollNumber, status] = match;
        const statusLower = status.toLowerCase();
        const isAbsent = statusLower.includes('nghỉ') || statusLower.includes('vắng');
        let reason = '';
        
        if (isAbsent) {
          const reasonMatch = status.match(/(?:nghỉ|vắng)\s*-\s*(.+)/i);
          reason = reasonMatch ? reasonMatch[1].trim() : status.replace(/^(nghỉ|vắng)\s*-?\s*/i, '').trim();
        }
        
        parsed.set(rollNumber.trim(), {
          name: name.trim(),
          rollNumber: rollNumber.trim(),
          attended: !isAbsent,
          reason: reason
        });
      }
    });

    return students.map(student => {
      const existing = parsed.get(student.rollNumber);
      if (existing) {
        return {
          studentId: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          role: student.role || '',
          attended: existing.attended,
          reason: existing.reason
        };
      }
      return {
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        role: student.role || '',
        attended: false,
        reason: ''
      };
    });
  };

  // Fetch meeting issues (tasks) by meetingId
  const fetchMeetingIssues = async (meetingId) => {
    try {
      const res = await client.get(`https://160.30.21.113:5000/api/v1/Student/Task/meeting-tasks/${meetingId}`);
      const data = res.data?.data;
      const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
      return tasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        deadline: t.deadline,
        isActive: t.isActive,
        groupId: t.groupId || userInfo?.groups?.[0]
      }));
    } catch (e) {
      return [];
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch { return dateString; }
  };

  const meetingIssueColumns = [
    { key: 'name', title: 'Issue' },
    { key: 'deadline', title: 'Deadline', render: (row) => formatDateTime(row.deadline) },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/student/task-detail/${row.groupId}?taskId=${row.id}`);
            }}
            style={{
              background: '#2563EB', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >Details</button>
        </div>
      )
    }
  ];

  const openMeetingModal = async (meeting) => {
    setSelectedMeeting(meeting);
    setMinuteData(null);
    setMeetingIssues([]);
    setAttendanceList([]);
    setMeetingGroupInfo(null);
    // Không hiện modal ngay, đợi load xong dữ liệu
    
    try {
      // Fetch group info để parse attendance
      let currentGroupInfo = null;
      if (userInfo?.groups && userInfo.groups.length > 0) {
        currentGroupInfo = await fetchGroupInfo(userInfo.groups[0]);
        if (currentGroupInfo) {
          setMeetingGroupInfo(currentGroupInfo);
        }
      }

      // Chỉ fetch meeting minute nếu isMinute === true
      if (meeting.isMinute === true) {
        try {
          const response = await client.get(`https://160.30.21.113:5000/api/v1/MeetingMinute?meetingDateId=${meeting.id}`);
          if (response.data.status === 200 && response.data.data) {
            setMinuteData(response.data.data);
            
            // Parse attendance từ text
            if (currentGroupInfo && currentGroupInfo.students) {
              const students = Array.isArray(currentGroupInfo.students) ? currentGroupInfo.students : [];
              const parsedAttendance = parseAttendance(response.data.data.attendance, students);
              setAttendanceList(parsedAttendance);
            }
            
            // Load meeting issues bằng meeting minute id
            if (response.data.data.id) {
              const meetingTasks = await fetchMeetingIssues(response.data.data.id);
              setMeetingIssues(Array.isArray(meetingTasks) ? meetingTasks : []);
            }
          } else {
            setMinuteData(null);
          }
        } catch (error) {
          console.error('Error fetching meeting minute:', error);
          setMinuteData(null);
        }
      } else {
        setMinuteData(null);
      }
    } catch (error) {
      console.error('Error loading meeting data:', error);
    } finally {
      // Chỉ hiện modal sau khi đã load xong tất cả dữ liệu
      setMeetingModal(true);
    }
  };

  const closeMeetingModal = () => {
    setMeetingModal(false);
    setSelectedMeeting(null);
    setMinuteData(null);
    setMeetingIssues([]);
    setAttendanceList([]);
    setMeetingGroupInfo(null);
  };

  // Join meeting
  const joinMeeting = (meetingLink) => {
    window.open(meetingLink, '_blank');
  };

  // Get upcoming tasks sorted by deadline (prioritize overdue tasks, then upcoming tasks) - chỉ lấy 3 tasks và chỉ lấy isActive === true
  const getUpcomingTasks = React.useMemo(() => {
    if (!tasks.length) return [];
    
    // Chỉ lấy các task có isActive === true
    const activeTasks = tasks.filter(task => task.isActive === true);
    if (!activeTasks.length) return [];
    
    const now = new Date();
    const sortedTasks = [...activeTasks].sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0;
      const deadlineA = new Date(a.deadline);
      const deadlineB = new Date(b.deadline);
      return deadlineA - deadlineB;
    });

    // Ưu tiên các task quá hạn trước
    const overdueTasks = sortedTasks.filter(task => {
      if (!task.deadline) return false;
      return new Date(task.deadline) < now;
    });

    // Sau đó là các task sắp tới
    const upcomingTasks = sortedTasks.filter(task => {
      if (!task.deadline) return false;
      return new Date(task.deadline) >= now;
    });

    // Nếu có task quá hạn, hiển thị chúng trước, sau đó là task sắp tới
    // Nếu không có task quá hạn, chỉ hiển thị task sắp tới
    const allTasks = [...overdueTasks, ...upcomingTasks];
    
    // Chỉ lấy 3 tasks đầu tiên
    return allTasks.slice(0, 3);
  }, [tasks]);

  // Get 3 nearest milestones sorted by deadline
  const getNearestMilestones = React.useMemo(() => {
    if (!milestones.length) return [];
    
    const now = new Date();
    const sortedMilestones = [...milestones].sort((a, b) => {
      if (!a.endAt || !b.endAt) return 0;
      const deadlineA = new Date(a.endAt);
      const deadlineB = new Date(b.endAt);
      return deadlineA - deadlineB;
    });

    // Lọc các milestone có deadline >= hiện tại (sắp tới) hoặc đã quá hạn nhưng chưa nộp
    const relevantMilestones = sortedMilestones.filter(milestone => {
      if (!milestone.endAt) return false;
      const deadline = new Date(milestone.endAt);
      // Nếu đã quá hạn nhưng status chưa phải SUBMITTED thì vẫn hiển thị
      if (deadline < now && milestone.status === 'SUBMITTED') {
        return false; // Đã nộp rồi thì không hiển thị
      }
      return true;
    });

    // Lấy 3 milestone gần nhất
    return relevantMilestones.slice(0, 3);
  }, [milestones]);

  // Task columns
  const taskTableColumns = React.useMemo(() => [
    { 
      key: 'title', 
      title: 'Task Title',
      render: (row) => (
        <div style={{ fontWeight: 500, color: '#1f2937' }}>
          {row.title || row.name || 'N/A'}
        </div>
      )
    },
    { 
      key: 'deadline', 
      title: 'Deadline',
      render: (row) => {
        if (!row.deadline) return 'N/A';
        const deadline = new Date(row.deadline);
        const now = new Date();
        const isOverdue = deadline < now;
        return (
          <div style={{ 
            color: isOverdue ? '#dc2626' : '#374151',
            fontWeight: isOverdue ? 600 : 400
          }}>
            {formatDate(row.deadline, 'DD/MM/YYYY HH:mm')}
          </div>
        );
      }
    },
    { 
      key: 'status', 
      title: 'Status',
      render: (row) => (
        <span style={{
          color: getTaskStatusColor(row.status),
          background: getTaskStatusColor(row.status) === '#059669' ? '#ecfdf5' : 
                     getTaskStatusColor(row.status) === '#dc2626' ? '#fee2e2' :
                     getTaskStatusColor(row.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          border: `1px solid ${getTaskStatusColor(row.status)}`
        }}>
          {getTaskStatusText(row.status)}
        </span>
      )
    },
    { 
      key: 'priority', 
      title: 'Priority',
      render: (row) => {
        const priorityColors = {
          'High': '#dc2626',
          'Medium': '#f59e0b',
          'Low': '#64748b'
        };
        const color = priorityColors[row.priority] || '#64748b';
        return (
          <span style={{ color, fontWeight: 500 }}>
            {row.priority || 'N/A'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            openTaskDetail(row);
          }}
          style={{ padding: '4px 12px', fontSize: 12 }}
        >
          Details
        </Button>
      )
    }
  ], []);

  // Milestone columns
  const milestoneTableColumns = React.useMemo(() => [
    { 
      key: 'name', 
      title: 'Milestone Name',
      render: (row) => (
        <div style={{ fontWeight: 500, color: '#1f2937' , width: '500px'}}>
          {row.name || 'N/A'}
        </div>
      )
    },
    { 
      key: 'endAt', 
      title: 'Deadline',
      render: (row) => {
        if (!row.endAt) return 'N/A';
        const deadline = new Date(row.endAt);
        const now = new Date();
        const isOverdue = deadline < now && row.status !== 'SUBMITTED';
        return (
          <div style={{ 
            color: isOverdue ? '#dc2626' : '#374151',
            fontWeight: isOverdue ? 600 : 400
          }}>
            {formatDate(row.endAt, 'DD/MM/YYYY HH:mm')}
          </div>
        );
      }
    },
    { 
      key: 'status', 
      title: 'Status',
      render: (row) => (
        <span style={{
          color: getStatusColor(row.status),
          background: getStatusColor(row.status) === '#059669' ? '#ecfdf5' : 
                     getStatusColor(row.status) === '#dc2626' ? '#fee2e2' :
                     getStatusColor(row.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          border: `1px solid ${getStatusColor(row.status)}`
        }}>
          {getStatusText(row.status)}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            openDetailModal(row);
          }}
          style={{ padding: '4px 12px', fontSize: 12 }}
        >
          Details
        </Button>
      )
    }
  ], []);

  // Kiểm tra file có đúng định dạng được phép không
  const isValidFileType = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split('.').pop().toLowerCase();
    const allowedExtensions = [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
      // PDF
      'pdf',
      // Archives
      'zip', '7z',
      // RAR
      'rar'
    ];
    return allowedExtensions.includes(extension);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Kiểm tra định dạng file
      if (!isValidFileType(file.name)) {
        alert('Invalid file type. Only images, PDF, ZIP, 7ZIP, and RAR files are allowed.');
        // Reset input
        event.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (deliveryItemId) => {
    if (!selectedFile || !userInfo?.groups || userInfo.groups.length === 0) return;
    
    // Validate file type trước khi upload
    if (!isValidFileType(selectedFile.name)) {
      alert('Invalid file type. Only images, PDF, ZIP, 7ZIP, and RAR files are allowed.');
      setSelectedFile(null);
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const res = await client.post(
        `https://160.30.21.113:5000/api/v1/upload/milestone?groupId=${userInfo.groups[0]}&deliveryItemId=${deliveryItemId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Reload milestones after successful upload
      const milestonesRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/${userInfo.groups[0]}`);
      const list = Array.isArray(milestonesRes?.data) ? milestonesRes.data : [];
      setMilestones(list);
      
      // Update selectedMilestone with new status
      const updatedMilestone = list.find(m => m.id === selectedMilestone.id);
      if (updatedMilestone) {
        setSelectedMilestone(updatedMilestone);
      }
      
      // Reload milestone details after successful upload
      if (selectedMilestone) {
        const detailRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${userInfo.groups[0]}&deliverableId=${selectedMilestone.id}`);
        setMilestoneDetails(detailRes?.data || null);
      }
      
      setSelectedFile(null);
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (attachment) => {
    try {
      const response = await fetch(`https://160.30.21.113:5000${attachment.path}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.path.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const deleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      const response = await client.delete(`https://160.30.21.113:5000/api/v1/upload/milestone?attachmentId=${attachmentId}`);
      if (response.data.status === 200) {
        alert('File deleted successfully!');
        // Reload milestone details
        if (selectedMilestone) {
          const detailRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${userInfo.groups[0]}&deliverableId=${selectedMilestone.id}`);
          setMilestoneDetails(detailRes?.data || null);
        }
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  // Kiểm tra file có thể xem được không (ảnh, PDF, docs)
  const canPreviewFile = (filePath) => {
    if (!filePath) return false;
    const fileName = filePath.split('/').pop().toLowerCase();
    const extension = fileName.split('.').pop();
    
    // Các định dạng có thể xem được
    const previewableExtensions = [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
      // PDF
      'pdf',
      // Documents (có thể xem qua Google Docs Viewer hoặc Office Online)
      'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      // Text files
      'txt', 'csv'
    ];
    
    return previewableExtensions.includes(extension);
  };

  // Mở preview file trong tab mới
  const openFilePreview = (attachment) => {
    if (!canPreviewFile(attachment.path)) {
      alert('File này không thể xem trước. Vui lòng tải xuống để xem.');
      return;
    }
    
    const filePath = attachment.path;
    const fileName = filePath.split('/').pop().toLowerCase();
    const extension = fileName.split('.').pop();
    const baseUrl = `https://160.30.21.113:5000${filePath}`;
    
    let previewUrl = baseUrl;
    
    // Office documents - sử dụng Google Docs Viewer
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
      previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(baseUrl)}&embedded=true`;
    }
    
    // Mở trong tab mới
    window.open(previewUrl, '_blank');
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Weekly Schedule</h1>
        {groupInfo && (
          <div style={{ fontSize: 14, color: '#64748b' }}>
            Group: {groupInfo.projectName}
          </div>
        )}
      </div>
      
      {semesterInfo && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 16, 
          marginBottom: 16 
        }}>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8, 
            padding: 8, 
            flex: 1
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e' }}>
              Semester: {semesterInfo.name} ({formatDate(semesterInfo.startAt, 'DD/MM/YYYY')} - {formatDate(semesterInfo.endAt, 'DD/MM/YYYY')})
            </div>
          </div>
          {groupInfo?.supervisors && (
            <div style={{ 
              background: '#f0fdf4', 
              border: '1px solid #10b981', 
              borderRadius: 8, 
              padding: 8,
              flex: 1
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>
                Supervisors: {groupInfo.supervisors.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warning if student hasn't selected free time */}
      {!hasSelectedFreeTime && (
        <div style={{ 
          background: '#fef3c7', 
          border: '2px solid #f59e0b', 
          borderRadius: 8, 
          padding: 16,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
              Free Time Schedule Not Selected
            </div>
            <div style={{ fontSize: 13, color: '#78350f' }}>
              You haven't selected your free time schedule yet. Please select your available time slots to help schedule group meetings.
            </div>
          </div>
        </div>
      )}

      {/* Week Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Week:</span>
        <select 
          value={selectedWeek} 
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            backgroundColor: "white",
            outline: "none",
            minWidth: 120,
            maxWidth: 300
          }}
        >
          {weeks.map((week) => (
            <option 
              key={week.weekNumber} 
              value={week.weekNumber}
              disabled={week.isVacation}
              style={{ 
                color: week.isVacation ? '#9ca3af' : '#000',
                backgroundColor: week.isVacation ? '#f3f4f6' : '#fff'
              }}
            >
              Week {week.weekNumber} ({formatDate(week.startAt, 'DD/MM/YYYY')}-{formatDate(week.endAt, 'DD/MM/YYYY')}) {week.isVacation ? '(Vacation)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar Table */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 8, 
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ 
                padding: '12px 8px', 
                borderBottom: '1px solid #e5e7eb', 
                fontWeight: 600, 
                fontSize: 12,
                width: '80px'
              }}>
                Time
              </th>
              {DAYS.map((day) => (
                <th key={day} style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #e5e7eb', 
                  fontWeight: 600, 
                  fontSize: 12,
                  textAlign: 'center'
                }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.length > 0 ? (() => {
              // Lấy tất cả milestones của tuần
              const weekMilestones = getMilestonesForWeek();
              
              // Tạo một map để lưu các milestone không có slot phù hợp
              const milestoneRows = new Map();
              
              weekMilestones.forEach(milestone => {
                if (!milestone.endAt) return;
                const deadline = new Date(milestone.endAt);
                const dayOfWeek = deadline.getDay();
                const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                const hour = deadline.getHours() + (deadline.getMinutes() || 0) / 60;
                
                // Kiểm tra xem có slot nào phù hợp không
                const hasMatchingSlot = timeSlots.some(slot => {
                  return hour >= slot.start && hour < slot.end;
                });
                
                // Nếu không có slot phù hợp, thêm vào milestoneRows
                if (!hasMatchingSlot) {
                  const key = `${adjustedDay}_${hour.toFixed(2)}`;
                  if (!milestoneRows.has(key)) {
                    milestoneRows.set(key, []);
                  }
                  milestoneRows.get(key).push({ milestone, day: adjustedDay, hour });
                }
              });
              
              // Tạo danh sách rows: slots + milestone rows
              const allRows = [];
              
              // Thêm các slot rows
              timeSlots.forEach(slot => {
                allRows.push({ type: 'slot', data: slot });
              });
              
              // Thêm các milestone rows (sắp xếp theo giờ)
              Array.from(milestoneRows.entries()).sort((a, b) => {
                const [dayA, hourA] = a[0].split('_').map(Number);
                const [dayB, hourB] = b[0].split('_').map(Number);
                if (dayA !== dayB) return dayA - dayB;
                return hourA - hourB;
              }).forEach(([key, milestones]) => {
                const [day, hour] = key.split('_').map(Number);
                const milestoneHour = Math.floor(hour);
                const milestoneMinute = Math.round((hour - milestoneHour) * 60);
                const timeStr = `${String(milestoneHour).padStart(2, '0')}:${String(milestoneMinute).padStart(2, '0')}`;
                allRows.push({ 
                  type: 'milestone', 
                  data: { 
                    milestones: milestones.map(m => m.milestone),
                    day,
                    hour,
                    label: `Milestone (${timeStr})`
                  } 
                });
              });
              
              return allRows.map((row, rowIndex) => {
                if (row.type === 'slot') {
                  const timeSlot = row.data;
                  return (
                    <tr key={`slot_${timeSlot.id || timeSlot.label}`}>
                      <td style={{ 
                        padding: '8px', 
                        borderBottom: '1px solid #f1f5f9', 
                        fontSize: 11, 
                        fontWeight: 600,
                        background: '#f8fafc',
                        textAlign: 'center',
                        width: '180px',
                        whiteSpace: 'nowrap'
                      }}>
                        {timeSlot.nameSlot ? `${timeSlot.nameSlot} (${timeSlot.startAt} - ${timeSlot.endAt})` : timeSlot.label}
                      </td>
                      {DAYS.map((day, dayIndex) => {
                        const milestones = getMilestonesForSlot(dayIndex, timeSlot);
                        const meetings = getMeetingsForSlot(dayIndex, timeSlot);
                        const tasks = getTasksForSlot(dayIndex, timeSlot);
                        
                        return (
                          <td key={day} style={{ 
                            padding: '8px', 
                            borderBottom: '1px solid #f1f5f9',
                            borderRight: '1px solid #f1f5f9',
                            minHeight: '60px',
                            verticalAlign: 'top',
                            width: '120px',
                            maxWidth: '120px',
                            wordWrap: 'break-word',
                            overflow: 'hidden'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {/* Milestones - Display all milestones in this slot */}
                              {milestones.map((milestone, idx) => (
                                <div 
                                  key={milestone.id || idx}
                                  onClick={() => openDetailModal(milestone)}
                                  style={{ 
                                    background: getStatusColor(milestone.status) === '#059669' ? '#ecfdf5' : 
                                               getStatusColor(milestone.status) === '#dc2626' ? '#fee2e2' :
                                               getStatusColor(milestone.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                                    border: `1px solid ${getStatusColor(milestone.status)}`,
                                    borderRadius: 4,
                                    padding: 4,
                                    cursor: 'pointer',
                                    fontSize: 9,
                                    maxHeight: '50px',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    maxWidth: '100%',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.02)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: getStatusColor(milestone.status), marginBottom: 2, fontSize: 9, lineHeight: 1.2, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                    📊 {milestone.name.length > 15 ? milestone.name.substring(0, 15) + '...' : milestone.name}
                                  </div>
                                  <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                                    {getStatusText(milestone.status)}
                                  </div>
                                  <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                                    {formatDate(milestone.endAt, 'HH:mm')}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Meetings - Display all meetings in this slot */}
                              {meetings.map((meeting, idx) => (
                                <div 
                                  key={meeting.id || idx}
                                  onClick={() => openMeetingModal(meeting)}
                                  style={{ 
                                    background: getMeetingStatusColor(meeting) === '#059669' ? '#ecfdf5' : 
                                               getMeetingStatusColor(meeting) === '#dc2626' ? '#fee2e2' : '#fef3c7',
                                    border: `1px solid ${getMeetingStatusColor(meeting)}`,
                                    borderRadius: 4,
                                    padding: 4,
                                    cursor: 'pointer',
                                    fontSize: 9,
                                    maxHeight: '50px',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    maxWidth: '100%',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.02)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: getMeetingStatusColor(meeting), marginBottom: 2, fontSize: 9, lineHeight: 1.2, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                    📅 {meeting.description.length > 15 ? meeting.description.substring(0, 15) + '...' : meeting.description}
                                  </div>
                                  <div style={{ color: getMeetingStatusColor(meeting), fontSize: 8 }}>
                                    {getMeetingStatusText(meeting)}
                                  </div>
                                  <div style={{ color: getMeetingStatusColor(meeting), fontSize: 8 }}>
                                    {meeting.startAt ? meeting.startAt.substring(0, 5) : (meeting.time || 'N/A')}
                                    {meeting.endAt && ` - ${meeting.endAt.substring(0, 5)}`}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Tasks - Display all tasks in this slot */}
                              {tasks.map((task, idx) => (
                                <div 
                                  key={task.id || idx}
                                  onClick={() => openTaskDetail(task)}
                                  style={{ 
                                    background: getTaskStatusColor(task.status) === '#059669' ? '#ecfdf5' : 
                                               getTaskStatusColor(task.status) === '#dc2626' ? '#fee2e2' :
                                               getTaskStatusColor(task.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                                    border: `1px solid ${getTaskStatusColor(task.status)}`,
                                    borderRadius: 4,
                                    padding: 4,
                                    cursor: 'pointer',
                                    fontSize: 9,
                                    maxHeight: '50px',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    maxWidth: '100%',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.02)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: getTaskStatusColor(task.status), marginBottom: 2, fontSize: 9, lineHeight: 1.2, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                    📋 {task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                                  </div>
                                  <div style={{ color: getTaskStatusColor(task.status), fontSize: 8 }}>
                                    {getTaskStatusText(task.status)}
                                  </div>
                                  <div style={{ color: getTaskStatusColor(task.status), fontSize: 8 }}>
                                    {formatDate(task.deadline, 'HH:mm')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                } else {
                  // Milestone row
                  const { milestones, day, label } = row.data;
                  return (
                    <tr key={`milestone_${day}_${row.data.hour}`}>
                      <td style={{ 
                        padding: '8px', 
                        borderBottom: '1px solid #f1f5f9', 
                        fontSize: 11, 
                        fontWeight: 600,
                        background: '#fef3c7',
                        textAlign: 'center',
                        width: '180px',
                        whiteSpace: 'nowrap'
                      }}>
                        {label}
                      </td>
                      {DAYS.map((dayName, dayIndex) => {
                        const dayMilestones = dayIndex === day ? milestones : [];
                        return (
                          <td key={dayName} style={{ 
                            padding: '8px', 
                            borderBottom: '1px solid #f1f5f9',
                            borderRight: '1px solid #f1f5f9',
                            minHeight: '60px',
                            verticalAlign: 'top',
                            width: '120px',
                            maxWidth: '120px',
                            wordWrap: 'break-word',
                            overflow: 'hidden'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {dayMilestones.map((milestone, idx) => (
                                <div 
                                  key={milestone.id || idx}
                                  onClick={() => openDetailModal(milestone)}
                                  style={{ 
                                    background: getStatusColor(milestone.status) === '#059669' ? '#ecfdf5' : 
                                               getStatusColor(milestone.status) === '#dc2626' ? '#fee2e2' :
                                               getStatusColor(milestone.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                                    border: `1px solid ${getStatusColor(milestone.status)}`,
                                    borderRadius: 4,
                                    padding: 4,
                                    cursor: 'pointer',
                                    fontSize: 9,
                                    maxHeight: '50px',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    maxWidth: '100%',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.02)';
                                    e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: getStatusColor(milestone.status), marginBottom: 2, fontSize: 9, lineHeight: 1.2, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                    📊 {milestone.name.length > 15 ? milestone.name.substring(0, 15) + '...' : milestone.name}
                                  </div>
                                  <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                                    {getStatusText(milestone.status)}
                                  </div>
                                  <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                                    {formatDate(milestone.endAt, 'HH:mm')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                }
              });
            })() : (
              <tr>
                <td colSpan={8} style={{ 
                  padding: '20px', 
                  textAlign: 'center', 
                  color: '#6b7280',
                  fontSize: 11
                }}>
                  Loading slots...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Debug Info */}
      {/* <div style={{ marginTop: 24, background: '#f3f4f6', padding: 16, borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Debug Info</h3>
        <div style={{ fontSize: 12, color: '#374151' }}>
          <div>Total Tasks: {tasks.length}</div>
          <div>Tasks in current week: {getTasksForWeek().length}</div>
          <div>Selected Week: {selectedWeek}</div>
          <div style={{ marginTop: 8 }}>
            <strong>Week Data:</strong>
            {weeks.slice(0, 3).map(week => (
              <div key={week.weekNumber} style={{ marginTop: 4, padding: 4, background: '#dbeafe', borderRadius: 4 }}>
                <div>Week {week.weekNumber}: {new Date(week.startAt).toLocaleDateString()} - {new Date(week.endAt).toLocaleDateString()}</div>
                <div>Raw: {week.startAt} to {week.endAt}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>All Tasks with deadlines:</strong>
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} style={{ marginTop: 4, padding: 4, background: '#e5e7eb', borderRadius: 4 }}>
                <div>Task {task.id}: {task.title}</div>
                <div>Deadline: {new Date(task.deadline).toLocaleString()}</div>
                <div>Raw deadline: {task.deadline}</div>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Quick Summary */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Quick Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e', marginBottom: 4 }}>
              Total Milestones
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0369a1' }}>
              {milestones.length}
            </div>
          </div>
          
          <div style={{ 
            background: '#ecfdf5', 
            border: '1px solid #10b981', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', marginBottom: 4 }}>
              Submitted
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>
              {milestones.filter(m => m.status === 'SUBMITTED').length}
            </div>
          </div>
          
          <div style={{ 
            background: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
              Pending
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>
              {milestones.filter(m => m.status === 'Pending').length}
            </div>
          </div>
          
          <div style={{ 
            background: '#fee2e2', 
            border: '1px solid #dc2626', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>
              Late
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
              {milestones.filter(m => m.status === 'LATE').length}
            </div>
          </div>
          
          <div style={{ 
            background: '#f3f4f6', 
            border: '1px solid #64748b', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              Unsubmitted
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#64748b' }}>
              {milestones.filter(m => m.status === 'UNSUBMITTED' || !m.status).length}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Tasks Table */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
          Upcoming Tasks
        </h3>
        <div style={{ 
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <DataTable
            columns={taskTableColumns}
            data={getUpcomingTasks}
            loading={loading}
            emptyMessage="No tasks available"
            showIndex={true}
            indexTitle="STT"
          />
        </div>
      </div>

      {/* Nearest Milestones Table */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600, color: '#1f2937' }}>
          3 Nearest Milestones
        </h3>
        <div style={{ 
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <DataTable
            columns={milestoneTableColumns}
            data={getNearestMilestones}
            loading={loading}
            emptyMessage="No milestones available"
            showIndex={true}
            indexTitle="STT"
          />
        </div>
      </div>

      {/* Milestone Detail Modal */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)}>
        {selectedMilestone && (
          <div style={{ padding: 24, maxWidth: '95vw', width: '1200px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20 }}>Milestone Details</h2>
            
            <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Basic Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><strong>Name:</strong> {selectedMilestone.name}</div>
                  <div><strong>Description:</strong> {selectedMilestone.description}</div>
                  <div><strong>Deadline:</strong> {formatDate(selectedMilestone.endAt, 'YYYY-MM-DD HH:mm')}</div>
                  <div><strong>Status:</strong> 
                    <span style={{ 
                      color: getStatusColor(selectedMilestone.status), 
                      marginLeft: '8px',
                      background: getStatusColor(selectedMilestone.status) === '#059669' ? '#ecfdf5' : 
                                 getStatusColor(selectedMilestone.status) === '#dc2626' ? '#fee2e2' :
                                 getStatusColor(selectedMilestone.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      {getStatusText(selectedMilestone.status)}
                    </span>
                  </div>
                  <div><strong>Note:</strong> {milestoneDetails?.note || 'No notes from supervisor'}</div>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Project Information</h3>
                {groupInfo && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div><strong>Project:</strong> {groupInfo.projectName}</div>
                    <div><strong>Supervisors:</strong> {groupInfo.supervisors?.join(', ')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Items */}
            {milestoneDetails?.deliveryItems && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>Delivery Items</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 16 }}>
                  {milestoneDetails.deliveryItems.map((item, index) => (
                    <div key={item.id} style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: 8, 
                      padding: 16, 
                      background: '#f9fafb'
                    }}>
                      <div style={{ marginBottom: 12 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600 }}>{item.name}</h4>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{item.description}</p>
                      </div>
                      
                      {/* Upload Section */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <input
                            type="file"
                            id={`file-${item.id}`}
                            onChange={handleFileSelect}
                            accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf,.zip,.7z,.rar"
                            style={{ display: 'none' }}
                          />
                          <label 
                            htmlFor={`file-${item.id}`}
                            style={{
                              padding: '6px 12px',
                              background: '#3b82f6',
                              color: 'white',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 500
                            }}
                          >
                            Choose File
                          </label>
                          {selectedFile && (
                            <Button
                              onClick={() => handleUpload(item.id)}
                              disabled={uploading}
                              style={{ fontSize: 12, padding: '6px 12px' }}
                            >
                              {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                          )}
                        </div>
                        {selectedFile && (
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            Selected: {selectedFile.name}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
                          Allowed file types: Images (JPG, PNG, GIF, etc.), PDF, ZIP, 7ZIP, RAR
                        </div>
                      </div>

                      {/* All Attachments */}
                      {item.attachments && item.attachments.length > 0 && (
                        <div>
                          <h5 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600 }}>
                            Files ({item.attachments.length}):
                          </h5>
                          
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {item.attachments
                              .sort((a, b) => new Date(b.createAt) - new Date(a.createAt))
                              .map((attachment, index) => {
                                const isLatest = index === 0;
                                return (
                                  <div key={attachment.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    background: isLatest ? '#f0f9ff' : 'white',
                                    border: isLatest ? '2px solid #3b82f6' : '1px solid #d1d5db',
                                    borderRadius: 4,
                                    marginBottom: 8
                                  }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500, wordBreak: 'break-all' }}>
                                          {attachment.path.split('/').pop()}
                                        </div>
                                        {isLatest && (
                                          <span style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600
                                          }}>
                                            CURRENT
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#64748b' }}>
                                        Uploaded by {attachment.userName} on {formatDate(attachment.createAt, 'DD/MM/YYYY HH:mm')}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                                      {canPreviewFile(attachment.path) && (
                                        <button
                                          onClick={() => openFilePreview(attachment)}
                                          style={{ 
                                            padding: '4px 6px',
                                            background: 'transparent',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#6b7280'
                                          }}
                                          title="Preview"
                                          onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#f3f4f6';
                                            e.target.style.borderColor = '#9ca3af';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.borderColor = '#d1d5db';
                                          }}
                                        >
                                          <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            style={{ color: '#6b7280' }}
                                          >
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                          </svg>
                                        </button>
                                      )}
                                      <Button
                                        onClick={() => downloadFile(attachment)}
                                        variant="ghost"
                                        style={{ fontSize: 11, padding: '4px 8px' }}
                                      >
                                        Download
                                      </Button>
                                      {!isLatest && (
                                        <Button
                                          onClick={() => deleteAttachment(attachment.id)}
                                          variant="ghost"
                                          style={{ 
                                            fontSize: 11, 
                                            padding: '4px 8px',
                                            color: '#dc2626',
                                            background: '#fee2e2'
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button variant="ghost" onClick={() => setDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Meeting Modal */}
      <Modal open={meetingModal} onClose={closeMeetingModal}>
        {selectedMeeting && (
          <div style={{ 
            padding: 24, 
            maxWidth: '95vw', 
            width: '1200px', 
            maxHeight: '90vh', 
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>
                {minuteData ? 'View Meeting Minutes' : 'Meeting Information'} - {selectedMeeting.description}
              </h2>
              {minuteData && (
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  <div><strong>Created by:</strong> {minuteData.createBy}</div>
                  <div><strong>Created at:</strong> {formatDate(minuteData.createAt, 'YYYY-MM-DD HH:mm')}</div>
                </div>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: 24, 
              marginBottom: 20,
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                flex: '1 1 300px',
                minWidth: '300px'
              }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Meeting Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><strong>Description:</strong> {selectedMeeting.description}</div>
                  <div><strong>Date:</strong> {formatDate(selectedMeeting.meetingDate, 'YYYY-MM-DD')}</div>
                  <div><strong>Time:</strong> {selectedMeeting.startAt ? `${selectedMeeting.startAt.substring(0, 5)} - ${selectedMeeting.endAt ? selectedMeeting.endAt.substring(0, 5) : ''}` : (selectedMeeting.time || 'N/A')}</div>
                  <div><strong>Day:</strong> {selectedMeeting.dayOfWeek}</div>
                  <div><strong>Status:</strong> 
                    <span style={{ 
                      color: getMeetingStatusColor(selectedMeeting), 
                      marginLeft: '8px',
                      background: getMeetingStatusColor(selectedMeeting) === '#059669' ? '#ecfdf5' : '#fef3c7',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      {getMeetingStatusText(selectedMeeting)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                flex: '1 1 300px',
                minWidth: '300px'
              }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Meeting Link</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button
                    onClick={() => joinMeeting(selectedMeeting.meetingLink)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    Join Meeting
                  </Button>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                  Link: {selectedMeeting.meetingLink}
                </div>
              </div>
            </div>

            {/* Meeting Minute */}
            {minuteData ? (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>Meeting Minutes</h3>
                <div style={{ 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: 8, 
                  padding: 16 
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#065f46', marginBottom: 4 }}>
                      <strong>Created by:</strong> {minuteData.createBy}
                    </div>
                    <div style={{ fontSize: 13, color: '#065f46' }}>
                      <strong>Created at:</strong> {formatDate(minuteData.createAt, 'DD/MM/YYYY HH:mm')}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Time</h4>
                      <div style={{ fontSize: 13, color: '#374151' }}>
                        {selectedMeeting?.startAt && selectedMeeting?.endAt ? (
                          <>
                            <div><strong>Start:</strong> {selectedMeeting.startAt.substring(0, 5)} - {new Date(selectedMeeting.meetingDate).toLocaleDateString('en-US')}</div>
                            <div><strong>End:</strong> {selectedMeeting.endAt.substring(0, 5)} - {new Date(selectedMeeting.meetingDate).toLocaleDateString('en-US')}</div>
                          </>
                        ) : (
                          <>
                            <div><strong>Start:</strong> {minuteData?.startAt ? new Date(minuteData.startAt).toLocaleString('en-US') : 'N/A'}</div>
                            <div><strong>End:</strong> {minuteData?.endAt ? new Date(minuteData.endAt).toLocaleString('en-US') : 'N/A'}</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Attendance List</h4>
                      {attendanceList.length > 0 ? (
                        <div style={{
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '8px',
                          backgroundColor: 'rgba(255,255,255,0.5)'
                        }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Member</th>
                                <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#374151', width: '100px' }}>Attended</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Absence Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendanceList.map((item) => (
                                <tr key={item.studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px 8px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
                                      {item.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
                                      {item.rollNumber} {item.role && `- ${item.role}`}
                                    </div>
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      backgroundColor: item.attended ? '#d1fae5' : '#fee2e2',
                                      color: item.attended ? '#065f46' : '#991b1b'
                                    }}>
                                      {item.attended ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '6px 8px', fontSize: '12px', color: '#6b7280' }}>
                                    {item.reason || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: 13, 
                          color: '#6b7280', 
                          padding: '12px',
                          background: 'rgba(255,255,255,0.5)',
                          borderRadius: '4px',
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                          {minuteData?.attendance || 'No attendance information available'}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Meeting Content</h4>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#374151', 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.5)',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        minHeight: '120px'
                      }}>
                        {minuteData.meetingContent || 'N/A'}
                      </div>
                    </div>
                    
                    {/* Meeting Issues table thay cho phần vấn đề cần giải quyết */}
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Meeting Issues</h4>
                      <div style={{ marginTop: 8, maxWidth: '100%', overflowX: 'hidden' }}>
                        <DataTable
                          columns={meetingIssueColumns}
                          data={meetingIssues}
                          loading={loading}
                          emptyMessage="No issues available"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Other Notes</h4>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#374151', 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.5)',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        minHeight: '80px'
                      }}>
                        {minuteData.other || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                background: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: 8, 
                padding: 16,
                marginBottom: 20
              }}>
                <p style={{ margin: 0, fontSize: 14, color: '#92400e' }}>
                  No meeting minutes available for this meeting.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button variant="ghost" onClick={closeMeetingModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
