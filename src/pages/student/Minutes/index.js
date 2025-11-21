import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import client from '../../../utils/axiosClient';

export default function StudentMinutes() {
  const [minutes, setMinutes] = React.useState([]);
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [createModal, setCreateModal] = React.useState(false);
  const [userRole, setUserRole] = React.useState(null);
  const [hasGroup, setHasGroup] = React.useState(false);
  const [newMinutes, setNewMinutes] = React.useState({
    meetingId: '',
    content: '',
    issues: '',
    actions: '',
    attachments: []
  });

  // Kiểm tra groupId trước
  React.useEffect(() => {
    const checkGroup = async () => {
      try {
        // Kiểm tra từ localStorage trước
        const studentGroupId = localStorage.getItem('student_group_id');
        if (studentGroupId) {
          setHasGroup(true);
          return;
        }
        
        // Nếu không có trong localStorage, kiểm tra từ API
        const userResponse = await client.get("/auth/user-info");
        const userInfo = userResponse?.data?.data;
        
        if (userInfo?.groups && userInfo.groups.length > 0) {
          setHasGroup(true);
        } else {
          setHasGroup(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking group:', error);
        setHasGroup(false);
        setLoading(false);
      }
    };
    
    checkGroup();
  }, []);

  React.useEffect(() => {
    // Chỉ fetch data nếu có group
    if (!hasGroup) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy groupId và user role
        let groupId = localStorage.getItem('student_group_id');
        if (!groupId) {
          const userResponse = await client.get("/auth/user-info");
          const userInfo = userResponse?.data?.data;
          if (userInfo?.groups && userInfo.groups.length > 0) {
            groupId = userInfo.groups[0];
          } else {
            setMeetings([]);
            setMinutes([]);
            setLoading(false);
            return;
          }
        }
        
        // Lấy role của user trong group
        try {
          const groupResponse = await client.get(`/Staff/capstone-groups/${groupId}`);
          if (groupResponse.data.status === 200) {
            const groupData = groupResponse.data.data;
            const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
            const student = groupData.students?.find(s => s.id === currentUser.id);
            if (student) {
              setUserRole(student.role === "Student" ? 'Member' : (student.role || 'Member'));
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
        
        // Gọi API thật để lấy meetings
        const meetingsResponse = await client.get(`/Student/Meeting/group/${groupId}/schedule-dates`);
        if (meetingsResponse.data.status === 200) {
          const apiData = meetingsResponse.data.data;
          const meetingsData = Array.isArray(apiData) ? apiData : [];
          
          // Map meetings từ API
          const mappedMeetings = meetingsData
            .filter(meeting => meeting.isMeeting === true)
            .map(meeting => ({
              id: meeting.id,
              topic: meeting.description || 'Meeting',
              datetime: meeting.meetingDate ? `${meeting.meetingDate}T${meeting.time || '00:00:00'}` : new Date().toISOString(),
              participants: [],
              status: new Date(meeting.meetingDate) < new Date() ? 'completed' : 'upcoming',
              meetingDate: meeting.meetingDate,
              time: meeting.time
            }));
          
          setMeetings(mappedMeetings);
        } else {
          setMeetings([]);
        }
        
        // Gọi API thật để lấy minutes (nếu có API endpoint)
        // TODO: Thay thế bằng API endpoint thật khi có
        try {
          const minutesResponse = await client.get(`/Student/Meeting/group/${groupId}/minutes`);
          if (minutesResponse.data.status === 200) {
            const minutesData = minutesResponse.data.data || [];
            setMinutes(Array.isArray(minutesData) ? minutesData : []);
          } else {
            setMinutes([]);
          }
        } catch (error) {
          // Nếu API chưa có, để mảng rỗng
          console.log('Minutes API not available yet');
          setMinutes([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setMeetings([]);
        setMinutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hasGroup]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openCreateModal = () => {
    setCreateModal(true);
  };

  const createMinutes = async () => {
    if (!newMinutes.meetingId || !newMinutes.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const groupId = localStorage.getItem('student_group_id');
      if (!groupId) {
        alert('Group ID not found');
        return;
      }
      
      // Gọi API thật để tạo minutes
      // TODO: Thay thế bằng API endpoint thật khi có
      const minutesData = {
        meetingId: parseInt(newMinutes.meetingId),
        content: newMinutes.content.trim(),
        issues: newMinutes.issues ? newMinutes.issues.split('\n').filter(i => i.trim()) : [],
        actions: newMinutes.actions ? newMinutes.actions.split('\n').filter(a => a.trim()) : [],
        attachments: newMinutes.attachments || []
      };
      
      // const response = await client.post(`/Student/Meeting/group/${groupId}/minutes`, minutesData);
      // if (response.data.status === 200) {
      //   alert('Meeting minutes created successfully!');
      //   setCreateModal(false);
      //   setNewMinutes({
      //     meetingId: '',
      //     content: '',
      //     issues: '',
      //     actions: '',
      //     attachments: []
      //   });
      //   // Reload data
      //   window.location.reload();
      // } else {
      //   alert('Error creating minutes: ' + response.data.message);
      // }
      
      // Tạm thời hiển thị thông báo
      alert('Meeting minutes API endpoint is not available yet. Please contact administrator.');
    } catch (error) {
      console.error('Error creating minutes:', error);
      alert('Error creating minutes: ' + error.message);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return { color: '#059669', text: 'Confirmed', icon: '✓' };
      case 'pending':
        return { color: '#d97706', text: 'Pending', icon: '⏳' };
      case 'draft':
        return { color: '#64748b', text: 'Draft', icon: '📝' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '?' };
    }
  };

  // Nếu không có group, hiển thị thông báo
  if (!hasGroup && !loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>You are not in any group</div>
          <div className={styles.emptyMessage}>Please contact the supervisor to be added to a group.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading meeting minutes...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meeting Minutes</h1>
        {userRole === 'Secretary' && hasGroup && (
          <Button onClick={openCreateModal}>
            Create New Minutes
          </Button>
        )}
      </div>
      
      {userRole !== 'Secretary' && hasGroup && (
        <div className={styles.roleWarning}>
          <p>⚠️ Only students with the "Secretary" role can create meeting minutes.</p>
        </div>
      )}
      
      <div className={styles.minutesList}>
        {minutes.map((minute) => {
          const statusInfo = getStatusInfo(minute.status);
          return (
            <div key={minute.id} className={styles.minuteCard}>
              <div className={styles.minuteHeader}>
                <div className={styles.minuteInfo}>
                  <h3>{minute.meetingTopic}</h3>
                  <p className={styles.minuteDate}>{formatDate(minute.date)}</p>
                </div>
                <div className={styles.minuteStatus}>
                  <span 
                    className={styles.statusIcon}
                    style={{ color: statusInfo.color }}
                  >
                    {statusInfo.icon}
                  </span>
                  <span 
                    className={styles.statusText}
                    style={{ color: statusInfo.color }}
                  >
                    {statusInfo.text}
                  </span>
                </div>
              </div>
              
              <div className={styles.minuteContent}>
                <div className={styles.contentSection}>
                  <h4>Content</h4>
                  <p>{minute.content}</p>
                </div>
                
                {minute.issues && minute.issues.length > 0 && (
                  <div className={styles.contentSection}>
                    <h4>Issues</h4>
                    <ul>
                      {minute.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {minute.actions && minute.actions.length > 0 && (
                  <div className={styles.contentSection}>
                    <h4>Actions</h4>
                    <ul>
                      {minute.actions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {minute.attachments && minute.attachments.length > 0 && (
                  <div className={styles.contentSection}>
                    <h4>Attachments</h4>
                    <ul>
                      {minute.attachments.map((attachment, index) => (
                        <li key={index}>
                          <a href="#" className={styles.attachmentLink}>
                            {attachment}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className={styles.minuteFooter}>
                <div className={styles.minuteMeta}>
                  <span>Created by: {minute.createdByName}</span>
                  <span>Participants: {minute.participants.length} people</span>
                </div>
                <div className={styles.minuteActions}>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                  {minute.status === 'draft' && userRole === 'Secretary' && (
                    <Button size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)}>
        <div className={styles.createModal}>
          <h2>Create Meeting Minutes</h2>
          
          <div className={styles.formGroup}>
            <label>Select Meeting</label>
            <select
              value={newMinutes.meetingId}
              onChange={(e) => setNewMinutes({...newMinutes, meetingId: e.target.value})}
              className={styles.select}
            >
              <option value="">Select a meeting</option>
              {meetings.filter(m => m.status === 'completed').map(meeting => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.topic} - {formatDate(meeting.datetime)}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Meeting Content</label>
            <textarea
              value={newMinutes.content}
              onChange={(e) => setNewMinutes({...newMinutes, content: e.target.value})}
              placeholder="Describe what was discussed in the meeting..."
              className={styles.textarea}
              rows={4}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Issues (one per line)</label>
            <textarea
              value={newMinutes.issues}
              onChange={(e) => setNewMinutes({...newMinutes, issues: e.target.value})}
              placeholder="List any issues or concerns raised..."
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Action Items (one per line)</label>
            <textarea
              value={newMinutes.actions}
              onChange={(e) => setNewMinutes({...newMinutes, actions: e.target.value})}
              placeholder="List action items and who is responsible..."
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={createMinutes}>
              Create Minutes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
