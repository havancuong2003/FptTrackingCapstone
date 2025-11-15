import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';
import Input from '../../../components/Input/Input';
import Textarea from '../../../components/Textarea/Textarea';
import client from '../../../utils/axiosClient';

export default function SupervisorMeetingManagement() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [userInfo, setUserInfo] = React.useState(null);
  const [showMinuteModal, setShowMinuteModal] = React.useState(false);
  const [minuteData, setMinuteData] = React.useState(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [formData, setFormData] = React.useState({
    startAt: '',
    endAt: '',
    attendance: '',
    issue: '',
    meetingContent: '',
    other: ''
  });
  const [formErrors, setFormErrors] = React.useState({});
  const [selectedMeetingGroupInfo, setSelectedMeetingGroupInfo] = React.useState(null);
  const [allGroupsInfo, setAllGroupsInfo] = React.useState({});
  const [selectedGroupId, setSelectedGroupId] = useLocalStorage('supervisorSelectedGroupId', '');
  const [groupOptions, setGroupOptions] = React.useState([]);
  const [meetingIssues, setMeetingIssues] = React.useState([]);
  const [attendanceList, setAttendanceList] = React.useState([]); // [{ studentId, name, rollNumber, attended: boolean, reason: string }]
  const [loadingMinuteModal, setLoadingMinuteModal] = React.useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = React.useState(false);
  const [editingMeeting, setEditingMeeting] = React.useState(null);
  const [scheduleForm, setScheduleForm] = React.useState({
    meetingDate: '',
    startAt: '',
    endAt: '',
    description: ''
  });
  const [weekDays, setWeekDays] = React.useState([]);

  // API Base URL
  const API_BASE_URL = 'https://160.30.21.113:5000/api/v1';

  React.useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await client.get(`${API_BASE_URL}/auth/user-info`);
      
      if (response.data.status === 200) {
        const userData = response.data.data;
        setUserInfo(userData);
        
        // Chỉ load thông tin nhóm để chọn; chưa load meetings
        if (userData.groups && userData.groups.length > 0) {
          await fetchAllGroupsInfo(userData.groups);
          // Nếu đã lưu nhóm trước đó và thuộc danh sách nhóm hiện tại, tự động load meetings
          if (selectedGroupId && userData.groups.includes(Number(selectedGroupId))) {
            await fetchMeetingsByGroup(selectedGroupId);
          }
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLoading(false);
    }
  };

  // Fetch thông tin tất cả các nhóm
  const fetchAllGroupsInfo = async (groupIds) => {
    try {
      const groupsInfo = {};
      for (const groupId of groupIds) {
        try {
          const response = await client.get(`${API_BASE_URL}/Staff/capstone-groups/${groupId}`);
          if (response.data.status === 200) {
            groupsInfo[groupId] = response.data.data;
          }
        } catch (error) {
          console.error(`Error fetching group info for ${groupId}:`, error);
        }
      }
      setAllGroupsInfo(groupsInfo);
      // Build group options cho select
      const options = groupIds.map(gid => ({
        value: String(gid),
        label: groupsInfo[gid]?.projectName ? `${groupsInfo[gid].projectName} (Nhóm ${gid})` : `Nhóm ${gid}`
      }));
      setGroupOptions(options);
    } catch (error) {
      console.error('Error fetching all groups info:', error);
    }
  };

  // Lấy meetings theo nhóm đã chọn
  const fetchMeetingsByGroup = async (groupId) => {
    if (!groupId) return;
    try {
      setLoading(true);
      const response = await client.get(`${API_BASE_URL}/Student/Meeting/group/${groupId}/schedule-dates`);
      if (response.data.status === 200) {
        const meetingsData = response.data.data || [];
        // API đã trả về isMinute, không cần gọi API để check nữa
        const meetingsWithGroup = meetingsData.map(meeting => ({
          ...meeting,
          groupId
        }));
        meetingsWithGroup.sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));
        setMeetings(meetingsWithGroup);
      } else {
        setMeetings([]);
      }
    } catch (error) {
      console.error('Error fetching meetings by group:', error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = (meetingLink) => {
    window.open(meetingLink, '_blank');
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

  const getMeetingStatusText = (status) => {
    switch (status) {
      case 'Completed': return 'Đã họp';
      case 'Past': return 'Chưa họp';
      case 'Upcoming': return 'Sắp diễn ra';
      default: return 'Không xác định';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch { return dateString; }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Todo': return '#6b7280';
      case 'InProgress': return '#3b82f6';
      case 'Done': return '#10b981';
      case 'Review': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Todo': return 'Chưa làm';
      case 'InProgress': return 'Đang làm';
      case 'Done': return 'Hoàn thành';
      case 'Review': return 'Đang review';
      default: return status || 'N/A';
    }
  };

  const meetingIssueColumns = [
    { key: 'name', title: 'Issue' },
    { key: 'deadline', title: 'Hạn', render: (row) => formatDateTime(row.deadline) },
    { 
      key: 'status', 
      title: 'Trạng thái', 
      render: (row) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: getStatusColor(row.status) + '20',
          color: getStatusColor(row.status)
        }}>
          {getStatusText(row.status)}
        </span>
      )
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/supervisor/task/group/${row.groupId}?taskId=${row.id}`);
            }}
            style={{
              background: '#2563EB', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >Chi tiết</button>
        </div>
      )
    }
  ];

  // Fetch group info for meeting
  const fetchMeetingGroupInfo = async (groupId) => {
    try {
      const response = await client.get(`${API_BASE_URL}/Staff/capstone-groups/${groupId}`);
      if (response.data.status === 200) {
        setSelectedMeetingGroupInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
      setSelectedMeetingGroupInfo(null);
    }
  };

  // Fetch meeting issues (tasks) by meeting minute id
  const fetchMeetingIssues = async (meetingMinuteId) => {
    try {
      const res = await client.get(`${API_BASE_URL}/Student/Task/meeting-tasks/${meetingMinuteId}`);
      const data = res.data?.data;
      const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
      return tasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        deadline: t.deadline,
        isActive: t.isActive,
        groupId: t.groupId,
        status: t.status
      }));
    } catch (e) {
      return [];
    }
  };

  // Hàm parse attendance text thành danh sách
  const parseAttendance = (attendanceText, students) => {
    if (!students || students.length === 0) {
      return [];
    }

    if (!attendanceText || !attendanceText.trim()) {
      return students.map(student => ({
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        role: student.role || '',
        attended: false,
        reason: ''
      }));
    }

    const lines = attendanceText.split('\n').filter(line => line.trim());
    const parsed = new Map();

    lines.forEach(line => {
      const match = line.match(/^(.+?)\s*\(([^)]+)\):\s*(.+)$/);
      if (match) {
        const [, name, rollNumber, status] = match;
        const statusLower = status.toLowerCase();
        const isAbsent = statusLower.includes('nghỉ') || statusLower.includes('vắng');
        let reason = '';
        
        if (isAbsent) {
          const reasonMatch = status.match(/(?:nghỉ|vắng)\s*-\s*(.+)/i);
          reason = reasonMatch ? reasonMatch[1].trim() : status.replace(/^(nghỉ|vắng)\s*-?\s*/i, '').trim();
        }
        
        parsed.set(rollNumber.trim(), {
          name: name.trim(),
          rollNumber: rollNumber.trim(),
          attended: !isAbsent,
          reason: reason
        });
      }
    });

    return students.map(student => {
      const existing = parsed.get(student.rollNumber);
      if (existing) {
        return {
          studentId: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          role: student.role || '',
          attended: existing.attended,
          reason: existing.reason
        };
      }
      return {
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        role: student.role || '',
        attended: false,
        reason: ''
      };
    });
  };

  // Hàm format datetime-local từ meeting date và time
  const formatDateTimeLocal = (meetingDate, timeString) => {
    if (!meetingDate || !timeString) return '';
    const date = new Date(meetingDate);
    const [hours, minutes] = timeString.split(':');
    date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  // Hàm mở modal biên bản họp
  const openMinuteModal = async (meeting) => {
    setSelectedMeeting(meeting);
    setMinuteData(null);
    setIsEditing(false);
    setAttendanceList([]);
    setLoadingMinuteModal(true);
    // Không hiện modal ngay, đợi load xong dữ liệu
    
    try {
      // Fetch group info for this meeting
      const groupInfoResponse = await client.get(`${API_BASE_URL}/Staff/capstone-groups/${meeting.groupId}`);
      const currentGroupInfo = groupInfoResponse.data.status === 200 ? groupInfoResponse.data.data : null;
      
      // Set group info vào state
      if (currentGroupInfo) {
        setSelectedMeetingGroupInfo(currentGroupInfo);
      }
      
      // Chỉ fetch meeting minute nếu isMinute === true
      if (meeting.isMinute === true) {
        const meetingMinute = await fetchMeetingMinute(meeting.id);
        if (meetingMinute) {
          setMinuteData(meetingMinute);
          
          // Parse attendance từ text
          const students = Array.isArray(currentGroupInfo?.students) ? currentGroupInfo.students : [];
          const parsedAttendance = parseAttendance(meetingMinute.attendance, students);
          setAttendanceList(parsedAttendance);
          
          setFormData({
            startAt: meetingMinute.startAt ? meetingMinute.startAt.split('T')[0] + 'T' + meetingMinute.startAt.split('T')[1].substring(0, 5) : formatDateTimeLocal(meeting.meetingDate, meeting.startAt),
            endAt: meetingMinute.endAt ? meetingMinute.endAt.split('T')[0] + 'T' + meetingMinute.endAt.split('T')[1].substring(0, 5) : formatDateTimeLocal(meeting.meetingDate, meeting.endAt),
            attendance: meetingMinute.attendance || '',
            issue: '',
            meetingContent: meetingMinute.meetingContent || '',
            other: meetingMinute.other || ''
          });
          setIsEditing(true);
          
          // Load meeting issues bằng meeting minute id
          if (meetingMinute.id) {
            const meetingTasks = await fetchMeetingIssues(meetingMinute.id);
            setMeetingIssues(Array.isArray(meetingTasks) ? meetingTasks : []);
          }
        } else {
          setMinuteData(null);
          setFormData({
            startAt: formatDateTimeLocal(meeting.meetingDate, meeting.startAt),
            endAt: formatDateTimeLocal(meeting.meetingDate, meeting.endAt),
            attendance: '',
            issue: '',
            meetingContent: '',
            other: ''
          });
          setIsEditing(false);
          setMeetingIssues([]);
        }
      } else {
        setMinuteData(null);
        setFormData({
          startAt: formatDateTimeLocal(meeting.meetingDate, meeting.startAt),
          endAt: formatDateTimeLocal(meeting.meetingDate, meeting.endAt),
          attendance: '',
          issue: '',
          meetingContent: '',
          other: ''
        });
        setIsEditing(false);
        setMeetingIssues([]);
      }
    } catch (error) {
      console.error('Error loading meeting minute data:', error);
      setMinuteData(null);
      setMeetingIssues([]);
      setAttendanceList([]);
    } finally {
      setLoadingMinuteModal(false);
      // Chỉ hiện modal sau khi đã load xong tất cả dữ liệu
      setShowMinuteModal(true);
    }
  };

  // Hàm đóng modal
  const closeMinuteModal = () => {
    setShowMinuteModal(false);
    setSelectedMeeting(null);
    setSelectedMeetingGroupInfo(null);
    setMinuteData(null);
    setIsEditing(false);
    setAttendanceList([]);
    setLoadingMinuteModal(false);
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
      if (isEditing && minuteData) {
        // Cập nhật biên bản họp
      const data = {
          id: minuteData.id,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        attendance: formData.attendance,
        issue: formData.issue,
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
          issue: formData.issue,
          meetingContent: formData.meetingContent,
          other: formData.other
        };
        await createMeetingMinute(data);
        alert('Tạo biên bản họp thành công!');
      }
      
      // Refresh meetings data theo nhóm đang chọn
      if (selectedGroupId) {
        await fetchMeetingsByGroup(selectedGroupId);
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
      
      // Refresh meetings data theo nhóm đang chọn
      if (selectedGroupId) {
        await fetchMeetingsByGroup(selectedGroupId);
      }
      
      closeMinuteModal();
    } catch (error) {
      alert('Có lỗi xảy ra khi xóa biên bản họp!');
      console.error('Error deleting meeting minute:', error);
    }
  };

  // Hàm tính các ngày trong tuần của meeting (tuần bắt đầu từ thứ 2)
  const getWeekDays = (meetingDate) => {
    const date = new Date(meetingDate);
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - daysToMonday);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push({
        date: day,
        dateString: day.toISOString().split('T')[0],
        dayName: day.toLocaleDateString('vi-VN', { weekday: 'long' }),
        display: day.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })
      });
    }
    return days;
  };

  // Hàm mở modal sửa thời gian
  const openEditScheduleModal = (meeting) => {
    // Không cho sửa thời gian nếu đã họp
    if (meeting.isMeeting === true) {
      alert('Không thể sửa thời gian cuộc họp đã diễn ra!');
      return;
    }
    
    setEditingMeeting(meeting);
    const weekDaysList = getWeekDays(meeting.meetingDate);
    setWeekDays(weekDaysList);
    
    setScheduleForm({
      meetingDate: meeting.meetingDate.split('T')[0],
      startAt: meeting.startAt || '',
      endAt: meeting.endAt || '',
      description: meeting.description || ''
    });
    setShowEditScheduleModal(true);
  };

  // Hàm đóng modal sửa thời gian
  const closeEditScheduleModal = () => {
    setShowEditScheduleModal(false);
    setEditingMeeting(null);
    setScheduleForm({
      meetingDate: '',
      startAt: '',
      endAt: '',
      description: ''
    });
    setWeekDays([]);
  };

  // Hàm cập nhật thời gian meeting
  const updateMeetingSchedule = async () => {
    if (!editingMeeting) return;
    
    if (!scheduleForm.meetingDate || !scheduleForm.startAt || !scheduleForm.endAt || !scheduleForm.description.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (scheduleForm.startAt >= scheduleForm.endAt) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }

    try {
      const payload = {
        meetingDate: new Date(scheduleForm.meetingDate).toISOString(),
        startAt: scheduleForm.startAt,
        endAt: scheduleForm.endAt,
        description: scheduleForm.description.trim()
      };

      const response = await client.put(
        `${API_BASE_URL}/Student/Meeting/schedule/${editingMeeting.id}`,
        payload
      );

      if (response.data.status === 200) {
        alert('Cập nhật thời gian cuộc họp thành công!');
        closeEditScheduleModal();
        
        // Refresh meetings data
        if (selectedGroupId) {
          await fetchMeetingsByGroup(selectedGroupId);
        }
      } else {
        alert(response.data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error updating meeting schedule:', error);
      alert('Có lỗi xảy ra khi cập nhật thời gian cuộc họp!');
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Đang tải dữ liệu...</div>
      </div>
    );
  }

  // Bỏ trạng thái hiển thị mặc định không meeting; sẽ hiện theo nhóm được chọn

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
          Meeting Management - Supervisor
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
          </div>
        )}
      </div>
      {/* Select nhóm để lọc meetings */}
      <div style={{ margin: '0 0 16px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ fontSize: 14, color: '#374151' }}>Chọn nhóm:</label>
        <select
          value={selectedGroupId}
          onChange={async (e) => {
            const gid = e.target.value;
            setSelectedGroupId(gid);
            setMeetings([]);
            if (gid) await fetchMeetingsByGroup(gid);
          }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', minWidth: 260 }}
        >
          <option value="">-- Chọn nhóm để xem meetings --</option>
          {groupOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Chỉ hiển thị danh sách khi đã chọn nhóm */}
      {selectedGroupId && (
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
                    {formattedDate}
                  </p>
                  {meeting.startAt && meeting.endAt && (
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      Thời gian: {meeting.startAt.substring(0, 5)} - {meeting.endAt.substring(0, 5)}
                    </p>
                  )}
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '12px',
                    color: '#8b5cf6',
                    fontWeight: '500'
                  }}>
                    Nhóm: {allGroupsInfo[meeting.groupId]?.projectName || `Nhóm ${meeting.groupId}`}
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
                    {getMeetingStatusText(status)}
                </span>
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
              
                {meeting.isMeeting !== true && (
                  <Button 
                    onClick={() => openEditScheduleModal(meeting)}
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
                    Sửa thời gian
                  </Button>
                )}
              
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
                    Xem biên bản
                </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      )}

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
                Xem biên bản họp - {selectedMeeting.description}
              </h3>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                <div><strong>Nhóm:</strong> {selectedMeetingGroupInfo?.projectName || `Nhóm ${selectedMeeting.groupId}`}</div>
              </div>
              {/* {minuteData && (
                // <div className={styles.minuteInfo}>
                //   <p><strong>Tạo bởi:</strong> {minuteData?.createBy || 'N/A'}</p>
                //   <p><strong>Ngày tạo:</strong> {minuteData?.createAt ? new Date(minuteData.createAt).toLocaleString('vi-VN') : 'N/A'}</p>
                // </div>
              )} */}
            </div>

            <div className={styles.modalBody}>
              {minuteData ? (
                <div style={{ 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: 8, 
                  padding: 16,
                  marginBottom: 20
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#065f46', marginBottom: 4 }}>
                      <strong>Tạo bởi:</strong> {minuteData?.createBy || 'N/A'}
                    </div>
                    <div style={{ fontSize: 13, color: '#065f46' }}>
                      <strong>Ngày tạo:</strong> {minuteData?.createAt ? new Date(minuteData.createAt).toLocaleString('vi-VN') : 'N/A'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Thời gian</h4>
                      <div style={{ fontSize: 13, color: '#374151' }}>
                        {selectedMeeting?.startAt && selectedMeeting?.endAt ? (
                          <>
                            <div><strong>Bắt đầu:</strong> {selectedMeeting.startAt.substring(0, 5)} - {new Date(selectedMeeting.meetingDate).toLocaleDateString('vi-VN')}</div>
                            <div><strong>Kết thúc:</strong> {selectedMeeting.endAt.substring(0, 5)} - {new Date(selectedMeeting.meetingDate).toLocaleDateString('vi-VN')}</div>
                          </>
                        ) : (
                          <>
                            <div><strong>Bắt đầu:</strong> {minuteData?.startAt ? new Date(minuteData.startAt).toLocaleString('vi-VN') : 'N/A'}</div>
                            <div><strong>Kết thúc:</strong> {minuteData?.endAt ? new Date(minuteData.endAt).toLocaleString('vi-VN') : 'N/A'}</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Danh sách tham gia</h4>
                      {attendanceList.length > 0 ? (
                        <div style={{
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '8px',
                          backgroundColor: 'rgba(255,255,255,0.5)'
                        }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Thành viên</th>
                                <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#374151', width: '100px' }}>Tham gia</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Lý do nghỉ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {attendanceList.map((item) => (
                                <tr key={item.studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px 8px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
                                      {item.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
                                      {item.rollNumber} {item.role && `- ${item.role}`}
                                    </div>
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                    <span style={{
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      backgroundColor: item.attended ? '#d1fae5' : '#fee2e2',
                                      color: item.attended ? '#065f46' : '#991b1b'
                                    }}>
                                      {item.attended ? 'Có' : 'Không'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '6px 8px', fontSize: '12px', color: '#6b7280' }}>
                                    {item.reason || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: 13, 
                          color: '#6b7280', 
                          padding: '12px',
                          background: 'rgba(255,255,255,0.5)',
                          borderRadius: '4px',
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                          Chưa có thông tin điểm danh
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Nội dung cuộc họp</h4>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#374151', 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.5)',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        minHeight: '120px'
                      }}>
                        {minuteData?.meetingContent || 'N/A'}
                      </div>
                    </div>
                    
                    {/* Meeting Issues table thay cho phần vấn đề cần giải quyết */}
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Meeting Issues</h4>
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
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Ghi chú khác</h4>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#374151', 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.5)',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        minHeight: '80px'
                      }}>
                        {minuteData?.other || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  background: '#fef3c7', 
                  border: '1px solid #f59e0b', 
                  borderRadius: 8, 
                  padding: 16,
                  marginBottom: 20
                }}>
                  <p style={{ margin: 0, fontSize: 14, color: '#92400e' }}>
                    Chưa có biên bản họp cho cuộc họp này.
                  </p>
                </div>
              )}

            </div>

            <div className={styles.modalFooter}>
              <Button 
                variant="secondary"
                onClick={closeMinuteModal}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditScheduleModal && editingMeeting && (
        <div 
          className={styles.modalOverlay}
          onClick={closeEditScheduleModal}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
              Sửa thời gian cuộc họp
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Chọn ngày trong tuần <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {weekDays.map((day) => (
                  <button
                    key={day.dateString}
                    type="button"
                    onClick={() => setScheduleForm(prev => ({ ...prev, meetingDate: day.dateString }))}
                    style={{
                      padding: '8px 12px',
                      border: `2px solid ${scheduleForm.meetingDate === day.dateString ? '#8b5cf6' : '#d1d5db'}`,
                      borderRadius: '6px',
                      backgroundColor: scheduleForm.meetingDate === day.dateString ? '#f3e8ff' : 'white',
                      color: scheduleForm.meetingDate === day.dateString ? '#8b5cf6' : '#374151',
                      fontSize: '13px',
                      fontWeight: scheduleForm.meetingDate === day.dateString ? '600' : '400',
                      cursor: 'pointer',
                      minWidth: '100px'
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{day.dayName}</div>
                    <div>{day.display}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Mô tả cuộc họp <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <Input
                type="text"
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả cuộc họp..."
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Thời gian bắt đầu <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <Input
                  type="time"
                  value={scheduleForm.startAt}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, startAt: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Thời gian kết thúc <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <Input
                  type="time"
                  value={scheduleForm.endAt}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, endAt: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary"
                onClick={closeEditScheduleModal}
              >
                Hủy
              </Button>
              <Button 
                onClick={updateMeetingSchedule}
                style={{
                  backgroundColor: '#8b5cf6',
                  color: 'white'
                }}
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}