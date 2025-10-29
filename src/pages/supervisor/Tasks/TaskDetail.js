import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './TaskDetail.module.scss';
import Button from '../../../components/Button/Button';
import BackButton from '../../common/BackButton';
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
  const [newComment, setNewComment] = React.useState('');
  
  // Get user role from localStorage
  const getUserRole = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const user = JSON.parse(authUser);
        return user.role || 'SUPERVISOR';
      }
      return 'SUPERVISOR';
    } catch (error) {
      return 'SUPERVISOR';
    }
  };
  
  const userRole = getUserRole();
  const isSupervisor = userRole === 'SUPERVISOR' || userRole === 'MENTOR';

  React.useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        
        // Gọi API lấy task theo ID
        const response = await axiosClient.get(`/Student/Task/get-by-id/${taskId}`);
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
            history: taskData.history || [],
            // New fields
            isMeetingTask: taskData.isMeetingTask || false,
            meetingId: taskData.meetingId || null,
            isActive: taskData.isActive !== undefined ? taskData.isActive : true,
            reviewer: taskData.reviewer || null,
            reviewerName: taskData.reviewerName || 'No Reviewer'
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
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const addComment = async () => {
    if (!task || !newComment.trim()) return;
    
    try {
      // Gọi API create comment
      const commentData = {
        entityName: "Task",
        entityId: parseInt(taskId),
        feedback: newComment.trim(),
        groupId: parseInt(groupId) || 1,
        author: `HE${currentUser.id}`,
        authorName: currentUser.name
      };

      const response = await axiosClient.post('/Student/Comment/create', commentData);
      
      if (response.data.status === 200) {
        const nowIso = new Date().toISOString();
        const newCommentObj = {
          id: Date.now(),
          author: commentData.author,
          authorName: commentData.authorName,
          content: newComment.trim(),
          timestamp: nowIso
        };

        const newHistoryItem = {
          id: Date.now() + 1,
          type: 'comment',
          detail: `Added comment: ${newComment.trim().substring(0, 50)}...`,
          at: nowIso,
          user: commentData.author,
          action: 'Commented'
        };

        setTask(prev => ({
          ...prev,
          comments: [...(prev.comments || []), newCommentObj],
          history: [...(prev.history || []), newHistoryItem]
        }));

        setNewComment('');
      } else {
        console.error('Error creating comment:', response.data.message);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
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
        <BackButton onClick={() => navigate(-1)}>
          ← Back
        </BackButton>
      </div>
    );
  }

  const priorityInfo = getPriorityInfo(task.priority);

  return (
    <div className={styles.container}>
      <BackButton onClick={() => navigate(-1)}>
        ← Back
      </BackButton>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
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
                <label>Task Type:</label>
                <span className={styles.taskTypeBadge}>
                  {task.isMeetingTask ? 'Meeting Task' : 'Throughout Task'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <label>Priority:</label>
                <span style={{ color: priorityInfo.color, fontWeight: 600 }}>{priorityInfo.text}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Assignee:</label>
                <span>{task.assigneeName}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Reviewer:</label>
                <span>{task.reviewerName}</span>
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
              <div className={styles.infoItem}>
                <label>Active:</label>
                <span className={task.isActive ? styles.activeStatus : styles.inactiveStatus}>
                  {task.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {task.isMeetingTask && task.meetingId && (
                <div className={styles.infoItem}>
                  <label>Related Meeting:</label>
                  <Button 
                    onClick={() => navigate(`/supervisor/meetings/${groupId}?meetingId=${task.meetingId}`)}
                    className={styles.meetingButton}
                  >
                    View Meeting Details
                  </Button>
                </div>
              )}
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
            
            <div className={styles.addComment}>
              <textarea
                className={styles.commentTextarea}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />
              <Button onClick={addComment} className={styles.addButton}>
                Add Comment
              </Button>
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
