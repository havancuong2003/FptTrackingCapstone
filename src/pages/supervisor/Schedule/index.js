import React from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import axiosClient from '../../../utils/axiosClient';
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
    meetingLink: ''
  });

  // Days of the week
  const daysOfWeek = [
    { id: 1, name: 'Thứ 2', value: 'monday' },
    { id: 2, name: 'Thứ 3', value: 'tuesday' },
    { id: 3, name: 'Thứ 4', value: 'wednesday' },
    { id: 4, name: 'Thứ 5', value: 'thursday' },
    { id: 5, name: 'Thứ 6', value: 'friday' },
    { id: 6, name: 'Thứ 7', value: 'saturday' },
    { id: 7, name: 'Chủ nhật', value: 'sunday' }
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
        console.log("scheduleResponse" , scheduleResponse.data.data.isActive);
        if (scheduleResponse.data.status === 200 && scheduleResponse.data.data.isActive) {
          setMeetingSchedule(scheduleResponse.data.data);
          console.log(scheduleResponse.data);
          setIsFinalized(scheduleResponse.data.data.isActive);
         // setIsFinalized(false);
        }
        else{
          setIsFinalized(false);
        }
      } catch (error) {
        console.error('No existing schedule found');
      }
    } catch (error) {
      console.error('Error loading group data:', error);
      setGroup({ id: groupId, name: 'Group ' + groupId });
    } finally {
      setLoading(false);
    }
  };

  // Calculate merged schedule (common free times across all members)
  const calculateMergedSchedule = (memberSchedulesData) => {
    const merged = {};
    const studentIds = Object.keys(memberSchedulesData);
    
    if (studentIds.length === 0) {
      setMergedSchedule({});
      return {};
    }
    
    daysOfWeek.forEach(day => {
      const dayKey = day.value;
      const allTimeSlots = new Set();
      
      // Collect all unique time slots for this day from all members
      studentIds.forEach(studentId => {
        const memberSchedule = memberSchedulesData[studentId] || {};
        const daySlots = memberSchedule[dayKey] || [];
        daySlots.forEach(slot => allTimeSlots.add(slot));
      });
      
      // Calculate intersection: only time slots that ALL members have
      let commonSlots = [];
      if (studentIds.length > 0) {
        const firstMemberSlots = new Set(memberSchedulesData[studentIds[0]]?.[dayKey] || []);
        
        // Find slots that exist in all members' schedules
        allTimeSlots.forEach(slot => {
          let isCommon = true;
          for (let i = 0; i < studentIds.length; i++) {
            const memberSchedule = memberSchedulesData[studentIds[i]] || {};
            const daySlots = memberSchedule[dayKey] || [];
            if (!daySlots.includes(slot)) {
              isCommon = false;
              break;
            }
          }
          if (isCommon) {
            commonSlots.push(slot);
          }
        });
      }
      
      // Sort time slots from smallest to largest
      commonSlots.sort((a, b) => {
        const [h1, m1] = a.split(':').map(Number);
        const [h2, m2] = b.split(':').map(Number);
        return h1 * 60 + m1 - (h2 * 60 + m2);
      });
      
      merged[dayKey] = commonSlots;
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
        suggestions.push({
          day: day.value,
          dayName: day.name,
          time: slots[0],
          slotCount: slots.length
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
      const response = await axiosClient.get(`/Student/Meeting/groups/${groupId}/schedule/free-time`);

      if (response.data && response.data.status === 200) {
        const apiData = response.data.data;
        
        // Lưu dữ liệu của tất cả thành viên để hiển thị
        const memberSchedulesData = {};
        apiData.forEach(studentData => {
          if (studentData.freeTimeSlots.length > 0) {
            const schedule = {};
            studentData.freeTimeSlots.forEach(dayData => {
              schedule[dayData.dayOfWeek.toLowerCase()] = dayData.timeSlots;
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
      console.error('No student free time slots found');
      return {};
    }
  };

  // Finalize/Update meeting schedule
  const handleFinalizeMeeting = async () => {
    if (!meetingData.day || !meetingData.time || !meetingData.meetingLink) {
      alert('Vui lòng điền đầy đủ thông tin lịch họp');
      return;
    }

    setLoading(true);
    try {
      const meetingScheduleData = {
        id: meetingSchedule?.id || null, // Use existing ID if updating
        isActive: true,
        meetingLink: meetingData.meetingLink,
        time: meetingData.time,
        dayOfWeek: meetingData.day.toLowerCase(),
      };
      const meetingDataAPI ={
        finalMeeting: {
          day: meetingScheduleData.dayOfWeek,
          time: meetingScheduleData.time,
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
              'monday': 'Thứ 2',
              'tuesday': 'Thứ 3', 
              'wednesday': 'Thứ 4',
              'thursday': 'Thứ 5',
              'friday': 'Thứ 6',
              'saturday': 'Thứ 7',
              'sunday': 'Chủ nhật'
            };
            
            const meetingTime = `${dayNames[meetingData.day.toLowerCase()]} - ${meetingData.time}`;
            
            await sendMeetingNotification({
              recipients: studentEmails,
              subject: `[${group.groupName || 'Capstone Project'}] Thông báo lịch họp nhóm`,
              meetingTime: meetingTime,
              meetingLink: meetingData.meetingLink,
              message: `Giảng viên ${currentUser.name} đã xác nhận lịch họp nhóm. Vui lòng tham gia đúng giờ.`
            });
            
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Không hiển thị lỗi email cho user, chỉ log
        }
        
        alert(isFinalized ? 'Đã cập nhật lịch họp thành công!' : 'Đã xác nhận lịch họp thành công!');
      } else {
        alert('Có lỗi xảy ra khi xác nhận lịch họp');
      }
    } catch (error) {
      console.error('Error finalizing meeting:', error);
      alert('Có lỗi xảy ra khi xác nhận lịch họp');
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
    setMeetingData({
      day: suggestion.day,
      time: suggestion.time,
      meetingLink: meetingData.meetingLink || ''
    });
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
        <h1>Lịch họp Nhóm</h1>
        <div className={styles.headerControls}>
          <div className={styles.supervisorBadge}>
            Giảng viên: {currentUser.name}
          </div>
        </div>
      </div>

      {/* Group Selection - Luôn hiển thị */}
      <div className={styles.section}>
        <h2>Chọn nhóm</h2>
        <div className={styles.groupSelector}>
          <select
            value={selectedGroup}
            onChange={(e) => handleGroupSelect(e.target.value)}
            className={styles.groupSelect}
            disabled={loading}
          >
            <option value="">Chọn nhóm</option>
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
                  <h3>Lịch họp đã được xác nhận</h3>
                  <div className={styles.warningBadge}>
                    Lịch họp đã được xác nhận và không thể chỉnh sửa
                  </div>
                </div>
                <div className={styles.meetingInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Thời gian:</span>
                    <span className={styles.infoValue}>
                      {(() => {
                        const dayNames = {
                          'monday': 'Thứ 2',
                          'tuesday': 'Thứ 3', 
                          'wednesday': 'Thứ 4',
                          'thursday': 'Thứ 5',
                          'friday': 'Thứ 6',
                          'saturday': 'Thứ 7',
                          'sunday': 'Chủ nhật'
                        };
                        const dayName = dayNames[meetingSchedule.dayOfWeek?.toLowerCase()] || meetingSchedule.dayOfWeek || '';
                        return `${dayName} - ${meetingSchedule.time || ''}`;
                      })()}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Ngày tạo:</span>
                    <span className={styles.infoValue}>
                      {meetingSchedule.createAt 
                        ? new Date(meetingSchedule.createAt).toLocaleDateString('vi-VN')
                        : new Date().toLocaleDateString('vi-VN')
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
                        Click để tham gia
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.notFinalized}>
                <div className={styles.warningBox}>
                  <h3>Lưu ý quan trọng</h3>
                  <p>Lịch họp chưa được xác nhận. Sau khi xác nhận, bạn sẽ không thể thay đổi lịch họp này nữa.</p>
                  <p className={styles.warningText}>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận!</p>
                </div>
              </div>
            )}
          </div>

          <div className={styles.instruction}>
            <span>Xem lịch rảnh của các thành viên và xác nhận lịch họp chung</span>
          </div>

          {/* Student Free Time Slots - Merged Calendar View */}
          <div className={styles.freeTimeSection}>
            <h2>Lịch rảnh của các thành viên</h2>
            <div className={styles.calendarView}>
              <div className={styles.calendarHeader}>
                <div className={styles.calendarDayCol}>Thứ</div>
                {daysOfWeek.map(day => (
                  <div key={day.id} className={styles.calendarDayCol}>
                    {day.name}
                  </div>
                ))}
              </div>
              <div className={styles.calendarBody}>
                <div className={styles.calendarRow}>
                  <div className={styles.calendarDayLabel}>Giờ rảnh chung</div>
                  {daysOfWeek.map(day => {
                    const dayKey = day.value;
                    const timeSlots = mergedSchedule[dayKey] || [];
                    
                    return (
                      <div key={day.id} className={styles.calendarDayCell}>
                        {timeSlots.length > 0 ? (
                          <div className={styles.timeSlotsList}>
                            {timeSlots.map((slot, index) => (
                              <div key={index} className={styles.timeSlotBadge}>{slot}</div>
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
                <h3>Đề xuất thời gian họp</h3>
                <div className={styles.suggestedTimesList}>
                  {suggestedTimes.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedTimeClick(suggestion)}
                      className={styles.suggestedTimeButton}
                    >
                      <span className={styles.suggestedDay}>{suggestion.dayName}</span>
                      <span className={styles.suggestedTime}>{suggestion.time}</span>
                      <span className={styles.suggestedSlotCount}>({suggestion.slotCount} giờ rảnh)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Meeting Finalization/Update Form - Only show when not finalized */}
          {!isFinalized && (
            <div className={styles.meetingSection}>
              <h2>Xác nhận lịch họp</h2>
              
              <div className={styles.meetingForm}>
                <div className={styles.formGroup}>
                  <label>Chọn thứ</label>
                  <select
                    value={meetingData.day}
                    onChange={(e) => updateMeetingData('day', e.target.value)}
                    className={styles.daySelect}
                  >
                    <option value="">-- Chọn thứ --</option>
                    {daysOfWeek.map(day => (
                      <option key={day.id} value={day.value}>{day.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={meetingData.time}
                    onChange={(e) => updateMeetingData('time', e.target.value)}
                    className={styles.timeInput}
                    placeholder="VD: 14:00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Link Google Meet</label>
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
                    {loading ? 'Đang xử lý...' : 'Xác nhận lịch họp'}
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