import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

export default function StudentMilestones() {
  const [milestones, setMilestones] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [detailModal, setDetailModal] = React.useState(false);

  React.useEffect(() => {
    // Mock API call
    const fetchMilestones = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "id": 1,
              "week": 1,
              "name": "Project Proposal",
              "description": "Submit project proposal with problem statement, objectives, and methodology",
              "deadline": "2025-10-20T23:59:00Z",
              "status": "submitted",
              "deliverables": [
                {
                  "id": 1,
                  "name": "Project Proposal Document",
                  "type": "document",
                  "required": true
                }
              ]
            },
            {
              "id": 2,
              "week": 2,
              "name": "System Design Document",
              "description": "Create detailed system design with architecture, database schema, and API specifications",
              "deadline": "2025-10-27T23:59:00Z",
              "status": "late",
              "deliverables": [
                {
                  "id": 2,
                  "name": "System Design Document",
                  "type": "document",
                  "required": true
                },
                {
                  "id": 3,
                  "name": "Database Schema",
                  "type": "document",
                  "required": true
                }
              ]
            },
            {
              "id": 3,
              "week": 3,
              "name": "Prototype Development",
              "description": "Develop working prototype with core functionality",
              "deadline": "2025-11-03T23:59:00Z",
              "status": "not-submitted",
              "deliverables": [
                {
                  "id": 4,
                  "name": "Source Code",
                  "type": "code",
                  "required": true
                },
                {
                  "id": 5,
                  "name": "Demo Video",
                  "type": "video",
                  "required": true
                }
              ]
            }
          ]
        };
        
        setMilestones(mockData.data);
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'submitted':
        return { icon: '✓', color: '#059669', text: 'Submitted' };
      case 'late':
        return { icon: '⚠', color: '#d97706', text: 'Late Submitted' };
      case 'not-submitted':
        return { icon: '✗', color: '#dc2626', text: 'Not Submitted' };
      default:
        return { icon: '?', color: '#64748b', text: 'Unknown' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openDetailModal = (milestone) => {
    setSelectedMilestone(milestone);
    setDetailModal(true);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading milestones...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Milestones</h1>
      
      <div className={styles.milestonesList}>
        {milestones.map((milestone) => {
          const statusInfo = getStatusInfo(milestone.status);
          return (
            <div key={milestone.id} className={styles.milestoneCard}>
              <div className={styles.milestoneHeader}>
                <div className={styles.milestoneInfo}>
                  <h3>Week {milestone.week}: {milestone.name}</h3>
                  <p className={styles.description}>{milestone.description}</p>
                </div>
                <div className={styles.milestoneStatus}>
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
              
              <div className={styles.milestoneDetails}>
                <div className={styles.detailItem}>
                  <strong>Deadline:</strong> {formatDate(milestone.deadline)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Deliverables:</strong> {milestone.deliverables.length} items
                </div>
              </div>
              
              <div className={styles.milestoneActions}>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => openDetailModal(milestone)}
                  >
                    View Details
                  </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={detailModal} onClose={() => setDetailModal(false)}>
        {selectedMilestone && (
          <div className={styles.milestoneDetail}>
            <h2>Milestone Details</h2>
            <div className={styles.detailSection}>
              <h3>Basic Information</h3>
              <p><strong>Name:</strong> {selectedMilestone.name}</p>
              <p><strong>Week:</strong> {selectedMilestone.week}</p>
              <p><strong>Description:</strong> {selectedMilestone.description}</p>
              <p><strong>Deadline:</strong> {formatDate(selectedMilestone.deadline)}</p>
              <p><strong>Status:</strong> 
                <span style={{ color: getStatusInfo(selectedMilestone.status).color, marginLeft: '8px' }}>
                  {getStatusInfo(selectedMilestone.status).icon} {getStatusInfo(selectedMilestone.status).text}
                </span>
              </p>
            </div>
            
            <div className={styles.detailSection}>
              <h3>Deliverables</h3>
              <ul className={styles.deliverablesList}>
                {selectedMilestone.deliverables.map((deliverable) => (
                  <li key={deliverable.id} className={styles.deliverableItem}>
                    <span className={styles.deliverableName}>{deliverable.name}</span>
                    <span className={styles.deliverableType}>({deliverable.type})</span>
                    {deliverable.required && <span className={styles.required}>Required</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
