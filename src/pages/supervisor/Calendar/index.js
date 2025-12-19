import React from 'react';
import styles from './index.module.scss';
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
import { getMeetingScheduleByGroupId } from '../../../api/schedule';
import SupervisorGroupFilter from '../../../components/SupervisorGroupFilter/SupervisorGroupFilter';
import { getTaskTypeIssuesByGroup } from '../../../api/tasks/issues';
import { getFileUrl } from '../../../utils/fileUrl';

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
  const [loadingMinuteModal, setLoadingMinuteModal] = React.useState(false);
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
  const [groupsWithoutSchedule, setGroupsWithoutSchedule] = React.useState([]); // Danh sách nhóm chưa chốt lịch họp
  const [groupDetails, setGroupDetails] = React.useState([]); // Chi tiết các nhóm
  const [groupIssues, setGroupIssues] = React.useState({}); // { groupId: [issues] }

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
              const time = timeStr.trim().toUpperCase();
            
              // Nếu là format 24h (HH:mm)
              if (!time.includes('AM') && !time.includes('PM')) {
                const [h, m] = time.split(':').map(Number);
                return h + m / 60;
              }
            
              // Format 12h (AM/PM)
              const isPM = time.includes('PM');
              const timePart = time.replace(/AM|PM/g, '').trim();
              const [hours, minutes] = timePart.split(':').map(Number);
            
              let hour24 = hours;
              if (isPM && hours !== 12) hour24 += 12;
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
          // Tìm tuần hiện tại dựa trên ngày hiện tại
          const now = new Date();
          const currentWeek = semester.weeks.find(week => {
            const startAt = new Date(week.startAt);
            const endAt = new Date(week.endAt);
            endAt.setHours(23, 59, 59, 999);
            return now >= startAt && now <= endAt;
          });
          setSelectedWeek(currentWeek ? currentWeek.weekNumber : semester.weeks[0].weekNumber);
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


  // Load group details for all groups
  React.useEffect(() => {
    let mounted = true;
    async function loadGroupDetails() {
      if (!groups.length) {
        setGroupDetails([]);
        return;
      }
      
      try {
        const detailsPromises = groups.map(async (group) => {
          try {
            const res = await getCapstoneGroupDetail(group.id);
            return res?.data || null;
          } catch (error) {
            console.error(`Error loading group details for ${group.id}:`, error);
            return null;
          }
        });
        
        const details = await Promise.all(detailsPromises);
        if (!mounted) return;
        setGroupDetails(details.filter(d => d !== null));
      } catch (error) {
        console.error('Error loading group details:', error);
        if (!mounted) return;
        setGroupDetails([]);
      }
    }
    loadGroupDetails();
    return () => { mounted = false; };
  }, [groups]);

  // Check groups without schedule
  React.useEffect(() => {
    let mounted = true;
    async function checkGroupsSchedule() {
      if (!groups.length) {
        setGroupsWithoutSchedule([]);
        return;
      }

      try {
        const groupsWithoutScheduleList = [];

        for (const group of groups) {
          try {
            const response = await getMeetingScheduleByGroupId(group.id);
            // API có thể trả về { status: 200, data: {...}, message: "..." } hoặc throw error
            if (response && response.status === 200) {
              const data = response.data;
              // Kiểm tra nếu message là "Schedule not found." hoặc data.id === 0 hoặc không có thông tin hợp lệ
              if (response.message === "Schedule not found." || 
                  !data || 
                  !data.id || 
                  data.id === 0 || 
                  !data.isActive || 
                  !data.meetingLink || 
                  !data.slot || 
                  !data.dayOfWeek) {
                // Lưu cả string và number để so sánh dễ dàng
                groupsWithoutScheduleList.push(String(group.id));
                groupsWithoutScheduleList.push(Number(group.id));
              }
            } else {
              // Response không hợp lệ, coi như chưa chốt lịch
              groupsWithoutScheduleList.push(String(group.id));
              groupsWithoutScheduleList.push(Number(group.id));
            }
          } catch (error) {
            console.error(`Error checking schedule for group ${group.id}:`, error);
            // Nếu lỗi, cũng coi như chưa chốt lịch
            groupsWithoutScheduleList.push(String(group.id));
            groupsWithoutScheduleList.push(Number(group.id));
          }
        }

        if (!mounted) return;
        setGroupsWithoutSchedule(groupsWithoutScheduleList);
      } catch (error) {
        console.error('Error checking groups schedule:', error);
        if (!mounted) return;
        setGroupsWithoutSchedule([]);
      }
    }
    checkGroupsSchedule();
    return () => { mounted = false; };
  }, [groups]);

  // Load data for all groups
  React.useEffect(() => {
    if (!groups.length || !selectedSemesterId) {
      setMilestones([]);
      setMeetings([]);
      setTasks([]);
      return;
    }

    let mounted = true;
    async function loadAllGroupsData() {
      try {
        const allMilestones = [];
        const allMeetings = [];

        // Load data for each group
        for (const group of groups) {
          try {
            // Load milestones
            const milestonesRes = await getDeliverablesByGroup(group.id);
            if (Array.isArray(milestonesRes)) {
              milestonesRes.forEach(milestone => {
                allMilestones.push({
                  ...milestone,
                  groupId: group.id
                });
              });
            }

            // Load meetings
            const meetingsRes = await getMeetingScheduleDatesByGroup(group.id);
            if (meetingsRes?.status === 200 && Array.isArray(meetingsRes.data)) {
              meetingsRes.data.forEach(meeting => {
                allMeetings.push({
                  ...meeting,
                  groupId: group.id
                });
              });
            }

          } catch (error) {
            console.error(`Error loading data for group ${group.id}:`, error);
          }
        }

        if (!mounted) return;

        // Sort meetings by date
        allMeetings.sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));

        setMilestones(allMilestones);
        setMeetings(allMeetings);
        setTasks([]);
      } catch (error) {
        console.error('Error loading all groups data:', error);
        if (!mounted) return;
        setMilestones([]);
        setMeetings([]);
        setTasks([]);
      }
    }
    loadAllGroupsData();
    return () => { mounted = false; };
  }, [groups, selectedSemesterId, groupExpireFilter]);

  // Load group issues for all groups
  React.useEffect(() => {
    let mounted = true;
    async function loadAllGroupIssues() {
      if (!groups.length) {
        setGroupIssues({});
        return;
      }
      
      try {
        const issuesMap = {};
        for (const group of groups) {
          try {
            const res = await getTaskTypeIssuesByGroup(group.id);
            if (res?.code === 200) {
              const issuesData = res.data || [];
              // Add groupId to each issue
              issuesMap[group.id] = Array.isArray(issuesData) ? issuesData.map(issue => ({
                ...issue,
                groupId: group.id
              })) : [];
            }
          } catch (error) {
            console.error(`Error loading issues for group ${group.id}:`, error);
            issuesMap[group.id] = [];
          }
        }
        
        if (!mounted) return;
        setGroupIssues(issuesMap);
      } catch (error) {
        console.error('Error loading group issues:', error);
        if (!mounted) return;
        setGroupIssues({});
      }
    }
    loadAllGroupIssues();
    return () => { mounted = false; };
  }, [groups]);

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

  // Get issues for selected week
  const getIssuesForWeek = () => {
    if (!selectedWeek || !Object.keys(groupIssues).length) return [];
    
    const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);
    if (!selectedWeekData) return [];
    
    const weekStart = new Date(selectedWeekData.startAt);
    const weekEnd = new Date(selectedWeekData.endAt);
    weekEnd.setHours(23, 59, 59, 999);
    
    const allIssues = [];
    Object.values(groupIssues).forEach(issues => {
      issues.forEach(issue => {
        if (issue.deadline) {
          const deadline = new Date(issue.deadline);
          if (deadline >= weekStart && deadline <= weekEnd) {
            allIssues.push(issue);
          }
        }
      });
    });
    
    return allIssues;
  };

  // Get issues for specific day and time slot
  const getIssuesForSlot = (day, timeSlot) => {
    const weekIssues = getIssuesForWeek();
    if (!weekIssues.length) return [];
    
    const matchedIssues = [];
    for (const issue of weekIssues) {
      const deadline = new Date(issue.deadline);
      const dayOfWeek = deadline.getDay();
      const hour = deadline.getHours();
      
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (adjustedDay === day && hour >= timeSlot.start && hour < timeSlot.end) {
        matchedIssues.push(issue);
      }
    }
    
    return matchedIssues;
  };

  // Get issue status color
  const getIssueStatusColor = (status) => {
    switch (status) {
      case 'Todo': return '#6b7280';
      case 'InProgress': return '#3b82f6';
      case 'Done': return '#10b981';
      case 'Review': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Get issue status text
  const getIssueStatusText = (status) => {
    switch (status) {
      case 'Todo': return 'To Do';
      case 'InProgress': return 'In Progress';
      case 'Done': return 'Done';
      case 'Review': return 'Under Review';
      default: return status || 'N/A';
    }
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
        groupId: t.groupId,
        status: t.status,
        priority: t.priority,
        assigneeId: t.assigneeId,
        assigneeName: t.assigneeName
      }));
    } catch (e) {
      return [];
    }
  };

  const formatDateTime = (dateString) => {
    try {
      // API returns time in Vietnam timezone but without timezone info
      // Need to add 7 hours to display correctly
      const date = new Date(dateString);
      // Add 7 hours (7 * 60 * 60 * 1000 ms)
      const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      return vnDate.toLocaleString('en-US');
    } catch { return dateString; }
  };

  // Function to format datetime-local from meeting date and time
  const formatDateTimeLocal = (meetingDate, timeString) => {
    if (!meetingDate || !timeString) return '';
    const date = new Date(meetingDate);
    const [hours, minutes] = timeString.split(':');
    date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  // Function to convert API datetime (UTC+0) to datetime-local format (UTC+7)
  const convertApiDateTimeToLocal = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    // Add 7 hours to convert to Vietnam timezone
    const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    
    const year = vnDate.getFullYear();
    const month = String(vnDate.getMonth() + 1).padStart(2, '0');
    const day = String(vnDate.getDate()).padStart(2, '0');
    const hour = String(vnDate.getHours()).padStart(2, '0');
    const minute = String(vnDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#dc2626';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const meetingIssueColumns = [
    { 
      key: 'name', 
      title: 'Issue',
      render: (row) => (
        <span
          onClick={() => navigate(`/supervisor/task/group/${row.groupId}?taskId=${row.id}`)}
          style={{
            color: '#3b82f6',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontWeight: 500
          }}
        >
          {row.name}
        </span>
      )
    },
    {
      key: 'assignee',
      title: 'Assignee',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#374151' }}>
          {row.assigneeName || 'N/A'}
        </span>
      )
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (row) => (
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: getPriorityColor(row.priority) + '20',
            color: getPriorityColor(row.priority)
          }}
        >
          {row.priority || 'N/A'}
        </span>
      )
    },
    {
      key: 'isActive',
      title: 'Active',
      render: (row) => (
        <span
          style={{
            color: row.isActive === true ? '#059669' : '#9ca3af',
            fontWeight: 500,
            fontSize: '12px'
          }}
        >
          {row.isActive === true ? '✓ Active' : '✗ Inactive'}
        </span>
      )
    },
    { 
      key: 'deadline', 
      title: 'Deadline', 
      render: (row) => formatDateTime(row.deadline) 
    },
    { 
      key: 'status', 
      title: 'Status', 
      render: (row) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: getIssueStatusColor(row.status) + '20',
          color: getIssueStatusColor(row.status)
        }}>
          {getIssueStatusText(row.status)}
        </span>
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
    setLoadingMinuteModal(true);
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
              startAt: response.data.startAt ? convertApiDateTimeToLocal(response.data.startAt) : formatDateTimeLocal(meeting.meetingDate, meeting.startAt),
              endAt: response.data.endAt ? convertApiDateTimeToLocal(response.data.endAt) : formatDateTimeLocal(meeting.meetingDate, meeting.endAt),
              attendance: response.data.attendance || '',
              issue: '',
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
      setMinuteData(null);
      setMeetingIssues([]);
      setAttendanceList([]);
    } finally {
      setLoadingMinuteModal(false);
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
      setMilestoneDetails(res || null);
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
    setLoadingMinuteModal(false);
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
    const group = groupDetails.find(g => g.id === groupId || g.id === Number(groupId) || g.id === String(groupId));
    if (group) {
      return group.groupCode || group.code || `GRP${groupId}`;
    }
    const basicGroup = groups.find(g => g.id === groupId || g.id === String(groupId) || g.id === Number(groupId));
    return basicGroup?.groupCode || basicGroup?.code || `GRP${groupId}`;
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
      // english
      alert('This file cannot be previewed. Please download to view.');
      return;
    }
    
    const filePath = attachment.path;
    const fileName = filePath.split('/').pop().toLowerCase();
    const extension = fileName.split('.').pop();
    const baseUrl = getFileUrl(filePath);
    
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
          selectedGroupId=""
          onGroupChange={() => {}}
          groupSelectPlaceholder=""
          loading={loading}
          hideGroupSelect={true}
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


      {/* Managed Groups */}
      {groupDetails.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Managed Groups</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {groupDetails.map((group) => {
              const groupIdStr = String(group.id);
              const groupIdNum = Number(group.id);
              const hasNoSchedule = groupsWithoutSchedule.includes(groupIdStr) || 
                                   groupsWithoutSchedule.includes(groupIdNum) ||
                                   groupsWithoutSchedule.includes(group.id);
              return (
                <div 
                  key={group.id} 
                  onClick={() => {
                    if (hasNoSchedule) {
                      navigate(`/supervisor/schedule`);
                    }
                  }}
                  style={{
                    background: hasNoSchedule ? '#fef3c7' : '#f9fafb',
                    border: hasNoSchedule ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 12,
                    cursor: hasNoSchedule ? 'pointer' : 'default',
                    transition: hasNoSchedule ? 'all 0.2s ease' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (hasNoSchedule) {
                      e.currentTarget.style.background = '#fde68a';
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasNoSchedule) {
                      e.currentTarget.style.background = '#fef3c7';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Header row: Warning + View Tracking button */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      marginBottom: 8
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {hasNoSchedule ? (
                      <div style={{
                        background: '#f59e0b',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        ⚠ Meeting schedule not finalized
                      </div>
                    ) : (
                      <div></div>
                    )}
                    <button
                      onClick={() => navigate(`/supervisor/tracking?groupId=${group.id}`)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    >
                      View Tracking →
                    </button>
                  </div>
                  
                  {/* Project name */}
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: 14,
                    marginBottom: 4
                  }}>
                    {group.projectName}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    <div>Group Code: {group.groupCode || 'N/A'}</div>
                    <div>Students: {group.students?.length || 0}</div>
                    <div>Supervisors: {group.supervisors?.join(', ') || 'N/A'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week Selector with arrows and dropdown */}
      <div className={sharedLayout.contentSection} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Week:</span>
          
          <button
            onClick={() => {
              const currentIndex = weeks.findIndex(w => w.weekNumber === selectedWeek);
              if (currentIndex > 0) {
                setSelectedWeek(weeks[currentIndex - 1].weekNumber);
              }
            }}
            disabled={weeks.findIndex(w => w.weekNumber === selectedWeek) === 0}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: weeks.findIndex(w => w.weekNumber === selectedWeek) === 0 ? '#f3f4f6' : 'white',
              cursor: weeks.findIndex(w => w.weekNumber === selectedWeek) === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: weeks.findIndex(w => w.weekNumber === selectedWeek) === 0 ? '#9ca3af' : '#374151'
            }}
          >
            ← Prev
          </button>
          
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
              maxWidth: 350
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
          
          <button
            onClick={() => {
              const currentIndex = weeks.findIndex(w => w.weekNumber === selectedWeek);
              if (currentIndex < weeks.length - 1) {
                setSelectedWeek(weeks[currentIndex + 1].weekNumber);
              }
            }}
            disabled={weeks.findIndex(w => w.weekNumber === selectedWeek) === weeks.length - 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: weeks.findIndex(w => w.weekNumber === selectedWeek) === weeks.length - 1 ? '#f3f4f6' : 'white',
              cursor: weeks.findIndex(w => w.weekNumber === selectedWeek) === weeks.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              color: weeks.findIndex(w => w.weekNumber === selectedWeek) === weeks.length - 1 ? '#9ca3af' : '#374151'
            }}
          >
            Next →
          </button>
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
                        const issues = getIssuesForSlot(dayIndex, timeSlot);
                        
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
                              
                              {/* Issues - Display all issues in this slot */}
                              {issues.map((issue, idx) => (
                                <div 
                                  key={issue.id || `issue_${idx}`}
                                  onClick={() => {
                                    if (issue.id && issue.groupId) {
                                      navigate(`/supervisor/task/group/${issue.groupId}?taskId=${issue.id}`);
                                    }
                                  }}
                                  style={{ 
                                    background: getIssueStatusColor(issue.status) === '#059669' ? '#ecfdf5' : 
                                               getIssueStatusColor(issue.status) === '#d97706' ? '#fef3c7' : '#e0e7ff',
                                    border: `1px solid ${getIssueStatusColor(issue.status)}`,
                                    borderRadius: 4,
                                    padding: 4,
                                    cursor: issue.id ? 'pointer' : 'default',
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
                                  <div style={{ fontWeight: 600, color: getIssueStatusColor(issue.status), marginBottom: 2, fontSize: 9, lineHeight: 1.2, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                    🐛 {issue.name?.length > 15 ? issue.name.substring(0, 15) + '...' : (issue.name || 'N/A')}
                                  </div>
                                  <div style={{ color: getIssueStatusColor(issue.status), fontSize: 8 }}>
                                    {getIssueStatusText(issue.status)}
                                  </div>
                                  <div style={{ color: getIssueStatusColor(issue.status), fontSize: 8 }}>
                                    {formatDate(issue.deadline, 'HH:mm')} {issue.groupId && `(${getGroupCode(issue.groupId)})`}
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
          <div className={styles.minuteModal} style={{ 
            maxWidth: '95vw', 
            width: '1000px'
          }}>
            <div className={styles.modalHeader}>
              <h3>
                View Meeting Minutes - {selectedMeeting.description}
              </h3>
              {minuteData && (
                <div className={styles.minuteInfo}>
                  <p>
                    <strong>Created by:</strong> {minuteData.createBy}
                  </p>
                  <p>
                    <strong>Created at:</strong> {formatDateTime(minuteData.createAt)}
                  </p>
                </div>
              )}
            </div>

            {loadingMinuteModal ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <div>Loading data...</div>
              </div>
            ) : (
              <div className={styles.modalBody}>
            {minuteData ? (
              <>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Start Time</label>
                    <Input
                      type="datetime-local"
                      value={formData.startAt}
                      disabled={true}
                      style={{ backgroundColor: '#f3f4f6' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>End Time</label>
                    <Input
                      type="datetime-local"
                      value={formData.endAt}
                      disabled={true}
                      style={{ backgroundColor: '#f3f4f6' }}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Attendance List</label>
                  {attendanceList.length > 0 ? (
                    <div
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                      }}
                    >
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              borderBottom: '1px solid #e5e7eb',
                            }}
                          >
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '6px 8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#374151',
                              }}
                            >
                              Member
                            </th>
                            <th
                              style={{
                                textAlign: 'center',
                                padding: '6px 8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#374151',
                                width: '100px',
                              }}
                            >
                              Attended
                            </th>
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '6px 8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#374151',
                              }}
                            >
                              Absence Reason
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceList.map((item, index) => (
                            <tr
                              key={item.studentId}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                              }}
                            >
                              <td
                                style={{
                                  padding: '6px 8px',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#1f2937',
                                  }}
                                >
                                  {item.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    marginTop: '1px',
                                  }}
                                >
                                  {item.rollNumber} {item.role && `- ${item.role}`}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: '6px 8px',
                                  textAlign: 'center',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.attended}
                                  disabled={true}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'not-allowed',
                                  }}
                                />
                              </td>
                              <td
                                style={{
                                  padding: '6px 8px',
                                }}
                              >
                                <Input
                                  type="text"
                                  value={item.reason || ''}
                                  disabled={true}
                                  placeholder="No reason"
                                  style={{
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    width: '100%',
                                    backgroundColor: '#f3f4f6',
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: '13px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: '#f3f4f6',
                      }}
                    >
                      No attendance data
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Meeting Content</label>
                  <Textarea
                    value={formData.meetingContent || ''}
                    disabled={true}
                    placeholder="No content available"
                    rows={6}
                    style={{
                      backgroundColor: '#f3f4f6',
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <label style={{ margin: 0 }}>Issues</label>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      maxWidth: '100%',
                      overflowX: 'hidden',
                    }}
                  >
                    <DataTable
                      columns={meetingIssueColumns}
                      data={meetingIssues}
                      loading={loading}
                      emptyMessage="No issues yet"
                      className={styles.compactTable}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Other Notes</label>
                  <Textarea
                    value={formData.other || ''}
                    disabled={true}
                    placeholder="No notes available"
                    rows={3}
                    style={{
                      backgroundColor: '#f3f4f6',
                    }}
                  />
                </div>
              </>
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
              </div>
            )}

            <div className={styles.modalFooter}>
              <Button variant="secondary" onClick={closeMeetingModal}>
                Close
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
                                          link.href = getFileUrl(attachment.path);
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
