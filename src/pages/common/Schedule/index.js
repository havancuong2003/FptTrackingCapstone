import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import axiosClient from '../../../utils/axiosClient';

export default function Schedule() {
  // Lấy groupId từ localStorage (như trong auth.js)
  const getGroupId = () => {
    try {
      const studentGroupId = localStorage.getItem('student_group_id');
      if (studentGroupId) {
        return studentGroupId;
      }
      // Fallback nếu không có trong localStorage
      return '1';
    } catch (error) {
      console.error('Error getting groupId from localStorage:', error);
      return '1';
    }
  };
  
  const groupId = getGroupId();
  
  // Lấy thông tin user từ localStorage
  const getCurrentUser = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        return JSON.parse(authUser);
      }
      // Mock user nếu không có trong localStorage
      return {
        id: 1,
        name: 'Nguyễn Văn A',
        role: 'student'
      };
    } catch (error) {
      console.error('Error parsing auth_user:', error);
      // Mock user fallback
      return {
        id: 1,
        name: 'Nguyễn Văn A',
        role: 'student'
      };
    }
  };
  
  const currentUser = getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState(null);
  const [freeTimeSlots, setFreeTimeSlots] = useState({}); // Object với key là day value
  const [activeTab, setActiveTab] = useState('monday'); // Tab đang active
  // Bỏ timeInterval - không cần nữa
  const [isFinalized, setIsFinalized] = useState(false);
  const [meetingSchedule, setMeetingSchedule] = useState(null);
  const [finalMeeting, setFinalMeeting] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberSchedules, setMemberSchedules] = useState({});
  const [mergedSchedule, setMergedSchedule] = useState({});
  const [isSupervisor, setIsSupervisor] = useState(false);
  // Bỏ useTimeInput - chỉ sử dụng text input với format HH:MM

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

  // Bỏ generateTimeSlots - không cần nữa vì user tự nhập giờ

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  // Kiểm tra role của user
  useEffect(() => {
    if (currentUser) {
      setIsSupervisor(currentUser.role === 'supervisor' || currentUser.role === 'Supervisor');
    }
  }, [currentUser]);

  // Check if meeting schedule exists
  const checkMeetingSchedule = async () => {
    try {
      const response = await axiosClient.get(`/Student/Meeting/schedule/finalize/getById/${groupId}`);
      if (response.data.status === 200) {
        setMeetingSchedule(response.data.data);
        setIsFinalized(response.data.message !== 'Meeting not found.');
        return response.data.message === 'Meeting not found.';
      }
    } catch (error) {
      console.error('Error checking meeting schedule:', error);
      setIsFinalized(false);
      return false;
    }
  };

  const loadGroupData = async () => {
    setLoading(true);
    try {
      // Check if meeting schedule already exists
      const hasSchedule = await checkMeetingSchedule();
        
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
            email: student.email, // Sử dụng email thật từ API
            role: student.role
          }))
        };
        
        setGroup(formattedGroup);
        setMembers(formattedGroup.members);
        
      } else {
        console.error('Error fetching group data:', response.data.message);
        setGroup({ id: groupId, name: 'Group ' + groupId });
      }
      
      // Fetch existing free time slots
      await fetchStudentFreeTimeSlots();
    } catch (error) {
      console.error('Error loading group data:', error);
      // Fallback nếu API call thất bại
      setGroup({ id: groupId, name: 'Group ' + groupId });
    } finally {
      setLoading(false);
    }
  };

  // Fetch student free time slots
  const fetchStudentFreeTimeSlots = async () => {
    try {
      const freeTimeResponse = await axiosClient.get(`/Student/Meeting/groups/${groupId}/schedule/free-time`);
      if (freeTimeResponse.data && freeTimeResponse.data.status === 200) {
        const apiData = freeTimeResponse.data.data;
          
        // Tìm thời gian rảnh của user hiện tại
        const currentStudentId = parseInt(localStorage.getItem('student_id')) || parseInt(currentUser?.id);
        const currentStudentData = apiData.find(item => item.studentId === currentStudentId);
        
        if (currentStudentData && currentStudentData.freeTimeSlots.length > 0) {
          // Convert backend data to frontend format - object với key là day value
          const formattedSlots = {};
          currentStudentData.freeTimeSlots.forEach((item) => {
            const dayKey = item.dayOfWeek.toLowerCase();
            formattedSlots[dayKey] = item.timeSlots.map((time, timeIndex) => ({
              id: `time-${timeIndex + 1}`,
              time: time,
              isValid: true
            }));
          });
          setFreeTimeSlots(formattedSlots);
        }
        
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
        
        // Calculate merged schedule (common free times across all members)
        calculateMergedSchedule(memberSchedulesData);
      }
    } catch (error) {
      console.error('Error fetching student free time slots:', error);
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

  // Validate time format - bắt buộc format HH:MM
  const validateTimeFormat = (time) => {
    if (!time) return false;
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(time);
  };

  // Thêm giờ rảnh cho ngày được chọn
  const addTimeSlot = (dayValue) => {
    const newTimeSlot = {
      id: Date.now(),
      time: '',
      isValid: false
    };
    setFreeTimeSlots(prev => ({
      ...prev,
      [dayValue]: [...(prev[dayValue] || []), newTimeSlot]
    }));
  };

  // Xóa giờ rảnh
  const removeTimeSlot = (dayValue, timeSlotId) => {
    setFreeTimeSlots(prev => ({
      ...prev,
      [dayValue]: (prev[dayValue] || []).filter(slot => slot.id !== timeSlotId)
    }));
  };

  // Cập nhật giờ rảnh với validation
  const updateTimeSlot = (dayValue, timeSlotId, value) => {
    setFreeTimeSlots(prev => ({
      ...prev,
      [dayValue]: (prev[dayValue] || []).map(slot => 
        slot.id === timeSlotId 
          ? { 
              ...slot, 
              time: value,
              isValid: validateTimeFormat(value)
            }
          : slot
      )
    }));
  };

  // Lấy số lượng giờ rảnh đã nhập cho một ngày
  const getTimeSlotCount = (dayValue) => {
    return (freeTimeSlots[dayValue] || []).filter(slot => slot.time && slot.isValid).length;
  };

  // Save free time slots
  const handleSaveFreeTimeSlots = async () => {
    // Kiểm tra có time slot nào chưa chọn giờ
    let hasEmptyTime = false;
    let emptyTimeMessages = [];
    
    Object.keys(freeTimeSlots).forEach(dayValue => {
      const slots = freeTimeSlots[dayValue] || [];
      const emptySlots = slots.filter(slot => !slot.time || slot.time === '');
      if (emptySlots.length > 0) {
        hasEmptyTime = true;
        const dayName = daysOfWeek.find(d => d.value === dayValue)?.name || dayValue;
        emptyTimeMessages.push(`${dayName}: No free time selected`);
      }
    });
    
    if (hasEmptyTime) {
      alert('Please check again:\n' + emptyTimeMessages.join('\n') + '\n\nPlease select time for all added free time slots.');
      return;
    }

    // Kiểm tra có ít nhất một ngày có giờ rảnh hợp lệ
    const daysWithSlots = Object.keys(freeTimeSlots).filter(day => {
      const slots = freeTimeSlots[day] || [];
      return slots.some(slot => slot.time && slot.isValid);
    });

    if (daysWithSlots.length === 0) {
      alert('Please enter at least one free time slot for a day of the week');
      return;
    }
    
    // Validate tất cả time slots (nếu có format không hợp lệ)
    let hasInvalidSlot = false;
    let invalidMessages = [];
    
    Object.keys(freeTimeSlots).forEach(dayValue => {
      const slots = freeTimeSlots[dayValue] || [];
      const invalidSlots = slots.filter(slot => slot.time && !slot.isValid);
      if (invalidSlots.length > 0) {
        hasInvalidSlot = true;
        const dayName = daysOfWeek.find(d => d.value === dayValue)?.name || dayValue;
        invalidMessages.push(`${dayName}: ${invalidSlots.length} free time slot(s) with invalid format`);
      }
    });
    
    if (hasInvalidSlot) {
      alert('Please check again:\n' + invalidMessages.join('\n') + '\n\nTime format must be HH:MM (e.g: 09:00, 17:30)');
      return;
    }

    setLoading(true);
    try {
      const studentId = parseInt(localStorage.getItem('student_id')) || parseInt(currentUser?.id);
      const groupIdInt = parseInt(groupId);
      
      // Format data theo yêu cầu backend
      const formattedData = {
        freeTimeSlots: daysWithSlots.map(dayValue => ({
          studentId: studentId,
          groupId: groupIdInt,
          dayOfWeek: dayValue.charAt(0).toUpperCase() + dayValue.slice(1),
          timeSlots: [{
            dayOfWeek: dayValue.charAt(0).toUpperCase() + dayValue.slice(1),
            timeSlots: freeTimeSlots[dayValue]
              .filter(slot => slot.time && slot.isValid)
              .map(slot => slot.time)
          }]
        }))
      };

      const response = await axiosClient.post(`/Student/Meeting/groups/${groupId}/schedule/free-time`, formattedData);
      
      if (response.data && response.data.status === 200) {
        // Reload lại dữ liệu để cập nhật calendar view
        await fetchStudentFreeTimeSlots();
        alert('Free time slots saved successfully!');
      } else {
        alert('Error occurred while saving free time slots');
      }
    } catch (error) {
      console.error('Error saving free time slots:', error);
      alert('Error occurred while saving free time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSchedule = async () => {
    setLoading(true);
    try {
      // Get selected time and day from form
      const selectedDay = document.querySelector('select[name="dayOfWeek"]')?.value;
      const selectedTime = document.querySelector('input[name="time"]')?.value;
      const meetingLink = document.querySelector('input[name="meetingLink"]')?.value || '';
      
      if (!selectedDay || !selectedTime) {
        alert('Please select meeting day and time');
        return;
      }
      
      const meetingData = {
        id: meetingSchedule?.id || null, // Use existing ID if updating
        isActive: true,
        meetingLink: meetingLink,
        time: selectedTime,
        dayOfWeek: selectedDay.toLowerCase(),
        createdByName: currentUser.name
      };
      
      // API call để tạo hoặc cập nhật lịch họp
      const response = await axiosClient.post(`/Student/Meeting/schedule/finalize/update`, meetingData);
      
      if (response.data) {
        setMeetingSchedule(response.data);
        setIsFinalized(true);
        alert('Meeting schedule confirmed successfully!');
      }
    } catch (error) {
      console.error('Error finalizing schedule:', error);
      alert('Error occurred while confirming meeting schedule');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !group) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!group) {
    return <div className={styles.error}>Group not found</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Group Meeting Schedule</h1>     {isSupervisor && (
        <div className={styles.headerControls}>
     
            <div className={styles.supervisorBadge}>
              Supervisor: {currentUser.name}
            </div>
          
        </div>)}
      </div>

      {!isFinalized ? (
        <div className={styles.notFinalized}>
          Meeting schedule has not been confirmed. Please select your free time.
        </div>
      ) : (
        <div className={styles.finalizeBanner}>
          <div className={styles.finalized}>
          <div className={styles.finalizedContent}>
              <h3>Meeting Schedule Confirmed!</h3>
              <p>Time: {meetingSchedule?.dayOfWeek ? meetingSchedule.dayOfWeek.charAt(0).toUpperCase() + meetingSchedule.dayOfWeek.slice(1) : ''} - {meetingSchedule?.time}</p>
              <p>Created Date: {new Date(meetingSchedule?.createAt).toLocaleDateString('en-US')}</p>
              {meetingSchedule?.meetingLink && (
                <a 
                  href={meetingSchedule?.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.meetingLinkButton}
                >
                  Join Meeting
                </a>
              )}
            </div>
          </div>
        </div>
        )}

      {!isFinalized && (
        <div className={styles.instruction}>
          <span>Select day tab and enter free time (HH:MM) for each day</span>
        </div>
      )}

      {/* Free Time Slots Management - Tab Based UI */}
      {!isFinalized && (
        <div className={styles.freeTimeSection}>
          <h2>Your Free Time</h2>
          
          {/* Tab Navigation */}
          <div className={styles.tabNavigation}>
            {daysOfWeek.map(day => {
              const count = getTimeSlotCount(day.value);
              return (
                <button
                  key={day.id}
                  onClick={() => setActiveTab(day.value)}
                  className={`${styles.tabButton} ${activeTab === day.value ? styles.tabActive : ''}`}
                >
                  <span className={styles.tabLabel}>{day.name}</span>
                  {count > 0 && (
                    <span className={styles.tabBadge}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            <div className={styles.timeSlotPanel}>
              <div className={styles.timeSlotHeader}>
                <label className={styles.timeSlotLabel}>
                  Free time for {daysOfWeek.find(d => d.value === activeTab)?.name} (HH:MM):
                </label>
                <button
                  onClick={() => addTimeSlot(activeTab)}
                  className={styles.addTimeBtn}
                >
                  + Add Time
                </button>
              </div>
              <div className={styles.timeSlotsContainer}>
                {(freeTimeSlots[activeTab] || []).map(timeSlot => (
                  <div key={timeSlot.id} className={styles.timeSlotItem}>
                    <input
                      type="time"
                      value={timeSlot.time}
                      onChange={(e) => updateTimeSlot(activeTab, timeSlot.id, e.target.value)}
                      className={`${styles.timeInput} ${timeSlot.time && !timeSlot.isValid ? styles.invalid : ''}`}
                    />
                    <button
                      onClick={() => removeTimeSlot(activeTab, timeSlot.id)}
                      className={styles.removeTimeBtn}
                      title="Remove this time"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {(freeTimeSlots[activeTab] || []).length === 0 && (
                  <div className={styles.emptyTimeSlot}>
                    No free time slots yet. Click "+ Add Time" to add.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.freeTimeActions}>
            <button
              onClick={handleSaveFreeTimeSlots}
              className={styles.saveSlotsBtn}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Free Time'}
            </button>
          </div>
        </div>
      )}

        <div className={styles.groupOverview}>
          <h2>Group Free Time Schedule</h2>
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
        </div>

      {isSupervisor && (
            <div className={styles.finalizeSection}>
          <h3>Confirm Meeting Schedule</h3>
              <div className={styles.finalizeForm}>
            <input 
              type="date" 
              className={styles.dateSelect}
              placeholder="Select Date"
            />
                <select className={styles.timeSelect}>
                  <option value="">Select Time</option>
                  <option value="08:00">08:00</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
            <button 
              onClick={handleFinalizeSchedule}
                  className={styles.finalizeButton}
              disabled={loading}
            >
              {loading ? 'Confirming...' : 'Confirm Meeting Schedule'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}