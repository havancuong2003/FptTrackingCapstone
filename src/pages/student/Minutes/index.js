import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

export default function StudentMinutes() {
  const [minutes, setMinutes] = React.useState([]);
  const [meetings, setMeetings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [createModal, setCreateModal] = React.useState(false);
  const [userRole, setUserRole] = React.useState('Secretary'); // Mock user role
  const [newMinutes, setNewMinutes] = React.useState({
    meetingId: '',
    content: '',
    issues: '',
    actions: '',
    attachments: []
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock meetings data
        const meetingsData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "id": 1,
              "topic": "Project Kickoff Meeting",
              "datetime": "2025-10-15T14:00:00Z",
              "participants": ["SE00001", "SE00002", "SE00003", "MENTOR001"],
              "status": "completed"
            },
            {
              "id": 2,
              "topic": "Weekly Progress Review",
              "datetime": "2025-10-22T14:00:00Z",
              "participants": ["SE00001", "SE00002", "SE00003", "MENTOR001"],
              "status": "upcoming"
            }
          ]
        };
        
        // Mock minutes data
        const minutesData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "id": 1,
              "meetingId": 1,
              "meetingTopic": "Project Kickoff Meeting",
              "date": "2025-10-15T14:00:00Z",
              "participants": ["SE00001", "SE00002", "SE00003", "MENTOR001"],
              "content": "Discussed project requirements and initial planning. Team agreed on using React for frontend and Node.js for backend.",
              "issues": ["Need to clarify database requirements", "Timeline might be tight"],
              "actions": [
                "Research database options (assigned to SE00002)",
                "Setup development environment (assigned to SE00001)",
                "Create project timeline (assigned to SE00003)"
              ],
              "attachments": ["meeting_notes.pdf"],
              "createdBy": "SE00003",
              "createdByName": "Nguyen Van C",
              "status": "confirmed"
            }
          ]
        };
        
        setMeetings(meetingsData.data);
        setMinutes(minutesData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openCreateModal = () => {
    setCreateModal(true);
  };

  const createMinutes = () => {
    console.log('Creating minutes:', newMinutes);
    alert('Meeting minutes created successfully! (Mock)');
    setCreateModal(false);
    setNewMinutes({
      meetingId: '',
      content: '',
      issues: '',
      actions: '',
      attachments: []
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return { color: '#059669', text: 'Confirmed', icon: '✓' };
      case 'pending':
        return { color: '#d97706', text: 'Pending', icon: '⏳' };
      case 'draft':
        return { color: '#64748b', text: 'Draft', icon: '📝' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '?' };
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading meeting minutes...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meeting Minutes</h1>
        {userRole === 'Secretary' && (
          <Button onClick={openCreateModal}>
            Create New Minutes
          </Button>
        )}
      </div>
      
      {userRole !== 'Secretary' && (
        <div className={styles.roleWarning}>
          <p>⚠️ Only students with the "Secretary" role can create meeting minutes.</p>
        </div>
      )}
      
      <div className={styles.minutesList}>
        {minutes.map((minute) => {
          const statusInfo = getStatusInfo(minute.status);
          return (
            <div key={minute.id} className={styles.minuteCard}>
              <div className={styles.minuteHeader}>
                <div className={styles.minuteInfo}>
                  <h3>{minute.meetingTopic}</h3>
                  <p className={styles.minuteDate}>{formatDate(minute.date)}</p>
                </div>
                <div className={styles.minuteStatus}>
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
              
              <div className={styles.minuteContent}>
                <div className={styles.contentSection}>
                  <h4>Content</h4>
                  <p>{minute.content}</p>
                </div>
                
                {minute.issues && minute.issues.length > 0 && (
                  <div className={styles.contentSection}>
                    <h4>Issues</h4>
                    <ul>
                      {minute.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {minute.actions && minute.actions.length > 0 && (
                  <div className={styles.contentSection}>
                    <h4>Actions</h4>
                    <ul>
                      {minute.actions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {minute.attachments && minute.attachments.length > 0 && (
                  <div className={styles.contentSection}>
                    <h4>Attachments</h4>
                    <ul>
                      {minute.attachments.map((attachment, index) => (
                        <li key={index}>
                          <a href="#" className={styles.attachmentLink}>
                            {attachment}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className={styles.minuteFooter}>
                <div className={styles.minuteMeta}>
                  <span>Created by: {minute.createdByName}</span>
                  <span>Participants: {minute.participants.length} people</span>
                </div>
                <div className={styles.minuteActions}>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                  {minute.status === 'draft' && userRole === 'Secretary' && (
                    <Button size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)}>
        <div className={styles.createModal}>
          <h2>Create Meeting Minutes</h2>
          
          <div className={styles.formGroup}>
            <label>Select Meeting</label>
            <select
              value={newMinutes.meetingId}
              onChange={(e) => setNewMinutes({...newMinutes, meetingId: e.target.value})}
              className={styles.select}
            >
              <option value="">Select a meeting</option>
              {meetings.filter(m => m.status === 'completed').map(meeting => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.topic} - {formatDate(meeting.datetime)}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Meeting Content</label>
            <textarea
              value={newMinutes.content}
              onChange={(e) => setNewMinutes({...newMinutes, content: e.target.value})}
              placeholder="Describe what was discussed in the meeting..."
              className={styles.textarea}
              rows={4}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Issues (one per line)</label>
            <textarea
              value={newMinutes.issues}
              onChange={(e) => setNewMinutes({...newMinutes, issues: e.target.value})}
              placeholder="List any issues or concerns raised..."
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Action Items (one per line)</label>
            <textarea
              value={newMinutes.actions}
              onChange={(e) => setNewMinutes({...newMinutes, actions: e.target.value})}
              placeholder="List action items and who is responsible..."
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={createMinutes}>
              Create Minutes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
