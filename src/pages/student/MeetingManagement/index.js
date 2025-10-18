import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';

export default function StudentMeetingManagement() {
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [userRole, setUserRole] = React.useState('student'); // student, secretary, supervisor

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
      status: 'NotYet', // NotYet, Completed, Cancelled
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
      return { id: 1, name: 'Nguyễn Văn A', role: 'student' };
    } catch (error) {
      return { id: 1, name: 'Nguyễn Văn A', role: 'student' };
    }
  };

  const currentUser = getCurrentUser();
  const isSecretary = currentUser.role === 'secretary';
  const isSupervisor = currentUser.role === 'supervisor';

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
        <h1>Meeting Management</h1>
        <p>Quản lý các buổi họp nhóm</p>
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

              {meeting.attendance && meeting.attendance.length > 0 && (
                <div className={styles.attendanceSection}>
                  <h4>Danh sách tham gia:</h4>
                  <div className={styles.attendanceList}>
                    {meeting.attendance.map((member) => (
                      <div key={member.userId} className={styles.attendanceItem}>
                        <span className={styles.memberName}>{member.name}</span>
                        <span 
                          className={`${styles.attendanceStatus} ${
                            member.status === 'Present' ? styles.present : styles.absent
                          }`}
                        >
                          {member.status === 'Present' ? 'Có mặt' : 'Vắng mặt'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
              
              {isSecretary && meeting.status === 'Completed' && !meeting.minutes && (
                <Button 
                  onClick={() => setSelectedMeeting(meeting)}
                  className={styles.uploadButton}
                >
                  Upload biên bản
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedMeeting && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Upload biên bản họp - Tuần {selectedMeeting.weekNumber}</h3>
            <div className={styles.uploadForm}>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx" 
                className={styles.fileInput}
              />
              <div className={styles.uploadActions}>
                <Button className={styles.uploadButton}>
                  Upload
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => setSelectedMeeting(null)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
