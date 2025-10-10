import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';

export default function SupervisorTracking() {
  const [trackingData, setTrackingData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedGroup, setSelectedGroup] = React.useState('GR01');

  React.useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "groupId": "GR01",
              "groupName": "Team Alpha",
              "projectName": "Student Management System",
              "supervisor": "Dr. Smith",
              "currentWeek": "Week 3",
              "weeks": [
                {
                  "week": "Week 1",
                  "startDate": "2025-10-01T00:00:00Z",
                  "endDate": "2025-10-07T23:59:59Z",
                  "status": "completed",
                  "progress": 100,
                  "tasks": [
                    {
                      "id": 1,
                      "title": "Project Proposal",
                      "status": "completed",
                      "assignee": "SE00001",
                      "assigneeName": "Nguyen Van A",
                      "deadline": "2025-10-05T23:59:00Z",
                      "completedAt": "2025-10-04T16:30:00Z"
                    }
                  ]
                },
                {
                  "week": "Week 2",
                  "startDate": "2025-10-08T00:00:00Z",
                  "endDate": "2025-10-14T23:59:59Z",
                  "status": "completed",
                  "progress": 100,
                  "tasks": [
                    {
                      "id": 2,
                      "title": "Requirements Analysis",
                      "status": "completed",
                      "assignee": "SE00002",
                      "assigneeName": "Nguyen Van B",
                      "deadline": "2025-10-12T23:59:00Z",
                      "completedAt": "2025-10-11T14:20:00Z"
                    }
                  ]
                },
                {
                  "week": "Week 3",
                  "startDate": "2025-10-15T00:00:00Z",
                  "endDate": "2025-10-21T23:59:59Z",
                  "status": "in-progress",
                  "progress": 60,
                  "tasks": [
                    {
                      "id": 3,
                      "title": "System Design Document",
                      "status": "in-progress",
                      "assignee": "SE00003",
                      "assigneeName": "Nguyen Van C",
                      "deadline": "2025-10-19T23:59:00Z",
                      "completedAt": null
                    },
                    {
                      "id": 4,
                      "title": "Database Design",
                      "status": "completed",
                      "assignee": "SE00001",
                      "assigneeName": "Nguyen Van A",
                      "deadline": "2025-10-18T23:59:00Z",
                      "completedAt": "2025-10-17T10:15:00Z"
                    }
                  ]
                }
              ]
            }
          ]
        };
        
        setTrackingData(mockData.data);
      } catch (error) {
        console.error('Error fetching tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { color: '#059669', text: 'Completed', icon: '✓' };
      case 'in-progress':
        return { color: '#3b82f6', text: 'In Progress', icon: '🔄' };
      case 'not-started':
        return { color: '#64748b', text: 'Not Started', icon: '⏸️' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '❓' };
    }
  };

  const getTaskStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { color: '#059669', text: 'Completed', icon: '✓' };
      case 'in-progress':
        return { color: '#3b82f6', text: 'In Progress', icon: '🔄' };
      case 'pending':
        return { color: '#d97706', text: 'Pending', icon: '⏳' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '❓' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedGroupData = trackingData.find(group => group.groupId === selectedGroup);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading tracking data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Progress Tracking</h1>
        <div className={styles.groupSelector}>
          <label>Select Group:</label>
          <select 
            value={selectedGroup} 
            onChange={(e) => setSelectedGroup(e.target.value)}
            className={styles.select}
          >
            {trackingData.map(group => (
              <option key={group.groupId} value={group.groupId}>
                {group.groupName} ({group.groupId})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {selectedGroupData && (
        <>
          <div className={styles.projectInfo}>
            <h2>{selectedGroupData.projectName}</h2>
            <p><strong>Group:</strong> {selectedGroupData.groupName} ({selectedGroupData.groupId})</p>
            <p><strong>Supervisor:</strong> {selectedGroupData.supervisor}</p>
            <p><strong>Current Week:</strong> {selectedGroupData.currentWeek}</p>
          </div>
          
          <div className={styles.weeksList}>
            {selectedGroupData.weeks.map((week) => {
              const statusInfo = getStatusInfo(week.status);
              return (
                <div key={week.week} className={styles.weekCard}>
                  <div className={styles.weekHeader}>
                    <div className={styles.weekInfo}>
                      <h3>{week.week}</h3>
                      <p className={styles.weekDates}>
                        {formatDate(week.startDate)} - {formatDate(week.endDate)}
                      </p>
                    </div>
                    <div className={styles.weekStatus}>
                      <div className={styles.progressBar}>
                        <div 
                          className={styles.progressFill}
                          style={{ 
                            width: `${week.progress}%`,
                            backgroundColor: statusInfo.color
                          }}
                        />
                      </div>
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
                          {statusInfo.text} ({week.progress}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.tasksList}>
                    <h4>Tasks</h4>
                    {week.tasks.map((task) => {
                      const taskStatusInfo = getTaskStatusInfo(task.status);
                      return (
                        <div key={task.id} className={styles.taskCard}>
                          <div className={styles.taskInfo}>
                            <h5>{task.title}</h5>
                            <p className={styles.taskAssignee}>
                              Assigned to: {task.assigneeName} ({task.assignee})
                            </p>
                            <p className={styles.taskDeadline}>
                              Deadline: {formatDate(task.deadline)}
                            </p>
                            {task.completedAt && (
                              <p className={styles.taskCompleted}>
                                Completed: {formatDate(task.completedAt)}
                              </p>
                            )}
                          </div>
                          <div className={styles.taskStatus}>
                            <span 
                              className={styles.taskStatusIcon}
                              style={{ color: taskStatusInfo.color }}
                            >
                              {taskStatusInfo.icon}
                            </span>
                            <span 
                              className={styles.taskStatusText}
                              style={{ color: taskStatusInfo.color }}
                            >
                              {taskStatusInfo.text}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      
      {!selectedGroupData && (
        <div className={styles.emptyState}>
          <p>No tracking data available for the selected group.</p>
        </div>
      )}
    </div>
  );
}
