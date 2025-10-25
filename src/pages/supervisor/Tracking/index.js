import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Select from '../../../components/Select/Select';
import client from '../../../utils/axiosClient';
import { formatDate } from '../../../utils/date';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  { label: '00:00-04:00', start: 0, end: 4 },
  { label: '04:00-08:00', start: 4, end: 8 },
  { label: '08:00-12:00', start: 8, end: 12 },
  { label: '12:00-16:00', start: 12, end: 16 },
  { label: '16:00-20:00', start: 16, end: 20 },
  { label: '20:00-24:00', start: 20, end: 24 }
];

export default function SupervisorTracking() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [groups, setGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [semesterInfo, setSemesterInfo] = React.useState(null);
  const [weeks, setWeeks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [selectedWeek, setSelectedWeek] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [detailModal, setDetailModal] = React.useState(false);
  const [milestoneDetails, setMilestoneDetails] = React.useState(null);
  const [confirming, setConfirming] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [noteError, setNoteError] = React.useState('');

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

  // Load semester info and weeks
  React.useEffect(() => {
    let mounted = true;
    async function loadSemesterInfo() {
      if (!groupInfo?.semesterId) return;
      try {
        const res = await client.get(`https://160.30.21.113:5000/api/v1/Staff/semester/getSemesterBy/${groupInfo.semesterId}`);
        const semester = res?.data?.data || null;
        if (!mounted) return;
        setSemesterInfo(semester);
        setWeeks(semester?.weeks || []);
        if (semester?.weeks?.length > 0) {
          setSelectedWeek(semester.weeks[0].weekNumber);
        }
      } catch {
        if (!mounted) return;
        setSemesterInfo(null);
        setWeeks([]);
      }
    }
    loadSemesterInfo();
    return () => { mounted = false; };
  }, [groupInfo?.semesterId]);

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
    if (userInfo && groups.length > 0 && groupInfo && semesterInfo && weeks.length > 0) {
      setLoading(false);
    }
  }, [userInfo, groups, groupInfo, semesterInfo, weeks]);

  // Get milestones for selected week
  const getMilestonesForWeek = () => {
    if (!selectedWeek || !milestones.length) return [];
    
    const selectedWeekData = weeks.find(w => w.weekNumber === selectedWeek);
    if (!selectedWeekData) return [];
    
    const weekStart = new Date(selectedWeekData.startAt);
    const weekEnd = new Date(selectedWeekData.endAt);
    
    return milestones.filter(milestone => {
      if (!milestone.endAt) return false;
      const deadline = new Date(milestone.endAt);
      return deadline >= weekStart && deadline <= weekEnd;
    });
  };

  // Get milestone for specific day and time slot
  const getMilestoneForSlot = (day, timeSlot) => {
    const weekMilestones = getMilestonesForWeek();
    if (!weekMilestones.length) return null;
    
    const deadline = new Date(weekMilestones[0].endAt);
    const dayOfWeek = deadline.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = deadline.getHours();
    
    // Convert Sunday=0 to Monday=0 format
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    if (adjustedDay === day && hour >= timeSlot.start && hour < timeSlot.end) {
      return weekMilestones[0];
    }
    
    return null;
  };

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
    
    return milestoneDetails.deliveryItems.every(item => 
      item.attachments && item.attachments.length > 0 && 
      item.attachments.every(attachment => attachment.isDownload)
    );
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

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Milestones Tracking</h1>
        {groupInfo && (
          <div style={{ fontSize: 14, color: '#64748b' }}>
            Group: {groupInfo.projectName}
          </div>
        )}
      </div>
      
      {semesterInfo && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 16, 
          marginBottom: 16 
        }}>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8, 
            padding: 8, 
            flex: 1
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e' }}>
              Semester: {semesterInfo.name} ({formatDate(semesterInfo.startAt, 'DD/MM/YYYY')} - {formatDate(semesterInfo.endAt, 'DD/MM/YYYY')})
            </div>
          </div>
          {groupInfo?.supervisors && (
            <div style={{ 
              background: '#f0fdf4', 
              border: '1px solid #10b981', 
              borderRadius: 8, 
              padding: 8,
              flex: 1
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>
                Supervisors: {groupInfo.supervisors.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Group Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Group:</span>
        <select 
          value={selectedGroup?.id || ''} 
          onChange={(e) => {
            const group = groups.find(g => g.id === Number(e.target.value));
            setSelectedGroup(group);
          }}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            backgroundColor: "white",
            outline: "none",
            minWidth: 300,
            maxWidth: 400
          }}
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.projectName} 
            </option>
          ))}
        </select>
      </div>

      {/* Week Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Week:</span>
        <select 
          value={selectedWeek} 
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          style={{
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            backgroundColor: "white",
            outline: "none",
            minWidth: 120,
            maxWidth: 300
          }}
        >
          {weeks.map((week) => (
            <option 
              key={week.weekNumber} 
              value={week.weekNumber}
              disabled={week.isVacation}
              style={{ 
                color: week.isVacation ? '#9ca3af' : '#000',
                backgroundColor: week.isVacation ? '#f3f4f6' : '#fff'
              }}
            >
              Week {week.weekNumber} ({formatDate(week.startAt, 'DD/MM/YYYY')}-{formatDate(week.endAt, 'DD/MM/YYYY')}) {week.isVacation ? '(Vacation)' : ''}
            </option>
          ))}
        </select>
      </div>
              
      {/* Calendar Table */}
      <div style={{ 
        border: '1px solid #e5e7eb', 
        borderRadius: 8, 
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ 
                padding: '12px 8px', 
                borderBottom: '1px solid #e5e7eb', 
                fontWeight: 600, 
                fontSize: 12,
                width: '80px'
              }}>
                Time
              </th>
              {DAYS.map((day) => (
                <th key={day} style={{ 
                  padding: '12px 8px', 
                  borderBottom: '1px solid #e5e7eb', 
                  fontWeight: 600, 
                  fontSize: 12,
                  textAlign: 'center'
                }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((timeSlot, slotIndex) => (
              <tr key={timeSlot.label}>
                <td style={{ 
                  padding: '8px', 
                  borderBottom: '1px solid #f1f5f9', 
                  fontSize: 11, 
                  fontWeight: 600,
                  background: '#f8fafc',
                  textAlign: 'center'
                }}>
                  {timeSlot.label}
                </td>
                {DAYS.map((day, dayIndex) => {
                  const milestone = getMilestoneForSlot(dayIndex, timeSlot);
                  return (
                    <td key={day} style={{ 
                      padding: '8px', 
                      borderBottom: '1px solid #f1f5f9',
                      borderRight: '1px solid #f1f5f9',
                      minHeight: '60px',
                      verticalAlign: 'top'
                    }}>
                      {milestone ? (
                        <div 
                          style={{ 
                            background: getStatusColor(milestone.status) === '#059669' ? '#ecfdf5' : 
                                       getStatusColor(milestone.status) === '#dc2626' ? '#fee2e2' :
                                       getStatusColor(milestone.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                            border: `1px solid ${getStatusColor(milestone.status)}`,
                            borderRadius: 4,
                            padding: 4,
                            cursor: 'pointer',
                            fontSize: 9,
                            maxHeight: '50px',
                            overflow: 'hidden'
                          }}
                          onClick={() => openDetailModal(milestone)}
                        >
                          <div style={{ fontWeight: 600, color: getStatusColor(milestone.status), marginBottom: 2, fontSize: 9, lineHeight: 1.2 }}>
                            {milestone.name.length > 20 ? milestone.name.substring(0, 20) + '...' : milestone.name}
                          </div>
                          <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                            {getStatusText(milestone.status)}
                          </div>
                          <div style={{ color: getStatusColor(milestone.status), fontSize: 8 }}>
                            {formatDate(milestone.endAt, 'HH:mm')}
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '40px' }}></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Tables - Side by Side */}
      <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        
        {/* Group Members Table */}
        {groupInfo?.students && (
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Group Members</h3>
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: 8, 
              overflow: 'hidden',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 13 }}>Student ID</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 13 }}>Name</th>
                    <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 13 }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {groupInfo.students.map((student, index) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{student.id}</div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 14 }}>{student.name}</div>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <span style={{ 
                          color: '#059669', 
                          background: '#ecfdf5',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600
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
      
      {/* Milestones Summary Table */}
      <div style={{ flex: 1 , gap: 16, marginTop: 24}}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Milestones Summary</h3>
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: 8, 
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 13 }}>Milestone</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 13 }}>Deadline</th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 13 }}>Status</th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone) => (
                <tr key={milestone.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{milestone.name}</div>
                    {milestone.description && (
                      <div style={{ fontSize: 12, color: '#64748b' }}>{milestone.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ color: '#059669', fontWeight: 600, fontSize: 13 }}>
                       {formatDate(milestone.endAt, 'YYYY-MM-DD HH:mm')}
                    </div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <span style={{ 
                      color: getStatusColor(milestone.status), 
                      background: getStatusColor(milestone.status) === '#059669' ? '#ecfdf5' : 
                                 getStatusColor(milestone.status) === '#dc2626' ? '#fee2e2' :
                                 getStatusColor(milestone.status) === '#d97706' ? '#fef3c7' : '#f3f4f6',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {getStatusText(milestone.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Button
                      onClick={() => openDetailModal(milestone)}
                      variant="ghost"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
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

      <Modal open={detailModal} onClose={() => setDetailModal(false)}>
        {selectedMilestone && (
          <div style={{ padding: 24, maxWidth: '95vw', width: '1200px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20 }}>Milestone Details</h2>
            
            <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Basic Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><strong>Name:</strong> {selectedMilestone.name}</div>
                  <div><strong>Description:</strong> {selectedMilestone.description}</div>
                  <div><strong>Deadline:</strong> {formatDate(selectedMilestone.endAt, 'YYYY-MM-DD HH:mm')}</div>
                  <div><strong>Status:</strong> 
                    <span style={{ 
                      color: getStatusColor(selectedMilestone.status), 
                      marginLeft: '8px',
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
                  <div><strong>Note:</strong> {milestoneDetails?.note || 'Chưa có ghi chú nào'}</div>
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#374151' }}>Project Information</h3>
                {groupInfo && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div><strong>Project:</strong> {groupInfo.projectName}</div>
                    <div><strong>Supervisors:</strong> {groupInfo.supervisors?.join(', ')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Items */}
            {milestoneDetails?.deliveryItems && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>Delivery Items</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 16 }}>
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
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '12px'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {checkAllAttachmentsDownloaded() ? 
                      '✓ All attachments downloaded' : 
                      '⚠ Please download all attachments before confirming'
                    }
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      onClick={handleReject}
                      disabled={rejecting || !note.trim()}
                      style={{ 
                        background: '#dc2626', 
                        color: 'white',
                        fontSize: '12px',
                        padding: '6px 12px'
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
                        fontSize: '12px',
                        padding: '6px 12px'
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
