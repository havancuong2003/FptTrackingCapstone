import React from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import axiosClient from '../../../utils/axiosClient';

export default function Schedule() {
  const { groupId: urlGroupId } = useParams();
  const groupId = urlGroupId || '1'; // Mock groupId nếu không có
  
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
  const [loading, setLoading] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = React.useState([]);
  const [userSchedules, setUserSchedules] = React.useState({});
  const [groupMembers, setGroupMembers] = React.useState([]);
  const [finalMeetingTime, setFinalMeetingTime] = React.useState(null);
  const [isSupervisor, setIsSupervisor] = React.useState(false);
  const [isFinalized, setIsFinalized] = React.useState(false); // DEMO: bật sẵn trạng thái đã chốt
  const [timeInterval, setTimeInterval] = React.useState(60); // 30, 60, 120 phút
  const [groupMeeting, setGroupMeeting] = React.useState(null); // Lịch họp của nhóm

  // Tạo time slots dựa trên khoảng thời gian
  const generateTimeSlots = (interval) => {
    const slots = [];
    const startHour = 8;
    const endHour = 20;
    
    // Tính tổng số phút từ 8h đến 20h
    const totalMinutes = (endHour - startHour) * 60;
    
    // Tạo slots với khoảng cách đúng interval (không chồng lấp)
    for (let currentMinute = 0; currentMinute < totalMinutes; currentMinute += interval) {
      const startHourCalc = startHour + Math.floor(currentMinute / 60);
      const startMinute = currentMinute % 60;
      const endMinute = currentMinute + interval;
      const endHourCalc = startHour + Math.floor(endMinute / 60);
      const endMinuteFinal = endMinute % 60;
      
      // Chỉ tạo slot nếu không vượt quá endHour
      if (endHourCalc < endHour || (endHourCalc === endHour && endMinuteFinal === 0)) {
        const startTime = `${startHourCalc.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteFinal.toString().padStart(2, '0')}`;
        slots.push(`${startTime}-${endTime}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots(timeInterval);

  // Lấy danh sách ngày trong tuần (thứ 2 đến chủ nhật)
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push({
        date: day,
        dayName: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][day.getDay()],
        isToday: day.toDateString() === today.toDateString()
      });
    }
    return weekDays;
  };

  // Kiểm tra role của user
  React.useEffect(() => {
    if (currentUser) {
      setIsSupervisor(currentUser.role === 'supervisor' || currentUser.role === 'Supervisor');
    }
  }, [currentUser]);

  // Load dữ liệu ban đầu
  React.useEffect(() => {
    if (groupId) {
      loadGroupMembers();
      loadSchedules();
      loadGroupMeeting();
    }
  }, [groupId]);

  // Mock data: Lấy danh sách thành viên group
  const loadGroupMembers = async () => {
    // Mock data cho group members
    const mockMembers = [
      { id: 1, name: 'Nguyễn Văn A', role: 'student', studentCode: 'HE160001' },
      { id: 2, name: 'Trần Thị B', role: 'student', studentCode: 'HE160002' },
      { id: 3, name: 'Lê Văn C', role: 'student', studentCode: 'HE160003' },
      { id: 4, name: 'Phạm Thị D', role: 'student', studentCode: 'HE160004' }
    ];

    // Đảm bảo có bản thân trong danh sách
    const me = {
      id: currentUser?.id ?? 0,
      name: currentUser?.name ?? 'Tôi',
      role: currentUser?.role ?? 'student',
      studentCode: currentUser?.studentCode || currentUser?.code || String(currentUser?.id ?? '')
    };

    const exists = mockMembers.some(m => m.id === me.id);
    const merged = exists || !me.id ? mockMembers : [me, ...mockMembers];
    setGroupMembers(merged);
  };

  // Mock data: Lấy lịch của tất cả thành viên
  const loadSchedules = async () => {
    setLoading(true);
    
    // Lấy ngày hiện tại và tạo mock data cho tuần này
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    
    const getDateStr = (date) => date.toISOString().split('T')[0];
    
    // Mock data cho schedules
    const mockSchedules = {
      1: { // Nguyễn Văn A
        [getDateStr(monday)]: ['09:00-10:00', '10:00-11:00', '14:00-15:00'],
        [getDateStr(new Date(monday.getTime() + 24*60*60*1000))]: ['08:00-09:00', '15:00-16:00', '16:00-17:00'],
        [getDateStr(new Date(monday.getTime() + 2*24*60*60*1000))]: ['11:00-12:00', '13:00-14:00']
      },
      2: { // Trần Thị B
        [getDateStr(monday)]: ['10:00-11:00', '11:00-12:00', '15:00-16:00'],
        [getDateStr(new Date(monday.getTime() + 24*60*60*1000))]: ['09:00-10:00', '14:00-15:00'],
        [getDateStr(new Date(monday.getTime() + 3*24*60*60*1000))]: ['08:00-09:00', '16:00-17:00']
      },
      3: { // Lê Văn C
        [getDateStr(monday)]: ['08:00-09:00', '09:00-10:00', '17:00-18:00'],
        [getDateStr(new Date(monday.getTime() + 2*24*60*60*1000))]: ['10:00-11:00', '14:00-15:00', '15:00-16:00']
      },
      4: { // Phạm Thị D - chưa vote
        // Không có data
      }
    };
    
    setUserSchedules(mockSchedules);
    setLoading(false);
  };

  // Fetch lịch họp đã chốt của nhóm (chỉ thời gian + link)
  const fetchGroupMeeting = async (groupId) => {
    try {
      // Mock data - thay thế bằng API call thực tế
      const mockMeeting = {
        id: 1,
        groupId: parseInt(groupId),
        dayOfWeek: "monday",
        startTime: "09:00:00",
        endTime: "11:00:00",
        meetingLink: "https://meet.google.com/abc-defg-hij",
        supervisorName: "Dr. John Smith"
      };
      
      return mockMeeting;
    } catch (error) {
      console.error('Error fetching group meeting:', error);
      return null;
    }
  };

  // Load lịch họp của nhóm
  const loadGroupMeeting = async () => {
    if (groupId) {
      const meeting = await fetchGroupMeeting(groupId);
      setGroupMeeting(meeting);
    }
  };

  // Mock: Vote lịch rảnh
  const voteSchedule = async (date, timeSlots) => {
    if (isFinalized) {
      alert('Thời gian họp đã được chốt. Không thể vote thêm.');
      return;
    }
    // Mock: Cập nhật local state
    setUserSchedules(prev => ({
      ...prev,
      [currentUser.id]: {
        ...prev[currentUser.id],
        [date]: timeSlots
      }
    }));
    
    alert('Vote lịch thành công!');
  };

  // Mock: Chốt thời gian họp (chỉ supervisor)
  const finalizeMeetingTime = async (date, timeSlot) => {
    // Mock: Cập nhật local state
    setFinalMeetingTime({ date, timeSlot });
    setIsFinalized(true);
    alert('Đã chốt thời gian họp!');
  };

  // Xử lý click vào ngày
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const userSchedule = userSchedules[currentUser.id]?.[dateStr] || [];
    setSelectedTimeSlots(userSchedule);
    
    // Scroll xuống phần vote
    setTimeout(() => {
      const voteSection = document.querySelector(`.${styles.voteSection}`);
      if (voteSection) {
        voteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Xử lý toggle time slot
  const handleTimeSlotToggle = (timeSlot) => {
    setSelectedTimeSlots(prev => {
      if (prev.includes(timeSlot)) {
        return prev.filter(slot => slot !== timeSlot);
      } else {
        return [...prev, timeSlot];
      }
    });
  };

  // Lưu vote
  const handleSaveVote = () => {
    if (!selectedDate || selectedTimeSlots.length === 0) {
      alert('Vui lòng chọn ít nhất một khung giờ!');
      return;
    }
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    voteSchedule(dateStr, selectedTimeSlots);
  };

  // Lấy lịch của user cho ngày được chọn
  const getUserScheduleForDate = (userId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    return userSchedules[userId]?.[dateStr] || [];
  };

  // Kiểm tra user đã vote chưa
  const hasUserVoted = (userId) => {
    return Object.keys(userSchedules[userId] || {}).length > 0;
  };

  const weekDays = getWeekDays();

  // DEMO: nếu đã chốt mà chưa có thời gian chốt, set một thời gian mẫu
  React.useEffect(() => {
    if (isFinalized && !finalMeetingTime) {
      const monday = weekDays?.[0]?.date || new Date();
      try {
        const dateStr = monday.toISOString();
        const firstSlot = timeSlots?.[0] || '08:00-09:00';
        setFinalMeetingTime({ date: dateStr, timeSlot: firstSlot });
      } catch (e) {
        // fallback an toàn
        setFinalMeetingTime({ date: new Date().toISOString(), timeSlot: '08:00-09:00' });
      }
    }
  }, [isFinalized, finalMeetingTime, weekDays, timeSlots]);

  const getWeekdayName = (dateString) => {
    try {
      const d = new Date(dateString);
      const names = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
      return names[d.getDay()];
    } catch (e) {
      return '';
    }
  };

  // Cảnh báo khi đổi khoảng thời gian: sẽ xóa vote cũ của user hiện tại
  const handleIntervalChange = (nextInterval) => {
    const hasMyVotes = Object.keys(userSchedules[currentUser.id] || {}).length > 0;
    if (hasMyVotes) {
      const ok = window.confirm('Đổi khoảng thời gian sẽ xóa các vote cũ của bạn. Tiếp tục?');
      if (!ok) return; // không thay đổi
      // Xóa vote cũ của chính mình
      setUserSchedules(prev => ({
        ...prev,
        [currentUser.id]: {}
      }));
      setSelectedTimeSlots([]);
    }
    setTimeInterval(nextInterval);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading schedules...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Lịch Họp Nhóm</h1>
        <div className={styles.headerControls}>
          <div className={styles.timeIntervalSelector}>
            <label>Khoảng thời gian:</label>
            <select 
              value={timeInterval} 
              onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
              className={styles.intervalSelect}
            >
              <option value={30}>30 phút</option>
              <option value={60}>60 phút</option>
              <option value={120}>120 phút</option>
            </select>
          </div>
          {isSupervisor && (
            <div className={styles.supervisorBadge}>
              <span>Giảng viên hướng dẫn</span>
            </div>
          )}
        </div>
      </div>

      {/* Trạng thái xác nhận lịch */}
      <div className={`${styles.finalizeBanner} ${isFinalized ? styles.finalized : styles.notFinalized}`}>
        {isFinalized ? (
          <div className={styles.finalizedContent}>
            <span>
              Giảng viên đã xác nhận thời gian họp cố định: {getWeekdayName(finalMeetingTime?.date)} - {finalMeetingTime?.timeSlot || '...'}
            </span>
            {groupMeeting?.meetingLink && (
              <a 
                href={groupMeeting.meetingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.meetingLinkButton}
              >
                Tham gia cuộc họp
              </a>
            )}
          </div>
        ) : (
          <span>Giảng viên chưa xác nhận thời gian họp. Bạn có thể vote lịch rảnh.</span>
        )}
      </div>

      {/* Hướng dẫn */}
      <div className={styles.instruction}>
        <span>Click vào ngày để vote lịch rảnh</span>
      </div>

      {/* Bảng lịch tuần */}
      <div className={styles.weekCalendar}>
        <div className={styles.weekHeader}>
          <div className={styles.timeColumnHeader}></div>
          {weekDays.map((day, index) => (
            <div 
              key={index}
              className={`${styles.dayHeader} ${day.isToday ? styles.today : ''} ${selectedDate?.toDateString() === day.date.toDateString() ? styles.selectedDay : ''}`}
              onClick={() => handleDateClick(day.date)}
            >
              <div className={styles.dayName}>{day.dayName}</div>
            </div>
          ))}
        </div>

        <div className={styles.timeSlotsGrid}>
          {timeSlots.map(timeSlot => (
            <div key={timeSlot} className={styles.timeSlotRow}>
              <div className={styles.timeLabel}>{timeSlot}</div>
              {weekDays.map((day, dayIndex) => {
                const dateStr = day.date.toISOString().split('T')[0];
                const isSelected = selectedDate?.toDateString() === day.date.toDateString();
                const userSchedule = getUserScheduleForDate(currentUser.id, day.date);
                const isVoted = userSchedule.includes(timeSlot);
                
                return (
                  <div 
                    key={dayIndex}
                    className={`${styles.timeCell} ${isSelected ? styles.selectedColumn : ''} ${isVoted ? styles.voted : ''}`}
                  >
                    {isVoted && <span className={styles.voteIcon}>✓</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Phần vote lịch */}
      {selectedDate && !isFinalized && (
        <div className={styles.voteSection}>
          <h2>Vote lịch rảnh - {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long' })}</h2>
          <div className={styles.timeSlotsSelection}>
            {timeSlots.map(timeSlot => (
              <label key={timeSlot} className={styles.timeSlotOption}>
                <input
                  type="checkbox"
                  checked={selectedTimeSlots.includes(timeSlot)}
                  onChange={() => handleTimeSlotToggle(timeSlot)}
                />
                <span>{timeSlot}</span>
              </label>
            ))}
          </div>
          <div className={styles.voteActions}>
            <Button onClick={handleSaveVote} className={styles.saveButton}>
              Lưu lịch rảnh
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedDate(null)}
              className={styles.cancelButton}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}


      {/* Tổng quan lịch rảnh của thành viên (luôn hiển thị ở cuối) */}
      {(
        <div className={styles.groupOverview}>
          <h2>Lịch rảnh của thành viên</h2>
          <div className={styles.membersList}>
            {groupMembers.map(member => (
              <div key={member.id} className={styles.memberCard}>
                <div className={styles.memberInfo}>
                  <h4>{member.name} {member.studentCode ? `(${member.studentCode})` : ''}</h4>
                  <span className={styles.voteStatus}>
                    {hasUserVoted(member.id) ? 'Đã vote' : 'Chưa vote'}
                  </span>
                </div>
                <div className={styles.memberSchedule}>
                  {weekDays.map(day => {
                    const schedule = getUserScheduleForDate(member.id, day.date);
                    return (
                      <div key={day.date.toISOString()} className={styles.daySchedule}>
                        <div className={styles.dayLabel}>
                          {day.dayName}
                        </div>
                        <div className={styles.scheduleSlots}>
                          {schedule.map(slot => (
                            <span key={slot} className={styles.scheduleSlot}>{slot}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {isSupervisor && !isFinalized && (
            <div className={styles.finalizeSection}>
              <h3>Chốt thời gian họp</h3>
              <div className={styles.finalizeForm}>
                <select className={styles.dateSelect}>
                  <option value="">Chọn ngày</option>
                  {weekDays.map(day => (
                    <option key={day.date.toISOString()} value={day.date.toISOString()}>
                      {day.dayName} - {day.date.getDate()}/{day.date.getMonth() + 1}
                    </option>
                  ))}
                </select>
                <select className={styles.timeSelect}>
                  <option value="">Chọn giờ</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <Button 
                  onClick={() => {
                    const dateSelect = document.querySelector(`.${styles.dateSelect}`);
                    const timeSelect = document.querySelector(`.${styles.timeSelect}`);
                    if (dateSelect.value && timeSelect.value) {
                      finalizeMeetingTime(dateSelect.value, timeSelect.value);
                    } else {
                      alert('Vui lòng chọn ngày và giờ!');
                    }
                  }}
                  className={styles.finalizeButton}
                >
                  Chốt thời gian họp
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hiển thị thời gian họp đã chốt */}
      {finalMeetingTime && (
        <div className={styles.finalMeetingInfo}>
          <h3>Thời gian họp đã chốt</h3>
          <div className={styles.meetingDetails}>
            <span>Ngày: {new Date(finalMeetingTime.date).toLocaleDateString('vi-VN')}</span>
            <span>Giờ: {finalMeetingTime.timeSlot}</span>
          </div>
        </div>
      )}
    </div>
  );
}
