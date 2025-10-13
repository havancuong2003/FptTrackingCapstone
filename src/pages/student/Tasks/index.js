import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Select from '../../../components/Select/Select';

export default function StudentTasks() {
  const [tasks, setTasks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [deliveryItems, setDeliveryItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [taskModal, setTaskModal] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState('');
  const [selectedDeliveryItem, setSelectedDeliveryItem] = React.useState('');
  const [selectedAssignee, setSelectedAssignee] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [viewMode, setViewMode] = React.useState('list'); // list or kanban
  const [newTask, setNewTask] = React.useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    milestoneId: '',
    deliveryItemId: '',
    deadline: ''
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for milestones and delivery items
        const milestonesData = [
          { id: 1, name: 'Milestone 1: Project Setup', groupId: 'GR01' },
          { id: 2, name: 'Milestone 2: Development', groupId: 'GR01' },
          { id: 3, name: 'Milestone 3: Testing', groupId: 'GR01' }
        ];

        const deliveryItemsData = [
          { id: 1, name: 'Project Proposal', milestoneId: 1 },
          { id: 2, name: 'System Design', milestoneId: 1 },
          { id: 3, name: 'Database Design', milestoneId: 2 },
          { id: 4, name: 'Frontend Development', milestoneId: 2 },
          { id: 5, name: 'Backend Development', milestoneId: 2 },
          { id: 6, name: 'Testing Report', milestoneId: 3 }
        ];

        // Mock data for tasks
        const tasksData = [
          {
            id: 1,
            title: 'Setup development environment',
            description: 'Install required tools and setup project structure',
            assignee: 'SE00001',
            assigneeName: 'Nguyen Van A',
            deadline: '2025-10-15T23:59:00Z',
            priority: 'high',
            status: 'todo',
            milestoneId: 1,
            milestoneName: 'Milestone 1: Project Setup',
            deliveryItemId: 1,
            deliveryItemName: 'Project Proposal',
            createdAt: '2025-10-10T09:00:00Z',
            progress: 0,
            attachments: [],
            comments: []
          },
          {
            id: 2,
            title: 'Research database options',
            description: 'Compare different database solutions for the project',
            assignee: 'SE00002',
            assigneeName: 'Nguyen Van B',
            deadline: '2025-10-18T23:59:00Z',
            priority: 'medium',
            status: 'todo',
            milestoneId: 1,
            milestoneName: 'Milestone 1: Project Setup',
            deliveryItemId: 2,
            deliveryItemName: 'System Design',
            createdAt: '2025-10-10T09:30:00Z',
            progress: 0,
            attachments: [],
            comments: []
          },
          {
            id: 3,
            title: 'Design user interface',
            description: 'Create wireframes and mockups for the application',
            assignee: 'SE00003',
            assigneeName: 'Nguyen Van C',
            deadline: '2025-10-22T23:59:00Z',
            priority: 'high',
            status: 'inProgress',
            milestoneId: 2,
            milestoneName: 'Milestone 2: Development',
            deliveryItemId: 4,
            deliveryItemName: 'Frontend Development',
            createdAt: '2025-10-12T14:00:00Z',
            progress: 60,
            attachments: ['wireframe.pdf'],
            comments: [
              { id: 1, author: 'SE00003', content: 'Working on mobile responsive design', timestamp: '2025-10-13T10:00:00Z' }
            ]
          },
          {
            id: 4,
            title: 'Project requirements analysis',
            description: 'Analyze and document project requirements',
            assignee: 'SE00001',
            assigneeName: 'Nguyen Van A',
            deadline: '2025-10-08T23:59:00Z',
            priority: 'high',
            status: 'done',
            milestoneId: 1,
            milestoneName: 'Milestone 1: Project Setup',
            deliveryItemId: 1,
            deliveryItemName: 'Project Proposal',
            createdAt: '2025-10-05T10:00:00Z',
            completedAt: '2025-10-07T16:30:00Z',
            progress: 100,
            attachments: ['requirements.pdf'],
            comments: [
              { id: 1, author: 'SE00001', content: 'Requirements analysis completed', timestamp: '2025-10-07T16:30:00Z' }
            ]
          }
        ];
        
        setMilestones(milestonesData);
        setDeliveryItems(deliveryItemsData);
        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'high':
        return { color: '#dc2626', text: 'High' };
      case 'medium':
        return { color: '#d97706', text: 'Medium' };
      case 'low':
        return { color: '#059669', text: 'Low' };
      default:
        return { color: '#64748b', text: 'Unknown' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setTaskModal(true);
  };

  const createNewTask = () => {
    if (!newTask.title || !newTask.description || !newTask.milestoneId || !newTask.deliveryItemId || !newTask.assignee) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedMilestone = milestones.find(m => m.id.toString() === newTask.milestoneId);
    const selectedDeliveryItem = deliveryItems.find(d => d.id.toString() === newTask.deliveryItemId);
    const selectedAssignee = assigneeOptions.find(a => a.value === newTask.assignee);

    const task = {
      id: Date.now(),
      title: newTask.title,
      description: newTask.description,
      assignee: newTask.assignee,
      assigneeName: selectedAssignee?.label || 'Unknown',
      deadline: newTask.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: newTask.priority,
      status: 'todo',
      milestoneId: parseInt(newTask.milestoneId),
      milestoneName: selectedMilestone?.name || 'Unknown Milestone',
      deliveryItemId: parseInt(newTask.deliveryItemId),
      deliveryItemName: selectedDeliveryItem?.name || 'Unknown Delivery Item',
      createdAt: new Date().toISOString(),
      progress: 0,
      attachments: [],
      comments: []
    };

    setTasks(prev => [task, ...prev]);

    setNewTask({
      title: '',
      description: '',
      assignee: '',
      priority: 'medium',
      milestoneId: '',
      deliveryItemId: '',
      deadline: ''
    });
    setTaskModal(false);
    alert('Task created successfully!');
  };

  const moveTask = (taskId, fromStatus, toStatus) => {
    setTasks(prev => {
      return prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            status: toStatus,
            ...(toStatus === 'done' && { 
              completedAt: new Date().toISOString(),
              progress: 100 
            }),
            ...(toStatus === 'inProgress' && { progress: 50 })
          };
        }
        return task;
      });
    });
    alert(`Task moved to ${toStatus}!`);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading tasks...</div>
      </div>
    );
  }

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter(task => {
    const milestoneMatch = selectedMilestone === '' || task.milestoneId.toString() === selectedMilestone;
    const deliveryMatch = selectedDeliveryItem === '' || task.deliveryItemId.toString() === selectedDeliveryItem;
    const assigneeMatch = selectedAssignee === '' || task.assignee === selectedAssignee;
    const statusMatch = selectedStatus === '' || task.status === selectedStatus;
    return milestoneMatch && deliveryMatch && assigneeMatch && statusMatch;
  });

  const milestoneOptions = milestones.map(m => ({ value: m.id.toString(), label: m.name }));
  const deliveryItemOptions = deliveryItems.map(d => ({ value: d.id.toString(), label: d.name }));
  const assigneeOptions = [
    { value: 'SE00001', label: 'Nguyen Van A' },
    { value: 'SE00002', label: 'Nguyen Van B' },
    { value: 'SE00003', label: 'Nguyen Van C' }
  ];

  const todoTasks = filteredTasks.filter(task => task.status === 'todo');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'inProgress');
  const doneTasks = filteredTasks.filter(task => task.status === 'done');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Task Management</h1>
        <button 
          className={styles.createButton}
          onClick={() => setTaskModal(true)}
        >
          + Create New Task
        </button>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{filteredTasks.length}</div>
          <div className={styles.statLabel}>Total Tasks</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{todoTasks.length}</div>
          <div className={styles.statLabel}>To Do</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{inProgressTasks.length}</div>
          <div className={styles.statLabel}>In Progress</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{doneTasks.length}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Milestone:</label>
            <Select
              value={selectedMilestone}
              onChange={setSelectedMilestone}
              options={[{ value: '', label: 'All Milestones' }, ...milestoneOptions]}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Delivery Item:</label>
            <Select
              value={selectedDeliveryItem}
              onChange={setSelectedDeliveryItem}
              options={[{ value: '', label: 'All Delivery Items' }, ...deliveryItemOptions]}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Assignee:</label>
            <Select
              value={selectedAssignee}
              onChange={setSelectedAssignee}
              options={[{ value: '', label: 'All Assignees' }, ...assigneeOptions]}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Status:</label>
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: '', label: 'All Status' },
                { value: 'todo', label: 'To Do' },
                { value: 'inProgress', label: 'In Progress' },
                { value: 'done', label: 'Done' }
              ]}
            />
          </div>
        </div>
      </div>

      <div className={styles.viewToggle}>
        <button 
          className={`${styles.toggleButton} ${viewMode === 'list' ? styles.active : ''}`}
          onClick={() => setViewMode('list')}
        >
          List View
        </button>
        <button 
          className={`${styles.toggleButton} ${viewMode === 'kanban' ? styles.active : ''}`}
          onClick={() => setViewMode('kanban')}
        >
          Kanban View
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{filteredTasks.length}</div>
          <div className={styles.statLabel}>Total Tasks</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{doneTasks.length}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{inProgressTasks.length}</div>
          <div className={styles.statLabel}>In Progress</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{todoTasks.length}</div>
          <div className={styles.statLabel}>Pending</div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className={styles.tasksList}>
          {filteredTasks.map((task) => {
            const priorityInfo = getPriorityInfo(task.priority);
            return (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.taskHeader}>
                  <h4>{task.title}</h4>
                  <span className={`${styles.priority} ${styles[priorityInfo.text.toLowerCase()]}`}>
                    {priorityInfo.text}
                  </span>
                </div>
                
                <p className={styles.taskDescription}>{task.description}</p>
                
                <div className={styles.taskDetails}>
                  <div className={styles.detailItem}>
                    <strong>👤 Assignee:</strong> {task.assigneeName}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>📅 Deadline:</strong> {formatDate(task.deadline)}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>🎯 Milestone:</strong> {task.milestoneName}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>📦 Delivery:</strong> {task.deliveryItemName}
                  </div>
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
                
                <div className={styles.taskDetails}>
                  <div className={styles.detailRow}>
                    <div className={styles.detailItem}>
                      <strong>Assignee:</strong> {task.assigneeName}
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Deadline:</strong> {formatDate(task.deadline)}
                    </div>
                  </div>
                  <div className={styles.detailRow}>
                    <div className={styles.detailItem}>
                      <strong>Created:</strong> {formatDate(task.createdAt)}
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Attachments:</strong> {task.attachments.length} files
                    </div>
                  </div>
                </div>
                
                {task.comments.length > 0 && (
                  <div className={styles.commentsSection}>
                    <div className={styles.commentsList}>
                      {task.comments.slice(0, 2).map((comment, index) => (
                        <div key={index} className={styles.commentItem}>
                          <span className={styles.commentAuthor}>{comment.author}:</span>
                          <span className={styles.commentContent}>{comment.content}</span>
                        </div>
                      ))}
                      {task.comments.length > 2 && (
                        <div className={styles.moreComments}>
                          +{task.comments.length - 2} more comments
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className={styles.taskActions}>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => openTaskDetail(task)}
                  >
                    View Details
                  </Button>
                  <Button size="sm" variant="secondary">
                    Add Comment
                  </Button>
                  <Button size="sm" variant="secondary">
                    Add Attachment
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.kanbanBoard}>
          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <h3>To Do</h3>
              <span className={styles.taskCount}>{todoTasks.length}</span>
            </div>
            <div className={styles.taskList}>
              {todoTasks.map((task) => {
                const priorityInfo = getPriorityInfo(task.priority);
                return (
                  <div key={task.id} className={styles.taskCard}>
                    <div className={styles.taskHeader}>
                      <h4>{task.title}</h4>
                      <span className={`${styles.priority} ${styles[priorityInfo.text.toLowerCase()]}`}>
                        {priorityInfo.text}
                      </span>
                    </div>
                    <p className={styles.taskDescription}>{task.description}</p>
                    
                    <div className={styles.taskDetails}>
                      <div className={styles.detailItem}>
                        <strong>👤 Assignee:</strong> {task.assigneeName}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>📅 Deadline:</strong> {formatDate(task.deadline)}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>🎯 Milestone:</strong> {task.milestoneName}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>📦 Delivery:</strong> {task.deliveryItemName}
                      </div>
                    </div>
                    
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    
                    <div className={styles.taskActions}>
                      <button 
                        className={`${styles.actionButton} ${styles.primary}`}
                        onClick={() => moveTask(task.id, 'todo', 'inProgress')}
                      >
                        Start Task
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.secondary}`}
                        onClick={() => openTaskDetail(task)}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <h3>In Progress</h3>
              <span className={styles.taskCount}>{inProgressTasks.length}</span>
            </div>
            <div className={styles.taskList}>
              {inProgressTasks.map((task) => {
                const priorityInfo = getPriorityInfo(task.priority);
                return (
                  <div key={task.id} className={styles.kanbanCard}>
                    <div className={styles.kanbanHeader}>
                      <h4>{task.title}</h4>
                      <span 
                        className={styles.priorityTag}
                        style={{ backgroundColor: priorityInfo.color }}
                      >
                        {priorityInfo.text}
                      </span>
                    </div>
                    <p className={styles.kanbanDescription}>{task.description}</p>
                    <div className={styles.kanbanMeta}>
                      <div className={styles.assigneeInfo}>{task.assigneeName}</div>
                      <div className={styles.deadlineInfo}>{formatDate(task.deadline)}</div>
                    </div>
                    <div className={styles.kanbanActions}>
                      <Button 
                        size="sm"
                        onClick={() => moveTask(task.id, 'inProgress', 'done')}
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <h3>Done</h3>
              <span className={styles.taskCount}>{doneTasks.length}</span>
            </div>
            <div className={styles.taskList}>
              {doneTasks.map((task) => {
                const priorityInfo = getPriorityInfo(task.priority);
                return (
                  <div key={task.id} className={styles.kanbanCard}>
                    <div className={styles.kanbanHeader}>
                      <h4>{task.title}</h4>
                      <span 
                        className={styles.priorityTag}
                        style={{ backgroundColor: priorityInfo.color }}
                      >
                        {priorityInfo.text}
                      </span>
                    </div>
                    <p className={styles.kanbanDescription}>{task.description}</p>
                    <div className={styles.kanbanMeta}>
                      <div className={styles.assigneeInfo}>{task.assigneeName}</div>
                      <div className={styles.completedDate}>
                        Completed: {formatDate(task.completedAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      <Modal open={taskModal} onClose={() => setTaskModal(false)}>
        <div className={styles.taskModal}>
          <h2>Create New Task</h2>
          <div className={styles.formGroup}>
            <label>Task Title</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="Enter task title"
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="Enter task description"
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Milestone</label>
            <Select
              value={newTask.milestoneId}
              onChange={(value) => setNewTask({...newTask, milestoneId: value})}
              options={milestoneOptions}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Delivery Item</label>
            <Select
              value={newTask.deliveryItemId}
              onChange={(value) => setNewTask({...newTask, deliveryItemId: value})}
              options={deliveryItemOptions}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Assignee</label>
            <Select
              value={newTask.assignee}
              onChange={(value) => setNewTask({...newTask, assignee: value})}
              options={assigneeOptions}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Priority</label>
            <Select
              value={newTask.priority}
              onChange={(value) => setNewTask({...newTask, priority: value})}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Deadline</label>
            <input
              type="datetime-local"
              value={newTask.deadline}
              onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
              className={styles.input}
            />
          </div>
          
          <div className={styles.modalActions}>
            <button 
              className={`${styles.modalButton} ${styles.secondary}`}
              onClick={() => setTaskModal(false)}
            >
              Cancel
            </button>
            <button 
              className={`${styles.modalButton} ${styles.primary}`}
              onClick={createNewTask}
            >
              Create Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}