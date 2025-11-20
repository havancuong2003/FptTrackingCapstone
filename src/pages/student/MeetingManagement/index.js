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
  const [pendingIssues, setPendingIssues] = React.useState([]); // Lưu các issue tạm chưa tạo
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
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [attendanceList, setAttendanceList] = React.useState([]); // [{ studentId, name, rollNumber, attended: boolean, reason: string }]
  const [loadingMinuteModal, setLoadingMinuteModal] = React.useState(false);
  const [previousMinuteData, setPreviousMinuteData] = React.useState(null); // Biên bản họp trước đó
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

  // Hàm lấy thông tin nhóm
  const fetchGroupInfo = async (groupId) => {
    try {
      const response = await client.get(`${API_BASE_URL}/Staff/capstone-groups/${groupId}`);
      if (response.data.status === 200) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching group info:', error);
      return null;
    }
  };

  // Hàm parse attendance text thành danh sách
  const parseAttendance = (attendanceText, students) => {
    if (!students || students.length === 0) {
      return [];
    }

    if (!attendanceText || !attendanceText.trim()) {
      // Nếu chưa có attendance text, tạo danh sách mặc định với tất cả đều không tham gia
      return students.map(student => ({
        studentId: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        role: student.role || '',
        attended: false,
        reason: ''
      }));
    }

    // Parse format: "Name (RollNumber): Tham gia" hoặc "Name (RollNumber): Nghỉ - Lý do"
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
          // Extract reason after "Nghỉ - " or "vắng - "
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

    // Tạo danh sách từ students, nếu có trong parsed thì dùng, không thì mặc định tham gia
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

  // Hàm format attendance list thành text
  const formatAttendance = (attendanceList) => {
    if (!attendanceList || attendanceList.length === 0) return '';
    
    return attendanceList.map(item => {
      if (item.attended) {
        return `${item.name} (${item.rollNumber}): Tham gia`;
      } else {
        return `${item.name} (${item.rollNumber}): Nghỉ - ${item.reason || 'Không có lý do'}`;
      }
    }).join('\n');
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
      case 'Past': return 'Sắp diễn ra';
      case 'Upcoming': return 'Sắp diễn ra';
      default: return 'Không xác định';
    }
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
    // Reset tất cả state trước
    setSelectedMeeting(meeting);
    setMinuteData(null);
    setIsEditing(false);
    setGroupInfo(null);
    setAttendanceList([]);
    setPreviousMinuteData(null); // Reset biên bản trước đó
    setFormData({
      startAt: '',
      endAt: '',
      attendance: '',
      issue: '',
      meetingContent: '',
      other: ''
    });
    setFormErrors({});
    setLoadingMinuteModal(true);
    setShowMinuteModal(true);
    
    try {
      // Fetch group info
      if (userInfo?.groups && userInfo.groups.length > 0) {
        const groupData = await fetchGroupInfo(userInfo.groups[0]);
        if (groupData) {
          setGroupInfo(groupData);
          const students = Array.isArray(groupData.students) ? groupData.students : [];
          
          // Chỉ fetch meeting minute nếu isMinute === true
          if (meeting.isMinute === true) {
            const meetingMinute = await fetchMeetingMinute(meeting.id);
            if (meetingMinute) {
              setMinuteData(meetingMinute);
              
              // Parse attendance từ text
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
            } else {
              // Nếu API báo có minute nhưng fetch không ra, reset form
              setMinuteData(null);
              const defaultAttendance = parseAttendance('', students);
              setAttendanceList(defaultAttendance);
              setFormData({
                startAt: formatDateTimeLocal(meeting.meetingDate, meeting.startAt),
                endAt: formatDateTimeLocal(meeting.meetingDate, meeting.endAt),
                attendance: '',
                issue: '',
                meetingContent: '',
                other: ''
              });
              setIsEditing(false);
            }
          } else {
            // Chưa có minute, tạo mới với default time
            setMinuteData(null);
            const defaultAttendance = parseAttendance('', students);
            setAttendanceList(defaultAttendance);
            setFormData({
              startAt: formatDateTimeLocal(meeting.meetingDate, meeting.startAt),
              endAt: formatDateTimeLocal(meeting.meetingDate, meeting.endAt),
              attendance: '',
              issue: '',
              meetingContent: '',
              other: ''
            });
            setIsEditing(false);
            
            // Tìm và load biên bản họp trước đó (nếu có)
            if (meetings && meetings.length > 0) {
              // Sắp xếp meetings theo ngày, tìm meeting trước meeting hiện tại có biên bản
              const sortedMeetings = [...meetings].sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));
              const currentMeetingIndex = sortedMeetings.findIndex(m => m.id === meeting.id);
              
              // Tìm meeting trước đó có isMinute === true
              for (let i = currentMeetingIndex - 1; i >= 0; i--) {
                const prevMeeting = sortedMeetings[i];
                if (prevMeeting.isMinute === true) {
                  try {
                    const prevMinute = await fetchMeetingMinute(prevMeeting.id);
                    if (prevMinute) {
                      setPreviousMinuteData(prevMinute);
                      break;
                    }
                  } catch (error) {
                    console.error('Error fetching previous meeting minute:', error);
                  }
                }
              }
            }
          }
        }
      }

      // Load meeting issues
      if (meeting.isMinute === true) {
        // Nếu đã có minute, fetch meeting minute để lấy id
        const meetingMinute = await fetchMeetingMinute(meeting.id);
        if (meetingMinute && meetingMinute.id) {
          // Load issues bằng meeting minute id
          const meetingTasks = await fetchMeetingIssues(meetingMinute.id);
          setMeetingIssues(Array.isArray(meetingTasks) ? meetingTasks : []);
        } else {
          setMeetingIssues([]);
        }
        setPendingIssues([]); // Reset pending issues khi xem biên bản đã có
      } else {
        // Nếu chưa có minute (tạo mới), load cả incomplete tasks của nhóm
        if (isSecretary && userInfo?.groups && userInfo.groups.length > 0) {
          try {
            const groupId = userInfo.groups[0];
            const incompleteTasks = await fetchIncompleteTasks(groupId);
            // Chỉ hiển thị incomplete tasks, không fetch meeting tasks vì chưa có minute
            setMeetingIssues(Array.isArray(incompleteTasks) ? incompleteTasks : []);
            setPendingIssues([]); // Reset pending issues khi mở modal mới
          } catch (error) {
            console.error('Error loading tasks:', error);
            setMeetingIssues([]);
          }
        } else {
          setMeetingIssues([]);
        }
      }
    } finally {
      setLoadingMinuteModal(false);
    }
  };

  // Hàm đóng modal
  const closeMinuteModal = () => {
    setShowMinuteModal(false);
    setSelectedMeeting(null);
    setMinuteData(null);
    setIsEditing(false);
    setGroupInfo(null);
    setAttendanceList([]);
    setLoadingMinuteModal(false);
    setPendingIssues([]); // Reset pending issues khi đóng modal
    setPreviousMinuteData(null); // Reset biên bản trước đó
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

  // Hàm xử lý thay đổi attendance
  const handleAttendanceChange = (index, field, value) => {
    setAttendanceList(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      // Nếu đánh dấu là tham gia, xóa lý do
      if (field === 'attended' && value === true) {
        updated[index].reason = '';
      }
      return updated;
    });
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
    
    if (!attendanceList || attendanceList.length === 0) {
      errors.attendance = 'Danh sách tham gia là bắt buộc';
    } else {
      // Check nếu có người nghỉ nhưng không có lý do
      const missingReasons = attendanceList.filter(item => !item.attended && !item.reason.trim());
      if (missingReasons.length > 0) {
        errors.attendance = 'Vui lòng nhập lý do cho những người không tham gia';
      }
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
    // Format attendance từ attendanceList thành text trước khi validate
    const attendanceText = formatAttendance(attendanceList);
    setFormData(prev => ({ ...prev, attendance: attendanceText }));
    
    if (!validateForm()) {
      return;
    }
    
    try {
      let meetingMinuteId;
      
      if (isEditing && minuteData) {
        // Cập nhật biên bản họp
        const data = {
          id: minuteData.id,
          startAt: new Date(formData.startAt).toISOString(),
          endAt: new Date(formData.endAt).toISOString(),
          attendance: attendanceText,
          issue: '',
          meetingContent: formData.meetingContent,
          other: formData.other
        };
        const response = await updateMeetingMinute(data);
        meetingMinuteId = minuteData.id;
        alert('Cập nhật biên bản họp thành công!');
      } else {
        // Tạo biên bản họp mới
        const data = {
          meetingDateId: selectedMeeting.id,
          startAt: new Date(formData.startAt).toISOString(),
          endAt: new Date(formData.endAt).toISOString(),
          attendance: attendanceText,
          issue: '',
          meetingContent: formData.meetingContent,
          other: formData.other
        };
        const response = await createMeetingMinute(data);
        // Lấy meeting minute id từ response
        meetingMinuteId = response?.data?.id || response?.data?.data?.id;
        if (!meetingMinuteId) {
          // Nếu không có trong response, fetch lại để lấy id
          const meetingMinute = await fetchMeetingMinute(selectedMeeting.id);
          meetingMinuteId = meetingMinute?.id;
        }
        alert('Tạo biên bản họp thành công!');
      }
      
      // Tạo các issue tạm sau khi có meeting minute id
      if (meetingMinuteId && pendingIssues.length > 0) {
        try {
          await createPendingIssues(meetingMinuteId);
          // Refresh danh sách issues sau khi tạo
          const meetingTasks = await fetchMeetingIssues(meetingMinuteId);
          setMeetingIssues(Array.isArray(meetingTasks) ? meetingTasks : []);
        } catch (error) {
          console.error('Error creating pending issues:', error);
          alert('Đã lưu biên bản họp nhưng có lỗi khi tạo một số issue. Vui lòng kiểm tra lại.');
        }
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

  // Fetch meeting issues (tasks) by meeting minute id
  const fetchMeetingIssues = async (meetingMinuteId) => {
    try {
      const res = await client.get(`${API_BASE_URL}/Student/Task/meeting-tasks/${meetingMinuteId}`);
      const data = res.data?.data;
      const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
      const mappedTasks = tasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        deadline: t.deadline,
        isActive: t.isActive,
        groupId: t.groupId,
        status: t.status
      }));
      return mappedTasks;
    } catch (e) {
      return [];
    }
  };

  // Fetch incomplete tasks for the group
  const fetchIncompleteTasks = async (groupId) => {
    if (!groupId) {
      console.error('GroupId is required to fetch incomplete tasks');
      return [];
    }
    try {
      const res = await client.get(`${API_BASE_URL}/Student/Task/Incomplete/${groupId}`);
      // API trả về { status: 200, message: "...", data: [...] }
      const data = res.data?.data;
      const tasks = Array.isArray(data) ? data : [];
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
      console.error('Error fetching incomplete tasks:', e);
      return [];
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
    { 
      key: 'name', 
      title: 'Issue',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{row.name}</span>
          {row.isPending && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              Chưa lưu
            </span>
          )}
        </div>
      )
    },
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
          {row.isPending ? (
            // Nếu là issue tạm, hiển thị nút xóa
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Bạn có chắc chắn muốn xóa issue này?')) {
                  setPendingIssues(prev => prev.filter(issue => issue.id !== row.id));
                  setMeetingIssues(prev => prev.filter(issue => issue.id !== row.id));
                }
              }}
              style={{
                background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >Xóa</button>
          ) : (
            // Nếu là issue đã tạo, hiển thị nút chi tiết
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/student/task-detail/${row.groupId}?taskId=${row.id}`);
              }}
              style={{
                background: '#2563EB', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >Chi tiết</button>
          )}
        </div>
      )
    }
  ];

  const openCreateIssueModal = () => {
    setIssueForm({ title: '', description: '', assignee: '', priority: 'low', deadline: '', reviewer: '' });
    setShowIssueModal(true);
  };

  // Tạo issue: nếu đã có biên bản thì tạo luôn, nếu chưa thì lưu tạm
  const createMeetingIssue = async () => {
    if (!selectedMeeting) return;
    if (!issueForm.title || !issueForm.assignee || !issueForm.deadline) {
      alert('Vui lòng nhập đủ tiêu đề, assignee và deadline');
      return;
    }

    // Validation deadline phải lớn hơn thời gian hiện tại (so sánh ở local time)
    if (issueForm.deadline) {
      const deadlineDate = new Date(issueForm.deadline);
      const currentDate = new Date();
      // Thêm 1 phút buffer để tránh lỗi do sai số thời gian và timezone
      const bufferTime = 60 * 1000; // 1 phút
      if (deadlineDate.getTime() <= currentDate.getTime() + bufferTime) {
        alert('Deadline phải lớn hơn thời gian hiện tại ít nhất 1 phút');
        return;
      }
    }

    // Chuyển đổi datetime-local sang ISO string (giữ nguyên local time, không convert timezone)
    // Format: "YYYY-MM-DDTHH:mm:ss" từ datetime-local input
    const formatDateTimeToISO = (datetimeLocal) => {
      // datetime-local format: "YYYY-MM-DDTHH:mm"
      // Cần convert thành "YYYY-MM-DDTHH:mm:ss" (ISO format nhưng không có timezone)
      if (!datetimeLocal) return '';
      const [datePart, timePart] = datetimeLocal.split('T');
      const [hours, minutes] = timePart.split(':');
      return `${datePart}T${hours}:${minutes}:00`;
    };
    
    const isoString = formatDateTimeToISO(issueForm.deadline);

    // Nếu đã có biên bản họp (minuteData có id), tạo issue luôn
    if (minuteData && minuteData.id) {
      try {
        const payload = {
          groupId: userInfo?.groups?.[0],
          name: issueForm.title,
          description: issueForm.description || '',
          taskType: 'meeting',
          endAt: isoString,
          status: 'Todo',
          priority: issueForm.priority === 'high' ? 'High' : issueForm.priority === 'medium' ? 'Medium' : 'Low',
          process: '0',
          meetingId: minuteData.id, // Sử dụng meeting minute id
          deliverableId: 0,
          assignedUserId: parseInt(issueForm.assignee),
          reviewerId: issueForm.reviewer ? parseInt(issueForm.reviewer) : 0
        };
        const res = await client.post(`${API_BASE_URL}/Student/Task/create`, payload);
        if (res.data?.status === 200) {
          setShowIssueModal(false);
          setIssueForm({ title: '', description: '', assignee: '', priority: 'low', deadline: '', reviewer: '' });
          // Refresh danh sách issues
          const meetingTasks = await fetchMeetingIssues(minuteData.id);
          setMeetingIssues(Array.isArray(meetingTasks) ? meetingTasks : []);
          alert('Tạo issue thành công!');
        } else {
          alert(res.data?.message || 'Tạo issue thất bại');
        }
      } catch (e) {
        console.error('Error creating meeting issue:', e);
        const errorMessage = e?.response?.data?.message || e?.message || 'Tạo issue thất bại';
        alert(errorMessage);
      }
    } else {
      // Chưa có biên bản, lưu tạm vào pendingIssues và hiển thị trong bảng
      const pendingIssue = {
        id: `pending_${Date.now()}_${Math.random()}`, // Temporary ID
        name: issueForm.title,
        description: issueForm.description || '',
        deadline: isoString,
        isActive: true,
        groupId: userInfo?.groups?.[0],
        status: 'Todo',
        priority: issueForm.priority === 'high' ? 'High' : issueForm.priority === 'medium' ? 'Medium' : 'Low',
        assignedUserId: parseInt(issueForm.assignee),
        reviewerId: issueForm.reviewer ? parseInt(issueForm.reviewer) : 0,
        isPending: true // Đánh dấu là issue tạm
      };

      setPendingIssues(prev => [...prev, pendingIssue]);
      setMeetingIssues(prev => [...prev, pendingIssue]); // Hiển thị trong bảng
      setShowIssueModal(false);
      setIssueForm({ title: '', description: '', assignee: '', priority: 'low', deadline: '', reviewer: '' });
      alert('Đã thêm issue. Issue sẽ được tạo khi bạn lưu biên bản họp.');
    }
  };


  // Tạo các issue thực sự sau khi có meeting minute id
  const createPendingIssues = async (meetingMinuteId) => {
    if (pendingIssues.length === 0) return;

    const createPromises = pendingIssues.map(async (issue) => {
      try {
        const payload = {
          groupId: issue.groupId,
          name: issue.name,
          description: issue.description,
          taskType: 'meeting',
          endAt: issue.deadline,
          status: 'Todo',
          priority: issue.priority,
          process: '0',
          meetingId: meetingMinuteId, // Sử dụng meeting minute id
          deliverableId: 0,
          assignedUserId: issue.assignedUserId,
          reviewerId: issue.reviewerId || 0
        };
        await client.post(`${API_BASE_URL}/Student/Task/create`, payload);
      } catch (e) {
        console.error('Error creating pending issue:', e);
        throw e;
      }
    });

    try {
      await Promise.all(createPromises);
      setPendingIssues([]); // Xóa các issue tạm sau khi tạo thành công
    } catch (error) {
      console.error('Error creating pending issues:', error);
      throw error;
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

  // Hàm tính các ngày trong tuần của meeting (tuần bắt đầu từ thứ 2)
  const getWeekDays = (meetingDate) => {
    const date = new Date(meetingDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Tính số ngày cần lùi lại để đến thứ 2 (Monday = 1)
    // Nếu là Chủ nhật (0), lùi 6 ngày; nếu là thứ 2 (1), lùi 0 ngày; ...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - daysToMonday);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      // Format date string mà không bị ảnh hưởng bởi timezone
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const date = String(day.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${date}`;
      
      days.push({
        date: day,
        dateString: dateString,
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
      // Format meetingDate mà không bị ảnh hưởng bởi timezone
      // scheduleForm.meetingDate format: "YYYY-MM-DD"
      // Cần convert thành "YYYY-MM-DDTHH:mm:ss" (ISO format nhưng không có timezone)
      const formatDateToISO = (dateString) => {
        if (!dateString) return '';
        // dateString format: "YYYY-MM-DD"
        // Thêm "T00:00:00" để tạo ISO format
        return `${dateString}T00:00:00`;
      };
      
      const payload = {
        meetingDate: formatDateToISO(scheduleForm.meetingDate),
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
        if (userInfo?.groups && userInfo.groups.length > 0) {
          await fetchMeetings(userInfo.groups[0]);
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
          
          // Format thời gian từ "HH:mm:ss" thành "HH:mm"
          const formatTime = (timeString) => {
            if (!timeString) return '';
            const parts = timeString.split(':');
            return `${parts[0]}:${parts[1]}`;
          };
          
          const startTime = formatTime(meeting.startAt);
          const endTime = formatTime(meeting.endAt);
          const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : (meeting.time || '');
          
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
                    {formattedDate} {timeRange && `- ${timeRange}`}
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
                
                {isSecretary && meeting.isMeeting !== true && (
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

            {loadingMinuteModal ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <div>Đang tải dữ liệu...</div>
              </div>
            ) : (
            <div className={styles.modalBody}>
              {/* Hiển thị biên bản họp trước đó (chỉ khi tạo mới) */}
              {!isEditing && previousMinuteData && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: '#0c4a6e' 
                  }}>
                    Previous Meeting Minutes (Read-only)
                  </h4>
                  <div style={{ 
                    fontSize: 12, 
                    color: '#64748b', 
                    marginBottom: 12 
                  }}>
                    <div><strong>Created by:</strong> {previousMinuteData.createBy || 'N/A'}</div>
                    <div><strong>Created at:</strong> {previousMinuteData.createAt ? new Date(previousMinuteData.createAt).toLocaleString('en-US') : 'N/A'}</div>
                  </div>
                  <div style={{
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    padding: 12,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    fontSize: 13,
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {previousMinuteData.meetingContent || 'No content available'}
                  </div>
                </div>
              )}
              
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
                {attendanceList.length > 0 ? (
                  <div style={{
                    border: `1px solid ${formErrors.attendance ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '6px',
                    padding: '8px',
                    backgroundColor: '#f9fafb'
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
                        {attendanceList.map((item, index) => (
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
                              <input
                                type="checkbox"
                                checked={item.attended}
                                onChange={(e) => handleAttendanceChange(index, 'attended', e.target.checked)}
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  cursor: 'pointer'
                                }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <Input
                                type="text"
                                value={item.reason}
                                onChange={(e) => handleAttendanceChange(index, 'reason', e.target.value)}
                                placeholder={item.attended ? "Lý do (nếu có)" : "Nhập lý do nghỉ..."}
                                disabled={item.attended}
                                style={{
                                  fontSize: '12px',
                                  padding: '4px 8px',
                                  width: '100%',
                                  backgroundColor: item.attended ? '#f3f4f6' : 'white'
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                    Đang tải danh sách thành viên...
                  </div>
                )}
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
            )}

            {!loadingMinuteModal && (
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
            )}
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
                maxLength={100}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textAlign: 'right' }}>
                {issueForm.title.length}/100 ký tự
              </div>
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
                min={(() => {
                  // Set min là thời gian hiện tại + 1 phút
                  const now = new Date();
                  now.setMinutes(now.getMinutes() + 1);
                  const year = now.getFullYear();
                  const month = String(now.getMonth() + 1).padStart(2, '0');
                  const day = String(now.getDate()).padStart(2, '0');
                  const hours = String(now.getHours()).padStart(2, '0');
                  const minutes = String(now.getMinutes()).padStart(2, '0');
                  return `${year}-${month}-${day}T${hours}:${minutes}`;
                })()}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={`${styles.modalButton} ${styles.secondary}`} onClick={() => setShowIssueModal(false)}>Hủy</button>
              <button className={`${styles.modalButton} ${styles.primary}`} onClick={createMeetingIssue}>Tạo issue</button>
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
