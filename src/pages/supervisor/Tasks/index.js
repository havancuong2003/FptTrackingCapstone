import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Select from '../../../components/Select/Select';

export default function SupervisorTasks() {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedGroup, setSelectedGroup] = React.useState('GR01');
  const [selectedMilestone, setSelectedMilestone] = React.useState('all');
  const [selectedDeliveryItem, setSelectedDeliveryItem] = React.useState('all');
  const [selectedStudent, setSelectedStudent] = React.useState('all');
  const [filter, setFilter] = React.useState('all');
  const [viewMode, setViewMode] = React.useState('list'); // list or kanban

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
              "milestones": [
                {
                  "id": 1,
                  "name": "Project Setup & Planning",
                  "deliveryItems": [
                    {
                      "id": 1,
                      "name": "Project Charter",
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
                          "deliveryItemId": 1,
                          "createdAt": "2025-10-10T09:00:00Z",
                          "completedAt": "2025-10-14T16:30:00Z",
                          "progress": 100,
                          "attachments": ["setup-guide.pdf"],
                          "comments": [
                            {
                              "id": 1,
                              "author": "SE00001",
                              "authorName": "Nguyen Van A",
                              "content": "Environment setup completed successfully",
                              "createdAt": "2025-10-14T16:30:00Z"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  "id": 2,
                  "name": "Design & Architecture",
                  "deliveryItems": [
                    {
                      "id": 2,
                      "name": "System Design Document",
                      "tasks": [
                        {
                          "id": 2,
                          "title": "Research database options",
                          "description": "Compare different database solutions for the project",
                          "assignee": "SE00002",
                          "assigneeName": "Nguyen Van B",
                          "deadline": "2025-10-18T23:59:00Z",
                          "priority": "medium",
                          "status": "in-progress",
                          "milestoneId": 2,
                          "deliveryItemId": 2,
                          "createdAt": "2025-10-10T09:30:00Z",
                          "completedAt": null,
                          "progress": 60,
                          "attachments": ["db-comparison.xlsx"],
                          "comments": [
                            {
                              "id": 2,
                              "author": "SE00002",
                              "authorName": "Nguyen Van B",
                              "content": "Still researching PostgreSQL vs MongoDB",
                              "createdAt": "2025-10-15T10:00:00Z"
                            }
                          ]
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
                          "deliveryItemId": 2,
                          "createdAt": "2025-10-12T14:00:00Z",
                          "completedAt": null,
                          "progress": 0,
                          "attachments": [],
                          "comments": []
                        }
                      ]
                    }
                  ]
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
  
  // Flatten all tasks from all milestones and delivery items
  const allTasks = selectedGroupData?.milestones?.flatMap(milestone => 
    milestone.deliveryItems?.flatMap(deliveryItem => 
      deliveryItem.tasks?.map(task => ({
        ...task,
        milestoneName: milestone.name,
        deliveryItemName: deliveryItem.name
      }))
    )
  ) || [];

  const filteredTasks = allTasks.filter(task => {
    if (filter !== 'all' && task.status !== filter) return false;
    if (selectedMilestone !== 'all' && task.milestoneId.toString() !== selectedMilestone) return false;
    if (selectedDeliveryItem !== 'all' && task.deliveryItemId.toString() !== selectedDeliveryItem) return false;
    if (selectedStudent !== 'all' && task.assignee !== selectedStudent) return false;
    return true;
  });

  // Get unique options for filters
  const milestoneOptions = selectedGroupData?.milestones?.map(m => ({ value: m.id.toString(), label: m.name })) || [];
  const deliveryItemOptions = selectedGroupData?.milestones?.flatMap(m => 
    m.deliveryItems?.map(d => ({ value: d.id.toString(), label: d.name, milestoneId: m.id })) || []
  ) || [];
  const studentOptions = [...new Set(allTasks.map(task => task.assignee))].map(assignee => {
    const task = allTasks.find(t => t.assignee === assignee);
    return { value: assignee, label: `${task.assigneeName} (${assignee})` };
  });

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
        <h1>📊 Tasks Overview - Supervisor View</h1>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Group:</label>
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={tasks.map(group => ({ value: group.groupId, label: `${group.groupName} (${group.groupId})` }))}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Milestone:</label>
            <Select
              value={selectedMilestone}
              onChange={setSelectedMilestone}
              options={[{ value: 'all', label: 'All Milestones' }, ...milestoneOptions]}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Delivery Item:</label>
            <Select
              value={selectedDeliveryItem}
              onChange={setSelectedDeliveryItem}
              options={[{ value: 'all', label: 'All Delivery Items' }, ...deliveryItemOptions]}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Student:</label>
            <Select
              value={selectedStudent}
              onChange={setSelectedStudent}
              options={[{ value: 'all', label: 'All Students' }, ...studentOptions]}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Status:</label>
            <Select
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All Tasks' },
                { value: 'pending', label: 'Pending' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' }
              ]}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>View:</label>
            <div className={styles.viewToggle}>
              <Button 
                variant={viewMode === 'list' ? 'primary' : 'secondary'} 
                size="sm"
                onClick={() => setViewMode('list')}
              >
                📋 List
              </Button>
              <Button 
                variant={viewMode === 'kanban' ? 'primary' : 'secondary'} 
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                📊 Kanban
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {selectedGroupData && (
        <>
          <div className={styles.groupInfo}>
            <h2>📈 {selectedGroupData.groupName} ({selectedGroupData.groupId}) - Progress Summary</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allTasks.length}</div>
                <div className={styles.statLabel}>Total Tasks</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allTasks.filter(t => t.status === 'completed').length}</div>
                <div className={styles.statLabel}>Completed</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allTasks.filter(t => t.status === 'in-progress').length}</div>
                <div className={styles.statLabel}>In Progress</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allTasks.filter(t => t.status === 'pending').length}</div>
                <div className={styles.statLabel}>Pending</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>
                  {allTasks.length > 0 ? Math.round((allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100) : 0}%
                </div>
                <div className={styles.statLabel}>Completion Rate</div>
              </div>
            </div>
          </div>
          
          {viewMode === 'list' ? (
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
                        <div className={styles.taskContext}>
                          <span className={styles.milestoneTag}>📋 {task.milestoneName}</span>
                          <span className={styles.deliveryTag}>📦 {task.deliveryItemName}</span>
                        </div>
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
                        <div className={styles.progressBar}>
                          <div className={styles.progressLabel}>Progress: {task.progress}%</div>
                          <div className={styles.progressTrack}>
                            <div 
                              className={styles.progressFill} 
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.taskDetails}>
                      <div className={styles.detailRow}>
                        <div className={styles.detailItem}>
                          <strong>👤 Assignee:</strong>
                          <span>{task.assigneeName} ({task.assignee})</span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>⏰ Deadline:</strong>
                          <span>{formatDate(task.deadline)}</span>
                        </div>
                      </div>
                      <div className={styles.detailRow}>
                        <div className={styles.detailItem}>
                          <strong>📅 Created:</strong>
                          <span>{formatDate(task.createdAt)}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>📎 Attachments:</strong>
                          <span>{task.attachments?.length || 0} files</span>
                        </div>
                      </div>
                      {task.completedAt && (
                        <div className={styles.detailRow}>
                          <div className={styles.detailItem}>
                            <strong>✅ Completed:</strong>
                            <span>{formatDate(task.completedAt)}</span>
                          </div>
                        </div>
                      )}
                      {task.comments?.length > 0 && (
                        <div className={styles.commentsSection}>
                          <strong>💬 Comments ({task.comments.length}):</strong>
                          <div className={styles.commentsList}>
                            {task.comments.slice(0, 2).map(comment => (
                              <div key={comment.id} className={styles.commentItem}>
                                <span className={styles.commentAuthor}>{comment.authorName}:</span>
                                <span className={styles.commentContent}>{comment.content}</span>
                              </div>
                            ))}
                            {task.comments.length > 2 && (
                              <div className={styles.moreComments}>+{task.comments.length - 2} more comments</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.taskActions}>
                      <Button variant="secondary" size="sm">
                        📋 View Details
                      </Button>
                      <Button variant="secondary" size="sm">
                        ✏️ Add Comment
                      </Button>
                      <Button variant="secondary" size="sm">
                        📎 Add Attachment
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.kanbanBoard}>
              <div className={styles.kanbanColumn}>
                <h3>⏳ Pending ({filteredTasks.filter(t => t.status === 'pending').length})</h3>
                {filteredTasks.filter(t => t.status === 'pending').map(task => (
                  <div key={task.id} className={styles.kanbanCard}>
                    <h4>{task.title}</h4>
                    <p>{task.assigneeName}</p>
                    <div className={styles.kanbanMeta}>
                      <span className={styles.milestoneTag}>{task.milestoneName}</span>
                      <span className={styles.priorityTag}>{task.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.kanbanColumn}>
                <h3>🔄 In Progress ({filteredTasks.filter(t => t.status === 'in-progress').length})</h3>
                {filteredTasks.filter(t => t.status === 'in-progress').map(task => (
                  <div key={task.id} className={styles.kanbanCard}>
                    <h4>{task.title}</h4>
                    <p>{task.assigneeName}</p>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${task.progress}%` }} />
                    </div>
                    <div className={styles.kanbanMeta}>
                      <span className={styles.milestoneTag}>{task.milestoneName}</span>
                      <span className={styles.priorityTag}>{task.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.kanbanColumn}>
                <h3>✅ Completed ({filteredTasks.filter(t => t.status === 'completed').length})</h3>
                {filteredTasks.filter(t => t.status === 'completed').map(task => (
                  <div key={task.id} className={styles.kanbanCard}>
                    <h4>{task.title}</h4>
                    <p>{task.assigneeName}</p>
                    <div className={styles.kanbanMeta}>
                      <span className={styles.milestoneTag}>{task.milestoneName}</span>
                      <span className={styles.completedDate}>{formatDate(task.completedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
