import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './TaskDetail.module.scss';
import Button from '../../../components/Button/Button';
import axiosClient from '../../../utils/axiosClient';

export default function SupervisorTaskDetail() {
  const { groupId } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const taskId = query.get('taskId');
  const navigate = useNavigate();
  
  // Lấy thông tin user từ localStorage
  const getCurrentUser = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        return JSON.parse(authUser);
      }
      return null;
    } catch (error) {
      console.error('Error parsing auth_user:', error);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const [task, setTask] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        
        // Gọi API lấy task theo ID
        const response = await axiosClient.get(`/Student/Task/get-by-id/${taskId}`);
        console.log("response get task by id", response);
        if (response.data.status === 200) {
          const taskData = response.data.data;
          
          // Map data từ API response sang format frontend
          const mappedTask = {
            id: taskData.id,
            title: taskData.title,
            description: taskData.description,
            assignee: taskData.assigneeId,
            assigneeName: taskData.assigneeName,
            deadline: taskData.deadline,
            priority: taskData.priority?.toLowerCase() || 'medium',
            status: taskData.status === 'ToDo' ? 'todo' : 
                   taskData.status === 'InProgress' ? 'inProgress' : 'done',
            milestoneId: taskData.milestone?.id || null,
            milestoneName: taskData.milestone?.name || 'No Milestone',
            createdAt: taskData.createdAt,
            progress: parseInt(taskData.process) || 0,
            attachments: taskData.attachments || [],
            comments: taskData.comments || [],
            history: taskData.history || []
          };
          
          setTask(mappedTask);
        } else {
          console.error('Error fetching task:', response.data.message);
          setTask(null);
        }
      } catch (error) {
        console.error('Error fetching task:', error);
        setTask(null);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 'high':
        return { color: '#dc2626', text: 'High', bg: '#fef2f2' };
      case 'medium':
        return { color: '#d97706', text: 'Medium', bg: '#fef3c7' };
      case 'low':
        return { color: '#059669', text: 'Low', bg: '#dbeafe' };
      default:
        return { color: '#64748b', text: 'Unknown', bg: '#f3f4f6' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className={styles.error}>
        <h2>Task not found</h2>
        <Button onClick={() => navigate(`/supervisor/tasks?groupId=${groupId || '1'}`)}>Back to Tasks</Button>
      </div>
    );
  }

  const priorityInfo = getPriorityInfo(task.priority);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/supervisor/tasks?groupId=${groupId || '1'}`)}
            className={styles.backButton}
          >
            ← Back to Tasks
          </Button>
          <h1>{task.title}</h1>
        </div>
        <div className={styles.supervisorBadge}>
          <span>Supervisor View (Read Only)</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <div className={styles.section}>
            <h2>Description</h2>
            <p className={styles.description}>{task.description}</p>
          </div>

          <div className={styles.section}>
            <h2>Task Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Priority:</label>
                <span style={{ color: priorityInfo.color, fontWeight: 600 }}>{priorityInfo.text}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Assignee:</label>
                <span>{task.assigneeName}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Deadline:</label>
                <span>{formatDate(task.deadline)}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Milestone:</label>
                <span>{task.milestoneName}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Status:</label>
                <span className={styles.statusBadge}>
                  {task.status === 'todo' ? 'To Do' : 
                   task.status === 'inProgress' ? 'In Progress' : 'Done'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Progress:</label>
                <div className={styles.progressDisplay}>
                  <span>{task.progress}%</span>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Comments</h2>
            <div className={styles.commentsList}>
              {task.comments.map(comment => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>{comment.authorName}</span>
                    <span className={styles.commentTime}>{formatDate(comment.timestamp)}</span>
                  </div>
                  <div className={styles.commentContent}>{comment.content}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2>Attachments</h2>
            <div className={styles.attachmentsList}>
              {task.attachments.map((attachment, index) => (
                <div key={index} className={styles.attachment}>
                  <span className={styles.attachmentIcon}>📎</span>
                  <span className={styles.attachmentName}>{attachment.fileName || attachment}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.section}>
            <h2>History</h2>
            <div className={styles.historyList}>
              {task.history.map(item => (
                <div key={item.id} className={styles.historyItem}>
                  <div className={styles.historyDot} />
                  <div className={styles.historyContent}>
                    <div className={styles.historyTitle}>{item.detail}</div>
                    <div className={styles.historyMeta}>
                      <span className={styles.historyUser}>{item.user}</span>
                      <span className={styles.historyAction}>{item.action}</span>
                      <span className={styles.historyTime}>{formatDate(item.at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
