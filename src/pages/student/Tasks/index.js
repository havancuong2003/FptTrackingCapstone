import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import axiosClient from '../../../utils/axiosClient';

export default function StudentTasks() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const groupId = query.get('groupId');
  
  // Lấy thông tin user từ localStorage
  const getCurrentUser = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        return JSON.parse(authUser);
      }
      return null; // Không có user
    } catch (error) {
      console.error('Error parsing auth_user:', error);
      return null; // Lỗi parse
    }
  };
  
  const currentUser = getCurrentUser();
  const [tasks, setTasks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [taskModal, setTaskModal] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('list'); // list or kanban
  const [newTask, setNewTask] = React.useState({
    title: '',
    description: '',
    assignee: '',
    priority: '',
    milestoneId: '',
    deadline: ''
  });
  
  // States cho comment và attachment
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [newComment, setNewComment] = React.useState('');
  const [newAttachment, setNewAttachment] = React.useState('');

  // Trạng thái search-on-click
  const [isSearched, setIsSearched] = React.useState(false);
  
  // Tất cả tasks (load khi bấm tìm kiếm)
  const [allTasks, setAllTasks] = React.useState([]);
  
  // Filter states riêng biệt
  const [milestoneFilter, setMilestoneFilter] = React.useState('');
  const [assigneeFilter, setAssigneeFilter] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [myTasksOnly, setMyTasksOnly] = React.useState(false);
  // API: lấy milestones theo group
  const fetchMilestonesByGroup = async (gid) => {
    try {
      const response = await axiosClient.get(`/Student/milestone/group/${gid}`);
      
      if (response.data.status === 200) {
        // Kiểm tra data có tồn tại và không null/undefined
        const apiData = response.data.data;
        const milestonesData = Array.isArray(apiData) ? apiData : [];
        
        // Map data từ API response sang format frontend
        return milestonesData.map(milestone => ({
          id: milestone.id,
          name: milestone.name,
          groupId: gid,
          description: milestone.description,
          deadline: milestone.deadline
        }));
      } else {
        console.error('Error fetching milestones:', response.data.message);
        alert(`Lỗi lấy milestones: ${response.data.message}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      alert(`Lỗi kết nối milestones: ${error.message}`);
      return [];
    }
  };

  // API: lấy students theo group
  const fetchStudentsByGroup = async (gid) => {
    try {
      const response = await axiosClient.get(`/Staff/capstone-groups/${gid}`);
      
      if (response.data.status === 200) {
        // Kiểm tra data có tồn tại và không null/undefined
        const apiData = response.data.data.students;
        const studentsData = Array.isArray(apiData) ? apiData : [];
        
        // Map data từ API response sang format frontend
        return studentsData.map(student => ({
          id: student.id,
          name: student.name,
          studentId: student.studentId || student.id,
          email: student.email || ''
        }));
      } else {
        console.error('Error fetching students:', response.data.message);
        alert(`Lỗi lấy danh sách students: ${response.data.message}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      alert(`Lỗi kết nối lấy students: ${error.message}`);
      return [];
    }
  };

  React.useEffect(() => {
    const bootstrapFilters = async () => {
      try {
        setLoading(true);
        // Load dữ liệu filter trước (milestones/students theo group)
        const [milestoneRes, studentRes] = await Promise.all([
          fetchMilestonesByGroup(groupId),
          fetchStudentsByGroup(groupId),
        ]);
        const milestonesData = milestoneRes;
        const students = studentRes;
        setMilestones(milestonesData);
        // Không load tasks ở đây nữa, chỉ load khi bấm "Tìm kiếm"
        setTasks([]);
        // Lưu danh sách assignee từ API students
        console.log("students", students);
        setAssigneeSource(students);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    bootstrapFilters();
  }, [groupId]);

  // Nguồn assignee lấy từ API theo group
  const [assigneeSource, setAssigneeSource] = React.useState([]);

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
    const url = `/student/task/group/${groupId}?taskId=${task.id}`;
    navigate(url);
  };

  // Handle search - load all tasks từ API
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      // Gọi API lấy tất cả tasks theo group
      const response = await axiosClient.get(`/Student/Task/get-by-group/${groupId}`);
      if (response.data.status === 200) {
        // Kiểm tra data có tồn tại và không null/undefined
        const apiData = response.data.data;
        const tasksData = Array.isArray(apiData) ? apiData : [];
        // Map data từ API response sang format front
        const mappedTasks = tasksData.map(task => {
          console.log("task", task);
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            groupId: task.group?.id?.toString() || groupId || '1',
            assignee: task.assigneeId,
            assigneeName: task.assigneeName,
            deadline: task.deadline,
            priority: task.priority?.toLowerCase() || 'medium',
            status: task.status === 'ToDo' ? 'todo' : 
                   task.status === 'InProgress' ? 'inProgress' : 'done',
            milestoneId: task.milestone?.id || null,
            milestoneName: task.milestone?.name || 'No Milestone',
            createdAt: task.createdAt,
            progress: parseInt(task.process) || 0,
            attachments: task.attachments || [],
            comments: task.comments || [],
            history: task.history || []
          }});

        setAllTasks(mappedTasks);
        setIsSearched(true);
        
        // Hiển thị thông báo nếu không có task
        if (mappedTasks.length === 0) {
          alert('Không có task nào');
        }
      } else {
        console.error('Error fetching tasks:', response.data.message);
        alert(`Lỗi: ${response.data.message}`);
        setAllTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert(`Lỗi kết nối: ${error.message}`);
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setMilestoneFilter('');
    setAssigneeFilter('');
    setPriorityFilter('');
    setStatusFilter('');
    setMyTasksOnly(false);
    setAllTasks([]);
    setIsSearched(false);
  };

  const createNewTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.assignee || !newTask.priority) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const selectedMilestone = milestones.find(m => m.id.toString() === newTask.milestoneId);
      const selectedAssignee = assigneeOptions.find(a => a.value === newTask.assignee);
     
      // Gọi API tạo task
      const taskData = {
        groupId: parseInt(groupId) || 1,
        name: newTask.title,
        description: newTask.description,
        endAt: newTask.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ToDo',
        priority: newTask.priority === 'high' ? 'High' : 
                 newTask.priority === 'medium' ? 'Medium' : 'Low',
        process: '0',
        milestoneId: newTask.milestoneId ? parseInt(newTask.milestoneId) : null,
        assignedUserId: newTask.assignee ? parseInt(newTask.assignee) : null
      };
      // console.log("taskData", taskData);
      const response = await axiosClient.post('/Student/Task/create', taskData);
      
      if (response.data.status === 200) {
        // Tạo task object mới với thông tin từ API response
        const createdTask = response.data.data;
        const task = {
          id: createdTask.id,
          title: createdTask.title || newTask.title,
          description: createdTask.description || newTask.description,
          assignee: createdTask.assigneeId, // ID của student được assign
          assigneeName: createdTask.assigneeName || selectedAssignee?.label || 'Unknown',
          deadline: createdTask.deadline || newTask.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: createdTask.priority?.toLowerCase() || newTask.priority,
          status: createdTask.status === 'ToDo' ? 'todo' : 
                 createdTask.status === 'InProgress' ? 'inProgress' : 'done',
          milestoneId: createdTask.milestoneId || (newTask.milestoneId ? parseInt(newTask.milestoneId) : null),
          milestoneName: createdTask.milestoneName || selectedMilestone?.name || 'No Milestone',
          createdAt: createdTask.createdAt || new Date().toISOString(),
          progress: parseInt(createdTask.process) || 0,
          attachments: createdTask.attachments || [],
          comments: createdTask.comments || []
        };

        setTasks(prev => [task, ...prev]);

        setNewTask({
          title: '',
          description: '',
          assignee: '',
          priority: 'medium',
          milestoneId: '',
          deadline: ''
        });
        setTaskModal(false);
        alert('Task created successfully!');
      } else {
        console.error('Error creating task:', response.data.message);
        alert(`Lỗi tạo task: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Lỗi tạo task: ${error.message}`);
    }
  };

  const moveTask = async (taskId, fromStatus, toStatus) => {
    try {
      // Tìm task hiện tại
      const currentTask = allTasks.find(task => task.id === taskId);
      if (!currentTask) return;

      // Map status từ frontend sang backend
      const backendStatus = toStatus === 'todo' ? 'ToDo' : 
                           toStatus === 'inProgress' ? 'InProgress' : 'Done';
      
      // Map priority từ frontend sang backend
      const backendPriority = currentTask.priority === 'high' ? 'High' : 
                             currentTask.priority === 'medium' ? 'Medium' : 'Low';

      // Gọi API update task theo cấu trúc mới
      const updateData = {
        id: parseInt(taskId),
        name: currentTask.title,
        description: currentTask.description,
        endAt: currentTask.deadline,
        statusId: backendStatus, // Sử dụng statusId thay vì status
        priorityId: backendPriority, // Sử dụng priorityId thay vì priority
        process: toStatus === 'done' ? '100' : currentTask.progress.toString(),
        milestoneId: currentTask.milestoneId || 0,
        assignedUserId: currentTask.assignee || 0
      };
      console.log("updateData", updateData);
      const response = await axiosClient.post('/Student/Task/update', updateData);
      
      if (response.data.status === 200) {
        const nowIso = new Date().toISOString();
        
        // Cập nhật state
        setAllTasks(prev => {
          return prev.map(task => {
            if (task.id === taskId) {
              const next = {
                ...task,
                status: toStatus,
                ...(toStatus === 'done' && { 
                  completedAt: nowIso,
                  progress: 100 
                }),
              };
              const nextHistory = Array.isArray(task.history) ? task.history.slice() : [];
              nextHistory.push({ id: Date.now(), type: 'status', detail: `Moved to ${toStatus}`, at: nowIso });
              next.history = nextHistory;
              return next;
            }
            return task;
          });
        });
        
        alert(`Task moved to ${toStatus}!`);
      } else {
        console.error('Error updating task:', response.data.message);
        alert(`Lỗi cập nhật task: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert(`Lỗi kết nối cập nhật task: ${error.message}`);
    }
  };

  const addCommentToTask = async () => {
    if (!selectedTask || !newComment.trim()) return;
    
    try {
      // Gọi API create comment
      const commentData = {
        entityName: "Task",
        entityId: selectedTask.id,
        content: newComment.trim(),
        groupId: parseInt(groupId) || 1,
        author: `HE${currentUser.id}`, // Lấy từ localStorage
        authorName: currentUser.name // Lấy từ localStorage
      };

      const response = await axiosClient.post('/Student/Comment/create', commentData);
      
      if (response.data.status === 200) {
        const nowIso = new Date().toISOString();
        
        // Cập nhật state
        setTasks(prev => prev.map(t => {
          if (t.id !== selectedTask.id) return t;
          const next = { ...t };
          const nextComments = Array.isArray(next.comments) ? next.comments.slice() : [];
          nextComments.push({ 
            id: Date.now(), 
            author: commentData.author, 
            authorName: commentData.authorName,
            content: newComment.trim(), 
            timestamp: nowIso 
          });
          next.comments = nextComments;
          const nextHistory = Array.isArray(next.history) ? next.history.slice() : [];
          nextHistory.push({ id: Date.now() + 1, type: 'comment', detail: 'Added a comment', at: nowIso });
          next.history = nextHistory;
          return next;
        }));
        
        setSelectedTask(prev => {
          if (!prev) return prev;
          const next = { ...prev };
          next.comments = [...(prev.comments || []), { 
            id: Date.now(), 
            author: commentData.author, 
            authorName: commentData.authorName,
            content: newComment.trim(), 
            timestamp: nowIso 
          }];
          next.history = [...(prev.history || []), { id: Date.now() + 2, type: 'comment', detail: 'Added a comment', at: nowIso }];
          return next;
        });
        
        setNewComment('');
      } else {
        console.error('Error creating comment:', response.data.message);
        alert(`Lỗi tạo comment: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert(`Lỗi kết nối tạo comment: ${error.message}`);
    }
  };

  const addAttachmentToTask = async () => {
    if (!selectedTask || !newAttachment.trim()) return;
    
    try {
      // Giả sử có API upload attachment
      // const formData = new FormData();
      // formData.append('file', newAttachment);
      // formData.append('taskId', selectedTask.id);
      // formData.append('groupId', groupId);
      // const response = await axiosClient.post('/Student/Task/upload-attachment', formData);
      
      // Tạm thời xử lý local vì chưa có API upload attachment
      const nowIso = new Date().toISOString();
      
      setTasks(prev => prev.map(t => {
        if (t.id !== selectedTask.id) return t;
        const next = { ...t };
        const nextAttachments = Array.isArray(next.attachments) ? next.attachments.slice() : [];
        nextAttachments.push(newAttachment.trim());
        next.attachments = nextAttachments;
        const nextHistory = Array.isArray(next.history) ? next.history.slice() : [];
        nextHistory.push({ id: Date.now(), type: 'attachment', detail: `Attached ${newAttachment.trim()}`, at: nowIso });
        next.history = nextHistory;
        return next;
      }));
      
      setSelectedTask(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        next.attachments = [...(prev.attachments || []), newAttachment.trim()];
        next.history = [...(prev.history || []), { id: Date.now() + 3, type: 'attachment', detail: `Attached ${newAttachment.trim()}`, at: nowIso }];
        return next;
      });
      
      setNewAttachment('');
    } catch (error) {
      console.error('Error uploading attachment:', error);
      alert(`Lỗi upload attachment: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading tasks...</div>
      </div>
    );
  }

  // Filter tasks dựa trên các filter states
  const filteredTasks = allTasks.filter(task => {
     console.log("taska", task.assignee);
     console.log("assigneeFilter", assigneeFilter);
    const milestoneMatch = milestoneFilter === '' || task.milestoneId.toString() === milestoneFilter;
    const assigneeMatch = assigneeFilter === '' || task.assignee.toString() === assigneeFilter;
    const statusMatch = statusFilter === '' || task.status === statusFilter;
    const priorityMatch = priorityFilter === '' || task.priority === priorityFilter;
    const myTasksMatch = !myTasksOnly || (currentUser && task.assignee === currentUser.id);
    return milestoneMatch && assigneeMatch && statusMatch && priorityMatch && myTasksMatch;
  });

  const milestoneOptions = milestones.map(m => ({ value: m.id.toString(), label: m.name }));
  const assigneeOptions = assigneeSource.map(s => {
    return { value: s.id, label: s.name }
  });

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
            <select
              value={milestoneFilter}
              onChange={(e) => setMilestoneFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              {milestoneOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label>Assignee:</label>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              {assigneeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              <option value="todo">To Do</option>
              <option value="inProgress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label>
              <input
                type="checkbox"
                checked={myTasksOnly}
                onChange={(e) => setMyTasksOnly(e.target.checked)}
                className={styles.checkbox}
              />
              Task của tôi
            </label>
          </div>
          <button
            className={styles.searchButton}
            onClick={handleSearch}
          >
            Tìm kiếm
          </button>
          <button
            className={styles.resetButton}
            onClick={handleResetFilters}
          >
            Reset
          </button>
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

      {/* Empty state khi không có task */}
      {filteredTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>Chọn bộ lọc và nhấn 'Tìm kiếm' để xem tasks</div>
          <button className={styles.searchButton} onClick={handleSearch}>Tìm kiếm</button>
        </div>
      ) : viewMode === 'list' ? (
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
                
                <div className={styles.taskMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Created:</span>
                    <span>{formatDate(task.createdAt)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Attachments:</span>
                    <span>{task.attachments.length} files</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Comments:</span>
                    <span>{task.comments.length}</span>
                  </div>
                </div>
                
                <div className={styles.taskActions}>
                  <button 
                    className={`${styles.actionButton} ${styles.primary}`}
                    onClick={() => openTaskDetail(task)}
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.kanbanBoard}>
          <div className={`${styles.column} ${styles.todo}`}>
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

          <div className={`${styles.column} ${styles.inProgress}`}>
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
                      <span className={`${styles.priority} ${styles[priorityInfo.text.toLowerCase()]}`}>
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

          <div className={`${styles.column} ${styles.done}`}>
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
                      <span className={`${styles.priority} ${styles[priorityInfo.text.toLowerCase()]}`}>
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
            <label>
              Task Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="Enter task title"
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>
              Description <span className={styles.required}>*</span>
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="Enter task description"
              className={styles.textarea}
              rows={3}
            />
            <div className={styles.hintText}>Mô tả ngắn gọn công việc cần làm.</div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>
                Milestone
              </label>
              <select
                className={styles.select}
                value={newTask.milestoneId}
                onChange={(e) => setNewTask({ ...newTask, milestoneId: e.target.value })}
              >
                <option value="">Select Milestone</option>
                {milestoneOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>
                Assignee <span className={styles.required}>*</span>
              </label>
              <select
                className={styles.select}
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
              >
                <option value="">Select Assignee</option>
                {assigneeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>
                Priority <span className={styles.required}>*</span>
              </label>
              <select
                className={styles.select}
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="">Select Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
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