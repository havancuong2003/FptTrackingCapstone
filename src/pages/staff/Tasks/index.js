import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import DataTable from '../../../components/DataTable/DataTable';
import Button from '../../../components/Button/Button';

export default function StaffTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all'
  });

  // Mock data - thay thế bằng API call thực tế
  const mockTasks = [
    {
      id: 1,
      title: 'Setup Project Environment',
      description: 'Configure development environment for the capstone project',
      assignee: 'John Doe',
      status: 'inProgress',
      priority: 'high',
      progress: 75,
      deadline: '2024-01-15',
      milestone: 'Project Setup'
    },
    {
      id: 2,
      title: 'Database Design',
      description: 'Design and implement database schema',
      assignee: 'Jane Smith',
      status: 'todo',
      priority: 'medium',
      progress: 0,
      deadline: '2024-01-20',
      milestone: 'Database Implementation'
    },
    {
      id: 3,
      title: 'API Development',
      description: 'Develop REST API endpoints',
      assignee: 'Bob Johnson',
      status: 'done',
      priority: 'high',
      progress: 100,
      deadline: '2024-01-10',
      milestone: 'Backend Development'
    }
  ];

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
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

  const getStatusInfo = (status) => {
    switch (status) {
      case 'todo':
        return { color: '#6b7280', text: 'To Do', bgColor: '#f3f4f6' };
      case 'inProgress':
        return { color: '#d97706', text: 'In Progress', bgColor: '#fef3c7' };
      case 'done':
        return { color: '#059669', text: 'Done', bgColor: '#d1fae5' };
      default:
        return { color: '#64748b', text: 'Unknown', bgColor: '#f3f4f6' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const columns = [
    {
      key: 'title',
      title: 'Task',
      render: (task) => (
        <div>
          <div className={styles.taskTitle}>{task.title}</div>
          <div className={styles.taskDescription}>{task.description}</div>
        </div>
      )
    },
    {
      key: 'assignee',
      title: 'Assignee',
      render: (task) => task.assignee
    },
    {
      key: 'milestone',
      title: 'Milestone',
      render: (task) => task.milestone
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (task) => {
        const priorityInfo = getPriorityInfo(task.priority);
        return (
          <span 
            className={styles.priorityBadge}
            style={{ 
              color: priorityInfo.color,
              backgroundColor: priorityInfo.color + '20'
            }}
          >
            {priorityInfo.text}
          </span>
        );
      }
    },
    {
      key: 'status',
      title: 'Status',
      render: (task) => {
        const statusInfo = getStatusInfo(task.status);
        return (
          <span 
            className={styles.statusBadge}
            style={{ 
              color: statusInfo.color,
              backgroundColor: statusInfo.bgColor
            }}
          >
            {statusInfo.text}
          </span>
        );
      }
    },
    {
      key: 'progress',
      title: 'Progress',
      render: (task) => (
        <div className={styles.progressInfo}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <div className={styles.progressText}>{task.progress}%</div>
        </div>
      )
    },
    {
      key: 'deadline',
      title: 'Deadline',
      render: (task) => formatDate(task.deadline)
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (task) => (
        <div className={styles.actionButtons}>
          <Button 
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              // Handle view details
              console.log('View task:', task.id);
            }}
          >
            View
          </Button>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Handle edit
              console.log('Edit task:', task.id);
            }}
          >
            Edit
          </Button>
        </div>
      )
    }
  ];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false;
    return true;
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Tasks Management</h1>
        <Button onClick={() => console.log('Create new task')}>
          + Create New Task
        </Button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange}
            className={styles.select}
          >
            <option value="all">All</option>
            <option value="todo">To Do</option>
            <option value="inProgress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Priority:</label>
          <select 
            name="priority" 
            value={filters.priority} 
            onChange={handleFilterChange}
            className={styles.select}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Assignee:</label>
          <select 
            name="assignee" 
            value={filters.assignee} 
            onChange={handleFilterChange}
            className={styles.select}
          >
            <option value="all">All</option>
            <option value="John Doe">John Doe</option>
            <option value="Jane Smith">Jane Smith</option>
            <option value="Bob Johnson">Bob Johnson</option>
          </select>
        </div>
      </div>

      <div className={styles.tasksTable}>
        <DataTable
          columns={columns}
          data={filteredTasks}
          loading={loading}
          emptyMessage="Không có task nào"
          onRowClick={(task) => console.log('Row clicked:', task.id)}
        />
      </div>
    </div>
  );
} 