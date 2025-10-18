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

export default function StudentMilestones() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [semesterInfo, setSemesterInfo] = React.useState(null);
  const [weeks, setWeeks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [selectedWeek, setSelectedWeek] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [detailModal, setDetailModal] = React.useState(false);
  const [milestoneDetails, setMilestoneDetails] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = React.useState(null);

  // Load user info
  React.useEffect(() => {
    let mounted = true;
    async function loadUserInfo() {
      try {
        const res = await client.get("https://160.30.21.113:5000/api/v1/auth/user-info");
        const user = res?.data?.data || null;
        if (!mounted) return;
        setUserInfo(user);
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
      if (!userInfo?.groupId) return;
      try {
        const res = await client.get(`https://160.30.21.113:5000/api/v1/Staff/capstone-groups/${userInfo.groupId}`);
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
  }, [userInfo?.groupId]);

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
      if (!userInfo?.groupId) return;
      try {
        const res = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/${userInfo.groupId}`);
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
  }, [userInfo?.groupId]);

  // Set loading false when all data loaded
  React.useEffect(() => {
    if (userInfo && groupInfo && semesterInfo && weeks.length > 0) {
      setLoading(false);
    }
  }, [userInfo, groupInfo, semesterInfo, weeks]);

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

  const openDetailModal = async (milestone) => {
    setSelectedMilestone(milestone);
    setDetailModal(true);
    
    // Load milestone details
    try {
      const res = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${userInfo.groupId}&deliverableId=${milestone.id}`);
      setMilestoneDetails(res?.data || null);
    } catch (error) {
      console.error('Error loading milestone details:', error);
      setMilestoneDetails(null);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async (deliveryItemId) => {
    if (!selectedFile || !userInfo?.groupId) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const res = await client.post(
        `https://160.30.21.113:5000/api/v1/upload/milestone?groupId=${userInfo.groupId}&deliveryItemId=${deliveryItemId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Reload milestones after successful upload
      const milestonesRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/${userInfo.groupId}`);
      const list = Array.isArray(milestonesRes?.data) ? milestonesRes.data : [];
      setMilestones(list);
      
      // Update selectedMilestone with new status
      const updatedMilestone = list.find(m => m.id === selectedMilestone.id);
      if (updatedMilestone) {
        setSelectedMilestone(updatedMilestone);
      }
      
      // Reload milestone details after successful upload
      if (selectedMilestone) {
        const detailRes = await client.get(`https://160.30.21.113:5000/api/v1/deliverables/group/detail?groupdId=${userInfo.groupId}&deliverableId=${selectedMilestone.id}`);
        setMilestoneDetails(detailRes?.data || null);
      }
      
      setSelectedFile(null);
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
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const getLatestAttachment = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    return attachments.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0];
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
      default:
        return '❓ Unknown';
    }
  };

  const showHistory = (item) => {
    setSelectedItemHistory(item);
    setShowHistoryModal(true);
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
        <h1 style={{ margin: 0, fontSize: 24 }}>Milestones Calendar</h1>
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

      {/* Week Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Week:</span>
        <Select 
          value={selectedWeek} 
          onChange={(e) => setSelectedWeek(Number(e.target.value))}
          style={{ minWidth: 120, maxWidth: 300 }}
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
        </Select>
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
                        📅 {formatDate(milestone.endAt, 'YYYY-MM-DD HH:mm')}
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
                  </tr>
                ))}
                {milestones.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
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
                      
                      {/* Upload Section */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <input
                            type="file"
                            id={`file-${item.id}`}
                            onChange={handleFileSelect}
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
                          {selectedFile && (
                            <Button
                              onClick={() => handleUpload(item.id)}
                              disabled={uploading}
                              style={{ fontSize: 12, padding: '6px 12px' }}
                            >
                              {uploading ? 'Uploading...' : 'Upload'}
                            </Button>
                          )}
                        </div>
                        {selectedFile && (
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            Selected: {selectedFile.name}
                          </div>
                        )}
                      </div>

                      {/* Latest Attachment */}
                      {item.attachments && item.attachments.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <h5 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Current Version:</h5>
                            {item.attachments.length > 1 && (
                              <Button
                                onClick={() => showHistory(item)}
                                variant="ghost"
                                style={{ fontSize: 11, padding: '4px 8px' }}
                              >
                                View History ({item.attachments.length} versions)
                              </Button>
                            )}
                          </div>
                          
                          {(() => {
                            const latestAttachment = getLatestAttachment(item.attachments);
                            return latestAttachment ? (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                background: 'white',
                                border: '1px solid #d1d5db',
                                borderRadius: 4
                              }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 500, wordBreak: 'break-all' }}>
                                    {latestAttachment.path.split('/').pop()}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#64748b' }}>
                                    Uploaded by {latestAttachment.userName} on {formatDate(latestAttachment.createAt, 'DD/MM/YYYY HH:mm')}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => downloadFile(latestAttachment)}
                                  variant="ghost"
                                  style={{ fontSize: 11, padding: '4px 8px', flexShrink: 0 }}
                                >
                                  Download
                                </Button>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
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

      {/* History Modal */}
      <Modal open={showHistoryModal} onClose={() => setShowHistoryModal(false)}>
        {selectedItemHistory && (
          <div style={{ padding: 24, maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20 }}>File History</h2>
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
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: index === 0 ? '#f0f9ff' : 'white',
                      border: index === 0 ? '2px solid #3b82f6' : '1px solid #d1d5db',
                      borderRadius: 8,
                      marginBottom: 8
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>
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
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          Uploaded by {attachment.userName} on {formatDate(attachment.createAt, 'DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                      <Button
                        onClick={() => downloadFile(attachment)}
                        variant="ghost"
                        style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
                      >
                        Download
                      </Button>
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
