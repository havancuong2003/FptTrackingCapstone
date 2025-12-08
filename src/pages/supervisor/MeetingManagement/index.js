import React from 'react';
import styles from './index.module.scss';
import sharedLayout from '../sharedLayout.module.scss';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import Input from '../../../components/Input/Input';
import Textarea from '../../../components/Textarea/Textarea';
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from '../../../auth/auth';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { getMeetingScheduleDatesByGroup, getMeetingMinutesByMeetingDateId, createMeetingMinutes, updateMeetingMinutes, deleteMeetingMinutes } from '../../../api/meetings';
import { getMeetingTasksByMinuteId } from '../../../api/tasks';
import SupervisorGroupFilter from '../../../components/SupervisorGroupFilter/SupervisorGroupFilter';
import { sendEmail } from '../../../email/api';
import { baseTemplate } from '../../../email/templates';
import { formatDate } from '../../../utils/date';
import { askAI, getAIResult } from '../../../api/ai';
import Modal from '../../../components/Modal/Modal';

export default function SupervisorMeetingManagement() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [userInfo, setUserInfo] = React.useState(null);
  const [showMinuteModal, setShowMinuteModal] = React.useState(false);
  const [minuteData, setMinuteData] = React.useState(null);
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
  const [selectedMeetingGroupInfo, setSelectedMeetingGroupInfo] = React.useState(null);
  const [allGroupsInfo, setAllGroupsInfo] = React.useState({});
  const [selectedGroupId, setSelectedGroupId] = useLocalStorage('supervisorSelectedGroupId', '');
  const [groupOptions, setGroupOptions] = React.useState([]);
  const [meetingIssues, setMeetingIssues] = React.useState([]);
  const [attendanceList, setAttendanceList] = React.useState([]); // [{ studentId, name, rollNumber, attended: boolean, reason: string }]
  const [loadingMinuteModal, setLoadingMinuteModal] = React.useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = React.useState(false);
  const [editingMeeting, setEditingMeeting] = React.useState(null);
  const [scheduleForm, setScheduleForm] = React.useState({
    meetingDate: '',
    startAt: '',
    endAt: '',
    description: ''
  });
  const [weekDays, setWeekDays] = React.useState([]);
  const [semesters, setSemesters] = React.useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState(null);
  const [groupExpireFilter, setGroupExpireFilter] = React.useState('active'); // 'active' or 'expired'
  const [currentPage, setCurrentPage] = React.useState(1); // Pagination
  const ITEMS_PER_PAGE = 7;
  const [previousMinuteData, setPreviousMinuteData] = React.useState(null); // Previous meeting minutes
  const [showPreviousMinuteModal, setShowPreviousMinuteModal] = React.useState(false); // Modal for previous meeting minutes
  const [previousMinuteIssues, setPreviousMinuteIssues] = React.useState([]); // Issues from previous meeting
  
  // AI states
  const [showAIModal, setShowAIModal] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [aiTaskId, setAiTaskId] = React.useState(null);
  const [aiResult, setAiResult] = React.useState(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiPolling, setAiPolling] = React.useState(false);
  const [aiError, setAiError] = React.useState('');
  const pollingTimeoutRef = React.useRef(null);
  const isPollingActiveRef = React.useRef(false);

  React.useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      // Get info from localStorage, don't call API
      const userData = getUserInfo();
      
      if (userData) {
        setUserInfo(userData);
        
        // Get semesters and set default
        const uniqueSemesters = getUniqueSemesters();
        setSemesters(uniqueSemesters);
        
        const currentSemesterId = getCurrentSemesterId();
        if (currentSemesterId) {
          setSelectedSemesterId(currentSemesterId);
        } else if (uniqueSemesters.length > 0) {
          setSelectedSemesterId(uniqueSemesters[0].id);
        }
        
        // Only load group info for selection; not load meetings yet
        if (userData.groupsInfo && userData.groupsInfo.length > 0) {
          await fetchAllGroupsInfo(userData.groupsInfo);
          // If already saved group and belongs to current groups list, auto load meetings
          if (selectedGroupId && userData.groupsInfo.some(g => g.id === Number(selectedGroupId))) {
            await fetchMeetingsByGroup(selectedGroupId);
          }
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLoading(false);
    }
  };

  // Get groups from localStorage (no API call) - only for dropdown
  const fetchAllGroupsInfo = (groupsInfoFromStorage) => {
    try {
      // Filter by selected semester and expired status
      const isExpired = groupExpireFilter === 'expired';
      const filteredGroups = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
      
      // Build group options from localStorage only (no API call)
      const options = filteredGroups.map(groupInfo => ({
        value: String(groupInfo.id),
        label: groupInfo.name || `Group ${groupInfo.id}`
      }));
      setGroupOptions(options);
      
      // Clear allGroupsInfo - will be fetched when group is selected
      setAllGroupsInfo({});
    } catch (error) {
      console.error('Error getting groups from localStorage:', error);
    }
  };

  // Reload groups when semester or group status changes (no API call)
  React.useEffect(() => {
    if (userInfo && userInfo.groupsInfo && selectedSemesterId !== null) {
      fetchAllGroupsInfo(userInfo.groupsInfo);
      
      // Check if selected group is still in filtered list
      const isExpired = groupExpireFilter === 'expired';
      const filteredGroups = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
      const selectedGroupExists = selectedGroupId && filteredGroups.some(g => g.id === Number(selectedGroupId));
      
      if (selectedGroupId && !selectedGroupExists) {
        // Selected group is not in filtered list, clear selection and meetings
        setSelectedGroupId('');
        setMeetings([]);
      }
    }
  }, [selectedSemesterId, groupExpireFilter]);

  // Get meetings by selected group
  const fetchMeetingsByGroup = async (groupId) => {
    if (!groupId) return;
    try {
      setLoading(true);
      const response = await getMeetingScheduleDatesByGroup(groupId);
      if (response.status === 200) {
        const meetingsData = response.data || [];
        // API already returns isMinute, no need to call API to check anymore
        const meetingsWithGroup = meetingsData.map(meeting => ({
          ...meeting,
          groupId
        }));
        meetingsWithGroup.sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));
        setMeetings(meetingsWithGroup);
        
        // Auto navigate to page with upcoming meeting
        const now = new Date();
        let upcomingIndex = -1;
        for (let i = 0; i < meetingsWithGroup.length; i++) {
          const meeting = meetingsWithGroup[i];
          const meetingDate = new Date(meeting.meetingDate);
          if (meetingDate >= now && meeting.isMeeting !== true) {
            upcomingIndex = i;
            break;
          }
        }
        
        if (upcomingIndex === -1) {
          for (let i = 0; i < meetingsWithGroup.length; i++) {
            if (meetingsWithGroup[i].isMeeting !== true) {
              upcomingIndex = i;
              break;
            }
          }
        }
        
        if (upcomingIndex !== -1) {
          const pageNumber = Math.floor(upcomingIndex / ITEMS_PER_PAGE) + 1;
          setCurrentPage(pageNumber);
        }
      } else {
        setMeetings([]);
      }
    } catch (error) {
      console.error('Error fetching meetings by group:', error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = (meetingLink) => {
    window.open(meetingLink, '_blank');
  };

  // Function to get meeting minutes
  const fetchMeetingMinute = async (meetingDateId) => {
    try {
      const response = await getMeetingMinutesByMeetingDateId(meetingDateId);
      if (response.status === 200) {
        return response.data; // Can be null if no minutes yet
      }
      return null;
    } catch (error) {
      console.error('Error fetching meeting minute:', error);
      return null;
    }
  };

  // Function to create meeting minutes
  const createMeetingMinute = async (data) => {
    try {
      const response = await createMeetingMinutes(data);
      return response;
    } catch (error) {
      console.error('Error creating meeting minute:', error);
      throw error;
    }
  };

  // Function to update meeting minutes
  const updateMeetingMinute = async (data) => {
    try {
      const response = await updateMeetingMinutes(data);
      return response;
    } catch (error) {
      console.error('Error updating meeting minute:', error);
      throw error;
    }
  };

  // Function to delete meeting minutes
  const deleteMeetingMinute = async (minuteId) => {
    try {
      const response = await deleteMeetingMinutes(minuteId);
      return response;
    } catch (error) {
      console.error('Error deleting meeting minute:', error);
      throw error;
    }
  };

  // Function to determine color for meeting card
  const getMeetingCardColor = (meeting) => {
    const now = new Date();
    const meetingDate = new Date(meeting.meetingDate);
    
    // Nếu đã họp -> màu xanh nhạt
    if (meeting.isMeeting === true) {
      return '#f0fdf4'; // Xanh nhạt
    }
    
    // Nếu chưa họp và gần nhất -> màu vàng nhạt
    if (meetingDate > now) {
      const timeDiff = meetingDate - now;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) { // Trong vòng 7 ngày tới
        return '#fefce8'; // Vàng nhạt
      }
    }
    
    // Mặc định -> màu trắng
    return '#ffffff';
  };

  // Function to determine border color for meeting card
  const getMeetingCardBorderColor = (meeting) => {
    const now = new Date();
    const meetingDate = new Date(meeting.meetingDate);
    
    // Nếu đã họp -> border xanh
    if (meeting.isMeeting === true) {
      return '#10b981'; // Xanh lá
    }
    
    // Nếu chưa họp và gần nhất -> border vàng
    if (meetingDate > now) {
      const timeDiff = meetingDate - now;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) { // Trong vòng 7 ngày tới
        return '#f59e0b'; // Vàng
      }
    }
    
    // Mặc định -> border xám
    return '#e5e7eb';
  };

  // Function to determine meeting status
  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const meetingDate = new Date(meeting.meetingDate);
    
    if (meeting.isMeeting === true) {
      return 'Completed';
    } else if (meetingDate < now) {
      return 'Past';
    } else {
      return 'Upcoming';
    }
  };

  const getMeetingStatusText = (status) => {
    switch (status) {
      case 'Completed': return 'Completed';
      case 'Past': return 'Not Yet Held';
      case 'Upcoming': return 'Upcoming';
      default: return 'Unknown';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Todo': return '#6b7280';
      case 'InProgress': return '#3b82f6';
      case 'Done': return '#10b981';
      case 'Review': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Todo': return 'To Do';
      case 'InProgress': return 'In Progress';
      case 'Done': return 'Done';
      case 'Review': return 'Under Review';
      default: return status || 'N/A';
    }
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
          backgroundColor: getStatusColor(row.status) + '20',
          color: getStatusColor(row.status)
        }}>
          {getStatusText(row.status)}
        </span>
      )
    }
  ];

  // Fetch group info for meeting
  const fetchMeetingGroupInfo = async (groupId) => {
    try {
      const response = await getCapstoneGroupDetail(groupId);
      if (response.status === 200) {
        setSelectedMeetingGroupInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
      setSelectedMeetingGroupInfo(null);
    }
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

  // Function to open meeting minutes modal
  const openMinuteModal = async (meeting) => {
    setSelectedMeeting(meeting);
    setMinuteData(null);
    setIsEditing(false);
    setAttendanceList([]);
    setPreviousMinuteData(null);
    setShowPreviousMinuteModal(false);
    setPreviousMinuteIssues([]);
    setLoadingMinuteModal(true);
    // Don't show modal immediately, wait for data to load
    
    try {
      // Fetch group info for this meeting
      const groupInfoResponse = await getCapstoneGroupDetail(meeting.groupId);
      const currentGroupInfo = groupInfoResponse.status === 200 ? groupInfoResponse.data : null;
      
      // Set group info to state
      if (currentGroupInfo) {
        setSelectedMeetingGroupInfo(currentGroupInfo);
      }
      
      // Only fetch meeting minute if isMinute === true
      if (meeting.isMinute === true) {
        const meetingMinute = await fetchMeetingMinute(meeting.id);
        if (meetingMinute) {
          setMinuteData(meetingMinute);
          
          // Parse attendance from text
          const students = Array.isArray(currentGroupInfo?.students) ? currentGroupInfo.students : [];
          const parsedAttendance = parseAttendance(meetingMinute.attendance, students);
          setAttendanceList(parsedAttendance);
          
          setFormData({
            startAt: meetingMinute.startAt ? convertApiDateTimeToLocal(meetingMinute.startAt) : formatDateTimeLocal(meeting.meetingDate, meeting.startAt),
            endAt: meetingMinute.endAt ? convertApiDateTimeToLocal(meetingMinute.endAt) : formatDateTimeLocal(meeting.meetingDate, meeting.endAt),
            attendance: meetingMinute.attendance || '',
            issue: '',
            meetingContent: meetingMinute.meetingContent || '',
            other: meetingMinute.other || ''
          });
          setIsEditing(true);
          
          // Load meeting issues by meeting minute id
          if (meetingMinute.id) {
            const meetingTasks = await fetchMeetingIssues(meetingMinute.id);
            setMeetingIssues(Array.isArray(meetingTasks) ? meetingTasks : []);
          }
        } else {
          setMinuteData(null);
          setFormData({
            startAt: formatDateTimeLocal(meeting.meetingDate, meeting.startAt),
            endAt: formatDateTimeLocal(meeting.meetingDate, meeting.endAt),
            attendance: '',
            issue: '',
            meetingContent: '',
            other: ''
          });
          setIsEditing(false);
          setMeetingIssues([]);
        }
      } else {
        setMinuteData(null);
        setFormData({
          startAt: formatDateTimeLocal(meeting.meetingDate, meeting.startAt),
          endAt: formatDateTimeLocal(meeting.meetingDate, meeting.endAt),
          attendance: '',
          issue: '',
          meetingContent: '',
          other: ''
        });
        setIsEditing(false);
        setMeetingIssues([]);
        
        // Find and load previous meeting minutes (if available)
        if (meetings && meetings.length > 0) {
          const sortedMeetings = [...meetings].sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));
          const currentMeetingIndex = sortedMeetings.findIndex(m => m.id === meeting.id);
          
          for (let i = currentMeetingIndex - 1; i >= 0; i--) {
            const prevMeeting = sortedMeetings[i];
            if (prevMeeting.isMinute === true) {
              try {
                const prevMinute = await fetchMeetingMinute(prevMeeting.id);
                if (prevMinute) {
                  setPreviousMinuteData(prevMinute);
                  break;
                }
              } catch (error) {
                console.error('Error fetching previous meeting minute:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading meeting minute data:', error);
      setMinuteData(null);
      setMeetingIssues([]);
      setAttendanceList([]);
    } finally {
      setLoadingMinuteModal(false);
      // Only show modal after all data is loaded
      setShowMinuteModal(true);
    }
  };

  // Function to close modal
  const closeMinuteModal = () => {
    setShowMinuteModal(false);
    setSelectedMeeting(null);
    setSelectedMeetingGroupInfo(null);
    setMinuteData(null);
    setIsEditing(false);
    setAttendanceList([]);
    setLoadingMinuteModal(false);
    setPreviousMinuteData(null);
    setShowPreviousMinuteModal(false);
    setPreviousMinuteIssues([]);
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

  // Function to handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user types
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Function to validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.startAt) {
      errors.startAt = 'Start time is required';
    }
    
    if (!formData.endAt) {
      errors.endAt = 'End time is required';
    }
    
    if (!formData.meetingContent) {
      errors.meetingContent = 'Meeting content is required';
    }
    
    if (formData.startAt && formData.endAt && new Date(formData.startAt) >= new Date(formData.endAt)) {
      errors.endAt = 'End time must be after start time';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function to save meeting minutes
  const saveMeetingMinute = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isEditing && minuteData) {
        // Update meeting minutes
      const data = {
          id: minuteData.id,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        attendance: formData.attendance,
        issue: formData.issue,
        meetingContent: formData.meetingContent,
        other: formData.other
      };
        await updateMeetingMinute(data);
        alert('Meeting minutes updated successfully!');
      } else {
        // Create new meeting minutes
        const data = {
          meetingDateId: selectedMeeting.id,
          startAt: new Date(formData.startAt).toISOString(),
          endAt: new Date(formData.endAt).toISOString(),
          attendance: formData.attendance,
          issue: formData.issue,
          meetingContent: formData.meetingContent,
          other: formData.other
        };
        await createMeetingMinute(data);
        alert('Meeting minutes created successfully!');
      }
      
      // Refresh meetings data by selected group
      if (selectedGroupId) {
        await fetchMeetingsByGroup(selectedGroupId);
      }
      
      closeMinuteModal();
    } catch (error) {
      alert('Error saving meeting minutes!');
      console.error('Error saving meeting minute:', error);
    }
  };

  // Function to delete meeting minutes
  const handleDeleteMinute = async () => {
    if (!minuteData || !window.confirm('Are you sure you want to delete this meeting minutes?')) {
      return;
    }
    
    try {
      await deleteMeetingMinute(minuteData.id);
      alert('Meeting minutes deleted successfully!');
      
      // Refresh meetings data by selected group
      if (selectedGroupId) {
        await fetchMeetingsByGroup(selectedGroupId);
      }
      
      closeMinuteModal();
    } catch (error) {
      alert('Error deleting meeting minutes!');
      console.error('Error deleting meeting minute:', error);
    }
  };

  // Function to calculate week days of meeting (week starts from Monday)
  const getWeekDays = (meetingDate) => {
    const date = new Date(meetingDate);
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - daysToMonday);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      // Format date string without being affected by timezone
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const date = String(day.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${date}`;
      
      days.push({
        date: day,
        dateString: dateString,
        dayName: day.toLocaleDateString('vi-VN', { weekday: 'long' }),
        display: day.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })
      });
    }
    return days;
  };

  // Function to open edit schedule modal
  const openEditScheduleModal = (meeting) => {
    // Cannot edit time if meeting is completed
    if (meeting.isMeeting === true) {
      alert('Cannot edit schedule for completed meetings!');
      return;
    }
    
    setEditingMeeting(meeting);
    const weekDaysList = getWeekDays(meeting.meetingDate);
    setWeekDays(weekDaysList);
    
    setScheduleForm({
      meetingDate: meeting.meetingDate.split('T')[0],
      startAt: meeting.startAt || '',
      endAt: meeting.endAt || '',
      description: meeting.description || ''
    });
    setShowEditScheduleModal(true);
  };

  // Function to close edit schedule modal
  const closeEditScheduleModal = () => {
    setShowEditScheduleModal(false);
    setEditingMeeting(null);
    setScheduleForm({
      meetingDate: '',
      startAt: '',
      endAt: '',
      description: ''
    });
    setWeekDays([]);
  };

  // Send email notification when meeting schedule is updated
  const sendMeetingScheduleNotification = async (meeting, newSchedule, groupInfo) => {
    try {
      if (!groupInfo?.students || groupInfo.students.length === 0) {
        console.warn('No students to send email');
        return;
      }

      const studentEmails = groupInfo.students
        .filter(s => s.email)
        .map(s => s.email);

      if (studentEmails.length === 0) {
        console.warn('No valid email addresses found');
        return;
      }

      const supervisorName = userInfo?.name || 'Supervisor';
      const projectName = groupInfo?.projectName || 'Your Project';
      const newDate = new Date(newSchedule.meetingDate);
      const formattedDate = newDate.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailBody = baseTemplate({
        title: 'Meeting Schedule Updated',
        greeting: `Dear ${projectName} Team,`,
        content: `Your supervisor has updated the meeting schedule. Please check the new schedule below.`,
        infoItems: [
          { label: 'Meeting', value: newSchedule.description },
          { label: 'New Date', value: formattedDate },
          { label: 'Time', value: `${newSchedule.startAt} - ${newSchedule.endAt}` },
          { label: 'Updated by', value: supervisorName }
        ],
        footerNote: 'Please make sure to attend the meeting at the new scheduled time.'
      });

      await sendEmail({
        to: studentEmails,
        subject: `[Capstone] Meeting Schedule Updated - ${newSchedule.description}`,
        body: emailBody
      });

    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  };

  // ========== AI Functions ==========
  const handleOpenAIModal = () => {
    if (!selectedGroupId) {
      alert('Please select a group first');
      return;
    }
    setShowAIModal(true);
    setAiPrompt('');
    setAiTaskId(null);
    setAiResult(null);
    setAiError('');
  };

  const handleCloseAIModal = () => {
    // Cancel polling if active
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    isPollingActiveRef.current = false;
    
    setShowAIModal(false);
    setAiPrompt('');
    setAiTaskId(null);
    setAiResult(null);
    setAiError('');
    setAiPolling(false);
  };

  const handleCancelAI = () => {
    // Cancel polling if active
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    isPollingActiveRef.current = false;
    
    setAiTaskId(null);
    setAiResult(null);
    setAiError('');
    setAiPolling(false);
  };

  const handleAskAI = async () => {
    if (!aiPrompt || !aiPrompt.trim()) {
      setAiError('Please enter a prompt');
      return;
    }

    if (!selectedGroupId) {
      setAiError('Please select a group first');
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    setAiTaskId(null);

    try {
      const response = await askAI({
        prompt: aiPrompt.trim(),
        groupId: Number(selectedGroupId)
      });

      if (response.status === 200 && response.data) {
        const taskId = response.data.taskId || response.data.id || response.data;
        if (taskId) {
          setAiTaskId(taskId);
          setAiPolling(true);
          // Start polling for result
          pollAIResult(taskId);
        } else {
          setAiError('No task ID returned from server');
        }
      } else {
        setAiError(response.message || 'Failed to submit AI request');
      }
    } catch (error) {
      console.error('Error asking AI:', error);
      setAiError(error.message || 'Failed to submit AI request');
    } finally {
      setAiLoading(false);
    }
  };

  const pollAIResult = async (taskId) => {
    const maxAttempts = 60; // 60 attempts
    const interval = 2000; // 2 seconds
    let attempts = 0;
    isPollingActiveRef.current = true;

    const poll = async () => {
      // Check if polling was cancelled
      if (!isPollingActiveRef.current) {
        return;
      }

      if (attempts >= maxAttempts) {
        isPollingActiveRef.current = false;
        setAiPolling(false);
        setAiError('Timeout waiting for AI result. Please try again later.');
        return;
      }

      try {
        const response = await getAIResult(taskId);
        
        // Check again if polling was cancelled
        if (!isPollingActiveRef.current) {
          return;
        }
        
        if (response.status === 200 && response.data) {
          // Check if result is ready
          if (response.data.status === 'completed' || response.data.result) {
            setAiResult(response.data.result || response.data);
            isPollingActiveRef.current = false;
            setAiPolling(false);
          } else if (response.data.status === 'processing' || response.data.status === 'pending') {
            // Still processing, continue polling
            attempts++;
            pollingTimeoutRef.current = setTimeout(poll, interval);
          } else if (response.data.status === 'failed' || response.data.status === 'error') {
            isPollingActiveRef.current = false;
            setAiPolling(false);
            setAiError(response.data.message || 'AI processing failed');
          } else {
            // Assume completed if result exists
            setAiResult(response.data.result || response.data);
            isPollingActiveRef.current = false;
            setAiPolling(false);
          }
        } else {
          // If status is not 200, might still be processing
          attempts++;
          pollingTimeoutRef.current = setTimeout(poll, interval);
        }
      } catch (error) {
        // Check again if polling was cancelled
        if (!isPollingActiveRef.current) {
          return;
        }
        
        // If 404 or other error, might still be processing
        if (error.status === 404 || error.status === 400) {
          attempts++;
          pollingTimeoutRef.current = setTimeout(poll, interval);
        } else {
          isPollingActiveRef.current = false;
          setAiPolling(false);
          setAiError(error.message || 'Failed to get AI result');
        }
      }
    };

    poll();
  };

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      isPollingActiveRef.current = false;
    };
  }, []);

  // Function to update meeting schedule
  const updateMeetingSchedule = async () => {
    if (!editingMeeting) return;
    
    if (!scheduleForm.meetingDate || !scheduleForm.startAt || !scheduleForm.endAt || !scheduleForm.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (scheduleForm.startAt >= scheduleForm.endAt) {
      alert('End time must be after start time');
      return;
    }

    try {
      // Format meetingDate mà không bị ảnh hưởng bởi timezone
      // scheduleForm.meetingDate format: "YYYY-MM-DD"
      // Cần convert thành "YYYY-MM-DDTHH:mm:ss" (ISO format nhưng không có timezone)
      const formatDateToISO = (dateString) => {
        if (!dateString) return '';
        // dateString format: "YYYY-MM-DD"
        // Add "T00:00:00" to create ISO format
        return `${dateString}T00:00:00`;
      };
      
      const payload = {
        meetingDate: formatDateToISO(scheduleForm.meetingDate),
        startAt: scheduleForm.startAt,
        endAt: scheduleForm.endAt,
        description: scheduleForm.description.trim()
      };

      // Call API to update meeting schedule
      const axiosClient = (await import('../../../utils/axiosClient')).default;
      const response = await axiosClient.put(
        `/Student/Meeting/schedule/${editingMeeting.id}`,
        payload
      );

      if (response.data.status === 200) {
        // Send email notification to group members
        // Fetch group info if not available
        let groupInfoForEmail = allGroupsInfo[editingMeeting.groupId];
        if (!groupInfoForEmail) {
          try {
            const groupRes = await getCapstoneGroupDetail(editingMeeting.groupId);
            if (groupRes.status === 200) {
              groupInfoForEmail = groupRes.data;
            }
          } catch (e) {
            console.error('Error fetching group info for email:', e);
          }
        }
        
        if (groupInfoForEmail) {
          await sendMeetingScheduleNotification(editingMeeting, scheduleForm, groupInfoForEmail);
        }
        
        alert('Meeting schedule updated successfully!');
        closeEditScheduleModal();
        
        // Refresh meetings data
        if (selectedGroupId) {
          await fetchMeetingsByGroup(selectedGroupId);
        }
      } else {
        alert(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating meeting schedule:', error);
      alert('Error updating meeting schedule!');
    }
  };

  if (loading) {
    return (
      <div className={sharedLayout.container}>
        <div className={sharedLayout.header}>
          <h1>Meeting Management - Supervisor</h1>
        </div>
        <div className={sharedLayout.loading}>Loading data...</div>
      </div>
    );
  }

  return (
    <div className={sharedLayout.container}>
      <div className={sharedLayout.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>Meeting Management - Supervisor</h1>
            <p>Manage group meetings</p>
            {userInfo && (
              <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  <strong>User:</strong> {userInfo.name}
                </span>
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  <strong>Role:</strong> {userInfo.roleInGroup || userInfo.role}
                </span>
              </div>
            )}
          </div>
          {selectedGroupId && (
            <Button
              onClick={handleOpenAIModal}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Ask AI
            </Button>
          )}
        </div>
      </div>

      <SupervisorGroupFilter
        semesters={semesters}
        selectedSemesterId={selectedSemesterId}
        onSemesterChange={setSelectedSemesterId}
        groupExpireFilter={groupExpireFilter}
        onGroupExpireFilterChange={setGroupExpireFilter}
        groups={groupOptions.map(opt => ({ id: opt.value, name: opt.label }))}
        selectedGroupId={selectedGroupId || ''}
        onGroupChange={async (gid) => {
          setSelectedGroupId(gid);
          setMeetings([]);
          if (gid) await fetchMeetingsByGroup(gid);
        }}
        groupSelectPlaceholder="-- Select group to view meetings --"
        loading={loading}
      />

      {/* Show message when no group selected */}
      {!selectedGroupId && (
        <div className={sharedLayout.noSelection}>
          <p>Please select a group</p>
          <p>You will see group information and document list after selection.</p>
        </div>
      )}

      {/* Display meetings list when a group is selected */}
      {selectedGroupId && (
      <div className={sharedLayout.contentSection}>
        <div style={{ 
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <DataTable
            columns={[
              {
                key: 'description',
                title: 'Meeting',
                render: (row) => {
                  const hasMinute = row.isMinute === true;
                  return (
                    <div>
                      {hasMinute ? (
                        <span
                          onClick={() => openMinuteModal(row)}
                          style={{
                            color: '#3b82f6',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: 500
                          }}
                        >
                          {row.description}
                        </span>
                      ) : (
                        <span style={{ fontWeight: 500, color: '#1f2937' }}>
                          {row.description}
                        </span>
                      )}
                    </div>
                  );
                }
              },
              {
                key: 'meetingDate',
                title: 'Date',
                render: (row) => {
                  const date = new Date(row.meetingDate);
                  return date.toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                }
              },
              {
                key: 'time',
                title: 'Time',
                render: (row) => {
                  const formatTime = (timeString) => {
                    if (!timeString) return '';
                    const parts = timeString.split(':');
                    return `${parts[0]}:${parts[1]}`;
                  };
                  const startTime = formatTime(row.startAt);
                  const endTime = formatTime(row.endAt);
                  return startTime && endTime ? `${startTime} - ${endTime}` : (row.time || 'N/A');
                }
              },
              {
                key: 'status',
                title: 'Status',
                render: (row) => {
                  const status = getMeetingStatus(row);
                  return (
                    <span style={{
                      backgroundColor: row.isMeeting === true ? '#10b981' : 
                                     status === 'Upcoming' ? '#f59e0b' : '#6b7280',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {getMeetingStatusText(status)}
                    </span>
                  );
                }
              },
              {
                key: 'isMinute',
                title: 'Minutes',
                render: (row) => (
                  <span style={{
                    color: row.isMinute === true ? '#059669' : '#9ca3af',
                    fontWeight: 500,
                    fontSize: '12px'
                  }}>
                    {row.isMinute === true ? '✓ Available' : '✗ Not Available'}
                  </span>
                )
              },
              {
                key: 'actions',
                title: 'Actions',
                render: (row) => {
                  const isMeetingCompleted = row.isMeeting === true;
                  const hasMinute = row.isMinute === true;
                  
                  return (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {!isMeetingCompleted && (
                        <Button
                          onClick={() => joinMeeting(row.meetingLink)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Join
                        </Button>
                      )}
                      
                      {!isMeetingCompleted && (
                        <Button
                          onClick={() => openEditScheduleModal(row)}
                          style={{
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Edit Time
                        </Button>
                      )}
                    </div>
                  );
                }
              }
            ]}
            data={meetings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)}
            loading={loading}
            emptyMessage="No meetings available"
            showIndex={true}
            indexTitle="STT"
            indexOffset={(currentPage - 1) * ITEMS_PER_PAGE}
          />
          
          {/* Pagination */}
          {meetings.length > ITEMS_PER_PAGE && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: currentPage === 1 ? '#f3f4f6' : 'white',
                  color: currentPage === 1 ? '#9ca3af' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px'
                }}
              >
                ← Previous
              </button>
              
              {Array.from({ length: Math.ceil(meetings.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid',
                    borderColor: currentPage === page ? '#3b82f6' : '#d1d5db',
                    borderRadius: '4px',
                    background: currentPage === page ? '#3b82f6' : 'white',
                    color: currentPage === page ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: currentPage === page ? '600' : '400'
                  }}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(meetings.length / ITEMS_PER_PAGE), prev + 1))}
                disabled={currentPage === Math.ceil(meetings.length / ITEMS_PER_PAGE)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: currentPage === Math.ceil(meetings.length / ITEMS_PER_PAGE) ? '#f3f4f6' : 'white',
                  color: currentPage === Math.ceil(meetings.length / ITEMS_PER_PAGE) ? '#9ca3af' : '#374151',
                  cursor: currentPage === Math.ceil(meetings.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer',
                  fontSize: '13px'
                }}
              >
                Next →
              </button>
              
              <span style={{ marginLeft: '12px', fontSize: '13px', color: '#6b7280' }}>
                Page {currentPage} of {Math.ceil(meetings.length / ITEMS_PER_PAGE)} ({meetings.length} meetings)
              </span>
            </div>
          )}
        </div>
      </div>
      )}

      {showMinuteModal && selectedMeeting && (
        <div 
          className={styles.modalOverlay} 
          onClick={closeMinuteModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: showPreviousMinuteModal ? 'flex-end' : 'center',
            padding: showPreviousMinuteModal ? '20px' : '0'
          }}
        >
          <div 
            className={styles.minuteModal} 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: showPreviousMinuteModal ? '55%' : '1000px',
              width: showPreviousMinuteModal ? '55%' : '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              marginRight: showPreviousMinuteModal ? '20px' : '0'
            }}
          >
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
              {/* Link to view previous meeting minutes (only when viewing existing minute) */}
              {minuteData && previousMinuteData && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📋</span>
                    <span style={{ fontSize: 14, color: '#0c4a6e', fontWeight: 500 }}>
                      Previous meeting minutes available
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      setShowPreviousMinuteModal(true);
                      // Load issues for previous minute
                      if (previousMinuteData?.id) {
                        try {
                          const issues = await fetchMeetingIssues(previousMinuteData.id);
                          setPreviousMinuteIssues(Array.isArray(issues) ? issues : []);
                        } catch (e) {
                          setPreviousMinuteIssues([]);
                        }
                      }
                    }}
                    style={{
                      background: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500
                    }}
                  >
                    View Previous Minutes →
                  </button>
                </div>
              )}

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
                    {/* View mode - show as read-only summary text */}
                    <div
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '12px',
                        backgroundColor: '#f3f4f6',
                        fontSize: '13px',
                        color: '#374151',
                        minHeight: '60px',
                      }}
                    >
                      {attendanceList.length > 0 ? (
                        (() => {
                          const attended = attendanceList.filter((item) => item.attended);
                          const absent = attendanceList.filter((item) => !item.attended);

                          if (absent.length === 0) {
                            return (
                              <div
                                style={{
                                  color: '#059669',
                                  fontWeight: 500,
                                }}
                              >
                                ✓ All members attended ({attendanceList.length} members): {attended.map((m) => m.name).join(', ')}
                              </div>
                            );
                          } else {
                            return (
                              <div>
                                <div
                                  style={{
                                    marginBottom: 8,
                                  }}
                                >
                                  <strong
                                    style={{
                                      color: '#059669',
                                    }}
                                  >
                                    ✓ Attended ({attended.length}):
                                  </strong>{' '}
                                  {attended.map((m) => m.name).join(', ') || 'None'}
                                </div>
                                <div>
                                  <strong
                                    style={{
                                      color: '#dc2626',
                                    }}
                                  >
                                    ✗ Absent ({absent.length}):
                                  </strong>{' '}
                                  {absent.map((m) => `${m.name} (${m.reason || 'No reason'})`).join('; ')}
                                </div>
                              </div>
                            );
                          }
                        })()
                      ) : (
                        <span
                          style={{
                            color: '#9ca3af',
                            fontStyle: 'italic',
                          }}
                        >
                          No attendance data
                        </span>
                      )}
                    </div>
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
              <Button 
                variant="secondary"
                onClick={closeMinuteModal}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Meeting Minutes Modal - positioned on the left */}
      {showPreviousMinuteModal && previousMinuteData && (
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: '50%',
            left: '20px',
            transform: 'translateY(-50%)',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '40%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 10001
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
              📋 Previous Meeting Minutes
            </h3>
            <button
              onClick={() => setShowPreviousMinuteModal(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
          
          {/* Meeting Info */}
          <div style={{ 
            background: '#f0fdf4', 
            border: '1px solid #bbf7d0', 
            borderRadius: 8, 
            padding: 16,
            marginBottom: 20
          }}>
            <div style={{ fontSize: 13, color: '#065f46', marginBottom: 8 }}>
              <strong>Created by:</strong> {previousMinuteData.createBy || 'N/A'}
            </div>
            <div style={{ fontSize: 13, color: '#065f46' }}>
              <strong>Created at:</strong> {previousMinuteData.createAt ? formatDateTime(previousMinuteData.createAt) : 'N/A'}
            </div>
          </div>

          {/* Time */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Time</h4>
            <div style={{ fontSize: 13, color: '#374151' }}>
              <div><strong>Start:</strong> {previousMinuteData.startAt ? formatDateTime(previousMinuteData.startAt) : 'N/A'}</div>
              <div><strong>End:</strong> {previousMinuteData.endAt ? formatDateTime(previousMinuteData.endAt) : 'N/A'}</div>
            </div>
          </div>

          {/* Attendance List */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Attendance List</h4>
            <div style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 6,
              padding: 12,
              fontSize: 13,
              color: '#374151',
              whiteSpace: 'pre-wrap',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {previousMinuteData.attendance || 'No attendance information available'}
            </div>
          </div>

          {/* Meeting Content */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Meeting Content</h4>
            <div style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 6,
              padding: 12,
              fontSize: 13,
              color: '#374151',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              minHeight: '100px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {previousMinuteData.meetingContent || 'No content available'}
            </div>
          </div>

          {/* Meeting Issues */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Meeting Issues</h4>
            {previousMinuteIssues.length > 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 6,
                maxHeight: '180px',
                overflowY: 'auto'
              }}>
                {previousMinuteIssues.map((issue, idx) => (
                  <div key={issue.id || idx} style={{ 
                    padding: '10px 12px',
                    borderBottom: idx < previousMinuteIssues.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span
                        onClick={() => issue.id && navigate(`/supervisor/task/group/${issue.groupId}?taskId=${issue.id}`)}
                        style={{
                          color: '#3b82f6',
                          cursor: issue.id ? 'pointer' : 'default',
                          textDecoration: issue.id ? 'underline' : 'none',
                          fontWeight: 500,
                          fontSize: 13
                        }}
                      >
                        {issue.name}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '500',
                        backgroundColor: getStatusColor(issue.status) + '20',
                        color: getStatusColor(issue.status),
                        whiteSpace: 'nowrap'
                      }}>
                        {getStatusText(issue.status)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      <span>Deadline: {issue.deadline ? formatDateTime(issue.deadline) : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: 6,
                padding: 12,
                fontSize: 13,
                color: '#6b7280',
                textAlign: 'center'
              }}>
                No issues available
              </div>
            )}
          </div>

          {/* Other Notes */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Other Notes</h4>
            <div style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 6,
              padding: 12,
              fontSize: 13,
              color: '#374151',
              whiteSpace: 'pre-wrap',
              minHeight: '60px',
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              {previousMinuteData.other || 'N/A'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button 
              variant="secondary"
              onClick={() => setShowPreviousMinuteModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {showEditScheduleModal && editingMeeting && (
        <div 
          className={styles.modalOverlay}
          onClick={closeEditScheduleModal}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
              Edit Meeting Schedule
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Select day of week <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {weekDays.map((day) => (
                  <button
                    key={day.dateString}
                    type="button"
                    onClick={() => setScheduleForm(prev => ({ ...prev, meetingDate: day.dateString }))}
                    style={{
                      padding: '8px 12px',
                      border: `2px solid ${scheduleForm.meetingDate === day.dateString ? '#8b5cf6' : '#d1d5db'}`,
                      borderRadius: '6px',
                      backgroundColor: scheduleForm.meetingDate === day.dateString ? '#f3e8ff' : 'white',
                      color: scheduleForm.meetingDate === day.dateString ? '#8b5cf6' : '#374151',
                      fontSize: '13px',
                      fontWeight: scheduleForm.meetingDate === day.dateString ? '600' : '400',
                      cursor: 'pointer',
                      minWidth: '100px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{day.dayName}</div>
                    <div>{day.display}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Meeting Description <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <Input
                type="text"
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter meeting description..."
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Start Time <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <Input
                  type="time"
                  value={scheduleForm.startAt}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, startAt: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  End Time <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <Input
                  type="time"
                  value={scheduleForm.endAt}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, endAt: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary"
                onClick={closeEditScheduleModal}
              >
                Cancel
              </Button>
              <Button 
                onClick={updateMeetingSchedule}
                style={{
                  backgroundColor: '#8b5cf6',
                  color: 'white'
                }}
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      <Modal
        open={showAIModal}
        onClose={handleCloseAIModal}
      >
        <div style={{
          padding: '32px',
          minWidth: '900px',
          maxWidth: '1200px',
          width: '90vw',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
            Ask AI Assistant
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Enter your question or prompt <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => {
                setAiPrompt(e.target.value);
                setAiError('');
              }}
              placeholder="E.g., Summarize the meeting minutes, suggest action items, analyze project progress..."
              rows={6}
              disabled={aiLoading || aiPolling}
              style={{ width: '100%', resize: 'vertical' }}
            />
            {aiError && (
              <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '13px' }}>
                {aiError}
              </div>
            )}
          </div>

          {aiTaskId && aiPolling && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid #0ea5e9',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ color: '#0c4a6e', fontSize: '14px', fontWeight: '500' }}>
                  Processing your request... Please wait.
                </span>
              </div>
              <Button
                variant="ghost"
                size="small"
                onClick={handleCancelAI}
                style={{
                  color: '#dc2626',
                  borderColor: '#dc2626'
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {aiResult && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#f0fdf4',
              border: '1px solid #10b981',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#065f46' }}>
                AI Response:
              </h3>
              <div style={{
                color: '#374151',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult, null, 2)}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={handleCloseAIModal}
              disabled={aiPolling}
            >
              Close
            </Button>
            <Button
              onClick={handleAskAI}
              disabled={aiLoading || aiPolling || !aiPrompt.trim()}
              loading={aiLoading || aiPolling}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white'
              }}
            >
              {aiPolling ? 'Processing...' : 'Ask AI'}
            </Button>
          </div>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </Modal>
    </div>
  );
}