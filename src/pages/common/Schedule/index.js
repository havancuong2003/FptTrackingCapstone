import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import axiosClient from '../../../utils/axiosClient';
import { getStudentFreeTimeSlotsNew } from '../../../api/schedule';
import { getCampusById } from '../../../api/campus';
import { getCampusId } from '../../../auth/auth';
import Checkbox from '../../../components/Checkbox/Checkbox';

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
  const [freeTimeSlots, setFreeTimeSlots] = useState({}); // Object với key là day value, value là array các slot đã chọn
  const [activeTab, setActiveTab] = useState('monday'); // Tab đang active
  const [availableSlots, setAvailableSlots] = useState([]); // Tất cả slots từ campus
  const [isFinalized, setIsFinalized] = useState(false);
  const [meetingSchedule, setMeetingSchedule] = useState(null);
  const [finalMeeting, setFinalMeeting] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberSchedules, setMemberSchedules] = useState({});
  const [mergedSchedule, setMergedSchedule] = useState({});
  const [isSupervisor, setIsSupervisor] = useState(false);

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

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  // Load slots từ campus
  useEffect(() => {
    loadCampusSlots();
  }, []);

  // Load campus slots
  const loadCampusSlots = async () => {
    try {
      const campusId = getCampusId();
      if (!campusId) {
        console.error('Không tìm thấy campusId trong localStorage');
        return;
      }
      
      const response = await getCampusById(campusId);
      if (response.status === 200 && response.data && response.data.slots) {
        setAvailableSlots(response.data.slots || []);
      }
    } catch (error) {
      console.error('Error loading campus slots:', error);
    }
  };

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
        if(response.data.data.isActive) {
          setIsFinalized(true);
        } else {
          setIsFinalized(false);
        }
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
      const freeTimeResponse = await getStudentFreeTimeSlotsNew(groupId);
      if (freeTimeResponse && freeTimeResponse.status === 200 && freeTimeResponse.data) {
        const apiData = freeTimeResponse.data.students || [];
          
        // Tìm thời gian rảnh của user hiện tại
        const currentStudentId = parseInt(localStorage.getItem('student_id')) || parseInt(currentUser?.id);
        const currentStudentData = apiData.find(item => item.studentId === currentStudentId);
        
        if (currentStudentData && currentStudentData.freeTimeSlots && currentStudentData.freeTimeSlots.length > 0) {
          // Convert backend data to frontend format - object với key là day value
          const formattedSlots = {};
          currentStudentData.freeTimeSlots.forEach((item) => {
            const dayKey = item.dayOfWeek.toLowerCase();
            // timeSlots là mảng các slot object với id, nameSlot, startAt, endAt
            formattedSlots[dayKey] = (item.timeSlots || []).map((slot, slotIndex) => ({
              id: slot.id || `slot-${slotIndex + 1}`,
              nameSlot: slot.nameSlot || '',
              startAt: slot.startAt || '',
              endAt: slot.endAt || ''
            }));
          });
          setFreeTimeSlots(formattedSlots);
        }
        
        // Lưu dữ liệu của tất cả thành viên để hiển thị
        const memberSchedulesData = {};
        apiData.forEach(studentData => {
          if (studentData.freeTimeSlots && studentData.freeTimeSlots.length > 0) {
            const schedule = {};
            studentData.freeTimeSlots.forEach(dayData => {
              schedule[dayData.dayOfWeek.toLowerCase()] = dayData.timeSlots || [];
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


  // Lấy số lượng giờ rảnh đã chọn cho một ngày
  const getTimeSlotCount = (dayValue) => {
    return (freeTimeSlots[dayValue] || []).length;
  };

  // Toggle slot selection cho một ngày
  const toggleSlotSelection = (dayValue, slot) => {
    setFreeTimeSlots(prev => {
      const daySlots = prev[dayValue] || [];
      const slotIndex = daySlots.findIndex(s => s.id === slot.id);
      
      if (slotIndex >= 0) {
        // Đã chọn rồi -> bỏ chọn
        return {
          ...prev,
          [dayValue]: daySlots.filter(s => s.id !== slot.id)
        };
      } else {
        // Chưa chọn -> thêm vào
        return {
          ...prev,
          [dayValue]: [...daySlots, slot]
        };
      }
    });
  };

  // Kiểm tra slot có được chọn cho một ngày không
  const isSlotSelected = (dayValue, slotId) => {
    const daySlots = freeTimeSlots[dayValue] || [];
    return daySlots.some(s => s.id === slotId);
  };


  // Save free time slots
  const handleSaveFreeTimeSlots = async () => {
    // Kiểm tra có ít nhất một ngày có slot được chọn
    const daysWithSlots = Object.keys(freeTimeSlots).filter(day => {
      const slots = freeTimeSlots[day] || [];
      return slots.length > 0;
    });

    if (daysWithSlots.length === 0) {
      alert('Vui lòng chọn ít nhất một slot cho một ngày trong tuần');
      return;
    }

    setLoading(true);
    try {
      // Format data theo yêu cầu backend
      // slots: mảng các id của slots đã chọn
      // dayOfWeek: tên ngày trong tuần
      const formattedData = daysWithSlots.map(dayValue => ({
        slots: freeTimeSlots[dayValue].map(slot => slot.id),
        dayOfWeek: dayValue.charAt(0).toUpperCase() + dayValue.slice(1)
      }));

      const response = await axiosClient.post(`/Student/Meeting/groups/${groupId}/schedule/free-time`, formattedData);
      
      if (response.data && response.data.status === 200) {
        // Reload lại dữ liệu để cập nhật calendar view
        await fetchStudentFreeTimeSlots();
        alert('Đã lưu thời gian rảnh thành công!');
      } else {
        alert('Có lỗi xảy ra khi lưu thời gian rảnh');
      }
    } catch (error) {
      console.error('Error saving free time slots:', error);
      alert('Có lỗi xảy ra khi lưu thời gian rảnh');
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
          <span>Chọn tab ngày và chọn các slot thời gian rảnh cho mỗi ngày</span>
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
                  Chọn thời gian rảnh cho {daysOfWeek.find(d => d.value === activeTab)?.name}:
                </label>
              </div>
              <div className={styles.timeSlotsContainer}>
                {availableSlots.length > 0 ? (
                  <div className={styles.slotsGrid}>
                    {availableSlots.map(slot => (
                      <div key={slot.id} className={styles.slotCheckboxItem}>
                        <Checkbox
                          label={`${slot.nameSlot || 'Slot'} (${slot.startAt} - ${slot.endAt})`}
                          checked={isSlotSelected(activeTab, slot.id)}
                          onChange={() => toggleSlotSelection(activeTab, slot)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyTimeSlot}>
                    {loading ? 'Đang tải slots...' : 'Không có slot nào. Vui lòng kiểm tra lại campusId.'}
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
              {loading ? 'Đang lưu...' : 'Lưu thời gian rảnh'}
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
        </div>

    </div>
  );
}