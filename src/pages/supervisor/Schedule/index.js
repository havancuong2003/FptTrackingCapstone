import React from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import axiosClient from '../../../utils/axiosClient';
import { sendMeetingNotification } from '../../../api/email';

export default function SupervisorSchedule() {
  const { groupId: urlGroupId } = useParams();
  const groupId = urlGroupId || '1';
  
  // Lấy thông tin user từ localStorage
  const getCurrentUser = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        return JSON.parse(authUser);
      }
      
    } catch (error) {
      console.error('Error parsing auth_user:', error);
    
    }
  };
  
  const currentUser = getCurrentUser();
  const [loading, setLoading] = React.useState(false);
  const [availableGroups, setAvailableGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState('');
  const [group, setGroup] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [memberSchedules, setMemberSchedules] = React.useState({});
  const [isFinalized, setIsFinalized] = React.useState(false);
  const [finalMeeting, setFinalMeeting] = React.useState(null);
  const [meetingSchedule, setMeetingSchedule] = React.useState(null);
  const [isSupervisor, setIsSupervisor] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  
  // Meeting form data
  const [meetingData, setMeetingData] = React.useState({
    day: '',
    time: '',
    meetingLink: ''
  });

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

  // Fetch available groups for supervisor
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
        setAvailableGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setAvailableGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Load selected group data
  const loadSelectedGroupData = async (groupId) => {
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
            email: student.email,
            role: student.role
          }))
        };
        
        setGroup(formattedGroup);
        setMembers(formattedGroup.members);
        
        
        // Fetch student free time slots
        await fetchStudentFreeTimeSlots(groupId);
      } else {
        console.error('Error fetching group data:', response.data.message);
        setGroup({ id: groupId, name: 'Group ' + groupId });
      }
      
      // Check if meeting schedule exists
      try {
        const scheduleResponse = await axiosClient.get(`/Student/Meeting/schedule/finalize/getById/${groupId}`);
        if (scheduleResponse.data && scheduleResponse.data.id) {
          setMeetingSchedule(scheduleResponse.data);
          setIsFinalized(true);
          
          // Load existing meeting data for editing
          setMeetingData({
            day: scheduleResponse.data.dayOfWeek || '',
            time: scheduleResponse.data.time || '',
            meetingLink: scheduleResponse.data.meetingLink || ''
          });
        }
      } catch (error) {
        console.error('No existing schedule found');
      }
    } catch (error) {
      console.error('Error loading group data:', error);
      setGroup({ id: groupId, name: 'Group ' + groupId });
    } finally {
      setLoading(false);
    }
  };

  // Fetch student free time slots
  const fetchStudentFreeTimeSlots = async (groupId) => {
    try {
      const response = await axiosClient.get(`/Student/Meeting/groups/${groupId}/schedule/free-time`);
      
      if (response.data && response.data.success === 200) {
        const apiData = response.data.data;
        
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
        return memberSchedulesData;
      }
      return {};
    } catch (error) {
      console.error('No student free time slots found');
      return {};
    }
  };

  // Finalize/Update meeting schedule
  const handleFinalizeMeeting = async () => {
    if (!meetingData.day || !meetingData.time || !meetingData.meetingLink) {
      alert('Vui lòng điền đầy đủ thông tin lịch họp');
      return;
    }

    setLoading(true);
    try {
      const meetingScheduleData = {
        id: meetingSchedule?.id || null, // Use existing ID if updating
        isActive: true,
        meetingLink: meetingData.meetingLink,
        time: meetingData.time,
        dayOfWeek: meetingData.day.toLowerCase(),
      };
      
      const response = await axiosClient.post(`/Student/Meeting/schedule/finalize/update`, meetingScheduleData);
      
      if (response.data) {
        setMeetingSchedule(response.data);
        setIsFinalized(true);
        
        // Gửi email thông báo cho sinh viên trong group
        try {
          const studentEmails = members.map(member => member.email).filter(email => email);
          if (studentEmails.length > 0) {
            const dayNames = {
              'monday': 'Thứ 2',
              'tuesday': 'Thứ 3', 
              'wednesday': 'Thứ 4',
              'thursday': 'Thứ 5',
              'friday': 'Thứ 6',
              'saturday': 'Thứ 7',
              'sunday': 'Chủ nhật'
            };
            
            const meetingTime = `${dayNames[meetingData.day.toLowerCase()]} - ${meetingData.time}`;
            
            await sendMeetingNotification({
              recipients: studentEmails,
              subject: `[${group.groupName || 'Capstone Project'}] Thông báo lịch họp nhóm`,
              meetingTime: meetingTime,
              meetingLink: meetingData.meetingLink,
              message: `Giảng viên ${currentUser.name} đã xác nhận lịch họp nhóm. Vui lòng tham gia đúng giờ.`
            });
            
            console.log('Email notification sent to students');
          }
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Không hiển thị lỗi email cho user, chỉ log
        }
        
        alert(isFinalized ? 'Đã cập nhật lịch họp thành công!' : 'Đã xác nhận lịch họp thành công!');
      } else {
        alert('Có lỗi xảy ra khi xác nhận lịch họp');
      }
    } catch (error) {
      console.error('Error finalizing meeting:', error);
      alert('Có lỗi xảy ra khi xác nhận lịch họp');
    } finally {
      setLoading(false);
    }
  };

  // Update meeting data
  const updateMeetingData = (field, value) => {
    setMeetingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (!isEditing) {
      // Khi bắt đầu edit, populate form với data hiện tại
      setMeetingData({
        day: meetingSchedule?.dayOfWeek || '',
        time: meetingSchedule?.time || '',
        meetingLink: meetingSchedule?.meetingLink || ''
      });
    }
    setIsEditing(!isEditing);
  };

  // Save meeting changes
  const saveMeetingChanges = async () => {
    setLoading(true);
    try {
      const finalMeetingData = {
        finalMeeting: {
          day: meetingData.day,
          time: meetingData.time,
          meetingLink: meetingData.meetingLink
        }
      };
      
      const response = await axiosClient.post(`/Student/Meeting/groups/${selectedGroup}/schedule/finalize`, finalMeetingData);
      let data = response.data.data.finalMeeting;
      if (data) {
        // Map response data to meetingSchedule format
        const updatedMeetingSchedule = {
          id: data.id,
          dayOfWeek: data.day,
          time: data.time,
          meetingLink: data.meetingLink,
          createAt: data.finalizedAt,
          isActive: true
        };
        
        setMeetingSchedule(updatedMeetingSchedule);
        setIsFinalized(true);
        setIsEditing(false);
        alert('Đã cập nhật lịch họp thành công!');
      }
    } catch (error) {
      console.error('Error saving meeting changes:', error);
      alert('Có lỗi xảy ra khi cập nhật lịch họp');
    } finally {
      setLoading(false);
    }
  };

  // Toggle finalized status
  const toggleFinalizedStatus = async () => {
    setLoading(true);
    try {
      const meetingScheduleData = {
        id: meetingSchedule?.id || null,
        isActive: !isFinalized, // Toggle active status
        meetingLink: meetingSchedule?.meetingLink || meetingData.meetingLink,
        time: meetingSchedule?.time || meetingData.time,
        dayOfWeek: meetingSchedule?.dayOfWeek || meetingData.day.toLowerCase(),
      };
      
      const response = await axiosClient.post(`/Student/Meeting/schedule/finalize/update`, meetingScheduleData);
      
      if (response.data) {
        setMeetingSchedule(response.data);
        setIsFinalized(!isFinalized);
        setIsEditing(false);
        alert(isFinalized ? 'Đã hủy xác nhận lịch họp!' : 'Đã xác nhận lịch họp!');
      }
    } catch (error) {
      console.error('Error toggling meeting status:', error);
      alert('Có lỗi xảy ra khi thay đổi trạng thái lịch họp');
    } finally {
      setLoading(false);
    }
  };

  // Handle group selection
  const handleGroupSelect = async (groupId) => {
    setSelectedGroup(groupId);
    if (groupId) {
      await loadSelectedGroupData(groupId);
    } else {
      setGroup(null);
      setMembers([]);
      setIsFinalized(false);
      setFinalMeeting(null);
    }
  };

  // Load available groups when component mounts
  React.useEffect(() => {
    fetchAvailableGroups();
  }, []);

  if (loading && !group) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Không cần return sớm nữa, luôn hiển thị group selector

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Lịch họp Nhóm</h1>
        <div className={styles.headerControls}>
          <div className={styles.supervisorBadge}>
            Giảng viên: {currentUser.name}
          </div>
        </div>
      </div>

      {/* Group Selection - Luôn hiển thị */}
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

      {/* Chỉ hiển thị nội dung khi có group được chọn */}
      {selectedGroup && group && (
        <>
          {/* Meeting Schedule Status - Always show at top */}
          <div className={styles.meetingStatusSection}>
            {isFinalized && meetingSchedule ? (
              <div className={styles.finalizedMeeting}>
                <div className={styles.finalizedHeader}>
                  <h3>Lịch họp đã được xác nhận</h3>
                </div>
                <div className={styles.meetingInfo}>
                  {isEditing ? (
                    <div className={styles.editForm}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Chọn thứ</label>
                          <select
                            value={meetingData.day}
                            onChange={(e) => updateMeetingData('day', e.target.value)}
                            className={styles.daySelect}
                          >
                            <option value="">-- Chọn thứ --</option>
                            {daysOfWeek.map(day => (
                              <option key={day.id} value={day.value}>{day.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Giờ bắt đầu</label>
                          <input
                            type="time"
                            value={meetingData.time}
                            onChange={(e) => updateMeetingData('time', e.target.value)}
                            className={styles.timeInput}
                            placeholder="VD: 14:00"
                          />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Link Google Meet</label>
                        <input
                          type="url"
                          value={meetingData.meetingLink}
                          onChange={(e) => updateMeetingData('meetingLink', e.target.value)}
                          className={styles.meetingLinkInput}
                          placeholder="https://meet.google.com/..."
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Thời gian:</span>
                        <span className={styles.infoValue}>{meetingSchedule.dayOfWeek} - {meetingSchedule.time}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Ngày tạo:</span>
                        <span className={styles.infoValue}>{new Date(meetingSchedule.createAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {meetingSchedule.meetingLink && (
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Meeting Link:</span>
                          <button 
                            onClick={() => window.open(meetingSchedule.meetingLink, '_blank')}
                            className={styles.meetingLinkButton}
                          >
                            Click để tham gia
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className={styles.meetingActions}>
                  {isEditing ? (
                    <div className={styles.editActions}>
                      <button 
                        onClick={saveMeetingChanges}
                        className={styles.saveButton}
                        disabled={loading}
                      >
                        {loading ? 'Đang lưu...' : 'Lưu lịch họp'}
                      </button>
                      <button 
                        onClick={toggleEditMode}
                        className={styles.cancelButton}
                        disabled={loading}
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={toggleEditMode}
                      className={styles.editButton}
                    >
                      Chỉnh sửa lịch họp
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.notFinalized}>
                <h3> Lịch họp chưa được xác nhận</h3>
                <p>Vui lòng xem lịch rảnh của các thành viên và xác nhận lịch họp.</p>
              </div>
            )}
          </div>

          <div className={styles.instruction}>
            <span>Xem lịch rảnh của các thành viên và xác nhận lịch họp chung</span>
          </div>

          {/* Student Free Time Slots */}
          <div className={styles.freeTimeSection}>
            <h2>Lịch rảnh của các thành viên</h2>
            
            <div className={styles.freeTimeSlots}>
              {members.map((member) => {
                const memberSchedule = memberSchedules[member.id] || {};
                const hasSchedule = Object.keys(memberSchedule).length > 0;
                
                return (
                  <div key={member.id} className={styles.memberCard}>
                    <div className={styles.memberHeader}>
                      <h3>{member.name}</h3>
                      <div className={styles.memberStatus}>
                        {hasSchedule ? 'Đã cập nhật lịch' : 'Chưa cập nhật lịch'}
                      </div>
                    </div>
                    <div className={styles.memberInfo}>
                      <p>Email: {member.email}</p>
                      <p>Roll Number: {member.rollNumber}</p>
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

          {/* Meeting Finalization/Update Form - Only show when not finalized */}
          {!isFinalized && (
            <div className={styles.meetingSection}>
              <h2>Xác nhận lịch họp</h2>
              
              <div className={styles.meetingForm}>
                <div className={styles.formGroup}>
                  <label>Chọn thứ</label>
                  <select
                    value={meetingData.day}
                    onChange={(e) => updateMeetingData('day', e.target.value)}
                    className={styles.daySelect}
                  >
                    <option value="">-- Chọn thứ --</option>
                    {daysOfWeek.map(day => (
                      <option key={day.id} value={day.value}>{day.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={meetingData.time}
                    onChange={(e) => updateMeetingData('time', e.target.value)}
                    className={styles.timeInput}
                    placeholder="VD: 14:00"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Link Google Meet</label>
                  <input
                    type="url"
                    value={meetingData.meetingLink}
                    onChange={(e) => updateMeetingData('meetingLink', e.target.value)}
                    className={styles.meetingLinkInput}
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={handleFinalizeMeeting}
                    className={styles.finalizeBtn}
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : 'Xác nhận lịch họp'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}