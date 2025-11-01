import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Select from '../../../components/Select/Select';
import client from '../../../utils/axiosClient';
import { formatDate } from '../../../utils/date';

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

  // Load user info
  React.useEffect(() => {
    let mounted = true;
    async function loadUserInfo() {
      try {
        const res = await client.get("https://160.30.21.113:5000/api/v1/auth/user-info");
        const user = res?.data?.data || null;
        if (!mounted) return;
        setUserInfo(user);
        
        // Load groups that this supervisor is supervising
        if (user?.groups && user.groups.length > 0) {
          // Fetch all groups that this supervisor manages
          const allGroups = [];
          for (const groupId of user.groups) {
            try {
              const groupsRes = await client.get(`https://160.30.21.113:5000/api/v1/Staff/capstone-groups/${groupId}`);
              const groupData = groupsRes?.data?.data;
              if (groupData) {
                allGroups.push(groupData);
              }
            } catch (error) {
              console.error(`Error loading group ${groupId}:`, error);
            }
          }
          setGroups(allGroups);
          if (allGroups.length > 0) {
            setSelectedGroup(allGroups[0]);
          }
        }
      } catch {
        if (!mounted) return;
        setUserInfo(null);
        setGroups([]);
      }
    }
    loadUserInfo();
    return () => { mounted = false; };
  }, []);

  // Load group info
  React.useEffect(() => {
    let mounted = true;
    async function loadGroupInfo() {
      if (!selectedGroup?.id) return;
      try {
        const res = await client.get(`https://160.30.21.113:5000/api/v1/Staff/capstone-groups/${selectedGroup.id}`);
        const group = res?.data?.data || null;
        if (!mounted) return;
        setGroupInfo(group);
      } catch {
        if (!mounted) return;
        setGroupInfo(null);
      }
    }
    loadGroupInfo();
    return () => { mounted = false; };
  }, [selectedGroup?.id]);


  // Load milestones
  React.useEffect(() => {
    let mounted = true;
    async function loadMilestones() {
      if (!selectedGroup?.id) return;
      try {
        const res = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/${selectedGroup.id}`);
        const list = Array.isArray(res?.data) ? res.data : [];
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
      const res = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${selectedGroup.id}&deliverableId=${milestone.id}`);
      setMilestoneDetails(res?.data || null);
    } catch (error) {
      console.error('Error loading milestone details:', error);
      setMilestoneDetails(null);
    }
  };

  const markDownload = async (attachmentId) => {
    try {
      const res = await client.put(`https://160.30.21.113:5000/api/v1/deliverables/Mark-download?attachmentId=${attachmentId}`);
      if (res.data.status === 200) {
        // Reload milestone details to update download status
        if (selectedMilestone) {
          const detailRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${selectedGroup.id}&deliverableId=${selectedMilestone.id}`);
          setMilestoneDetails(detailRes?.data || null);
        }
      }
    } catch (error) {
      console.error('Error marking download:', error);
    }
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

  const handleConfirm = async () => {
    if (!selectedGroup?.id || !selectedMilestone) return;
    
    // Validate note
    if (!note.trim()) {
      setNoteError('Note is required for confirmation');
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
      const res = await client.put(`https://160.30.21.113:5000/api/v1/deliverables/confirmed?groupdId=${selectedGroup.id}&deliverableId=${selectedMilestone.id}&note=${encodeURIComponent(note)}`);
      
      // Reload milestones after successful confirmation
      const milestonesRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/${selectedGroup.id}`);
      const list = Array.isArray(milestonesRes?.data) ? milestonesRes.data : [];
      setMilestones(list);
      
      // Update selectedMilestone with new status
      const updatedMilestone = list.find(m => m.id === selectedMilestone.id);
      if (updatedMilestone) {
        setSelectedMilestone(updatedMilestone);
      }
      
      // Reload milestone details
      const detailRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${selectedGroup.id}&deliverableId=${selectedMilestone.id}`);
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
      const res = await client.put(`https://160.30.21.113:5000/api/v1/deliverables/reject?groupdId=${selectedGroup.id}&deliverableId=${selectedMilestone.id}&note=${encodeURIComponent(note)}`);
      
      if (res.data.status === 200) {
        // Reload milestones after successful rejection
        const milestonesRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/${selectedGroup.id}`);
        const list = Array.isArray(milestonesRes?.data) ? milestonesRes.data : [];
        setMilestones(list);
        
        // Update selectedMilestone with new status
        const updatedMilestone = list.find(m => m.id === selectedMilestone.id);
        if (updatedMilestone) {
          setSelectedMilestone(updatedMilestone);
        }
        
        // Reload milestone details
        const detailRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${selectedGroup.id}&deliverableId=${selectedMilestone.id}`);
        setMilestoneDetails(detailRes?.data || null);
        
        setNote('');
        alert('Milestone rejected successfully!');
      }
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
    <div style={{ padding: isMobile ? '12px' : isTablet ? '14px' : '16px', maxWidth: '100%', overflowX: 'auto' }}>
      {/* Header - Responsive */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile || isTablet ? 'column' : 'row',
        alignItems: isMobile || isTablet ? 'flex-start' : 'center',
        gap: isMobile ? 12 : 16, 
        marginBottom: isMobile ? 20 : 24 
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : isTablet ? '22px' : '24px' }}>Milestones Tracking</h1>
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

      {/* Group Selector - Responsive */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile || isTablet ? 'column' : 'row',
        alignItems: isMobile || isTablet ? 'stretch' : 'center',
        gap: 8, 
        marginBottom: isMobile ? 12 : 16 
      }}>
        <span style={{ 
          fontWeight: 600, 
          fontSize: isMobile ? '13px' : '14px',
          minWidth: isMobile || isTablet ? 'auto' : '60px'
        }}>Group:</span>
        <select 
          value={selectedGroup?.id || ''} 
          onChange={(e) => {
            const selectedId = e.target.value ? Number(e.target.value) : null;
            const group = groups.find(g => String(g.id) === String(selectedId));
            if (group) {
              setSelectedGroup(group);
              // Reset milestone details when changing group
              setMilestoneDetails(null);
              setSelectedMilestone(null);
              setDetailModal(false);
              setNote('');
              setNoteError('');
            }
          }}
          style={{
            padding: isMobile ? "6px 10px" : "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: isMobile ? "13px" : "14px",
            backgroundColor: "white",
            outline: "none",
            width: isMobile || isTablet ? '100%' : 'auto',
            minWidth: isMobile || isTablet ? 'auto' : 300,
            maxWidth: isMobile || isTablet ? '100%' : 400
          }}
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.projectName} 
            </option>
          ))}
        </select>
      </div>


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
                          {student.role}
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
            minWidth: isMobile ? '600px' : 'auto'
          }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ textAlign: 'center', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '35px' }}>#</th>
                <th style={{ textAlign: 'left', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px' }}>Milestone</th>
                <th style={{ textAlign: 'left', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '130px' }}>Deadline</th>
                <th style={{ textAlign: 'center', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '130px' }}>Status</th>
                <th style={{ textAlign: 'center', padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: isMobile ? '12px' : '13px', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone, index) => (
                <tr key={milestone.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: isMobile ? '12px' : '13px', color: '#6c757d' }}>{index + 1}</div>
                  </td>
                  <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 8px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600, fontSize: isMobile ? '13px' : '14px', marginBottom: 4, color: '#333', wordBreak: 'break-word' }}>{milestone.name}</div>
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
                      color: getStatusColor(milestone.status), 
                      background: getStatusColor(milestone.status) === '#059669' ? '#ecfdf5' : 
                                 getStatusColor(milestone.status) === '#dc2626' ? '#fee2e2' :
                                 getStatusColor(milestone.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                      padding: isMobile ? '3px 6px' : '4px 8px',
                      borderRadius: 6,
                      fontSize: isMobile ? '11px' : '12px',
                      fontWeight: 600,
                      border: `1px solid ${getStatusColor(milestone.status)}`,
                      display: 'inline-block',
                      whiteSpace: 'nowrap'
                    }}>
                      {getStatusText(milestone.status)}
                    </span>
                  </td>
                  <td style={{ padding: isMobile ? '6px 4px' : isTablet ? '8px 4px' : '10px 6px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Button
                      onClick={() => openDetailModal(milestone)}
                      variant="ghost"
                      style={{ 
                        fontSize: isMobile ? '10px' : isTablet ? '11px' : '12px', 
                        padding: isMobile ? '4px 6px' : isTablet ? '5px 8px' : '6px 10px',
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
                  </td>
                </tr>
              ))}
              {milestones.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                    No milestones found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                                    <Button
                                      onClick={() => downloadFile(attachment)}
                                      variant="ghost"
                                      style={{ fontSize: 11, padding: '4px 8px', flexShrink: 0 }}
                                    >
                                      Download
                                    </Button>
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
            {selectedMilestone.status === 'Pending' && (
              <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                  Review Note (Required)
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
                    flex: isMobile || isTablet ? 'none' : '1'
                  }}>
                    {checkAllAttachmentsDownloaded() ? 
                      '✓ Latest attachments downloaded' : 
                      '⚠ Please download the latest attachments before confirming'
                    }
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
                      disabled={confirming || !note.trim() || !checkAllAttachmentsDownloaded()}
                      style={{ 
                        background: '#059669', 
                        color: 'white',
                        fontSize: isMobile ? '11px' : '12px',
                        padding: isMobile ? '6px 10px' : '6px 12px',
                        width: isMobile || isTablet ? '100%' : 'auto'
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
