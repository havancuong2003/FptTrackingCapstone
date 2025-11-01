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
  const [freeTimeSlots, setFreeTimeSlots] = useState([]);
  // Bỏ timeInterval - không cần nữa
  const [isFinalized, setIsFinalized] = useState(false);
  const [meetingSchedule, setMeetingSchedule] = useState(null);
  const [finalMeeting, setFinalMeeting] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberSchedules, setMemberSchedules] = useState({});
  const [isSupervisor, setIsSupervisor] = useState(false);
  // Bỏ useTimeInput - chỉ sử dụng text input với format HH:MM

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
        setIsFinalized(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('No meeting schedule found');
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
      try {
        const freeTimeResponse = await axiosClient.get(`/Student/Meeting/groups/${groupId}/schedule/free-time`);
        if (freeTimeResponse.data && freeTimeResponse.data.status === 200) {
          const apiData = freeTimeResponse.data.data;
            
          // Tìm thời gian rảnh của user hiện tại
          const currentStudentId = parseInt(localStorage.getItem('student_id')) || parseInt(currentUser?.id);
          const currentStudentData = apiData.find(item => item.studentId === currentStudentId);
          
          if (currentStudentData && currentStudentData.freeTimeSlots.length > 0) {
            // Convert backend data to frontend format
            const formattedSlots = currentStudentData.freeTimeSlots.map((item, index) => ({
              id: `day-${index + 1}`,
              day: item.dayOfWeek.toLowerCase(), // Convert to lowercase for consistency
              timeSlots: item.timeSlots.map((time, timeIndex) => ({
                id: `time-${timeIndex + 1}`,
                time: time,
                isEditing: false,
                isValid: true
              }))
            }));
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
        }
      } catch (error) {
      }
    } catch (error) {
      console.error('Error loading group data:', error);
      // Fallback nếu API call thất bại
      setGroup({ id: groupId, name: 'Group ' + groupId });
    } finally {
      setLoading(false);
    }
  };

  // Logic mới: Thêm thứ mới
  const addNewDay = () => {
    const newDay = {
      id: Date.now(),
      day: '',
      timeSlots: []
    };
    setFreeTimeSlots(prev => [...prev, newDay]);
  };

  // Xóa thứ
  const removeDay = (dayId) => {
    setFreeTimeSlots(prev => prev.filter(day => day.id !== dayId));
  };

  // Cập nhật thứ
  const updateDay = (dayId, field, value) => {
    setFreeTimeSlots(prev => 
      prev.map(day => 
        day.id === dayId 
          ? { ...day, [field]: value }
          : day
      )
    );
  };

  // Thêm giờ rảnh cho thứ
  const addTimeSlot = (dayId) => {
    const newTimeSlot = {
      id: Date.now(),
      time: '',
      isEditing: false,
      isValid: false
    };
    setFreeTimeSlots(prev => 
      prev.map(day => 
        day.id === dayId 
          ? { ...day, timeSlots: [...day.timeSlots, newTimeSlot] }
          : day
      )
    );
  };

  // Xóa giờ rảnh
  const removeTimeSlot = (dayId, timeSlotId) => {
    setFreeTimeSlots(prev => 
      prev.map(day => 
        day.id === dayId 
          ? { ...day, timeSlots: day.timeSlots.filter(slot => slot.id !== timeSlotId) }
          : day
      )
    );
  };

  // Validate time format - bắt buộc format HH:MM
  const validateTimeFormat = (time) => {
    if (!time) return false;
    
    // Bắt buộc format HH:MM (09:00, 17:30, etc.)
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    
    return timeRegex.test(time);
  };

  // Cập nhật giờ rảnh với validation
  const updateTimeSlot = (dayId, timeSlotId, field, value) => {
    setFreeTimeSlots(prev => 
      prev.map(day => 
        day.id === dayId 
          ? { 
              ...day, 
              timeSlots: day.timeSlots.map(slot => 
                slot.id === timeSlotId 
                  ? { 
                      ...slot, 
                      [field]: value,
                      isValid: field === 'time' ? validateTimeFormat(value) : slot.isValid
                    }
                  : slot
              )
            }
          : day
      )
    );
  };

  // Bỏ bước lưu riêng cho từng slot - không cần xác nhận ✓

  // Bỏ filter days - cho phép chọn tất cả thứ

  // Lấy danh sách thứ có sẵn cho một card cụ thể (trừ các thứ đã được chọn ở card khác)
  const getAvailableDays = (currentDayId) => {
    // Lấy danh sách các thứ đã được chọn ở các card khác
    const selectedDays = freeTimeSlots
      .filter(d => d.id !== currentDayId && d.day) // Trừ card hiện tại và chỉ lấy thứ đã chọn
      .map(d => d.day);
    
    // Trả về các thứ chưa được chọn
    return daysOfWeek.filter(dayOption => 
      !selectedDays.includes(dayOption.value) || 
      freeTimeSlots.find(d => d.id === currentDayId)?.day === dayOption.value // Cho phép giữ nguyên thứ hiện tại
    );
  };

  // Save free time slots
  const handleSaveFreeTimeSlots = async () => {
    if (freeTimeSlots.length === 0) {
      alert('Vui lòng thêm ít nhất một thứ');
      return;
    }
    
    // Validate TẤT CẢ các thứ đều hợp lệ
    let hasInvalidDay = false;
    let invalidMessages = [];
    
    for (let i = 0; i < freeTimeSlots.length; i++) {
      const day = freeTimeSlots[i];
      
      // Kiểm tra thứ đã được chọn chưa
      if (!day.day) {
        hasInvalidDay = true;
        invalidMessages.push(`${i + 1}: Chưa chọn thứ trong tuần`);
        continue;
      }
      
      // Kiểm tra có ít nhất 1 time slot chưa
      if (day.timeSlots.length === 0) {
        hasInvalidDay = true;
        invalidMessages.push(`${day.day}: Chưa có giờ rảnh nào`);
        continue;
      }
      
      // Kiểm tra tất cả time slots đều hợp lệ
      const invalidSlots = day.timeSlots.filter(slot => !slot.time || !slot.isValid);
      if (invalidSlots.length > 0) {
        hasInvalidDay = true;
        invalidMessages.push(`${day.day}: Có ${invalidSlots.length} giờ rảnh sai định dạng hoặc chưa nhập`);
        continue;
      }
    }
    
    // Nếu có bất kỳ thứ nào không hợp lệ, không call API
    if (hasInvalidDay) {
      alert('Vui lòng kiểm tra lại:\n' + invalidMessages.join('\n') + '\n\nĐịnh dạng thời gian phải là HH:MM (VD: 09:00, 17:30)');
      return;
    }
    
    // Tất cả đều hợp lệ, mới được call API
    const validDays = freeTimeSlots;

    setLoading(true);
    try {
      // Lấy studentId từ localStorage (convert to int)
      const studentId = parseInt(localStorage.getItem('student_id')) || parseInt(currentUser?.id);
      const groupIdInt = parseInt(groupId);
      
      // Format data theo yêu cầu backend: đúng format backend cần
      const formattedData = {
        freeTimeSlots: validDays.map(day => ({
          studentId: studentId,
          groupId: groupIdInt,
          dayOfWeek: day.day.charAt(0).toUpperCase() + day.day.slice(1), // Capitalize first letter
          timeSlots: [{
            dayOfWeek: day.day.charAt(0).toUpperCase() + day.day.slice(1),
            timeSlots: day.timeSlots.map(slot => slot.time)
          }]
        }))
      };

      // API call với data đã format
     const response = await axiosClient.post(`/Student/Meeting/groups/${groupId}/schedule/free-time`, formattedData);

      
      alert('Đã lưu thời gian rảnh thành công!');
    } catch (error) {
      console.error('Error saving free time slots:', error);
      alert('Có lỗi xảy ra khi lưu thời gian rảnh');
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
        alert('Vui lòng chọn ngày và giờ họp');
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
        alert('Lịch họp đã được xác nhận thành công!');
      }
    } catch (error) {
      console.error('Error finalizing schedule:', error);
      alert('Có lỗi xảy ra khi xác nhận lịch họp');
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
        <h1>Lịch họp Nhóm</h1>     {isSupervisor && (
        <div className={styles.headerControls}>
     
            <div className={styles.supervisorBadge}>
              Giảng viên: {currentUser.name}
            </div>
          
        </div>)}
      </div>

      {!isFinalized ? (
        <div className={styles.notFinalized}>
          Lịch họp chưa được xác nhận. Vui lòng chọn thời gian rảnh của bạn.
        </div>
      ) : (
        <div className={styles.finalizeBanner}>
          <div className={styles.finalized}>
          <div className={styles.finalizedContent}>
              <h3>Lịch họp đã được xác nhận!</h3>
              <p>Thời gian: {meetingSchedule?.dayOfWeek} - {meetingSchedule?.time}</p>
              <p>Ngày tạo: {new Date(meetingSchedule?.createAt).toLocaleDateString('vi-VN')}</p>
              {meetingSchedule?.meetingLink && (
                <a 
                  href={meetingSchedule?.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.meetingLinkButton}
                >
                  Tham gia cuộc họp
                </a>
              )}
            </div>
          </div>
        </div>
        )}

      {!isFinalized && (
        <div className={styles.instruction}>
          <span>Click dấu + để thêm thứ, sau đó thêm giờ rảnh cho từng thứ</span>
        </div>
      )}

      {/* Free Time Slots Management - Hide when finalized */}
      {!isFinalized && (
        <div className={styles.freeTimeSection}>
          <h2>Thời gian rảnh của bạn</h2>
        
        <div className={styles.freeTimeSlots}>
          {freeTimeSlots.map((day) => (
            <div key={day.id} className={styles.freeTimeSlotCard}>
              <div className={styles.slotHeader}>
                <h3>Thời gian rảnh</h3>
                <button 
                  onClick={() => removeDay(day.id)}
                  className={styles.removeBtn}
                >
                  ×
                </button>
        </div>

              <div className={styles.slotForm}>
                <div className={styles.formGroup}>
                  <label>Chọn thứ</label>
                  <select
                    value={day.day}
                    onChange={(e) => updateDay(day.id, 'day', e.target.value)}
                    className={styles.daySelect}
                  >
                    <option value="">-- Chọn thứ --</option>
                    {getAvailableDays(day.id).map(dayOption => (
                      <option key={dayOption.id} value={dayOption.value}>{dayOption.name}</option>
                    ))}
                  </select>
                </div>
                
                {day.day && (
                  <div className={styles.formGroup}>
                    <label>Giờ rảnh</label>
                    <div className={styles.helperText}>
                      Nhập theo format HH:MM (VD: 09:00, 17:30, 14:15)
                    </div>
                    <div className={styles.timeSlotsContainer}>
                      {day.timeSlots.map(timeSlot => (
                        <div key={timeSlot.id} className={styles.timeSlotItem}>
                          <div className={styles.timeSlotEdit}>
                            <input
                              type="text"
                              value={timeSlot.time}
                              onChange={(e) => updateTimeSlot(day.id, timeSlot.id, 'time', e.target.value)}
                              placeholder="VD: 09:00, 17:30"
                              className={`${styles.timeInput} ${timeSlot.time && !timeSlot.isValid ? styles.invalid : ''}`}
                            />
                            <button
                              onClick={() => removeTimeSlot(day.id, timeSlot.id)}
                              className={styles.removeTimeBtn}
                            >
                              ×
                            </button>
                            {timeSlot.time && !timeSlot.isValid && (
                              <div className={styles.errorText}>
                                Format phải là HH:MM (VD: 09:00)
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addTimeSlot(day.id)}
                        className={styles.addTimeBtn}
                      >
                        + Thêm giờ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

        <div className={styles.freeTimeActions}>
          <button 
            onClick={addNewDay} 
            className={styles.addSlotBtn}
          >
            + Thêm thứ
          </button>
          
          <button
            onClick={handleSaveFreeTimeSlots}
            className={styles.saveSlotsBtn}
            disabled={loading || freeTimeSlots.length === 0}
          >
            {loading ? 'Đang lưu...' : 'Lưu thời gian rảnh'}
          </button>
        </div>
      </div>
      )}

        <div className={styles.groupOverview}>
        <h2>Thành viên nhóm</h2>
          <div className={styles.membersList}>
          {members.map(member => {
            const memberSchedule = memberSchedules[member.id] || {};
            const hasSchedule = Object.keys(memberSchedule).length > 0;
            
            return (
              <div key={member.id} className={styles.memberCard}>
                <div className={styles.memberInfo}>
                  <h4>{member.name}</h4>
                  <div className={styles.voteStatus}>
                    {hasSchedule ? 'Đã cập nhật lịch' : 'Chưa cập nhật lịch'}
                  </div>
                </div>
                <div className={styles.memberSchedule}>
                  {hasSchedule ? (
                    <div className={styles.scheduleGrid}>
                      {daysOfWeek.map(day => {
                        const dayKey = day.value;
                        const timeSlots = memberSchedule[dayKey] || [];
                        
                        return (
                          <div key={day.id} className={styles.daySchedule}>
                            <div className={styles.dayLabel}>{day.name}</div>
                            <div className={styles.scheduleSlots}>
                              {timeSlots.length > 0 ? (
                                timeSlots.map((slot, index) => (
                                  <div key={index} className={styles.scheduleSlot}>{slot}</div>
                                ))
                              ) : (
                                <div className={styles.noSlots}>Không có</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.noSchedule}>
                      Thành viên chưa cập nhật thời gian rảnh
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
          </div>

      {isSupervisor && (
            <div className={styles.finalizeSection}>
          <h3>Xác nhận lịch họp</h3>
              <div className={styles.finalizeForm}>
            <input 
              type="date" 
              className={styles.dateSelect}
              placeholder="Chọn ngày"
            />
                <select className={styles.timeSelect}>
                  <option value="">Chọn giờ</option>
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
              {loading ? 'Đang xác nhận...' : 'Xác nhận lịch họp'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}