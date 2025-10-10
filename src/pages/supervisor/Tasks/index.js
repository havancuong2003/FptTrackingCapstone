import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';

export default function SupervisorTasks() {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedGroup, setSelectedGroup] = React.useState('GR01');
  const [filter, setFilter] = React.useState('all');

  React.useEffect(() => {
    const fetchTasks = async () => {
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
              "tasks": [
                {
                  "id": 1,
                  "title": "Setup development environment",
                  "description": "Install required tools and setup project structure",
                  "assignee": "SE00001",
                  "assigneeName": "Nguyen Van A",
                  "deadline": "2025-10-15T23:59:00Z",
                  "priority": "high",
                  "status": "completed",
                  "milestoneId": 1,
                  "createdAt": "2025-10-10T09:00:00Z",
                  "completedAt": "2025-10-14T16:30:00Z"
                },
                {
                  "id": 2,
                  "title": "Research database options",
                  "description": "Compare different database solutions for the project",
                  "assignee": "SE00002",
                  "assigneeName": "Nguyen Van B",
                  "deadline": "2025-10-18T23:59:00Z",
                  "priority": "medium",
                  "status": "in-progress",
                  "milestoneId": 1,
                  "createdAt": "2025-10-10T09:30:00Z",
                  "completedAt": null
                },
                {
                  "id": 3,
                  "title": "Design user interface",
                  "description": "Create wireframes and mockups for the application",
                  "assignee": "SE00003",
                  "assigneeName": "Nguyen Van C",
                  "deadline": "2025-10-22T23:59:00Z",
                  "priority": "high",
                  "status": "pending",
                  "milestoneId": 2,
                  "createdAt": "2025-10-12T14:00:00Z",
                  "completedAt": null
                }
              ]
            },
            {
              "groupId": "GR02",
              "groupName": "Team Beta",
              "tasks": [
                {
                  "id": 4,
                  "title": "Project requirements analysis",
                  "description": "Analyze and document project requirements",
                  "assignee": "SE00004",
                  "assigneeName": "Tran Thi D",
                  "deadline": "2025-10-08T23:59:00Z",
                  "priority": "high",
                  "status": "completed",
                  "milestoneId": 1,
                  "createdAt": "2025-10-05T10:00:00Z",
                  "completedAt": "2025-10-07T16:30:00Z"
                }
              ]
            }
          ]
        };
        
        setTasks(mockData.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'high':
        return { color: '#dc2626', text: 'High', icon: '🔴' };
      case 'medium':
        return { color: '#d97706', text: 'Medium', icon: '🟡' };
      case 'low':
        return { color: '#059669', text: 'Low', icon: '🟢' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '⚪' };
    }
  };

  const getStatusInfo = (status) => {
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedGroupData = tasks.find(group => group.groupId === selectedGroup);
  const filteredTasks = selectedGroupData?.tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  }) || [];

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasks Overview</h1>
        <div className={styles.controls}>
          <div className={styles.groupSelector}>
            <label>Group:</label>
            <select 
              value={selectedGroup} 
              onChange={(e) => setSelectedGroup(e.target.value)}
              className={styles.select}
            >
              {tasks.map(group => (
                <option key={group.groupId} value={group.groupId}>
                  {group.groupName} ({group.groupId})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterSelector}>
            <label>Status:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>
      
      {selectedGroupData && (
        <>
          <div className={styles.groupInfo}>
            <h2>{selectedGroupData.groupName} ({selectedGroupData.groupId})</h2>
            <p>Total tasks: {selectedGroupData.tasks.length} | 
               Completed: {selectedGroupData.tasks.filter(t => t.status === 'completed').length} | 
               In Progress: {selectedGroupData.tasks.filter(t => t.status === 'in-progress').length} | 
               Pending: {selectedGroupData.tasks.filter(t => t.status === 'pending').length}
            </p>
          </div>
          
          <div className={styles.tasksList}>
            {filteredTasks.map((task) => {
              const priorityInfo = getPriorityInfo(task.priority);
              const statusInfo = getStatusInfo(task.status);
              
              return (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <div className={styles.taskInfo}>
                      <h3>{task.title}</h3>
                      <p className={styles.taskDescription}>{task.description}</p>
                    </div>
                    <div className={styles.taskMeta}>
                      <div className={styles.taskPriority}>
                        <span 
                          className={styles.priorityIcon}
                          style={{ color: priorityInfo.color }}
                        >
                          {priorityInfo.icon}
                        </span>
                        <span 
                          className={styles.priorityText}
                          style={{ color: priorityInfo.color }}
                        >
                          {priorityInfo.text}
                        </span>
                      </div>
                      <div className={styles.taskStatus}>
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
                  </div>
                  
                  <div className={styles.taskDetails}>
                    <div className={styles.detailRow}>
                      <div className={styles.detailItem}>
                        <strong>Assignee:</strong>
                        <span>{task.assigneeName} ({task.assignee})</span>
                      </div>
                      <div className={styles.detailItem}>
                        <strong>Deadline:</strong>
                        <span>{formatDate(task.deadline)}</span>
                      </div>
                    </div>
                    <div className={styles.detailRow}>
                      <div className={styles.detailItem}>
                        <strong>Milestone:</strong>
                        <span>Milestone {task.milestoneId}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <strong>Created:</strong>
                        <span>{formatDate(task.createdAt)}</span>
                      </div>
                    </div>
                    {task.completedAt && (
                      <div className={styles.detailRow}>
                        <div className={styles.detailItem}>
                          <strong>Completed:</strong>
                          <span>{formatDate(task.completedAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.taskActions}>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                    <Button variant="secondary" size="sm">
                      Edit Task
                    </Button>
                    {task.status === 'pending' && (
                      <Button size="sm">
                        Start Task
                      </Button>
                    )}
                    {task.status === 'in-progress' && (
                      <Button size="sm">
                        Complete Task
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      
      {filteredTasks.length === 0 && selectedGroupData && (
        <div className={styles.emptyState}>
          <p>No tasks found for the selected filter.</p>
        </div>
      )}
      
      {!selectedGroupData && (
        <div className={styles.emptyState}>
          <p>No tasks available for the selected group.</p>
        </div>
      )}
    </div>
  );
}
