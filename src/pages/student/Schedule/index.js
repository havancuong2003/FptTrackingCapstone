import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import axiosClient from '../../../utils/axiosClient';
import { getCampusId } from '../../../auth/auth';
import { getCampusById } from '../../../api/campus';
import { getStudentFreeTimeSlotsNew, updateStudentFreeTimeSlotsNew } from '../../../api/schedule';

export default function StudentSchedule() {
  const [loading, setLoading] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [campusSlots, setCampusSlots] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamAvailability, setTeamAvailability] = useState({});
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [meetingSchedule, setMeetingSchedule] = useState(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showOthersSchedule, setShowOthersSchedule] = useState(true);
  const [groupFreeTimeData, setGroupFreeTimeData] = useState(null);

  // Mock data
  const mockTeamMembers = [
    { id: 'SE00001', name: 'Nguyen Van A', role: 'Leader' },
    { id: 'SE00002', name: 'Nguyen Van B', role: 'Developer' },
    { id: 'SE00003', name: 'Nguyen Van C', role: 'Designer' },
    { id: 'SE00004', name: 'Nguyen Van D', role: 'Tester' },
    { id: 'SE00005', name: 'Nguyen Van E', role: 'Documentation' }
  ];


  const dayOfWeekOptions = [
    { value: 'Thứ hai', label: 'Thứ 2' },
    { value: 'Thứ ba', label: 'Thứ 3' },
    { value: 'Thứ tư', label: 'Thứ 4' },
    { value: 'Thứ năm', label: 'Thứ 5' },
    { value: 'Thứ sáu', label: 'Thứ 6' },
    { value: 'Thứ bảy', label: 'Thứ 7' },
    { value: 'Chủ nhật', label: 'Chủ nhật' }
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

  // Load campus slots
  const loadCampusSlots = async () => {
    try {
      const campusId = getCampusId();
      if (!campusId) {
        console.error('Không tìm thấy campusId');
        return;
      }
      const response = await getCampusById(campusId);
      if (response.status === 200 && response.data && response.data.slots) {
        setCampusSlots(response.data.slots);
      }
    } catch (error) {
      console.error('Error loading campus slots:', error);
    }
  };

  // Load group free time data
  const loadGroupFreeTime = async () => {
    try {
      const groupId = localStorage.getItem('student_group_id') || '1';
      const response = await getStudentFreeTimeSlotsNew(groupId);
      if (response.status === 200 && response.data) {
        setGroupFreeTimeData(response.data);
        // Extract team members from response
        if (response.data.students) {
          setTeamMembers(response.data.students.map(student => ({
            id: student.studentId,
            name: `Student ${student.studentId}`,
            role: 'Member',
            freeTimeSlots: student.freeTimeSlots || []
          })));
        }
      }
    } catch (error) {
      console.error('Error loading group free time:', error);
    }
  };

  useEffect(() => {
    loadCampusSlots();
    loadGroupFreeTime();
    checkMeetingSchedule();
  }, []);

  const handleDayOfWeekChange = (dayOfWeek) => {
    setSelectedDayOfWeek(dayOfWeek);
    setSelectedSlotIds([]);
    setShowSuggestions(false);
  };

  const handleSlotToggle = (slotId) => {
    setSelectedSlotIds(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  const handleSubmitAvailability = async () => {
    if (!selectedDayOfWeek || selectedSlotIds.length === 0) {
      alert('Vui lòng chọn thứ và ít nhất một slot rảnh');
      return;
    }

    setLoading(true);
    try {
      const groupId = localStorage.getItem('student_group_id');
      
      if (!groupId) {
        alert('Không tìm thấy thông tin nhóm');
        return;
      }

      const requestData = [{
        slots: selectedSlotIds,
        dayOfWeek: selectedDayOfWeek
      }];

      const response = await updateStudentFreeTimeSlotsNew(groupId, requestData);

      if (response.status === 200) {
        alert('Đã cập nhật lịch rảnh thành công!');
        // Reload data
        await loadGroupFreeTime();
        setSelectedSlotIds([]);
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

      const response = await getStudentFreeTimeSlotsNew(groupId);
      if (response.status === 200 && response.data && response.data.students) {
        // Tìm các slot chung của tất cả thành viên trong ngày được chọn
        const daySlots = {};
        
        response.data.students.forEach(student => {
          const dayData = student.freeTimeSlots.find(ft => ft.dayOfWeek === selectedDayOfWeek);
          if (dayData && dayData.timeSlots) {
            dayData.timeSlots.forEach(slot => {
              if (!daySlots[slot.id]) {
                daySlots[slot.id] = {
                  slot: slot,
                  count: 0
                };
              }
              daySlots[slot.id].count++;
            });
          }
        });
        
        // Lấy các slot xuất hiện nhiều nhất (ít nhất 2 người có)
        const commonSlots = Object.values(daySlots)
          .filter(item => item.count > 1)
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)
          .map(item => item.slot);
        
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
        time: `${suggestedSlot.startAt} - ${suggestedSlot.endAt}`,
        dayOfWeek: selectedDayOfWeek.toLowerCase()
      };
      
      const response = await axiosClient.post(`/Student/Meeting/schedule/finalize/update`, meetingData);
      
      if (response.data) {
        setMeetingSchedule(response.data);
        setIsFinalized(true);
        alert(`Đã xác nhận lịch họp: ${suggestedSlot.nameSlot} (${suggestedSlot.startAt} - ${suggestedSlot.endAt}) ${dayOfWeekOptions.find(d => d.value === selectedDayOfWeek)?.label}`);
      }
    } catch (error) {
      console.error('Error confirming meeting time:', error);
      alert('Có lỗi xảy ra khi xác nhận lịch họp');
    }
  };

  const getMemberAvailability = (memberId, dayOfWeek) => {
    if (!groupFreeTimeData || !groupFreeTimeData.students) return [];
    const student = groupFreeTimeData.students.find(s => s.studentId === memberId);
    if (!student || !student.freeTimeSlots) return [];
    const dayData = student.freeTimeSlots.find(ft => ft.dayOfWeek === dayOfWeek);
    return dayData ? dayData.timeSlots : [];
  };

  const isSlotSelected = (slotId) => {
    return selectedSlotIds.includes(slotId);
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
            <h2>Chọn slot rảnh</h2>
            {campusSlots.length === 0 ? (
              <p>Đang tải danh sách slot...</p>
            ) : (
              <>
                <div className={styles.slotsGrid}>
                  {campusSlots.map(slot => (
                    <label
                      key={slot.id}
                      className={`${styles.slotCheckbox} ${isSlotSelected(slot.id) ? styles.selected : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSlotSelected(slot.id)}
                        onChange={() => handleSlotToggle(slot.id)}
                      />
                      <div className={styles.slotInfo}>
                        <div className={styles.slotName}>{slot.nameSlot}</div>
                        <div className={styles.slotTime}>{slot.startAt} - {slot.endAt}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className={styles.actions}>
                  <button 
                    className={styles.submitButton}
                    onClick={handleSubmitAvailability}
                    disabled={selectedSlotIds.length === 0}
                  >
                    Cập nhật lịch rảnh
                  </button>
                </div>
              </>
            )}
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
                          <span key={slot.id} className={styles.availableSlot}>
                            {slot.nameSlot}: {slot.startAt} - {slot.endAt}
                          </span>
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
                  {selectedSlotIds.length > 0 ? (
                    <div className={styles.availableSlots}>
                      {campusSlots
                        .filter(slot => selectedSlotIds.includes(slot.id))
                        .map(slot => (
                          <span key={slot.id} className={styles.availableSlot}>
                            {slot.nameSlot}: {slot.startAt} - {slot.endAt}
                          </span>
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
                <h3>Slot được đề xuất:</h3>
                <div className={styles.suggestedSlots}>
                  {suggestedSlots.map(slot => (
                    <div key={slot.id} className={styles.suggestedSlot}>
                      <span className={styles.slotTime}>
                        {slot.nameSlot}: {slot.startAt} - {slot.endAt}
                      </span>
                      <button 
                        className={styles.acceptButton}
                        onClick={() => handleAcceptSuggestion(slot)}
                      >
                        Chọn slot này
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