import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import Textarea from '../../../components/Textarea/Textarea';
import client from '../../../utils/axiosClient';

export default function SupervisorMeetingManagement() {
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

  // API Base URL
  const API_BASE_URL = 'https://160.30.21.113:5000/api/v1';

  React.useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      console.log('Fetching user info...');
      const response = await client.get(`${API_BASE_URL}/auth/user-info`);
      console.log('User info response:', response.data);
      
      if (response.data.status === 200) {
        const userData = response.data.data;
        setUserInfo(userData);
        
        // Lấy danh sách meetings cho tất cả nhóm mà supervisor hướng dẫn
        if (userData.groups && userData.groups.length > 0) {
          console.log('Fetching meetings for supervisor groups');
          await fetchAllMeetings(userData.groups);
        } else {
          console.log('No groups found in user data');
          setLoading(false);
        }
      } else {
        console.log('User info API returned non-200 status:', response.data.status);
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
    } catch (error) {
      console.error('Error fetching all groups info:', error);
    }
  };

  // Lấy meetings của tất cả nhóm mà supervisor hướng dẫn
  const fetchAllMeetings = async (groupIds) => {
    try {
      console.log('Fetching meetings for groups:', groupIds);
      
      // Fetch thông tin tất cả các nhóm trước
      await fetchAllGroupsInfo(groupIds);
      
      // Lấy meetings của tất cả nhóm
      const allMeetings = [];
      for (const groupId of groupIds) {
        try {
          const response = await client.get(`${API_BASE_URL}/Student/Meeting/group/${groupId}/schedule-dates`);
          if (response.data.status === 200) {
            const meetingsData = response.data.data;
            if (meetingsData && meetingsData.length > 0) {
              // Thêm thông tin nhóm vào mỗi meeting
              const meetingsWithGroup = meetingsData.map(meeting => ({
                ...meeting,
                groupId: groupId
              }));
              allMeetings.push(...meetingsWithGroup);
            }
          }
        } catch (error) {
          console.error(`Error fetching meetings for group ${groupId}:`, error);
        }
      }
      
      // Sắp xếp theo thời gian diễn ra cuộc họp
      allMeetings.sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));
      
      // Lấy meeting minutes cho từng meeting
      const meetingsWithMinutes = await Promise.all(
        allMeetings.map(async (meeting) => {
          console.log('Fetching minute for meeting:', meeting.id);
          const meetingMinute = await fetchMeetingMinute(meeting.id);
          return {
            ...meeting,
            hasMinute: !!meetingMinute,
            minuteData: meetingMinute
          };
        })
      );
      
      console.log('All meetings with minutes:', meetingsWithMinutes);
      setMeetings(meetingsWithMinutes);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching all meetings:', error);
      console.error('Error details:', error.response?.data || error.message);
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
      console.log('Creating meeting minute with data:', data);
      const response = await client.post(`${API_BASE_URL}/MeetingMinute`, data);
      console.log('API response:', response.data);
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

  const getStatusText = (status) => {
    switch (status) {
      case 'Completed': return 'Đã họp';
      case 'Past': return 'Đã qua';
      case 'Upcoming': return 'Sắp diễn ra';
      default: return 'Không xác định';
    }
  };

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

  // Hàm mở modal biên bản họp
  const openMinuteModal = async (meeting) => {
    console.log('Opening modal for meeting:', meeting);
    setSelectedMeeting(meeting);
    setShowMinuteModal(true);
    
    // Fetch group info for this meeting
    await fetchMeetingGroupInfo(meeting.groupId);
    
    // Sử dụng dữ liệu đã có hoặc fetch mới
    const existingMinute = meeting.minuteData || await fetchMeetingMinute(meeting.id);
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
    
    console.log('Modal opened, isEditing:', false, 'formData initialized');
  };

  // Hàm đóng modal
  const closeMinuteModal = () => {
    setShowMinuteModal(false);
    setSelectedMeeting(null);
    setSelectedMeetingGroupInfo(null);
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
    console.log('Input changed:', field, value);
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
    console.log('Validating form with data:', formData);
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
    
    console.log('Validation errors:', errors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Hàm lưu biên bản họp
  const saveMeetingMinute = async () => {
    console.log('Save meeting minute clicked!');
    console.log('Form data:', formData);
    console.log('Form errors:', formErrors);
    console.log('Is editing:', isEditing);
    console.log('Minute data:', minuteData);
    console.log('Selected meeting:', selectedMeeting);
    
    if (!validateForm()) {
      console.log('Form validation failed');
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
        console.log('Updating meeting minute with data:', data);
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
        console.log('Creating meeting minute with data:', data);
        await createMeetingMinute(data);
        alert('Tạo biên bản họp thành công!');
      }
      
      // Refresh meetings data
      if (userInfo?.groups) {
        await fetchAllMeetings(userInfo.groups);
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
      
      // Refresh meetings data
      if (userInfo?.groups) {
        await fetchAllMeetings(userInfo.groups);
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
        <div className={styles.noData}>
          <h3>Không có cuộc họp nào</h3>
          <p>Hiện tại chưa có cuộc họp nào được lên lịch cho các nhóm mà bạn hướng dẫn.</p>
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
                    {getStatusText(status)}
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

                {meeting.minuteData && (
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
                        <strong>Tạo bởi:</strong> {meeting.minuteData.createBy}
                      </p>
                      <p style={{ margin: '2px 0' }}>
                        <strong>Thời gian tạo:</strong> {new Date(meeting.minuteData.createAt).toLocaleString('vi-VN')}
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
              
                {meeting.minuteData ? (
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
              maxWidth: '800px',
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
                        <div><strong>Bắt đầu:</strong> {minuteData?.startAt ? new Date(minuteData.startAt).toLocaleString('vi-VN') : 'N/A'}</div>
                        <div><strong>Kết thúc:</strong> {minuteData?.endAt ? new Date(minuteData.endAt).toLocaleString('vi-VN') : 'N/A'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Danh sách tham gia</h4>
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
                        {minuteData?.attendance || 'N/A'}
                      </div>
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
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: '#065f46' }}>Vấn đề cần giải quyết</h4>
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
                        {minuteData?.issue || 'N/A'}
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
    </div>
  );
}