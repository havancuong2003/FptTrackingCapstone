import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';

export default function StudentSchedule() {
  const [loading, setLoading] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamAvailability, setTeamAvailability] = useState({});
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  useEffect(() => {
    setTeamMembers(mockTeamMembers);
    setAvailableSlots(mockTimeSlots);
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

  const handleSubmitAvailability = () => {
    if (!selectedDayOfWeek || selectedTimeSlots.length === 0) {
      alert('Vui lòng chọn thứ và ít nhất một khung giờ rảnh');
      return;
    }

    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setTeamAvailability(prev => ({
        ...prev,
        [selectedDayOfWeek]: {
          ...prev[selectedDayOfWeek],
          [localStorage.getItem('userId') || 'SE00001']: selectedTimeSlots
        }
      }));
      setLoading(false);
      alert('Đã cập nhật lịch rảnh thành công!');
    }, 1000);
  };

  const handleSuggestSlots = () => {
    if (!selectedDayOfWeek) {
      alert('Vui lòng chọn thứ trước');
      return;
    }

    // Simulate finding common available slots
    const commonSlots = ['09:00', '14:00', '16:00', '19:00'];
    setSuggestedSlots(commonSlots);
    setShowSuggestions(true);
  };

  const handleAcceptSuggestion = (suggestedSlot) => {
    alert(`Đã chọn khung giờ: ${suggestedSlot} ${dayOfWeekOptions.find(d => d.value === selectedDayOfWeek)?.label}`);
    // Here would be API call to confirm meeting time
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

        {/* Team Availability Overview */}
        {selectedDayOfWeek && (
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

        {/* Suggested Meeting Times */}
        {selectedDayOfWeek && (
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