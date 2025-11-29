import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import DataTable from '../../../components/DataTable/DataTable';
import { sendTaskAssignmentEmail } from '../../../email/tasks';
import { getDeliverablesByGroup } from '../../../api/deliverables';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { getMeetingScheduleDatesByGroup } from '../../../api/meetings';
import { getTasksByGroup, getTaskById, createTask, createComment, uploadTaskAttachment } from '../../../api/tasks';
import { getUserInfo, getGroupId } from '../../../auth/auth';

export default function StudentTasks() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const groupId = query.get('groupId');
  
  // Get user info from localStorage
  const currentUser = getUserInfo();
  const [tasks, setTasks] = React.useState([]);
  const [deliverables, setDeliverables] = React.useState([]);
  const [meetings, setMeetings] = React.useState([]);
  const [reviewers, setReviewers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  // Check groupId from the start
  const hasValidGroupId = groupId !== null && groupId !== undefined && groupId !== '';
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
  
  // State cho file đính kèm khi tạo task
  const [createTaskFiles, setCreateTaskFiles] = React.useState([]);
  
  // Kiểm tra file có đúng định dạng được phép không
  const isValidFileType = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.split('.').pop().toLowerCase();
    const allowedExtensions = [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
      // PDF
      'pdf',
      // Archives
      'zip', '7z', 'rar'
    ];
    return allowedExtensions.includes(extension);
  };

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
  // API: Get deliverables by group
  const fetchMilestonesByGroup = async (gid) => {
    try {
      const response = await getDeliverablesByGroup(gid);
      const apiData = response?.data || response;
      const deliverablesData = Array.isArray(apiData) ? apiData : [];
      
      // Map data from API response to frontend format
      return deliverablesData.map(deliverable => ({
        id: deliverable.id,
        name: deliverable.name,
        groupId: gid,
        description: deliverable.description,
        deadline: deliverable.deadline
      }));
    } catch (error) {
      console.error('Error fetching deliverables:', error);
      return [];
    }
  };


  // API: Get group data (students, reviewers, group info) - gọi 1 lần duy nhất
  const fetchGroupData = async (gid) => {
    try {
      const response = await getCapstoneGroupDetail(gid);
      if (response.status === 200 && response.data) {
        const groupData = response.data;
        
        // Save group info
        setGroupInfo({
          id: groupData.id,
          name: groupData.groupCode || groupData.name || `Group ${gid}`,
          projectName: groupData.projectName || '',
          semesterName: groupData.semesterName || ''
        });
        
        // Get students (for assignee)
        const studentsData = Array.isArray(groupData.students) ? groupData.students : [];
        const students = studentsData.map(student => ({
          id: student.id,
          name: student.name,
          studentId: student.studentId || student.id,
          email: student.email || ''
        }));
        
        // Get reviewers (supervisors + students)
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
        
        // Add students as reviewers
        studentsData.forEach(student => {
          reviewersList.push({
            id: `${student.id}`,
            name: student.name,
            email: student.email,
            type: 'Student',
            role: student.role === "Student" ? 'Member' : (student.role || 'Member')
          });
        });
        
        return { students, reviewers: reviewersList };
      }
      return { students: [], reviewers: [] };
    } catch (error) {
      console.error('Error fetching group data:', error);
      return { students: [], reviewers: [] };
    }
  };

  // API: Get completed meetings to create meeting tasks
  const fetchCompletedMeetings = async (gid) => {
    try {
      const response = await getMeetingScheduleDatesByGroup(gid);
      
      if (response.status === 200) {
        const apiData = response.data;
        const meetingsData = Array.isArray(apiData) ? apiData : [];
        
        // Only get meetings with isMeeting = true
        const filteredMeetings = meetingsData.filter(meeting => meeting.isMeeting === true);
        
        // Map data from API response to frontend format
        return filteredMeetings.map(meeting => ({
          id: meeting.id,
          description: meeting.description,
          meetingDate: meeting.meetingDate,
          startTime: meeting.time,
          endTime: meeting.time,
          meetingLink: meeting.meetingLink,
          dayOfWeek: meeting.dayOfWeek
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasksByGroup(groupId);
      if (response.status === 200) {
        const apiData = response.data;
        const tasksData = Array.isArray(apiData) ? apiData : [];
        console.log('Tasks from API:', tasksData); // Debug: xem API có trả về reviewerId không
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
    // If no valid groupId, don't call API
    if (!hasValidGroupId) {
      setLoading(false);
      return;
    }

    const bootstrapFilters = async () => {
      try {
        setLoading(true);
        // Load dữ liệu filter trước (milestones/group data/meetings theo group)
        const [milestoneRes, groupDataRes, meetingRes] = await Promise.all([
          fetchMilestonesByGroup(groupId),
          fetchGroupData(groupId),
          fetchCompletedMeetings(groupId),
        ]);
        
        setDeliverables(milestoneRes);
        setMeetings(meetingRes);
        setReviewers(groupDataRes.reviewers);
        setAssigneeSource(groupDataRes.students);
        
        // Tự động load tasks khi vào trang
        await fetchTasks();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    bootstrapFilters();
  }, [groupId, hasValidGroupId]);

  // Assignee source from API by group
  const [assigneeSource, setAssigneeSource] = React.useState([]);
  
  // Group info from API
  const [groupInfo, setGroupInfo] = React.useState(null);

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

  // Check if task belongs to current user (as assignee or reviewer)
  const isMyTask = (task) => {
    if (!currentUser) return false;
    const isAssignee = task.assignee === currentUser.id || String(task.assignee) === String(currentUser.id);
    const isReviewer = task.reviewerId === currentUser.id || String(task.reviewerId) === String(currentUser.id);
    return isAssignee || isReviewer;
  };

  const columns = [
    {
      key: 'title',
      title: 'Task',
      render: (task) => (
        <div className={isMyTask(task) ? styles.myTaskCell : ''}>
          <div className={styles.taskTitle}>
            <span
              className={styles.taskTitleLink}
              onClick={(e) => {
                e.stopPropagation();
                openTaskDetail(task);
              }}
            >
              {task.title}
            </span>
            {isMyTask(task) && (
              <span className={styles.myTaskIndicator} title="Task của tôi">
                ★
              </span>
            )}
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
      key: 'isActive',
      title: 'Active',
      render: (task) => (
        <span 
          className={styles.statusBadge}
          style={{ 
            color: task.isActive ? '#059669' : '#dc2626',
            backgroundColor: task.isActive ? '#d1fae5' : '#fee2e2'
          }}
        >
          {task.isActive ? 'Active' : 'Inactive'}
        </span>
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

      
      // Send email notification before creating task
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
        deliverableId: newTask.deliverableId ? parseInt(newTask.deliverableId) : null, // Backend still uses deliverableId
        meetingId: null, // Default no meeting
        taskType: 'throughout', // Default is throughout task
        assignedUserId: newTask.assignee ? parseInt(newTask.assignee) : null,
        reviewerId: selectedReviewer ? parseInt(selectedReviewer.id) : null,
        reviewerName: selectedReviewer ? selectedReviewer.name : null
      };  

      const response = await createTask(taskData);
      if (response.status === 200) {
        const createdTaskId = response.data?.id;
        
        // Upload files nếu có
        if (createdTaskId && createTaskFiles.length > 0) {
          const semester = groupInfo?.semesterName || '';
          try {
            for (const file of createTaskFiles) {
              await uploadTaskAttachment(groupId, createdTaskId, semester, file);
            }
          } catch (uploadError) {
            console.error('Error uploading files:', uploadError);
            // Không block việc tạo task nếu upload fail
          }
        }
        
        // Send email to assignee after successfully creating task
        if (selectedAssignee?.email && createdTaskId) {
          try {
            await sendTaskAssignmentEmail({
              recipientEmail: selectedAssignee.email,
              recipientName: selectedAssignee.label,
              taskTitle: newTask.title,
              taskDescription: newTask.description,
              deadline: newTask.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              priority: newTask.priority === 'high' ? 'High' : newTask.priority === 'medium' ? 'Medium' : 'Low',
              assignerName: currentUser?.name || 'Creator',
              groupName: groupInfo?.name,
              groupId: String(groupId),
              taskId: String(createdTaskId),
              recipientRole: 'student',
              systemUrl: window.location.origin
            });
          } catch (emailError) {
            console.error('Error sending task assignment email:', emailError);
          }
        }
        
        // Send email to reviewer if selected (reviewer can be student or supervisor)
        if (selectedReviewer?.email && createdTaskId) {
          try {
            const reviewerRole = selectedReviewer.type === 'Supervisor' ? 'supervisor' : 'student';
            await sendTaskAssignmentEmail({
              recipientEmail: selectedReviewer.email,
              recipientName: selectedReviewer.name || selectedReviewer.label,
              taskTitle: newTask.title,
              taskDescription: newTask.description,
              deadline: newTask.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              priority: newTask.priority === 'high' ? 'High' : newTask.priority === 'medium' ? 'Medium' : 'Low',
              assignerName: currentUser?.name || 'Creator',
              groupName: groupInfo?.name,
              groupId: String(groupId),
              taskId: String(createdTaskId),
              recipientRole: reviewerRole,
              systemUrl: window.location.origin
            });
          } catch (emailError) {
            console.error('Error sending reviewer assignment email:', emailError);
          }
        }
        
        if (createdTaskId) {
          // Fetch the created task again to get full information from API
          try {
            const fetchResponse = await getTaskById(createdTaskId);
            if (fetchResponse.status === 200) {
              const taskData = fetchResponse.data;
              
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
            // If cannot fetch, still try to create task object from initial response
            const createdTask = response.data;
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
        setCreateTaskFiles([]);
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

  const addCommentToTask = async () => {
    if (!selectedTask || !newComment.trim()) return;
    
    try {
      // Gọi API create comment
      const commentData = {
        taskId: parseInt(selectedTask.id),
        content: newComment.trim(),
        groupId: parseInt(groupId) ,

      };

      const response = await createComment(commentData);
      
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
      alert(`Error creating comment: ${error.message}`);
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

  // If no valid groupId, show message
  if (!hasValidGroupId) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>You are not in any group</div>
          <div className={styles.emptyMessage}>Please contact the supervisor to be added to a group.</div>
        </div>
      </div>
    );
  }

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
    
    // Filter task của tôi: hiển thị task mà user là assignee HOẶC reviewer
    const isAssignee = task.assignee === currentUser?.id || String(task.assignee) === String(currentUser?.id);
    const isReviewer = task.reviewerId === currentUser?.id || String(task.reviewerId) === String(currentUser?.id);
    const myTasksMatch = !myTasksOnly || (currentUser && (isAssignee || isReviewer));
    
    // Debug log để kiểm tra
    if (myTasksOnly && task.reviewerId && !isAssignee) {
      console.log('Task reviewer check:', { 
        taskId: task.id, 
        reviewerId: task.reviewerId, 
        currentUserId: currentUser?.id,
        isReviewer 
      });
    }
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
           {/* Group 1: Basic filters */}
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
           
           {/* Group 2: Filters by person and project */}
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
           
           {/* Group 3: Time filters */}
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
           
           {/* Group 4: Status filters */}
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
              Task của tôi (Assignee/Reviewer)
            </label>
          </div>
           
           {/* Group 5: Actions */}
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


      {/* Empty state when no issues */}
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
          
          {/* File Attachment Section */}
          <div className={styles.formGroup}>
            <label>Attachments</label>
            <div className={styles.fileUploadSection}>
              <input
                type="file"
                id="create-task-file-input"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,.pdf,.zip,.7z,.rar"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const validFiles = [];
                  const invalidFiles = [];
                  
                  files.forEach(file => {
                    if (isValidFileType(file.name)) {
                      validFiles.push(file);
                    } else {
                      invalidFiles.push(file.name);
                    }
                  });
                  
                  if (invalidFiles.length > 0) {
                    alert(`Invalid file type: ${invalidFiles.join(', ')}\nOnly images (JPG, PNG, GIF...), PDF, ZIP, 7Z, RAR are allowed.`);
                  }
                  
                  if (validFiles.length > 0) {
                    setCreateTaskFiles(prev => [...prev, ...validFiles]);
                  }
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="create-task-file-input"
                className={styles.fileUploadLabel}
              >
                + Add Files
              </label>
              <span className={styles.fileTypeHint}>
                Allowed: Images, PDF, ZIP, 7Z, RAR
              </span>
              {createTaskFiles.length > 0 && (
                <div className={styles.selectedFilesList}>
                  {createTaskFiles.map((file, index) => (
                    <div key={index} className={styles.selectedFileItem}>
                      <span className={styles.fileName}>{file.name}</span>
                      <button
                        type="button"
                        className={styles.removeFileBtn}
                        onClick={() => {
                          setCreateTaskFiles(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.modalActions}>
            <button 
              className={`${styles.modalButton} ${styles.secondary}`}
              onClick={() => {
                // Check if there is entered data
                const hasData = newTask.title || newTask.description || newTask.assignee || 
                               newTask.deliverableId || newTask.deadline || newTask.reviewer || 
                               createTaskFiles.length > 0;
                
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
                    setCreateTaskFiles([]);
                    setTaskModal(false);
                  }
                } else {
                  // If no data, close modal immediately
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