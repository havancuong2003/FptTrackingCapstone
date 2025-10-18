import React from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import axiosClient from '../../../utils/axiosClient';

export default function SupervisorSchedule() {
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
        name: 'Supervisor A',
        role: 'supervisor'
      };
    } catch (error) {
      console.error('Error parsing auth_user:', error);
      // Mock user fallback
      return {
        id: 1,
        name: 'Supervisor A',
        role: 'supervisor'
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
  const [isSupervisor, setIsSupervisor] = React.useState(true);
  const [isFinalized, setIsFinalized] = React.useState(false);
  const [timeInterval, setTimeInterval] = React.useState(60); // 30, 60, 120 phút
  const [availableGroups, setAvailableGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = React.useState('');
  const [selectedStartTime, setSelectedStartTime] = React.useState('');
  const [selectedEndTime, setSelectedEndTime] = React.useState('');

  // Tạo time slots dựa trên khoảng thời gian
  const generateTimeSlots = (interval) => {
    const slots = [];
    const startHour = 8;
    const endHour = 20;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots(timeInterval);

  // API: Lấy danh sách nhóm
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
        alert(`Lỗi lấy danh sách nhóm: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert(`Lỗi kết nối: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // API: Lấy thông tin nhóm và sinh viên
  const fetchGroupDetails = async (groupId) => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/Staff/capstone-groups/${groupId}`);
      
      if (response.data.status === 200) {
        const groupData = response.data.data;
        const students = groupData.students || [];
        
        const mappedMembers = students.map(student => ({
          id: student.id,
          name: student.name,
          studentId: student.studentId || student.id,
          email: student.email || '',
          role: student.role || 'member'
        }));
        
        setGroupMembers(mappedMembers);
        return mappedMembers;
      } else {
        console.error('Error fetching group details:', response.data.message);
        alert(`Lỗi lấy thông tin nhóm: ${response.data.message}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      alert(`Lỗi kết nối: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // API: Lấy lịch rảnh của sinh viên
  const fetchStudentSchedule = async (studentId, date) => {
    try {
      // Mock API call - thực tế sẽ gọi API thật
      // const response = await axiosClient.get(`/Student/schedule/${studentId}?date=${date}`);
      
      // Mock data cho demo - tạo lịch rảnh cho 7 ngày tới
      const today = new Date();
      const mockSchedules = {};
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Tạo lịch rảnh theo khoảng thời gian thực tế
        const availableSlots = [];
        
        // Định nghĩa các khoảng thời gian có thể rảnh (format 9:00-10:00)
        const possibleTimeRanges = [
          { start: 8, end: 10, label: "8:00-10:00" },
          { start: 9, end: 11, label: "9:00-11:00" },
          { start: 10, end: 12, label: "10:00-12:00" },
          { start: 11, end: 13, label: "11:00-13:00" },
          { start: 13, end: 15, label: "13:00-15:00" },
          { start: 14, end: 16, label: "14:00-16:00" },
          { start: 15, end: 17, label: "15:00-17:00" },
          { start: 16, end: 18, label: "16:00-18:00" },
          { start: 19, end: 21, label: "19:00-21:00" },
          { start: 20, end: 22, label: "20:00-22:00" }
        ];
        
        // 60% chance có mỗi khoảng thời gian rảnh
        possibleTimeRanges.forEach(range => {
          if (Math.random() > 0.4) {
            availableSlots.push(range.label);
          }
        });
        
        mockSchedules[dateStr] = availableSlots;
      }
      
      return mockSchedules[date] || [];
    } catch (error) {
      console.error('Error fetching student schedule:', error);
      return [];
    }
  };

  // Load danh sách nhóm khi component mount
  React.useEffect(() => {
    fetchAvailableGroups();
  }, []);



  // Xử lý khi chọn nhóm
  const handleGroupSelect = async (groupId) => {
    setSelectedGroup(groupId);
    setSelectedDate(null);
    setSelectedTimeSlots([]);
    setUserSchedules({});
    setFinalMeetingTime(null);
    setIsFinalized(false);
    
    if (groupId) {
      const members = await fetchGroupDetails(groupId);
      // Load lịch rảnh của tất cả thành viên
      if (members && members.length > 0) {
        await loadAllMembersSchedules(members);
      }
    }
  };

  // Load lịch rảnh của tất cả thành viên
  const loadAllMembersSchedules = async (members) => {
    setLoading(true);
    try {
      const schedules = {};
      
      // Load lịch cho 7 ngày tới
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        for (const member of members) {
          const memberSchedule = await fetchStudentSchedule(member.id, dateStr);
          if (!schedules[member.id]) {
            schedules[member.id] = {};
          }
          if (memberSchedule.length > 0) {
            schedules[member.id][dateStr] = memberSchedule;
          }
        }
      }
      
      setUserSchedules(schedules);
    } catch (error) {
      console.error('Error loading all members schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy lịch của tất cả thành viên trong nhóm
  const fetchGroupSchedules = async (date) => {
    if (!selectedGroup || groupMembers.length === 0) return;
    
    setLoading(true);
    try {
      const schedules = {};
      
      for (const member of groupMembers) {
        const memberSchedule = await fetchStudentSchedule(member.id, date);
        schedules[member.id] = memberSchedule;
      }
      
      setUserSchedules(schedules);
    } catch (error) {
      console.error('Error fetching group schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi chọn ngày
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlots([]);
    setFinalMeetingTime(null);
    fetchGroupSchedules(date);
  };

  // Xử lý khi chọn time slot
  const handleTimeSlotSelect = (timeSlot) => {
    if (selectedTimeSlots.includes(timeSlot)) {
      setSelectedTimeSlots(prev => prev.filter(slot => slot !== timeSlot));
    } else {
      setSelectedTimeSlots(prev => [...prev, timeSlot]);
    }
  };

  // Tìm khung giờ chung của tất cả thành viên
  const findCommonTimeSlots = () => {
    if (!selectedDate || groupMembers.length === 0) return [];
    
    const allSchedules = Object.values(userSchedules);
    if (allSchedules.length === 0) return [];
    
    // Tìm khung giờ có trong tất cả lịch
    const commonSlots = allSchedules[0].filter(slot => 
      allSchedules.every(schedule => schedule.includes(slot))
    );
    
    return commonSlots;
  };

  // Tìm khung giờ phổ biến (ít nhất 80% thành viên rảnh)
  const findPopularTimeSlots = () => {
    if (!selectedDate || groupMembers.length === 0) return [];
    
    const allSchedules = Object.values(userSchedules);
    if (allSchedules.length === 0) return [];
    
    const threshold = Math.ceil(allSchedules.length * 0.8);
    const slotCounts = {};
    
    allSchedules.forEach(schedule => {
      schedule.forEach(slot => {
      slotCounts[slot] = (slotCounts[slot] || 0) + 1;
      });
    });
    
    return Object.entries(slotCounts)
      .filter(([slot, count]) => count >= threshold)
      .map(([slot]) => slot);
  };

  // API: Chốt lịch họp
  const finalizeMeeting = async () => {
    if (!selectedGroup) {
      alert('Vui lòng chọn nhóm');
      return;
    }
    
    if (!selectedDayOfWeek || !selectedStartTime || !selectedEndTime) {
      alert('Vui lòng chọn đầy đủ thông tin thời gian họp');
      return;
    }
    
    try {
      setLoading(true);
      
      // Gọi API chốt lịch họp
      const meetingData = {
        groupId: parseInt(selectedGroup),
        dayOfWeek: selectedDayOfWeek,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        supervisorId: currentUser.id,
        supervisorName: currentUser.name,
        finalizedAt: new Date().toISOString()
      };
      
      // Mock API call - thực tế sẽ gọi API thật
      // const response = await axiosClient.post('/Supervisor/meeting/finalize', meetingData);
      
      // Mock response
    setTimeout(() => {
        setFinalMeetingTime({
          dayOfWeek: selectedDayOfWeek,
          startTime: selectedStartTime,
          endTime: selectedEndTime,
          finalizedAt: new Date().toISOString(),
          groupId: selectedGroup
        });
        setIsFinalized(true);
        alert(`Đã chốt lịch họp cho nhóm ${availableGroups.find(g => g.id.toString() === selectedGroup)?.name} vào ${selectedDayOfWeek} từ ${selectedStartTime} đến ${selectedEndTime}`);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error finalizing meeting:', error);
      alert(`Lỗi chốt lịch: ${error.message}`);
      setLoading(false);
    }
  };

  // Hủy chốt lịch
  const cancelFinalization = () => {
    setFinalMeetingTime(null);
    setIsFinalized(false);
    setSelectedTimeSlots([]);
  };

  // Format ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Lấy thông tin khả dụng của một thành viên
  const getMemberAvailability = (memberId) => {
    return userSchedules[memberId] || [];
  };

  // Kiểm tra xem một khung giờ có phổ biến không
  const isPopularSlot = (timeSlot) => {
    const popularSlots = findPopularTimeSlots();
    return popularSlots.includes(timeSlot);
  };

  // Kiểm tra xem một khung giờ có chung không
  const isCommonSlot = (timeSlot) => {
    const commonSlots = findCommonTimeSlots();
    return commonSlots.includes(timeSlot);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Đang tải lịch...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Schedule Management - Supervisor</h1>
        <p>Quản lý lịch họp nhóm và chốt khung giờ phù hợp</p>
      </div>

        {/* Group Selection */}
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


      {/* Selected Group Info */}
        {selectedGroup && (
          <div className={styles.section}>
          <h2>Thông tin nhóm đã chọn</h2>
          <div className={styles.groupInfo}>
            <h3>{availableGroups.find(g => g.id.toString() === selectedGroup)?.name}</h3>
            <p>Số thành viên: {groupMembers.length}</p>
            <div className={styles.membersList}>
              {groupMembers.map(member => (
                <div key={member.id} className={styles.memberItem}>
                  <span className={styles.memberName}>{member.name}</span>
                  <span className={styles.memberId}>({member.studentId})</span>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}

      {/* Lịch rảnh của thành viên */}
      {selectedGroup && (
          <div className={styles.section}>
          <h2>Lịch rảnh của thành viên</h2>
          <div className={styles.membersList}>
            {groupMembers.map(member => {
              const memberSchedules = userSchedules[member.id] || {};
              const hasVoted = Object.keys(memberSchedules).length > 0;
              
              // Nhóm lịch theo thứ trong tuần
              const scheduleByDayOfWeek = {};
              Object.entries(memberSchedules).forEach(([date, slots]) => {
                const dayOfWeek = new Date(date).getDay();
                const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                const dayName = dayNames[dayOfWeek];
                
                if (!scheduleByDayOfWeek[dayName]) {
                  scheduleByDayOfWeek[dayName] = [];
                }
                scheduleByDayOfWeek[dayName].push(...slots);
              });
              
              return (
                <div key={member.id} className={styles.memberCard}>
                  <div className={styles.memberInfo}>
                    <h4>{member.name} ({member.studentId})</h4>
                    <span className={styles.voteStatus}>
                      {hasVoted ? 'Đã vote' : 'Chưa vote'}
                    </span>
                  </div>
                  <div className={styles.memberSchedule}>
                    {Object.entries(scheduleByDayOfWeek).map(([dayName, slots]) => (
                      <div key={dayName} className={styles.daySchedule}>
                        <div className={styles.dayLabel}>
                          {dayName}
                        </div>
                        <div className={styles.scheduleSlots}>
                    {slots.map(slot => (
                            <span key={slot} className={styles.scheduleSlot}>{slot}</span>
                    ))}
                  </div>
                </div>
              ))}
                    {!hasVoted && (
                      <div className={styles.noVoteMessage}>
                        Thành viên chưa vote lịch rảnh
          </div>
        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Chốt lịch họp */}
      {selectedGroup && !isFinalized && (
          <div className={styles.section}>
          <h2>Chốt lịch họp</h2>
          <div className={styles.finalizeForm}>
            <div className={styles.finalizeInfo}>
              <p>Dựa trên lịch rảnh của các thành viên, bạn có thể chốt lịch họp cho nhóm.</p>
            </div>
            
            <div className={styles.timeSelection}>
              <h3>Chọn thời gian họp</h3>
              <div className={styles.timeInputs}>
                <div className={styles.timeInputGroup}>
                  <label>Thứ trong tuần:</label>
                  <select 
                    value={selectedDayOfWeek || ''} 
                    onChange={(e) => setSelectedDayOfWeek(e.target.value)}
                    className={styles.timeSelect}
                  >
                    <option value="">Chọn thứ</option>
                    <option value="monday">Thứ hai</option>
                    <option value="tuesday">Thứ ba</option>
                    <option value="wednesday">Thứ tư</option>
                    <option value="thursday">Thứ năm</option>
                    <option value="friday">Thứ sáu</option>
                    <option value="saturday">Thứ bảy</option>
                    <option value="sunday">Chủ nhật</option>
                  </select>
                </div>
                
                <div className={styles.timeInputGroup}>
                  <label>Giờ bắt đầu:</label>
                  <input
                    type="time"
                    value={selectedStartTime || ''}
                    onChange={(e) => setSelectedStartTime(e.target.value)}
                    className={styles.timeInput}
                  />
                </div>
                
                <div className={styles.timeInputGroup}>
                  <label>Giờ kết thúc:</label>
                  <input
                    type="time"
                    value={selectedEndTime || ''}
                    onChange={(e) => setSelectedEndTime(e.target.value)}
                    className={styles.timeInput}
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.finalizeActions}>
              <Button 
                onClick={finalizeMeeting}
                disabled={loading || !selectedDayOfWeek || !selectedStartTime || !selectedEndTime}
                className={styles.finalizeButton}
              >
                {loading ? 'Đang xử lý...' : 'Chốt lịch họp'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Final Meeting Time */}
      {finalMeetingTime && (
        <div className={styles.section}>
          <h2>Lịch họp đã chốt</h2>
          <div className={styles.finalMeeting}>
            <div className={styles.finalMeetingInfo}>
              <h3>Nhóm: {availableGroups.find(g => g.id.toString() === selectedGroup)?.name}</h3>
              <div className={styles.meetingDetails}>
                <p><strong>Thứ:</strong> {finalMeetingTime.dayOfWeek}</p>
                <p><strong>Thời gian:</strong> {finalMeetingTime.startTime} - {finalMeetingTime.endTime}</p>
                <p className={styles.finalizedAt}>
                  Chốt lúc: {new Date(finalMeetingTime.finalizedAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
            <div className={styles.finalMeetingActions}>
              <Button 
                variant="secondary" 
                onClick={cancelFinalization}
                disabled={!isSupervisor}
              >
                Hủy chốt lịch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className={styles.instructions}>
        <h3>Hướng dẫn sử dụng:</h3>
        <ul>
          <li><strong>Bước 1:</strong> Chọn nhóm cần đặt lịch họp</li>
          <li><strong>Bước 2:</strong> Xem lịch rảnh của tất cả thành viên theo thứ trong tuần</li>
          <li><strong>Bước 3:</strong> Chốt lịch họp dựa trên lịch rảnh đã xem</li>
          <li><strong>Lưu ý:</strong> Lịch rảnh được hiển thị theo thứ (Thứ hai, Thứ ba, v.v.) thay vì ngày cụ thể</li>
        </ul>
      </div>
    </div>
  );
}