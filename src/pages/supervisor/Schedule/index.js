import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';

export default function SupervisorSchedule() {
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupAvailability, setGroupAvailability] = useState({});
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [confirmedSchedule, setConfirmedSchedule] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [showCustomSchedule, setShowCustomSchedule] = useState(false);
  const [customTimeSlot, setCustomTimeSlot] = useState('');

  const dayOfWeekOptions = [
    { value: 'monday', label: 'Thứ 2' },
    { value: 'tuesday', label: 'Thứ 3' },
    { value: 'wednesday', label: 'Thứ 4' },
    { value: 'thursday', label: 'Thứ 5' },
    { value: 'friday', label: 'Thứ 6' },
    { value: 'saturday', label: 'Thứ 7' },
    { value: 'sunday', label: 'Chủ nhật' }
  ];

  // Mock data
  const mockGroups = [
    { id: 'G001', name: 'Group 1 - AI Project', members: 5, status: 'active' },
    { id: 'G002', name: 'Group 2 - Web App', members: 4, status: 'active' },
    { id: 'G003', name: 'Group 3 - Mobile App', members: 6, status: 'active' }
  ];

  const mockTimeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const mockGroupAvailability = {
    'G001': {
      'monday': {
        'SE00001': ['09:00', '14:00', '16:00', '19:00'],
        'SE00002': ['09:00', '10:00', '14:00', '15:00', '16:00'],
        'SE00003': ['09:00', '14:00', '16:00', '19:00', '20:00'],
        'SE00004': ['09:00', '14:00', '16:00'],
        'SE00005': ['09:00', '14:00', '16:00', '19:00']
      },
      'wednesday': {
        'SE00001': ['09:00', '14:00', '16:00', '19:00'],
        'SE00002': ['09:00', '10:00', '14:00', '15:00', '16:00'],
        'SE00003': ['09:00', '14:00', '16:00', '19:00', '20:00'],
        'SE00004': ['09:00', '14:00', '16:00'],
        'SE00005': ['09:00', '14:00', '16:00', '19:00']
      }
    },
    'G002': {
      'tuesday': {
        'SE00006': ['10:00', '14:00', '16:00', '18:00'],
        'SE00007': ['10:00', '14:00', '16:00'],
        'SE00008': ['10:00', '14:00', '16:00', '18:00', '19:00'],
        'SE00009': ['10:00', '14:00', '16:00', '18:00']
      }
    }
  };

  useEffect(() => {
    setGroups(mockGroups);
    setGroupAvailability(mockGroupAvailability);
  }, []);

  const handleGroupChange = (groupId) => {
    setSelectedGroup(groupId);
    setSelectedDayOfWeek('');
    setSuggestedSlots([]);
  };

  const handleDayOfWeekChange = (dayOfWeek) => {
    setSelectedDayOfWeek(dayOfWeek);
    if (selectedGroup && dayOfWeek) {
      findCommonSlots(selectedGroup, dayOfWeek);
    }
  };

  const findCommonSlots = (groupId, dayOfWeek) => {
    const availability = groupAvailability[groupId]?.[dayOfWeek];
    if (!availability) return;

    const memberSlots = Object.values(availability);
    if (memberSlots.length === 0) return;

    // Find slots where all members are available
    const commonSlots = memberSlots[0].filter(slot => 
      memberSlots.every(memberSlots => memberSlots.includes(slot))
    );

    // Find slots where most members are available (at least 80%)
    const threshold = Math.ceil(memberSlots.length * 0.8);
    const popularSlots = mockTimeSlots.filter(slot => {
      const availableCount = memberSlots.filter(memberSlots => memberSlots.includes(slot)).length;
      return availableCount >= threshold;
    });

    setSuggestedSlots([...commonSlots, ...popularSlots.filter(slot => !commonSlots.includes(slot))]);
  };

  const handleConfirmSchedule = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setShowConfirmModal(true);
  };

  const handleCustomSchedule = () => {
    setShowCustomSchedule(true);
  };

  const handleCustomTimeChange = (timeSlot) => {
    setCustomTimeSlot(timeSlot);
  };

  const handleConfirmCustomSchedule = () => {
    if (!customTimeSlot) {
      alert('Vui lòng chọn khung giờ');
      return;
    }
    setSelectedTimeSlot(customTimeSlot);
    setShowCustomSchedule(false);
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    if (!selectedGroup || !selectedDayOfWeek || !selectedTimeSlot) return;

    setLoading(true);
    setTimeout(() => {
      setConfirmedSchedule(prev => ({
        ...prev,
        [selectedGroup]: {
          ...prev[selectedGroup],
          [selectedDayOfWeek]: {
            timeSlot: selectedTimeSlot,
            confirmedAt: new Date().toISOString(),
            status: 'confirmed'
          }
        }
      }));
      setLoading(false);
      setShowConfirmModal(false);
      alert(`Đã chốt lịch họp cho ${groups.find(g => g.id === selectedGroup)?.name} vào ${dayOfWeekOptions.find(d => d.value === selectedDayOfWeek)?.label} lúc ${selectedTimeSlot}`);
    }, 1000);
  };

  const getGroupAvailability = (groupId, dayOfWeek) => {
    return groupAvailability[groupId]?.[dayOfWeek] || {};
  };

  const getAvailabilityStats = (groupId, dayOfWeek) => {
    const availability = getGroupAvailability(groupId, dayOfWeek);
    const totalMembers = Object.keys(availability).length;
    const slots = Object.values(availability).flat();
    const slotCounts = {};
    
    slots.forEach(slot => {
      slotCounts[slot] = (slotCounts[slot] || 0) + 1;
    });

    return { totalMembers, slotCounts };
  };

  const isSlotConfirmed = (groupId, dayOfWeek, timeSlot) => {
    return confirmedSchedule[groupId]?.[dayOfWeek]?.timeSlot === timeSlot;
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
        <h1>Schedule Management - Supervisor</h1>
        <p>Xem lịch rảnh của nhóm và chốt khung giờ họp chính thức</p>
      </div>

      <div className={styles.content}>
        {/* Group Selection */}
        <div className={styles.section}>
          <h2>Chọn nhóm</h2>
          <div className={styles.groupSelector}>
            <select
              value={selectedGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
              className={styles.groupSelect}
            >
              <option value="">Chọn nhóm</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.members} thành viên)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Day of Week Selection */}
        {selectedGroup && (
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
        )}

        {/* Group Availability Overview */}
        {selectedGroup && selectedDayOfWeek && (
          <div className={styles.section}>
            <h2>Tình hình nhóm</h2>
            <div className={styles.groupOverview}>
              {Object.entries(getGroupAvailability(selectedGroup, selectedDayOfWeek)).map(([memberId, slots]) => (
                <div key={memberId} className={styles.memberCard}>
                  <div className={styles.memberInfo}>
                    <h4>Member {memberId}</h4>
                    <span className={styles.slotCount}>{slots.length} khung giờ rảnh</span>
                  </div>
                  <div className={styles.memberSlots}>
                    {slots.map(slot => (
                      <span key={slot} className={styles.availableSlot}>{slot}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Time Slots */}
        {selectedGroup && selectedDayOfWeek && suggestedSlots.length > 0 && (
          <div className={styles.section}>
            <h2>Khung giờ được đề xuất</h2>
            <div className={styles.suggestedSlots}>
              {suggestedSlots.map(slot => {
                const stats = getAvailabilityStats(selectedGroup, selectedDayOfWeek);
                const availableCount = stats.slotCounts[slot] || 0;
                const percentage = Math.round((availableCount / stats.totalMembers) * 100);
                
                return (
                  <div key={slot} className={styles.suggestedSlot}>
                    <div className={styles.slotInfo}>
                      <span className={styles.slotTime}>{slot}</span>
                      <span className={styles.slotStats}>
                        {availableCount}/{stats.totalMembers} thành viên ({percentage}%)
                      </span>
                    </div>
                    <button 
                      className={styles.confirmButton}
                      onClick={() => handleConfirmSchedule(slot)}
                      disabled={isSlotConfirmed(selectedGroup, selectedDayOfWeek, slot)}
                    >
                      {isSlotConfirmed(selectedGroup, selectedDayOfWeek, slot) ? 'Đã chốt' : 'Chốt lịch'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Custom Schedule Option */}
            <div className={styles.customScheduleSection}>
              <div className={styles.customScheduleHeader}>
                <h3>Hoặc tạo lịch riêng</h3>
                <p>Chọn khung giờ khác nếu không phù hợp với đề xuất</p>
              </div>
              <button 
                className={styles.customScheduleButton}
                onClick={handleCustomSchedule}
              >
                Tạo lịch riêng
              </button>
            </div>
          </div>
        )}

        {/* Confirmed Schedules */}
        {Object.keys(confirmedSchedule).length > 0 && (
          <div className={styles.section}>
            <h2>Lịch họp đã chốt</h2>
            <div className={styles.confirmedSchedules}>
              {Object.entries(confirmedSchedule).map(([groupId, dates]) => (
                <div key={groupId} className={styles.scheduleGroup}>
                  <h3>{groups.find(g => g.id === groupId)?.name}</h3>
                  {Object.entries(dates).map(([dayOfWeek, schedule]) => (
                    <div key={dayOfWeek} className={styles.scheduleItem}>
                      <span className={styles.scheduleDate}>{dayOfWeekOptions.find(d => d.value === dayOfWeek)?.label}</span>
                      <span className={styles.scheduleTime}>{schedule.timeSlot}</span>
                      <span className={styles.scheduleStatus}>{schedule.status}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={styles.instructions}>
          <h3>Hướng dẫn sử dụng:</h3>
          <ul>
            <li>Chọn nhóm cần đặt lịch họp</li>
            <li>Chọn thứ trong tuần muốn họp</li>
            <li>Xem tình hình rảnh của từng thành viên</li>
            <li>Chọn khung giờ phù hợp nhất</li>
            <li>Chốt lịch họp chính thức cho nhóm</li>
          </ul>
        </div>
      </div>

      {/* Custom Schedule Modal */}
      {showCustomSchedule && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Tạo lịch riêng</h3>
            <p>Chọn khung giờ cho nhóm <strong>{groups.find(g => g.id === selectedGroup)?.name}</strong> vào <strong>{dayOfWeekOptions.find(d => d.value === selectedDayOfWeek)?.label}</strong></p>
            
            <div className={styles.customTimeSlots}>
              <h4>Chọn khung giờ:</h4>
              <div className={styles.timeSlotsGrid}>
                {mockTimeSlots.map(timeSlot => (
                  <button
                    key={timeSlot}
                    className={`${styles.timeSlot} ${customTimeSlot === timeSlot ? styles.selected : ''}`}
                    onClick={() => handleCustomTimeChange(timeSlot)}
                  >
                    {timeSlot}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowCustomSchedule(false)}
              >
                Hủy
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleConfirmCustomSchedule}
                disabled={!customTimeSlot}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Xác nhận lịch họp</h3>
            <p>Bạn có chắc chắn muốn chốt lịch họp cho nhóm <strong>{groups.find(g => g.id === selectedGroup)?.name}</strong> vào <strong>{dayOfWeekOptions.find(d => d.value === selectedDayOfWeek)?.label}</strong> lúc <strong>{selectedTimeSlot}</strong>?</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowConfirmModal(false)}
              >
                Hủy
              </button>
              <button 
                className={styles.confirmButton}
                onClick={handleFinalConfirm}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
