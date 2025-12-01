import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './TaskDetail.module.scss';
import Button from '../../../components/Button/Button';
import BackButton from '../../common/BackButton';
import axiosClient from '../../../utils/axiosClient';
import { deleteTask } from '../../../api/tasks';
import { sendTaskAssignmentEmail, sendTaskStatusUpdateEmail, sendTaskDeletedEmail } from '../../../email/tasks';
import { getUserInfo } from '../../../auth/auth';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import useTaskPermissions from '../../../hooks/useTaskPermissions';
import TaskPermissionNotice from '../../../components/TaskPermissions/TaskPermissionNotice';
import UnsavedChangesPrompt from '../../../components/UnsavedChangesPrompt/UnsavedChangesPrompt';

export default function TaskDetail() {
  const { groupId } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const taskId = query.get('taskId');
  const navigate = useNavigate();
  
  // Lấy thông tin user từ localStorage và getUserInfo
  const getCurrentUser = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      const userInfo = getUserInfo();
      
      // Merge thông tin từ cả hai nguồn
      const parsedAuth = authUser ? JSON.parse(authUser) : {};
      return {
        ...parsedAuth,
        ...userInfo,
        // Ưu tiên rollNumber từ userInfo, fallback về parsedAuth
        rollNumber: userInfo?.rollNumber || parsedAuth?.rollNumber || userInfo?.studentId || parsedAuth?.studentId,
        studentId: userInfo?.studentId || parsedAuth?.studentId || userInfo?.rollNumber || parsedAuth?.rollNumber,
        id: userInfo?.id || parsedAuth?.id,
        name: userInfo?.name || parsedAuth?.name,
        role: userInfo?.role || parsedAuth?.role
      };
    } catch (error) {
      console.error('Error parsing auth_user:', error);
      return getUserInfo() || null;
    }
  };
  
  const currentUser = getCurrentUser();
  const [task, setTask] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [newComment, setNewComment] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [assigneeOptions, setAssigneeOptions] = React.useState([]);
  const [reviewerOptions, setReviewerOptions] = React.useState([]);
  const [groupInfo, setGroupInfo] = React.useState(null);
  const [editValues, setEditValues] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [peopleLoading, setPeopleLoading] = React.useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('details'); // 'details' or 'history'
  const [historyActionFilter, setHistoryActionFilter] = React.useState('');
  const [historyUserFilter, setHistoryUserFilter] = React.useState('');
  const [expandedHistoryItems, setExpandedHistoryItems] = React.useState({});
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);
  const [titleExpanded, setTitleExpanded] = React.useState(false);
  const [editingCommentId, setEditingCommentId] = React.useState(null);
  const [editingCommentText, setEditingCommentText] = React.useState('');
  const [openCommentMenuId, setOpenCommentMenuId] = React.useState(null);
  const [showAddComment, setShowAddComment] = React.useState(false);
  
  const toDateTimeLocal = React.useCallback((dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  }, []);

  const permissions = useTaskPermissions({ groupId, task, currentUser });
  const isDirty = React.useMemo(() => {
    if (!task || !editValues) return false;
    return (
      (task.title || '') !== (editValues.title || '') ||
      (task.description || '') !== (editValues.description || '') ||
      (task.status || '') !== (editValues.status || '') ||
      String(task.assignee || '') !== String(editValues.assignee || '') ||
      String(task.reviewerId || '') !== String(editValues.reviewer || '') ||
      (task.priority || '') !== (editValues.priority || '') ||
      (toDateTimeLocal(task.deadline) || '') !== (editValues.deadline || '')
    );
  }, [task, editValues, toDateTimeLocal]);
  const hasUnsavedChanges = isEditing && isDirty;

  // Helper function to map task data
  const mapTaskData = (taskData) => {
    return {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      assignee: taskData.assigneeId,
      assigneeName: taskData.assigneeName,
      deadline: taskData.deadline,
      priority: (taskData.priority || 'medium').toLowerCase(),
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
      reviewerId: taskData.reviewerId || null,
      createdById: taskData.createdById || taskData.createdBy || taskData.createBy || null,
      createdByName: taskData.createdByName || taskData.ownerName || null,
      groupName: taskData.group?.name || taskData.groupName || null
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
        //  setTask(mapTaskData(taskData));
          
          // Map data từ API response sang format frontend
          const mappedTask = {
            id: taskData.id,
            title: taskData.title,
            description: taskData.description,
            assignee: taskData.assigneeId,
            assigneeName: taskData.assigneeName,
            deadline: taskData.deadline,
            priority: (taskData.priority || 'medium').toLowerCase(),
            status: taskData.status.toLowerCase() === 'todo' ? 'todo' : 
                   taskData.status.toLowerCase() === 'inprogress' ? 'inProgress' : 'done',
            deliverableId: taskData.milestone?.id || null,
            deliverableName: taskData.milestone?.name || 'No Deliverable',
            createdAt: taskData.createdAt,
            attachments: taskData.attachments || [],
            comments: taskData.comments || [],
            history: taskData.history || [],
            // New fields
            isMeetingTask: taskData.isMeetingTask || false,
            meetingId: taskData.meetingId || null,
            isActive: taskData.isActive !== undefined ? taskData.isActive : true,
            reviewer: taskData.reviewerId || null,
            reviewerName: taskData.reviewerName || 'No Reviewer',
            reviewerId: taskData.reviewerId || null,
            createdById: taskData.createdById || taskData.createdBy || taskData.createBy || null,
            createdByName: taskData.createdByName || taskData.ownerName || null,
            groupName: taskData.group?.name || taskData.groupName || null
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

  const buildEditValues = React.useCallback(() => {
    if (!task) return null;
    return {
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      assignee: task.assignee ? String(task.assignee) : '',
      reviewer: task.reviewerId ? String(task.reviewerId) : '',
      priority: task.priority || 'medium',
      deadline: toDateTimeLocal(task.deadline)
    };
  }, [task, toDateTimeLocal]);

  const resetEditValues = React.useCallback(() => {
    const initialValues = buildEditValues();
    if (initialValues) {
      setEditValues(initialValues);
    }
  }, [buildEditValues]);

  React.useEffect(() => {
    resetEditValues();
  }, [resetEditValues]);

  // Close comment menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (openCommentMenuId) {
        const menuElement = event.target.closest('[data-comment-menu]');
        if (!menuElement) {
          setOpenCommentMenuId(null);
        }
      }
    };

    if (openCommentMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openCommentMenuId]);

  React.useEffect(() => {
    if (!groupId) return;
    let active = true;

    const fetchPeople = async () => {
      try {
        setPeopleLoading(true);
        const response = await getCapstoneGroupDetail(groupId);
        if (response.status === 200 && response.data && active) {
          const groupData = response.data;
          const students = Array.isArray(groupData.students) ? groupData.students : [];
          const supervisors = Array.isArray(groupData.supervisorsInfor) ? groupData.supervisorsInfor : [];
          
          setGroupInfo({
            id: groupData.id,
            name: groupData.name || groupData.groupCode || '',
            isExpired: groupData.isExpired,
            semesterName: groupData.semesterName || ''
          });

          setAssigneeOptions(
            students.map(student => ({
              value: String(student.id),
              label: student.name || student.fullName || `Member ${student.id}`,
              email: student.email || ''
            }))
          );

          const reviewerList = [];
          supervisors.forEach(supervisor => {
            reviewerList.push({
              value: String(supervisor.id),
              label: supervisor.name || supervisor.fullName || `Supervisor ${supervisor.id}`,
              email: supervisor.email || '',
              type: 'Supervisor'
            });
          });
          students.forEach(student => {
            reviewerList.push({
              value: String(student.id),
              label: student.name || student.fullName || `Member ${student.id}`,
              email: student.email || '',
              type: 'Student'
            });
          });
          setReviewerOptions(reviewerList);
        }
      } catch (error) {
        console.error('Error fetching group members:', error);
      } finally {
        if (active) {
          setPeopleLoading(false);
        }
      }
    };

    fetchPeople();

    return () => {
      active = false;
    };
  }, [groupId]);

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
  
  const getStatusText = (status) => {
    if (status === 'todo') return 'To Do';
    if (status === 'inProgress') return 'In Progress';
    if (status === 'done') return 'Done';
    return status || 'Unknown';
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

  const handleFieldChange = (field, value) => {
    setEditValues(prev => ({
      ...(prev || {}),
      [field]: value
    }));
  };

  const startEditing = () => {
    if (!permissions.canEditTask) return;
    resetEditValues();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (!permissions.canEditTask) return;
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm('Discard the changes you have just made?');
      if (!confirmCancel) return;
    }
    resetEditValues();
    setIsEditing(false);
  };

  const handleDeleteTask = async () => {
    if (!permissions.canEditTask) {
      alert("You don't have permission to delete this task.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      const response = await deleteTask(taskId);
      if (response.status === 200) {
        // Send email notification for task deletion
        try {
          // Collect emails: assignee, reviewer, and all group members
          const emailRecipients = [];
          
          // Add assignee email
          if (task.assignee) {
            const assigneeOption = assigneeOptions.find(opt => opt.value === String(task.assignee));
            if (assigneeOption?.email) {
              emailRecipients.push(assigneeOption.email);
            }
          }
          
          // Add reviewer email if different from assignee
          if (task.reviewerId && task.reviewerId !== task.assignee) {
            const reviewerOption = reviewerOptions.find(opt => opt.value === String(task.reviewerId));
            if (reviewerOption?.email && !emailRecipients.includes(reviewerOption.email)) {
              emailRecipients.push(reviewerOption.email);
            }
          }
          
          if (emailRecipients.length > 0) {
            await sendTaskDeletedEmail({
              recipientEmails: emailRecipients,
              recipientName: null,
              taskTitle: task.title,
              taskDescription: task.description,
              deletedByName: currentUser?.name || 'Người dùng',
              groupName: task.groupName || groupInfo?.name || `Nhóm ${groupId}`,
              groupCode: groupInfo?.name || task.groupName,
              isGroupEmail: emailRecipients.length > 1,
              systemUrl: window.location.origin
            });
          }
        } catch (emailError) {
          console.error('Error sending delete notification email:', emailError);
        }
        
        alert('Task deleted successfully!');
        navigate(-1);
      } else {
        alert(response.message || 'Unable to delete task.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('An error occurred while deleting. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const discardChangesAndGoBack = React.useCallback(() => {
    resetEditValues();
    setIsEditing(false);
    setShowUnsavedModal(false);
    navigate(-1);
  }, [resetEditValues, navigate]);

  const closeUnsavedModal = React.useCallback(() => {
    setShowUnsavedModal(false);
  }, []);

  const handleBack = () => {
    if (isEditing) {
      if (hasUnsavedChanges) {
        setShowUnsavedModal(true);
        return;
      }
      setIsEditing(false);
      resetEditValues();
    }
    navigate(-1);
  };

  const handleSaveChanges = async (navigateAfterSave = false) => {
    if (!task || !editValues || !isEditing) return;
    if (!permissions.canEditTask) {
      alert("You don't have permission to edit this task.");
      return;
    }
    const trimmedTitle = (editValues.title || '').trim();
    const trimmedDescription = (editValues.description || '').trim();
    if (!trimmedTitle) {
      alert('Title cannot be empty.');
      return;
    }
    if (trimmedTitle.length > 1000) {
      alert('Title cannot exceed 1000 characters.');
      return;
    }
    if (!trimmedDescription) {
      alert('Description cannot be empty.');
      return;
    }

    const backendStatus = editValues.status === 'todo' ? 'ToDo' :
      editValues.status === 'inProgress' ? 'InProgress' : 'Done';
    const priorityValue = editValues.priority || 'medium';
    const backendPriority = priorityValue === 'high' ? 'High' :
      priorityValue === 'medium' ? 'Medium' : 'Low';

    let backendDeadline = task.deadline;
    if (editValues.deadline) {
      const deadlineDate = new Date(editValues.deadline);
      if (Number.isNaN(deadlineDate.getTime())) {
        alert('Deadline is invalid.');
        return;
      }
      backendDeadline = deadlineDate.toISOString();
    }

    const assigneeId = editValues.assignee ? parseInt(editValues.assignee, 10) : null;
    const reviewerId = editValues.reviewer ? parseInt(editValues.reviewer, 10) : null;
    const assignmentChanged = String(task.assignee || '') !== String(editValues.assignee || '');
    const reviewerChanged = String(task.reviewerId || '') !== String(editValues.reviewer || '');
    const statusChanged = task.status !== editValues.status;
    const priorityChanged = (task.priority || '') !== (editValues.priority || '');
    const deadlineChanged = (toDateTimeLocal(task.deadline) || '') !== (editValues.deadline || '');

    const updateData = {
      id: parseInt(taskId),
      name: trimmedTitle,
      groupId: parseInt(groupId),
      description: trimmedDescription,
      endAt: backendDeadline,
      statusId: backendStatus,
      priorityId: backendPriority,
      deliverableId: task.deliverableId,
      meetingId: task.meetingId,
      assignedUserId: assigneeId,
      reviewerId: reviewerId
    };

    setSaving(true);
    try {
      const response = await axiosClient.post('/Student/Task/update', updateData);
      if (response.data.status === 200) {
        const assigneeOption = assigneeOptions.find(opt => opt.value === editValues.assignee);
        const reviewerOption = reviewerOptions.find(opt => opt.value === editValues.reviewer);
        const oldAssigneeOption = assigneeOptions.find(opt => opt.value === String(task.assignee));
        const oldReviewerOption = reviewerOptions.find(opt => opt.value === String(task.reviewerId));
        const nowIso = new Date().toISOString();
        
        // Build detailed change log
        const changeDetails = [];
        if (task.title !== trimmedTitle) {
          changeDetails.push(`Title: "${task.title}" → "${trimmedTitle}"`);
        }
        if (task.description !== trimmedDescription) {
          changeDetails.push(`Description: "${task.description || ''}" → "${trimmedDescription}"`);
        }
        if (statusChanged) {
          changeDetails.push(`Status: "${getStatusText(task.status)}" → "${getStatusText(editValues.status)}"`);
        }
        if (priorityChanged) {
          changeDetails.push(`Priority: "${task.priority}" → "${editValues.priority}"`);
        }
        if (assignmentChanged) {
          const oldName = oldAssigneeOption?.label || task.assigneeName || 'None';
          const newName = assigneeOption?.label || 'None';
          changeDetails.push(`Assignee: "${oldName}" → "${newName}"`);
        }
        if (reviewerChanged) {
          const oldName = oldReviewerOption?.label || task.reviewerName || 'None';
          const newName = reviewerOption?.label || 'None';
          changeDetails.push(`Reviewer: "${oldName}" → "${newName}"`);
        }
        if (deadlineChanged) {
          const oldDeadline = task.deadline ? formatDate(task.deadline) : 'None';
          const newDeadline = editValues.deadline ? formatDate(new Date(editValues.deadline).toISOString()) : 'None';
          changeDetails.push(`Deadline: "${oldDeadline}" → "${newDeadline}"`);
        }

        const historyDetail = changeDetails.length > 0
          ? changeDetails.join('\n')
          : 'Updated task information';

        const newHistoryItem = {
          id: Date.now(),
          type: 'update',
          detail: historyDetail,
          at: nowIso,
          user: currentUser?.name || currentUser?.id || 'User',
          action: 'UPDATE'
        };

        setTask(prev => ({
          ...(prev || task),
          title: trimmedTitle,
          description: trimmedDescription,
          status: editValues.status,
          assignee: assigneeId,
          assigneeName: assigneeOption?.label || task.assigneeName,
          reviewerId: reviewerId,
          reviewerName: reviewerOption?.label || task.reviewerName,
          priority: priorityValue,
          deadline: backendDeadline,
          history: [...(prev?.history || []), newHistoryItem]
        }));

        // Send email to assignee if changed (assignee is always a student)
        if (assignmentChanged && assigneeOption?.email) {
          try {
            await sendTaskAssignmentEmail({
              recipientEmail: assigneeOption.email,
              recipientName: assigneeOption.label,
              taskTitle: trimmedTitle,
              taskDescription: trimmedDescription,
              deadline: backendDeadline,
              priority: priorityValue,
              assignerName: currentUser?.name || currentUser?.fullName || 'Người cập nhật',
              groupName: task.groupName || groupInfo?.name || (groupId ? `Nhóm ${groupId}` : ''),
              groupId: groupId,
              taskId: taskId,
              recipientRole: 'student', // Assignee is always student
              systemUrl: window.location.origin
            });
          } catch (emailError) {
            console.error('Error sending assignment email:', emailError);
          }
        }

        // Send email to reviewer if changed (reviewer can be student or supervisor)
        if (reviewerChanged && reviewerOption?.email) {
          try {
            const reviewerRole = reviewerOption.type === 'Supervisor' ? 'supervisor' : 'student';
            await sendTaskAssignmentEmail({
              recipientEmail: reviewerOption.email,
              recipientName: reviewerOption.label,
              taskTitle: trimmedTitle,
              taskDescription: trimmedDescription,
              deadline: backendDeadline,
              priority: priorityValue,
              assignerName: currentUser?.name || currentUser?.fullName || 'Người cập nhật',
              groupName: task.groupName || groupInfo?.name || (groupId ? `Nhóm ${groupId}` : ''),
              groupId: groupId,
              taskId: taskId,
              recipientRole: reviewerRole,
              systemUrl: window.location.origin
            });
          } catch (emailError) {
            console.error('Error sending reviewer email:', emailError);
          }
        }

        // Send email when status changed
        if (statusChanged) {
          try {
            const currentUserInfo = getUserInfo();
            const targetName = assigneeOption?.label || task.assigneeName;
            const targetId = assigneeId || task.assignee;
            const targetEmail = assigneeOption?.email || task.assigneeEmail || (targetId ? `${targetId}@student.fpt.edu.vn` : null);
            if (targetEmail && targetName) {
              await sendTaskStatusUpdateEmail({
                recipientEmail: targetEmail,
                recipientName: targetName,
                taskTitle: trimmedTitle,
                oldStatus: task.status,
                newStatus: editValues.status,
                updatedByName: currentUserInfo?.name || currentUser?.name || 'Người cập nhật',
                groupName: task.groupName || groupInfo?.name || (groupId ? `Nhóm ${groupId}` : ''),
                groupId: groupId,
                taskId: taskId,
                recipientRole: 'student', // Assignee is always student
                systemUrl: window.location.origin
              });
            }
          } catch (emailError) {
            console.error('Error sending status email:', emailError);
          }
        }

        setIsEditing(false);
        setShowUnsavedModal(false);
        setEditValues({
          title: trimmedTitle,
          description: trimmedDescription,
          status: editValues.status,
          assignee: assigneeId ? String(assigneeId) : '',
          reviewer: reviewerId ? String(reviewerId) : '',
          priority: priorityValue,
          deadline: editValues.deadline || ''
        });
        if (navigateAfterSave) {
          navigate(-1);
        }
      } else {
        alert(response.data.message || 'Unable to save changes.');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('An error occurred while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addComment = async () => {
    if (!task || !newComment.trim()) return;
    if (!permissions.canComment) {
      alert("You can't comment on this task.");
      return;
    }
    
    try {
      // Gọi API create comment
      const commentData = {
        taskId: parseInt(taskId),
        feedback: newComment.trim(), // thay vì "feedback"
        groupId: parseInt(groupId),

      };

      const response = await axiosClient.post('/Student/Comment/create', commentData);
      
      if (response.data.status === 200) {
        // Tạo comment object mới từ response data, map theo cấu trúc từ API task
        const commentResponse = response.data.data;
        const userRollNumber = currentUser?.rollNumber || currentUser?.studentId || String(currentUser?.id);
        const newCommentObj = {
          id: commentResponse.id,
          author: userRollNumber, // author là rollNumber theo cấu trúc API
          authorName: currentUser?.name || 'Unknown',
          content: commentResponse.feedback,
          timestamp: commentResponse.createAt
        };

        // Cập nhật state trực tiếp - chỉ thêm comment, không thêm vào history
        setTask(prev => ({
          ...prev,
          comments: [...(prev.comments || []), newCommentObj]
        }));

        setNewComment('');
        setShowAddComment(false);
      } else {
        console.error('Error creating comment:', response.data.message);
        alert(response.data.message || 'Failed to create comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  // Check if user can edit comment (only author)
  const canEditComment = (comment) => {
    if (!currentUser || !comment || !comment.author) return false;
    
    // Get all possible user identifiers
    const userRollNumber = currentUser?.rollNumber || currentUser?.studentId || currentUser?.studentCode;
    const userId = currentUser?.id;
    const userName = currentUser?.name;
    const commentAuthor = String(comment.author).trim();
    
    // Compare with comment.author (could be rollNumber string like "SE170005")
    const authorMatch = 
      commentAuthor === String(userRollNumber) ||
      commentAuthor === String(userId) ||
      (userName && commentAuthor === String(userName)) ||
      (comment.authorName && comment.authorName === userName);
    
    return authorMatch;
  };

  // Check if user can delete comment (author, secretary, or supervisor)
  const canDeleteComment = (comment) => {
    if (!currentUser || !comment || !comment.author) return false;
    
    // Get all possible user identifiers
    const userRollNumber = currentUser?.rollNumber || currentUser?.studentId || currentUser?.studentCode;
    const userId = currentUser?.id;
    const userName = currentUser?.name;
    const commentAuthor = String(comment.author).trim();
    
    // Check if user is author
    const isAuthor = 
      commentAuthor === String(userRollNumber) ||
      commentAuthor === String(userId) ||
      (userName && commentAuthor === String(userName)) ||
      (comment.authorName && comment.authorName === userName);
    
    // Check role
    const userRole = (currentUser?.role || '').toLowerCase();
    const isSecretary = userRole === 'secretary';
    const isSupervisor = userRole === 'supervisor' || userRole === 'mentor';
    
    return isAuthor || isSecretary || isSupervisor;
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content || '');
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const saveEditComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      const response = await axiosClient.put(
        `/Student/Comment/task/${taskId}/comment/${commentId}`,
        { feedback: editingCommentText.trim() }
      );

      if (response.data.status === 200) {
        // Update comment trong state với cấu trúc từ API
        setTask(prev => ({
          ...prev,
          comments: (prev.comments || []).map(c => 
            c.id === commentId 
              ? { 
                  ...c, 
                  content: editingCommentText.trim() 
                }
              : c
          )
        }));
        setEditingCommentId(null);
        setEditingCommentText('');
      } else {
        alert(response.data.message || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error updating comment. Please try again.';
      alert(errorMessage);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await axiosClient.delete(
        `/Student/Comment/task/${taskId}/comment/${commentId}`
      );

      if (response.data.status === 200) {
        // Remove comment khỏi state
        setTask(prev => ({
          ...prev,
          comments: (prev.comments || []).filter(c => c.id !== commentId)
        }));
      } else {
        alert(response.data.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting comment. Please try again.';
      alert(errorMessage);
    }
  };

  const handleFileSelect = (event) => {
    if (!permissions.canManageAttachments) return;
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!permissions.canManageAttachments) {
      alert("You don't have permission to upload files.");
      return;
    }
    if (!selectedFile || !task || !groupId || !taskId) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const semester = groupInfo?.semesterName || '';
      const response = await axiosClient.post(
        `/upload/task?groupId=${groupId}&taskId=${taskId}&semester=${encodeURIComponent(semester)}`,
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
        alert('File uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('An error occurred while uploading. Please try again.');
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
      alert('An error occurred while downloading. Please try again.');
    }
  };

  const deleteAttachment = async (attachmentId) => {
    if (!permissions.canManageAttachments) {
      alert("You don't have permission to delete this file.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      const response = await axiosClient.delete(`/upload/task?attachmentId=${attachmentId}`);
      if (response.data.status === 200) {
        alert('File deleted successfully!');
        // Reload task data after successful delete
        await reloadTaskData();
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('An error occurred while deleting. Please try again.');
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
      <BackButton onClick={handleBack}>
        ← Back
      </BackButton>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {permissions.canEditTask && isEditing ? (
            <input
              className={styles.titleInput}
              value={editValues?.title ?? task.title ?? ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Enter task title"
              maxLength={1000}
            />
          ) : (
            <div className={styles.titleWrapper}>
              <h1 className={`${styles.titleText} ${!titleExpanded && (task.title || '').length > 80 ? styles.titleCollapsed : ''}`}>
                {task.title}
              </h1>
              {(task.title || '').length > 80 && (
                <button 
                  className={styles.toggleBtn}
                  onClick={() => setTitleExpanded(!titleExpanded)}
                >
                  {titleExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                </button>
              )}
            </div>
          )}
        </div>
        {permissions.canEditTask && (
          <div className={styles.headerActions}>
            {isEditing ? (
              <>
                <Button
                  onClick={() => handleSaveChanges(false)}
                  disabled={!hasUnsavedChanges || saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel edit
                </Button>
              </>
            ) : (
              <>
                <Button onClick={startEditing}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteTask}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      <TaskPermissionNotice permissions={permissions} groupName={task.groupName || groupInfo?.name} />

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'details' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Task Details
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'comments' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments ({(task.comments || []).length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'history' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History ({(task.history || []).length})
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'details' && (
        <div className={styles.mainContent}>
          <div className={styles.section}>
            <h2>Description</h2>
            {permissions.canEditTask && isEditing ? (
              <textarea
                className={styles.descriptionEditor}
                rows={Math.max(6, ((editValues?.description ?? task.description ?? '').match(/\n/g) || []).length + 3)}
                value={editValues?.description ?? task.description ?? ''}
                onChange={(e) => {
                  handleFieldChange('description', e.target.value);
                  // Auto resize
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onFocus={(e) => {
                  // Auto resize on focus
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="Add task description..."
              />
            ) : (
              <div className={styles.descriptionWrapper}>
                <p className={`${styles.description} ${!descriptionExpanded && (task.description || '').length > 300 ? styles.descriptionCollapsed : ''}`}>
                  {task.description}
                </p>
                {(task.description || '').length > 300 && (
                  <button 
                    className={styles.toggleBtn}
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  >
                    {descriptionExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                  </button>
                )}
              </div>
            )}
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
                {permissions.canEditTask && isEditing ? (
                  <select
                    className={styles.select}
                    value={editValues?.priority ?? 'medium'}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                ) : (
                  <span style={{ color: priorityInfo.color, fontWeight: 600 }}>{priorityInfo.text}</span>
                )}
              </div>
              <div className={styles.infoItem}>
                <label>Assignee:</label>
                {permissions.canEditTask && isEditing ? (
                  peopleLoading ? (
                    <span>Loading options...</span>
                  ) : (
                    <select
                      className={styles.select}
                      value={editValues?.assignee ?? ''}
                      onChange={(e) => handleFieldChange('assignee', e.target.value)}
                    >
                      <option value="">Select assignee</option>
                      {assigneeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <span>{task.assigneeName}</span>
                )}
              </div>
              <div className={styles.infoItem}>
                <label>Reviewer:</label>
                {permissions.canEditTask && isEditing ? (
                  peopleLoading ? (
                    <span>Loading options...</span>
                  ) : (
                    <select
                      className={styles.select}
                      value={editValues?.reviewer ?? ''}
                      onChange={(e) => handleFieldChange('reviewer', e.target.value)}
                    >
                      <option value="">Select reviewer</option>
                      {reviewerOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label} {option.type === 'Supervisor' ? '(Supervisor)' : ''}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <span>{task.reviewerName}</span>
                )}
              </div>
              <div className={styles.infoItem}>
                <label>Deadline:</label>
                {permissions.canEditTask && isEditing ? (
                  <input
                    type="datetime-local"
                    className={styles.dateTimeInput}
                    value={editValues?.deadline ?? ''}
                    onChange={(e) => handleFieldChange('deadline', e.target.value)}
                  />
                ) : (
                  <span>{formatDate(task.deadline)}</span>
                )}
              </div>
              <div className={styles.infoItem}>
                <label>Deliverable:</label>
                <span>{task.deliverableName}</span>
              </div>
              <div className={styles.infoItem}>
                <label>Status:</label>
                {permissions.canEditTask && isEditing ? (
                  <select
                    className={styles.select}
                    value={editValues?.status ?? 'todo'}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="inProgress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                ) : (
                  <span className={styles.statusValue}>{getStatusText(task.status)}</span>
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
            <h2>Attachments</h2>
            
            {permissions.canManageAttachments ? (
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
                    Choose file
                  </label>
                  {selectedFile && (
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      style={{ fontSize: 14, padding: '8px 16px' }}
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  )}
                </div>
                {selectedFile && (
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.readOnlyMessage}>
                You can only view or download attachments (upload/delete disabled).
              </div>
            )}

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
                                Uploaded by {userName} on {formatDate(createAt)}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            {hasFileUrl ? (
                              <>
                                <Button
                                  onClick={() => downloadFile(attachment)}
                                  variant="ghost"
                                  style={{ fontSize: 12, padding: '6px 12px' }}
                                >
                                  Download
                                </Button>
                                {permissions.canManageAttachments && attachmentId && (
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
                                    Delete
                                  </Button>
                                )}
                              </>
                            ) : (
                              <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                                View only
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
        )}

        {activeTab === 'comments' && (
        <div className={styles.commentsTab}>
          <div className={styles.section}>
            <h2>Comments</h2>
            
            {permissions.canComment && (
              <div className={styles.addComment}>
                {!showAddComment ? (
                  <Button 
                    onClick={() => setShowAddComment(true)} 
                    className={styles.addCommentButton}
                    variant="primary"
                  >
                    Add Comment
                  </Button>
                ) : (
                  <div className={styles.addCommentForm}>
                    <textarea
                      className={styles.commentTextarea}
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                      autoFocus
                    />
                    <div className={styles.addCommentActions}>
                      <Button 
                        onClick={addComment} 
                        className={styles.addButton}
                        variant="primary"
                      >
                        Post
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowAddComment(false);
                          setNewComment('');
                        }} 
                        className={styles.cancelButton}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={styles.commentsList}>
              {(task.comments || []).length === 0 ? (
                <div className={styles.emptyState}>No comments yet.</div>
              ) : (
                <>
                  {(task.comments || []).map(comment => {
                    const isEditing = editingCommentId === comment.id;
                    const canEdit = canEditComment(comment);
                    const canDelete = canDeleteComment(comment);

                    return (
                      <div key={comment.id} className={styles.commentItem}>
                        <div className={styles.commentItemHeader}>
                          <div className={styles.commentAuthor}>{comment.authorName || 'Unknown'}</div>
                          <div className={styles.commentTime}>{formatDate(comment.timestamp)}</div>
                          {(canEdit || canDelete) && !isEditing && (
                            <div className={styles.commentMenu} data-comment-menu>
                              <button 
                                className={styles.commentMenuButton}
                                onClick={() => setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id)}
                              >
                                <span className={styles.commentMenuDots}>⋮</span>
                              </button>
                              {openCommentMenuId === comment.id && (
                                <div className={styles.commentMenuDropdown} data-comment-menu>
                                  {canEdit && (
                                    <button
                                      className={styles.commentMenuItem}
                                      onClick={() => {
                                        startEditComment(comment);
                                        setOpenCommentMenuId(null);
                                      }}
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button
                                      className={`${styles.commentMenuItem} ${styles.commentMenuItemDanger}`}
                                      onClick={() => {
                                        deleteComment(comment.id);
                                        setOpenCommentMenuId(null);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className={styles.commentContent}>
                          {isEditing ? (
                            <>
                              <textarea
                                className={styles.commentEditTextarea}
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows={3}
                              />
                              <div className={styles.commentEditActions}>
                                <Button
                                  size="small"
                                  variant="primary"
                                  onClick={() => saveEditComment(comment.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="small"
                                  variant="secondary"
                                  onClick={cancelEditComment}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className={styles.commentText}>{comment.content}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
        )}

        {activeTab === 'history' && (
        <div className={styles.historyMain}>
            <div className={styles.section}>
              <h2>Change History</h2>
              
              {/* Filters */}
              <div className={styles.historyFilters}>
                <label>Phân loại</label>
                <select 
                  value={historyActionFilter || ''} 
                  onChange={(e) => setHistoryActionFilter(e.target.value)}
                >
                  <option value="">Chọn tiêu chí...</option>
                  {[...new Set((task.history || []).map(h => h.action).filter(Boolean))].map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
                
                <label>Cập nhật bởi</label>
                <select 
                  value={historyUserFilter || ''} 
                  onChange={(e) => setHistoryUserFilter(e.target.value)}
                >
                  <option value="">Chọn tiêu chí...</option>
                  {[...new Set((task.history || []).map(h => h.user).filter(Boolean))].map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>

              <div className={styles.historyList}>
                {(task.history || []).length === 0 ? (
                  <div className={styles.emptyState}>No change history yet.</div>
                ) : (
                  <>
                    {(task.history || [])
                      .filter(item => {
                        if (historyActionFilter && item.action !== historyActionFilter) return false;
                        if (historyUserFilter && item.user !== historyUserFilter) return false;
                        return true;
                      })
                      .map(item => {
                      const getActionClass = (action) => {
                        const a = (action || '').toLowerCase();
                        if (a.includes('creat')) return styles.historyActionCreated;
                        if (a.includes('updat')) return styles.historyActionUpdated;
                        if (a.includes('comment')) return styles.historyActionCommented;
                        if (a.includes('delet')) return styles.historyActionDeleted;
                        return styles.historyActionUpdated;
                      };

                      const isLongContent = (item.detail || '').length > 150 || (item.detail || '').split('\n').length > 3;
                      const isExpanded = expandedHistoryItems[item.id];

                      return (
                <div key={item.id} className={styles.historyItem}>
                          <div className={styles.historyItemHeader}>
                            <div className={styles.historyTime}>{formatDate(item.at)}</div>
                  <div className={styles.historyDot} />
                            <div className={styles.historyUser}>
                              <span>{item.user || 'Hệ thống'}</span>
                            </div>
                            <span className={`${styles.historyAction} ${getActionClass(item.action)}`}>
                              {item.action || 'UPDATE'}
                            </span>
                          </div>
                  <div className={styles.historyContent}>
                            <div className={styles.historyTitle}>
                              <span className={styles.historyTitleIcon}>📄</span>
                              <span className={`${styles.historyTitleText} ${isLongContent && !isExpanded ? styles.historyTitleCollapsed : styles.historyTitleExpanded}`}>
                                {item.detail}
                              </span>
                              {isLongContent && (
                                <button 
                                  className={styles.historyToggleBtn}
                                  onClick={() => setExpandedHistoryItems(prev => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                  }))}
                                >
                                  {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                                </button>
                              )}
                    </div>
                  </div>
                </div>
                      );
                    })}
                  </>
                )}
            </div>
          </div>
        </div>
        )}
      </div>
      <UnsavedChangesPrompt
        open={showUnsavedModal}
        saving={saving}
        primaryLabel="Save & go back"
        secondaryLabel="Don't save"
        cancelLabel="Cancel"
        onPrimary={() => handleSaveChanges(true)}
        onSecondary={discardChangesAndGoBack}
        onCancel={closeUnsavedModal}
        onClose={closeUnsavedModal}
      />
    </div>
  );
}

