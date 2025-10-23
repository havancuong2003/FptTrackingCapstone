import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import Textarea from '../../../components/Textarea/Textarea';
import axios from 'axios';

export default function StudentMeetingManagement() {
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [userRole, setUserRole] = React.useState('student'); // student, secretary, supervisor
  const [showMinuteModal, setShowMinuteModal] = React.useState(false);
  const [minuteData, setMinuteData] = React.useState(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState(null);
  const [formData, setFormData] = React.useState({
    startAt: '',
    endAt: '',
    attendance: '',
    issue: '',
    meetingContent: '',
    other: ''
  });
  const [formErrors, setFormErrors] = React.useState({});

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
      ]
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
      ]
    },
    {
      id: 3,
      weekNumber: 3,
      meetingDate: '2024-01-29',
      dayOfWeek: 'Thứ hai',
      startTime: '08:00',
      endTime: '10:00',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'Completed',
      attendance: [
        { userId: 1, name: 'Nguyễn Văn A', status: 'Present' },
        { userId: 2, name: 'Trần Thị B', status: 'Present' },
        { userId: 3, name: 'Lê Văn C', status: 'Present' }
      ]
    }
  ];

  React.useEffect(() => {
    // Mock API call
    setTimeout(() => {
      setMeetings(mockMeetings);
      setLoading(false);
    }, 1000);
    
    // Lấy thông tin user
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    // Mock data để test UI - Bạn có thể thay đổi roleInGroup để test
    // 'Secretary' - có quyền tạo/sửa/xóa
    // 'Student' - chỉ xem được
    setUserInfo({ id: 1, name: 'Nguyễn Văn A', role: 'Student', roleInGroup: 'Secretary', groupId: 1 });
    setUserRole('Secretary');
  };

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
  const isSecretary = userRole === 'Secretary';
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

  // Hàm lấy biên bản họp
  const fetchMeetingMinute = async (meetingId) => {
    // Mock data để test UI
    if (meetingId === 2) {
      return {
        id: 1,
        startAt: "2024-01-22T08:00:00.000Z",
        endAt: "2024-01-22T10:00:00.000Z",
        createBy: "Nguyễn Văn A",
        createAt: "2024-01-22T10:15:00.000Z",
        attendance: "Nguyễn Văn A, Trần Thị B, Lê Văn C",
        issue: "Thảo luận về tiến độ dự án và các vấn đề kỹ thuật",
        meetingContent: "1. Báo cáo tiến độ tuần 2\n2. Thảo luận về database design\n3. Phân công nhiệm vụ cho tuần 3\n4. Giải quyết các vấn đề kỹ thuật",
        other: "Cần liên hệ với mentor để hỏi về authentication flow"
      };
    }
    // Meeting 3 chưa có biên bản để test tạo mới
    return null;
  };

  // Hàm tạo biên bản họp
  const createMeetingMinute = async (data) => {
    // Mock để test UI
    console.log('Creating meeting minute:', data);
    return { status: 200, message: 'Success' };
  };

  // Hàm cập nhật biên bản họp
  const updateMeetingMinute = async (data) => {
    // Mock để test UI
    console.log('Updating meeting minute:', data);
    return { status: 200, message: 'Success' };
  };

  // Hàm xóa biên bản họp
  const deleteMeetingMinute = async (minuteId) => {
    // Mock để test UI
    console.log('Deleting meeting minute:', minuteId);
    return { status: 200, message: 'Success' };
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

  // Hàm mở modal biên bản họp
  const openMinuteModal = async (meeting) => {
    console.log('Opening modal for meeting:', meeting);
    setSelectedMeeting(meeting);
    setShowMinuteModal(true);
    
    // Kiểm tra xem đã có biên bản chưa
    const existingMinute = await fetchMeetingMinute(meeting.id);
    console.log('Existing minute:', existingMinute);
    if (existingMinute) {
      setMinuteData(existingMinute);
      setFormData({
        startAt: existingMinute.startAt ? existingMinute.startAt.split('T')[0] + 'T' + existingMinute.startAt.split('T')[1].substring(0, 5) : '',
        endAt: existingMinute.endAt ? existingMinute.endAt.split('T')[0] + 'T' + existingMinute.endAt.split('T')[1].substring(0, 5) : '',
        attendance: existingMinute.attendance || '',
        issue: existingMinute.issue || '',
        meetingContent: existingMinute.meetingContent || '',
        other: existingMinute.other || ''
      });
      setIsEditing(true);
    } else {
      setMinuteData(null);
      setFormData({
        startAt: '',
        endAt: '',
        attendance: '',
        issue: '',
        meetingContent: '',
        other: ''
      });
      setIsEditing(false);
    }
  };

  // Hàm đóng modal
  const closeMinuteModal = () => {
    setShowMinuteModal(false);
    setSelectedMeeting(null);
    setMinuteData(null);
    setIsEditing(false);
    setFormData({
      startAt: '',
      endAt: '',
      attendance: '',
      issue: '',
      meetingContent: '',
      other: ''
    });
    setFormErrors({});
  };

  // Hàm xử lý thay đổi input
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Xóa lỗi khi user nhập
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Hàm validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.startAt) {
      errors.startAt = 'Thời gian bắt đầu là bắt buộc';
    }
    
    if (!formData.endAt) {
      errors.endAt = 'Thời gian kết thúc là bắt buộc';
    }
    
    if (!formData.meetingContent) {
      errors.meetingContent = 'Nội dung cuộc họp là bắt buộc';
    }
    
    if (formData.startAt && formData.endAt && new Date(formData.startAt) >= new Date(formData.endAt)) {
      errors.endAt = 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Hàm lưu biên bản họp
  const saveMeetingMinute = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      const data = {
        meetingId: selectedMeeting.id,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        attendance: formData.attendance,
        issue: formData.issue,
        meetingContent: formData.meetingContent,
        other: formData.other
      };
      
      if (isEditing && minuteData) {
        await updateMeetingMinute(data);
        alert('Cập nhật biên bản họp thành công!');
      } else {
        await createMeetingMinute(data);
        alert('Tạo biên bản họp thành công!');
      }
      
      closeMinuteModal();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu biên bản họp!');
      console.error('Error saving meeting minute:', error);
    }
  };

  // Hàm xóa biên bản họp
  const handleDeleteMinute = async () => {
    if (!minuteData || !window.confirm('Bạn có chắc chắn muốn xóa biên bản họp này?')) {
      return;
    }
    
    try {
      await deleteMeetingMinute(minuteData.id);
      alert('Xóa biên bản họp thành công!');
      closeMinuteModal();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa biên bản họp!');
      console.error('Error deleting meeting minute:', error);
    }
  };

  // Debug state
  console.log('Current state:', { 
    showMinuteModal, 
    selectedMeeting, 
    userRole, 
    isSecretary 
  });

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
        <div className={styles.roleToggle}>
          <Button 
            onClick={() => {
              const newRole = userRole === 'Secretary' ? 'Student' : 'Secretary';
              setUserRole(newRole);
              setUserInfo(prev => ({ ...prev, roleInGroup: newRole }));
            }}
            className={styles.toggleButton}
          >
            Toggle Role: {userRole === 'Secretary' ? 'Secretary → Student' : 'Student → Secretary'}
          </Button>
        </div>
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
              
              {meeting.status === 'Completed' && (
                <Button 
                  onClick={() => openMinuteModal(meeting)}
                  className={styles.minuteButton}
                >
                  {isSecretary ? 'Quản lý biên bản' : 'Xem biên bản'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showMinuteModal && selectedMeeting && (
        <div className={styles.modalOverlay} onClick={closeMinuteModal}>
          <div className={styles.minuteModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {isEditing ? 'Chỉnh sửa biên bản họp' : 'Tạo biên bản họp'} - Tuần {selectedMeeting.weekNumber}
              </h3>
              {minuteData && (
                <div className={styles.minuteInfo}>
                  <p><strong>Tạo bởi:</strong> {minuteData.createBy}</p>
                  <p><strong>Ngày tạo:</strong> {new Date(minuteData.createAt).toLocaleString('vi-VN')}</p>
                </div>
              )}
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Thời gian bắt đầu *</label>
                  <Input
                    type="datetime-local"
                    value={formData.startAt}
                    onChange={(e) => handleInputChange('startAt', e.target.value)}
                    error={formErrors.startAt}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Thời gian kết thúc *</label>
                  <Input
                    type="datetime-local"
                    value={formData.endAt}
                    onChange={(e) => handleInputChange('endAt', e.target.value)}
                    error={formErrors.endAt}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Danh sách tham gia</label>
                <Textarea
                  value={formData.attendance}
                  onChange={(e) => handleInputChange('attendance', e.target.value)}
                  placeholder="Ghi lại những ai tham gia cuộc họp..."
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Nội dung cuộc họp *</label>
                <Textarea
                  value={formData.meetingContent}
                  onChange={(e) => handleInputChange('meetingContent', e.target.value)}
                  placeholder="Ghi lại nội dung được trình bày trong cuộc họp..."
                  rows={6}
                  error={formErrors.meetingContent}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Vấn đề cần giải quyết</label>
                <Textarea
                  value={formData.issue}
                  onChange={(e) => handleInputChange('issue', e.target.value)}
                  placeholder="Ghi lại những vấn đề có trong cuộc họp..."
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Ghi chú khác</label>
                <Textarea
                  value={formData.other}
                  onChange={(e) => handleInputChange('other', e.target.value)}
                  placeholder="Những gì ngoài lề cuộc họp..."
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              {isSecretary && (
                <>
                  {isEditing && minuteData && (
                    <Button 
                      variant="danger"
                      onClick={handleDeleteMinute}
                      className={styles.deleteButton}
                    >
                      Xóa biên bản
                    </Button>
                  )}
                  <Button 
                    onClick={saveMeetingMinute}
                    className={styles.saveButton}
                  >
                    {isEditing ? 'Cập nhật' : 'Tạo biên bản'}
                  </Button>
                </>
              )}
              <Button 
                variant="secondary"
                onClick={closeMinuteModal}
              >
                {isSecretary ? 'Hủy' : 'Đóng'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
