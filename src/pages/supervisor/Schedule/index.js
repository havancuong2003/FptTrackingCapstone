import React from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import { 
  getSupervisorGroups, 
  getMeetingScheduleByGroupId, 
  finalizeMeetingSchedule,
  getStudentFreeTimeSlotsNew 
} from '../../../api/schedule';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { sendMeetingNotification } from '../../../api/email';

export default function SupervisorSchedule() {
  const { groupId: urlGroupId } = useParams();
  const groupId = urlGroupId ;
  
  // Lấy thông tin user từ localStorage
  const getCurrentUser = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        return JSON.parse(authUser);
      }
      
    } catch (error) {
      console.error('Error parsing auth_user:', error);
    
    }
  };
  
  const currentUser = getCurrentUser();
  const [loading, setLoading] = React.useState(false);
  const [availableGroups, setAvailableGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState('');
  const [group, setGroup] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [memberSchedules, setMemberSchedules] = React.useState({});
  const [mergedSchedule, setMergedSchedule] = React.useState({});
  const [suggestedTimes, setSuggestedTimes] = React.useState([]);
  const [isFinalized, setIsFinalized] = React.useState(false);
  const [finalMeeting, setFinalMeeting] = React.useState(null);
  const [meetingSchedule, setMeetingSchedule] = React.useState(null);
  const [isSupervisor, setIsSupervisor] = React.useState(true);
  
  // Meeting form data
  const [meetingData, setMeetingData] = React.useState({
    day: '',
    time: '',
    endTime: '',
    meetingLink: ''
  });
  
  // Selected slot from Common Free Time
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [selectedDay, setSelectedDay] = React.useState('');

  // Days of the week
  const daysOfWeek = [
    { id: 1, name: 'Monday', value: 'monday' },
    { id: 2, name: 'Tuesday', value: 'tuesday' },
    { id: 3, name: 'Wednesday', value: 'wednesday' },
    { id: 4, name: 'Thursday', value: 'thursday' },
    { id: 5, name: 'Friday', value: 'friday' },
    { id: 6, name: 'Saturday', value: 'saturday' },
    { id: 7, name: 'Sunday', value: 'sunday' }
  ];


  // Fetch available groups for supervisor
  const fetchAvailableGroups = async () => {
    try {
      setLoading(true);
      const response = await getSupervisorGroups();
      
      if (response.status === 200) {
        const groupsData = response.data || [];
        const mappedGroups = groupsData.map(group => ({
          id: group.id,
          name: group.name || `Group ${group.id}`,
          description: group.description || '',
          memberCount: group.students?.length || 0,
          status: group.status || 'active'
        }));
        setAvailableGroups(mappedGroups);
      } else {
        console.error('Error fetching groups:', response.data.message);
        setAvailableGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setAvailableGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Load selected group data
  const loadSelectedGroupData = async (groupId) => {
    setLoading(true);
    try {
      // API call lấy chi tiết group theo pattern từ Groups
      const response = await getCapstoneGroupDetail(groupId);
      if (response.status === 200) {
        const groupDetail = response.data;
        // Format group data theo structure thực tế từ API
        const formattedGroup = {
          id: groupDetail.id || groupId,
          groupCode: groupDetail.groupCode,
          groupName: groupDetail.groupCode,
          projectName: groupDetail.projectName,
          projectCode: groupDetail.groupCode,
          semesterId: groupDetail.semesterId,
          supervisors: groupDetail.supervisors,
          supervisorsInfor: groupDetail.supervisorsInfor,
          status: groupDetail.status,
          risk: groupDetail.risk,
          members: groupDetail.students.map(student => ({
            id: student.id,
            studentId: student.id,
            rollNumber: student.rollNumber,
            name: student.name,
            email: student.email,
            role: student.role
          }))
        };
        
        setGroup(formattedGroup);
        setMembers(formattedGroup.members);
        
        
        // Fetch student free time slots
        await fetchStudentFreeTimeSlots(groupId);
      } else {
        console.error('Error fetching group data:', response.data.message);
        setGroup({ id: groupId, name: 'Group ' + groupId });
      }
      
      // Check if meeting schedule exists
      try {
        const scheduleResponse = await getMeetingScheduleByGroupId(groupId);
        if (scheduleResponse.status === 200 && scheduleResponse.data.isActive) {
          setMeetingSchedule(scheduleResponse.data);
          setIsFinalized(scheduleResponse.data.isActive);  
        }
      } catch (error) {
        console.error('No existing schedule found');
        setIsFinalized(false);
      }
    } catch (error) {
      console.error('Error loading group data:', error);
      setGroup({ id: groupId, name: 'Group ' + groupId });
    } finally {
      setLoading(false);
    }
  };

  // Calculate merged schedule (merge all free times from all members)
  const calculateMergedSchedule = (memberSchedulesData) => {
    const merged = {};
    const studentIds = Object.keys(memberSchedulesData);
    
    if (studentIds.length === 0) {
      setMergedSchedule({});
      return {};
    }
    
    daysOfWeek.forEach(day => {
      const dayKey = day.value;
      const allSlots = new Map(); // Use Map to store unique slots by id
      
      // Collect all unique slots for this day from all members (union)
      studentIds.forEach(studentId => {
        const memberSchedule = memberSchedulesData[studentId] || {};
        // memberSchedule keys should already be normalized to English (monday, tuesday, etc.)
        if (memberSchedule[dayKey]) {
          const daySlots = memberSchedule[dayKey] || [];
          daySlots.forEach(slot => {
            // slot is now an object with id, nameSlot, startAt, endAt
            if (slot && slot.id) {
              allSlots.set(slot.id, slot);
            }
          });
        }
      });
      
      // Convert Map to array and sort by startAt
      const mergedSlots = Array.from(allSlots.values());
      mergedSlots.sort((a, b) => {
        // Parse time strings like "7:30 AM" or "09:50:00"
        const parseTime = (timeStr) => {
          if (!timeStr) return 0;
          const cleaned = timeStr.replace(/[AP]M/i, '').trim();
          const [hours, minutes] = cleaned.split(':').map(Number);
          let totalMinutes = (hours || 0) * 60 + (minutes || 0);
          // Handle AM/PM
          if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
            totalMinutes += 12 * 60;
          }
          if (timeStr.toUpperCase().includes('AM') && hours === 12) {
            totalMinutes -= 12 * 60;
          }
          return totalMinutes;
        };
        return parseTime(a.startAt) - parseTime(b.startAt);
      });
      
      merged[dayKey] = mergedSlots;
    });
    
    setMergedSchedule(merged);
    return merged;
  };

  // Calculate suggested meeting times from memberSchedules (same data as Members' Free Time)
  const calculateSuggestedTimes = (memberSchedulesData) => {
    const suggestions = [];
    
    // Collect ALL unique slots from ALL students across ALL days (same logic as calendar view)
    const allSlotsMap = new Map();
    
    Object.keys(memberSchedulesData).forEach(studentId => {
      const studentSchedule = memberSchedulesData[studentId];
      Object.keys(studentSchedule).forEach(dayKey => {
        const daySlots = studentSchedule[dayKey] || [];
        daySlots.forEach(slot => {
          if (slot && slot.id) {
            if (!allSlotsMap.has(slot.id)) {
              allSlotsMap.set(slot.id, {
                id: slot.id,
                startAt: slot.startAt || '',
                endAt: slot.endAt || '',
                nameSlot: slot.nameSlot || '',
                days: new Set() // Track which days this slot appears
              });
            }
            // Add day to the slot's days set
            allSlotsMap.get(slot.id).days.add(dayKey);
          }
        });
      });
    });
    
    // Helper function to count available students for a slot on a specific day
    const getAvailableStudentsCount = (slot, dayKey) => {
      let count = 0;
      Object.keys(memberSchedulesData).forEach(studentId => {
        const studentSchedule = memberSchedulesData[studentId];
        const daySlots = studentSchedule[dayKey] || [];
        const isAvailable = daySlots.some(s => {
          return (s.id === slot.id) || 
                 (s.startAt === slot.startAt && s.endAt === slot.endAt);
        });
        if (isAvailable) {
          count++;
        }
      });
      return count;
    };
    
    // Helper function to calculate hours from time range
    const calculateHours = (startAt, endAt) => {
      if (!startAt || !endAt) return 0;
      const parseTime = (timeStr) => {
        const cleaned = timeStr.replace(/[AP]M/i, '').trim();
        const parts = cleaned.split(':');
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        let totalMinutes = hours * 60 + minutes;
        
        if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
          totalMinutes += 12 * 60;
        }
        if (timeStr.toUpperCase().includes('AM') && hours === 12) {
          totalMinutes -= 12 * 60;
        }
        return totalMinutes;
      };
      
      const startMinutes = parseTime(startAt);
      const endMinutes = parseTime(endAt);
      const diffMinutes = endMinutes - startMinutes;
      return Math.round((diffMinutes / 60) * 10) / 10; // Round to 1 decimal
    };
    
    // Create suggestions for each slot on each day it appears
    allSlotsMap.forEach((slot, slotId) => {
      slot.days.forEach(dayKey => {
        const day = daysOfWeek.find(d => d.value === dayKey);
        if (day) {
          const availableCount = getAvailableStudentsCount(slot, dayKey);
          if (availableCount > 0) {
            const hours = calculateHours(slot.startAt, slot.endAt);
            const formattedStart = formatTime(slot.startAt);
            const formattedEnd = formatTime(slot.endAt);
            const timeDisplay = formattedStart && formattedEnd 
              ? `${formattedStart} - ${formattedEnd}` 
              : (slot.nameSlot || '');
            
            // Parse start time for sorting
            const parseTimeForSort = (timeStr) => {
              if (!timeStr) return 0;
              const cleaned = timeStr.replace(/[AP]M/i, '').trim();
              const parts = cleaned.split(':');
              const hours = parseInt(parts[0]) || 0;
              const minutes = parseInt(parts[1]) || 0;
              let totalMinutes = hours * 60 + minutes;
              
              if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
                totalMinutes += 12 * 60;
              }
              if (timeStr.toUpperCase().includes('AM') && hours === 12) {
                totalMinutes -= 12 * 60;
              }
              return totalMinutes;
            };
            
            suggestions.push({
              day: dayKey,
              dayName: day.name,
              time: timeDisplay,
              availableCount: availableCount,
              hours: hours,
              slot: slot,
              startTimeMinutes: parseTimeForSort(slot.startAt) // For sorting
            });
          }
        }
      });
    });
    
    // Sort by: 1) day of week (Monday first), 2) start time (earlier first)
    const dayOrder = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
    suggestions.sort((a, b) => {
      // First sort by day (Monday = 1, comes first)
      if (dayOrder[a.day] !== dayOrder[b.day]) {
        return dayOrder[a.day] - dayOrder[b.day];
      }
      // If same day, sort by start time (earlier first)
      return a.startTimeMinutes - b.startTimeMinutes;
    });
    
    // Limit to top 10 suggestions
    const topSuggestions = suggestions.slice(0, 10);
    
    setSuggestedTimes(topSuggestions);
    return topSuggestions;
  };

  // Helper function to format time (remove seconds, only HH:MM)
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    // Remove seconds if present (format: HH:MM:SS -> HH:MM)
    if (timeStr.includes(':') && timeStr.split(':').length === 3) {
      const parts = timeStr.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  // Helper function to map Vietnamese day names to English
  const mapDayOfWeekToEnglish = (dayOfWeek) => {
    const dayNameMap = {
      'thứ hai': 'monday',
      'thứ ba': 'tuesday',
      'thứ tư': 'wednesday',
      'thứ năm': 'thursday',
      'thứ sáu': 'friday',
      'thứ bảy': 'saturday',
      'chủ nhật': 'sunday',
      'monday': 'monday',
      'tuesday': 'tuesday',
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    };
    
    const normalized = dayOfWeek.toLowerCase().trim();
    return dayNameMap[normalized] || normalized;
  };

  // Fetch student free time slots
  const fetchStudentFreeTimeSlots = async (groupId) => {
    try {
      const response = await getStudentFreeTimeSlotsNew(groupId);

      if (response && response.status === 200 && response.data) {
        const apiData = response.data.students || [];
        
        // Lưu dữ liệu của tất cả thành viên để hiển thị
        const memberSchedulesData = {};
        apiData.forEach(studentData => {
          if (studentData.freeTimeSlots && studentData.freeTimeSlots.length > 0) {
            const schedule = {};
            studentData.freeTimeSlots.forEach(dayData => {
              // dayData.dayOfWeek có thể là "Thứ hai", "Thứ ba" (tiếng Việt) hoặc "Monday", "Tuesday" (tiếng Anh)
              const dayKey = mapDayOfWeekToEnglish(dayData.dayOfWeek);
              // timeSlots là mảng các slot object với id, nameSlot, startAt, endAt
              // Đảm bảo format đúng: { id, nameSlot, startAt, endAt }
              schedule[dayKey] = (dayData.timeSlots || []).map(slot => ({
                id: slot.id,
                nameSlot: slot.nameSlot || '',
                startAt: slot.startAt || '',
                endAt: slot.endAt || ''
              }));
            });
            memberSchedulesData[studentData.studentId] = schedule;
          }
        });
        setMemberSchedules(memberSchedulesData);
        
        // Calculate merged schedule
        const merged = calculateMergedSchedule(memberSchedulesData);
        
        // Calculate suggested times from memberSchedules (same data source as calendar)
        calculateSuggestedTimes(memberSchedulesData);
        
        return memberSchedulesData;
      }
      return {};
    } catch (error) {
      console.error('No student free time slots found:', error);
      return {};
    }
  };

  // Finalize/Update meeting schedule
  const handleFinalizeMeeting = async () => {
    if (!meetingData.day || !meetingData.time || !meetingData.endTime || !meetingData.meetingLink) {
      alert('Vui lòng điền đầy đủ thông tin lịch họp (ngày, giờ bắt đầu, giờ kết thúc, và link meeting)');
      return;
    }

    setLoading(true);
    try {
      const meetingScheduleData = {
        id: meetingSchedule?.id || null, // Use existing ID if updating
        isActive: true,
        meetingLink: meetingData.meetingLink,
        time: meetingData.time,
        endTime: meetingData.endTime,
        dayOfWeek: meetingData.day.toLowerCase(),
      };
      const meetingDataAPI ={
        finalMeeting: {
          day: meetingScheduleData.dayOfWeek,
          time: meetingScheduleData.time,
          endTime: meetingScheduleData.endTime,
          meetingLink: meetingScheduleData.meetingLink
        }
      }
      const response = await finalizeMeetingSchedule(selectedGroup, meetingDataAPI);
      if (response) {
        // Map response data to meetingSchedule structure
        const responseData = response.data || response;
        const finalMeetingData = responseData.finalMeeting || responseData;
        
        // Format meeting schedule data
        const formattedMeetingSchedule = {
          id: finalMeetingData.id || meetingSchedule?.id,
          dayOfWeek: finalMeetingData.day || finalMeetingData.dayOfWeek || meetingData.day.toLowerCase(),
          time: finalMeetingData.time || meetingData.time,
          meetingLink: finalMeetingData.meetingLink || meetingData.meetingLink,
          createAt: finalMeetingData.createAt || finalMeetingData.createdAt || new Date().toISOString(),
          isActive: finalMeetingData.isActive !== undefined ? finalMeetingData.isActive : true
        };
        
        setMeetingSchedule(formattedMeetingSchedule);
        setIsFinalized(true);
        
        // Gửi email thông báo cho sinh viên trong group
        try {
          const studentEmails = members.map(member => member.email).filter(email => email);
          if (studentEmails.length > 0) {
            const dayNames = {
              'monday': 'Monday',
              'tuesday': 'Tuesday', 
              'wednesday': 'Wednesday',
              'thursday': 'Thursday',
              'friday': 'Friday',
              'saturday': 'Saturday',
              'sunday': 'Sunday'
            };
            
            const meetingTime = `${dayNames[meetingData.day.toLowerCase()]} - ${meetingData.time}`;
            
            await sendMeetingNotification({
              recipients: studentEmails,
              subject: `[${group.groupName || 'Capstone Project'}] Group Meeting Schedule Notification`,
              meetingTime: meetingTime,
              meetingLink: meetingData.meetingLink,
              message: `Supervisor ${currentUser.name} has confirmed the group meeting schedule. Please join on time.`
            });
            
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Không hiển thị lỗi email cho user, chỉ log
        }
        
        alert(isFinalized ? 'Meeting schedule updated successfully!' : 'Meeting schedule confirmed successfully!');
      } else {
        alert('Error occurred while confirming meeting schedule');
      }
    } catch (error) {
      console.error('Error finalizing meeting:', error);
      alert('Error occurred while confirming meeting schedule');
    } finally {
      setLoading(false);
    }
  };

  // Update meeting data
  const updateMeetingData = (field, value) => {
    setMeetingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle suggested time click
  const handleSuggestedTimeClick = (suggestion) => {
    const slot = suggestion.slot;
    const startTime = convertTimeToInputFormat(slot?.startAt || '');
    const endTime = convertTimeToInputFormat(slot?.endAt || '');
    
    setMeetingData({
      day: suggestion.day,
      time: startTime,
      endTime: endTime,
      meetingLink: meetingData.meetingLink || ''
    });
    
    // Highlight slot
    setSelectedSlot(slot);
    setSelectedDay(suggestion.day);
  };

  // Convert time format để hiển thị trong input type="time" (HH:MM)
  const convertTimeToInputFormat = (timeStr) => {
    if (!timeStr) return '';
    // Nếu đã là format HH:MM hoặc HH:MM:SS thì lấy phần đầu
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    // Nếu có AM/PM thì convert
    const isPM = timeStr.toUpperCase().includes('PM');
    const isAM = timeStr.toUpperCase().includes('AM');
    if (isPM || isAM) {
      const cleaned = timeStr.replace(/[AP]M/i, '').trim();
      const [hours, minutes] = cleaned.split(':').map(Number);
      let hour24 = hours || 0;
      if (isPM && hour24 !== 12) {
        hour24 += 12;
      } else if (isAM && hour24 === 12) {
        hour24 = 0;
      }
      return `${String(hour24).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`;
    }
    return timeStr;
  };




  // Handle group selection
  const handleGroupSelect = async (groupId) => {
    setSelectedGroup(groupId);
    if (groupId) {
      await loadSelectedGroupData(groupId);
    } else {
      setGroup(null);
      setMembers([]);
      setIsFinalized(false);
      setFinalMeeting(null);
    }
  };

  // Load available groups when component mounts
  React.useEffect(() => {
    fetchAvailableGroups();
  }, []);

  if (loading && !group) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Không cần return sớm nữa, luôn hiển thị group selector

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Group Meeting Schedule</h1>
        <div className={styles.headerControls}>
          <div className={styles.supervisorBadge}>
            Supervisor: {currentUser.name}
          </div>
        </div>
      </div>

      {/* Group Selection - Luôn hiển thị */}
      <div className={styles.section}>
        <h2>Select Group</h2>
        <div className={styles.groupSelector}>
          <select
            value={selectedGroup}
            onChange={(e) => handleGroupSelect(e.target.value)}
            className={styles.groupSelect}
            disabled={loading}
          >
            <option value="">Select Group</option>
            {availableGroups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chỉ hiển thị nội dung khi có group được chọn */}
      {selectedGroup && group && (
        <>
          {/* Meeting Schedule Status - Always show at top */}
          <div className={styles.meetingStatusSection}>
            {isFinalized && meetingSchedule ? (
              <div className={styles.finalizedMeeting}>
                <div className={styles.finalizedHeader}>
                  <h3>Meeting Schedule Confirmed</h3>
                  <div className={styles.warningBadge}>
                    Meeting schedule has been confirmed and cannot be edited
                  </div>
                </div>
                <div className={styles.meetingInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Time:</span>
                    <span className={styles.infoValue}>
                      {(() => {
                        const dayNames = {
                          'monday': 'Monday',
                          'tuesday': 'Tuesday', 
                          'wednesday': 'Wednesday',
                          'thursday': 'Thursday',
                          'friday': 'Friday',
                          'saturday': 'Saturday',
                          'sunday': 'Sunday'
                        };
                        const dayName = dayNames[meetingSchedule.dayOfWeek?.toLowerCase()] || meetingSchedule.dayOfWeek || '';
                        return `${dayName} - ${meetingSchedule.time || ''}`;
                      })()}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Created Date:</span>
                    <span className={styles.infoValue}>
                      {meetingSchedule.createAt 
                        ? new Date(meetingSchedule.createAt).toLocaleDateString('en-US')
                        : new Date().toLocaleDateString('en-US')
                      }
                    </span>
                  </div>
                  {meetingSchedule.meetingLink && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Meeting Link:</span>
                      <button 
                        onClick={() => window.open(meetingSchedule.meetingLink, '_blank')}
                        className={styles.meetingLinkButton}
                      >
                        Click to Join
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.notFinalized}>
                <div className={styles.warningBox}>
                  <h3>Important Notice</h3>
                  <p>Meeting schedule has not been confirmed. Once confirmed, you will not be able to change this schedule.</p>
                  <p className={styles.warningText}>Please check the information carefully before confirming!</p>
                </div>
              </div>
            )}
          </div>

          <div className={styles.instruction}>
            <span>View members' free time and confirm the common meeting schedule</span>
          </div>

          {/* Student Free Time Slots - DataTable View */}
          <div className={styles.freeTimeSection}>
            <h2>Members' Free Time</h2>
            {(() => {
              // Collect ALL slots from ALL students across ALL days
              const allSlotsMap = new Map(); // Use Map to store unique slots by id
              
              // Lặp qua tất cả students
              Object.keys(memberSchedules).forEach(studentId => {
                const studentSchedule = memberSchedules[studentId];
                
                // Lặp qua tất cả days của student này
                Object.keys(studentSchedule).forEach(dayKey => {
                  const daySlots = studentSchedule[dayKey] || [];
                  
                  // Lặp qua tất cả timeSlots của day này
                  daySlots.forEach(slot => {
                    // Sử dụng slot.id làm key để tránh duplicate
                    if (slot && slot.id) {
                      if (!allSlotsMap.has(slot.id)) {
                        allSlotsMap.set(slot.id, {
                          id: slot.id,
                          startAt: slot.startAt || '',
                          endAt: slot.endAt || '',
                          nameSlot: slot.nameSlot || ''
                        });
                      }
                    }
                  });
                });
              });
              
              // Convert to array and sort by time
              const allSlots = Array.from(allSlotsMap.values()).sort((a, b) => {
                const parseTime = (timeStr) => {
                  if (!timeStr) return 0;
                  // Handle format "09:50:00" or "09:50" or "7:30 AM"
                  const cleaned = timeStr.replace(/[AP]M/i, '').trim();
                  const parts = cleaned.split(':');
                  const hours = parseInt(parts[0]) || 0;
                  const minutes = parseInt(parts[1]) || 0;
                  let totalMinutes = hours * 60 + minutes;
                  
                  // Handle AM/PM if present
                  if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
                    totalMinutes += 12 * 60;
                  }
                  if (timeStr.toUpperCase().includes('AM') && hours === 12) {
                    totalMinutes -= 12 * 60;
                  }
                  return totalMinutes;
                };
                return parseTime(a.startAt) - parseTime(b.startAt);
              });
              
              // Helper function to find students available at a specific slot and day
              const getAvailableStudents = (slot, dayKey) => {
                const available = [];
                
                // Lặp qua tất cả students
                Object.keys(memberSchedules).forEach(studentId => {
                  const studentSchedule = memberSchedules[studentId];
                  const daySlots = studentSchedule[dayKey] || [];
                  
                  // Check if student has this slot (by id or by time match)
                  const isAvailable = daySlots.some(s => {
                    // Match by id (preferred) or by time range
                    return (s.id === slot.id) || 
                           (s.startAt === slot.startAt && s.endAt === slot.endAt);
                  });
                  
                  if (isAvailable) {
                    const student = members.find(m => 
                      m.id === parseInt(studentId) || 
                      m.studentId === parseInt(studentId) ||
                      String(m.id) === String(studentId) ||
                      String(m.studentId) === String(studentId)
                    );
                    if (student) {
                      available.push(student);
                    }
                  }
                });
                
                return available;
              };
              
              // Prepare data for DataTable
              const tableData = allSlots.map(slot => {
                const row = {
                  id: slot.id,
                  timeSlot: slot,
                  slotName: slot.nameSlot || `${formatTime(slot.startAt)} - ${formatTime(slot.endAt)}`,
                  slotTime: `${formatTime(slot.startAt)} - ${formatTime(slot.endAt)}`
                };
                
                // Add each day as a column
                daysOfWeek.forEach(day => {
                  const dayKey = day.value;
                  const availableStudents = getAvailableStudents(slot, dayKey);
                  row[dayKey] = availableStudents;
                });
                
                return row;
              });
              
              // Define columns for DataTable
              const columns = [
                {
                  key: 'timeSlot',
                  title: 'Time Slot',
                  render: (row) => (
                    <div className={styles.slotTimeCell}>
                      <div className={styles.slotTimeLabel}>
                        {row.slotName}
                      </div>
                      <div className={styles.slotTimeRange}>
                        {row.slotTime}
                      </div>
                    </div>
                  )
                },
                ...daysOfWeek.map(day => ({
                  key: day.value,
                  title: day.name,
                  render: (row) => {
                    const availableStudents = row[day.value] || [];
                    return (
                      <div className={styles.calendarCell}>
                        {availableStudents.length > 0 ? (
                          <div className={styles.studentsList}>
                            {availableStudents.map((student, idx) => (
                              <div key={idx} className={styles.studentBadge}>
                                {student.name || student.rollNumber || `Student ${student.id}`}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptyCell}>-</div>
                        )}
                      </div>
                    );
                  }
                }))
              ];
              
              return (
                <div className={styles.membersCalendarView}>
                  <DataTable
                    columns={columns}
                    data={tableData}
                    loading={loading}
                    emptyMessage="No free time slots available"
                    showIndex={false}
                  />
                </div>
              );
            })()}
            
            {/* Suggested Times Section - Only show when not finalized */}
            {!isFinalized && suggestedTimes.length > 0 && (
              <div className={styles.suggestedTimesSection}>
                <h3>Suggested Meeting Times</h3>
                <div className={styles.suggestedTimesList}>
                  {suggestedTimes.map((suggestion, index) => {
                    const isSelected = selectedSlot?.id === suggestion.slot?.id && selectedDay === suggestion.day;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSuggestedTimeClick(suggestion)}
                        className={`${styles.suggestedTimeButton} ${isSelected ? styles.suggestedTimeSelected : ''}`}
                      >
                        <div className={styles.suggestedTimeRow1}>
                          <span className={styles.suggestedDay}>{suggestion.dayName}</span>
                          <span className={styles.suggestedTime}>{suggestion.time}</span>
                        </div>
                        <div className={styles.suggestedTimeRow2}>
                          <span className={styles.suggestedSlotCount}>{suggestion.availableCount} members, {suggestion.hours} hours</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Meeting Finalization/Update Form - Only show when not finalized */}
          {!isFinalized && (
            <div className={styles.meetingSection}>
              <h2>Confirm Meeting Schedule</h2>
              
              <div className={styles.meetingForm}>
                <div className={styles.formGroup}>
                  <label>Select Day</label>
                  <select
                    value={meetingData.day}
                    onChange={(e) => updateMeetingData('day', e.target.value)}
                    className={styles.daySelect}
                  >
                    <option value="">-- Select Day --</option>
                    {daysOfWeek.map(day => (
                      <option key={day.id} value={day.value}>{day.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={meetingData.time}
                    onChange={(e) => updateMeetingData('time', e.target.value)}
                    className={styles.timeInput}
                    placeholder="e.g: 14:00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={meetingData.endTime}
                    onChange={(e) => updateMeetingData('endTime', e.target.value)}
                    className={styles.timeInput}
                    placeholder="e.g: 15:00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Google Meet Link</label>
                  <input
                    type="url"
                    value={meetingData.meetingLink}
                    onChange={(e) => updateMeetingData('meetingLink', e.target.value)}
                    className={styles.meetingLinkInput}
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={handleFinalizeMeeting}
                    className={styles.finalizeBtn}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Confirm Meeting Schedule'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}