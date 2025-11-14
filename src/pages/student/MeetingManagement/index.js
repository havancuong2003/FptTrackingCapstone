import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import Textarea from '../../../components/Textarea/Textarea';
import client from '../../../utils/axiosClient';
import DataTable from '../../../components/DataTable/DataTable';
import { useNavigate } from 'react-router-dom';

export default function StudentMeetingManagement() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [userRole, setUserRole] = React.useState('Student'); // Student, Secretary, Supervisor
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
  const [meetingMinutes, setMeetingMinutes] = React.useState({}); // Lưu trữ meeting minutes theo meetingId
  // Meeting Issues state
  const [meetingIssues, setMeetingIssues] = React.useState([]);
  const [showIssueModal, setShowIssueModal] = React.useState(false);
  const [issueForm, setIssueForm] = React.useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'low',
    deadline: '',
    reviewer: ''
  });
  const [assigneeOptions, setAssigneeOptions] = React.useState([]);
  const [reviewerOptions, setReviewerOptions] = React.useState([]);

  // API Base URL
  const API_BASE_URL = 'https://160.30.21.113:5000/api/v1';

  React.useEffect(() => {
    // Lấy thông tin user và meetings
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await client.get(`${API_BASE_URL}/auth/user-info`);
        
      if (response.data.status === 200) {
        const userData = response.data.data;
        setUserInfo(userData);
        setUserRole(userData.roleInGroup || userData.role);
        
        // Lấy danh sách meetings sau khi có thông tin user
        if (userData.groups && userData.groups.length > 0) {
          await Promise.all([
            fetchMeetings(userData.groups[0]),
            fetchAssigneesByGroup(userData.groups[0]),
            fetchReviewersByGroup(userData.groups[0])
          ]);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLoading(false);
    }
  };

  // Lấy danh sách assignee từ group (sinh viên trong nhóm)
  const fetchAssigneesByGroup = async (groupId) => {
    try {
      const res = await client.get(`${API_BASE_URL}/Staff/capstone-groups/${groupId}`);
      if (res.data.status === 200) {
        const students = Array.isArray(res.data.data?.students) ? res.data.data.students : [];
        setAssigneeOptions(students.map(s => ({ value: String(s.id), label: s.name })));
      }
    } catch {}
  };

  // Lấy reviewer (supervisors + students) theo group để chọn reviewer cho issue
  const fetchReviewersByGroup = async (groupId) => {
    try {
      const res = await client.get(`${API_BASE_URL}/Staff/capstone-groups/${groupId}`);
      if (res.data.status === 200) {
        const groupData = res.data.data;
        const reviewers = [];
        if (Array.isArray(groupData.supervisorsInfor)) {
          groupData.supervisorsInfor.forEach(sp => reviewers.push({ value: String(sp.id), label: `${sp.name} (Supervisor)` }));
        }
        if (Array.isArray(groupData.students)) {
          groupData.students.forEach(st => reviewers.push({ value: String(st.id), label: `${st.name} (Student)` }));
        }
        setReviewerOptions(reviewers);
      }
    } catch {}
  };

  // Lấy danh sách meetings
  const fetchMeetings = async (groupId) => {
    try {
      const response = await client.get(`${API_BASE_URL}/Student/Meeting/group/${groupId}/schedule-dates`);
      
      if (response.data.status === 200) {
        const meetingsData = response.data.data;
        
        if (meetingsData && meetingsData.length > 0) {
          // API đã trả về isMinute, không cần gọi API để check nữa
          setMeetings(meetingsData);
        } else {
          setMeetings([]);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLoading(false);
    }
  };

  const isSecretary = userRole === 'Secretary';
  const isSupervisor = userInfo?.role === 'Supervisor';

  const joinMeeting = (meetingLink) => {
    window.open(meetingLink, '_blank');
  };

  // Hàm toggle isMeeting status
  const toggleMeetingStatus = async (meeting) => {
    if (!isSecretary) return;
    
    try {
      const newStatus = !meeting.isMeeting;
      setMeetings(prevMeetings => {
        const updatedMeetings = prevMeetings.map(m => 
          m.id === meeting.id ? { ...m, isMeeting: newStatus } : m
        );
        return updatedMeetings;
      });
      
      
      const response = await client.put(
        `${API_BASE_URL}/Student/Meeting/update-is-meeting/${meeting.id}`,
        newStatus,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.status === 200) {
      
        // Refresh meetings data để đảm bảo sync với server
        if (userInfo?.groups && userInfo.groups.length > 0) {
          await fetchMeetings(userInfo.groups[0]);
        }
        alert(newStatus ? 'Đã đánh dấu buổi họp đã diễn ra!' : 'Đã hủy đánh dấu buổi họp!');
      } else {
        // Rollback nếu API không thành công
        setMeetings(prevMeetings => 
          prevMeetings.map(m => 
            m.id === meeting.id ? { ...m, isMeeting: !newStatus } : m
          )
        );
      }
    } catch (error) {
      console.error('Error updating meeting status:', error);
      // Rollback khi có lỗi
      setMeetings(prevMeetings => 
        prevMeetings.map(m => 
          m.id === meeting.id ? { ...m, isMeeting: meeting.isMeeting } : m
        )
      );
      alert('Có lỗi xảy ra khi cập nhật trạng thái buổi họp!');
    }
  };

  const downloadMinutes = (minutes) => {
    // Mock download
    const link = document.createElement('a');
    link.href = minutes.filePath;
    link.download = minutes.fileName;
    link.click();
  };

  // Hàm lấy biên bản họp
  const fetchMeetingMinute = async (meetingDateId) => {
    try {
      const response = await client.get(`${API_BASE_URL}/MeetingMinute?meetingDateId=${meetingDateId}`);
      if (response.data.status === 200) {
        return response.data.data; // Có thể là null nếu chưa có biên bản
      }
      return null;
    } catch (error) {
      console.error('Error fetching meeting minute:', error);
      return null;
    }
  };

  // Hàm tạo biên bản họp
  const createMeetingMinute = async (data) => {
    try {
      const response = await client.post(`${API_BASE_URL}/MeetingMinute`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating meeting minute:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  };

  // Hàm cập nhật biên bản họp
  const updateMeetingMinute = async (data) => {
    try {
      const response = await client.put(`${API_BASE_URL}/MeetingMinute`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating meeting minute:', error);
      throw error;
    }
  };

  // Hàm xóa biên bản họp
  const deleteMeetingMinute = async (minuteId) => {
    try {
      const response = await client.delete(`${API_BASE_URL}/MeetingMinute/${minuteId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting meeting minute:', error);
      throw error;
    }
  };

  // Hàm xác định màu sắc cho meeting card
  const getMeetingCardColor = (meeting) => {
    const now = new Date();
    const meetingDate = new Date(meeting.meetingDate);
    
    // Nếu đã họp -> màu xanh nhạt
    if (meeting.isMeeting === true) {
      return '#f0fdf4'; // Xanh nhạt
    }
    
    // Nếu chưa họp và gần nhất -> màu vàng nhạt
    if (meetingDate > now) {
      const timeDiff = meetingDate - now;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) { // Trong vòng 7 ngày tới
        return '#fefce8'; // Vàng nhạt
      }
    }
    
    // Mặc định -> màu trắng
    return '#ffffff';
  };

  // Hàm xác định border color cho meeting card
  const getMeetingCardBorderColor = (meeting) => {
    const now = new Date();
    const meetingDate = new Date(meeting.meetingDate);
    
    // Nếu đã họp -> border xanh
    if (meeting.isMeeting === true) {
      return '#10b981'; // Xanh lá
    }
    
    // Nếu chưa họp và gần nhất -> border vàng
    if (meetingDate > now) {
      const timeDiff = meetingDate - now;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) { // Trong vòng 7 ngày tới
        return '#f59e0b'; // Vàng
      }
    }
    
    // Mặc định -> border xám
    return '#e5e7eb';
  };

  // Hàm xác định trạng thái meeting
  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const meetingDate = new Date(meeting.meetingDate);
    
    if (meeting.isMeeting === true) {
      return 'Completed';
    } else if (meetingDate < now) {
      return 'Past';
    } else {
      return 'Upcoming';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Completed': return 'Đã họp';
      case 'Past': return 'Sắp diễn ra';
      case 'Upcoming': return 'Sắp diễn ra';
      default: return 'Không xác định';
    }
  };

  // Hàm mở modal biên bản họp
  const openMinuteModal = async (meeting) => {
    setSelectedMeeting(meeting);
    setShowMinuteModal(true);
    
    // Chỉ fetch meeting minute nếu isMinute === true
    if (meeting.isMinute === true) {
      const meetingMinute = await fetchMeetingMinute(meeting.id);
      if (meetingMinute) {
        setMinuteData(meetingMinute);
        setFormData({
          startAt: meetingMinute.startAt ? meetingMinute.startAt.split('T')[0] + 'T' + meetingMinute.startAt.split('T')[1].substring(0, 5) : '',
          endAt: meetingMinute.endAt ? meetingMinute.endAt.split('T')[0] + 'T' + meetingMinute.endAt.split('T')[1].substring(0, 5) : '',
          attendance: meetingMinute.attendance || '',
          issue: '',
          meetingContent: meetingMinute.meetingContent || '',
          other: meetingMinute.other || ''
        });
        setIsEditing(true);
      } else {
        // Nếu API báo có minute nhưng fetch không ra, reset form
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
    } else {
      // Chưa có minute, tạo mới
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

    // Load meeting issues
    await fetchMeetingIssues(meeting.id);
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
    
    if (!formData.startAt || !formData.startAt.trim()) {
      errors.startAt = 'Thời gian bắt đầu là bắt buộc';
    }
    
    if (!formData.endAt || !formData.endAt.trim()) {
      errors.endAt = 'Thời gian kết thúc là bắt buộc';
    }
    
    if (!formData.attendance || !formData.attendance.trim()) {
      errors.attendance = 'Danh sách tham gia là bắt buộc';
    }
    
    if (!formData.meetingContent || !formData.meetingContent.trim()) {
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
      if (isEditing && minuteData) {
        // Cập nhật biên bản họp
      const data = {
          id: minuteData.id,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        attendance: formData.attendance,
          issue: '',
        meetingContent: formData.meetingContent,
        other: formData.other
      };
        await updateMeetingMinute(data);
        alert('Cập nhật biên bản họp thành công!');
      } else {
        // Tạo biên bản họp mới
        const data = {
          meetingDateId: selectedMeeting.id,
          startAt: new Date(formData.startAt).toISOString(),
          endAt: new Date(formData.endAt).toISOString(),
          attendance: formData.attendance,
          issue: '',
          meetingContent: formData.meetingContent,
          other: formData.other
        };
        await createMeetingMinute(data);
        alert('Tạo biên bản họp thành công!');
      }
      
      // Refresh meetings data
      if (userInfo?.groups && userInfo.groups.length > 0) {
        await fetchMeetings(userInfo.groups[0]);
      }
      
      closeMinuteModal();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu biên bản họp!');
      console.error('Error saving meeting minute:', error);
    }
  };

  // Fetch meeting issues (tasks) by meetingId
  const fetchMeetingIssues = async (meetingId) => {
    try {
      const res = await client.get(`${API_BASE_URL}/Student/Task/meeting-tasks/${meetingId}`);
      const data = res.data?.data;
      const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
      setMeetingIssues(tasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        deadline: t.deadline,
        isActive: t.isActive,
        groupId: t.groupId
      })));
    } catch (e) {
      setMeetingIssues([]);
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch { return dateString; }
  };

  const meetingIssueColumns = [
    { key: 'name', title: 'Issue' },
    { key: 'deadline', title: 'Hạn', render: (row) => formatDateTime(row.deadline) },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/student/task-detail/${row.groupId}?taskId=${row.id}`);
            }}
            style={{
              background: '#2563EB', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >Chi tiết</button>
        </div>
      )
    }
  ];

  const openCreateIssueModal = () => {
    setIssueForm({ title: '', description: '', assignee: '', priority: 'low', deadline: '', reviewer: '' });
    setShowIssueModal(true);
  };

  const createMeetingIssue = async () => {
    if (!selectedMeeting) return;
    if (!issueForm.title || !issueForm.assignee || !issueForm.deadline) {
      alert('Vui lòng nhập đủ tiêu đề, assignee và deadline');
      return;
    }
    try {
      const payload = {
        groupId: userInfo?.groups?.[0],
        name: issueForm.title,
        description: issueForm.description || '',
        taskType: 'meeting',
        endAt: new Date(issueForm.deadline).toISOString(),
        status: 'Todo',
        priority: issueForm.priority === 'high' ? 'High' : issueForm.priority === 'medium' ? 'Medium' : 'Low',
        process: '0',
        meetingId: selectedMeeting.id,
        deliverableId: 0,
        assignedUserId: parseInt(issueForm.assignee),
        reviewerId: issueForm.reviewer ? parseInt(issueForm.reviewer) : 0
      };
      const res = await client.post('/Student/Task/create', payload);
      if (res.data?.status === 200) {
        setShowIssueModal(false);
        await fetchMeetingIssues(selectedMeeting.id);
        
        // Gửi email thông báo cho người được assign
        try {
          const { sendIssueAssignmentEmail } = await import('../../../email/meetings');
          const assigneeOption = assigneeOptions.find(a => a.value.toString() === issueForm.assignee);
          
          // Lấy email từ students trong group
          if (assigneeOption && userInfo?.groups?.[0]) {
            try {
              const groupRes = await client.get(`${API_BASE_URL}/Staff/capstone-groups/${userInfo.groups[0]}`);
              if (groupRes.data.status === 200) {
                const students = groupRes.data.data?.students || [];
                const assignedStudent = students.find(s => s.id.toString() === issueForm.assignee);
                
                if (assignedStudent?.email) {
                  const systemUrl = `${window.location.origin}`;
                  // Lấy taskId từ response nếu có, nếu không thì dùng meetingId
                  const issueDetailUrl = res.data?.data?.id 
                    ? `${window.location.origin}/student/tasks/${userInfo.groups[0]}?taskId=${res.data.data.id}`
                    : null;
                  
                  await sendIssueAssignmentEmail({
                    recipientEmail: assignedStudent.email,
                    recipientName: assigneeOption.label,
                    issueTitle: issueForm.title,
                    issueDescription: issueForm.description || '',
                    deadline: issueForm.deadline,
                    meetingTopic: selectedMeeting.description || 'Cuộc họp',
                    secretaryName: userInfo?.name || 'Thư ký nhóm',
                    groupName: userInfo?.groups?.[0] ? `Nhóm ${userInfo.groups[0]}` : 'Capstone Project',
                    detailUrl: issueDetailUrl,
                    systemUrl: systemUrl
                  });
                }
              }
            } catch (fetchError) {
              console.error('Error fetching student email:', fetchError);
            }
          }
        } catch (emailError) {
          console.error('Error sending issue assignment email:', emailError);
          // Không block flow nếu email lỗi
        }
        
        alert('Tạo issue cho meeting thành công!');
      } else {
        alert(res.data?.message || 'Tạo issue thất bại');
      }
    } catch (e) {
      alert(e?.message || 'Tạo issue thất bại');
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
      
      // Refresh meetings data
      if (userInfo?.groups && userInfo.groups.length > 0) {
        await fetchMeetings(userInfo.groups[0]);
      }
      
      closeMinuteModal();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa biên bản họp!');
      console.error('Error deleting meeting minute:', error);
    }
  };


  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Đang tải dữ liệu...</div>
      </div>
    );
  }

  // Hiển thị thông báo nếu không có meetings
  if (!loading && meetings.length === 0) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meeting Management</h1>
        <p>Quản lý các buổi họp nhóm</p>
          {userInfo && (
            <div className={styles.userInfo}>
              <p><strong>Người dùng:</strong> {userInfo.name}</p>
              <p><strong>Vai trò:</strong> {userInfo.roleInGroup || userInfo.role}</p>
            </div>
          )}
        </div>
        <div className={styles.noData}>
          <h3>Không có cuộc họp nào</h3>
          <p>Hiện tại chưa có cuộc họp nào được lên lịch cho nhóm của bạn.</p>
          {!userInfo && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              <p><strong>Lỗi:</strong> Không thể lấy thông tin người dùng. Vui lòng kiểm tra:</p>
              <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                <li>Đã đăng nhập chưa?</li>
                <li>Token có hợp lệ không?</li>
                <li>API có hoạt động không?</li>
              </ul>
          <Button 
            onClick={() => {
                  setLoading(true);
                  fetchUserInfo();
            }}
                style={{ marginTop: '10px' }}
          >
                Thử lại
          </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{
        background: 'white',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '24px', 
          fontWeight: '600',
          color: '#1f2937'
        }}>
          Meeting Management
        </h1>
        <p style={{ 
          margin: '0 0 16px 0', 
          fontSize: '14px', 
          color: '#6b7280'
        }}>
          Quản lý các buổi họp nhóm
        </p>
        
        {userInfo && (
          <div className={styles.userInfo} style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '14px', color: '#374151' }}>
              <strong>Người dùng:</strong> {userInfo.name}
            </span>
            <span style={{ fontSize: '14px', color: '#374151' }}>
              <strong>Vai trò:</strong> {userInfo.roleInGroup || userInfo.role}
            </span>
            <span style={{ fontSize: '14px', color: '#374151' }}>
              <strong>Nhóm:</strong> {userInfo.groups && userInfo.groups.length > 0 ? userInfo.groups[0] : 'N/A'}
            </span>
          </div>
        )}
      </div>

      <div className={styles.meetingsList}>
        {meetings.map((meeting) => {
          const meetingDate = new Date(meeting.meetingDate);
          const formattedDate = meetingDate.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const status = getMeetingStatus(meeting);
          const cardColor = getMeetingCardColor(meeting);
          
          const borderColor = getMeetingCardBorderColor(meeting);
          
          return (
            <div 
              key={meeting.id} 
              className={styles.meetingCard}
              style={{ 
                backgroundColor: cardColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
            <div className={styles.meetingHeader}>
              <div className={styles.meetingInfo}>
                  <h3 style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {meeting.description}
                  </h3>
                  <p className={styles.meetingTime} style={{
                    margin: '0 0 8px 0',
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    {formattedDate} - {meeting.time}
                  </p>
              </div>
              <div className={styles.meetingStatus} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  className={styles.statusBadge}
                    style={{ 
                      backgroundColor: meeting.isMeeting === true ? '#10b981' : 
                                     status === 'Upcoming' ? '#f59e0b' : '#6b7280',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}
                  >
                    {getStatusText(status)}
                </span>
                
                {isSecretary && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>Đã họp:</span>
                    <label style={{ 
                      position: 'relative', 
                      display: 'inline-block', 
                      width: '32px', 
                      height: '18px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={meeting.isMeeting === true}
                        onChange={() => toggleMeetingStatus(meeting)}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: meeting.isMeeting === true ? '#10b981' : '#ccc',
                        borderRadius: '18px',
                        transition: '0.3s',
                        cursor: 'pointer'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '14px',
                          width: '14px',
                          left: meeting.isMeeting === true ? '18px' : '2px',
                          bottom: '2px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: '0.3s'
                        }}></span>
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

              <div className={styles.meetingDetails} style={{ marginBottom: '12px' }}>
                <div className={styles.detailRow} style={{ marginBottom: '8px' }}>
                  <div className={styles.detailItem} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <strong style={{ fontSize: '13px', color: '#374151' }}>Link họp:</strong>
                  <a 
                    href={meeting.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.meetingLink}
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: '500',
                        padding: '2px 6px',
                        backgroundColor: '#dbeafe',
                        borderRadius: '4px'
                      }}
                  >
                    Tham gia cuộc họp
                  </a>
                </div>
              </div>

                {meeting.isMinute === true && (
                  <div className={styles.minutesSection} style={{
                    padding: '8px 10px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '13px', 
                      fontWeight: '600',
                      color: '#065f46'
                    }}>
                      Biên bản họp:
                    </h4>
                    <div className={styles.minutesInfo} style={{ fontSize: '12px', color: '#047857' }}>
                      <p style={{ margin: '2px 0' }}>
                        Đã có biên bản họp cho cuộc họp này
                      </p>
                  </div>
                </div>
              )}
            </div>

              <div className={styles.meetingActions} style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <Button 
                  onClick={() => joinMeeting(meeting.meetingLink)}
                  className={styles.joinButton}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Tham gia họp
                </Button>
                
                {meeting.isMinute === true ? (
                  <Button 
                    onClick={() => openMinuteModal(meeting)}
                    className={styles.minuteButton}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {isSecretary ? 'Quản lý biên bản' : 'Xem biên bản'}
                  </Button>
                ) : isSecretary ? (
                  <Button 
                    onClick={() => openMinuteModal(meeting)}
                    className={styles.minuteButton}
                    style={{
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Tạo biên bản họp
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {showMinuteModal && selectedMeeting && (
        <div 
          className={styles.modalOverlay} 
          onClick={closeMinuteModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            className={styles.minuteModal} 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '1000px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className={styles.modalHeader}>
              <h3>
                {isEditing ? 'Chỉnh sửa biên bản họp' : 'Tạo biên bản họp'} - {selectedMeeting.description}
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
                <label>Danh sách tham gia *</label>
                <Textarea
                  value={formData.attendance}
                  onChange={(e) => handleInputChange('attendance', e.target.value)}
                  placeholder="Ghi lại những ai tham gia cuộc họp..."
                  rows={3}
                  style={formErrors.attendance ? { borderColor: '#dc2626' } : {}}
                />
                {formErrors.attendance && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {formErrors.attendance}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Nội dung cuộc họp *</label>
                <Textarea
                  value={formData.meetingContent}
                  onChange={(e) => handleInputChange('meetingContent', e.target.value)}
                  placeholder="Ghi lại nội dung được trình bày trong cuộc họp..."
                  rows={6}
                  style={formErrors.meetingContent ? { borderColor: '#dc2626' } : {}}
                />
                {formErrors.meetingContent && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {formErrors.meetingContent}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ margin: 0 }}>Meeting Issues</label>
                  <button
                    onClick={openCreateIssueModal}
                    style={{ background: '#10B981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                  >Thêm issue</button>
                </div>
                <div style={{ marginTop: 8, maxWidth: '100%', overflowX: 'hidden' }}>
                  <DataTable
                    columns={meetingIssueColumns}
                    data={meetingIssues}
                    loading={loading}
                    emptyMessage="Chưa có issue nào"
                    className={styles.compactTable || ''}
                  />
                </div>
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

      {showIssueModal && (
        <div 
          className={styles.modalOverlay}
          onClick={() => setShowIssueModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={styles.taskModal}
          >
            <h3>Tạo Meeting Issue</h3>
            <div className={styles.formGroup}>
              <label>Tiêu đề <span className={styles.required}>*</span></label>
              <input
                className={styles.input}
                type="text"
                value={issueForm.title}
                onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                placeholder="Nhập tiêu đề issue"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mô tả</label>
              <textarea
                className={styles.textarea}
                rows={3}
                value={issueForm.description}
                onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                placeholder="Mô tả ngắn"
              />
            </div>
            <div className={styles.taskFormRow}>
              <div className={styles.formGroup}>
                <label>Assignee <span className={styles.required}>*</span></label>
                <select
                  className={styles.select}
                  value={issueForm.assignee}
                  onChange={(e) => setIssueForm({ ...issueForm, assignee: e.target.value })}
                >
                  <option value="">Chọn người thực hiện</option>
                  {assigneeOptions.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Reviewer</label>
                <select
                  className={styles.select}
                  value={issueForm.reviewer}
                  onChange={(e) => setIssueForm({ ...issueForm, reviewer: e.target.value })}
                >
                  <option value="">Chọn người review (tuỳ chọn)</option>
                  {reviewerOptions.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Priority</label>
                <select
                  className={styles.select}
                  value={issueForm.priority}
                  onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Deadline <span className={styles.required}>*</span></label>
              <input
                className={styles.input}
                type="datetime-local"
                value={issueForm.deadline}
                onChange={(e) => setIssueForm({ ...issueForm, deadline: e.target.value })}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.modalButton} ${styles.secondary}`} onClick={() => setShowIssueModal(false)}>Hủy</button>
              <button className={`${styles.modalButton} ${styles.primary}`} onClick={createMeetingIssue}>Tạo issue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
