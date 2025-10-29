import React from 'react';
import client from '../../../utils/axiosClient';
import { formatDate } from '../../../utils/date';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  { label: '00:00-04:00', start: 0, end: 4 },
  { label: '04:00-08:00', start: 4, end: 8 },
  { label: '08:00-12:00', start: 8, end: 12 },
  { label: '12:00-16:00', start: 12, end: 16 },
  { label: '16:00-20:00', start: 16, end: 20 },
  { label: '20:00-24:00', start: 20, end: 24 }
];

export default function StudentHome() {
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
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [detailModal, setDetailModal] = React.useState(false);
  const [taskModal, setTaskModal] = React.useState(false);
  const [meetingModal, setMeetingModal] = React.useState(false);
  const [milestoneDetails, setMilestoneDetails] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [minuteData, setMinuteData] = React.useState(null);

  // Load user info
  React.useEffect(() => {
    let mounted = true;
    async function loadUserInfo() {
      try {
        const res = await client.get("https://160.30.21.113:5000/api/v1/auth/user-info");
        const user = res?.data?.data || null;
        if (!mounted) return;
        setUserInfo(user);
      } catch {
        if (!mounted) return;
        setUserInfo(null);
      }
    }
    loadUserInfo();
    return () => { mounted = false; };
  }, []);

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

  // Load tasks
  React.useEffect(() => {
    let mounted = true;
    async function loadTasks() {
      if (!userInfo?.groups || userInfo.groups.length === 0) return;
      try {
        // Lấy group đầu tiên từ danh sách groups
        const groupId = userInfo.groups[0];
        const res = await client.get(`https://160.30.21.113:5000/api/v1/Student/Task/get-by-group/${groupId}`);
        if (res.data.status === 200) {
          const tasksData = res.data.data;
          if (!mounted) return;
          setTasks(tasksData || []);
        }
      } catch {
        if (!mounted) return;
        setTasks([]);
      }
    }
    loadTasks();
    return () => { mounted = false; };
  }, [userInfo?.groups]);

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

  // Get tasks for selected week
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
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return deadline >= weekStart && deadline <= weekEnd;
    });
    
    return weekTasks;
  };

  // Get milestone for specific day and time slot
  const getMilestoneForSlot = (day, timeSlot) => {
    const weekMilestones = getMilestonesForWeek();
    if (!weekMilestones.length) return null;
    
    // Tìm milestone phù hợp với ngày và giờ
    for (const milestone of weekMilestones) {
      const deadline = new Date(milestone.endAt);
      const dayOfWeek = deadline.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = deadline.getHours();
      
      // Convert Sunday=0 to Monday=0 format
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (adjustedDay === day && hour >= timeSlot.start && hour < timeSlot.end) {
        return milestone;
      }
    }
    
    return null;
  };

  // Get meeting for specific day and time slot
  const getMeetingForSlot = (day, timeSlot) => {
    const weekMeetings = getMeetingsForWeek();
    if (!weekMeetings.length) return null;
    
    // Tìm meeting phù hợp với ngày và giờ
    for (const meeting of weekMeetings) {
      const meetingDate = new Date(meeting.meetingDate);
      const dayOfWeek = meetingDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = parseInt(meeting.time.split(':')[0]);
      
      // Convert Sunday=0 to Monday=0 format
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (adjustedDay === day && hour >= timeSlot.start && hour < timeSlot.end) {
        return meeting;
      }
    }
    
    return null;
  };

  // Get task for specific day and time slot
  const getTaskForSlot = (day, timeSlot) => {
    const weekTasks = getTasksForWeek();
    if (!weekTasks.length) return null;
    
    // Tìm task phù hợp với ngày và giờ
    for (const task of weekTasks) {
      const deadline = new Date(task.deadline);
      const dayOfWeek = deadline.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = deadline.getHours();
      
      // Convert Sunday=0 to Monday=0 format
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (adjustedDay === day && hour >= timeSlot.start && hour < timeSlot.end) {
        return task;
      }
    }
    
    return null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return '#059669'; // Green
      case 'LATE':
        return '#dc2626'; // Red
      case 'Pending':
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

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setTaskModal(true);
  };

  const openMeetingModal = async (meeting) => {
    setSelectedMeeting(meeting);
    setMeetingModal(true);
    
    // Fetch meeting minute if exists
    try {
      const response = await client.get(`https://160.30.21.113:5000/api/v1/MeetingMinute?meetingDateId=${meeting.id}`);
      if (response.data.status === 200 && response.data.data) {
        setMinuteData(response.data.data);
      } else {
        setMinuteData(null);
      }
    } catch (error) {
      console.error('Error fetching meeting minute:', error);
      setMinuteData(null);
    }
  };

  const closeTaskModal = () => {
    setTaskModal(false);
    setSelectedTask(null);
  };

  const closeMeetingModal = () => {
    setMeetingModal(false);
    setSelectedMeeting(null);
    setMinuteData(null);
  };

  // Join meeting
  const joinMeeting = (meetingLink) => {
    window.open(meetingLink, '_blank');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async (deliveryItemId) => {
    if (!selectedFile || !userInfo?.groups || userInfo.groups.length === 0) return;
    
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa file này?')) {
      return;
    }
    
    try {
      const response = await client.delete(`https://160.30.21.113:5000/api/v1/upload/milestone?attachmentId=${attachmentId}`);
      if (response.data.status === 200) {
        alert('Xóa file thành công!');
        // Reload milestone details
        if (selectedMilestone) {
          const detailRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${userInfo.groups[0]}&deliverableId=${selectedMilestone.id}`);
          setMilestoneDetails(detailRes?.data || null);
        }
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Có lỗi xảy ra khi xóa file. Vui lòng thử lại.');
    }
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
            {TIME_SLOTS.map((timeSlot, slotIndex) => (
              <tr key={timeSlot.label}>
                <td style={{ 
                  padding: '8px', 
                  borderBottom: '1px solid #f1f5f9', 
                  fontSize: 11, 
                  fontWeight: 600,
                  background: '#f8fafc',
                  textAlign: 'center'
                }}>
                  {timeSlot.label}
                </td>
                {DAYS.map((day, dayIndex) => {
                  const milestone = getMilestoneForSlot(dayIndex, timeSlot);
                  const meeting = getMeetingForSlot(dayIndex, timeSlot);
                  const task = getTaskForSlot(dayIndex, timeSlot);
                  
                  return (
                    <td key={day} style={{ 
                      padding: '8px', 
                      borderBottom: '1px solid #f1f5f9',
                      borderRight: '1px solid #f1f5f9',
                      minHeight: '60px',
                      verticalAlign: 'top'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Milestone */}
                        {milestone && (
                          <div 
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
                              transition: 'all 0.2s ease'
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
                            <div style={{ fontWeight: 600, color: getStatusColor(milestone.status), marginBottom: 2, fontSize: 9, lineHeight: 1.2 }}>
                              📊 {milestone.name.length > 20 ? milestone.name.substring(0, 20) + '...' : milestone.name}
                            </div>
                            <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                              {getStatusText(milestone.status)}
                            </div>
                            <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                              {formatDate(milestone.endAt, 'HH:mm')}
                            </div>
                          </div>
                        )}
                        
                        {/* Meeting */}
                        {meeting && (
                          <div 
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
                              transition: 'all 0.2s ease'
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
                            <div style={{ fontWeight: 600, color: getMeetingStatusColor(meeting), marginBottom: 2, fontSize: 9, lineHeight: 1.2 }}>
                              📅 {meeting.description.length > 20 ? meeting.description.substring(0, 20) + '...' : meeting.description}
                            </div>
                            <div style={{ color: getMeetingStatusColor(meeting), fontSize: 8 }}>
                              {getMeetingStatusText(meeting)}
                            </div>
                            <div style={{ color: getMeetingStatusColor(meeting), fontSize: 8 }}>
                              {meeting.time}
                            </div>
                          </div>
                        )}
                        
                        {/* Task */}
                        {task && (
                          <div 
                            onClick={() => openTaskModal(task)}
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
                              transition: 'all 0.2s ease'
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
                            <div style={{ fontWeight: 600, color: getTaskStatusColor(task.status), marginBottom: 2, fontSize: 9, lineHeight: 1.2 }}>
                              📋 {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                            </div>
                            <div style={{ color: getTaskStatusColor(task.status), fontSize: 8 }}>
                              {getTaskStatusText(task.status)}
                            </div>
                            <div style={{ color: getTaskStatusColor(task.status), fontSize: 8 }}>
                              {formatDate(task.deadline, 'HH:mm')}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
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
                  <div><strong>Note:</strong> {milestoneDetails?.note || 'Chưa có ghi chú nào từ giảng viên'}</div>
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
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
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
                  <div><strong>Giờ:</strong> {selectedMeeting.time}</div>
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
                </div>
              </div>
              
              <div style={{ 
                flex: '1 1 300px',
                minWidth: '300px'
              }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Link cuộc họp</h3>
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
                    Tham gia cuộc họp
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
                        <div><strong>Bắt đầu:</strong> {formatDate(minuteData.startAt, 'DD/MM/YYYY HH:mm')}</div>
                        <div><strong>Kết thúc:</strong> {formatDate(minuteData.endAt, 'DD/MM/YYYY HH:mm')}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Danh sách tham gia</h4>
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
                        {minuteData.attendance || 'N/A'}
                      </div>
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
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Vấn đề cần giải quyết</h4>
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
                        {minuteData.issue || 'N/A'}
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
    </div>
  );
}
