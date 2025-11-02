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
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  
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

  // Helper function to map task data
  const mapTaskData = (taskData) => {
    return {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      assignee: taskData.assigneeId,
      assigneeName: taskData.assigneeName,
      deadline: taskData.deadline,
      priority: taskData.priority.toLowerCase(),
      status: taskData.status.toLowerCase() === 'todo' ? 'todo' : 
             taskData.status.toLowerCase() === 'inprogress' ? 'inProgress' : 'done',
      deliverableId: taskData.milestone?.id || null,
      deliverableName: taskData.milestone?.name || 'No Deliverable',
      createdAt: taskData.createdAt,
      attachments: taskData.attachments || [],
      comments: taskData.comments || [],
      history: taskData.history || [],
      isMeetingTask: taskData.isMeetingTask || false,
      meetingId: taskData.meetingId || null,
      isActive: taskData.isActive !== undefined ? taskData.isActive : true,
      reviewer: taskData.reviewerId || null,
      reviewerName: taskData.reviewerName || 'No Reviewer',
      reviewerId: taskData.reviewerId || null
    };
  };

  // Helper function to reload task data
  const reloadTaskData = async () => {
    try {
      const response = await axiosClient.get(`/Student/Task/get-by-id/${taskId}`);
      if (response.data.status === 200) {
        const taskData = response.data.data;
        setTask(mapTaskData(taskData));
      }
    } catch (error) {
      console.error('Error reloading task data:', error);
    }
  };

  React.useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        
        // Gọi API lấy task theo ID
        const response = await axiosClient.get(`/Student/Task/get-by-id/${taskId}`);
        if (response.data.status === 200) {
          const taskData = response.data.data;
          setTask(mapTaskData(taskData));
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
        taskId: parseInt(taskId),
        feedback: newComment.trim(), // thay vì "feedback"
        groupId: parseInt(groupId),

      };

      const response = await axiosClient.post('/Student/Comment/create', commentData);
      
      if (response.data.status === 200) {
        console.log('response', response.data);
        // Tạo comment object mới với thông tin từ API
        const nowIso = new Date().toISOString();
        const newCommentObj = {
          id: response.data.data.id, // API có thể trả về ID thực tế
          author: currentUser.id,
          authorName: currentUser.name,
          content: response.data.data.feedback,
          timestamp: response.data.data.createdAt
        };

        const newHistoryItem = {
          id: Date.now() + 1,
          type: 'comment',
          detail: `Added comment: ${newComment.trim().substring(0, 50)}...`,
          at: nowIso,
          // user get from localStorage
          user: currentUser.id,
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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !task || !groupId || !taskId) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await axiosClient.post(
        `/upload/task?groupId=${groupId}&taskId=${taskId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      if (response.data.status === 200) {
        // Reload task data after successful upload
        await reloadTaskData();
        
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('task-file-input');
        if (fileInput) fileInput.value = '';
        alert('Tải file lên thành công!');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Có lỗi xảy ra khi tải file lên. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (attachment) => {
    try {
      // Use fileUrl from attachment (cấu trúc mới: {id, fileName, fileUrl})
      const fileUrl = attachment.fileUrl || attachment.path;
      const filePath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL?.replace(/\/api\/v1$/, '') || 'https://160.30.21.113:5000';
      // Ensure path has /api/v1 prefix
      const fullPath = filePath.startsWith('/api/v1') ? filePath : `/api/v1${filePath}`;
      const response = await fetch(`${apiBaseUrl}${fullPath}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Use fileName if available, otherwise extract from path
      link.download = attachment.fileName || fileUrl.split('/').pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Có lỗi xảy ra khi tải file. Vui lòng thử lại.');
    }
  };

  const deleteAttachment = async (attachmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa file này?')) {
      return;
    }
    
    try {
      const response = await axiosClient.delete(`/upload/task?attachmentId=${attachmentId}`);
      if (response.data.status === 200) {
        alert('Xóa file thành công!');
        // Reload task data after successful delete
        await reloadTaskData();
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Có lỗi xảy ra khi xóa file. Vui lòng thử lại.');
    }
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
        groupId: parseInt(groupId),
        description: task.description,
        endAt: task.deadline,
        statusId: backendStatus, // Sử dụng statusId thay vì status
        priorityId: backendPriority, // Sử dụng priorityId thay vì priority
        deliverableId: task.deliverableId , // Backend vẫn sử dụng deliverableId
        meetingId: task.meetingId ,
        assignedUserId: task.assignee ,
        reviewerId: task.reviewerId 
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
                  {task.isMeetingTask ? 'Issue' : 'Main Task'}
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
                <label>Active:</label>
                <span className={task.isActive ? styles.activeStatus : styles.inactiveStatus}>
                  {task.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {task.isMeetingTask && task.meetingId && (
                <div className={styles.infoItem}>
                  <label>Related Meeting:</label>
                  <Button 
                    onClick={() => navigate(`/student/meetings`)}
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
            
            {/* Upload Section */}
            <div className={styles.uploadSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <input
                  type="file"
                  id="task-file-input"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="task-file-input"
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                    display: 'inline-block'
                  }}
                >
                  Chọn File
                </label>
                {selectedFile && (
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    style={{ fontSize: 14, padding: '8px 16px' }}
                  >
                    {uploading ? 'Đang tải...' : 'Tải lên'}
                  </Button>
                )}
              </div>
              {selectedFile && (
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                  Đã chọn: {selectedFile.name}
                </div>
              )}
            </div>

            {/* Attachments List */}
            {task.attachments && task.attachments.length > 0 ? (
              <div className={styles.attachmentsList}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>
                  Files ({task.attachments.length}):
                </h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {task.attachments.map((attachment, index) => {
                      // Cấu trúc mới: {id, fileName, fileUrl}
                      const fileName = typeof attachment === 'string' 
                        ? attachment 
                        : (attachment.fileName || attachment.name || (attachment.fileUrl ? attachment.fileUrl.split('/').pop() : 'Unknown'));
                      const attachmentId = typeof attachment === 'object' ? attachment.id : null;
                      const hasFileUrl = typeof attachment === 'object' && (attachment.fileUrl || attachment.path);
                      const userName = typeof attachment === 'object' ? attachment.userName : null;
                      const createAt = typeof attachment === 'object' 
                        ? (attachment.createAt || attachment.createdAt) 
                        : null;
                      
                      return (
                        <div 
                          key={attachmentId || index} 
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            marginBottom: 8,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 16 16" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ flexShrink: 0 }}
                              >
                                <path 
                                  d="M10.5 2H4.5C3.67157 2 3 2.67157 3 3.5V12.5C3 13.3284 3.67157 14 4.5 14H11.5C12.3284 14 13 13.3284 13 12.5V5.5L10.5 2Z" 
                                  stroke="#64748b" 
                                  strokeWidth="1.5" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                />
                                <path 
                                  d="M10 2V5.5H13" 
                                  stroke="#64748b" 
                                  strokeWidth="1.5" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <div style={{ 
                                fontSize: 14, 
                                fontWeight: 500, 
                                wordBreak: 'break-all',
                                color: '#1f2937'
                              }}>
                                {fileName}
                              </div>
                            </div>
                            {userName && createAt && (
                              <div style={{ fontSize: 12, color: '#64748b', marginLeft: 24 }}>
                                Tải lên bởi {userName} vào {formatDate(createAt)}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            {attachmentId && hasFileUrl ? (
                              <>
                                <Button
                                  onClick={() => downloadFile(attachment)}
                                  variant="ghost"
                                  style={{ fontSize: 12, padding: '6px 12px' }}
                                >
                                  Tải xuống
                                </Button>
                                <Button
                                  onClick={() => deleteAttachment(attachmentId)}
                                  variant="ghost"
                                  style={{ 
                                    fontSize: 12, 
                                    padding: '6px 12px',
                                    color: '#dc2626',
                                    background: '#fee2e2'
                                  }}
                                >
                                  Xóa
                                </Button>
                              </>
                            ) : (
                              <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                                Chỉ hiển thị
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: 24, 
                textAlign: 'center', 
                color: '#64748b',
                background: '#f9fafb',
                borderRadius: 8,
                border: '1px dashed #d1d5db'
              }}>
                Chưa có file nào được đính kèm
              </div>
            )}
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

