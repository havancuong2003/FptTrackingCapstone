import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

export default function SupervisorMeetings() {
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [createModal, setCreateModal] = React.useState(false);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [viewModal, setViewModal] = React.useState(false);
  const [newMeeting, setNewMeeting] = React.useState({
    topic: '',
    datetime: '',
    duration: 60,
    groupId: '',
    objective: ''
  });

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
              "groupId": "GR01",
              "groupName": "Team Alpha",
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
              "objective": "Review progress on milestone 1 and plan for milestone 2",
              "groupId": "GR01",
              "groupName": "Team Alpha"
            },
            {
              "id": 3,
              "topic": "Technical Review Session",
              "datetime": "2025-10-29T15:00:00Z",
              "duration": 90,
              "linkMeet": "https://meet.google.com/def-ghij-klm",
              "participants": ["SE00004", "SE00005", "SUPERVISOR001"],
              "status": "scheduled",
              "objective": "Review system design and technical implementation",
              "groupId": "GR02",
              "groupName": "Team Beta"
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

  const openCreateModal = () => {
    setCreateModal(true);
  };

  const openViewModal = (meeting) => {
    setSelectedMeeting(meeting);
    setViewModal(true);
  };

  const createMeeting = () => {
    if (!newMeeting.topic || !newMeeting.datetime || !newMeeting.groupId) {
      alert('Please fill in all required fields');
      return;
    }

    const meeting = {
      id: Date.now(),
      topic: newMeeting.topic,
      datetime: newMeeting.datetime,
      duration: newMeeting.duration,
      linkMeet: `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`,
      participants: ['SUPERVISOR001'], // Will be populated based on group
      status: 'scheduled',
      objective: newMeeting.objective,
      groupId: newMeeting.groupId,
      groupName: newMeeting.groupId === 'GR01' ? 'Team Alpha' : 'Team Beta'
    };

    setMeetings(prev => [meeting, ...prev]);
    setCreateModal(false);
    setNewMeeting({
      topic: '',
      datetime: '',
      duration: 60,
      groupId: '',
      objective: ''
    });
    alert('Meeting created successfully!');
  };

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
        <Button onClick={openCreateModal}>
          Schedule Meeting
        </Button>
      </div>
      
      <p className={styles.subtitle}>
        Schedule and manage meetings with your supervised student groups.
      </p>
      
      <div className={styles.meetingsList}>
        {meetings.map((meeting) => {
          const statusInfo = getStatusInfo(meeting.status);
          const isUpcoming = meeting.status === 'upcoming';
          const isCompleted = meeting.status === 'completed';
          
          return (
            <div key={meeting.id} className={styles.meetingCard}>
              <div className={styles.meetingHeader}>
                <div className={styles.meetingInfo}>
                  <h3>{meeting.topic}</h3>
                  <p className={styles.meetingGroup}>
                    Group: {meeting.groupName} ({meeting.groupId})
                  </p>
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
                <Button 
                  variant="secondary"
                  onClick={() => openViewModal(meeting)}
                >
                  View Details
                </Button>
                <Button variant="secondary">
                  Edit Meeting
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)}>
        <div className={styles.createModal}>
          <h2>Schedule New Meeting</h2>
          
          <div className={styles.formGroup}>
            <label>Meeting Topic</label>
            <input
              type="text"
              value={newMeeting.topic}
              onChange={(e) => setNewMeeting({...newMeeting, topic: e.target.value})}
              placeholder="Enter meeting topic"
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Group</label>
            <select
              value={newMeeting.groupId}
              onChange={(e) => setNewMeeting({...newMeeting, groupId: e.target.value})}
              className={styles.select}
            >
              <option value="">Select a group</option>
              <option value="GR01">Team Alpha (GR01)</option>
              <option value="GR02">Team Beta (GR02)</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Date & Time</label>
            <input
              type="datetime-local"
              value={newMeeting.datetime}
              onChange={(e) => setNewMeeting({...newMeeting, datetime: e.target.value})}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Duration (minutes)</label>
            <input
              type="number"
              value={newMeeting.duration}
              onChange={(e) => setNewMeeting({...newMeeting, duration: parseInt(e.target.value)})}
              className={styles.input}
              min="15"
              max="180"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Objective</label>
            <textarea
              value={newMeeting.objective}
              onChange={(e) => setNewMeeting({...newMeeting, objective: e.target.value})}
              placeholder="Describe the purpose of this meeting"
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={createMeeting}>
              Schedule Meeting
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={viewModal} onClose={() => setViewModal(false)}>
        {selectedMeeting && (
          <div className={styles.viewModal}>
            <h2>Meeting Details</h2>
            
            <div className={styles.meetingDetail}>
              <h3>{selectedMeeting.topic}</h3>
              <p><strong>Group:</strong> {selectedMeeting.groupName} ({selectedMeeting.groupId})</p>
              <p><strong>Date & Time:</strong> {formatDate(selectedMeeting.datetime)}</p>
              <p><strong>Duration:</strong> {selectedMeeting.duration} minutes</p>
              <p><strong>Participants:</strong> {selectedMeeting.participants.length} people</p>
              <p><strong>Objective:</strong> {selectedMeeting.objective}</p>
              <p><strong>Meeting Link:</strong> 
                <a href={selectedMeeting.linkMeet} target="_blank" rel="noopener noreferrer">
                  {selectedMeeting.linkMeet}
                </a>
              </p>
            </div>
            
            {selectedMeeting.minutes && (
              <div className={styles.minutesDetail}>
                <h3>Meeting Minutes</h3>
                <div className={styles.minutesContent}>
                  <p><strong>Content:</strong> {selectedMeeting.minutes.content}</p>
                  {selectedMeeting.minutes.issues.length > 0 && (
                    <div>
                      <strong>Issues:</strong>
                      <ul>
                        {selectedMeeting.minutes.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedMeeting.minutes.actions.length > 0 && (
                    <div>
                      <strong>Actions:</strong>
                      <ul>
                        {selectedMeeting.minutes.actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
