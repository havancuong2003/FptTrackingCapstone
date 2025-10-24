import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import DataTable from '../../../components/DataTable/DataTable';
import axiosClient from '../../../utils/axiosClient';
import { sendTaskNotification } from '../../../api/email';

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
      return null; // Error parse
    }
  };
  
  const currentUser = getCurrentUser();
  const [tasks, setTasks] = React.useState([]);
  const [deliverables, setDeliverables] = React.useState([]);
  const [meetings, setMeetings] = React.useState([]);
  const [reviewers, setReviewers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [taskModal, setTaskModal] = React.useState(false);
  const [newTask, setNewTask] = React.useState({
    title: '',
    description: '',
    assignee: '',
    priority: '',
    deliverableId: '',
    meetingId: '',
    taskType: 'throughout', // 'throughout' or 'meeting'
    deadline: '',
    reviewer: ''
  });
  
  // States cho comment và attachment
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [newComment, setNewComment] = React.useState('');
  const [newAttachment, setNewAttachment] = React.useState('');

  // Status search-on-click
  const [isSearched, setIsSearched] = React.useState(false);
  
  // Tất cả tasks (load khi bấm tìm kiếm)
  const [allTasks, setAllTasks] = React.useState([]);
  
  // Filter states riêng biệt
  const [deliverableFilter, setDeliverableFilter] = React.useState('');
  const [assigneeFilter, setAssigneeFilter] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [taskTypeFilter, setTaskTypeFilter] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('active'); // 'all', 'active', 'inactive'
  const [myTasksOnly, setMyTasksOnly] = React.useState(true);
  const [viewType, setViewType] = React.useState('my_tasks'); // 'my_tasks', 'project_view', 'all_tasks', 'meeting_decisions'
  // API: lấy deliverables theo group
  const fetchDeliverablesByGroup = async (gid) => {
    try {
      const response = await axiosClient.get(`/deliverables/getByGroupId/${gid}`);
      
      if (response.data.status === 200) {
        // Kiểm tra data có tồn tại và không null/undefined
        const apiData = response.data.data;
        const deliverablesData = Array.isArray(apiData) ? apiData : [];
        
        // Map data từ API response sang format frontend
        return deliverablesData.map(deliverable => ({
          id: deliverable.id,
          name: deliverable.name,
          groupId: gid,
          description: deliverable.description,
          deadline: deliverable.deadline
        }));
      } else {
        console.error('Error fetching deliverables:', response.data.message);
        alert(`Error lấy deliverables: ${response.data.message}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching deliverables:', error);
      alert(`Error kết nối deliverables: ${error.message}`);
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
        alert(`Error lấy danh sách students: ${response.data.message}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      alert(`Error kết nối lấy students: ${error.message}`);
      return [];
    }
  };

  // API: lấy reviewers (supervisors + students) từ group
  const fetchReviewers = async (gid) => {
    try {
      const response = await axiosClient.get(`/Staff/capstone-groups/${gid}`);
      
      if (response.data.status === 200) {
        const groupData = response.data.data;
        const reviewersList = [];
        
        // Add supervisors
        if (groupData.supervisorsInfor && Array.isArray(groupData.supervisorsInfor)) {
          groupData.supervisorsInfor.forEach(supervisor => {
            reviewersList.push({
              id: `${supervisor.id}`,
              name: supervisor.name,
              email: supervisor.email,
              type: 'Supervisor'
            });
          });
        }
        
        // Add students
        if (groupData.students && Array.isArray(groupData.students)) {
          groupData.students.forEach(student => {
            reviewersList.push({
              id: `${student.id}`,
              name: student.name,
              email: student.email,
              type: 'Student',
              role: student.role
            });
          });
        }
        
        return reviewersList;
      } else {
        console.error('Error fetching reviewers:', response.data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching reviewers:', error);
      return [];
    }
  };

  // API: lấy meetings đã họp để tạo meeting tasks
  // TODO: API này chưa có, tạm thời mock data
  const fetchCompletedMeetings = async (gid) => {
    try {
      // Mock data cho meetings đã hoàn thành
      const mockMeetings = [
        {
          id: 1,
          description: "Meeting tuần 1 - Review tiến độ dự án",
          meetingDate: "2024-01-15",
          startTime: "09:00:00",
          endTime: "11:00:00"
        },
        {
          id: 2,
          description: "Meeting tuần 2 - Demo prototype",
          meetingDate: "2024-01-22",
          startTime: "14:00:00",
          endTime: "16:00:00"
        },
        {
          id: 3,
          description: "Meeting tuần 3 - Code review",
          meetingDate: "2024-01-29",
          startTime: "10:00:00",
          endTime: "12:00:00"
        },
        {
          id: 4,
          description: "Meeting tuần 4 - Testing và bug fix",
          meetingDate: "2024-02-05",
          startTime: "15:00:00",
          endTime: "17:00:00"
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return mockMeetings;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/Student/Task/get-by-group/${groupId}`);
      if (response.data.status === 200) {
        const apiData = response.data.data;
        const tasksData = Array.isArray(apiData) ? apiData : [];
          console.log("tasksData", tasksData);
        const mappedTasks = tasksData.map(task => ({
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
          deliverableId: task.deliverable?.id || null,
          deliverableName: task.deliverable?.name || 'No Deliverable',
          createdAt: task.createdAt,
          progress: parseInt(task.process) || 0,
          attachments: task.attachments || [],
          comments: task.comments || [],
          history: task.history || [],
          isActive: task.isActive !== undefined ? task.isActive : true // Thêm trường isActive từ API
        }));

        setAllTasks(mappedTasks);
        setIsSearched(true);
      } else {
        setAllTasks([]);
      }
    } catch (error) {
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const bootstrapFilters = async () => {
      try {
        setLoading(true);
        // Load dữ liệu filter trước (deliverables/students/meetings/reviewers theo group)
        const [deliverableRes, studentRes, meetingRes, reviewerRes] = await Promise.all([
          fetchDeliverablesByGroup(groupId),
          fetchStudentsByGroup(groupId),
          fetchCompletedMeetings(groupId),
          fetchReviewers(groupId),
        ]);
        const deliverablesData = deliverableRes;
        const students = studentRes;
        const meetings = meetingRes;
        const reviewers = reviewerRes;
        setDeliverables(deliverablesData);
        setMeetings(meetings);
        setReviewers(reviewers);
        // Tự động load issues khi vào trang
        await fetchTasks();
        // Save danh sách assignee từ API students
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const columns = [
    {
      key: 'title',
      title: 'Task',
      render: (task) => (
        <div>
          <div className={styles.taskTitle}>
            {task.title}
            {task.hasDependencies && (
              <span className={styles.dependencyIcon} title="Có phụ thuộc">
                🔗
              </span>
            )}
          </div>
          <div className={styles.taskType}>
            <span className={`${styles.taskTypeBadge} ${styles[task.isMeetingTask ? 'meeting' : 'deliverable']}`}>
              {task.isMeetingTask ? 'Meeting' : 'Deliverable'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'assignee',
      title: 'Assignee',
      render: (task) => task.assigneeName
    },
    {
      key: 'deliverable',
      title: 'Deliverable',
      render: (task) => task.deliverableName
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
              openTaskDetail(task);
            }}
          >
            Details
          </Button>
          {task.status === 'todo' && (
            <Button 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                moveTask(task.id, 'todo', 'inProgress');
              }}
            >
              Start
            </Button>
          )}
          {task.status === 'inProgress' && (
            <Button 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                moveTask(task.id, 'inProgress', 'done');
              }}
            >
              Complete
            </Button>
          )}
        </div>
      )
    }
  ];

  const openTaskDetail = (task) => {
    const url = `/student/task-detail/${groupId}?taskId=${task.id}`;
    navigate(url);
  };

  // Refresh issues
  const handleRefresh = async () => {
    await fetchTasks();
  };


  const createNewTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.assignee || !newTask.priority) {
      alert('Please fill in all required fields');
      return;
    }

    // Validation cho deadline không được trước thời gian hiện tại
    if (newTask.deadline) {
      const deadlineDate = new Date(newTask.deadline);
      const currentDate = new Date();
      if (deadlineDate <= currentDate) {
        alert('Deadline must be after current time');
        return;
      }
    }

    // Validation cho meeting task
    if (newTask.taskType === 'meeting' && !newTask.meetingId) {
      alert('Please select a meeting for meeting task');
      return;
    }

    // Validation logic: isMeetingTask và meetingId phải đi đôi
    if (newTask.taskType === 'meeting') {
      if (!newTask.meetingId) {
        alert('Meeting Task phải có meetingId');
        return;
      }
    } else {
      // Throughout Task không được có meetingId
      if (newTask.meetingId) {
        alert('Throughout Task không được có meetingId');
        return;
      }
    }
    
    // Deliverable có thể có cho cả 2 loại task (tùy chọn)

    try {
      const selectedDeliverable = deliverables.find(d => d.id.toString() === newTask.deliverableId);
        const selectedAssignee = assigneeOptions.find(a => 
        {
          console.log("a", a);
          console.log("newTask.assignee", parseInt(newTask.assignee));
          return a.value.toString() === newTask.assignee.toString();
        });
        const selectedReviewer = reviewers.find(r =>
          {
            console.log("r", r);
            console.log("newTask.reviewer", parseInt(newTask.reviewer));
            return r.id.toString() === newTask.reviewer.toString();
          }
        );
        console.log("selectedAssignee", selectedAssignee);
        console.log("selectedReviewer", selectedReviewer);
      
      // Gửi email thông báo trước khi tạo task
      try {
        const emailRecipients = [];
        
        // Thêm email của assignee từ assigneeOptions
        if (selectedAssignee?.email) {
          emailRecipients.push(selectedAssignee.email);
        }
        
        // Thêm email của reviewer từ reviewers
        if (selectedReviewer?.email) {
          emailRecipients.push(selectedReviewer.email);
        }
        console.log("emailRecipients", emailRecipients);
        
        if (emailRecipients.length > 0) {
          await sendTaskNotification({
            recipients: emailRecipients,
            subject: `[Capstone Project] Task mới được tạo: ${newTask.title}`,
            taskName: newTask.title,
            deadline: new Date(newTask.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toLocaleDateString('vi-VN'),
            description: newTask.description
          });
          
        } else {
          console.log('No email recipients found');
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Không hiển thị lỗi email cho user, chỉ log
      }
      
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
        deliverableId: newTask.deliverableId ? parseInt(newTask.deliverableId) : null,
        meetingId: newTask.meetingId ? parseInt(newTask.meetingId) : null,
        taskType: newTask.taskType,
        assignedUserId: newTask.assignee ? parseInt(newTask.assignee) : null,
        reviewerId: selectedReviewer ? parseInt(selectedReviewer.id) : null,
        reviewerName: selectedReviewer ? selectedReviewer.name : null
      };

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
          deliverableId: createdTask.deliverableId || (newTask.deliverableId ? parseInt(newTask.deliverableId) : null),
          deliverableName: createdTask.deliverableName || selectedDeliverable?.name || 'No Deliverable',
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
          priority: 'low',
          deliverableId: '',
          meetingId: '',
          taskType: 'throughout',
          deadline: '',
          reviewer: ''
        });
        setTaskModal(false);
        alert('Task created successfully!');
      } else {
        console.error('Error creating task:', response.data.message);
        alert(`Error tạo task: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Error tạo task: ${error.message}`);
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
        deliverableId: currentTask.deliverableId || 0,
        assignedUserId: currentTask.assignee || 0
      };
      const response = await axiosClient.post('/Student/Task/update', updateData);
      
      if (response.data.status === 200) {
        const nowIso = new Date().toISOString();
        
        // Update state
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
        alert(`Error cập nhật task: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert(`Error kết nối cập nhật task: ${error.message}`);
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
        
        // Update state
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
        alert(`Error tạo comment: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert(`Error kết nối tạo comment: ${error.message}`);
    }
  };

  const addAttachmentToTask = async () => {
    if (!selectedTask || !newAttachment.trim()) return;
    
    try {

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
      alert(`Error upload attachment: ${error.message}`);
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
    const deliverableMatch = deliverableFilter === '' || (task.deliverableId && task.deliverableId.toString() === deliverableFilter);
    const assigneeMatch = assigneeFilter === '' || task.assignee.toString() === assigneeFilter;
    const statusMatch = statusFilter === '' || task.status === statusFilter;
    const priorityMatch = priorityFilter === '' || task.priority === priorityFilter;
    
    // Filter theo loại task dựa trên isMeetingTask
    let taskTypeMatch = true;
    if (taskTypeFilter === 'meeting') {
      taskTypeMatch = task.isMeetingTask === true;
    } else if (taskTypeFilter === 'throughout') {
      taskTypeMatch = task.isMeetingTask !== true;
    }
    
    const myTasksMatch = !myTasksOnly || (currentUser && task.assignee === currentUser.id);
    // Filter theo trạng thái active
    let activeTaskMatch = true;
    if (activeFilter === 'active') {
      activeTaskMatch = task.isActive === true;
    } else if (activeFilter === 'inactive') {
      activeTaskMatch = task.isActive === false;
    }
    // Nếu activeFilter === 'all' thì activeTaskMatch = true (hiển thị tất cả)
    return deliverableMatch && assigneeMatch && statusMatch && priorityMatch && taskTypeMatch && myTasksMatch && activeTaskMatch;
  });

  const deliverableOptions = deliverables.map(d => ({ value: d.id ? d.id.toString() : '', label: d.name }));
  const assigneeOptions = assigneeSource.map(s => {
    return { value: s.id, label: s.name  , email: s.email}
  });
  const todoTasks = filteredTasks.filter(task => task.status === 'todo');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'inProgress');
  const doneTasks = filteredTasks.filter(task => task.status === 'done');
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Tasks</h1>
        <button 
          className={styles.createButton}
          onClick={() => setTaskModal(true)}
        >
           Create New Task
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
            <label>Deliverable:</label>
            <select
              value={deliverableFilter}
              onChange={(e) => setDeliverableFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              {deliverableOptions.map(option => (
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
            <label>Task Type:</label>
            <select
              value={taskTypeFilter}
              onChange={(e) => setTaskTypeFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">All</option>
              <option value="throughout">Throughout</option>
              <option value="meeting">Meeting</option>
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
          <div className={styles.controlGroup}>
            <label>Task Status:</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className={styles.select}
            >
              <option value="all">All Tasks</option>
              <option value="active">Active Tasks</option>
              <option value="inactive">Inactive Tasks</option>
            </select>
          </div>
          <button
            className={styles.searchButton}
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
      </div>


      {/* Empty state khi không có issue */}
      {filteredTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>No tasks found</div>
          <button className={styles.searchButton} onClick={handleRefresh}>Refresh</button>
        </div>
      ) : (
        <div className={styles.tasksTable}>
          <DataTable
            columns={columns}
            data={filteredTasks}
            loading={loading}
            emptyMessage="No tasks found"
            onRowClick={openTaskDetail}
            showIndex={true}
            indexTitle="No"
          />
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
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>
                Task Type <span className={styles.required}>*</span>
              </label>
              <select
                className={styles.select}
                value={newTask.taskType}
                onChange={(e) => {
                  const newTaskType = e.target.value;
                  if (newTaskType === 'throughout') {
                    // Chuyển từ meeting sang xuyên suốt: xóa meetingId, giữ deliverableId
                    setNewTask({ ...newTask, taskType: newTaskType, meetingId: '' });
                  } else {
                    // Chuyển từ xuyên suốt sang meeting: giữ deliverableId
                    setNewTask({ ...newTask, taskType: newTaskType });
                  }
                }}
              >
                <option value="throughout">Throughout Task</option>
                <option value="meeting">Meeting Task</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>
                Meeting
                {newTask.taskType === 'meeting' && <span className={styles.required}>*</span>}
              </label>
              {newTask.taskType === 'meeting' ? (
                <select
                  className={styles.select}
                  value={newTask.meetingId}
                  onChange={(e) => setNewTask({ ...newTask, meetingId: e.target.value })}
                >
                  <option value="">Select Meeting</option>
                  {meetings.map(meeting => (
                    <option key={meeting.id} value={meeting.id}>
                      {meeting.description} - {new Date(meeting.meetingDate).toLocaleDateString('en-US')}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  className={styles.select}
                  value=""
                  disabled
                >
                  <option value="">Not applicable for throughout task</option>
                </select>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label>
                Deliverable
              </label>
              <select
                className={styles.select}
                value={newTask.deliverableId}
                onChange={(e) => setNewTask({ ...newTask, deliverableId: e.target.value })}
              >
                <option value="">Select Deliverable (optional)</option>
                {deliverableOptions.map(option => (
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
            
            <div className={styles.formGroup}>
              <label>
                Reviewer
              </label>
              <select
                className={styles.select}
                value={newTask.reviewer}
                onChange={(e) => setNewTask({ ...newTask, reviewer: e.target.value })}
              >
                <option value="">Select Reviewer</option>
                {reviewers.map(reviewer => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.name} ({reviewer.type})
                  </option>
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