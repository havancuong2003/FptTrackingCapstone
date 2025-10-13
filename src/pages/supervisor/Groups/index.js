import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

export default function SupervisorGroups() {
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "id": "GR01",
              "groupName": "Team Alpha",
              "projectCode": "SEP490",
              "projectName": "Student Management System",
              "members": [
                {
                  "id": "SE00001",
                  "name": "Nguyen Van A",
                  "role": "Leader",
                  "email": "nguyenvana@student.fpt.edu.vn"
                },
                {
                  "id": "SE00002",
                  "name": "Nguyen Van B",
                  "role": "Member",
                  "email": "nguyenvanb@student.fpt.edu.vn"
                },
                {
                  "id": "SE00003",
                  "name": "Nguyen Van C",
                  "role": "Secretary",
                  "email": "nguyenvanc@student.fpt.edu.vn"
                }
              ],
              "progress": {
                "completedMilestones": 1,
                "totalMilestones": 7,
                "completionPercentage": 14.3
              },
              "currentMilestone": "System Design Document",
              "nextDeadline": "2025-11-03T23:59:00Z"
            },
            {
              "id": "GR02",
              "groupName": "Team Beta",
              "projectCode": "SEP490",
              "projectName": "Library Management System",
              "members": [
                {
                  "id": "SE00004",
                  "name": "Tran Thi D",
                  "role": "Leader",
                  "email": "tranthid@student.fpt.edu.vn"
                },
                {
                  "id": "SE00005",
                  "name": "Le Van E",
                  "role": "Member",
                  "email": "levane@student.fpt.edu.vn"
                }
              ],
              "progress": {
                "completedMilestones": 2,
                "totalMilestones": 7,
                "completionPercentage": 28.6
              },
              "currentMilestone": "Prototype Development",
              "nextDeadline": "2025-11-10T23:59:00Z"
            }
          ]
        };
        
        setGroups(mockData.data);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#059669';
    if (percentage >= 60) return '#d97706';
    if (percentage >= 40) return '#f59e0b';
    return '#dc2626';
  };

  const getProgressText = (percentage) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Average';
    return 'Needs Attention';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [groupDetailModal, setGroupDetailModal] = React.useState(false);

  const viewGroupDetails = (group) => {
    setSelectedGroup(group);
    setGroupDetailModal(true);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading groups...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Groups</h1>
      <p className={styles.subtitle}>
        Manage and monitor the groups you are supervising.
      </p>
      
      <div className={styles.groupsList}>
        {groups.map((group) => {
          const progressColor = getProgressColor(group.progress.completionPercentage);
          const progressText = getProgressText(group.progress.completionPercentage);
          
          return (
            <div key={group.id} className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <div className={styles.groupInfo}>
                  <h3>{group.groupName} ({group.id})</h3>
                  <p className={styles.projectName}>{group.projectName}</p>
                  <p className={styles.projectCode}>Project Code: {group.projectCode}</p>
                </div>
                <div className={styles.groupProgress}>
                  <div className={styles.progressCircle}>
                    <div 
                      className={styles.progressValue}
                      style={{ color: progressColor }}
                    >
                      {group.progress.completionPercentage}%
                    </div>
                  </div>
                  <div className={styles.progressText} style={{ color: progressColor }}>
                    {progressText}
                  </div>
                </div>
              </div>
              
              <div className={styles.groupDetails}>
                <div className={styles.detailSection}>
                  <h4>Members ({group.members.length})</h4>
                  <div className={styles.membersList}>
                    {group.members.map((member) => (
                      <div key={member.id} className={styles.memberItem}>
                        <span className={styles.memberName}>{member.name}</span>
                        <span className={styles.memberRole}>{member.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={styles.detailSection}>
                  <h4>Progress</h4>
                  <div className={styles.progressInfo}>
                    <div className={styles.progressItem}>
                      <span>Completed:</span>
                      <span>{group.progress.completedMilestones}/{group.progress.totalMilestones} milestones</span>
                    </div>
                    <div className={styles.progressItem}>
                      <span>Current:</span>
                      <span>{group.currentMilestone}</span>
                    </div>
                    <div className={styles.progressItem}>
                      <span>Next Deadline:</span>
                      <span>{formatDate(group.nextDeadline)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.groupActions}>
                <Button 
                  variant="secondary"
                  onClick={() => viewGroupDetails(group)}
                >
                  View Details
                </Button>
                <Button>
                  Track Progress
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {groups.length === 0 && (
        <div className={styles.emptyState}>
          <p>No groups assigned to you yet.</p>
        </div>
      )}

      <Modal open={groupDetailModal} onClose={() => setGroupDetailModal(false)}>
        {selectedGroup && (
          <div className={styles.groupDetailModal}>
            <h2>Group Details</h2>
            
            <div className={styles.groupInfo}>
              <h3>{selectedGroup.groupName} ({selectedGroup.groupId})</h3>
              <p><strong>Project:</strong> {selectedGroup.projectName}</p>
              <p><strong>Project Code:</strong> {selectedGroup.projectCode}</p>
              <p><strong>Progress:</strong> {selectedGroup.progress.completionPercentage}%</p>
              <p><strong>Current Milestone:</strong> {selectedGroup.currentMilestone}</p>
              <p><strong>Next Deadline:</strong> {formatDate(selectedGroup.nextDeadline)}</p>
            </div>
            
            <div className={styles.membersSection}>
              <h4>Team Members</h4>
              <div className={styles.membersList}>
                {selectedGroup.members.map((member) => (
                  <div key={member.id} className={styles.memberCard}>
                    <div className={styles.memberInfo}>
                      <strong>{member.name}</strong>
                      <span className={styles.memberRole}>{member.role}</span>
                    </div>
                    <div className={styles.memberContact}>
                      <span>{member.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setGroupDetailModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setGroupDetailModal(false);
                // Navigate to tracking page
                window.location.href = `/supervisor/tracking?groupId=${selectedGroup.groupId}`;
              }}>
                View Progress
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
