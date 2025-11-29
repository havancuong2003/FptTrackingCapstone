import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.scss';
import sharedLayout from '../sharedLayout.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import DataTable from '../../../components/DataTable/DataTable';
import { sendTaskNotification } from '../../../email/api';
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from '../../../auth/auth';
import { getDeliverablesByGroup } from '../../../api/deliverables';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { getTasksByGroup } from '../../../api/tasks';
import SupervisorGroupFilter from '../../../components/SupervisorGroupFilter/SupervisorGroupFilter';

export default function SupervisorTasks() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const groupId = query.get('groupId');
  
  // Get user info from localStorage
  const currentUser = getUserInfo();
  
  const [tasks, setTasks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [meetings, setMeetings] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [semesters, setSemesters] = React.useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState(null);
  
  // Set default groupExpireFilter, will be updated when load group info
  const [groupExpireFilter, setGroupExpireFilter] = React.useState('active');

  // Load semesters and set default to current semester
  React.useEffect(() => {
    function loadSemesters() {
      const uniqueSemesters = getUniqueSemesters();
      setSemesters(uniqueSemesters);
      
      // Luôn ưu tiên kì hiện tại khi lần đầu render
      const currentSemesterId = getCurrentSemesterId();
      if (currentSemesterId) {
        // Kiểm tra xem currentSemesterId có trong danh sách không
        const existsInList = uniqueSemesters.some(s => s.id === currentSemesterId);
        if (existsInList) {
          setSelectedSemesterId(currentSemesterId);
        } else if (uniqueSemesters.length > 0) {
          // Nếu không có trong danh sách, fallback về semester đầu tiên
          setSelectedSemesterId(uniqueSemesters[0].id);
        }
      } else if (uniqueSemesters.length > 0) {
        // Nếu không có currentSemesterId, fallback về semester đầu tiên
        setSelectedSemesterId(uniqueSemesters[0].id);
      }
    }
    loadSemesters();
  }, []);

  // Status search-on-click
  const [isSearched, setIsSearched] = React.useState(false);
  
  // Tất cả issues (load khi bấm tìm kiếm)
  const [allTasks, setAllTasks] = React.useState([]);
  
  // Filter states riêng biệt
  const [milestoneFilter, setMilestoneFilter] = React.useState('');
  const [assigneeFilter, setAssigneeFilter] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [taskTypeFilter, setTaskTypeFilter] = React.useState('throughout'); // Mặc định Main Task
  const [activeFilter, setActiveFilter] = React.useState('active'); // 'all', 'active', 'inactive'
  const [deadlineFilter, setDeadlineFilter] = React.useState('');
  const [meetingFilter, setMeetingFilter] = React.useState('');
  const [viewType, setViewType] = React.useState('project_view'); // 'my_tasks', 'project_view', 'all_tasks', 'meeting_decisions'

  // API: Get milestones by group
  const fetchMilestonesByGroup = async (gid) => {
    if (!gid) return [];
    try {
      const response = await getDeliverablesByGroup(gid);
      const apiData = response?.data || response;
      const milestonesData = Array.isArray(apiData) ? apiData : [];
      
      return milestonesData.map(milestone => ({
        id: milestone.id,
        name: milestone.name,
        groupId: gid,
        description: milestone.description,
        deadline: milestone.deadline
      }));
    } catch (error) {
      console.error('Error fetching milestones:', error);
      return [];
    }
  };

  // API: Get group info to know if active or expired
  const fetchGroupInfo = async (gid) => {
    if (!gid) return null;
    try {
      const response = await getCapstoneGroupDetail(gid);
      
      if (response.status === 200 && response.data) {
        const groupData = response.data;
        // Check isExpired from API or from status
        const isExpired = groupData.isExpired !== undefined 
          ? groupData.isExpired 
          : (groupData.status === 'inactive');
        
        return {
          id: groupData.id,
          name: groupData.name,
          groupCode: groupData.groupCode,
          isExpired: isExpired
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching group info:', error);
      return null;
    }
  };

  // API: Get students by group
  const fetchStudentsByGroup = async (gid) => {
    if (!gid) return [];
    try {
      const response = await getCapstoneGroupDetail(gid);
      
      if (response.status === 200 && response.data) {
        const apiData = response.data.students;
        const studentsData = Array.isArray(apiData) ? apiData : [];
        
        return studentsData.map(student => ({
          id: student.id,
          name: student.name,
          studentId: student.studentId || student.id,
          email: student.email || ''
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  };

  // Get groups from localStorage (no API call) - only for dropdown
  const fetchSupervisorGroups = (expireFilter = 'active', semesterId = null) => {
    try {
      // Get groups from localStorage based on semester and expired status
      const isExpired = expireFilter === 'expired';
      const groupsFromStorage = getGroupsBySemesterAndStatus(semesterId, isExpired);
      
      // Return groups from localStorage without fetching details
      return groupsFromStorage.map(group => ({
        id: group.id,
        name: group.name || '',
        groupCode: group.code || group.groupCode || '',
        description: group.description || '',
        isExpired: group.isExpired || false
      }));
    } catch (error) {
      console.error('Error getting groups from localStorage:', error);
      return [];
    }
  };

  // API: lấy meetings đã họp cho supervisor
  // TODO: API này chưa có, tạm thời mock data
  const fetchCompletedMeetings = async (gid) => {
    if (!gid) return [];
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

  // Khi có groupId từ URL, load thông tin group để set filter (chỉ khi mount lần đầu)
  const [initialFilterSet, setInitialFilterSet] = React.useState(false);
  React.useEffect(() => {
    if (initialFilterSet) return; // Chỉ set filter lần đầu tiên
    
    const loadGroupInfoAndSetFilter = async () => {
      if (groupId) {
        // Get group info from localStorage to get semesterId
        const allSemesters = getUniqueSemesters();
        let foundGroup = null;
        let foundSemesterId = null;
        
        // Search for group in all semesters
        for (const semester of allSemesters) {
          const activeGroups = getGroupsBySemesterAndStatus(semester.id, false);
          const expiredGroups = getGroupsBySemesterAndStatus(semester.id, true);
          const allGroups = [...activeGroups, ...expiredGroups];
          
          foundGroup = allGroups.find(g => g.id === Number(groupId));
          if (foundGroup) {
            foundSemesterId = semester.id;
            break;
          }
        }
        
        if (foundGroup) {
          // Set semester based on group
          if (foundSemesterId) {
            setSelectedSemesterId(foundSemesterId);
          }
          // Set filter dựa trên isExpired của group
          const filter = foundGroup.isExpired ? 'expired' : 'active';
          setGroupExpireFilter(filter);
        } else {
          // Fallback: try to get from API
          const groupInfo = await fetchGroupInfo(groupId);
          if (groupInfo) {
            const filter = groupInfo.isExpired ? 'expired' : 'active';
            setGroupExpireFilter(filter);
          }
        }
        setInitialFilterSet(true);
      } else {
        // Nếu không có groupId, reset về default
        setGroupExpireFilter('active');
        setInitialFilterSet(true);
      }
    };
    
    loadGroupInfoAndSetFilter();
  }, [groupId, initialFilterSet]);

  // Handle group expire filter change - remove groupId from URL if exists
  const handleGroupExpireFilterChange = (newFilter) => {
    setGroupExpireFilter(newFilter);
    // Remove groupId from URL when filter changes
    if (groupId) {
      navigate('/supervisor/tasks', { replace: true });
    }
    // Clear all data when filter changes
    setMilestones([]);
    setMeetings([]);
    setAssigneeSource([]);
    setTasks([]);
    setAllTasks([]);
    setIsSearched(false);
  };

  // Handle semester change - clear data
  const handleSemesterChange = (newSemesterId) => {
    setSelectedSemesterId(newSemesterId);
    // Remove groupId from URL when semester changes
    if (groupId) {
      navigate('/supervisor/tasks', { replace: true });
    }
    // Clear all data when semester changes
    setMilestones([]);
    setMeetings([]);
    setAssigneeSource([]);
    setTasks([]);
    setAllTasks([]);
    setIsSearched(false);
  };

  // Load groups from localStorage when filter changes (no API call)
  React.useEffect(() => {
    if (selectedSemesterId === null) {
      setGroups([]);
      setLoading(false);
      return;
    }
    
    const groupsData = fetchSupervisorGroups(groupExpireFilter, selectedSemesterId);
    setGroups(groupsData);
    setLoading(false); // Set loading false after groups are loaded from localStorage
  }, [groupExpireFilter, selectedSemesterId]);

  // Load data only when group is selected
  React.useEffect(() => {
    if (!groupId) {
      // No group selected, clear all data
      setMilestones([]);
      setMeetings([]);
      setAssigneeSource([]);
      setTasks([]);
      setAllTasks([]);
      setIsSearched(false);
      return;
    }

    // Check if selected group exists in current filtered groups
    const groupsData = fetchSupervisorGroups(groupExpireFilter, selectedSemesterId);
    const selectedGroup = groupsData.find(g => g.id.toString() === groupId);
    
    if (!selectedGroup) {
      // Group not in filtered list, clear data but keep groupId in URL
      // Don't navigate away, just clear the data
      setMilestones([]);
      setMeetings([]);
      setAssigneeSource([]);
      setTasks([]);
      setAllTasks([]);
      setIsSearched(false);
      return;
    }

    // Group is selected and exists in filtered list, load data
    const loadGroupData = async () => {
      try {
        setLoading(true);
        
        const [milestoneRes, studentRes, meetingRes] = await Promise.all([
          fetchMilestonesByGroup(groupId),
          fetchStudentsByGroup(groupId),
          fetchCompletedMeetings(groupId),
        ]);
        setMilestones(milestoneRes);
        setMeetings(meetingRes);
        setAssigneeSource(studentRes);
        
        // Load tasks for group
        try {
          await fetchTasksForGroup(groupId, true);
        } catch (taskError) {
          console.error('Error fetching tasks:', taskError);
        }
      } catch (error) {
        console.error('Error loading group data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [groupId, groupExpireFilter, selectedSemesterId]);


  // Assignee source from API by group
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
            <span
              className={styles.taskTitleLink}
              onClick={(e) => {
                e.stopPropagation();
                openTaskDetail(task);
              }}
            >
              {task.title}
            </span>
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
      key: 'milestone',
      title: 'Milestone',
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
    const url = `/supervisor/task/group/${groupId}?taskId=${task.id}`;
    navigate(url);
  };

  // Handle search - load all issues từ API
  const handleSearch = async () => {
    if (!groupId) {
      alert('Vui lòng chọn group trước');
      return;
    }
    
    try {
      setLoading(true);
      
      // Call API to get all issues by group
      const response = await getTasksByGroup(groupId);
      
      if (response.data.status === 200) {
        const apiData = response.data.data;
        const tasksData = Array.isArray(apiData) ? apiData : [];
        
        // Map data từ API response sang format frontend
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
            isMeetingTask: task.isMeetingTask || false,
            reviewerId: task.reviewerId || null, // Thêm trường reviewerId
            reviewerName: task.reviewerName || 'No Reviewer' // Thêm trường reviewerName
          };
        });

        setAllTasks(mappedTasks);
        setIsSearched(true);
        
        // Show message if no tasks
        if (mappedTasks.length === 0) {
          alert('No tasks found');
        }
      } else {
        console.error('Error fetching tasks:', response.data.message);
        alert(`Error: ${response.data.message}`);
        setAllTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
        alert(`Error: ${error.message}`);
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  };


  // Handle group change
  const handleGroupChange = async (newGroupId) => {
    if (newGroupId) {
    const url = `/supervisor/tasks?groupId=${newGroupId}`;
    navigate(url);
      // Auto-call API when group is selected
      setTimeout(async () => {
        await fetchTasksForGroup(newGroupId);
      }, 100);
    }
  };

  // Fetch issues for specific group
  const fetchTasksForGroup = async (gid, skipLoading = false) => {
    if (!gid) {
      console.warn('fetchTasksForGroup: groupId is required');
      return;
    }
    
    try {
      // Only set loading if not skip (skip when called from bootstrapData)
      if (!skipLoading) {
        setLoading(true);
      }
      
      
      // Call API to get all issues by group
      const response = await getTasksByGroup(gid);
      
      if (response.status === 200) {
        const apiData = response.data;
        const tasksData = Array.isArray(apiData) ? apiData : [];
        
        // Map data từ API response sang format frontend
        const mappedTasks = tasksData.map(task => {
          // Map status giống như TaskDetail.js - dùng toLowerCase() để so sánh
          const mappedStatus = task.status?.toLowerCase() === 'todo' ? 'todo' : 
                              task.status?.toLowerCase() === 'inprogress' ? 'inProgress' : 'done';
          
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            groupId: task.group?.id?.toString() || gid || '1',
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
            isMeetingTask: task.isMeetingTask || false,
            reviewerId: task.reviewerId || null, // Thêm trường reviewerId
            reviewerName: task.reviewerName || 'No Reviewer' // Thêm trường reviewerName
          };
        });

        setAllTasks(mappedTasks);
        setIsSearched(true);
        
        // Show message if no issues
        if (mappedTasks.length === 0) {
          alert('No tasks found');
        }
      } else {
        console.error('Error fetching issues:', response.data.message);
        alert(`Error: ${response.data.message}`);
        setAllTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert(`Error kết nối lấy tasks: ${error.message}`);
      setAllTasks([]);
      setIsSearched(false);
    } finally {
      // Chỉ set loading false nếu không skip (khi gọi từ bootstrapData thì skip)
      if (!skipLoading) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading tasks...</div>
      </div>
    );
  }

  // Filter tasks based on filter states
  const filteredTasks = allTasks.filter(task => {
    const milestoneMatch = milestoneFilter === '' || task.deliverableId?.toString() === milestoneFilter;
    const assigneeMatch = assigneeFilter === '' || task.assignee.toString() === assigneeFilter;
    const statusMatch = statusFilter === '' || task.status === statusFilter;
    const priorityMatch = priorityFilter === '' || task.priority === priorityFilter;
    
    // Filter by task type based on isMeetingTask
    let taskTypeMatch = true;
    if (taskTypeFilter === 'meeting') {
      taskTypeMatch = task.isMeetingTask === true;
    } else if (taskTypeFilter === 'throughout') {
      taskTypeMatch = task.isMeetingTask !== true;
    }
    
    // Filter by active status
    let activeTaskMatch = true;
    if (activeFilter === 'active') {
      activeTaskMatch = task.isActive === true;
    } else if (activeFilter === 'inactive') {
      activeTaskMatch = task.isActive === false;
    }
    
    // Filter by deadline
    let deadlineMatch = true;
    if (deadlineFilter) {
      const taskDeadline = new Date(task.deadline);
      const filterDeadline = new Date(deadlineFilter);
      // Convert filterDeadline to end of day to include the selected day
      filterDeadline.setHours(23, 59, 59, 999);
      deadlineMatch = taskDeadline <= filterDeadline;
    }
    
    // Filter by meeting
    let meetingMatch = true;
    if (meetingFilter) {
      meetingMatch = task.meetingId && task.meetingId.toString() === meetingFilter;
    }
    
    // If activeFilter === 'all' then activeTaskMatch = true (show all)
    return milestoneMatch && assigneeMatch && statusMatch && priorityMatch && taskTypeMatch && activeTaskMatch && deadlineMatch && meetingMatch;
  });

  const milestoneOptions = milestones.map(m => ({ value: m.id.toString(), label: m.name }));
  const assigneeOptions = assigneeSource.map(s => {
    return { value: s.id, label: s.name }
  });

  const todoTasks = filteredTasks.filter(task => task.status === 'todo');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'inProgress');
  const doneTasks = filteredTasks.filter(task => task.status === 'done');

  return (
    <div className={sharedLayout.container}>
      <div className={sharedLayout.header}>
        <h1>Tasks Management - Supervisor View</h1>
      </div>

      <SupervisorGroupFilter
        semesters={semesters}
        selectedSemesterId={selectedSemesterId}
        onSemesterChange={handleSemesterChange}
        groupExpireFilter={groupExpireFilter}
        onGroupExpireFilterChange={handleGroupExpireFilterChange}
        groups={groups}
        selectedGroupId={groupId || ''}
        onGroupChange={(newGroupId) => {
          if (newGroupId) {
            navigate(`/supervisor/tasks?groupId=${newGroupId}`, { replace: true });
          } else {
            navigate('/supervisor/tasks', { replace: true });
          }
        }}
        groupSelectPlaceholder="Select group"
        loading={loading}
      />

      {/* Only show when group is selected */}
      {groupId && (
        <>
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

      {/* Filters */}
          <div className={styles.filtersSection}>
            <div className={styles.filtersHeader}>
              <h3>Filters</h3>
            </div>
            <div className={styles.filtersControls}>
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
            </div>
          </div>

          {/* Toolbar ngay trên table */}
          <div className={styles.tableToolbar}>
            <button
              className={styles.refreshButton}
              onClick={() => fetchTasksForGroup(groupId)}
            >
              Refresh
            </button>
            <button
              className={styles.resetButton}
              onClick={() => {
                setMilestoneFilter('');
                setAssigneeFilter('');
                setPriorityFilter('');
                setStatusFilter('');
                setTaskTypeFilter('throughout');
                setActiveFilter('active');
                setDeadlineFilter('');
                setMeetingFilter('');
              }}
            >
              Reset Filter
            </button>
          </div>
        </>
      )}


      {/* Empty state khi chưa chọn group */}
      {!groupId && (
        <div className={sharedLayout.noSelection}>
          <p>Please select a group</p>
          <p>You will see group information and document list after selection.</p>
        </div>
      )}

      {/* Empty state khi đã chọn group nhưng không có issue */}
      {groupId && filteredTasks.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>No tasks found</div>
          <div className={styles.emptySubtitle}>Thử chọn group khác hoặc thay đổi bộ lọc</div>
        </div>
      )}

      {/* DataTable khi có group và có data */}
      {groupId && filteredTasks.length > 0 && (
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
    </div>
  );
}