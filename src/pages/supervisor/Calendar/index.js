import React from 'react';
// import styles from './index.module.scss';
import sharedLayout from '../sharedLayout.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Input from '../../../components/Input/Input';
import Textarea from '../../../components/Textarea/Textarea';
import DataTable from '../../../components/DataTable/DataTable';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../../utils/date';
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from '../../../auth/auth';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { getSlotsByCampusId } from '../../../api/slots';
import { getDeliverablesByGroup, getDeliverableDetail } from '../../../api/deliverables';
import { getTasksByGroup } from '../../../api/tasks';
import { getMeetingScheduleDatesByGroup, getMeetingMinutesByMeetingDateId } from '../../../api/meetings';
import { getMeetingTasksByMinuteId } from '../../../api/tasks';
import { getSemesterDetail } from '../../../api/semester';
import SupervisorGroupFilter from '../../../components/SupervisorGroupFilter/SupervisorGroupFilter';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SupervisorCalendar() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = React.useState(null);
  const [groups, setGroups] = React.useState([]);
  const [semesterInfo, setSemesterInfo] = React.useState(null);
  const [weeks, setWeeks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [meetings, setMeetings] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [selectedWeek, setSelectedWeek] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  
  // Modal states
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [meetingModal, setMeetingModal] = React.useState(false);
  const [taskModal, setTaskModal] = React.useState(false);
  const [milestoneModal, setMilestoneModal] = React.useState(false);
  const [minuteData, setMinuteData] = React.useState(null);
  const [showMinuteModal, setShowMinuteModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    startAt: '',
    endAt: '',
    attendance: '',
    issue: '',
    meetingContent: '',
    other: ''
  });
  const [formErrors, setFormErrors] = React.useState({});
  const [milestoneDetails, setMilestoneDetails] = React.useState(null);
  const [selectedMeetingGroupInfo, setSelectedMeetingGroupInfo] = React.useState(null);
  const [meetingIssues, setMeetingIssues] = React.useState([]);
  const [timeSlots, setTimeSlots] = React.useState([]); // Slots from API
  const [attendanceList, setAttendanceList] = React.useState([]); // [{ studentId, name, rollNumber, attended: boolean, reason: string }]
  const [semesters, setSemesters] = React.useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState(null);
  const [groupExpireFilter, setGroupExpireFilter] = React.useState('active'); // 'active' or 'expired'

  // Load user info from localStorage, don't call API
  React.useEffect(() => {
    let mounted = true;
    function loadUserInfo() {
      try {
        const user = getUserInfo();
        if (!mounted) return;
        setUserInfo(user);
        
        // Get semesters and set default
        const uniqueSemesters = getUniqueSemesters();
        setSemesters(uniqueSemesters);
        
        const currentSemesterId = getCurrentSemesterId();
        if (currentSemesterId) {
          setSelectedSemesterId(currentSemesterId);
        } else if (uniqueSemesters.length > 0) {
          setSelectedSemesterId(uniqueSemesters[0].id);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error loading user info:', error);
        setUserInfo(null);
        setGroups([]);
      }
    }
    loadUserInfo();
    return () => { mounted = false; };
  }, []);

  // Load groups from localStorage when filter changes (no API call)
  React.useEffect(() => {
    if (selectedSemesterId === null || !userInfo) {
      setGroups([]);
      return;
    }
    
    // Get groups from localStorage based on semester and expired status
    const isExpired = groupExpireFilter === 'expired';
    const groupsFromStorage = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
    
    // Only store basic info from localStorage, don't fetch details yet
    const groupsBasicInfo = groupsFromStorage.map(groupInfo => ({
      id: groupInfo.id,
      name: groupInfo.name || '',
      groupCode: groupInfo.code || groupInfo.groupCode || '',
      semesterId: groupInfo.semesterId,
      isExpired: groupInfo.isExpired || false
    }));
    
    setGroups(groupsBasicInfo);
    setLoading(false); // Set loading false after groups are loaded from localStorage
    
    // Clear data when filter changes
    setMilestones([]);
    setMeetings([]);
    setTasks([]);
  }, [selectedSemesterId, groupExpireFilter, userInfo]); 

  // Load slots from API based on campusId
  React.useEffect(() => {
    let mounted = true;
    async function loadSlots() {
      if (!userInfo?.campusId) return;
      try {
        const res = await getSlotsByCampusId(userInfo.campusId);
        if (res.status === 200 && res.data?.slots) {
          const slots = res.data.slots;
          // Convert slots from API to appropriate format
          const formattedSlots = slots.map(slot => {
            // Parse time from "7:30 AM" or "1:00 PM" format
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
        // Fallback to default TIME_SLOTS if error
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

  // Load semester info and weeks from first group
  React.useEffect(() => {
    let mounted = true;
    async function loadSemesterInfo() {
      if (!groups.length || !groups[0]?.semesterId) return;
      try {
        const res = await getSemesterDetail(groups[0].semesterId);
        const semester = res?.data || null;
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
  }, [groups]);


  // Selected group state for Calendar
  const [selectedGroupId, setSelectedGroupId] = React.useState(null);

  // Load data only when a group is selected
  React.useEffect(() => {
    if (!selectedGroupId) {
      setMilestones([]);
      setMeetings([]);
      setTasks([]);
      return;
    }

    // Check if selected group exists in current filtered groups
    const isExpired = groupExpireFilter === 'expired';
    const groupsFromStorage = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
    const selectedGroupExists = groupsFromStorage.some(g => g.id === Number(selectedGroupId));
    
    if (!selectedGroupExists) {
      setMilestones([]);
      setMeetings([]);
      setTasks([]);
      return;
    }

    let mounted = true;
    async function loadGroupData() {
      try {
        // Load milestones, meetings, tasks for selected group
        const [milestonesRes, meetingsRes, tasksRes] = await Promise.allSettled([
          getDeliverablesByGroup(selectedGroupId),
          getMeetingScheduleDatesByGroup(selectedGroupId),
          getTasksByGroup(selectedGroupId)
        ]);
;
        if (!mounted) return;

        // Process milestones
        if (milestonesRes.status === 'fulfilled') {
          const list = Array.isArray(milestonesRes.value) ? milestonesRes.value : [];
          const milestonesWithGroup = list.map(milestone => ({
            ...milestone,
            groupId: selectedGroupId
          }));
          setMilestones(milestonesWithGroup);
        } else {
          setMilestones([]);
        }

        // Process meetings
        if (meetingsRes.status === 'fulfilled' && meetingsRes.value?.status === 200) {
        
          const meetingsData = meetingsRes.value?.data || [];
          const meetingsWithGroup = meetingsData.map(meeting => ({
            ...meeting,
            groupId: selectedGroupId
          }));
          meetingsWithGroup.sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));
          setMeetings(meetingsWithGroup);
        } else {
          setMeetings([]);
        }

        // Process tasks
        if (tasksRes.status === 'fulfilled' && tasksRes.value?.status === 200) {
         
          const tasksData = tasksRes.value?.data || [];
          const tasksWithGroup = tasksData.map(task => ({
            ...task,
            groupId: selectedGroupId
          }));
          setTasks(tasksWithGroup);
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error('Error loading group data:', error);
        if (!mounted) return;
        setMilestones([]);
        setMeetings([]);
        setTasks([]);
      }
    }
    loadGroupData();
    return () => { mounted = false; };
  }, [selectedGroupId, selectedSemesterId, groupExpireFilter]);

  // Set loading false when groups are loaded (no need to wait for data)
  React.useEffect(() => {
    if (userInfo && groups.length >= 0 && semesterInfo && weeks.length > 0) {
      setLoading(false);
    }
  }, [userInfo, groups, semesterInfo, weeks]);

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

  // Get tasks for selected week (only active tasks)
  const getTasksForWeek = () => {
    if (!selectedWeek || !tasks.length) return [];
    
    const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);
    if (!selectedWeekData) return [];
    
    const weekStart = new Date(selectedWeekData.startAt);
    const weekEnd = new Date(selectedWeekData.endAt);
    
    // Set week end to 23:59:59 to include the entire last day
    weekEnd.setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      // Chỉ lấy task có isActive === true
      if (task.isActive !== true) return false;
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return deadline >= weekStart && deadline <= weekEnd;
    });
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
          return '#d97706'; 
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
      case 'Inprogress':
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
      case 'Inprogress':
        return '🔄 In Progress';
      case 'Done':
        return '✅ Done';
      case 'InReview':
        return '👀 In Review';
      default:
        return '❓ Unknown';
    }
  };

  // Hàm lấy màu dựa trên taskType
  const getTaskTypeColor = (taskType) => {
    switch (taskType) {
      case 'Meeting':
        return '#8b5cf6'; // Màu tím cho Meeting issues
      case 'Throughout':
        return '#3b82f6'; // Màu xanh dương cho Throughout tasks
      default:
        return null; // Không có màu đặc biệt
    }
  };

  // Hàm lấy text cho taskType
  const getTaskTypeText = (taskType) => {
    switch (taskType) {
      case 'Meeting':
        return 'Meeting';
      case 'Throughout':
        return 'Throughout';
      default:
        return '';
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

  // Fetch group info for meeting
  const fetchMeetingGroupInfo = async (groupId) => {
    try {
      const response = await getCapstoneGroupDetail(groupId);
      if (response.status === 200) {
        setSelectedMeetingGroupInfo(response.data);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching group info:', error);
      setSelectedMeetingGroupInfo(null);
      return null;
    }
  };

  // Function to parse attendance text into list
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
        const isAbsent = statusLower.includes('absent') || statusLower.includes('nghỉ') || statusLower.includes('vắng');
        let reason = '';
        
        if (isAbsent) {
          const reasonMatch = status.match(/(?:absent|nghỉ|vắng)\s*-\s*(.+)/i);
          reason = reasonMatch ? reasonMatch[1].trim() : status.replace(/^(absent|nghỉ|vắng)\s*-?\s*/i, '').trim();
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

  // Fetch meeting issues (tasks) by meeting minute id
  const fetchMeetingIssues = async (meetingMinuteId) => {
    try {
      const res = await getMeetingTasksByMinuteId(meetingMinuteId);
      const data = res?.data;
      const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
      return tasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        deadline: t.deadline,
        isActive: t.isActive,
        groupId: t.groupId
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
    { key: 'deadline', title: 'Hạn', render: (row) => formatDateTime(row.deadline) },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/supervisor/task/group/${row.groupId}?taskId=${row.id}`);
            }}
            style={{
              background: '#2563EB', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >Detail</button>
        </div>
      )
    }
  ];

  // Open meeting modal
  const openMeetingModal = async (meeting) => {
    setSelectedMeeting(meeting);
    setMinuteData(null);
    setMeetingIssues([]);
    setAttendanceList([]);
    setSelectedMeetingGroupInfo(null);
    // Không hiện modal ngay, đợi load xong dữ liệu
    
    try {
      // Fetch group info để parse attendance
      let currentGroupInfo = null;
      if (meeting.groupId) {
        currentGroupInfo = await fetchMeetingGroupInfo(meeting.groupId);
      }

      // Only fetch meeting minute if isMinute === true
      if (meeting.isMinute === true) {
        try {
          const response = await getMeetingMinutesByMeetingDateId(meeting.id);
          if (response.status === 200 && response.data) {
            setMinuteData(response.data);
            
            // Parse attendance from text
            if (currentGroupInfo && currentGroupInfo.students) {
              const students = Array.isArray(currentGroupInfo.students) ? currentGroupInfo.students : [];
              const parsedAttendance = parseAttendance(response.data.attendance, students);
              setAttendanceList(parsedAttendance);
            }
            
            setFormData({
              startAt: response.data.startAt ? response.data.startAt.split('T')[0] + 'T' + response.data.startAt.split('T')[1].substring(0, 5) : '',
              endAt: response.data.endAt ? response.data.endAt.split('T')[0] + 'T' + response.data.endAt.split('T')[1].substring(0, 5) : '',
              attendance: response.data.attendance || '',
              issue: response.data.issue || '',
              meetingContent: response.data.meetingContent || '',
              other: response.data.other || ''
            });
            setIsEditing(true);
            
            // Load meeting issues by meeting minute id
            if (response.data.id) {
              const meetingTasks = await fetchMeetingIssues(response.data.id);
              setMeetingIssues(Array.isArray(meetingTasks) ? meetingTasks : []);
            }
          } else {
            setMinuteData(null);
            setIsEditing(false);
          }
        } catch (error) {
          console.error('Error fetching meeting minute:', error);
          setMinuteData(null);
          setIsEditing(false);
        }
      } else {
        setMinuteData(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error loading meeting data:', error);
    } finally {
      // Only show modal after all data is loaded
      setMeetingModal(true);
    }
  };

  // Navigate to task detail page
  const openTaskModal = (task) => {
    const groupId = task.groupId;
    const taskId = task.id;
    if (groupId && taskId) {
      navigate(`/supervisor/task/group/${groupId}?taskId=${taskId}`);
    } else {
      console.error('Task missing groupId or id:', task);
    }
  };

  // Open milestone modal
  const openMilestoneModal = async (milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneModal(true);
    
    // Load milestone details
    try {
      const res = await getDeliverableDetail(milestone.groupId, milestone.id);
      setMilestoneDetails(res?.data || null);
    } catch (error) {
      console.error('Error loading milestone details:', error);
      setMilestoneDetails(null);
    }
  };

  // Close modals
  const closeMeetingModal = () => {
    setMeetingModal(false);
    setSelectedMeeting(null);
    setSelectedMeetingGroupInfo(null);
    setMinuteData(null);
    setIsEditing(false);
    setMeetingIssues([]);
    setAttendanceList([]);
    setFormData({
      startAt: '',
      endAt: '',
      attendance: '',
      issue: '',
      meetingContent: '',
      other: ''
    });
    setFormErrors({});
  };

  const closeTaskModal = () => {
    setTaskModal(false);
    setSelectedTask(null);
  };

  const closeMilestoneModal = () => {
    setMilestoneModal(false);
    setSelectedMilestone(null);
    setMilestoneDetails(null);
  };

  // Get group code by ID
  const getGroupCode = (groupId) => {
    const group = groups.find(g => g.id === groupId || g.id === String(groupId));
    return group?.groupCode || `GRP${groupId}`;
  };

  // Join meeting
  const joinMeeting = (meetingLink) => {
    window.open(meetingLink, '_blank');
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
        <div>Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className={sharedLayout.container}>
      {/* Header */}
      <div className={sharedLayout.header}>
        <h1>Supervisor Calendar</h1>
        <p>Managing {groups.length} group{groups.length > 1 ? 's' : ''}</p>
      </div>

      {/* Semester + Group Filter */}
      <div style={{ marginBottom: 24 }}>
        <SupervisorGroupFilter
          semesters={semesters}
          selectedSemesterId={selectedSemesterId}
          onSemesterChange={setSelectedSemesterId}
          groupExpireFilter={groupExpireFilter}
          onGroupExpireFilterChange={setGroupExpireFilter}
          groups={groups}
          selectedGroupId={selectedGroupId ? selectedGroupId.toString() : ''}
          onGroupChange={(value) => setSelectedGroupId(value ? Number(value) : null)}
          groupSelectPlaceholder="-- Select group to view calendar --"
          loading={loading}
        />
      </div>
      
      {/* Semester Info */}
      {semesterInfo && (
        <div style={{ 
          marginBottom: 16 
        }}>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8, 
            padding: 8, 
            maxWidth: '100%'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e' }}>
              Semester: {semesterInfo.name} ({formatDate(semesterInfo.startAt, 'DD/MM/YYYY')} - {formatDate(semesterInfo.endAt, 'DD/MM/YYYY')})
            </div>
          </div>
        </div>
      )}

      {/* Week Selector */}
      <div className={sharedLayout.contentSection} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
      </div>

      {/* Calendar Table */}
      <div className={sharedLayout.contentSection} style={{ 
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ 
                padding: '12px 8px', 
                borderBottom: '1px solid #e5e7eb', 
                fontWeight: 600, 
                fontSize: 12,
                width: '180px',
                whiteSpace: 'nowrap'
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
                                  onClick={() => openMilestoneModal(milestone)}
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
                                    {formatDate(milestone.endAt, 'HH:mm')} ({getGroupCode(milestone.groupId)})
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
                                    {' '}({getGroupCode(meeting.groupId)})
                                  </div>
                                </div>
                              ))}
                              
                              {/* Tasks - Display all tasks in this slot */}
                              {tasks.map((task, idx) => {
                                const taskTypeColor = getTaskTypeColor(task.taskType);
                                const statusColor = getTaskStatusColor(task.status);
                                // Nếu có taskTypeColor, dùng nó cho border, nếu không thì dùng statusColor
                                const borderColor = taskTypeColor || statusColor;
                                // Background dựa trên status, nhưng có thể điều chỉnh nếu có taskType
                                let backgroundColor = statusColor === '#059669' ? '#ecfdf5' : 
                                                    statusColor === '#dc2626' ? '#fee2e2' :
                                                    statusColor === '#d97706' ? '#fef3c7' : '#f3f4f6';
                                
                                return (
                                  <div 
                                    key={task.id || idx}
                                    onClick={() => openTaskModal(task)}
                                    style={{ 
                                      background: backgroundColor,
                                      border: `2px solid ${borderColor}`,
                                      borderRadius: 4,
                                      padding: 4,
                                      cursor: 'pointer',
                                      fontSize: 9,
                                      maxHeight: '50px',
                                      overflow: 'hidden',
                                      transition: 'all 0.2s ease',
                                      maxWidth: '100%',
                                      width: '100%',
                                      boxSizing: 'border-box',
                                      position: 'relative'
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                      <div style={{ fontWeight: 600, color: borderColor, fontSize: 9, lineHeight: 1.2, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', flex: 1 }}>
                                        📋 {task.title?.length > 15 ? task.title.substring(0, 15) + '...' : (task.title || task.name || 'N/A')}
                                      </div>
                                      {taskTypeColor && (
                                        <span style={{
                                          fontSize: '7px',
                                          padding: '1px 3px',
                                          backgroundColor: taskTypeColor,
                                          color: 'white',
                                          borderRadius: '3px',
                                          fontWeight: '600',
                                          whiteSpace: 'nowrap',
                                          flexShrink: 0
                                        }}>
                                          {getTaskTypeText(task.taskType)}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ color: statusColor, fontSize: 8 }}>
                                      {getTaskStatusText(task.status)}
                                    </div>
                                    <div style={{ color: statusColor, fontSize: 8 }}>
                                      {formatDate(task.deadline, 'HH:mm')} ({getGroupCode(task.groupId)})
                                    </div>
                                  </div>
                                );
                              })}
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
                                  onClick={() => openMilestoneModal(milestone)}
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
                                    {formatDate(milestone.endAt, 'HH:mm')} ({getGroupCode(milestone.groupId)})
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
                  Đang tải slots...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                {minuteData ? 'Xem biên bản họp' : 'Thông tin cuộc họp'} - {selectedMeeting.description}
              </h2>
              {minuteData && (
                <div style={{ fontSize: 14, color: '#64748b' }}>
                  <div><strong>Tạo bởi:</strong> {minuteData.createBy}</div>
                  <div><strong>Ngày tạo:</strong> {formatDate(minuteData.createAt, 'YYYY-MM-DD HH:mm')}</div>
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
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Thông tin cuộc họp</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><strong>Mô tả:</strong> {selectedMeeting.description}</div>
                  <div><strong>Ngày:</strong> {formatDate(selectedMeeting.meetingDate, 'YYYY-MM-DD')}</div>
                  <div><strong>Giờ:</strong> {selectedMeeting.startAt ? `${selectedMeeting.startAt.substring(0, 5)} - ${selectedMeeting.endAt ? selectedMeeting.endAt.substring(0, 5) : ''}` : (selectedMeeting.time || 'N/A')}</div>
                  <div><strong>Thứ:</strong> {selectedMeeting.dayOfWeek}</div>
                  <div><strong>Trạng thái:</strong> 
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
                  <div><strong>Nhóm:</strong> {selectedMeetingGroupInfo?.groupCode || `GRP${selectedMeeting.groupId}`} - {selectedMeetingGroupInfo?.projectName || 'N/A'}</div>
                </div>
              </div>
              
              <div style={{ 
                flex: '1 1 300px',
                minWidth: '300px'
              }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Link cuộc họp</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a 
                    href={selectedMeeting.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 500,
                      padding: '8px 16px',
                      backgroundColor: '#dbeafe',
                      borderRadius: 6,
                      border: '1px solid #3b82f6'
                    }}
                  >
                    Tham gia cuộc họp
                  </a>
                </div>
              </div>
            </div>

            {/* Meeting Minute */}
            {minuteData ? (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>Biên bản họp</h3>
                <div style={{ 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: 8, 
                  padding: 16 
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#065f46', marginBottom: 4 }}>
                      <strong>Tạo bởi:</strong> {minuteData.createBy}
                    </div>
                    <div style={{ fontSize: 13, color: '#065f46' }}>
                      <strong>Ngày tạo:</strong> {formatDate(minuteData.createAt, 'DD/MM/YYYY HH:mm')}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Thời gian</h4>
                      <div style={{ fontSize: 13, color: '#374151' }}>
                        {selectedMeeting?.startAt && selectedMeeting?.endAt ? (
                          <>
                            <div><strong>Bắt đầu:</strong> {selectedMeeting.startAt.substring(0, 5)} - {new Date(selectedMeeting.meetingDate).toLocaleDateString('vi-VN')}</div>
                            <div><strong>Kết thúc:</strong> {selectedMeeting.endAt.substring(0, 5)} - {new Date(selectedMeeting.meetingDate).toLocaleDateString('vi-VN')}</div>
                          </>
                        ) : (
                          <>
                            <div><strong>Bắt đầu:</strong> {minuteData?.startAt ? new Date(minuteData.startAt).toLocaleString('vi-VN') : 'N/A'}</div>
                            <div><strong>Kết thúc:</strong> {minuteData?.endAt ? new Date(minuteData.endAt).toLocaleString('vi-VN') : 'N/A'}</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Danh sách tham gia</h4>
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
                                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Thành viên</th>
                                <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#374151', width: '100px' }}>Tham gia</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Lý do nghỉ</th>
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
                                      {item.attended ? 'Có' : 'Không'}
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
                          {minuteData?.attendance || 'Chưa có thông tin điểm danh'}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Nội dung cuộc họp</h4>
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
                          emptyMessage="Chưa có issue nào"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Ghi chú khác</h4>
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
                  Chưa có biên bản họp cho cuộc họp này.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button variant="ghost" onClick={closeMeetingModal}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Task Modal */}
      <Modal open={taskModal} onClose={closeTaskModal}>
        {selectedTask && (
          <div style={{ padding: 24, maxWidth: '95vw', width: '1200px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20 }}>Task Details</h2>
            
            <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Task Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><strong>Title:</strong> {selectedTask.title}</div>
                  <div><strong>Description:</strong> {selectedTask.description}</div>
                  <div><strong>Deadline:</strong> {formatDate(selectedTask.deadline, 'YYYY-MM-DD HH:mm')}</div>
                  <div><strong>Priority:</strong> {selectedTask.priority}</div>
                  <div><strong>Status:</strong> 
                    <span style={{ 
                      color: getTaskStatusColor(selectedTask.status), 
                      marginLeft: '8px',
                      background: getTaskStatusColor(selectedTask.status) === '#059669' ? '#ecfdf5' : 
                                 getTaskStatusColor(selectedTask.status) === '#dc2626' ? '#fee2e2' :
                                 getTaskStatusColor(selectedTask.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      {getTaskStatusText(selectedTask.status)}
                    </span>
                  </div>
                  <div><strong>Progress:</strong> {selectedTask.process}%</div>
                  <div><strong>Task Type:</strong> {selectedTask.taskType || 'N/A'}</div>
                  <div><strong>Is Meeting Task:</strong> {selectedTask.isMeetingTask ? 'Yes' : 'No'}</div>
                  <div><strong>Group ID:</strong> {selectedTask.groupId}</div>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Assignment</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><strong>Assignee:</strong> {selectedTask.assigneeName || 'N/A'}</div>
                  <div><strong>Reviewer:</strong> {selectedTask.reviewerName || 'N/A'}</div>
                  <div><strong>Created by:</strong> {selectedTask.createdByName || 'N/A'}</div>
                  <div><strong>Created at:</strong> {selectedTask.createdAt ? formatDate(selectedTask.createdAt, 'YYYY-MM-DD HH:mm') : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Milestone Information */}
            {selectedTask.milestone && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>Related Milestone</h3>
                <div style={{ 
                  background: '#f0f9ff', 
                  border: '1px solid #0ea5e9', 
                  borderRadius: 8, 
                  padding: 16 
                }}>
                  <div><strong>Milestone:</strong> {selectedTask.milestone.name}</div>
                  <div><strong>Description:</strong> {selectedTask.milestone.description}</div>
                </div>
              </div>
            )}

            {/* Comments */}
            {selectedTask.comments && selectedTask.comments.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>Comments ({selectedTask.comments.length})</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {selectedTask.comments.map((comment, index) => (
                    <div key={index} style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      padding: 12,
                      marginBottom: 8
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ fontSize: 13 }}>{comment.authorName}</strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {formatDate(comment.timestamp, 'DD/MM/YYYY HH:mm')}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {selectedTask.history && selectedTask.history.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>Task History</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {selectedTask.history.map((history, index) => (
                    <div key={index} style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: 6,
                      padding: 12,
                      marginBottom: 8
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ fontSize: 13 }}>{history.action}</strong>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {formatDate(history.at, 'DD/MM/YYYY HH:mm')}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>{history.detail}</p>
                      {history.user && (
                        <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748b' }}>
                          User: {history.user}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button variant="ghost" onClick={closeTaskModal}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Milestone Modal */}
      <Modal open={milestoneModal} onClose={closeMilestoneModal}>
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
                  <div><strong>Note:</strong> {milestoneDetails?.note || 'Chưa có ghi chú nào'}</div>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Project Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><strong>Group ID:</strong> {selectedMilestone.groupId}</div>
                </div>
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
                                        {attachment.isDownload && (
                                          <span style={{
                                            background: '#059669',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600
                                          }}>
                                            DOWNLOADED
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
                                          title="Xem trước"
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
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = `https://160.30.21.113:5000${attachment.path}`;
                                          link.download = attachment.path.split('/').pop();
                                          link.click();
                                        }}
                                        variant="ghost"
                                        style={{ fontSize: 11, padding: '4px 8px' }}
                                      >
                                        Download
                                      </Button>
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
              <Button variant="ghost" onClick={closeMilestoneModal}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
