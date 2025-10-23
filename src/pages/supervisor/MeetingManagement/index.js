import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';

export default function SupervisorMeetingManagement() {
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [attendanceData, setAttendanceData] = React.useState({});

  // Mock data cho meetings
  const mockMeetings = [
    {
      id: 1,
      weekNumber: 1,
      meetingDate: '2024-01-15',
      dayOfWeek: 'Thứ hai',
      startTime: '08:00',
      endTime: '10:00',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'NotYet',
      groupMembers: [
        { id: 1, name: 'Nguyễn Văn A', studentId: 'SE00001' },
        { id: 2, name: 'Trần Thị B', studentId: 'SE00002' },
        { id: 3, name: 'Lê Văn C', studentId: 'SE00003' }
      ],
      attendance: [
        { userId: 1, name: 'Nguyễn Văn A', status: 'Present' },
        { userId: 2, name: 'Trần Thị B', status: 'Absent' },
        { userId: 3, name: 'Lê Văn C', status: 'Present' }
      ],
      minutes: {
        id: 1,
        fileName: 'Meeting_Minutes_Week1.pdf',
        filePath: '/uploads/meeting_minutes/meeting_1.pdf',
        uploadedBy: 'Nguyễn Văn A',
        uploadedAt: '2024-01-15T10:30:00Z'
      }
    },
    {
      id: 2,
      weekNumber: 2,
      meetingDate: '2024-01-22',
      dayOfWeek: 'Thứ hai',
      startTime: '08:00',
      endTime: '10:00',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'Completed',
      groupMembers: [
        { id: 1, name: 'Nguyễn Văn A', studentId: 'SE00001' },
        { id: 2, name: 'Trần Thị B', studentId: 'SE00002' },
        { id: 3, name: 'Lê Văn C', studentId: 'SE00003' }
      ],
      attendance: [
        { userId: 1, name: 'Nguyễn Văn A', status: 'Present' },
        { userId: 2, name: 'Trần Thị B', status: 'Present' },
        { userId: 3, name: 'Lê Văn C', status: 'Absent' }
      ],
      minutes: {
        id: 2,
        fileName: 'Meeting_Minutes_Week2.pdf',
        filePath: '/uploads/meeting_minutes/meeting_2.pdf',
        uploadedBy: 'Trần Thị B',
        uploadedAt: '2024-01-22T10:15:00Z'
      }
    }
  ];

  React.useEffect(() => {
    // Mock API call
    setTimeout(() => {
      setMeetings(mockMeetings);
      setLoading(false);
    }, 1000);
  }, []);

  const getCurrentUser = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        return JSON.parse(authUser);
      }
      return { id: 1, name: 'Supervisor A', role: 'supervisor' };
    } catch (error) {
      return { id: 1, name: 'Supervisor A', role: 'supervisor' };
    }
  };

  const currentUser = getCurrentUser();

  const joinMeeting = (meetingLink) => {
    window.open(meetingLink, '_blank');
  };

  const downloadMinutes = (minutes) => {
    // Mock download
    const link = document.createElement('a');
    link.href = minutes.filePath;
    link.download = minutes.fileName;
    link.click();
  };

  const handleAttendanceChange = (meetingId, userId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [meetingId]: {
        ...prev[meetingId],
        [userId]: status
      }
    }));
  };

  const confirmAttendance = async (meetingId) => {
    // Cảnh báo trước khi xác nhận
    const confirmed = window.confirm(
      'CẢNH BÁO: Sau khi xác nhận, bạn sẽ KHÔNG THỂ chỉnh sửa danh sách tham gia nữa.\n\n' +
      'Vui lòng kiểm tra kỹ danh sách sinh viên tham gia trước khi xác nhận.\n\n' +
      'Bạn có chắc chắn muốn xác nhận?'
    );
    
    if (!confirmed) return;
    
    try {
      alert('Đã xác nhận danh sách tham gia! Danh sách không thể chỉnh sửa nữa.');
      
      // Update meeting status
      setMeetings(prev => prev.map(meeting => 
        meeting.id === meetingId 
          ? { ...meeting, status: 'Completed' }
          : meeting
      ));
    } catch (error) {
      console.error('Error confirming attendance:', error);
      alert('Có lỗi xảy ra khi xác nhận danh sách tham gia');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NotYet': return '#f59e0b';
      case 'Completed': return '#10b981';
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'NotYet': return 'Chưa họp';
      case 'Completed': return 'Đã họp';
      case 'Cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading meetings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meeting Management - Supervisor</h1>
        <p>Quản lý các buổi họp nhóm và xác nhận tham gia</p>
      </div>

      <div className={styles.meetingsList}>
        {meetings.map((meeting) => (
          <div key={meeting.id} className={styles.meetingCard}>
            <div className={styles.meetingHeader}>
              <div className={styles.meetingInfo}>
                <h3>Tuần {meeting.weekNumber} - {meeting.meetingDate}</h3>
                <p className={styles.meetingTime}>
                  {meeting.dayOfWeek} {meeting.startTime} - {meeting.endTime}
                </p>
              </div>
              <div className={styles.meetingStatus}>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(meeting.status) }}
                >
                  {getStatusText(meeting.status)}
                </span>
              </div>
            </div>

            <div className={styles.meetingDetails}>
              <div className={styles.detailRow}>
                <div className={styles.detailItem}>
                  <strong>Link họp:</strong>
                  <a 
                    href={meeting.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.meetingLink}
                  >
                    Tham gia cuộc họp
                  </a>
                </div>
              </div>

              {/* Attendance Management */}
              <div className={styles.attendanceSection}>
                <h4>Quản lý tham gia:</h4>
                {meeting.status === 'Completed' && (
                  <div className={styles.confirmedNotice}>
                    <span className={styles.noticeText}>
                      Đã xác nhận - Không thể chỉnh sửa danh sách tham gia
                    </span>
                  </div>
                )}
                <div className={styles.attendanceList}>
                  {meeting.groupMembers.map((member) => {
                    const currentAttendance = attendanceData[meeting.id]?.[member.id] || 
                                            meeting.attendance?.find(a => a.userId === member.id)?.status || 
                                            'Present';
                    
                    return (
                      <div key={member.id} className={styles.attendanceItem}>
                        <div className={styles.memberInfo}>
                          <span className={styles.memberName}>{member.name}</span>
                          <span className={styles.studentId}>({member.studentId})</span>
                        </div>
                        <div className={styles.attendanceControls}>
                          {meeting.status === 'Completed' ? (
                            <div className={`${styles.attendanceStatus} ${currentAttendance === 'Present' ? styles.statusPresent : styles.statusAbsent}`}>
                              <span className={styles.statusText}>
                                {currentAttendance === 'Present' ? 'Có mặt' : 'Vắng mặt'}
                              </span>
                            </div>
                          ) : (
                            <>
                              <label className={styles.radioLabel}>
                                <input
                                  type="radio"
                                  name={`attendance_${meeting.id}_${member.id}`}
                                  value="Present"
                                  checked={currentAttendance === 'Present'}
                                  onChange={() => handleAttendanceChange(meeting.id, member.id, 'Present')}
                                />
                                <span className={styles.radioText}>Có mặt</span>
                              </label>
                              <label className={styles.radioLabel}>
                                <input
                                  type="radio"
                                  name={`attendance_${meeting.id}_${member.id}`}
                                  value="Absent"
                                  checked={currentAttendance === 'Absent'}
                                  onChange={() => handleAttendanceChange(meeting.id, member.id, 'Absent')}
                                />
                                <span className={styles.radioText}>Vắng mặt</span>
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {meeting.minutes && (
                <div className={styles.minutesSection}>
                  <h4>Biên bản họp:</h4>
                  <div className={styles.minutesInfo}>
                    <p><strong>File:</strong> {meeting.minutes.fileName}</p>
                    <p><strong>Upload bởi:</strong> {meeting.minutes.uploadedBy}</p>
                    <p><strong>Thời gian:</strong> {new Date(meeting.minutes.uploadedAt).toLocaleString('vi-VN')}</p>
                    <Button 
                      onClick={() => downloadMinutes(meeting.minutes)}
                      className={styles.downloadButton}
                    >
                      Tải xuống biên bản
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.meetingActions}>
              {meeting.status === 'NotYet' && (
                <Button 
                  onClick={() => joinMeeting(meeting.meetingLink)}
                  className={styles.joinButton}
                >
                  Tham gia họp
                </Button>
              )}
              
              {meeting.status === 'NotYet' && (
                <Button 
                  onClick={() => confirmAttendance(meeting.id)}
                  className={styles.confirmButton}
                >
                  Xác nhận đã họp
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
