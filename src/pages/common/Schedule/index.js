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

  const loadGroupData = async () => {
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
            email: student.email, // Sử dụng email thật từ API
            role: student.role
          }))
        };
        
        setGroup(formattedGroup);
        setMembers(formattedGroup.members);
        
        console.log("Loaded group data:", formattedGroup);
      } else {
        console.error('Error fetching group data:', response.data.message);
        setGroup({ id: groupId, name: 'Group ' + groupId });
      }
      
      // Fetch existing free time slots
      try {
        const freeTimeResponse = await axiosClient.get(`/groups/${groupId}/schedule/free-time`);
        if (freeTimeResponse.data && freeTimeResponse.data.length > 0) {
          // Convert backend data to frontend format
          const formattedSlots = freeTimeResponse.data.map((item, index) => ({
            id: `day-${index + 1}`,
            day: item.day,
            timeSlots: item.timeSlots.map((time, timeIndex) => ({
              id: `time-${timeIndex + 1}`,
              time: time,
              isEditing: false,
              isValid: true
            }))
          }));
          setFreeTimeSlots(formattedSlots);
          console.log("Loaded existing free time slots:", formattedSlots);
        }
      } catch (error) {
        console.log('No existing free time slots found');
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
      isEditing: true,
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

  // Lưu giờ rảnh (kết thúc editing)
  const saveTimeSlot = (dayId, timeSlotId) => {
    setFreeTimeSlots(prev => 
      prev.map(day => 
        day.id === dayId 
          ? { 
              ...day, 
              timeSlots: day.timeSlots.map(slot => 
                slot.id === timeSlotId 
                  ? { ...slot, isEditing: false }
                  : slot
              )
            }
          : day
      )
    );
  };

  // Bỏ filter days - cho phép chọn tất cả thứ

  // Save free time slots
  const handleSaveFreeTimeSlots = async () => {
    if (freeTimeSlots.length === 0) {
      alert('Vui lòng thêm ít nhất một thứ');
      return;
    }

    // Validate all days have day and time slots
    const validDays = freeTimeSlots.filter(day => 
      day.day && 
      day.timeSlots.length > 0 && 
      day.timeSlots.every(slot => slot.time && !slot.isEditing && slot.isValid)
    );
    
    if (validDays.length === 0) {
      alert('Vui lòng chọn thứ và nhập thời gian rảnh cho tất cả các thứ');
      return;
    }

    setLoading(true);
    try {
      // Lấy studentId từ localStorage (convert to int)
      const studentId = parseInt(localStorage.getItem('student_id')) || parseInt(currentUser?.id);
      const groupIdInt = parseInt(groupId);
      
      // Format data theo yêu cầu: studentId, groupId, day, timeSlots
      const formattedData = validDays.map(day => ({
        studentId: studentId,
        groupId: groupIdInt,
        day: day.day,
        timeSlots: day.timeSlots.map(slot => slot.time)
      }));
      
      console.log("Data gửi xuống backend:", formattedData);
      
      // API call với data đã format
      await axiosClient.post(`/groups/${groupId}/schedule/free-time`, {
        freeTimeSlots: formattedData
      });
      
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
      // API call với groupId từ localStorage
      const response = await axiosClient.post(`/groups/${groupId}/schedule/finalize`);
      setFinalMeeting(response.data);
      setIsFinalized(true);
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
        <h1>Lịch họp Nhóm</h1>
        <div className={styles.headerControls}>
          {isSupervisor && (
            <div className={styles.supervisorBadge}>
              Giảng viên: {currentUser.name}
            </div>
          )}
        </div>
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
              <p>Thời gian: {finalMeeting?.day} - {finalMeeting?.time}</p>
              <a 
                href={finalMeeting?.meetingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.meetingLinkButton}
              >
                Tham gia cuộc họp
              </a>
            </div>
          </div>
        </div>
        )}

      <div className={styles.instruction}>
        <span>Click dấu + để thêm thứ, sau đó thêm giờ rảnh cho từng thứ</span>
      </div>

      {/* Free Time Slots Management */}
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
                    {daysOfWeek.map(dayOption => (
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
                          {timeSlot.isEditing ? (
                            <div className={styles.timeSlotEdit}>
                              <input
                                type="text"
                                value={timeSlot.time}
                                onChange={(e) => updateTimeSlot(day.id, timeSlot.id, 'time', e.target.value)}
                                placeholder="VD: 09:00, 17:30, 14:15"
                                className={`${styles.timeInput} ${timeSlot.time && !timeSlot.isValid ? styles.invalid : ''}`}
                              />
                              <button
                                onClick={() => saveTimeSlot(day.id, timeSlot.id)}
                                className={styles.saveTimeBtn}
                                disabled={!timeSlot.time || !timeSlot.isValid}
                              >
                                ✓
                              </button>
                              {timeSlot.time && !timeSlot.isValid && (
                                <div className={styles.errorText}>
                                  Format phải là HH:MM (VD: 09:00)
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className={`${styles.timeSlotDisplay} ${!timeSlot.isValid ? styles.invalid : ''}`}>
                              <span className={styles.timeText}>{timeSlot.time}</span>
                              <button
                                onClick={() => removeTimeSlot(day.id, timeSlot.id)}
                                className={styles.removeTimeBtn}
                              >
                                ×
                              </button>
                            </div>
                          )}
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

        <div className={styles.groupOverview}>
        <h2>Thành viên nhóm</h2>
          <div className={styles.membersList}>
          {members.map(member => (
              <div key={member.id} className={styles.memberCard}>
                <div className={styles.memberInfo}>
                <h4>{member.name}</h4>
                <div className={styles.voteStatus}>
                  {memberSchedules[member.id] ? 'Đã vote' : 'Chưa vote'}
                </div>
                </div>
                <div className={styles.memberSchedule}>
                <div className={styles.daySchedule}>
                  <div className={styles.dayLabel}>Thứ 2</div>
                        <div className={styles.scheduleSlots}>
                    {memberSchedules[member.id]?.monday?.map(slot => (
                      <div key={slot} className={styles.scheduleSlot}>{slot}</div>
                          ))}
                        </div>
                      </div>
                {/* Repeat for other days */}
                </div>
              </div>
            ))}
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
              {generateTimeSlots(timeInterval).map(slot => (
                <option key={slot.id} value={slot.id}>{slot.label}</option>
                  ))}
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