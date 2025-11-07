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
    priority: 'low', // Default priority là Low
    deliverableId: '',
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
  const [taskTypeFilter, setTaskTypeFilter] = React.useState('throughout'); // Mặc định Main Task
  const [activeFilter, setActiveFilter] = React.useState('active'); // 'all', 'active', 'inactive'
  const [myTasksOnly, setMyTasksOnly] = React.useState(true);
  const [deadlineFilter, setDeadlineFilter] = React.useState('');
  const [meetingFilter, setMeetingFilter] = React.useState('');
  const [viewType, setViewType] = React.useState('my_tasks'); // 'my_tasks', 'project_view', 'all_tasks', 'meeting_decisions'
  // API: lấy deliverables theo group (backend vẫn là deliverable, chỉ data trả về gọi là milestone)
  const fetchMilestonesByGroup = async (gid) => {
    try {
      //const response = await axiosClient.get(`/deliverables/getByGroupId/${gid}`);
      const response = await axiosClient.get(`/deliverables/group/${gid}`);
      
      if (response.data) {
        // Kiểm tra data có tồn tại và không null/undefined
        const apiData = response.data;
        const deliverablesData = Array.isArray(apiData) ? apiData : [];
        
        // Map data từ API response sang format frontend (vẫn gọi là milestone cho UI)
        return deliverablesData.map(deliverable => ({
          id: deliverable.id,
          name: deliverable.name,
          groupId: gid,
          description: deliverable.description,
          deadline: deliverable.deadline
        }));
      } else {
        console.error('Error fetching deliverables:', response.data.message);
    //    alert(`Error lấy deliverables: ${response.data.message}`);
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
        if (response.data.data && response.data.data.students) {
          const apiData = response.data.data.students;
          const studentsData = Array.isArray(apiData) ? apiData : [];
          return studentsData.map(student => ({
            id: student.id,
            name: student.name,
            studentId: student.studentId || student.id,
            email: student.email || ''
          }));
        }
        return [];
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
        
        // Kiểm tra groupData có tồn tại và không null/undefined
        if (!groupData) {
          return [];
        }
        
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
  const fetchCompletedMeetings = async (gid) => {
    try {
      const response = await axiosClient.get(`/Student/Meeting/group/${gid}/schedule-dates`);
      
      if (response.data.status === 200) {
        // Kiểm tra data có tồn tại và không null/undefined
        const apiData = response.data.data;
        const meetingsData = Array.isArray(apiData) ? apiData : [];
        
        // Chỉ lấy ra những meeting có isMeeting = true
        const filteredMeetings = meetingsData.filter(meeting => meeting.isMeeting === true);
        
        // Map data từ API response sang format frontend
        return filteredMeetings.map(meeting => ({
          id: meeting.id,
          description: meeting.description,
          meetingDate: meeting.meetingDate,
          startTime: meeting.time,
          endTime: meeting.time, // Sử dụng time làm endTime nếu không có endTime riêng
          meetingLink: meeting.meetingLink,
          dayOfWeek: meeting.dayOfWeek
        }));
      } else {
        console.error('Error fetching meetings:', response.data.message);
        alert(`Error lấy danh sách meetings: ${response.data.message}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      alert(`Error kết nối meetings: ${error.message}`);
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
        const mappedTasks = tasksData.map(task => {
          // Map status giống như TaskDetail.js - dùng toLowerCase() để so sánh
          const mappedStatus = task.status?.toLowerCase() === 'todo' ? 'todo' : 
                              task.status?.toLowerCase() === 'inprogress' ? 'inProgress' : 'done';
          
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            groupId: task.group?.id?.toString() || groupId || '1',
            assignee: task.assigneeId,
            assigneeName: task.assigneeName,
            deadline: task.deadline,
            priority: task.priority?.toLowerCase() || 'medium',
            status: mappedStatus,
            deliverableId: task.milestone?.id || null,
            deliverableName: task.milestone?.name || 'No Deliverable',
            createdAt: task.createdAt,
            progress: parseInt(task.process) || 0,
            attachments: task.attachments || [],
            comments: task.comments || [],
            history: task.history || [],
            isActive: task.isActive !== undefined ? task.isActive : true, // Thêm trường isActive từ API
            isMeetingTask: task.isMeetingTask || false, // Thêm trường isMeetingTask
            meetingId: task.meetingId || null, // Thêm trường meetingId
            reviewerId: task.reviewerId || null, // Thêm trường reviewerId
            reviewerName: task.reviewerName || 'No Reviewer' // Thêm trường reviewerName
          };
        });

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
        // Load dữ liệu filter trước (milestones/students/meetings/reviewers theo group)
        const [milestoneRes, studentRes, meetingRes, reviewerRes] = await Promise.all([
          fetchMilestonesByGroup(groupId),
          fetchStudentsByGroup(groupId),
          fetchCompletedMeetings(groupId),
          fetchReviewers(groupId),
        ]);
        const milestonesData = milestoneRes;
        const students = studentRes;
        const meetings = meetingRes;
        const reviewers = reviewerRes;
        setDeliverables(milestonesData); // Sử dụng milestones thay vì deliverables
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
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
            <span className={`${styles.taskTypeBadge} ${styles[task.isMeetingTask ? 'meeting' : 'throughout']}`}>
              {task.isMeetingTask ? 'Issue' : 'Main Task'}
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
      key: 'reviewer',
      title: 'Reviewer',
      render: (task) => {
        const reviewerName = task.reviewerName || 'No Reviewer';
        const isNoReviewer = !task.reviewerName || task.reviewerName === 'No Reviewer';
        return (
          <span style={{ 
            color: isNoReviewer ? '#9ca3af' : 'inherit',
            fontStyle: isNoReviewer ? 'italic' : 'normal'
          }}>
            {reviewerName}
          </span>
        );
      }
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
    if (!newTask.title || !newTask.description || !newTask.assignee || !newTask.priority || !newTask.deadline) {
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

    // Mặc định tất cả task đều là throughout task (Main Task)
    
    // Deliverable có thể có cho cả 2 loại task (tùy chọn)

    try {
      const selectedMilestone = deliverables.find(d => d.id.toString() === newTask.deliverableId);
        const selectedAssignee = assigneeOptions.find(a => 
        {

          return a.value.toString() === newTask.assignee.toString();
        });
        const selectedReviewer = reviewers.find(r =>
          {

            return r.id.toString() === newTask.reviewer.toString();
          }
        );

      
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
        
        if (emailRecipients.length > 0) {
          await sendTaskNotification({
            recipients: emailRecipients,
            subject: `[Capstone Project] Task mới được tạo: ${newTask.title}`,
            taskName: newTask.title,
            deadline: new Date(newTask.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toLocaleDateString('vi-VN'),
            description: newTask.description
          });
          
        } else {
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Không hiển thị lỗi email cho user, chỉ log
      }
      
      // Gọi API tạo task
      const taskData = {
        groupId: parseInt(groupId),
        name: newTask.title,
        description: newTask.description,
        endAt: newTask.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ToDo',
        priority: newTask.priority === 'high' ? 'High' : 
                 newTask.priority === 'medium' ? 'Medium' : 'Low',
        process: '0',
        deliverableId: newTask.deliverableId ? parseInt(newTask.deliverableId) : null, // Backend vẫn sử dụng deliverableId
        meetingId: null, // Mặc định không có meeting
        taskType: 'throughout', // Mặc định là throughout task
        assignedUserId: newTask.assignee ? parseInt(newTask.assignee) : null,
        reviewerId: selectedReviewer ? parseInt(selectedReviewer.id) : null,
        reviewerName: selectedReviewer ? selectedReviewer.name : null
      };  

      const response = await axiosClient.post('/Student/Task/create', taskData);
      if (response.data.status === 200) {
        const createdTaskId = response.data.data?.id;
        
        if (createdTaskId) {
          // Fetch lại task vừa tạo để có đầy đủ thông tin từ API
          try {
            const fetchResponse = await axiosClient.get(`/Student/Task/get-by-id/${createdTaskId}`);
            if (fetchResponse.data.status === 200) {
              const taskData = fetchResponse.data.data;
              
              // Map status giống như TaskDetail.js - dùng toLowerCase() để so sánh
              const mappedStatus = taskData.status?.toLowerCase() === 'todo' ? 'todo' : 
                                  taskData.status?.toLowerCase() === 'inprogress' ? 'inProgress' : 'done';
              
              // Map task object giống như fetchTasks
              const task = {
                id: taskData.id,
                title: taskData.title,
                description: taskData.description,
                groupId: taskData.group?.id?.toString() || groupId || '1',
                assignee: taskData.assigneeId,
                assigneeName: taskData.assigneeName,
                deadline: taskData.deadline,
                priority: taskData.priority?.toLowerCase() || 'medium',
                status: mappedStatus,
                deliverableId: taskData.milestone?.id || null,
                deliverableName: taskData.milestone?.name || 'No Deliverable',
                createdAt: taskData.createdAt,
                progress: parseInt(taskData.process) || 0,
                attachments: taskData.attachments || [],
                comments: taskData.comments || [],
                history: taskData.history || [],
                isActive: taskData.isActive !== undefined ? taskData.isActive : true,
                isMeetingTask: taskData.isMeetingTask || false,
                meetingId: taskData.meetingId || null,
                reviewerId: taskData.reviewerId || null,
                reviewerName: taskData.reviewerName || 'No Reviewer'
              };

              // Thêm task mới vào allTasks để hiển thị ngay lập tức
              setAllTasks(prev => [task, ...prev]);
              setTasks(prev => [task, ...prev]);
            }
          } catch (fetchError) {
            console.error('Error fetching created task:', fetchError);
            // Nếu không fetch được, vẫn thử tạo task object từ response ban đầu
            const createdTask = response.data.data;
            const mappedStatus = createdTask.status?.toLowerCase() === 'todo' ? 'todo' : 
                                createdTask.status?.toLowerCase() === 'inprogress' ? 'inProgress' : 'done';
            
            const task = {
              id: createdTask.id,
              title: createdTask.title || createdTask.name || newTask.title,
              description: createdTask.description || newTask.description,
              groupId: createdTask.groupId?.toString() || groupId || '1',
              assignee: createdTask.assigneeId || createdTask.assignedUserId || parseInt(newTask.assignee),
              assigneeName: createdTask.assigneeName || selectedAssignee?.label || 'Unknown',
              deadline: createdTask.deadline || createdTask.endAt || newTask.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              priority: createdTask.priority?.toLowerCase() || newTask.priority,
              status: mappedStatus,
              deliverableId: createdTask.deliverableId || createdTask.milestone?.id || (newTask.deliverableId ? parseInt(newTask.deliverableId) : null),
              deliverableName: createdTask.deliverableName || createdTask.milestone?.name || selectedMilestone?.name || 'No Deliverable',
              createdAt: createdTask.createdAt || new Date().toISOString(),
              progress: parseInt(createdTask.process) || 0,
              attachments: createdTask.attachments || [],
              comments: createdTask.comments || [],
              history: createdTask.history || [],
              isActive: createdTask.isActive !== undefined ? createdTask.isActive : true,
              isMeetingTask: createdTask.isMeetingTask || false,
              meetingId: createdTask.meetingId || null,
              reviewerId: createdTask.reviewerId || (selectedReviewer ? parseInt(selectedReviewer.id) : null),
              reviewerName: createdTask.reviewerName || (selectedReviewer ? selectedReviewer.name : 'No Reviewer')
            };
            
            setAllTasks(prev => [task, ...prev]);
            setTasks(prev => [task, ...prev]);
          }
        }

        setNewTask({
          title: '',
          description: '',
          assignee: '',
          priority: 'low', // Default priority là Low
          deliverableId: '',
          deadline: '',
          reviewer: ''
        });
        setTaskModal(false);
        alert('Task created successfully!');
      } else {
        console.error('Error creating task:', response.data.message);
        alert(`Error creating task: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Error creating task: ${error.message}`);
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
        groupId: parseInt(groupId) ,
        description: currentTask.description,
        endAt: currentTask.deadline,
        statusId: backendStatus, // Sử dụng statusId thay vì status
        priorityId: backendPriority, // Sử dụng priorityId thay vì priority
        process: toStatus === 'done' ? '100' : currentTask.progress.toString(),
        deliverableId: currentTask.deliverableId , // Backend vẫn sử dụng deliverableId
        meetingId: currentTask.meetingId ,
        assignedUserId: currentTask.assignee ,
        reviewerId: currentTask.reviewerId 
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
        taskId: parseInt(selectedTask.id),
        content: newComment.trim(),
        groupId: parseInt(groupId) ,

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
    
    // Filter theo deadline
    let deadlineMatch = true;
    if (deadlineFilter) {
      const taskDeadline = new Date(task.deadline);
      const filterDeadline = new Date(deadlineFilter);
      // Chuyển filterDeadline về cuối ngày để bao gồm cả ngày được chọn
      filterDeadline.setHours(23, 59, 59, 999);
      deadlineMatch = taskDeadline <= filterDeadline;
    }
    
    // Filter theo meeting
    let meetingMatch = true;
    if (meetingFilter) {
      meetingMatch = task.meetingId && task.meetingId.toString() === meetingFilter;
    }
    
    // Nếu activeFilter === 'all' thì activeTaskMatch = true (hiển thị tất cả)
    return deliverableMatch && assigneeMatch && statusMatch && priorityMatch && taskTypeMatch && myTasksMatch && activeTaskMatch && deadlineMatch && meetingMatch;
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
           {/* Nhóm 1: Filter cơ bản */}
           <div className={styles.controlGroup}>
             <label>Task Type:</label>
             <select
               value={taskTypeFilter}
               onChange={(e) => {
                 const newTaskType = e.target.value;
                 setTaskTypeFilter(newTaskType);
                 // Reset meeting filter khi chọn Main Task
                 if (newTaskType === 'throughout') {
                   setMeetingFilter('');
                 }
               }}
               className={styles.select}
             >
               <option value="">All</option>
               <option value="throughout">Main Task</option>
               <option value="meeting">Issue</option>
             </select>
           </div>
           {(taskTypeFilter === 'meeting' || taskTypeFilter === '') && (
             <div className={styles.controlGroup}>
               <label>Meeting:</label>
               <select
                 value={meetingFilter}
                 onChange={(e) => setMeetingFilter(e.target.value)}
                 className={styles.select}
               >
                 <option value="">All Meeting Issues</option>
                 {meetings.map(meeting => (
                   <option key={meeting.id} value={meeting.id}>
                     {meeting.description} - {new Date(meeting.meetingDate).toLocaleDateString('vi-VN')}
                   </option>
                 ))}
               </select>
             </div>
           )}
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
           
           {/* Nhóm 2: Filter theo người và dự án */}
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
           
           {/* Nhóm 3: Filter theo thời gian */}
           <div className={styles.controlGroup}>
             <label>Deadline:</label>
             <input
               type="date"
               value={deadlineFilter}
               onChange={(e) => setDeadlineFilter(e.target.value)}
               className={styles.input}
               placeholder="Filter by deadline"
             />
           </div>
           
           {/* Nhóm 4: Filter trạng thái */}
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
           
           {/* Nhóm 5: Actions */}
           <button
             className={styles.searchButton}
             onClick={handleRefresh}
           >
             Refresh
           </button>
           <button
             className={styles.resetButton}
             onClick={() => {
               setDeliverableFilter('');
               setAssigneeFilter('');
               setPriorityFilter('');
               setStatusFilter('');
               setTaskTypeFilter('throughout');
               setActiveFilter('active');
               setMyTasksOnly(true);
               setDeadlineFilter('');
               setMeetingFilter('');
             }}
           >
             Reset Filter
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>
                Deadline <span className={styles.required}>*</span>
              </label>
              <input
                type="datetime-local"
                value={newTask.deadline}
                onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                className={styles.input}
                required
              />
            </div>
          </div>
          
          <div className={styles.modalActions}>
            <button 
              className={`${styles.modalButton} ${styles.secondary}`}
              onClick={() => {
                // Kiểm tra xem có dữ liệu đã nhập không
                const hasData = newTask.title || newTask.description || newTask.assignee || 
                               newTask.deliverableId || newTask.deadline || newTask.reviewer;
                
                if (hasData) {
                  // Nếu có dữ liệu, hiển thị confirm dialog
                  const confirmCancel = window.confirm('Bạn có muốn hủy tạo task không? Tất cả thông tin đã nhập sẽ bị xóa.');
                  if (confirmCancel) {
                    // Clear toàn bộ data và đóng modal
                    setNewTask({
                      title: '',
                      description: '',
                      assignee: '',
                      priority: 'low', // Default priority là Low
                      deliverableId: '',
                      deadline: '',
                      reviewer: ''
                    });
                    setTaskModal(false);
                  }
                } else {
                  // Nếu không có dữ liệu, đóng modal luôn
                  setTaskModal(false);
                }
              }}
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