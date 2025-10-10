import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

export default function StudentTasks() {
  const [tasks, setTasks] = React.useState({ todo: [], inProgress: [], done: [] });
  const [loading, setLoading] = React.useState(true);
  const [taskModal, setTaskModal] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [newTask, setNewTask] = React.useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    milestoneId: ''
  });

  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": {
            "todo": [
              {
                "id": 1,
                "title": "Setup development environment",
                "description": "Install required tools and setup project structure",
                "assignee": "SE00001",
                "assigneeName": "Nguyen Van A",
                "deadline": "2025-10-15T23:59:00Z",
                "priority": "high",
                "milestoneId": 1,
                "createdAt": "2025-10-10T09:00:00Z"
              },
              {
                "id": 2,
                "title": "Research database options",
                "description": "Compare different database solutions for the project",
                "assignee": "SE00002",
                "assigneeName": "Nguyen Van B",
                "deadline": "2025-10-18T23:59:00Z",
                "priority": "medium",
                "milestoneId": 1,
                "createdAt": "2025-10-10T09:30:00Z"
              }
            ],
            "inProgress": [
              {
                "id": 3,
                "title": "Design user interface",
                "description": "Create wireframes and mockups for the application",
                "assignee": "SE00003",
                "assigneeName": "Nguyen Van C",
                "deadline": "2025-10-22T23:59:00Z",
                "priority": "high",
                "milestoneId": 2,
                "createdAt": "2025-10-12T14:00:00Z"
              }
            ],
            "done": [
              {
                "id": 4,
                "title": "Project requirements analysis",
                "description": "Analyze and document project requirements",
                "assignee": "SE00001",
                "assigneeName": "Nguyen Van A",
                "deadline": "2025-10-08T23:59:00Z",
                "priority": "high",
                "milestoneId": 1,
                "createdAt": "2025-10-05T10:00:00Z",
                "completedAt": "2025-10-07T16:30:00Z"
              }
            ]
          }
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
    if (!newTask.title || !newTask.description) {
      alert('Please fill in all required fields');
      return;
    }

    const task = {
      id: Date.now(),
      title: newTask.title,
      description: newTask.description,
      assignee: newTask.assignee,
      assigneeName: 'Nguyen Van A', // Mock assignee name
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      priority: newTask.priority,
      milestoneId: newTask.milestoneId || 1,
      createdAt: new Date().toISOString(),
      status: 'todo'
    };

    setTasks(prev => ({
      ...prev,
      todo: [task, ...prev.todo]
    }));

    setNewTask({
      title: '',
      description: '',
      assignee: '',
      priority: 'medium',
      milestoneId: ''
    });
    setTaskModal(false);
    alert('Task created successfully!');
  };

  const moveTask = (taskId, fromStatus, toStatus) => {
    setTasks(prev => {
      const newTasks = { ...prev };
      
      // Find and remove task from source column
      const taskIndex = newTasks[fromStatus].findIndex(task => task.id === taskId);
      if (taskIndex === -1) return prev;
      
      const task = newTasks[fromStatus][taskIndex];
      
      // Update task status and completion time if moving to done
      const updatedTask = {
        ...task,
        status: toStatus,
        ...(toStatus === 'done' && { completedAt: new Date().toISOString() })
      };
      
      // Remove from source and add to destination
      newTasks[fromStatus] = newTasks[fromStatus].filter(task => task.id !== taskId);
      newTasks[toStatus] = [updatedTask, ...newTasks[toStatus]];
      
      return newTasks;
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tasks</h1>
        <Button onClick={() => setTaskModal(true)}>
          Create New Task
        </Button>
      </div>
      
      <div className={styles.kanbanBoard}>
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3>To Do ({tasks.todo.length})</h3>
          </div>
          <div className={styles.taskList}>
            {tasks.todo.map((task) => {
              const priorityInfo = getPriorityInfo(task.priority);
              return (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <h4>{task.title}</h4>
                    <span 
                      className={styles.priority}
                      style={{ color: priorityInfo.color }}
                    >
                      {priorityInfo.text}
                    </span>
                  </div>
                  <p className={styles.taskDescription}>{task.description}</p>
                  <div className={styles.taskDetails}>
                    <div className={styles.detailItem}>
                      <strong>Assignee:</strong> {task.assigneeName}
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Deadline:</strong> {formatDate(task.deadline)}
                    </div>
                  </div>
                  <div className={styles.taskActions}>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => openTaskDetail(task)}
                    >
                      View
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => moveTask(task.id, 'todo', 'inProgress')}
                    >
                      Start
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3>In Progress ({tasks.inProgress.length})</h3>
          </div>
          <div className={styles.taskList}>
            {tasks.inProgress.map((task) => {
              const priorityInfo = getPriorityInfo(task.priority);
              return (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <h4>{task.title}</h4>
                    <span 
                      className={styles.priority}
                      style={{ color: priorityInfo.color }}
                    >
                      {priorityInfo.text}
                    </span>
                  </div>
                  <p className={styles.taskDescription}>{task.description}</p>
                  <div className={styles.taskDetails}>
                    <div className={styles.detailItem}>
                      <strong>Assignee:</strong> {task.assigneeName}
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Deadline:</strong> {formatDate(task.deadline)}
                    </div>
                  </div>
                  <div className={styles.taskActions}>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => openTaskDetail(task)}
                    >
                      View
                    </Button>
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
            <h3>Done ({tasks.done.length})</h3>
          </div>
          <div className={styles.taskList}>
            {tasks.done.map((task) => {
              const priorityInfo = getPriorityInfo(task.priority);
              return (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <h4>{task.title}</h4>
                    <span 
                      className={styles.priority}
                      style={{ color: priorityInfo.color }}
                    >
                      {priorityInfo.text}
                    </span>
                  </div>
                  <p className={styles.taskDescription}>{task.description}</p>
                  <div className={styles.taskDetails}>
                    <div className={styles.detailItem}>
                      <strong>Assignee:</strong> {task.assigneeName}
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Completed:</strong> {formatDate(task.completedAt)}
                    </div>
                  </div>
                  <div className={styles.taskActions}>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => openTaskDetail(task)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
            <label>Assignee</label>
            <select
              value={newTask.assignee}
              onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
              className={styles.select}
            >
              <option value="">Select assignee</option>
              <option value="SE00001">Nguyen Van A</option>
              <option value="SE00002">Nguyen Van B</option>
              <option value="SE00003">Nguyen Van C</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Priority</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              className={styles.select}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setTaskModal(false)}>
              Cancel
            </Button>
            <Button onClick={createNewTask}>
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}