import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './TaskDetail.module.scss';
import Button from '../../../components/Button/Button';
import BackButton from '../../common/BackButton';
import axiosClient from '../../../utils/axiosClient';

export default function TaskDetail() {
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
      //return { id: 26, name: "Lê Duy Hải" }; // fallback
    } catch (error) {
      console.error('Error parsing auth_user:', error);
     // return { id: 26, name: "Lê Duy Hải" }; // fallback
     return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const [task, setTask] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [newComment, setNewComment] = React.useState('');
  const [newAttachment, setNewAttachment] = React.useState('');
  const [attachmentType, setAttachmentType] = React.useState('file');
  
  // Get user role from localStorage
  const getUserRole = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const user = JSON.parse(authUser);
        return user.role || 'STUDENT';
      }
      return 'STUDENT';
    } catch (error) {
      return 'STUDENT';
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
            priority: taskData.priority.toLowerCase(),
            status: taskData.status === 'ToDo' ? 'todo' : 
                   taskData.status === 'InProgress' ? 'inProgress' : 'done',
            deliverableId: taskData.milestone?.id || null,
            deliverableName: taskData.milestone?.name || 'No Deliverable',
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
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
        feedback: newComment.trim(), // thay vì "feedback"
        groupId: parseInt(groupId) || 1,
        author: `HE${currentUser.id}`, // Lấy từ localStorage
        authorName: currentUser.name // Lấy từ localStorage
      };

      const response = await axiosClient.post('/Student/Comment/create', commentData);
      
      if (response.data.status === 200) {
        // Tạo comment object mới với thông tin từ API
        const nowIso = new Date().toISOString();
        const newCommentObj = {
          id: Date.now(), // API có thể trả về ID thực tế
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

        // Cập nhật state
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

  const addAttachment = () => {
    if (!task || !newAttachment.trim()) return;
    
    const nowIso = new Date().toISOString();
    const newAttachmentName = newAttachment.trim();

    const newHistoryItem = {
      id: Date.now() + 1,
      type: 'attachment',
      detail: `Attached ${newAttachmentName}`,
      at: nowIso,
      user: 'SE00001',
      action: 'Added attachment'
    };

    setTask(prev => ({
      ...prev,
      attachments: [...(prev.attachments || []), newAttachmentName],
      history: [...(prev.history || []), newHistoryItem]
    }));

    setNewAttachment('');
  };

  const updateTaskStatus = async (newStatus) => {
    if (!task) return;
    
    try {
      // Map status từ frontend sang backend
      const backendStatus = newStatus === 'todo' ? 'ToDo' : 
                           newStatus === 'inProgress' ? 'InProgress' : 'Done';
      
      // Map priority từ frontend sang backend
      const backendPriority = task.priority === 'high' ? 'High' : 
                             task.priority === 'medium' ? 'Medium' : 'Low';

      // Gọi API update task theo cấu trúc mới
      const updateData = {
        id: parseInt(taskId),
        name: task.title,
        groupId: parseInt(groupId) || 1,
        description: task.description,
        endAt: task.deadline,
        statusId: backendStatus, // Sử dụng statusId thay vì status
        priorityId: backendPriority, // Sử dụng priorityId thay vì priority
        process: task.progress.toString(),
        deliverableId: task.deliverableId || 0, // Backend vẫn sử dụng deliverableId
        meetingId: task.meetingId || 0,
        assignedUserId: task.assignee || 0,
        reviewerId: task.reviewerId || 0
      };
      const response = await axiosClient.post('/Student/Task/update', updateData);
      
      if (response.data.status === 200) {
        const nowIso = new Date().toISOString();
        const statusText = newStatus === 'todo' ? 'To Do' : 
                         newStatus === 'inProgress' ? 'In Progress' : 'Done';

        const newHistoryItem = {
          id: Date.now() + 1,
          type: 'status',
          detail: `Changed status to ${statusText}`,
          at: nowIso,
          user: `HE${currentUser.id}`,
          action: 'Updated status'
        };

        // Cập nhật state
        setTask(prev => ({
          ...prev,
          status: newStatus,
          progress: newStatus === 'done' ? 100 : prev.progress,
          completedAt: newStatus === 'done' ? nowIso : (newStatus !== 'done' ? undefined : prev.completedAt),
          history: [...(prev.history || []), newHistoryItem]
        }));
      } else {
        console.error('Error updating task:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const updateProgress = async (value) => {
    if (!task) return;
    const clamped = Math.max(0, Math.min(100, Number(value) || 0));
    
    try {
      // Map priority từ frontend sang backend
      const backendPriority = task.priority === 'high' ? 'High' : 
                             task.priority === 'medium' ? 'Medium' : 'Low';

      // Gọi API update task với progress mới theo cấu trúc mới
      const updateData = {
        id: parseInt(taskId),
        name: task.title,
        groupId: parseInt(groupId) || 1,
        description: task.description,
        endAt: task.deadline,
        statusId: task.status === 'todo' ? 'ToDo' : 
                 task.status === 'inProgress' ? 'InProgress' : 'Done',
        priorityId: backendPriority,
        process: clamped.toString(), // Cập nhật progress
        deliverableId: task.deliverableId || 0, // Backend vẫn sử dụng deliverableId
        meetingId: task.meetingId || 0,
        assignedUserId: task.assignee || 0,
        reviewerId: task.reviewerId || 0
      };
      const response = await axiosClient.post('/Student/Task/update', updateData);
      
      if (response.data.status === 200) {
        const nowIso = new Date().toISOString();
        setTask(prev => ({
          ...prev,
          progress: clamped,
          history: [...(prev.history || []), {
            id: Date.now() + 2,
            type: 'progress',
            detail: `Updated progress to ${clamped}%`,
            at: nowIso,
            user: `HE${currentUser.id}`,
            action: 'Updated progress'
          }]
        }));
      } else {
        console.error('Error updating progress:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
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
        <BackButton to={`/student/tasks?groupId=${groupId || '1'}`}>
          ← Back to Tasks
        </BackButton>
      </div>
    );
  }

  const priorityInfo = getPriorityInfo(task.priority);

  return (
    <div className={styles.container}>
      <BackButton to={`/student/tasks?groupId=${groupId || '1'}`}>
        ← Back to Tasks
      </BackButton>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>{task.title}</h1>
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
                <label>Deliverable:</label>
                <span>{task.deliverableName}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Status:</label>
                {!isSupervisor ? (
                  <select
                    className={styles.select}
                    value={task.status}
                    onChange={(e) => updateTaskStatus(e.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="inProgress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                ) : (
                  <span className={styles.statusValue}>{task.status === 'todo' ? 'To Do' : 
                      task.status === 'inProgress' ? 'In Progress' : 'Done'}</span>
                )}
              </div>
              <div className={styles.infoItem}>
                <label>Progress:</label>
                {!isSupervisor ? (
                  <div className={styles.progressInline}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className={styles.numberInput}
                      value={task.progress}
                      onChange={(e) => updateProgress(e.target.value)}
                    />
                    <span>%</span>
                  </div>
                ) : (
                  <span className={styles.progressValue}>{task.progress}%</span>
                )}
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
                    onClick={() => navigate(`/student/meetings/${groupId}?meetingId=${task.meetingId}`)}
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
                  <span className={styles.attachmentName}>{attachment}</span>
                </div>
              ))}
            </div>
            
            <div className={styles.addAttachment}>
              <div className={styles.attachmentType}>
                <label>
                  <input
                    type="radio"
                    name="attachmentType"
                    value="file"
                    checked={attachmentType === 'file'}
                    onChange={(e) => setAttachmentType(e.target.value)}
                  />
                  File (PDF, DOC, etc.)
                </label>
                <label>
                  <input
                    type="radio"
                    name="attachmentType"
                    value="image"
                    checked={attachmentType === 'image'}
                    onChange={(e) => setAttachmentType(e.target.value)}
                  />
                  Image (Evidence)
                </label>
              </div>
              <input
                className={styles.attachmentInput}
                placeholder={`Add ${attachmentType} name...`}
                value={newAttachment}
                onChange={(e) => setNewAttachment(e.target.value)}
              />
              <Button onClick={addAttachment} className={styles.addButton}>
                Attach {attachmentType === 'image' ? 'Image' : 'File'}
              </Button>
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

