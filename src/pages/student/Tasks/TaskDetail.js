import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './TaskDetail.module.scss';
import Button from '../../../components/Button/Button';

export default function TaskDetail() {
  const { groupId } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const taskId = query.get('taskId');
  const navigate = useNavigate();
  const [task, setTask] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [newComment, setNewComment] = React.useState('');
  const [newAttachment, setNewAttachment] = React.useState('');
  const [attachmentType, setAttachmentType] = React.useState('file');

  React.useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data với history đầy đủ
        const mockTasks = [
          {
            id: 1,
            title: 'Setup development environment',
            description: 'Install required tools and setup project structure for the new project. This includes setting up IDE, database connections, and development frameworks.',
            assignee: 'SE00001',
            assigneeName: 'Nguyen Van A',
            deadline: '2025-10-15T23:59:00Z',
            priority: 'high',
            status: 'todo',
            milestoneId: 1,
            milestoneName: 'Milestone 1: Project Setup',
            createdAt: '2025-10-10T09:00:00Z',
            progress: 0,
            attachments: [],
            comments: [],
            history: [
              { 
                id: 1, 
                type: 'created', 
                detail: 'Task created', 
                at: '2025-10-10T09:00:00Z',
                user: 'System',
                action: 'Created task'
              }
            ]
          },
          {
            id: 2,
            title: 'Research database options',
            description: 'Compare different database solutions for the project including MySQL, PostgreSQL, and MongoDB',
            assignee: 'SE00002',
            assigneeName: 'Nguyen Van B',
            deadline: '2025-10-18T23:59:00Z',
            priority: 'medium',
            status: 'inProgress',
            milestoneId: 1,
            milestoneName: 'Milestone 1: Project Setup',
            createdAt: '2025-10-10T09:30:00Z',
            progress: 60,
            attachments: ['research_notes.pdf'],
            comments: [
              { 
                id: 1, 
                author: 'SE00002', 
                authorName: 'Nguyen Van B',
                content: 'Found some interesting options. PostgreSQL seems promising for our use case.', 
                timestamp: '2025-10-12T14:00:00Z' 
              }
            ],
            history: [
              { 
                id: 1, 
                type: 'created', 
                detail: 'Task created', 
                at: '2025-10-10T09:30:00Z',
                user: 'System',
                action: 'Created task'
              },
              { 
                id: 2, 
                type: 'status', 
                detail: 'Moved to In Progress', 
                at: '2025-10-12T09:00:00Z',
                user: 'SE00002',
                action: 'Started work'
              },
              { 
                id: 3, 
                type: 'comment', 
                detail: 'Added comment: Found some interesting options...', 
                at: '2025-10-12T14:00:00Z',
                user: 'SE00002',
                action: 'Commented'
              },
              { 
                id: 4, 
                type: 'attachment', 
                detail: 'Attached research_notes.pdf', 
                at: '2025-10-12T15:30:00Z',
                user: 'SE00002',
                action: 'Added attachment'
              }
            ]
          }
        ];
        
        const foundTask = mockTasks.find(t => t.id.toString() === taskId);
        setTask(foundTask || null);
      } catch (error) {
        console.error('Error fetching task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
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

  const addComment = () => {
    if (!task || !newComment.trim()) return;
    
    const nowIso = new Date().toISOString();
    const newCommentObj = {
      id: Date.now(),
      author: 'SE00001',
      authorName: 'Nguyen Van A',
      content: newComment.trim(),
      timestamp: nowIso
    };

    const newHistoryItem = {
      id: Date.now() + 1,
      type: 'comment',
      detail: `Added comment: ${newComment.trim().substring(0, 50)}...`,
      at: nowIso,
      user: 'SE00001',
      action: 'Commented'
    };

    setTask(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newCommentObj],
      history: [...(prev.history || []), newHistoryItem]
    }));

    setNewComment('');
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

  const updateTaskStatus = (newStatus) => {
    if (!task) return;
    
    const nowIso = new Date().toISOString();
    const statusText = newStatus === 'todo' ? 'To Do' : 
                     newStatus === 'inProgress' ? 'In Progress' : 'Done';

    const newHistoryItem = {
      id: Date.now() + 1,
      type: 'status',
      detail: `Changed status to ${statusText}`,
      at: nowIso,
      user: 'SE00001',
      action: 'Updated status'
    };

    setTask(prev => ({
      ...prev,
      status: newStatus,
      progress: newStatus === 'done' ? 100 : prev.progress, // không auto 50%
      completedAt: newStatus === 'done' ? nowIso : (newStatus !== 'done' ? undefined : prev.completedAt),
      history: [...(prev.history || []), newHistoryItem]
    }));
  };

  const updateProgress = (value) => {
    if (!task) return;
    const clamped = Math.max(0, Math.min(100, Number(value) || 0));
    const nowIso = new Date().toISOString();
    setTask(prev => ({
      ...prev,
      progress: clamped,
      history: [...(prev.history || []), {
        id: Date.now() + 2,
        type: 'progress',
        detail: `Updated progress to ${clamped}%`,
        at: nowIso,
        user: 'SE00001',
        action: 'Updated progress'
      }]
    }));
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
        <Button onClick={() => navigate(`/student/tasks?groupId=${groupId || '1'}`)}>Back to Tasks</Button>
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
            onClick={() => navigate(`/student/tasks?groupId=${groupId || '1'}`)}
            className={styles.backButton}
          >
            ← Back to Tasks
          </Button>
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
                <select
                  className={styles.select}
                  value={task.status}
                  onChange={(e) => updateTaskStatus(e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="inProgress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className={styles.infoItem}>
                <label>Progress:</label>
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
