import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import { 
  getMeetingScheduleByGroupId, 
  getStudentFreeTimeSlotsNew, 
  saveStudentFreeTimeSlots 
} from '../../../api/schedule';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
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
      return null;
    } catch (error) {
      console.error('Error getting groupId from localStorage:', error);
      return null;
    }
  };
  
  const groupId = getGroupId();
  
  // Kiểm tra groupId ngay từ đầu
  const hasValidGroupId = groupId !== null && groupId !== undefined && groupId !== '';
  
  // Lấy thông tin user từ localStorage
  const getCurrentUser = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        return JSON.parse(authUser);
      }
      return null;
    } catch (error) {
      console.error('Error parsing auth_user:', error);
      return null;
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
  const [isSelectingMode, setIsSelectingMode] = useState(false); // Mode để chọn thời gian rảnh
  const [initialFreeTimeSlots, setInitialFreeTimeSlots] = useState({}); // Lưu trạng thái ban đầu khi vào selecting mode

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
    // Nếu không có groupId hợp lệ, không gọi API
    if (!hasValidGroupId) {
      setLoading(false);
      return;
    }
    if (groupId) {
      loadGroupData();
    }
  }, [groupId, hasValidGroupId]);

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
      const response = await getMeetingScheduleByGroupId(groupId);
      if (response.status === 200) {
        setMeetingSchedule(response.data);
        if(response.data.isActive) {
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
          
          // Convert backend data to frontend format - object với key là day value
          const formattedSlots = {};
          currentStudentData.freeTimeSlots.forEach((item) => {
            const dayKey = mapDayOfWeekToEnglish(item.dayOfWeek);
            // timeSlots là mảng các slot object với id, nameSlot, startAt, endAt
            formattedSlots[dayKey] = (item.timeSlots || []).map((slot, slotIndex) => ({
              id: slot.id || `slot-${slotIndex + 1}`,
              nameSlot: slot.nameSlot || '',
              startAt: slot.startAt || '',
              endAt: slot.endAt || ''
            }));
          });
          setFreeTimeSlots(formattedSlots);
          // Cập nhật initialFreeTimeSlots với dữ liệu đã lưu
          setInitialFreeTimeSlots(JSON.parse(JSON.stringify(formattedSlots)));
        } else {
          // Nếu không có dữ liệu, reset về empty
          setFreeTimeSlots({});
          setInitialFreeTimeSlots({});
        }
        
        // Lưu dữ liệu của tất cả thành viên để hiển thị
        const memberSchedulesData = {};
        
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
        
        apiData.forEach(studentData => {
          if (studentData.freeTimeSlots && studentData.freeTimeSlots.length > 0) {
            const schedule = {};
            studentData.freeTimeSlots.forEach(dayData => {
              const dayKey = mapDayOfWeekToEnglish(dayData.dayOfWeek);
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
      alert('Please select at least one slot for a day of the week');
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

      const response = await saveStudentFreeTimeSlots(groupId, formattedData);
      
      if (response && response.status === 200) {
        // Reload lại dữ liệu để cập nhật calendar view
        await fetchStudentFreeTimeSlots();
        // Cập nhật initialFreeTimeSlots với dữ liệu đã lưu và thoát selecting mode
        setInitialFreeTimeSlots(JSON.parse(JSON.stringify(freeTimeSlots)));
        setIsSelectingMode(false);
        alert('Free time slots saved successfully!');
      } else {
        alert('Error occurred while saving free time slots: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error saving free time slots:', error);
      alert('Error occurred while saving free time slots: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  // Nếu không có groupId hợp lệ, hiển thị thông báo
  if (!hasValidGroupId) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState || styles.error}>
          <div className={styles.emptyTitle || styles.errorTitle}>You are not in any group</div>
          <div className={styles.emptyMessage || styles.errorMessage}>Please contact the supervisor to be added to a group.</div>
        </div>
      </div>
    );
  }

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
          <span>Select day tab and choose free time slots for each day</span>
        </div>
      )}

      {/* Free Time Slots Management - Integrated Calendar View */}
      {!isFinalized && (
        <div className={styles.freeTimeSection}>
          <div className={styles.sectionHeader}>
            <h2>Your Free Time & Members' Free Time</h2>
            {!isSelectingMode && (
              <button
                onClick={() => {
                  // Lưu trạng thái hiện tại trước khi vào selecting mode
                  setInitialFreeTimeSlots(JSON.parse(JSON.stringify(freeTimeSlots)));
                  setIsSelectingMode(true);
                }}
                className={styles.selectTimeBtn}
              >
                Select Free Time
              </button>
            )}
            {isSelectingMode && (
              <div className={styles.selectingModeActions}>
                <button
                  onClick={() => {
                    // Restore lại trạng thái ban đầu và thoát selecting mode
                    setFreeTimeSlots(JSON.parse(JSON.stringify(initialFreeTimeSlots)));
                    setIsSelectingMode(false);
                  }}
                  className={styles.cancelSelectBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFreeTimeSlots}
                  className={styles.saveSlotsBtn}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Free Time'}
                </button>
              </div>
            )}
          </div>
          
          {(() => {
            // Get current student ID
            const currentStudentId = parseInt(localStorage.getItem('student_id')) || parseInt(currentUser?.id);
            
            // Collect ALL slots from ALL students across ALL days
            const allSlotsMap = new Map(); // Use Map to store unique slots by id
            
            // First, add all available slots from campus
            availableSlots.forEach(slot => {
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
            
            // Then, add slots from all students
            Object.keys(memberSchedules).forEach(studentId => {
              const studentSchedule = memberSchedules[studentId];
              
              Object.keys(studentSchedule).forEach(dayKey => {
                const daySlots = studentSchedule[dayKey] || [];
                
                daySlots.forEach(slot => {
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
              return parseTime(a.startAt) - parseTime(b.startAt);
            });
            
            // Helper function to find students available at a specific slot and day
            const getAvailableStudents = (slot, dayKey) => {
              const available = [];
              
              Object.keys(memberSchedules).forEach(studentId => {
                const studentSchedule = memberSchedules[studentId];
                const daySlots = studentSchedule[dayKey] || [];
                
                const isAvailable = daySlots.some(s => {
                  return (s.id === slot.id) || 
                         (s.startAt === slot.startAt && s.endAt === slot.endAt);
                });
                
                if (isAvailable) {
                  const student = group?.members?.find(m => 
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
            
            // Check if current student has selected this slot
            const isCurrentStudentSlotSelected = (slot, dayKey) => {
              const daySlots = freeTimeSlots[dayKey] || [];
              return daySlots.some(s => s.id === slot.id);
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
                const isSelected = isCurrentStudentSlotSelected(slot, dayKey);
                row[dayKey] = { availableStudents, isSelected };
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
                  const { availableStudents, isSelected } = row[day.value] || { availableStudents: [], isSelected: false };
                  return (
                    <div className={styles.calendarCell}>
                      <div className={styles.cellContent}>
                        {/* Checkbox for current student to select - only show in selecting mode */}
                        {!isFinalized && isSelectingMode && (
                          <div className={styles.slotCheckboxWrapper}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleSlotSelection(day.value, row.timeSlot)}
                              label=""
                            />
                          </div>
                        )}
                        
                        {/* Display students who have selected this slot */}
                        {availableStudents.length > 0 ? (
                          <div className={styles.studentsList}>
                            {availableStudents.map((student, idx) => (
                              <div 
                                key={idx} 
                                className={`${styles.studentBadge} ${
                                  student.id === currentStudentId || student.studentId === currentStudentId 
                                    ? styles.currentStudentBadge 
                                    : ''
                                }`}
                              >
                                {student.name || student.rollNumber || `Student ${student.id}`}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptyCell}>-</div>
                        )}
                      </div>
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
                  emptyMessage={loading ? 'Loading slots...' : 'No slots available. Please check campusId.'}
                  showIndex={false}
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* Show Members' Free Time when finalized */}
      {isFinalized && (
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
                  // Get student info from group members
                  const student = group?.members?.find(m => 
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
        </div>
      )}

    </div>
  );
}