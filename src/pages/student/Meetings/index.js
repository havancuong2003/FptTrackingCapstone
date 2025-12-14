import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import { getUserInfo, getGroupId } from '../../../auth/auth';
import { getMeetingScheduleDatesByGroup } from '../../../api/meetings';

export default function StudentMeetings() {
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');
  const [hasGroup, setHasGroup] = React.useState(false);

  // Check groupId first
  React.useEffect(() => {
    // Get info from localStorage, don't call API
    const userInfo = getUserInfo();
    const groupId = getGroupId() || localStorage.getItem('student_group_id');
    
    if (groupId || (userInfo?.groups && userInfo.groups.length > 0)) {
      setHasGroup(true);
    } else {
      setHasGroup(false);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Only fetch meetings if has group
    if (!hasGroup) return;
    
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        
        // Get groupId from localStorage, don't call API
        const userInfo = getUserInfo();
        const groupId = getGroupId() || localStorage.getItem('student_group_id');
        
        if (!groupId) {
          setMeetings([]);
          setLoading(false);
          return;
        }
        
        // Call real API to get meetings
        const response = await getMeetingScheduleDatesByGroup(groupId);
        
        if (response.status === 200) {
          const apiData = response.data;
          const meetingsData = Array.isArray(apiData) ? apiData : [];
          
          // Map data from API to frontend format
          const mappedMeetings = meetingsData
            .filter(meeting => meeting.isMeeting === true)
            .map(meeting => ({
              id: meeting.id,
              topic: meeting.description || 'Meeting',
              datetime: meeting.meetingDate ? `${meeting.meetingDate}T${meeting.time || '00:00:00'}` : new Date().toISOString(),
              duration: 60, // Default duration if not available
              linkMeet: meeting.meetingLink || '',
              participants: [], // Can get from group members if needed
              status: new Date(meeting.meetingDate) < new Date() ? 'completed' : 'upcoming',
              objective: meeting.description || '',
              meetingDate: meeting.meetingDate,
              time: meeting.time,
              dayOfWeek: meeting.dayOfWeek
            }));
          
          setMeetings(mappedMeetings);
        } else {
          setMeetings([]);
        }
      } catch (error) {
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [hasGroup]);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { color: '#059669', text: 'Completed', icon: '✓' };
      case 'upcoming':
        return { color: '#3b82f6', text: 'Upcoming', icon: '📅' };
      case 'scheduled':
        return { color: '#d97706', text: 'Scheduled', icon: '⏰' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '?' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (filter === 'all') return true;
    return meeting.status === filter;
  });

  const joinMeeting = (link) => {
    window.open(link, '_blank');
  };

  // Nếu không có group, hiển thị thông báo
  if (!hasGroup && !loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>You are not in any group</div>
          <div className={styles.emptyMessage}>Please contact the supervisor to be added to a group.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading meetings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meetings</h1>
        <div className={styles.filters}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Meetings</option>
            <option value="upcoming">Upcoming</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      <div className={styles.meetingsList}>
        {filteredMeetings.map((meeting) => {
          const statusInfo = getStatusInfo(meeting.status);
          const isUpcoming = meeting.status === 'upcoming';
          const isCompleted = meeting.status === 'completed';
          
          return (
            <div key={meeting.id} className={styles.meetingCard}>
              <div className={styles.meetingHeader}>
                <div className={styles.meetingInfo}>
                  <h3>{meeting.topic}</h3>
                  <p className={styles.meetingObjective}>{meeting.objective}</p>
                </div>
                <div className={styles.meetingStatus}>
                  <span 
                    className={styles.statusIcon}
                    style={{ color: statusInfo.color }}
                  >
                    {statusInfo.icon}
                  </span>
                  <span 
                    className={styles.statusText}
                    style={{ color: statusInfo.color }}
                  >
                    {statusInfo.text}
                  </span>
                </div>
              </div>
              
              <div className={styles.meetingDetails}>
                <div className={styles.detailRow}>
                  <div className={styles.detailItem}>
                    <strong>Date & Time:</strong>
                    <span>{formatDate(meeting.datetime)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Duration:</strong>
                    <span>{meeting.duration} minutes</span>
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailItem}>
                    <strong>Participants:</strong>
                    <span>{meeting.participants.length} people</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Time:</strong>
                    <span>{formatTime(meeting.datetime)}</span>
                  </div>
                </div>
              </div>
              
              {meeting.minutes && (
                <div className={styles.meetingMinutes}>
                  <h4>Meeting Minutes</h4>
                  <p><strong>Content:</strong> {meeting.minutes.content}</p>
                  {meeting.minutes.issues.length > 0 && (
                    <div>
                      <strong>Issues:</strong>
                      <ul>
                        {meeting.minutes.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {meeting.minutes.actions.length > 0 && (
                    <div>
                      <strong>Actions:</strong>
                      <ul>
                        {meeting.minutes.actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <div className={styles.meetingActions}>
                {isUpcoming && (
                  <Button onClick={() => joinMeeting(meeting.linkMeet)}>
                    Join Meeting
                  </Button>
                )}
                {isCompleted && (
                  <Button variant="secondary">
                    View Minutes
                  </Button>
                )}
                <Button variant="secondary">
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredMeetings.length === 0 && (
        <div className={styles.emptyState}>
          <p>No meetings found for the selected filter.</p>
        </div>
      )}
    </div>
  );
}
