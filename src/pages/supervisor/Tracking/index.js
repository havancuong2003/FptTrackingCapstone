import React from 'react';
import styles from './index.module.scss';
import sharedLayout from '../sharedLayout.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Select from '../../../components/Select/Select';
import DataTable from '../../../components/DataTable/DataTable';
import { formatDate } from '../../../utils/date';
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from '../../../auth/auth';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { getDeliverablesByGroup, getDeliverableDetail, markDeliverableAttachmentDownloaded, confirmDeliverable, rejectDeliverable } from '../../../api/deliverables';
import SupervisorGroupFilter from '../../../components/SupervisorGroupFilter/SupervisorGroupFilter';

export default function SupervisorTracking() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [groups, setGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [milestones, setMilestones] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [detailModal, setDetailModal] = React.useState(false);
  const [milestoneDetails, setMilestoneDetails] = React.useState(null);
  const [confirming, setConfirming] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [noteError, setNoteError] = React.useState('');
  const [semesters, setSemesters] = React.useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState(null);
  const [groupExpireFilter, setGroupExpireFilter] = React.useState('active'); // 'active' or 'expired'
  const [windowWidth, setWindowWidth] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1920; // Default to desktop size
  });

  // Track window width for responsive design
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user info from localStorage, don't call API
  React.useEffect(() => {
    let mounted = true;
    function loadUserInfo() {
      try {
        const user = getUserInfo();
        if (!mounted) return;
        setUserInfo(user);
        
        // Get semesters and set default to current semester
        const uniqueSemesters = getUniqueSemesters();
        setSemesters(uniqueSemesters);
        
        const currentSemesterId = getCurrentSemesterId();
        if (currentSemesterId) {
          setSelectedSemesterId(currentSemesterId);
        } else if (uniqueSemesters.length > 0) {
          setSelectedSemesterId(uniqueSemesters[0].id);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error loading user info:', error);
        setUserInfo(null);
        setGroups([]);
      }
    }
    loadUserInfo();
    return () => { mounted = false; };
  }, []);

  // Load groups from localStorage when filter changes (no API call)
  React.useEffect(() => {
    if (selectedSemesterId === null) {
      setGroups([]);
      return;
    }
    
    // Get groups from localStorage based on semester and expired status
    const isExpired = groupExpireFilter === 'expired';
    const groupsFromStorage = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
    
    // Only store basic info from localStorage, don't fetch details yet
    const groupsBasicInfo = groupsFromStorage.map(groupInfo => ({
      id: groupInfo.id,
      name: groupInfo.name || '',
      groupCode: groupInfo.code || groupInfo.groupCode || '',
      semesterId: groupInfo.semesterId,
      isExpired: groupInfo.isExpired || false
    }));
    
    setGroups(groupsBasicInfo);
    setLoading(false); // Set loading false after groups are loaded from localStorage
    
    // Check if selected group is still in filtered list
    const selectedGroupExists = selectedGroup && groupsFromStorage.some(g => g.id === selectedGroup.id);
    
    if (selectedGroup && !selectedGroupExists) {
      // Selected group is not in filtered list, clear selection and data
      setSelectedGroup(null);
      setGroupInfo(null);
      setMilestones([]);
      setSelectedMilestone(null);
      setMilestoneDetails(null);
      setNote('');
      setNoteError('');
    }
  }, [selectedSemesterId, groupExpireFilter]);


  // Load group details when group is selected (API call)
  React.useEffect(() => {
    if (!selectedGroup) {
      setGroupInfo(null);
      setMilestones([]);
      setSelectedMilestone(null);
      setMilestoneDetails(null);
      return;
    }

    // Check if selected group exists in current filtered groups
    const isExpired = groupExpireFilter === 'expired';
    const groupsFromStorage = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
    const selectedGroupExists = groupsFromStorage.some(g => g.id === selectedGroup.id);
    
    if (!selectedGroupExists) {
      setGroupInfo(null);
      setMilestones([]);
      setSelectedMilestone(null);
      setMilestoneDetails(null);
      return;
    }

    // Fetch group details when group is selected
    let mounted = true;
    async function loadGroupDetails() {
      try {
        const groupsRes = await getCapstoneGroupDetail(selectedGroup.id);
        const groupData = groupsRes?.data;
        if (groupData && mounted) {
          setGroupInfo(groupData);
        }
      } catch (error) {
        console.error(`Error loading group details for ${selectedGroup.id}:`, error);
        if (mounted) {
          setGroupInfo(null);
        }
      }
    }
    loadGroupDetails();
    return () => { mounted = false; };
  }, [selectedGroup, selectedSemesterId, groupExpireFilter]);


  // Load milestones
  React.useEffect(() => {
    let mounted = true;
    async function loadMilestones() {
      if (!selectedGroup?.id) return;
      try {
        const res = await getDeliverablesByGroup(selectedGroup.id);
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
  }, [selectedGroup?.id]);

  // Set loading false when all data loaded
  React.useEffect(() => {
    if (userInfo && groups.length > 0 && groupInfo) {
      setLoading(false);
    }
  }, [userInfo, groups, groupInfo]);


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
      default:
        return '❓ Unknown';
    }
  };

  const openDetailModal = async (milestone) => {
    setSelectedMilestone(milestone);
    setDetailModal(true);
    setNote('');
    setNoteError('');
    
    // Load milestone details
    try {
      const res = await getDeliverableDetail(selectedGroup.id, milestone.id);
      setMilestoneDetails(res?.data || null);
    } catch (error) {
      console.error('Error loading milestone details:', error);
      setMilestoneDetails(null);
    }
  };

  const markDownload = async (attachmentId) => {
    try {
      const res = await markDeliverableAttachmentDownloaded(attachmentId);
      if (res.status === 200) {
        // Reload milestone details to update download status
        if (selectedMilestone) {
          const detailRes = await getDeliverableDetail(selectedGroup.id, selectedMilestone.id);
          setMilestoneDetails(detailRes?.data || null);
        }
      }
    } catch (error) {
      console.error('Error marking download:', error);
    }
  };

  // Check if all items have at least one attachment (submitted)
  const checkAllItemsSubmitted = () => {
    if (!milestoneDetails?.deliveryItems) return false;
    
    return milestoneDetails.deliveryItems.every(item => {
      // Item must have at least one attachment to be considered submitted
      return item.attachments && item.attachments.length > 0;
    });
  };

  const checkAllAttachmentsDownloaded = () => {
    if (!milestoneDetails?.deliveryItems) return false;
    
    return milestoneDetails.deliveryItems.every(item => {
      if (!item.attachments || item.attachments.length === 0) return true;
      
      // Get the latest attachment (current version)
      const latestAttachment = item.attachments
        .sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0];
      
      // Only check if the latest attachment is downloaded
      return latestAttachment && latestAttachment.isDownload;
    });
  };

  // Combined check: all items submitted AND all attachments downloaded
  const checkCanConfirm = () => {
    return checkAllItemsSubmitted() && checkAllAttachmentsDownloaded();
  };

  const handleConfirm = async () => {
    if (!selectedGroup?.id || !selectedMilestone) return;
    
    // Check if all items are submitted
    if (!checkAllItemsSubmitted()) {
      alert('Cannot confirm: Some items have not been submitted yet. Please wait for all items to be submitted.');
      return;
    }
    
    // Check if all attachments are downloaded
    if (!checkAllAttachmentsDownloaded()) {
      alert('Please download and review all attachments before confirming');
      return;
    }
    
    setConfirming(true);
    setNoteError('');
    
    try {
      await confirmDeliverable(selectedGroup.id, selectedMilestone.id, note);
      
      // Reload milestones after successful confirmation
      const milestonesRes = await getDeliverablesByGroup(selectedGroup.id);
      const list = Array.isArray(milestonesRes?.data) ? milestonesRes.data : [];
      setMilestones(list);
      
      // Update selectedMilestone with new status
      const updatedMilestone = list.find(m => m.id === selectedMilestone.id);
      if (updatedMilestone) {
        setSelectedMilestone(updatedMilestone);
      }
      
      // Reload milestone details
      const detailRes = await getDeliverableDetail(selectedGroup.id, selectedMilestone.id);
      setMilestoneDetails(detailRes?.data || null);
      
      setNote('');
      alert('Milestone confirmed successfully!');
    } catch (error) {
      console.error('Error confirming milestone:', error);
      alert('Error confirming milestone. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!selectedGroup?.id || !selectedMilestone) return;
    
    // Validate note for rejection
    if (!note.trim()) {
      setNoteError('Note is required for rejection');
      return;
    }
    
    // Check if latest attachments are downloaded for rejection
    if (!checkAllAttachmentsDownloaded()) {
      alert('Please download and review the latest attachments before rejecting');
      return;
    }
    
    setRejecting(true);
    setNoteError('');
    
    try {
      await rejectDeliverable(selectedGroup.id, selectedMilestone.id, note);
      
      // Reload milestones after successful rejection
      const milestonesRes = await getDeliverablesByGroup(selectedGroup.id);
      const list = Array.isArray(milestonesRes?.data) ? milestonesRes.data : [];
      setMilestones(list);
      
      // Update selectedMilestone with new status
      const updatedMilestone = list.find(m => m.id === selectedMilestone.id);
      if (updatedMilestone) {
        setSelectedMilestone(updatedMilestone);
      }
      
      // Reload milestone details
      const detailRes = await getDeliverableDetail(selectedGroup.id, selectedMilestone.id);
      setMilestoneDetails(detailRes?.data || null);
      
      setNote('');
      alert('Milestone rejected successfully!');
    } catch (error) {
      console.error('Error rejecting milestone:', error);
      alert('Error rejecting milestone. Please try again.');
    } finally {
      setRejecting(false);
    }
  };

  const downloadFile = async (attachment) => {
    try {
      const response = await fetch(`https://160.30.21.113:5000${attachment.path}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.path.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Mark as downloaded
      await markDownload(attachment.id);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const getLatestAttachment = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    return attachments.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0];
  };

  // Check if file can be previewed (images, PDF, docs)
  const canPreviewFile = (filePath) => {
    if (!filePath) return false;
    const fileName = filePath.split('/').pop().toLowerCase();
    const extension = fileName.split('.').pop();
    
    // Previewable formats
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
      alert('This file cannot be previewed. Please download to view.');
      return;
    }
    
    const filePath = attachment.path;
    const fileName = filePath.split('/').pop().toLowerCase();
    const extension = fileName.split('.').pop();
    const baseUrl = `https://160.30.21.113:5000${filePath}`;
    
    let previewUrl = baseUrl;
    
    // Office documents - sử dụng Google Docs Viewer
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
      previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(baseUrl)}&embedded=true`;
    }
    
    // Mở trong tab mới
    window.open(previewUrl, '_blank');
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div>Loading milestones...</div>
      </div>
    );
  }

  // Helper to determine if mobile (iPhone XR is ~414px, so we use <= 576px for small mobile)
  const isMobile = windowWidth <= 576;
  const isTablet = windowWidth > 576 && windowWidth <= 1024;
  const isDesktop = windowWidth > 1024;

  return (
    <div className={sharedLayout.container}>
      {/* Header */}
      <div className={sharedLayout.header}>
        <h1>Milestones Tracking</h1>
      </div>

      {/* Semester + Group Filter */}
      <div style={{ marginBottom: 24 }}>
        <SupervisorGroupFilter
          semesters={semesters}
          selectedSemesterId={selectedSemesterId}
          onSemesterChange={setSelectedSemesterId}
          groupExpireFilter={groupExpireFilter}
          onGroupExpireFilterChange={setGroupExpireFilter}
          groups={groups}
          selectedGroupId={selectedGroup?.id ? selectedGroup.id.toString() : ''}
          onGroupChange={(value) => {
            const selectedId = value ? Number(value) : null;
            const group = groups.find(g => String(g.id) === String(selectedId));
            if (group) {
              setSelectedGroup(group);
              setMilestoneDetails(null);
              setSelectedMilestone(null);
              setDetailModal(false);
              setNote('');
              setNoteError('');
            } else {
              setSelectedGroup(null);
            }
          }}
          groupSelectPlaceholder="Select group"
          loading={loading}
        />
        {groupInfo && (
          <div style={{ 
            fontSize: 14, 
            color: '#64748b',
            wordBreak: 'break-word',
            maxWidth: '100%',
            marginTop: 8
          }}>
            Group: {groupInfo.projectName}
          </div>
        )}
      </div>
      
      {/* Supervisors Info - Responsive */}
      {groupInfo?.supervisors && (
        <div style={{ 
          marginBottom: 16 
        }}>
          <div style={{ 
            background: '#f0fdf4', 
            border: '1px solid #10b981', 
            borderRadius: 8, 
            padding: 8,
            width: '100%',
            maxWidth: isMobile ? '100%' : isTablet ? '70%' : '50%'
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46', wordBreak: 'break-word' }}>
              Supervisors: {groupInfo.supervisors.join(', ')}
            </div>
          </div>
        </div>
      )}


      {/* Summary Tables - Responsive Layout */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile || isTablet ? 'column' : 'row',
        gap: isMobile ? 12 : 16, 
        marginTop: isMobile ? 16 : 24 
      }}>
        
        {/* Group Members Table - Responsive */}
        {groupInfo?.students && (
          <div style={{ 
            flex: 1, 
            minWidth: isMobile || isTablet ? '100%' : '350px',
            maxWidth: isMobile || isTablet ? '100%' : '500px',
            marginBottom: isMobile || isTablet ? 20 : 0
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#333' }}>Group Members</h3>
            <div style={{ 
              overflowX: 'auto',
              background: '#fff',
              width: '100%',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'separate', 
                borderSpacing: 0,
                minWidth: isMobile ? '450px' : 'auto',
                tableLayout: 'fixed'
              }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ textAlign: 'center', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '35px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '90px' }}>Roll Number</th>
                    <th style={{ textAlign: 'left', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px' }}>Name</th>
                    <th style={{ textAlign: 'center', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '75px' }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {groupInfo.students.map((student, index) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: isMobile ? '12px' : '13px', color: '#6c757d' }}>{index + 1}</div>
                      </td>
                      <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 600, fontSize: isMobile ? '12px' : '13px', color: '#333', wordBreak: 'break-word' }}>{student.rollNumber}</div>
                      </td>
                      <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: isMobile ? '13px' : '14px', color: '#333', wordBreak: 'break-word' }}>{student.name}</div>
                      </td>
                      <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <span style={{ 
                          color: '#059669', 
                          background: '#ecfdf5',
                          padding: isMobile ? '3px 5px' : '4px 6px',
                          borderRadius: 6,
                          fontSize: isMobile ? '11px' : '12px',
                          fontWeight: 600,
                          border: '1px solid #10b981',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                          {student.role === "Student" ? 'Member' : (student.role || 'Member')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Milestones Summary Table - Using DataTable */}
      <div className={sharedLayout.contentSection} style={{ marginTop: isMobile ? 16 : 24 }}>
        <h2>Milestones Summary</h2>
        <DataTable
          columns={[
            {
              key: 'index',
              title: '#',
              render: (milestone, index) => (
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#6c757d', textAlign: 'center' }}>
                  {index + 1}
                </div>
              )
            },
            {
              key: 'name',
              title: 'Milestone',
              render: (milestone) => (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: 4, color: '#333', wordBreak: 'break-word' }}>
                    {milestone.name}
                  </div>
                  {milestone.description && (
                    <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-word' }}>
                      {milestone.description}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'deadline',
              title: 'Deadline',
              render: (milestone) => (
                <div style={{ color: '#059669', fontWeight: 600, fontSize: '13px' }}>
                  {formatDate(milestone.endAt, 'YYYY-MM-DD HH:mm')}
                </div>
              )
            },
            {
              key: 'status',
              title: 'Status',
              render: (milestone) => (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ 
                    color: getStatusColor(milestone.status), 
                    background: getStatusColor(milestone.status) === '#059669' ? '#ecfdf5' : 
                               getStatusColor(milestone.status) === '#dc2626' ? '#fee2e2' :
                               getStatusColor(milestone.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: '12px',
                    fontWeight: 600,
                    border: `1px solid ${getStatusColor(milestone.status)}`,
                    display: 'inline-block',
                    whiteSpace: 'nowrap'
                  }}>
                    {getStatusText(milestone.status)}
                  </span>
                </div>
              )
            },
            {
              key: 'actions',
              title: 'Actions',
              render: (milestone) => (
                <div style={{ textAlign: 'center' }}>
                  <Button
                    onClick={() => openDetailModal(milestone)}
                    variant="ghost"
                    style={{ 
                      fontSize: '12px', 
                      padding: '6px 10px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    View Details
                  </Button>
                </div>
              )
            }
          ]}
          data={milestones}
          loading={loading}
          emptyMessage="No milestones found"
        />
      </div>

      <Modal open={detailModal} onClose={() => setDetailModal(false)}>
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
                  <div style={{ wordBreak: 'break-word' }}><strong>Note:</strong> {milestoneDetails?.note || 'Chưa có ghi chú nào'}</div>
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
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    background: isLatest ? '#f0f9ff' : 'white',
                                    border: isLatest ? '2px solid #3b82f6' : '1px solid #d1d5db',
                                    borderRadius: 4,
                                    marginBottom: 8
                                  }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
                                        {attachment.isDownload && (
                                          <span style={{
                                            background: '#059669',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600
                                          }}>
                                            DOWNLOADED
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#64748b' }}>
                                        Uploaded by {attachment.userName} on {formatDate(attachment.createAt, 'DD/MM/YYYY HH:mm')}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
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
                                            color: '#6b7280'
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
                                        style={{ fontSize: 11, padding: '4px 8px', flexShrink: 0 }}
                                      >
                                        Download
                                      </Button>
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

            {/* Note Input and Actions */}
            {(selectedMilestone.status === 'Pending' || selectedMilestone.status === 'PENDING') && (
              <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Review Note (Required for rejection)
                </h4>
                <textarea
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    setNoteError('');
                  }}
                  placeholder="Enter your review note here..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '8px 12px',
                    border: `1px solid ${noteError ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
                {noteError && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                    {noteError}
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile || isTablet ? 'column' : 'row',
                  justifyContent: 'space-between', 
                  alignItems: isMobile || isTablet ? 'stretch' : 'center',
                  gap: '12px',
                  marginTop: '12px'
                }}>
                  <div style={{ 
                    fontSize: isMobile ? '11px' : '12px', 
                    color: '#64748b',
                    wordBreak: 'break-word',
                    flex: isMobile || isTablet ? 'none' : '1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {!checkAllItemsSubmitted() ? (
                      <div style={{ color: '#dc2626', fontWeight: 600 }}>
                        ⚠ Cannot confirm: Some items have not been submitted yet
                      </div>
                    ) : checkAllAttachmentsDownloaded() ? (
                      <div style={{ color: '#059669', fontWeight: 600 }}>
                        ✓ All items submitted and latest attachments downloaded
                      </div>
                    ) : (
                      <div style={{ color: '#d97706', fontWeight: 600 }}>
                        ⚠ Please download the latest attachments before confirming
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile || isTablet ? 'column' : 'row',
                    gap: '8px',
                    width: isMobile || isTablet ? '100%' : 'auto'
                  }}>
                    <Button
                      onClick={handleReject}
                      disabled={rejecting || !note.trim() || !checkAllAttachmentsDownloaded()}
                      style={{ 
                        background: '#dc2626', 
                        color: 'white',
                        fontSize: isMobile ? '11px' : '12px',
                        padding: isMobile ? '6px 10px' : '6px 12px',
                        width: isMobile || isTablet ? '100%' : 'auto'
                      }}
                    >
                      {rejecting ? 'Rejecting...' : 'Reject'}
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={confirming || !checkCanConfirm()}
                      style={{ 
                        background: '#059669', 
                        color: 'white',
                        fontSize: isMobile ? '11px' : '12px',
                        padding: isMobile ? '6px 10px' : '6px 12px',
                        width: isMobile || isTablet ? '100%' : 'auto',
                        opacity: !checkCanConfirm() ? 0.5 : 1,
                        cursor: !checkCanConfirm() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {confirming ? 'Confirming...' : 'Confirm'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button variant="ghost" onClick={() => setDetailModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
