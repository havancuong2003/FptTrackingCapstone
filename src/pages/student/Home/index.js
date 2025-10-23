import React from 'react';
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

export default function StudentHome() {
  const [userInfo, setUserInfo] = React.useState(null);
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [semesterInfo, setSemesterInfo] = React.useState(null);
  const [weeks, setWeeks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [selectedWeek, setSelectedWeek] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

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

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Weekly Schedule</h1>
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

      {/* Quick Summary */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Quick Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e', marginBottom: 4 }}>
              Total Milestones
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0369a1' }}>
              {milestones.length}
            </div>
          </div>
          
          <div style={{ 
            background: '#ecfdf5', 
            border: '1px solid #10b981', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#065f46', marginBottom: 4 }}>
              Submitted
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>
              {milestones.filter(m => m.status === 'SUBMITTED').length}
            </div>
          </div>
          
          <div style={{ 
            background: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
              Pending
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>
              {milestones.filter(m => m.status === 'Pending').length}
            </div>
          </div>
          
          <div style={{ 
            background: '#fee2e2', 
            border: '1px solid #dc2626', 
            borderRadius: 8, 
            padding: 16 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>
              Late
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>
              {milestones.filter(m => m.status === 'LATE').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
