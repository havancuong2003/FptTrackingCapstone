import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import axiosClient from '../../../utils/axiosClient';

export default function StudentSchedule() {
  const [loading, setLoading] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamAvailability, setTeamAvailability] = useState({});
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [meetingSchedule, setMeetingSchedule] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showOthersSchedule, setShowOthersSchedule] = useState(true);

  // Mock data
  const mockTeamMembers = [
    { id: 'SE00001', name: 'Nguyen Van A', role: 'Leader' },
    { id: 'SE00002', name: 'Nguyen Van B', role: 'Developer' },
    { id: 'SE00003', name: 'Nguyen Van C', role: 'Designer' },
    { id: 'SE00004', name: 'Nguyen Van D', role: 'Tester' },
    { id: 'SE00005', name: 'Nguyen Van E', role: 'Documentation' }
  ];

  const mockTimeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const dayOfWeekOptions = [
    { value: 'monday', label: 'Thứ 2' },
    { value: 'tuesday', label: 'Thứ 3' },
    { value: 'wednesday', label: 'Thứ 4' },
    { value: 'thursday', label: 'Thứ 5' },
    { value: 'friday', label: 'Thứ 6' },
    { value: 'saturday', label: 'Thứ 7' },
    { value: 'sunday', label: 'Chủ nhật' }
  ];

  // Check if meeting schedule exists
  const checkMeetingSchedule = async () => {
    try {
      const groupId = localStorage.getItem('student_group_id') || '1';
      const response = await axiosClient.get(`/Student/Meeting/schedule/finalize/getById/${groupId}`);
      if (response.data && response.data.id) {
        setMeetingSchedule(response.data);
        setIsFinalized(true);
        setShowOthersSchedule(false); // Hide others' schedule when finalized
        return true;
      }
      return false;
    } catch (error) {
      console.error('No meeting schedule found');
      return false;
    }
  };

  useEffect(() => {
    setTeamMembers(mockTeamMembers);
    setAvailableSlots(mockTimeSlots);
    
    // Check if meeting schedule already exists
    checkMeetingSchedule();
  }, []);

  const handleDayOfWeekChange = (dayOfWeek) => {
    setSelectedDayOfWeek(dayOfWeek);
    setSelectedTimeSlots([]);
    setShowSuggestions(false);
  };

  const handleTimeSlotToggle = (timeSlot) => {
    setSelectedTimeSlots(prev => {
      if (prev.includes(timeSlot)) {
        return prev.filter(slot => slot !== timeSlot);
      } else {
        return [...prev, timeSlot];
      }
    });
  };

  const handleSubmitAvailability = async () => {
    if (!selectedDayOfWeek || selectedTimeSlots.length === 0) {
      alert('Vui lòng chọn thứ và ít nhất một khung giờ rảnh');
      return;
    }

    setLoading(true);
    try {
      const studentId = localStorage.getItem('student_id') || localStorage.getItem('userId');
      const groupId = localStorage.getItem('student_group_id');
      
      if (!studentId || !groupId) {
        alert('Không tìm thấy thông tin sinh viên hoặc nhóm');
        return;
      }

      const response = await axiosClient.post(`/Student/Meeting/groups/${groupId}/schedule/free-time`, {
        freeTimeSlots: [{
          studentId: parseInt(studentId),
          groupId: parseInt(groupId),
          dayOfWeek: selectedDayOfWeek,
          timeSlots: selectedTimeSlots
        }]
      });

      if (response.data.success) {
        setTeamAvailability(prev => ({
          ...prev,
          [selectedDayOfWeek]: {
            ...prev[selectedDayOfWeek],
            [studentId]: selectedTimeSlots
          }
        }));
        alert('Đã cập nhật lịch rảnh thành công!');
      } else {
        alert('Có lỗi xảy ra khi cập nhật lịch rảnh');
      }
    } catch (error) {
      console.error('Error submitting availability:', error);
      alert('Có lỗi xảy ra khi cập nhật lịch rảnh');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestSlots = async () => {
    if (!selectedDayOfWeek) {
      alert('Vui lòng chọn thứ trước');
      return;
    }

    try {
      const groupId = localStorage.getItem('student_group_id');
      if (!groupId) {
        alert('Không tìm thấy thông tin nhóm');
        return;
      }

      const response = await axiosClient.get(`/Student/Meeting/groups/${groupId}/schedule/free-time`);
      if (response.data.success && response.data.data) {
        // Tìm các khung giờ chung của tất cả thành viên
        const allSlots = response.data.data
          .filter(slot => slot.day === selectedDayOfWeek)
          .map(slot => slot.timeSlots)
          .flat();
        
        // Đếm số lần xuất hiện của mỗi khung giờ
        const slotCounts = {};
        allSlots.forEach(slot => {
          slotCounts[slot] = (slotCounts[slot] || 0) + 1;
        });
        
        // Lấy các khung giờ xuất hiện nhiều nhất
        const commonSlots = Object.keys(slotCounts)
          .filter(slot => slotCounts[slot] > 1)
          .sort((a, b) => slotCounts[b] - slotCounts[a])
          .slice(0, 4);
        
        setSuggestedSlots(commonSlots);
        setShowSuggestions(true);
      } else {
        alert('Không thể lấy thông tin lịch rảnh của nhóm');
      }
    } catch (error) {
      console.error('Error fetching team availability:', error);
      alert('Có lỗi xảy ra khi lấy thông tin lịch rảnh');
    }
  };

  const handleAcceptSuggestion = async (suggestedSlot) => {
    try {
      // Get groupId from localStorage
      const groupId = localStorage.getItem('student_group_id') || '1';
      
      // API call to confirm meeting time
      const meetingData = {
        id: meetingSchedule?.id || null, // Use existing ID if updating
        isActive: true,
        meetingLink: meetingSchedule?.meetingLink || '', // Keep existing link if updating
        time: suggestedSlot,
        dayOfWeek: selectedDayOfWeek.toLowerCase()
      };
      
      const response = await axiosClient.post(`/Student/Meeting/schedule/finalize/update`, meetingData);
      
      if (response.data) {
        setMeetingSchedule(response.data);
        setIsFinalized(true);
        alert(`Đã xác nhận lịch họp: ${suggestedSlot} ${dayOfWeekOptions.find(d => d.value === selectedDayOfWeek)?.label}`);
      }
    } catch (error) {
      console.error('Error confirming meeting time:', error);
      alert('Có lỗi xảy ra khi xác nhận lịch họp');
    }
  };

  const getMemberAvailability = (memberId, dayOfWeek) => {
    return teamAvailability[dayOfWeek]?.[memberId] || [];
  };

  const isSlotSelected = (timeSlot) => {
    return selectedTimeSlots.includes(timeSlot);
  };

  const isSlotAvailable = (timeSlot) => {
    if (!selectedDayOfWeek) return false;
    const memberAvailabilities = Object.values(teamAvailability[selectedDayOfWeek] || {});
    return memberAvailabilities.some(availability => availability.includes(timeSlot));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Đang xử lý...</div>
      </div>
    );
  }

  // Show finalized meeting info if exists
  if (isFinalized && meetingSchedule) {
    return (
      <div className={styles.container}>
        <div className={styles.finalizedMeeting}>
          <h2>Lịch họp đã được xác nhận!</h2>
          <div className={styles.meetingInfo}>
            <p><strong>Thời gian:</strong> {meetingSchedule.dayOfWeek} - {meetingSchedule.time}</p>
            <p><strong>Tạo bởi:</strong> {meetingSchedule.createdByName}</p>
            <p><strong>Ngày tạo:</strong> {new Date(meetingSchedule.createAt).toLocaleDateString('vi-VN')}</p>
            {meetingSchedule.meetingLink && (
              <p><strong>Meeting Link:</strong> 
                <a href={meetingSchedule.meetingLink} target="_blank" rel="noopener noreferrer">
                  {meetingSchedule.meetingLink}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Schedule Management</h1>
        <p>Chọn thời gian rảnh để thống nhất lịch họp nhóm</p>
      </div>

      <div className={styles.content}>
        {/* Day of Week Selection */}
        <div className={styles.section}>
          <h2>Chọn thứ trong tuần</h2>
          <div className={styles.daySelector}>
            <select
              value={selectedDayOfWeek}
              onChange={(e) => handleDayOfWeekChange(e.target.value)}
              className={styles.daySelect}
            >
              <option value="">Chọn thứ</option>
              {dayOfWeekOptions.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Slots Selection */}
        {selectedDayOfWeek && (
          <div className={styles.section}>
            <h2>Chọn khung giờ rảnh</h2>
            <div className={styles.timeSlotsGrid}>
              {availableSlots.map(timeSlot => (
                <button
                  key={timeSlot}
                  className={`${styles.timeSlot} ${isSlotSelected(timeSlot) ? styles.selected : ''}`}
                  onClick={() => handleTimeSlotToggle(timeSlot)}
                >
                  {timeSlot}
                </button>
              ))}
            </div>
            <div className={styles.actions}>
              <button 
                className={styles.submitButton}
                onClick={handleSubmitAvailability}
                disabled={selectedTimeSlots.length === 0}
              >
                Cập nhật lịch rảnh
              </button>
            </div>
          </div>
        )}

        {/* Team Availability Overview - Only show if not finalized or showOthersSchedule is true */}
        {selectedDayOfWeek && (!isFinalized || showOthersSchedule) && (
          <div className={styles.section}>
            <h2>Tình hình nhóm</h2>
            <div className={styles.teamOverview}>
              {teamMembers.map(member => (
                <div key={member.id} className={styles.memberCard}>
                  <div className={styles.memberInfo}>
                    <h4>{member.name}</h4>
                    <span className={styles.memberRole}>{member.role}</span>
                  </div>
                  <div className={styles.memberAvailability}>
                    {getMemberAvailability(member.id, selectedDayOfWeek).length > 0 ? (
                      <div className={styles.availableSlots}>
                        {getMemberAvailability(member.id, selectedDayOfWeek).map(slot => (
                          <span key={slot} className={styles.availableSlot}>{slot}</span>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.noAvailability}>Chưa cập nhật</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Own Schedule - Show when finalized */}
        {selectedDayOfWeek && isFinalized && !showOthersSchedule && (
          <div className={styles.section}>
            <h2>Lịch rảnh của bạn</h2>
            <div className={styles.ownSchedule}>
              <p>Lịch họp đã được xác nhận. Bạn chỉ có thể xem lịch rảnh của mình.</p>
              <div className={styles.memberCard}>
                <div className={styles.memberInfo}>
                  <h4>Lịch rảnh của bạn</h4>
                </div>
                <div className={styles.memberAvailability}>
                  {selectedTimeSlots.length > 0 ? (
                    <div className={styles.availableSlots}>
                      {selectedTimeSlots.map(slot => (
                        <span key={slot} className={styles.availableSlot}>{slot}</span>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.noAvailability}>Chưa cập nhật</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Meeting Times - Only show if not finalized */}
        {selectedDayOfWeek && !isFinalized && (
          <div className={styles.section}>
            <h2>Đề xuất khung giờ họp</h2>
            <button 
              className={styles.suggestButton}
              onClick={handleSuggestSlots}
            >
              Tìm khung giờ phù hợp
            </button>
            
            {showSuggestions && (
              <div className={styles.suggestions}>
                <h3>Khung giờ được đề xuất:</h3>
                <div className={styles.suggestedSlots}>
                  {suggestedSlots.map(slot => (
                    <div key={slot} className={styles.suggestedSlot}>
                      <span className={styles.slotTime}>{slot}</span>
                      <button 
                        className={styles.acceptButton}
                        onClick={() => handleAcceptSuggestion(slot)}
                      >
                        Chọn khung giờ này
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className={styles.instructions}>
          <h3>Hướng dẫn sử dụng:</h3>
          <ul>
            <li>Chọn thứ trong tuần muốn đặt lịch họp</li>
            <li>Đánh dấu các khung giờ bạn rảnh</li>
            <li>Nhấn "Cập nhật lịch rảnh" để lưu</li>
            <li>Nhấn "Tìm khung giờ phù hợp" để hệ thống đề xuất</li>
            <li>Chọn khung giờ phù hợp nhất cho nhóm</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 