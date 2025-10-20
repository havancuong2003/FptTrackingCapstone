import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import DataTable from '../../../components/DataTable/DataTable';
import axiosClient from '../../../utils/axiosClient';

export default function SupervisorTasks() {
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
      return null;
    } catch (error) {
      console.error('Error parsing auth_user:', error);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const [tasks, setTasks] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Trạng thái search-on-click
  const [isSearched, setIsSearched] = React.useState(false);
  
  // Tất cả issues (load khi bấm tìm kiếm)
  const [allTasks, setAllTasks] = React.useState([]);
  
  // Filter states riêng biệt
  const [milestoneFilter, setMilestoneFilter] = React.useState('');
  const [assigneeFilter, setAssigneeFilter] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  // API: lấy milestones theo group
  const fetchMilestonesByGroup = async (gid) => {
    if (!gid) return [];
    try {
      const response = await axiosClient.get(`/Student/milestone/group/${gid}`);
      
      if (response.data.status === 200) {
        const apiData = response.data.data;
        const milestonesData = Array.isArray(apiData) ? apiData : [];
        
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
    if (!gid) return [];
    try {
      const response = await axiosClient.get(`/Staff/capstone-groups/${gid}`);
      
      if (response.data.status === 200) {
        const apiData = response.data.data.students;
        const studentsData = Array.isArray(apiData) ? apiData : [];
        
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

  // API: lấy tất cả groups mà supervisor hướng dẫn
  const fetchSupervisorGroups = async () => {
    try {
      const response = await axiosClient.get('/Mentor/getGroups');
      
      if (response.data.status === 200) {
        const apiData = response.data.data;
        const groupsData = Array.isArray(apiData) ? apiData : [];
        
        return groupsData.map(group => ({
          id: group.id,
          name: group.name,
          description: group.description || ''
        }));
      } else {
        console.error('Error fetching groups:', response.data.message);
        alert(`Lỗi lấy danh sách groups: ${response.data.message}`);
        return [];
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert(`Lỗi kết nối lấy groups: ${error.message}`);
      return [];
    }
  };

  React.useEffect(() => {
    const bootstrapData = async () => {
      try {
        setLoading(true);
        
        // Load groups trước
        const groupsData = await fetchSupervisorGroups();
        setGroups(groupsData);
        
        // Nếu có groupId, load milestones và students
        if (groupId) {
          const [milestoneRes, studentRes] = await Promise.all([
            fetchMilestonesByGroup(groupId),
            fetchStudentsByGroup(groupId),
          ]);
          setMilestones(milestoneRes);
          setAssigneeSource(studentRes);
        } else {
          setMilestones([]);
          setAssigneeSource([]);
        }
        
        setTasks([]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    bootstrapData();
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
      title: 'Issue',
      render: (task) => (
        <div>
          <div className={styles.taskTitle}>{task.title}</div>
          <div className={styles.taskDescription}>{task.description}</div>
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
      render: (task) => task.milestoneName
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
        </div>
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
      
      // Gọi API lấy tất cả issues theo group
      const response = await axiosClient.get(`/Student/Task/get-by-group/${groupId}`);
      
      if (response.data.status === 200) {
        const apiData = response.data.data;
        const tasksData = Array.isArray(apiData) ? apiData : [];
        
        // Map data từ API response sang format frontend
        const mappedTasks = tasksData.map(task => {
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
          };
        });

        setAllTasks(mappedTasks);
        setIsSearched(true);
        
        // Hiển thị thông báo nếu không có task
        if (mappedTasks.length === 0) {
          alert('Không có issue nào');
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


  // Handle group change
  const handleGroupChange = async (newGroupId) => {
    if (newGroupId) {
    const url = `/supervisor/tasks?groupId=${newGroupId}`;
    navigate(url);
      // Auto-call API when group is selected
      setTimeout(async () => {
        await fetchIssuesForGroup(newGroupId);
      }, 100);
    }
  };

  // Fetch issues for specific group
  const fetchIssuesForGroup = async (gid) => {
    try {
      setLoading(true);
      
      // Gọi API lấy tất cả issues theo group
      const response = await axiosClient.get(`/Student/Task/get-by-group/${gid}`);
      
      if (response.data.status === 200) {
        const apiData = response.data.data;
        const tasksData = Array.isArray(apiData) ? apiData : [];
        
        // Map data từ API response sang format frontend
        const mappedTasks = tasksData.map(task => {
          return {
            id: task.id,
            title: task.title,
            description: task.description,
            groupId: task.group?.id?.toString() || gid || '1',
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
          };
        });

        setAllTasks(mappedTasks);
        setIsSearched(true);
        
        // Hiển thị thông báo nếu không có issue
        if (mappedTasks.length === 0) {
          alert('Không có issue nào');
        }
      } else {
        console.error('Error fetching issues:', response.data.message);
        alert(`Lỗi: ${response.data.message}`);
        setAllTasks([]);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      alert(`Lỗi kết nối: ${error.message}`);
      setAllTasks([]);
    } finally {
      setLoading(false);
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
 //   console.log("task", task);
  //  console.log("milestoneFilter", milestoneFilter);
    const milestoneMatch = milestoneFilter === '' || task.milestoneId?.toString() === milestoneFilter;
    const assigneeMatch = assigneeFilter === '' || task.assignee.toString() === assigneeFilter;
    const statusMatch = statusFilter === '' || task.status === statusFilter;
    const priorityMatch = priorityFilter === '' || task.priority === priorityFilter;
    return milestoneMatch && assigneeMatch && statusMatch && priorityMatch;
  });

  const milestoneOptions = milestones.map(m => ({ value: m.id.toString(), label: m.name }));
//  console.log("milestoneOptions", milestoneOptions);
  const assigneeOptions = assigneeSource.map(s => {
    return { value: s.id, label: s.name }
  });

  const todoTasks = filteredTasks.filter(task => task.status === 'todo');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'inProgress');
  const doneTasks = filteredTasks.filter(task => task.status === 'done');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Issues Management - Supervisor View</h1>
      </div>

      {/* Group Selection - ở đầu dòng */}
      <div className={styles.groupSection}>
        <div className={styles.groupControls}>
          <div className={styles.controlGroup}>
            <label>Group:</label>
          <select
            value={groupId || ''}
            onChange={(e) => handleGroupChange(e.target.value)}
            className={`${styles.select} ${styles.groupSelect}`}
          >
            <option value="">Chọn group</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          </div>
        </div>
      </div>

      {/* Chỉ hiển thị khi đã chọn group */}
      {groupId && (
        <>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{filteredTasks.length}</div>
              <div className={styles.statLabel}>Total Issues</div>
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
            </div>
          </div>

          {/* Toolbar ngay trên table */}
          <div className={styles.tableToolbar}>
            <button
              className={styles.refreshButton}
              onClick={() => fetchIssuesForGroup(groupId)}
            >
              Refresh
            </button>
          </div>
        </>
      )}


      {/* Empty state khi chưa chọn group */}
      {!groupId && (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>Chọn group để xem issues</div>
          <div className={styles.emptySubtitle}>Chọn group từ dropdown bên trên để xem issues</div>
        </div>
      )}

      {/* Empty state khi đã chọn group nhưng không có issue */}
      {groupId && filteredTasks.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyTitle}>Không có issue nào</div>
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
            emptyMessage="Không có issue nào"
            onRowClick={openTaskDetail}
            showIndex={true}
            indexTitle="No"
          />
        </div>
      )}
    </div>
  );
}