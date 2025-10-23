import React from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import axiosClient from '../../../utils/axiosClient';

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
      return {
        id: 1,
        name: 'Supervisor A',
        role: 'supervisor'
      };
    } catch (error) {
      console.error('Error parsing auth_user:', error);
      return {
        id: 1,
        name: 'Supervisor A',
        role: 'supervisor'
      };
    }
  };
  
  const currentUser = getCurrentUser();
  const [loading, setLoading] = React.useState(false);
  const [availableGroups, setAvailableGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState('');
  const [group, setGroup] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [isFinalized, setIsFinalized] = React.useState(false);
  const [finalMeeting, setFinalMeeting] = React.useState(null);
  const [isSupervisor, setIsSupervisor] = React.useState(true);
  
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
        
        console.log("Loaded group data:", formattedGroup);
      } else {
        console.error('Error fetching group data:', response.data.message);
        setGroup({ id: groupId, name: 'Group ' + groupId });
      }
      
      // Check if schedule is finalized
      try {
        const scheduleResponse = await axiosClient.get(`/groups/${groupId}/schedule`);
        if (scheduleResponse.data && scheduleResponse.data.isFinalized) {
          setIsFinalized(true);
          setFinalMeeting(scheduleResponse.data.finalMeeting);
          
          // Load existing meeting data for editing
          if (scheduleResponse.data.finalMeeting) {
            setMeetingData({
              day: scheduleResponse.data.finalMeeting.day || '',
              time: scheduleResponse.data.finalMeeting.time || '',
              meetingLink: scheduleResponse.data.finalMeeting.meetingLink || ''
            });
          }
        }
      } catch (error) {
        console.log('No existing schedule found');
      }
    } catch (error) {
      console.error('Error loading group data:', error);
      setGroup({ id: groupId, name: 'Group ' + groupId });
    } finally {
      setLoading(false);
    }
  };

  // Fetch student free time slots
  const fetchStudentFreeTimeSlots = async () => {
    try {
      const response = await axiosClient.get(`/groups/${groupId}/schedule/free-time`);
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.log('No student free time slots found');
      return [];
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
      const response = await axiosClient.post(`/groups/${selectedGroup}/schedule/finalize`, {
        finalMeeting: {
          day: meetingData.day,
          time: meetingData.time,
          meetingLink: meetingData.meetingLink
        }
      });
      
      if (response.data.success) {
        setIsFinalized(true);
        setFinalMeeting(response.data.data.finalMeeting);
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

  if (!group && !selectedGroup) {
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
      </div>
    );
  }

  if (!group) {
    return <div className={styles.error}>Group not found</div>;
  }

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

      {!isFinalized ? (
        <div className={styles.notFinalized}>
          Lịch họp chưa được xác nhận. Vui lòng xem lịch rảnh của các thành viên và xác nhận lịch họp.
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
        <span>Xem lịch rảnh của các thành viên và xác nhận lịch họp chung</span>
      </div>

      {/* Student Free Time Slots */}
      <div className={styles.freeTimeSection}>
        <h2>Lịch rảnh của các thành viên</h2>
        
        <div className={styles.freeTimeSlots}>
          {members.map((member) => (
            <div key={member.id} className={styles.memberCard}>
              <div className={styles.memberHeader}>
                <h3>{member.name}</h3>
                <span className={styles.memberRole}>{member.role}</span>
              </div>
              <div className={styles.memberInfo}>
                <p>Email: {member.email}</p>
                <p>Roll Number: {member.rollNumber}</p>
              </div>
              <div className={styles.memberSchedule}>
                <p>Lịch rảnh đã được gửi từ student</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meeting Finalization/Update Form */}
      <div className={styles.meetingSection}>
        <h2>{isFinalized ? 'Cập nhật lịch họp' : 'Xác nhận lịch họp'}</h2>
        
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
              {loading ? 'Đang xử lý...' : (isFinalized ? 'Cập nhật lịch họp' : 'Xác nhận lịch họp')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}