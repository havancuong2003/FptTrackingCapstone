import React from 'react';
// import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Input from '../../../components/Input/Input';
import Textarea from '../../../components/Textarea/Textarea';
import client from '../../../utils/axiosClient';
import { formatDate } from '../../../utils/date';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  { label: '00:00-04:00', start: 0, end: 4 },
  { label: '04:00-08:00', start: 4, end: 8 },
  { label: '08:00-12:00', start: 8, end: 12 },
  { label: '12:00-16:00', start: 12, end: 16 },
  { label: '16:00-20:00', start: 16, end: 20 },
  { label: '20:00-24:00', start: 20, end: 24 }
];

export default function SupervisorCalendar() {
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

  // API Base URL
  const API_BASE_URL = 'https://160.30.21.113:5000/api/v1';

  // Load user info
  React.useEffect(() => {
    let mounted = true;
    async function loadUserInfo() {
      try {
        const res = await client.get(`${API_BASE_URL}/auth/user-info`);
        const user = res?.data?.data || null;
        if (!mounted) return;
        setUserInfo(user);
        
        // Load groups that this supervisor is supervising
        if (user?.groups && user.groups.length > 0) {
          // Fetch all groups that this supervisor manages
          const allGroups = [];
          for (const groupId of user.groups) {
            try {
              const groupsRes = await client.get(`${API_BASE_URL}/Staff/capstone-groups/${groupId}`);
              const groupData = groupsRes?.data?.data;
              if (groupData) {
                allGroups.push(groupData);
              }
            } catch (error) {
              console.error(`Error loading group ${groupId}:`, error);
            }
          }
          setGroups(allGroups);
        }
      } catch {
        if (!mounted) return;
        setUserInfo(null);
        setGroups([]);
      }
    }
    loadUserInfo();
    return () => { mounted = false; };
  }, []);

  // // Load semester info and weeks from first group
  // React.useEffect(() => {
  //   let mounted = true;
  //   async function loadSemesterInfo() {
  //     if (!groups.length || !groups[0]?.semesterId) return;
  //     try {
  //       const res = await client.get(`${API_BASE_URL}/Staff/semester/getSemesterBy/${groups[0].semesterId}`);
  //       const semester = res?.data?.data || null;
  //       if (!mounted) return;
  //       setSemesterInfo(semester);
  //       setWeeks(semester?.weeks || []);
  //       if (semester?.weeks?.length > 0) {
  //         setSelectedWeek(semester.weeks[0].weekNumber);
  //       }
  //     } catch {
  //       if (!mounted) return;
  //       setSemesterInfo(null);
  //       setWeeks([]);
  //     }
  //   }
  //   loadSemesterInfo();
  //   return () => { mounted = false; };
  // }, [groups]);


  // Load milestones for all groups
  React.useEffect(() => {
    let mounted = true;
    async function loadMilestones() {
      if (!userInfo?.groups || userInfo.groups.length === 0) return;
      try {
        const allMilestones = [];
        for (const groupId of userInfo.groups) {
          try {
            const res = await client.get(`${API_BASE_URL}/deliverables/group/${groupId}`);
            const list = Array.isArray(res?.data) ? res.data : [];
            if (list.length > 0) {
              const milestonesWithGroup = list.map(milestone => ({
                ...milestone,
                groupId: groupId
              }));
              allMilestones.push(...milestonesWithGroup);
            }
          } catch (error) {
            console.error(`Error loading milestones for group ${groupId}:`, error);
          }
        }
        if (!mounted) return;
        setMilestones(allMilestones);
      } catch {
        if (!mounted) return;
        setMilestones([]);
      }
    }
    loadMilestones();
    return () => { mounted = false; };
  }, [userInfo?.groups]);

  // Load meetings for all groups
  React.useEffect(() => {
    let mounted = true;
    async function loadMeetings() {
      if (!userInfo?.groups || userInfo.groups.length === 0) return;
      try {
        const allMeetings = [];
        for (const groupId of userInfo.groups) {
          try {
            const response = await client.get(`${API_BASE_URL}/Student/Meeting/group/${groupId}/schedule-dates`);
            if (response.data.status === 200) {
              const meetingsData = response.data.data;
              if (meetingsData && meetingsData.length > 0) {
                const meetingsWithGroup = meetingsData.map(meeting => ({
                  ...meeting,
                  groupId: groupId
                }));
                allMeetings.push(...meetingsWithGroup);
              }
            }
          } catch (error) {
            console.error(`Error fetching meetings for group ${groupId}:`, error);
          }
        }
        
        // Sort by meeting date
        allMeetings.sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));
        
        if (!mounted) return;
        setMeetings(allMeetings);
      } catch (error) {
        console.error('Error loading meetings:', error);
        if (!mounted) return;
        setMeetings([]);
      }
    }
    loadMeetings();
    return () => { mounted = false; };
  }, [userInfo?.groups]);

  // Load tasks for all groups
  React.useEffect(() => {
    let mounted = true;
    async function loadTasks() {
      if (!userInfo?.groups || userInfo.groups.length === 0) return;
      try {
        const allTasks = [];
        for (const groupId of userInfo.groups) {
          try {
            const response = await client.get(`${API_BASE_URL}/Student/Task/get-by-group/${groupId}`);
            if (response.data.status === 200) {
              const tasksData = response.data.data;
              if (tasksData && tasksData.length > 0) {
                const tasksWithGroup = tasksData.map(task => ({
                  ...task,
                  groupId: groupId
                }));
                allTasks.push(...tasksWithGroup);
              }
            }
          } catch (error) {
            console.error(`Error fetching tasks for group ${groupId}:`, error);
          }
        }
        
        if (!mounted) return;
        setTasks(allTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
        if (!mounted) return;
        setTasks([]);
      }
    }
    loadTasks();
    return () => { mounted = false; };
  }, [userInfo?.groups]);

  // // Set loading false when all data loaded
  // React.useEffect(() => {
  //   if (userInfo && groups.length > 0 && semesterInfo && weeks.length > 0) {
  //     setLoading(false);
  //   }
  // }, [userInfo, groups, semesterInfo, weeks]);

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
    if (!selectedWeekData) return [];
    
    const weekStart = new Date(selectedWeekData.startAt);
    const weekEnd = new Date(selectedWeekData.endAt);
    
    // Set week end to 23:59:59 to include the entire last day
    weekEnd.setHours(23, 59, 59, 999);
    
    return tasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return deadline >= weekStart && deadline <= weekEnd;
    });
  };

  // Get milestone for specific day and time slot
  const getMilestoneForSlot = (day, timeSlot) => {
    const weekMilestones = getMilestonesForWeek();
    if (!weekMilestones.length) return null;
    
    // Find milestone that matches day and time
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
    
    // Find meeting that matches day and time
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
    
    // Find task that matches day and time
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

  // Fetch group info for meeting
  const fetchMeetingGroupInfo = async (groupId) => {
    try {
      const response = await client.get(`${API_BASE_URL}/Staff/capstone-groups/${groupId}`);
      if (response.data.status === 200) {
        setSelectedMeetingGroupInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
      setSelectedMeetingGroupInfo(null);
    }
  };

  // Open meeting modal
  const openMeetingModal = async (meeting) => {
    setSelectedMeeting(meeting);
    setMeetingModal(true);
    
    // Fetch group info for this meeting
    await fetchMeetingGroupInfo(meeting.groupId);
    
    // Fetch meeting minute if exists
    try {
      const response = await client.get(`${API_BASE_URL}/MeetingMinute?meetingDateId=${meeting.id}`);
      if (response.data.status === 200 && response.data.data) {
        setMinuteData(response.data.data);
        setFormData({
          startAt: response.data.data.startAt ? response.data.data.startAt.split('T')[0] + 'T' + response.data.data.startAt.split('T')[1].substring(0, 5) : '',
          endAt: response.data.data.endAt ? response.data.data.endAt.split('T')[0] + 'T' + response.data.data.endAt.split('T')[1].substring(0, 5) : '',
          attendance: response.data.data.attendance || '',
          issue: response.data.data.issue || '',
          meetingContent: response.data.data.meetingContent || '',
          other: response.data.data.other || ''
        });
        setIsEditing(true);
      } else {
        setMinuteData(null);
        setFormData({
          startAt: '',
          endAt: '',
          attendance: '',
          issue: '',
          meetingContent: '',
          other: ''
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error fetching meeting minute:', error);
      setMinuteData(null);
      setIsEditing(false);
    }
  };

  // Open task modal
  const openTaskModal = (task) => {
    setSelectedTask(task);
    setTaskModal(true);
  };

  // Open milestone modal
  const openMilestoneModal = async (milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneModal(true);
    
    // Load milestone details
    try {
      const res = await client.get(`${API_BASE_URL}/deliverables/group/detail?groupdId=${milestone.groupId}&deliverableId=${milestone.id}`);
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

  // Get group name by ID
  const getGroupName = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group?.projectName || `Nhóm ${groupId}`;
  };

  // Join meeting
  const joinMeeting = (meetingLink) => {
    window.open(meetingLink, '_blank');
  };

  // if (loading) {
  //   return (
  //     <div style={{ padding: 32, textAlign: 'center' }}>
  //       <div>Loading calendar...</div>
  //     </div>
  //   );
  // }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Supervisor Calendar</h1>
        <div style={{ fontSize: 14, color: '#64748b' }}>
          Managing {groups.length} group{groups.length > 1 ? 's' : ''}
        </div>
      </div>
      
      {/* {semesterInfo && (
        <div style={{ 
        //   display: 'flex', 
          alignItems: 'center', 
          gap: 16, 
          marginBottom: 16 
        }}>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8, 
            padding: 8, 
            flex: 1,
            width: '500px'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e' }}>
              Semester: {semesterInfo.name} ({formatDate(semesterInfo.startAt, 'DD/MM/YYYY')} - {formatDate(semesterInfo.endAt, 'DD/MM/YYYY')})
            </div>
          </div>
        </div>
      )} */}


      {/* Groups Information */}
      {groups.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Managed Groups</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {groups.map((group) => (
              <div key={group.id} style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {group.projectName}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  <div>ID: {group.id}</div>
                  <div>Students: {group.students?.length || 0}</div>
                  <div>Supervisors: {group.supervisors?.join(', ') || 'N/A'}</div>
                </div>
              </div>
            ))}
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
                               transition: 'all 0.2s ease'
                             }}
                           >
                             <div style={{ fontWeight: 600, color: getStatusColor(milestone.status), marginBottom: 2, fontSize: 9, lineHeight: 1.2 }}>
                               📊 {milestone.name.length > 20 ? milestone.name.substring(0, 20) + '...' : milestone.name}
                             </div>
                             <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                               {getStatusText(milestone.status)}
                             </div>
                             <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                               {formatDate(milestone.endAt, 'HH:mm')} ({getGroupName(milestone.groupId)})
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
                          >
                            <div style={{ fontWeight: 600, color: getMeetingStatusColor(meeting), marginBottom: 2, fontSize: 9, lineHeight: 1.2 }}>
                              📅 {meeting.description.length > 20 ? meeting.description.substring(0, 20) + '...' : meeting.description}
                            </div>
                            <div style={{ color: getMeetingStatusColor(meeting), fontSize: 8 }}>
                              {getMeetingStatusText(meeting)}
                            </div>
                             <div style={{ color: getMeetingStatusColor(meeting), fontSize: 8 }}>
                               {meeting.time} ({getGroupName(meeting.groupId)})
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
                          >
                            <div style={{ fontWeight: 600, color: getTaskStatusColor(task.status), marginBottom: 2, fontSize: 9, lineHeight: 1.2 }}>
                              📋 {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                            </div>
                            <div style={{ color: getTaskStatusColor(task.status), fontSize: 8 }}>
                              {getTaskStatusText(task.status)}
                            </div>
                             <div style={{ color: getTaskStatusColor(task.status), fontSize: 8 }}>
                               {formatDate(task.deadline, 'HH:mm')} ({getGroupName(task.groupId)})
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
                  <div><strong>Nhóm:</strong> {selectedMeetingGroupInfo?.projectName || `Nhóm ${selectedMeeting.groupId}`}</div>
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
                                    <Button
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `https://160.30.21.113:5000${attachment.path}`;
                                        link.download = attachment.path.split('/').pop();
                                        link.click();
                                      }}
                                      variant="ghost"
                                      style={{ fontSize: 11, padding: '4px 8px', flexShrink: 0 }}
                                    >
                                      Download
                                    </Button>
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
