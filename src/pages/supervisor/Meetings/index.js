import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Select from '../../../components/Select/Select';

export default function SupervisorMeetings() {
  const [meetings, setMeetings] = React.useState([]);
  const [meetingMinutes, setMeetingMinutes] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [createModal, setCreateModal] = React.useState(false);
  const [templateModal, setTemplateModal] = React.useState(false);
  const [selectedMeeting, setSelectedMeeting] = React.useState(null);
  const [viewModal, setViewModal] = React.useState(false);
  const [minutesModal, setMinutesModal] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState('');
  const [filter, setFilter] = React.useState('all');
  const [newMeeting, setNewMeeting] = React.useState({
    topic: '',
    datetime: '',
    duration: 60,
    groupId: '',
    objective: ''
  });
  const [newTemplate, setNewTemplate] = React.useState({
    name: '',
    description: '',
    file: null
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for groups
        const groupsData = [
          {
            groupId: 'GR01',
            groupName: 'Team Alpha',
            students: ['SE00001', 'SE00002', 'SE00003'],
            supervisor: 'SUPERVISOR001'
          },
          {
            groupId: 'GR02', 
            groupName: 'Team Beta',
            students: ['SE00004', 'SE00005'],
            supervisor: 'SUPERVISOR001'
          }
        ];

        // Mock data for meetings
        const meetingsData = [
          {
            id: 1,
            topic: "Project Kickoff Meeting",
            datetime: "2025-10-15T14:00:00Z",
            duration: 60,
            linkMeet: "https://meet.google.com/abc-defg-hij",
            participants: ["SE00001", "SE00002", "SE00003", "SUPERVISOR001"],
            status: "completed",
            objective: "Discuss project requirements and initial planning",
            groupId: "GR01",
            groupName: "Team Alpha"
          },
          {
            id: 2,
            topic: "Weekly Progress Review",
            datetime: "2025-10-22T14:00:00Z",
            duration: 45,
            linkMeet: "https://meet.google.com/xyz-uvw-rst",
            participants: ["SE00001", "SE00002", "SE00003", "SUPERVISOR001"],
            status: "upcoming",
            objective: "Review progress on milestone 1 and plan for milestone 2",
            groupId: "GR01",
            groupName: "Team Alpha"
          },
          {
            id: 3,
            topic: "Technical Review Session",
            datetime: "2025-10-29T15:00:00Z",
            duration: 90,
            linkMeet: "https://meet.google.com/def-ghij-klm",
            participants: ["SE00004", "SE00005", "SUPERVISOR001"],
            status: "scheduled",
            objective: "Review system design and technical implementation",
            groupId: "GR02",
            groupName: "Team Beta"
          }
        ];

        // Mock data for meeting minutes
        const minutesData = [
          {
            id: 1,
            meetingId: 1,
            meetingTopic: "Project Kickoff Meeting",
            linkMeet: "https://meet.google.com/abc-defg-hij",
            uploadedBy: "SE00001",
            uploadedByName: "Nguyen Van A",
            file: "kickoff_meeting_minutes.docx",
            status: "Reviewed",
            uploadTime: "2025-10-15T16:30:00Z",
            content: "Discussed project scope and timeline",
            issues: ["Need to clarify database requirements"],
            actions: ["Research database options", "Setup development environment"],
            supervisorComment: "Good meeting minutes. Please follow up on database research."
          },
          {
            id: 2,
            meetingId: 2,
            meetingTopic: "Weekly Progress Review",
            linkMeet: "https://meet.google.com/xyz-uvw-rst",
            uploadedBy: "SE00002",
            uploadedByName: "Tran Thi B",
            file: "progress_review_minutes.docx",
            status: "Draft",
            uploadTime: "2025-10-22T15:45:00Z",
            content: "Reviewed milestone 1 progress and planned milestone 2",
            issues: ["Some tasks are behind schedule"],
            actions: ["Accelerate development", "Increase team coordination"],
            supervisorComment: null
          }
        ];
        
        setGroups(groupsData);
        setMeetings(meetingsData);
        setMeetingMinutes(minutesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const getMinutesStatusInfo = (status) => {
    switch (status) {
      case 'Reviewed':
        return { color: '#059669', text: 'Reviewed', icon: '✓' };
      case 'Draft':
        return { color: '#d97706', text: 'Draft', icon: '📝' };
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

  // Filter data based on selected group and filter
  const filteredMeetings = meetings.filter(meeting => {
    const groupMatch = selectedGroup === '' || meeting.groupId === selectedGroup;
    const statusMatch = filter === 'all' || meeting.status === filter;
    return groupMatch && statusMatch;
  });

  const filteredMinutes = meetingMinutes.filter(minute => {
    const groupMatch = selectedGroup === '' || meetings.find(m => m.id === minute.meetingId)?.groupId === selectedGroup;
    const statusMatch = filter === 'all' || minute.status === filter;
    return groupMatch && statusMatch;
  });

  const groupOptions = groups.map(group => ({ 
    value: group.groupId, 
    label: `${group.groupName} (${group.groupId})` 
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📅 Meeting Management - Supervisor View</h1>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Group:</label>
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={[{ value: '', label: 'All Groups' }, ...groupOptions]}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Filter:</label>
            <Select
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'completed', label: 'Completed' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'Draft', label: 'Draft Minutes' },
                { value: 'Reviewed', label: 'Reviewed Minutes' }
              ]}
            />
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${filter === 'all' || filter === 'completed' || filter === 'upcoming' || filter === 'scheduled' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          📅 Meetings
        </button>
        <button 
          className={`${styles.tab} ${filter === 'Draft' || filter === 'Reviewed' ? styles.active : ''}`}
          onClick={() => setFilter('Draft')}
        >
          📝 Meeting Minutes
        </button>
      </div>
      
      {/* Meetings Section */}
      {(filter === 'all' || filter === 'completed' || filter === 'upcoming' || filter === 'scheduled') && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📅 Scheduled Meetings</h2>
            <div className={styles.sectionActions}>
              <Button onClick={openCreateModal}>
                Schedule Meeting
              </Button>
              <Button variant="secondary" onClick={() => setTemplateModal(true)}>
                Upload Template
              </Button>
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
                  
                  <div className={styles.meetingActions}>
                    {isUpcoming && (
                      <Button onClick={() => joinMeeting(meeting.linkMeet)}>
                        Join Meeting
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
        </div>
      )}

      {/* Meeting Minutes Section */}
      {(filter === 'Draft' || filter === 'Reviewed') && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📝 Meeting Minutes Tracking</h2>
            <div className={styles.sectionActions}>
              <Button onClick={() => setMinutesModal(true)}>
                Review Minutes
              </Button>
            </div>
          </div>
          
          <div className={styles.minutesTable}>
            <div className={styles.tableHeader}>
              <div className={styles.th}>Date</div>
              <div className={styles.th}>Meeting Topic</div>
              <div className={styles.th}>Link Meet</div>
              <div className={styles.th}>Uploaded By</div>
              <div className={styles.th}>File</div>
              <div className={styles.th}>Status</div>
              <div className={styles.th}>Actions</div>
            </div>
            <div className={styles.tableBody}>
              {filteredMinutes.map((minute) => {
                const statusInfo = getMinutesStatusInfo(minute.status);
                const meeting = meetings.find(m => m.id === minute.meetingId);
                
                return (
                  <div key={minute.id} className={styles.tableRow}>
                    <div className={styles.td}>
                      <div className={styles.dateInfo}>
                        {formatDate(minute.uploadTime)}
                      </div>
                    </div>
                    
                    <div className={styles.td}>
                      <div className={styles.topicInfo}>
                        <div className={styles.topicTitle}>{minute.meetingTopic}</div>
                        <div className={styles.groupInfo}>
                          {meeting?.groupName} ({meeting?.groupId})
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.td}>
                      <a 
                        href={minute.linkMeet} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.meetLink}
                      >
                        Join Meeting
                      </a>
                    </div>
                    
                    <div className={styles.td}>
                      <div className={styles.uploaderInfo}>
                        <div className={styles.uploaderName}>{minute.uploadedByName}</div>
                        <div className={styles.uploaderId}>({minute.uploadedBy})</div>
                      </div>
                    </div>
                    
                    <div className={styles.td}>
                      <div className={styles.fileInfo}>
                        <span className={styles.fileIcon}>📄</span>
                        <span className={styles.fileName}>{minute.file}</span>
                      </div>
                    </div>
                    
                    <div className={styles.td}>
                      <div className={styles.statusInfo}>
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
                    
                    <div className={styles.td}>
                      <div className={styles.actionButtons}>
                        <Button size="sm" variant="secondary">
                          Download
                        </Button>
                        <Button size="sm" onClick={() => openViewModal(minute)}>
                          View Details
                        </Button>
                        {minute.status === 'Draft' && (
                          <Button size="sm">
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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

      {/* Template Upload Modal */}
      <Modal open={templateModal} onClose={() => setTemplateModal(false)}>
        <div className={styles.templateModal}>
          <h2>📄 Upload Meeting Minutes Template</h2>
          
          <div className={styles.formGroup}>
            <label>Template Name</label>
            <input
              type="text"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
              placeholder="Enter template name"
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
              placeholder="Describe the template purpose"
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Template File (DOCX)</label>
            <input
              type="file"
              accept=".docx,.doc"
              onChange={(e) => setNewTemplate({...newTemplate, file: e.target.files[0]})}
              className={styles.fileInput}
            />
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setTemplateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              alert('Template uploaded successfully!');
              setTemplateModal(false);
              setNewTemplate({ name: '', description: '', file: null });
            }}>
              Upload Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* Minutes Review Modal */}
      <Modal open={minutesModal} onClose={() => setMinutesModal(false)}>
        <div className={styles.minutesModal}>
          <h2>📝 Review Meeting Minutes</h2>
          
          <div className={styles.minutesList}>
            {meetingMinutes.filter(m => m.status === 'Draft').map((minute) => {
              const meeting = meetings.find(m => m.id === minute.meetingId);
              return (
                <div key={minute.id} className={styles.minuteCard}>
                  <div className={styles.minuteHeader}>
                    <h3>{minute.meetingTopic}</h3>
                    <div className={styles.minuteMeta}>
                      <span>Group: {meeting?.groupName}</span>
                      <span>Uploaded by: {minute.uploadedByName}</span>
                      <span>Date: {formatDate(minute.uploadTime)}</span>
                    </div>
                  </div>
                  
                  <div className={styles.minuteContent}>
                    <p><strong>Content:</strong> {minute.content}</p>
                    {minute.issues.length > 0 && (
                      <div>
                        <strong>Issues:</strong>
                        <ul>
                          {minute.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {minute.actions.length > 0 && (
                      <div>
                        <strong>Actions:</strong>
                        <ul>
                          {minute.actions.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.minuteActions}>
                    <Button size="sm" variant="secondary">
                      Download File
                    </Button>
                    <Button size="sm">
                      Approve
                    </Button>
                    <Button size="sm" variant="secondary">
                      Request Revision
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
