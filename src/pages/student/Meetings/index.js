import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';

export default function StudentMeetings() {
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "id": 1,
              "topic": "Project Kickoff Meeting",
              "datetime": "2025-10-15T14:00:00Z",
              "duration": 60,
              "linkMeet": "https://meet.google.com/abc-defg-hij",
              "participants": ["SE00001", "SE00002", "SE00003", "SUPERVISOR001"],
              "status": "completed",
              "objective": "Discuss project requirements and initial planning",
              "minutes": {
                "id": 1,
                "content": "Discussed project scope and timeline",
                "issues": ["Need to clarify database requirements"],
                "actions": ["Research database options", "Setup development environment"]
              }
            },
            {
              "id": 2,
              "topic": "Weekly Progress Review",
              "datetime": "2025-10-22T14:00:00Z",
              "duration": 45,
              "linkMeet": "https://meet.google.com/xyz-uvw-rst",
              "participants": ["SE00001", "SE00002", "SE00003", "SUPERVISOR001"],
              "status": "upcoming",
              "objective": "Review progress on milestone 1 and plan for milestone 2"
            },
            {
              "id": 3,
              "topic": "Technical Review Session",
              "datetime": "2025-10-29T15:00:00Z",
              "duration": 90,
              "linkMeet": "https://meet.google.com/def-ghij-klm",
              "participants": ["SE00001", "SE00002", "SE00003", "SUPERVISOR001"],
              "status": "scheduled",
              "objective": "Review system design and technical implementation"
            }
          ]
        };
        
        setMeetings(mockData.data);
      } catch (error) {
        console.error('Error fetching meetings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

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
