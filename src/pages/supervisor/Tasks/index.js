import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
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
  const [viewMode, setViewMode] = React.useState('list'); // list or kanban

  // Trạng thái search-on-click
  const [isSearched, setIsSearched] = React.useState(false);
  
  // Tất cả tasks (load khi bấm tìm kiếm)
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

  const openTaskDetail = (task) => {
    const url = `/supervisor/task/group/${groupId}?taskId=${task.id}`;
    navigate(url);
  };

  // Handle search - load all tasks từ API
  const handleSearch = async () => {
    if (!groupId) {
      alert('Vui lòng chọn group trước');
      return;
    }
    
    try {
      setLoading(true);
      
      // Gọi API lấy tất cả tasks theo group
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

  // Handle group change
  const handleGroupChange = (newGroupId) => {
    const url = `/supervisor/tasks?groupId=${newGroupId}`;
    navigate(url);
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
    const milestoneMatch = milestoneFilter === '' || task.milestoneId?.toString() === milestoneFilter;
    const assigneeMatch = assigneeFilter === '' || task.assignee.toString() === assigneeFilter;
    const statusMatch = statusFilter === '' || task.status === statusFilter;
    const priorityMatch = priorityFilter === '' || task.priority === priorityFilter;
    return milestoneMatch && assigneeMatch && statusMatch && priorityMatch;
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
        <h1>Task Management - Supervisor View</h1>
      </div>

      {/* Group Selection */}
      <div className={styles.section}>
        <h2>Chọn Group</h2>
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
      {groupId && (
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
      )}

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
          <div className={styles.emptyTitle}>
            {allTasks.length === 0 ? 
              "Chọn group và nhấn 'Tìm kiếm' để xem tasks" : 
              "Không có task nào phù hợp với bộ lọc"
            }
              </div>
          <div className={styles.emptySubtitle}>
            {allTasks.length === 0 ? 
              "Chọn group từ dropdown bên trên để xem tasks" : 
              "Thử thay đổi bộ lọc"
            }
          </div>
          {groupId && (
            <button className={styles.searchButton} onClick={handleSearch}>
              {allTasks.length === 0 ? "Tìm kiếm" : "Tìm kiếm lại"}
            </button>
          )}
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
                    View Details
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
                    
                    <div className={styles.taskActions}>
                      <button 
                        className={`${styles.actionButton} ${styles.primary}`}
                        onClick={() => openTaskDetail(task)}
                      >
                        View Details
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
                        onClick={() => openTaskDetail(task)}
                      >
                        View Details
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
                    <div className={styles.kanbanActions}>
                      <Button 
                        size="sm"
                        onClick={() => openTaskDetail(task)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
        </div>
      )}
    </div>
  );
}