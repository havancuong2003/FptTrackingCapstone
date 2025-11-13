import React from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import axiosClient from '../../../utils/axiosClient';
import { sendMeetingNotification } from '../../../api/email';
import { getStudentFreeTimeSlotsNew } from '../../../api/schedule';

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
      const response = await axiosClient.get('/Mentor/getGroups');
      
      if (response.data.status === 200) {
        const groupsData = response.data.data || [];
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
      const response = await axiosClient.get(`/Staff/capstone-groups/${groupId}`);
      if (response.data.status === 200) {
        const groupDetail = response.data.data;
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
        const scheduleResponse = await axiosClient.get(`/Student/Meeting/schedule/finalize/getById/${groupId}`);
        if (scheduleResponse.data.status === 200 && scheduleResponse.data.data.isActive) {
          setMeetingSchedule(scheduleResponse.data.data);
          setIsFinalized(scheduleResponse.data.data.isActive);  
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
    
    // Map Vietnamese day names to English values
    const dayNameMap = {
      'thứ hai': 'monday',
      'thứ ba': 'tuesday',
      'thứ tư': 'wednesday',
      'thứ năm': 'thursday',
      'thứ sáu': 'friday',
      'thứ bảy': 'saturday',
      'chủ nhật': 'sunday'
    };
    
    daysOfWeek.forEach(day => {
      const dayKey = day.value;
      const allSlots = new Map(); // Use Map to store unique slots by id
      
      // Collect all unique slots for this day from all members (union)
      studentIds.forEach(studentId => {
        const memberSchedule = memberSchedulesData[studentId] || {};
        // Check both English and Vietnamese day names
        Object.keys(memberSchedule).forEach(memberDayKey => {
          const normalizedKey = dayNameMap[memberDayKey.toLowerCase()] || memberDayKey.toLowerCase();
          if (normalizedKey === dayKey) {
            const daySlots = memberSchedule[memberDayKey] || [];
            daySlots.forEach(slot => {
              // slot is now an object with id, nameSlot, startAt, endAt
              if (slot && slot.id) {
                allSlots.set(slot.id, slot);
              }
            });
          }
        });
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

  // Calculate suggested meeting times
  const calculateSuggestedTimes = (mergedScheduleData) => {
    const suggestions = [];
    
    daysOfWeek.forEach(day => {
      const dayKey = day.value;
      const slots = mergedScheduleData[dayKey] || [];
      
      if (slots.length > 0) {
        // Suggest the first available slot for each day
        const firstSlot = slots[0];
        suggestions.push({
          day: day.value,
          dayName: day.name,
          time: firstSlot.startAt ? `${firstSlot.startAt} - ${firstSlot.endAt}` : firstSlot,
          slotCount: slots.length,
          slot: firstSlot
        });
      }
    });
    
    // Sort by day of week
    const dayOrder = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
    suggestions.sort((a, b) => dayOrder[a.day] - dayOrder[b.day]);
    
    setSuggestedTimes(suggestions);
    return suggestions;
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
              // dayData.dayOfWeek có thể là "Thứ hai", "Thứ ba", etc.
              const dayKey = dayData.dayOfWeek.toLowerCase();
              // timeSlots là mảng các slot object với id, nameSlot, startAt, endAt
              schedule[dayKey] = dayData.timeSlots || [];
            });
            memberSchedulesData[studentData.studentId] = schedule;
          }
        });
        setMemberSchedules(memberSchedulesData);
        
        // Calculate merged schedule
        const merged = calculateMergedSchedule(memberSchedulesData);
        
        // Calculate suggested times
        calculateSuggestedTimes(merged);
        
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
    //  const response = await axiosClient.post(`/Student/Meeting/schedule/finalize/update`, meetingData);
      const response = await axiosClient.post(`/Student/Meeting/groups/${selectedGroup}/schedule/finalize`, meetingDataAPI);
      if (response.data) {
        // Map response data to meetingSchedule structure
        const responseData = response.data.data || response.data;
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

          {/* Student Free Time Slots - Merged Calendar View */}
          <div className={styles.freeTimeSection}>
            <h2>Members' Free Time</h2>
            <div className={styles.calendarView}>
              <div className={styles.calendarHeader}>
                <div className={styles.calendarDayCol}>Day</div>
                {daysOfWeek.map(day => (
                  <div key={day.id} className={styles.calendarDayCol}>
                    {day.name}
                  </div>
                ))}
              </div>
              <div className={styles.calendarBody}>
                <div className={styles.calendarRow}>
                  <div className={styles.calendarDayLabel}>Common Free Time</div>
                  {daysOfWeek.map(day => {
                    const dayKey = day.value;
                    const timeSlots = mergedSchedule[dayKey] || [];
                    
                    return (
                      <div key={day.id} className={styles.calendarDayCell}>
                        {timeSlots.length > 0 ? (
                          <div className={styles.timeSlotsList}>
                            {timeSlots.map((slot, index) => (
                              <div key={slot.id || index} className={styles.timeSlotBadge}>
                                {slot.nameSlot ? `${slot.nameSlot}: ${slot.startAt} - ${slot.endAt}` : slot}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptySlot}>-</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
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
                        <span className={styles.suggestedDay}>{suggestion.dayName}</span>
                        <span className={styles.suggestedTime}>{suggestion.time}</span>
                        <span className={styles.suggestedSlotCount}>({suggestion.slotCount} free hours)</span>
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