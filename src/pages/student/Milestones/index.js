import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Select from '../../../components/Select/Select';
import { formatDate } from '../../../utils/date';
import { getFileUrl } from '../../../utils/fileUrl';
import { getFileSizeLimit, formatSizeLimit, getUserInfo } from '../../../auth/auth';
import { getUserInfoFromAPI } from '../../../api/auth';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { getSemesterDetail } from '../../../api/staff/semester';
import { getDeliverablesByGroup, getDeliverableDetail } from '../../../api/deliverables';
import { uploadMilestoneFile, deleteMilestoneAttachment } from '../../../api/upload';
import { sendMilestoneSubmissionEmail } from '../../../email/documents/milestoneSubmission';


export default function StudentMilestones() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [semesterInfo, setSemesterInfo] = React.useState(null);
  const [milestones, setMilestones] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [detailModal, setDetailModal] = React.useState(false);
  const [milestoneDetails, setMilestoneDetails] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState({}); // { [itemId]: File }
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = React.useState(null);
  const [windowWidth, setWindowWidth] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1920; // Default to desktop size
  });

  // Track window width for responsive design
  React.useEffect(() => {
    const updateWidth = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
    };
    
    // Set initial width immediately
    updateWidth();
    
    // Listen for resize events
    window.addEventListener('resize', updateWidth);
    
    // Also listen for orientation change (mobile devices)
    window.addEventListener('orientationchange', () => {
      setTimeout(updateWidth, 100);
    });
    
    return () => {
      window.removeEventListener('resize', updateWidth);
      window.removeEventListener('orientationchange', updateWidth);
    };
  }, []);

  // Load user info
  React.useEffect(() => {
    let mounted = true;
    async function loadUserInfo() {
      try {
        const res = await getUserInfoFromAPI();
        const user = res?.data || null;
        if (!mounted) return;
        setUserInfo(user);
        
        // Cập nhật majorCategory vào localStorage nếu có
        if (user && user.majorCategory) {
          try {
            const existingUserInfo = getUserInfo();
            if (existingUserInfo) {
              const updatedUserInfo = {
                ...existingUserInfo,
                majorCategory: user.majorCategory
              };
              localStorage.setItem('auth_user', JSON.stringify(updatedUserInfo));
            }
          } catch (e) {
            console.error('Error updating majorCategory in localStorage:', e);
          }
        }
      } catch {
        if (!mounted) return;
        setUserInfo(null);
      }
    }
    loadUserInfo();
    return () => { mounted = false; };
  }, []);

  // Load group info
  React.useEffect(() => {
    let mounted = true;
    async function loadGroupInfo() {
      if (!userInfo?.groups || userInfo.groups.length === 0) return;
      try {
        // Lấy group đầu tiên từ danh sách groups
        const groupId = userInfo.groups[0];
        const res = await getCapstoneGroupDetail(groupId);
        const group = res?.data || null;
        if (!mounted) return;
        setGroupInfo(group);
      } catch {
        if (!mounted) return;
        setGroupInfo(null);
      }
    }
    loadGroupInfo();
    return () => { mounted = false; };
  }, [userInfo?.groups]);

  // Load semester info
  React.useEffect(() => {
    let mounted = true;
    async function loadSemesterInfo() {
      if (!groupInfo?.semesterId) return;
      try {
        const res = await getSemesterDetail(groupInfo.semesterId);
        const semester = res?.data || null;
        if (!mounted) return;
        setSemesterInfo(semester);
      } catch {
        if (!mounted) return;
        setSemesterInfo(null);
      }
    }
    loadSemesterInfo();
    return () => { mounted = false; };
  }, [groupInfo?.semesterId]);

  // Load milestones
  React.useEffect(() => {
    let mounted = true;
    async function loadMilestones() {
      if (!userInfo?.groups || userInfo.groups.length === 0) return;
      try {
        // Lấy group đầu tiên từ danh sách groups
        const groupId = userInfo.groups[0];
        const res = await getDeliverablesByGroup(groupId);
        const list = Array.isArray(res) ? res : [];
        if (!mounted) return;
        setMilestones(list);
      } catch {
        if (!mounted) return;
        setMilestones([]);
      }
    }
    loadMilestones();
    return () => { mounted = false; };
  }, [userInfo?.groups]);

  // Set loading false when all data loaded
  React.useEffect(() => {
    if (userInfo && groupInfo && semesterInfo) {
      setLoading(false);
    }
  }, [userInfo, groupInfo, semesterInfo]);


  const closeDetailModal = () => {
    setDetailModal(false);
    setSelectedFiles({}); // Clear selected files when closing modal
  };

  const openDetailModal = async (milestone) => {
    setSelectedMilestone(milestone);
    setDetailModal(true);
    setSelectedFiles({}); // Clear selected files when opening modal
    
    // Load milestone details
    try {
      const res = await getDeliverableDetail(userInfo.groups[0], milestone.id);
      setMilestoneDetails(res || null);
    } catch (error) {
      console.error('Error loading milestone details:', error);
      setMilestoneDetails(null);
    }
  };

  // Kiểm tra file có đúng định dạng được phép không
  const isValidFileType = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split('.').pop().toLowerCase();
    const allowedExtensions = [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
      // PDF
      'pdf',
      // Archives
      'zip', '7z',
      // Java
      'rar'
    ];
    return allowedExtensions.includes(extension);
  };

  const handleFileSelect = (event, itemId) => {
    const file = event.target.files[0];
    if (file) {
      // Kiểm tra định dạng file
      if (!isValidFileType(file.name)) {
        alert('Invalid file type. Only images, PDF, ZIP, 7ZIP, and RAR files are allowed.');
        // Reset input
        event.target.value = '';
        return;
      }
      
      // Kiểm tra kích thước file
      const sizeLimit = getFileSizeLimit();
      if (sizeLimit && file.size > sizeLimit) {
        const userInfo = getUserInfo();
        const sizeLimitText = formatSizeLimit(userInfo?.majorCategory?.size) || 'the limit';
        alert(`File size exceeds the limit. Maximum allowed: ${sizeLimitText}. Your file: ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
        // Reset input
        event.target.value = '';
        return;
      }
      
      setSelectedFiles(prev => ({ ...prev, [itemId]: file }));
    }
  };

  const handleUpload = async (deliveryItemId) => {
    const fileToUpload = selectedFiles[deliveryItemId];
    if (!fileToUpload || !userInfo?.groups[0]) return;
    
    // Validate file type trước khi upload
    if (!isValidFileType(fileToUpload.name)) {
      alert('Invalid file type. Only images, PDF, ZIP, 7ZIP, and RAR files are allowed.');
      // Clear invalid file
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[deliveryItemId];
        return newFiles;
      });
      return;
    }
    
    // Validate file size trước khi upload
    const sizeLimit = getFileSizeLimit();
    if (sizeLimit && fileToUpload.size > sizeLimit) {
      const userInfoData = getUserInfo();
      const sizeLimitText = formatSizeLimit(userInfoData?.majorCategory?.size) || 'the limit';
      alert(`File size exceeds the limit. Maximum allowed: ${sizeLimitText}. Your file: ${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`);
      // Clear invalid file
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[deliveryItemId];
        return newFiles;
      });
      return;
    }
    
    // Check if semesterId is available
    if (!groupInfo?.semesterId) {
      alert('Semester information is not available. Please try again later.');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      
      const res = await uploadMilestoneFile(
        userInfo.groups[0],
        deliveryItemId,
        fileToUpload,
        groupInfo.semesterId
      );
      
      // Reload milestones after successful upload
      const milestonesRes = await getDeliverablesByGroup(userInfo.groups[0]);
      const list = Array.isArray(milestonesRes) ? milestonesRes : [];
      setMilestones(list);
      
      // Update selectedMilestone with new status
      const updatedMilestone = list.find(m => m.id === selectedMilestone.id);
      if (updatedMilestone) {
        setSelectedMilestone(updatedMilestone);
      }
      
      // Reload milestone details after successful upload
      let updatedMilestoneDetails = null;
      if (selectedMilestone) {
        const detailRes = await getDeliverableDetail(userInfo.groups[0], selectedMilestone.id);
        updatedMilestoneDetails = detailRes || null;
        setMilestoneDetails(updatedMilestoneDetails);
      }
      
      // Send email notification to supervisors and CC to group members
      try {
        // Get delivery item name from updated details or current details
        const currentDetails = updatedMilestoneDetails || milestoneDetails;
        const deliveryItem = currentDetails?.deliveryItems?.find(item => item.id === deliveryItemId);
        const deliveryItemName = deliveryItem?.name || 'Unknown';
        
        // Get supervisor emails
        const supervisorEmails = [];
        if (groupInfo?.supervisorsInfor && Array.isArray(groupInfo.supervisorsInfor)) {
          groupInfo.supervisorsInfor.forEach(supervisor => {
            if (supervisor.email) {
              supervisorEmails.push(supervisor.email);
            }
          });
        }
        
        // Get student emails (CC) - include all students in the group
        const studentEmails = [];
        if (groupInfo?.students && Array.isArray(groupInfo.students)) {
          groupInfo.students.forEach(student => {
            if (student.email) {
              studentEmails.push(student.email);
            }
          });
        }
        
        // Format file size
        const fileSizeMB = (fileToUpload.size / (1024 * 1024)).toFixed(2);
        const fileSizeText = `${fileSizeMB} MB`;
        
        // Format upload time
        const uploadTime = formatDate(new Date().toISOString(), 'DD/MM/YYYY HH:mm');
        
        // Format deadline
        const deadline = formatDate(selectedMilestone.endAt, 'DD/MM/YYYY HH:mm');
        
        // Get file URL if available from updated details
        let fileUrl = null;
        if (currentDetails?.deliveryItems) {
          const updatedItem = currentDetails.deliveryItems.find(item => item.id === deliveryItemId);
          if (updatedItem?.attachments && updatedItem.attachments.length > 0) {
            const latestAttachment = updatedItem.attachments.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0];
            if (latestAttachment?.path) {
              fileUrl = getFileUrl(latestAttachment.path);
            }
          }
        }
        
        // Only send email if there are supervisors
        if (supervisorEmails.length > 0) {
          await sendMilestoneSubmissionEmail({
            supervisorEmails: supervisorEmails,
            studentEmails: studentEmails,
            studentName: userInfo?.name || userInfo?.fullName || 'Sinh viên',
            groupName: groupInfo?.projectName || groupInfo?.name || 'Nhóm',
            milestoneName: selectedMilestone.name,
            deliveryItemName: deliveryItemName,
            fileName: fileToUpload.name,
            fileSize: fileSizeText,
            uploadTime: uploadTime,
            deadline: deadline,
            semesterName: semesterInfo?.name,
            fileUrl: fileUrl,
            systemUrl: window.location.origin + '/student/milestones'
          });
        }
      } catch (emailError) {
        console.error('Error sending milestone submission email:', emailError);
        // Don't show error to user, just log it
      }
      
      // Clear selected file for this item only
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[deliveryItemId];
        return newFiles;
      });
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (attachment) => {
    try {
      const fileUrl = getFileUrl(attachment.path);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.path.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const deleteAttachment = async (attachmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa file này?')) {
      return;
    }
    
    try {
      const response = await deleteMilestoneAttachment(attachmentId);
      if (response.status === 200) {
        alert('Xóa file thành công!');
        // Reload milestone details
        if (selectedMilestone) {
          const detailRes = await getDeliverableDetail(userInfo.groups[0], selectedMilestone.id);
          setMilestoneDetails(detailRes || null);
        }
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Có lỗi xảy ra khi xóa file. Vui lòng thử lại.');
    }
  };

  const getLatestAttachment = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    return attachments.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0];
  };

  // Kiểm tra file có thể xem được không (ảnh, PDF, docs)
  const canPreviewFile = (filePath) => {
    if (!filePath) return false;
    const fileName = filePath.split('/').pop().toLowerCase();
    const extension = fileName.split('.').pop();
    
    // Các định dạng có thể xem được
    const previewableExtensions = [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
      // PDF
      'pdf',
      // Documents (có thể xem qua Google Docs Viewer hoặc Office Online)
      'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      // Text files
      'txt', 'csv'
    ];
    
    return previewableExtensions.includes(extension);
  };

  // Mở preview file trong tab mới
  const openFilePreview = (attachment) => {
    if (!canPreviewFile(attachment.path)) {
      alert('File này không thể xem trước. Vui lòng tải xuống để xem.');
      return;
    }
    
    const filePath = attachment.path;
    const fileName = filePath.split('/').pop().toLowerCase();
    const extension = fileName.split('.').pop();
    const baseUrl = getFileUrl(filePath);
    
    let previewUrl = baseUrl;
    
    // Office documents - sử dụng Google Docs Viewer
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
      previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(baseUrl)}&embedded=true`;
    }
    
    // Mở trong tab mới
    window.open(previewUrl, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return '#059669'; // Green
      case 'LATE':
        return '#dc2626'; // Red
      case 'Pending':
        return '#d97706'; // Orange/Yellow
      case 'PENDING':
        return '#d97706'; // Orange/Yellow
      case 'UNSUBMITTED':
        return '#64748b'; // Gray
      case 'REJECTED':
        return '#dc2626'; // Red
      case 'MISSING':
        return '#dc2626'; // Red
      default:
        return '#64748b'; // Gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return '✓ Submitted';
      case 'LATE':
        return '⚠ Late';
      case 'Pending':
        return '⏳ Pending Review';
      case 'PENDING':
        return '⏳ Pending Review';
      case 'UNSUBMITTED':
        return '✗ Unsubmitted';
      case 'REJECTED':
        return '❌ Rejected';
      case 'MISSING':
        return '❌ Missing';
      default:
        return '❓ Unknown';
    }
  };

  // Hàm kiểm tra và trả về status thực tế (bao gồm MISSING)
  const getActualStatus = (milestone) => {
    if (milestone.status === 'UNSUBMITTED') {
      const now = new Date();
      const deadline = new Date(milestone.endAt);
      if (deadline < now) {
        return 'MISSING';
      }
    }
    return milestone.status;
  };

  const showHistory = (item) => {
    setSelectedItemHistory(item);
    setShowHistoryModal(true);
  };

  // Helper to determine if mobile (iPhone XR is ~414px, so we use <= 576px for small mobile)
  // Always read directly from window to ensure responsiveness even during device emulation
  const currentWidth = typeof window !== 'undefined' ? window.innerWidth : windowWidth;
  const isMobile = currentWidth <= 576;
  const isTablet = currentWidth > 576 && currentWidth <= 1024;
  const isDesktop = currentWidth > 1024;

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div>Loading milestones...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '12px' : isTablet ? '14px' : '16px', maxWidth: '100%' }}>
      {/* Header - Responsive */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile || isTablet ? 'column' : 'row',
        alignItems: isMobile || isTablet ? 'flex-start' : 'center',
        gap: isMobile ? 12 : 16, 
        marginBottom: isMobile ? 20 : 24 
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : isTablet ? '22px' : '24px' }}>Milestones Management</h1>
        {groupInfo && (
          <div style={{ 
            fontSize: 14, 
            color: '#64748b',
            wordBreak: 'break-word',
            maxWidth: '100%'
          }}>
            Group: {groupInfo.projectName}
          </div>
        )}
      </div>
              
      {/* Semester and Supervisors Info - Responsive */}
      {semesterInfo && (
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile || isTablet ? 'column' : 'row',
          alignItems: 'center', 
          gap: isMobile ? 12 : 16, 
          marginBottom: isMobile ? 12 : 16 
        }}>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8, 
            padding: 8, 
            width: '100%',
            flex: isMobile || isTablet ? 'none' : 1
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e', wordBreak: 'break-word' }}>
              Semester: {semesterInfo.name} ({formatDate(semesterInfo.startAt, 'DD/MM/YYYY')} - {formatDate(semesterInfo.endAt, 'DD/MM/YYYY')})
            </div>
          </div>
          {groupInfo?.supervisors && (
            <div style={{ 
              background: '#f0fdf4', 
              border: '1px solid #10b981', 
              borderRadius: 8, 
              padding: 8,
              width: '100%',
              flex: isMobile || isTablet ? 'none' : 1
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', wordBreak: 'break-word' }}>
                Supervisors: {groupInfo.supervisors.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}


      {/* Group Members Link */}
      {groupInfo?.students && (
        <div style={{ marginTop: isMobile ? 16 : 24 }}>
          <a 
            href="/student/groups"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#3b82f6',
              textDecoration: 'none',
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: 500,
              padding: '8px 16px',
              background: '#eff6ff',
              border: '1px solid #3b82f6',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            👥 View Group Members ({groupInfo.students.length} members) →
          </a>
        </div>
      )}
      
{/* Milestones Summary Table - Responsive */}
<div style={{ flex: 1, marginTop: isMobile ? 16 : 24, width: '100%' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: isMobile ? '15px' : '16px', color: '#333' }}>Milestones Summary</h3>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: 8, 
          overflow: 'auto',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          background: '#fff',
          width: '100%'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'separate', 
            borderSpacing: 0,
            minWidth: isMobile ? '500px' : 'auto'
          }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ textAlign: 'center', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '35px' }}>#</th>
                <th style={{ textAlign: 'left', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px' }}>Milestone</th>
                <th style={{ textAlign: 'left', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '130px' }}>Deadline</th>
                <th style={{ textAlign: 'center', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '130px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone, index) => {
                const actualStatus = getActualStatus(milestone);
                return (
                <tr key={milestone.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: isMobile ? '12px' : '13px', color: '#6c757d' }}>{index + 1}</div>
                  </td>
                  <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #f1f5f9' }}>
                    <div 
                      onClick={() => openDetailModal(milestone)}
                      style={{ 
                        fontWeight: 600, 
                        fontSize: isMobile ? '13px' : '14px', 
                        marginBottom: 4, 
                        color: '#3b82f6', 
                        wordBreak: 'break-word',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {milestone.name}
                    </div>
                    {milestone.description && (
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#64748b', wordBreak: 'break-word' }}>{milestone.description}</div>
                    )}
                  </td>
                  <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#059669', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', whiteSpace: 'nowrap' }}>
                      {formatDate(milestone.endAt, 'YYYY-MM-DD HH:mm')}
                    </div>
                  </td>
                  <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <span style={{ 
                      color: getStatusColor(actualStatus), 
                      background: getStatusColor(actualStatus) === '#059669' ? '#ecfdf5' : 
                                 getStatusColor(actualStatus) === '#dc2626' ? '#fee2e2' :
                                 getStatusColor(actualStatus) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                      padding: isMobile ? '3px 6px' : '4px 8px',
                      borderRadius: 6,
                      fontSize: isMobile ? '11px' : '12px',
                      fontWeight: 600,
                      border: `1px solid ${getStatusColor(actualStatus)}`,
                      display: 'inline-block',
                      whiteSpace: 'nowrap'
                    }}>
                      {getStatusText(actualStatus)}
                    </span>
                  </td>
                </tr>
                );
              })}
              {milestones.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                    No milestones found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={detailModal} onClose={closeDetailModal}>
        {selectedMilestone && (
          <div style={{ 
            padding: isMobile ? '12px' : isTablet ? '16px' : '24px', 
            maxWidth: '95vw', 
            width: isMobile ? '95vw' : isTablet ? '90vw' : '1200px',
            maxHeight: '80vh', 
            overflow: 'auto' 
          }}>
            <h2 style={{ 
              margin: '0 0 16px 0', 
              fontSize: isMobile ? '18px' : isTablet ? '19px' : '20px' 
            }}>Milestone Details</h2>
            
            {/* Basic and Project Info - Responsive */}
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile || isTablet ? 'column' : 'row',
              gap: isMobile ? 16 : 24, 
              marginBottom: isMobile ? 16 : 20 
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Basic Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ wordBreak: 'break-word' }}><strong>Name:</strong> {selectedMilestone.name}</div>
                  <div style={{ wordBreak: 'break-word' }}><strong>Description:</strong> {selectedMilestone.description}</div>
                  <div><strong>Deadline:</strong> {formatDate(selectedMilestone.endAt, 'YYYY-MM-DD HH:mm')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                    <strong>Status:</strong>
                    <span style={{ 
                      color: getStatusColor(selectedMilestone.status), 
                      background: getStatusColor(selectedMilestone.status) === '#059669' ? '#ecfdf5' : 
                                 getStatusColor(selectedMilestone.status) === '#dc2626' ? '#fee2e2' :
                                 getStatusColor(selectedMilestone.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      {getStatusText(selectedMilestone.status)}
                    </span>
                  </div>
                  <div style={{ wordBreak: 'break-word' }}><strong>Note:</strong> {milestoneDetails?.note || 'Chưa có ghi chú nào từ giảng viên'}</div>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Project Information</h3>
                {groupInfo && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ wordBreak: 'break-word' }}><strong>Project:</strong> {groupInfo.projectName}</div>
                    <div style={{ wordBreak: 'break-word' }}><strong>Supervisors:</strong> {groupInfo.supervisors?.join(', ')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Items - Responsive Grid */}
            {milestoneDetails?.deliveryItems && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>Delivery Items</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(auto-fit, minmax(350px, 1fr))' : 'repeat(auto-fit, minmax(500px, 1fr))',
                  gap: isMobile ? 12 : 16 
                }}>
                  {milestoneDetails.deliveryItems.map((item, index) => (
                    <div key={item.id} style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: 8, 
                      padding: 16, 
                      background: '#f9fafb'
                    }}>
                      <div style={{ marginBottom: 12 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 600 }}>{item.name}</h4>
                        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{item.description}</p>
                      </div>
                      
                      {/* Upload Section */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <input
                            type="file"
                            id={`file-${item.id}`}
                            onChange={(e) => handleFileSelect(e, item.id)}
                            accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf,.zip,.7z,.rar"
                            style={{ display: 'none' }}
                          />
                          <label 
                            htmlFor={`file-${item.id}`}
                            style={{
                              padding: '6px 12px',
                              background: '#3b82f6',
                              color: 'white',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 500
                            }}
                          >
                            Choose File
                          </label>
                          {(() => {
                            const userInfoData = getUserInfo();
                            const majorCategory = userInfoData?.majorCategory;
                            const sizeLimitText = formatSizeLimit(majorCategory?.size);
                            
                            // Debug: Log để kiểm tra
                            if (process.env.NODE_ENV === 'development') {

                            }
                            
                            if (sizeLimitText) {
                              return (
                                <span style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
                                  Max size: {sizeLimitText}
                                </span>
                              );
                            }
                            return null;
                          })()}
                          {selectedFiles[item.id] && (
                            <Button
                              onClick={() => handleUpload(item.id)}
                              disabled={uploading}
                              style={{ fontSize: 12, padding: '6px 12px' }}
                            >
                              {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                          )}
                        </div>
                        {selectedFiles[item.id] && (
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            Selected: {selectedFiles[item.id].name}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
                          Allowed file types: Images (JPG, PNG, GIF, etc.), PDF, ZIP, 7ZIP, RAR
                        </div>
                      </div>

                      {/* All Attachments */}
                      {item.attachments && item.attachments.length > 0 && (
                        <div>
                          <h5 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600 }}>
                            Files ({item.attachments.length}):
                          </h5>
                          
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {item.attachments
                              .sort((a, b) => new Date(b.createAt) - new Date(a.createAt))
                              .map((attachment, index) => {
                                const isLatest = index === 0;
                                return (
                                  <div key={attachment.id} style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    alignItems: isMobile ? 'flex-start' : 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    background: isLatest ? '#f0f9ff' : 'white',
                                    border: isLatest ? '2px solid #3b82f6' : '1px solid #d1d5db',
                                    borderRadius: 4,
                                    marginBottom: 8
                                  }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <div style={{ fontSize: 12, fontWeight: 500, wordBreak: 'break-all' }}>
                                          {attachment.path.split('/').pop()}
                                        </div>
                                        {isLatest && (
                                          <span style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600
                                          }}>
                                            CURRENT
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#64748b' }}>
                                        Uploaded by {attachment.userName} on {formatDate(attachment.createAt, 'DD/MM/YYYY HH:mm')}
                                      </div>
                                    </div>
                                    <div style={{ 
                                      display: 'flex', 
                                      flexDirection: isMobile ? 'column' : 'row',
                                      gap: '4px', 
                                      flexShrink: 0,
                                      marginTop: isMobile ? '8px' : '0',
                                      width: isMobile ? '100%' : 'auto',
                                      alignItems: 'center'
                                    }}>
                                      {canPreviewFile(attachment.path) && (
                                        <button
                                          onClick={() => openFilePreview(attachment)}
                                          style={{ 
                                            padding: '4px 6px',
                                            background: 'transparent',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#6b7280',
                                            width: isMobile ? '100%' : 'auto'
                                          }}
                                          title="Xem trước"
                                          onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#f3f4f6';
                                            e.target.style.borderColor = '#9ca3af';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.borderColor = '#d1d5db';
                                          }}
                                        >
                                          <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            style={{ color: '#6b7280' }}
                                          >
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                          </svg>
                                        </button>
                                      )}
                                      <Button
                                        onClick={() => downloadFile(attachment)}
                                        variant="ghost"
                                        style={{ 
                                          fontSize: 11, 
                                          padding: '4px 8px',
                                          width: isMobile ? '100%' : 'auto'
                                        }}
                                      >
                                        Download
                                      </Button>
                                      {!isLatest && (
                                        <Button
                                          onClick={() => deleteAttachment(attachment.id)}
                                          variant="ghost"
                                          style={{ 
                                            fontSize: 11, 
                                            padding: '4px 8px',
                                            color: '#dc2626',
                                            background: '#fee2e2',
                                            width: isMobile ? '100%' : 'auto'
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button variant="ghost" onClick={closeDetailModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* History Modal - Responsive */}
      <Modal open={showHistoryModal} onClose={() => setShowHistoryModal(false)}>
        {selectedItemHistory && (
          <div style={{ 
            padding: isMobile ? '12px' : isTablet ? '16px' : '24px', 
            maxWidth: '95vw',
            width: isMobile ? '95vw' : isTablet ? '90vw' : '800px',
            maxHeight: '80vh', 
            overflow: 'auto' 
          }}>
            <h2 style={{ 
              margin: '0 0 16px 0', 
              fontSize: isMobile ? '18px' : isTablet ? '19px' : '20px' 
            }}>File History</h2>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>{selectedItemHistory.name}</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>{selectedItemHistory.description}</p>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>All Versions (Newest to Oldest):</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {selectedItemHistory.attachments
                  .sort((a, b) => new Date(b.createAt) - new Date(a.createAt))
                  .map((attachment, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      padding: isMobile ? '10px 12px' : '12px 16px',
                      background: index === 0 ? '#f0f9ff' : 'white',
                      border: index === 0 ? '2px solid #3b82f6' : '1px solid #d1d5db',
                      borderRadius: 8,
                      marginBottom: 8
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 600, wordBreak: 'break-all' }}>
                            {attachment.path.split('/').pop()}
                          </div>
                          {index === 0 && (
                            <span style={{
                              background: '#3b82f6',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600
                            }}>
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#64748b' }}>
                          Uploaded by {attachment.userName} on {formatDate(attachment.createAt, 'DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '4px', 
                        flexShrink: 0,
                        marginTop: isMobile ? '8px' : '0',
                        alignItems: 'center',
                        flexDirection: isMobile ? 'column' : 'row',
                        width: isMobile ? '100%' : 'auto'
                      }}>
                        {canPreviewFile(attachment.path) && (
                          <button
                            onClick={() => openFilePreview(attachment)}
                            style={{ 
                              padding: isMobile ? '6px 10px' : '4px 6px',
                              background: 'transparent',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6b7280',
                              width: isMobile ? '100%' : 'auto'
                            }}
                            title="Xem trước"
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f3f4f6';
                              e.target.style.borderColor = '#9ca3af';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                              e.target.style.borderColor = '#d1d5db';
                            }}
                          >
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              style={{ color: '#6b7280' }}
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                        )}
                        <Button
                          onClick={() => downloadFile(attachment)}
                          variant="ghost"
                          style={{ 
                            fontSize: isMobile ? '11px' : '12px', 
                            padding: isMobile ? '6px 10px' : '6px 12px', 
                            flexShrink: 0,
                            width: isMobile ? '100%' : 'auto'
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button variant="ghost" onClick={() => setShowHistoryModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}