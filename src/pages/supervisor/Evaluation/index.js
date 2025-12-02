import React from "react";
import styles from "./index.module.scss";
import sharedLayout from "../sharedLayout.module.scss";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import DataTable from "../../../components/DataTable/DataTable";
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from "../../../auth/auth";
import { getCapstoneGroupDetail } from "../../../api/staff/groups";
import { getDeliverablesByGroup } from "../../../api/deliverables";
import {
  getEvaluationsByMentorDeliverable,
  getPenaltyCardsByMilestone,
  createEvaluation,
  updateEvaluation as updateEvaluationAPI,
  getStudentEvaluationDetail,
  getStudentEvaluationStatistics
} from "../../../api/evaluation";
import SupervisorGroupFilter from "../../../components/SupervisorGroupFilter/SupervisorGroupFilter";
import axiosClient from "../../../utils/axiosClient";

// API endpoints - using axiosClient

export default function SupervisorEvaluation() {
  const [groups, setGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = React.useState(null);
  const [newEvaluation, setNewEvaluation] = React.useState({
    studentId: "",
    milestoneId: "",
    feedback: "",
    notes: "",
  });
  const [editEvaluation, setEditEvaluation] = React.useState({
    id: "",
    studentId: "",
    milestoneId: "",
    feedback: "",
    notes: "",
  });

  // Feedback statements (3 mức: Above Normal, Normal, Below Normal)
  const feedbackStatements = [
    { 
      value: "above_normal", 
      text: "Above Normal",
      shortValue: "excellent",  // Giá trị gửi lên backend
      level: 1
    },
    { 
      value: "normal", 
      text: "Normal",
      shortValue: "good",  // Giá trị gửi lên backend
      level: 2
    },
    { 
      value: "below_normal", 
      text: "Below Normal",
      shortValue: "poor",  // Giá trị gửi lên backend
      level: 3
    }
  ];
  const [evaluations, setEvaluations] = React.useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = React.useState(false);
  const [penaltyCards, setPenaltyCards] = React.useState([]);
  const [loadingPenaltyCards, setLoadingPenaltyCards] = React.useState(false);
  const [studentStatistics, setStudentStatistics] = React.useState(null);
  const [loadingStatistics, setLoadingStatistics] = React.useState(false);
  const [semesters, setSemesters] = React.useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState(null);
  const [groupExpireFilter, setGroupExpireFilter] = React.useState('active'); // 'active' or 'expired'

  // State cho bảng thống kê nhóm (matrix sinh viên x milestone)
  const [taskModal, setTaskModal] = React.useState(false);
  const [selectedCellStudent, setSelectedCellStudent] = React.useState(null);
  const [selectedCellMilestone, setSelectedCellMilestone] = React.useState(null);
  const [cellTasks, setCellTasks] = React.useState([]);
  const [loadingCellTasks, setLoadingCellTasks] = React.useState(false);
  const [currentEvaluation, setCurrentEvaluation] = React.useState(null); // Lưu currentEvaluation từ API
  const [statisticsTab, setStatisticsTab] = React.useState("overview"); // 'overview' | 'history'
  const [evaluationTab, setEvaluationTab] = React.useState("tasks"); // 'tasks' | 'evaluation'
  const [selectedOverviewMilestone, setSelectedOverviewMilestone] = React.useState(null); // Milestone được chọn trong overview
  const [studentDetailModal, setStudentDetailModal] = React.useState(false); // Modal tổng hợp tasks và evaluate
  const [studentDetailTab, setStudentDetailTab] = React.useState("tasks"); // Tab trong student detail modal
  const [showStatistics, setShowStatistics] = React.useState(false); // Ẩn thống kê mặc định
  const [allStudentsStatistics, setAllStudentsStatistics] = React.useState([]); // Thống kê tất cả students
  const [loadingAllStatistics, setLoadingAllStatistics] = React.useState(false);
  const [evaluationHistoryModal, setEvaluationHistoryModal] = React.useState(false); // Modal hiển thị lịch sử đánh giá
  const [selectedStudentForHistory, setSelectedStudentForHistory] = React.useState(null); // Student được chọn để xem lịch sử

  // ------------------ Fetch Evaluations ------------------
  const fetchEvaluationsRef = React.useRef(false);
  
  // ------------------ Fetch Evaluations when milestone changes ------------------
  React.useEffect(() => {
    if (!selectedGroup) {
      setEvaluations([]);
      return;
    }
    
    // Prevent infinite loop by checking if already fetching
    if (fetchEvaluationsRef.current) return;
    fetchEvaluationsRef.current = true;
    
    let isCancelled = false;
    
    const loadEvaluations = async () => {
      setLoadingEvaluations(true);
      try {
        // If no milestone selected or "all" selected, get all evaluations for the group
        const response = await getEvaluationsByMentorDeliverable(selectedGroup, selectedMilestone !== "all" ? selectedMilestone : null);
        
        if (isCancelled) return;
        
        // Check if response.data is array directly
        if (Array.isArray(response)) {
          setEvaluations(response);
        } else if (response?.status === 200) {
          const evaluationsData = response.data || [];
          setEvaluations(evaluationsData);
        } else if (Array.isArray(response?.data)) {
          setEvaluations(response.data);
        } else {
          setEvaluations([]);
        }
      } catch (err) {
        if (!isCancelled) {
          setEvaluations([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingEvaluations(false);
        }
        fetchEvaluationsRef.current = false;
      }
    };
    
    loadEvaluations();
    
    // Cleanup function để tránh update state sau khi component unmount
    return () => {
      isCancelled = true;
      fetchEvaluationsRef.current = false;
    };
  }, [selectedGroup, selectedMilestone]);

  // ------------------ Force Refresh Evaluations ------------------
  const forceRefreshEvaluations = async () => {
    if (!selectedGroup) return;
    
    setEvaluations([]); // Clear current evaluations first
    setLoadingEvaluations(true);
    try {
      const response = await getEvaluationsByMentorDeliverable(selectedGroup, selectedMilestone !== "all" ? selectedMilestone : null);
      
      if (Array.isArray(response)) {
        setEvaluations(response);
      } else if (response?.status === 200) {
        const evaluationsData = response.data || [];
        setEvaluations(evaluationsData);
      } else if (Array.isArray(response?.data)) {
        setEvaluations(response.data);
      } else {
        setEvaluations([]);
      }
    } catch (err) {
      setEvaluations([]);
    } finally {
      setLoadingEvaluations(false);
    }
  };
  
  // Function để gọi fetch evaluations manually (không trigger useEffect)
  const fetchEvaluations = React.useCallback(async () => {
    if (!selectedGroup) return;
    
    setLoadingEvaluations(true);
    try {
      const response = await getEvaluationsByMentorDeliverable(selectedGroup, selectedMilestone !== "all" ? selectedMilestone : null);
      
      if (Array.isArray(response)) {
        setEvaluations(response);
      } else if (response?.status === 200) {
        const evaluationsData = response.data || [];
        setEvaluations(evaluationsData);
      } else if (Array.isArray(response?.data)) {
        setEvaluations(response.data);
      } else {
        setEvaluations([]);
      }
    } catch (err) {
      setEvaluations([]);
    } finally {
      setLoadingEvaluations(false);
    }
  }, [selectedGroup, selectedMilestone]);
  

  // ------------------ Load Semesters and Groups ------------------
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
      // Set loading false after semesters are loaded
      setLoading(false);
    }
    loadSemesters();
  }, []);

  React.useEffect(() => {
    if (selectedSemesterId === null) {
      setGroups([]);
      setLoading(false);
      return;
    }
    
    // Get groups from localStorage only (no API call)
    const isExpired = groupExpireFilter === 'expired';
    const groupsFromStorage = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
    
    // Build groups list from localStorage only
    const groupsData = groupsFromStorage.map(groupInfo => ({
      groupId: groupInfo.id.toString(),
      groupName: groupInfo.name || `Group ${groupInfo.id}`,
      milestones: [],
    }));
    
    setGroups(groupsData);
    setLoading(false); // Set loading false after groups are loaded from localStorage
    
    // Check if selected group is still in filtered list
    // Sử dụng functional update để tránh stale closure
    setSelectedGroup(prevSelectedGroup => {
      if (prevSelectedGroup) {
        const selectedGroupExists = groupsFromStorage.some(g => g.id.toString() === prevSelectedGroup);
        if (!selectedGroupExists) {
          // Selected group is not in filtered list, clear selection and data
          setSelectedMilestone('all');
          setEvaluations([]);
          setPenaltyCards([]);
          return null;
        }
      }
      return prevSelectedGroup;
    });
  }, [selectedSemesterId, groupExpireFilter]);

  // ------------------ Fetch Milestones & Students ------------------
  React.useEffect(() => {
    if (!selectedGroup) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [milestoneResult, studentResult] = await Promise.allSettled([
          getDeliverablesByGroup(selectedGroup),
          getCapstoneGroupDetail(selectedGroup)
        ]); 

        const milestoneRes = milestoneResult.status === 'fulfilled' ? milestoneResult.value : null;
        const studentRes = studentResult.status === 'fulfilled' ? studentResult.value : null;

        // Handle different API response formats
        let studentData;
        if (studentRes && studentRes.status === 200) {
          studentData = studentRes.data;
        }

        if (studentData) {
         
          const milestoneData = milestoneRes ? (milestoneRes || []) : []; // Can be empty if API error


          // Check data structure
          if (!studentData) {
            return;
          }

          if (!studentData.students || !Array.isArray(studentData.students)) {
            return;
          }

          const students =
            studentData.students.map((s) => {
              return {
                id: s.rollNumber, // Use rollNumber as student code
                studentId: s.id.toString(), // Keep studentId to call API
                name: s.name,
                role: s.role,
                email: s.email, // Get email from database, no fallback
                penaltyCards: [],
                evaluations: [],
              };
            });


          let milestones = [];
          if (Array.isArray(milestoneData) && milestoneData.length > 0) {
            milestones = milestoneData.map((m) => ({
              id: m.id.toString(),
              name: m.name,
              students,
            }));
          } else {
            // Don't create fake data when API errors
            milestones = [];
          }

          setGroups((prev) => {
            const existingGroup = prev.find(g => g.groupId === selectedGroup);
            // Chỉ cập nhật nếu có thay đổi thực sự
            if (existingGroup) {
              const hasChanges = 
                existingGroup.groupName !== (studentData?.projectName || existingGroup.groupName) ||
                JSON.stringify(existingGroup.milestones) !== JSON.stringify(milestones);
              
              if (hasChanges) {
                return prev.map((g) =>
                  g.groupId === selectedGroup
                    ? {
                        ...g,
                        groupName: studentData?.projectName || g.groupName,
                        milestones,
                      }
                    : g
                );
              }
            } else {
              // Nếu group chưa tồn tại, thêm mới
              return [...prev, {
                groupId: selectedGroup,
                groupName: studentData?.projectName || `Group ${selectedGroup}`,
                milestones,
              }];
            }
            return prev; // Không có thay đổi, trả về state cũ
          });

          // Don't automatically select first milestone, let user choose
        } else {
          alert('Unable to fetch group information. Please try again.');
        }
      } catch (err) {
        alert('Error loading group information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [selectedGroup]);

  const selectedGroupData = groups.find((g) => g.groupId === selectedGroup);
  const selectedMilestoneData = selectedGroupData?.milestones?.find(
    (m) => m.id === selectedMilestone
  );
  // If no milestone selected or "all" selected, get all students from all milestones
  let studentsToEvaluate = [];

  if (!selectedMilestone || selectedMilestone === "all") {
    if (selectedGroupData?.milestones) {
      // Lấy tất cả students từ tất cả milestones và merge lại
      const allStudents = new Map();
      selectedGroupData.milestones.forEach(milestone => {
        if (milestone.students) {
          milestone.students.forEach(student => {
            // Use studentId as key to avoid duplicates
            if (!allStudents.has(student.studentId)) {
              allStudents.set(student.studentId, student);
            }
          });
        }
      });
      studentsToEvaluate = Array.from(allStudents.values());
    }
  } else {
    studentsToEvaluate = selectedMilestoneData?.students || [];
  }
  
  // Tự động load lại thống kê khi đổi group (nếu statistics đang mở)
  React.useEffect(() => {
    if (selectedGroup && showStatistics && selectedGroupData?.milestones) {
      // Tính toán studentsToEvaluate
      let studentsToEvaluateForStats = [];
      if (!selectedMilestone || selectedMilestone === "all") {
        const allStudents = new Map();
        selectedGroupData.milestones.forEach(milestone => {
          if (milestone.students) {
            milestone.students.forEach(student => {
              if (!allStudents.has(student.studentId)) {
                allStudents.set(student.studentId, student);
              }
            });
          }
        });
        studentsToEvaluateForStats = Array.from(allStudents.values());
      } else {
        studentsToEvaluateForStats = selectedMilestoneData?.students || [];
      }
      
      if (studentsToEvaluateForStats.length > 0) {
        fetchAllStudentsStatistics(studentsToEvaluateForStats);
      } else {
        setAllStudentsStatistics([]);
      }
    }
  }, [selectedGroup, showStatistics]);



  // ------------------ DataTable Columns ------------------
  // Helper: check if evaluation belongs to selected milestone
  const isEvaluationInSelectedMilestone = (evaluation) => {
    if (!selectedMilestone || selectedMilestone === "all") return true;
    const selectedId = parseInt(selectedMilestone);
    const byId = evaluation.deliverableId === selectedId || evaluation.deliverableID === selectedId;
    const byName = evaluation.deliverableName === selectedMilestoneData?.name;
    return Boolean(byId || byName);
  };

  // Helper: lấy evaluation mới nhất của 1 sinh viên theo milestone đã chọn
  const getLatestEvaluationForStudent = (student) => {
    const list = evaluations.filter((evaluation) => {
      return (
        evaluation.receiverId === parseInt(student.studentId) &&
        isEvaluationInSelectedMilestone(evaluation)
      );
    });
    return list.length > 0
      ? list.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0]
      : null;
  };
  
  // Helper: map feedback từ shortValue/value sang text dài để hiển thị
  const mapFeedbackToText = (feedback) => {
    if (!feedback) return '';
    const str = feedback.toString();
    const lower = str.toLowerCase();
    // match by shortValue first
    const byShort = feedbackStatements.find(s => s.shortValue === lower);
    if (byShort) return byShort.text;
    // match by value key
    const byValue = feedbackStatements.find(s => s.value === lower);
    if (byValue) return byValue.text;
    // if already contains any text phrase, return original
    const byText = feedbackStatements.find(s => str.includes(s.text));
    if (byText) return str;
    return str;
  };

  // ------------------ Fetch Penalty Cards ------------------
  const fetchPenaltyCards = async () => {
    if (!selectedGroup) return;
    
    setLoadingPenaltyCards(true);
    try {
      const response = await getPenaltyCardsByMilestone(selectedGroup);
      
      if (response?.status === 200) {
        const penaltiesData = response.data || [];
        // Only get name from API
        const formattedPenalties = penaltiesData.map(penalty => ({
          id: penalty.id,
          name: penalty.name
        }));
        setPenaltyCards(formattedPenalties);
      } else if (Array.isArray(response)) {
        const formattedPenalties = response.map(penalty => ({
          id: penalty.id,
          name: penalty.name
        }));
        setPenaltyCards(formattedPenalties);
      } else {
        setPenaltyCards([]);
      }
    } catch (err) {
      setPenaltyCards([]);
    } finally {
      setLoadingPenaltyCards(false);
    }
  };


  // Helper: Map type từ API sang feedback value của form
  const mapTypeToFeedbackValue = (type) => {
    if (!type) return "";
    const typeLower = type.toString().toLowerCase();
    // Map theo shortValue: excellent -> above_normal, good -> normal, poor -> below_normal
    if (typeLower === "excellent") return "above_normal";
    if (typeLower === "good") return "normal";
    if (typeLower === "poor") return "below_normal";
    // Fallback: tìm trong feedbackStatements
    const matched = feedbackStatements.find(s => 
      s.shortValue === typeLower || 
      s.text.toLowerCase() === typeLower ||
      s.value === typeLower
    );
    return matched ? matched.value : "";
  };

  // ------------------ Modal Logic ------------------
  const openStudentDetailModal = async (student, milestone = null) => {
    // Xác định milestone tương ứng với ô được click
    let effectiveMilestone = milestone;
    if (!effectiveMilestone && selectedGroupData?.milestones) {
      effectiveMilestone =
        selectedGroupData.milestones.find(m => m.id === selectedMilestone) || null;
    }

    setSelectedStudent(student);
    setSelectedCellStudent(student);
    setSelectedCellMilestone(effectiveMilestone);
    setSelectedEvaluation(null);
    setStudentDetailTab("tasks");

    // Load tasks và currentEvaluation cho ô hiện tại
    let evaluationData = null;
    if (effectiveMilestone) {
      // fetchCellTasks return currentEvaluation
      evaluationData = await fetchCellTasks(student, effectiveMilestone);
    } else {
      setCellTasks([]);
      setCurrentEvaluation(null);
    }

    // Fill form với currentEvaluation nếu có
    if (evaluationData) {
      setNewEvaluation({
        studentId: student.studentId,
        milestoneId: effectiveMilestone?.id?.toString?.() || "",
        feedback: mapTypeToFeedbackValue(evaluationData.type),
        notes: evaluationData.feedback || "",
      });
    } else {
      // Reset form nếu không có evaluation
      setNewEvaluation({
        studentId: student.studentId,
        milestoneId: effectiveMilestone?.id?.toString?.() || "",
        feedback: "",
        notes: "",
      });
    }
    
    setStudentDetailModal(true);
  };


  // Khi click vào ô (student x milestone): mở Student Detail Modal
  const handleMatrixCellClick = (student, milestone) => {
    openStudentDetailModal(student, milestone);
  };

  // Render danh sách task cho ô (student x milestone) dùng chung cho Evaluate/Edit modal
  const renderCellTasksSection = () => {
    if (!selectedCellStudent || !selectedCellMilestone) {
      return (
        <div className={styles.noStatistics}>
          <p>No milestone selected.</p>
        </div>
      );
    }

    // Cột hiển thị task, tái sử dụng style giống trang Student Tasks
    const taskColumns = [
      {
        key: 'title',
        title: 'Task',
        render: (task) => (
          <div>
            <div className={styles.taskName}>
              {task.name || task.title || 'Unnamed Task'}
            </div>
            {task.description && (
              <div className={styles.taskDescription}>
                {task.description.length > 80
                  ? `${task.description.substring(0, 80)}...`
                  : task.description}
              </div>
            )}
          </div>
        )
      },
      {
        key: 'assignee',
        title: 'Assignee',
        render: (task) => task.assigneeName || task.assignee || '—'
      },
      {
        key: 'milestone',
        title: 'Milestone',
        render: (task) =>
          task.deliverableName || task.milestoneName || task.milestone?.name || '—'
      },
      {
        key: 'priority',
        title: 'Priority',
        render: (task) => (task.priority || '').toString().toUpperCase() || '—'
      },
      {
        key: 'status',
        title: 'Status',
        render: (task) => (
          <span
            className={`${styles.taskStatus} ${styles[`status${(task.status || '').replace(/\s/g, '')}`]}`}
          >
            {task.status || 'Unknown'}
          </span>
        )
      },
      {
        key: 'reviewer',
        title: 'Reviewer',
        render: (task) => task.reviewerName || '—'
      },
      {
        key: 'deadline',
        title: 'Deadline',
        render: (task) =>
          task.deadline
            ? new Date(task.deadline).toLocaleDateString('vi-VN')
            : '—'
      }
    ];

    // Status mapping: chỉ có 'ToDo' / 'InProgress' / 'Done' (hoặc biến thể chữ thường)
    const normalizedStatus = (status) => {
      const s = (status || '').toString().toLowerCase();
      if (s === 'todo') return 'todo';
      if (s === 'inprogress') return 'inProgress';
      if (s === 'done' || s === 'completed') return 'done';
      return s;
    };

    const completedCount = cellTasks.filter(
      (t) => normalizedStatus(t.status) === 'done'
    ).length;
    const todoCount = cellTasks.filter(
      (t) => normalizedStatus(t.status) === 'todo'
    ).length;
    const inProgressCount = cellTasks.filter(
      (t) => normalizedStatus(t.status) === 'inProgress'
    ).length;
    const pendingCount = todoCount + inProgressCount;

    return (
      <div className={styles.taskListContainer}>
        <div className={styles.taskSummary}>
          <span>Total: {cellTasks.length} tasks</span>
          <span className={styles.completedCount}>Done: {completedCount}</span>
          <span className={styles.pendingCount}>Todo/In Progress: {pendingCount}</span>
        </div>

        <DataTable
          columns={taskColumns}
          data={cellTasks}
          loading={loadingCellTasks}
          emptyMessage="No tasks found for this student in this milestone"
          showIndex={true}
          indexTitle="No"
          onRowClick={(task) => {
            if (!task?.id || !selectedGroup) return;
            window.open(`/supervisor/task/group/${selectedGroup}?taskId=${task.id}`, '_blank');
          }}
        />
      </div>
    );
  };


  // Fetch toàn bộ thống kê của sinh viên
  const fetchStudentStatistics = async (student) => {
    try {
      setLoadingStatistics(true);
      
      // Không filter theo milestone - lấy tất cả
      const statsResponse = await getStudentEvaluationStatistics({
        groupId: parseInt(selectedGroup, 10),
        studentId: parseInt(student.studentId, 10)
      });

      const statsData = statsResponse?.data || statsResponse || {};
      const taskStats = statsData.taskStats || {
        totalTasks: 0,
        completedTasks: 0,
        uncompletedTasks: 0,
      };
      
      // Lấy evaluations từ API response
      const evaluations = Array.isArray(statsData.evaluations) ? statsData.evaluations : [];
        
      // Tổng hợp thống kê (chỉ giữ thông tin cơ bản + task + evaluations, bỏ meeting)
      const statistics = {
        basicInfo: {
          name: student.name,
          studentId: student.id,
          role: student.role || 'Member',
          email: student.email || 'N/A'
        },
        taskStats,
        evaluations: evaluations // Lưu evaluations từ API
      };
      
      setStudentStatistics(statistics);
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      setStudentStatistics(null);
    } finally {
      setLoadingStatistics(false);
    }
  };

  // Fetch thống kê cho tất cả students trong group
  const fetchAllStudentsStatistics = async (studentsList) => {
    if (!selectedGroup || !studentsList || !studentsList.length) return;
    
    setLoadingAllStatistics(true);
    try {
      const statsPromises = studentsList.map(student => 
        getStudentEvaluationStatistics({
          groupId: parseInt(selectedGroup, 10),
          studentId: parseInt(student.studentId, 10)
        }).then(response => {
          const statsData = response?.data || response || {};
          return {
            student: {
              id: student.id,
              name: student.name,
              role: student.role || 'Member',
              email: student.email || 'N/A'
            },
            taskStats: statsData.taskStats || {
              totalTasks: 0,
              completedTasks: 0,
              uncompletedTasks: 0,
            },
            evaluations: Array.isArray(statsData.evaluations) ? statsData.evaluations : []
          };
        }).catch(error => {
          console.error(`Error fetching stats for student ${student.id}:`, error);
          return {
            student: {
              id: student.id,
              name: student.name,
              role: student.role || 'Member',
              email: student.email || 'N/A'
            },
            taskStats: {
              totalTasks: 0,
              completedTasks: 0,
              uncompletedTasks: 0,
            },
            evaluations: []
          };
        })
      );

      const allStats = await Promise.all(statsPromises);
      setAllStudentsStatistics(allStats);
    } catch (error) {
      console.error('Error fetching all students statistics:', error);
      setAllStudentsStatistics([]);
    } finally {
      setLoadingAllStatistics(false);
    }
  };

  // ------------------ Fetch Tasks for Cell (Student x Milestone) ------------------
  const fetchCellTasks = async (student, milestone) => {
    setLoadingCellTasks(true);
    setCellTasks([]);
    setCurrentEvaluation(null);
    try {
      const response = await getStudentEvaluationDetail({
        groupId: parseInt(selectedGroup, 10),
        studentId: parseInt(student.studentId, 10),
        deliverableId: parseInt(milestone.id, 10)
      });

      const data = response?.data || response || {};
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      const evaluation = data.currentEvaluation || null;

      setCellTasks(tasks);
      setCurrentEvaluation(evaluation);
      
      // Return evaluation để sử dụng ngay
      return evaluation;
    } catch (error) {
      console.error('Error fetching cell tasks:', error);
      setCellTasks([]);
      setCurrentEvaluation(null);
      return null;
    } finally {
      setLoadingCellTasks(false);
    }
  };

  // Mở modal hiển thị tasks của sinh viên trong milestone
  const openTaskModal = (student, milestone) => {
    setSelectedCellStudent(student);
    setSelectedCellMilestone(milestone);
    setTaskModal(true);
    fetchCellTasks(student, milestone);
  };

  // Tính toán thống kê task cho từng ô (student x milestone)
  const getCellTaskStats = (student, milestone) => {
    // Lọc evaluations theo student và milestone
    const studentEvaluations = evaluations.filter(e => 
      e.receiverId === parseInt(student.studentId) &&
      (e.deliverableId === parseInt(milestone.id) || e.deliverableName === milestone.name)
    );
    
    const latestEval = studentEvaluations.length > 0 
      ? studentEvaluations.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0]
      : null;
    
    return {
      hasEvaluation: !!latestEval,
      evaluation: latestEval
    };
  };

  const submitEvaluation = async () => {
    if (!newEvaluation.feedback) {
      alert("Please select a feedback level before submitting.");
      return;
    }

    try {
      // Xử lý deliverableId - luôn lấy trực tiếp từ milestoneId đang mở trong modal
      const deliverableId = parseInt(newEvaluation.milestoneId, 10);
      if (!deliverableId || Number.isNaN(deliverableId)) {
        alert("Error: Invalid deliverable (milestone) ID");
        return;
      }

      // Lấy shortValue (type) từ lựa chọn feedback
      const feedbackShortValue = feedbackStatements.find(s => s.value === newEvaluation.feedback)?.shortValue || newEvaluation.feedback;
      
      // Nếu đã có currentEvaluation, gọi API update
      if (currentEvaluation && currentEvaluation.id) {
        const updatePayload = {
          feedback: newEvaluation.notes || "",
          deliverableId: deliverableId,
          type: feedbackShortValue // "excellent" | "good" | "poor"
        };

        const response = await updateEvaluationAPI(currentEvaluation.id, updatePayload);

        // Check if response is successful
        // Response có thể là { status: 200, message: "...", data: {...} } hoặc chỉ là data
        const isSuccess = response?.status === 200 || 
                         (!response?.error && !response?.status) || 
                         (response?.data && !response?.data?.error);
        
        if (isSuccess) {
          // Cập nhật currentEvaluation và evaluations list
          const responseData = response?.data || response || {};
          const updatedEvaluation = {
            ...currentEvaluation,
            type: feedbackShortValue,
            feedback: newEvaluation.notes || "",
            deliverableId: deliverableId,
            updateAt: responseData.updateAt || new Date().toISOString()
          };
          
          setCurrentEvaluation(updatedEvaluation);
          
          // Cập nhật trong danh sách evaluations
          setEvaluations(prevEvaluations => {
            return prevEvaluations.map(evaluation => {
              if (evaluation.id === currentEvaluation.id || evaluation.evaluationId === currentEvaluation.id) {
                return {
                  ...evaluation,
                  ...updatedEvaluation
                };
              }
              return evaluation;
            });
          });

          // Đóng modal và hiển thị thông báo
          alert("Evaluation updated successfully!");
          setStudentDetailModal(false);
          return;
        } else {
          alert(`Error: ${response?.data?.message || response?.message || 'Unable to update evaluation'}`);
          return;
        }
      }

      // Nếu chưa có evaluation, tạo mới
      const payload = {
        receiverId: parseInt(newEvaluation.studentId, 10),
        groupId: parseInt(selectedGroup, 10),
        deliverableId,
        type: feedbackShortValue,         // "excellent" | "good" | "poor"
        feedback: newEvaluation.notes || "" // ghi chú chi tiết
      };

      // Validation trước khi gửi
      if (!payload.receiverId || Number.isNaN(payload.receiverId)) {
        alert('Error: Invalid student ID');
        return;
      }
      if (!payload.groupId || Number.isNaN(payload.groupId)) {
        alert('Error: Invalid group ID');
        return;
      }
      if (!payload.type || payload.type.trim() === '') {
        alert('Please select feedback level');
        return;
      }

      const response = await createEvaluation(payload);


      // Check if response is successful (status 200 or no error)
      if (response?.status === 200 || !response?.error) {
        // Add new evaluation to state for immediate UI update
        if (response?.data) {
          const responseData = response.data;
          const newEvaluationData = {
            ...responseData,
            id: responseData?.id, // Save real evaluationId from server
            evaluationId: responseData?.id, // Use new evaluationId from API
            receiverId: responseData?.receiverId || responseData?.id,
            studentName: selectedStudent?.name || 'Unknown',
            evaluatorName: 'Instructor',
            // Ensure all necessary information is available
            deliverableName: selectedMilestoneData?.name || 'Unknown Milestone',
            createAt: responseData?.createAt || new Date().toISOString(),
            penaltyCards: responseData?.penaltyCards || [],
            // Keep server data to display correctly in columns
            type: responseData?.type,
            feedback: responseData?.feedback || '',
            notes: responseData?.feedback || ''
          };
          
          // Thêm vào đầu danh sách để hiển thị ngay lập tức
          setEvaluations(prevEvaluations => [newEvaluationData, ...prevEvaluations]);
          
        }
        
        // // Gửi email thông báo SAU KHI submit thành công (đã tắt theo yêu cầu)
        // try {
        //   const selectedStudent = studentsToEvaluate.find(s => s.studentId === newEvaluation.studentId);
        //   const selectedMilestoneData = selectedGroupData?.milestones?.find(m => m.id === newEvaluation.milestoneId);
        //   
        //   if (selectedStudent && selectedStudent.email) {
        //     const feedbackText = feedbackStatements.find(s => s.value === newEvaluation.feedback)?.text || newEvaluation.feedback;
        //     await sendEvaluationNotification({
        //       recipients: [selectedStudent.email],
        //       studentName: selectedStudent.name,
        //       milestoneName: selectedMilestoneData?.name || 'Overall Evaluation',
        //       feedback: feedbackText,
        //       notes: newEvaluation.notes || "",
        //       penaltyCards: [],
        //       evaluatorName: 'Instructor',
        //       subject: `Evaluation milestone: ${selectedMilestoneData?.name || 'Overall'}`,
        //       cc: []
        //     });
        //   }
        // } catch (emailError) {
        //   // Không hiển thị lỗi email cho user, chỉ log
        // }
        
        setStudentDetailModal(false);
        setStudentDetailModal(false);
        alert("Evaluation submitted successfully!");
      } else {
        alert(`Error: ${response?.data?.message || response?.message || 'Unable to create evaluation'}`);
      }
    } catch (err) {
      
      let errorMessage = "Unable to send evaluation.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data) {
        errorMessage = JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  const updateEvaluation = async () => {
    if (!editEvaluation.feedback) {
      alert("Please select a feedback level before updating.");
      return;
    }

    // Lấy evaluationId đúng để gọi API update
    const evaluationIdForUpdate =
      editEvaluation.id || selectedEvaluation?.evaluationId || selectedEvaluation?.id || null;

    if (!evaluationIdForUpdate) {
      alert("Unable to update evaluation: Missing evaluationId from API. Please update backend to return id in GET API, or provide API to lookup id by (receiverId, groupId, deliverableId).");
      return;
    }

    try {
      // Xử lý deliverableId - nếu là "all" hoặc rỗng thì không gửi
      let deliverableId = null;
      if (editEvaluation.milestoneId && editEvaluation.milestoneId !== "all") {
        const parsedId = parseInt(editEvaluation.milestoneId);
        if (!isNaN(parsedId)) {
          deliverableId = parsedId;
        }
      }

      // Lấy type (mã ngắn) theo lựa chọn feedback; feedback text lấy từ Notes nhập vào
      const feedbackShortValue = feedbackStatements.find(s => s.value === editEvaluation.feedback)?.shortValue || editEvaluation.feedback;

      // Payload update: type = shortValue; feedback = notes nhập vào (text)
      const payload = {
        type: feedbackShortValue,           // ví dụ: good, excellent, fair, average, poor
        feedback: editEvaluation.notes || "", // gửi nội dung ghi chú làm feedback
        ...(deliverableId !== null && { deliverableId })
      };


      
      // Use new API endpoint to update evaluation
      const response = await updateEvaluationAPI(evaluationIdForUpdate, payload);

      // Check if response is successful
      if (response?.status === 200 || !response?.error) {
        // Close modal first
        setStudentDetailModal(false);
        
        // Cập nhật state evaluations trực tiếp để UI refresh ngay lập tức
        const updatedData = response?.data || response || {};
        
        setEvaluations(prevEvaluations => {
          return prevEvaluations.map(evaluation => {
            // Kiểm tra nhiều điều kiện để tìm đúng evaluation cần cập nhật
            const isTargetEvaluation = (
              evaluation.evaluationId === evaluationIdForUpdate ||
              evaluation.id === evaluationIdForUpdate ||
              (evaluation.receiverId === parseInt(editEvaluation.studentId) && 
               evaluation.deliverableId === parseInt(editEvaluation.milestoneId)) ||
              (evaluation.receiverId === parseInt(editEvaluation.studentId) && 
               evaluation.deliverableName === selectedMilestoneData?.name)
            );
            
            if (isTargetEvaluation) {
              // Cập nhật evaluation với dữ liệu mới từ server
              return {
                ...evaluation,
                // Giữ nguyên giá trị server
                type: updatedData.type || evaluation.type,
                feedback: updatedData.feedback || evaluation.feedback,
                notes: updatedData.feedback || updatedData.notes || evaluation.notes || '',
                penaltyCards: updatedData.penaltyCards || evaluation.penaltyCards || [],
                createAt: updatedData.updateAt || updatedData.createAt || evaluation.createAt,
                receiverId: updatedData.receiverId || evaluation.receiverId,
                evaluationId: evaluationIdForUpdate || evaluation.evaluationId,
                // Đảm bảo có đầy đủ thông tin để hiển thị
                studentName: selectedStudent?.name || evaluation.studentName,
                evaluatorName: evaluation.evaluatorName || 'Instructor',
                deliverableName: selectedMilestoneData?.name || evaluation.deliverableName,
                deliverableId: updatedData.deliverableId || evaluation.deliverableId
              };
            }
            return evaluation;
          });
        });
        
        // Trigger refresh cho DataTable
        setRefreshTrigger(prev => prev + 1);
        
        // Show success message từ server
        alert(response?.message || "Evaluation updated successfully!");
        
        // // Gửi email thông báo SAU KHI cập nhật thành công (đã tắt theo yêu cầu)
        // try {
        //   const selectedStudent = studentsToEvaluate.find(s => s.studentId === editEvaluation.studentId);
        //   const selectedMilestoneData = selectedGroupData?.milestones?.find(m => m.id === editEvaluation.milestoneId);
        //   
        //   if (selectedStudent && selectedStudent.email) {
        //     const feedbackText = feedbackStatements.find(s => s.value === editEvaluation.feedback)?.text || editEvaluation.feedback;
        //     await sendEvaluationNotification({
        //       recipients: [selectedStudent.email],
        //       studentName: selectedStudent.name,
        //       milestoneName: selectedMilestoneData?.name || 'Overall Evaluation',
        //       feedback: feedbackText,
        //       notes: editEvaluation.notes || "",
        //       penaltyCards: [],
        //       evaluatorName: 'Instructor',
        //       subject: `Updated evaluation milestone: ${selectedMilestoneData?.name || 'Overall'}`,
        //       cc: []
        //     });
        //   }
        // } catch (emailError) {
        //   // Không hiển thị lỗi email cho user, chỉ log
        // }
        
      } else {
        alert(`Error: ${response?.data?.message || response?.message || 'Unable to update evaluation'}`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Unable to update evaluation.";
      alert(`Error: ${errorMessage}`);
    }
  };

  if (loading && semesters.length === 0) {
    return <div className={sharedLayout.loading}>Loading data...</div>;
  }

  // Hiển thị thông báo khi chưa chọn nhóm - filter component luôn hiển thị
  if (!selectedGroup) {
    return (
      <div className={sharedLayout.container}>
        <div className={sharedLayout.header}>
          <h1>Student Evaluation</h1>
        </div>
        <div className={styles.controls}>
          <SupervisorGroupFilter
            semesters={semesters}
            selectedSemesterId={selectedSemesterId}
            onSemesterChange={(newSemesterId) => {
              setSelectedSemesterId(newSemesterId);
              // Clear data when semester changes
              setSelectedGroup(null);
              setSelectedMilestone('all');
              setEvaluations([]);
              setPenaltyCards([]);
            }}
            groupExpireFilter={groupExpireFilter}
            onGroupExpireFilterChange={(newFilter) => {
              setGroupExpireFilter(newFilter);
              // Clear data when filter changes
              setSelectedGroup(null);
              setSelectedMilestone('all');
              setEvaluations([]);
              setPenaltyCards([]);
            }}
            groups={groups.map(g => ({ id: g.groupId, name: g.groupName }))}
            selectedGroupId={selectedGroup || ''}
            onGroupChange={setSelectedGroup}
            groupSelectPlaceholder="Select group"
            loading={loading}
          />
        </div>
        <div className={sharedLayout.noSelection}>
          <p>Please select a group</p>
          <p>You will see group information and document list after selection.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={sharedLayout.container}>
        <div className={sharedLayout.header}>
          <h1>Student Evaluation</h1>
        </div>

        <div className={styles.controls}>
          <SupervisorGroupFilter
            semesters={semesters}
            selectedSemesterId={selectedSemesterId}
            onSemesterChange={(newSemesterId) => {
              setSelectedSemesterId(newSemesterId);
              // Clear data when semester changes
              setSelectedGroup(null);
              setSelectedMilestone('all');
              setEvaluations([]);
              setPenaltyCards([]);
            }}
            groupExpireFilter={groupExpireFilter}
            onGroupExpireFilterChange={(newFilter) => {
              setGroupExpireFilter(newFilter);
              // Clear data when filter changes
              setSelectedGroup(null);
              setSelectedMilestone('all');
              setEvaluations([]);
              setPenaltyCards([]);
            }}
            groups={groups.map(g => ({ id: g.groupId, name: g.groupName }))}
            selectedGroupId={selectedGroup || ''}
            onGroupChange={setSelectedGroup}
            groupSelectPlaceholder="Select group"
            loading={loading}
          />
        </div>

        {/* ------------------ Group Overview: Milestone List ------------------ */}
        <div className={sharedLayout.contentSection}>
          <h2>Group Evaluation Overview</h2>
          <p className={styles.matrixDescription}>
            Click on a milestone to view and evaluate students
          </p>
          
          {/* Milestone List */}
          {!selectedOverviewMilestone ? (
            <div className={styles.milestoneListContainer}>
              {selectedGroupData?.milestones?.length > 0 ? (
                <div className={styles.milestoneGrid}>
                  {selectedGroupData.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={styles.milestoneCard}
                      onClick={() => setSelectedOverviewMilestone(milestone)}
                      style={{
                        cursor: 'pointer',
                        padding: '16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        background: '#fff',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }}
                    >
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        {milestone.name}
                      </h3>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                        Click to view students
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noMatrixData}>
                  No milestones found for this group
                </div>
              )}
            </div>
          ) : (
            /* Students List for Selected Milestone */
            <div>
              <div className={styles.milestoneHeader}>
                <button
                  onClick={() => setSelectedOverviewMilestone(null)}
                  className={styles.backButton}
                >
                  ← Back to Milestones
                </button>
                <h3 className={styles.milestoneTitle}>
                  {selectedOverviewMilestone.name}
                </h3>
              </div>
              
              {studentsToEvaluate.length > 0 ? (
                <div className={styles.studentListCompact}>
                  {studentsToEvaluate.map((student) => {
                    const cellStats = getCellTaskStats(student, selectedOverviewMilestone);
                      return (
                      <div
                        key={student.studentId}
                        className={styles.studentItemCompact}
                        onClick={async () => {
                          // Load tasks và evaluation data
                          await openStudentDetailModal(student, selectedOverviewMilestone);
                        }}
                        title="Click to view tasks, evaluation and statistics"
                      >
                        <div className={styles.studentNameCompact}>
                          <strong>{student.name}</strong>
                          <span className={styles.studentIdCompact}>({student.id})</span>
                        </div>
                        {cellStats.hasEvaluation && (
                          <span className={styles.evaluationBadgeCompact}>
                            {mapFeedbackToText(
                              cellStats.evaluation?.type || cellStats.evaluation?.feedback
                            )}
                          </span>
                        )}
                        </div>
                      );
                  })}
                </div>
            ) : (
              <div className={styles.noMatrixData}>
                  No students found for evaluation
              </div>
            )}
          </div>
          )}
        </div>

        {/* ------------------ Group Statistics Section ------------------ */}
        {selectedGroup && (
          <div className={sharedLayout.contentSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Group Statistics</h2>
              <Button
                variant="ghost"
                size="small"
                onClick={async () => {
                  if (!showStatistics) {
                    // Tính toán studentsToEvaluate khi click
                    let studentsToEvaluateForStats = [];
                    if (!selectedMilestone || selectedMilestone === "all") {
                      if (selectedGroupData?.milestones) {
                        const allStudents = new Map();
                        selectedGroupData.milestones.forEach(milestone => {
                          if (milestone.students) {
                            milestone.students.forEach(student => {
                              if (!allStudents.has(student.studentId)) {
                                allStudents.set(student.studentId, student);
                              }
                            });
                          }
                        });
                        studentsToEvaluateForStats = Array.from(allStudents.values());
                      }
                    } else {
                      studentsToEvaluateForStats = selectedMilestoneData?.students || [];
                    }
                    
                    if (studentsToEvaluateForStats.length > 0) {
                      await fetchAllStudentsStatistics(studentsToEvaluateForStats);
                    }
                  }
                  setShowStatistics(!showStatistics);
                }}
              >
                {showStatistics ? 'Hide Statistics' : 'Show Statistics'}
              </Button>
      </div>

            {showStatistics && (
              <div className={styles.statisticsContainer}>
                {loadingAllStatistics ? (
                  <div className={styles.loadingStatistics}>
                    <p>Loading statistics...</p>
            </div>
                ) : allStudentsStatistics.length === 0 ? (
                  <div className={styles.noStatistics}>
                    <p>No statistics data available.</p>
              </div>
                ) : (
                  <>
                    {/* Summary Overview */}
                    <div className={styles.statisticsSummary}>
                      <div className={styles.summaryCard}>
                        <div className={styles.summaryContent}>
                          <div className={styles.summaryValue}>{allStudentsStatistics.length}</div>
                          <div className={styles.summaryLabel}>Total Students</div>
                      </div>
                    </div>
                      <div className={styles.summaryCard}>
                        <div className={styles.summaryContent}>
                          <div className={styles.summaryValue}>
                            {allStudentsStatistics.reduce((sum, stat) => sum + (stat.taskStats.completedTasks || 0), 0)}
                    </div>
                          <div className={styles.summaryLabel}>Completed Tasks</div>
                        </div>
                      </div>
                      <div className={styles.summaryCard}>
                        <div className={styles.summaryContent}>
                          <div className={styles.summaryValue}>
                            {(() => {
                              const total = allStudentsStatistics.reduce((sum, stat) => sum + (stat.taskStats.totalTasks || 0), 0);
                              const completed = allStudentsStatistics.reduce((sum, stat) => sum + (stat.taskStats.completedTasks || 0), 0);
                              return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
                            })()}%
                          </div>
                          <div className={styles.summaryLabel}>Overall Completion</div>
                        </div>
                      </div>
                      <div className={styles.summaryCard}>
                        <div className={styles.summaryContent}>
                          <div className={styles.summaryValue}>
                            {allStudentsStatistics.reduce((sum, stat) => sum + stat.evaluations.length, 0)}
                          </div>
                          <div className={styles.summaryLabel}>Total Evaluations</div>
                        </div>
              </div>
            </div>

                    {/* Students Statistics Table */}
                    <div className={styles.statisticsTableWrapper}>
                      <table className={styles.statisticsTable}>
                        <thead>
                          <tr>
                            <th style={{ width: '20%' }}>Student</th>
                            <th style={{ width: '12%' }}>Total Tasks</th>
                            <th style={{ width: '12%' }}>Completed</th>
                            <th style={{ width: '12%' }}>Pending</th>
                            <th style={{ width: '16%' }}>Completion Rate</th>
                            <th style={{ width: '28%' }}>Number of Evaluations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allStudentsStatistics.map((stat, index) => {
                            const percentage = stat.taskStats.totalTasks > 0
                              ? ((stat.taskStats.completedTasks / stat.taskStats.totalTasks) * 100)
                              : 0;
                            
                            return (
                              <tr key={stat.student.id || index}>
                                <td style={{ textAlign: 'center' }}>
                                  <div className={styles.studentInfoCellInline}>
                                    <span className={styles.studentNameWithId}>
                                      {stat.student.name} ({stat.student.id})
                                    </span>
                                    <span className={`${styles.roleBadge} ${
                                      stat.student.role === 'Leader' ? styles.roleLeader :
                                      stat.student.role === 'Secretary' ? styles.roleSecretary :
                                      styles.roleMember
                                    }`}>
                                      {stat.student.role === 'Leader' ? 'Leader' :
                                       stat.student.role === 'Secretary' ? 'Secretary' :
                                       'Member'}
                                    </span>
                                  </div>
                                </td>
                                <td className={styles.numberCell}>{stat.taskStats.totalTasks || 0}</td>
                                <td className={`${styles.numberCell} ${styles.successValue}`}>
                                  {stat.taskStats.completedTasks || 0}
                                </td>
                                <td className={`${styles.numberCell} ${styles.warningValue}`}>
                                  {stat.taskStats.uncompletedTasks || 0}
                                </td>
                                <td className={styles.numberCell}>
                                  <span className={styles.percentageText}>{percentage.toFixed(1)}%</span>
                                </td>
                                <td className={styles.numberCell}>
                                  {stat.evaluations.length > 0 ? (
                                    <span 
                                      className={styles.clickableEvaluationCount}
                                      onClick={() => {
                                        setSelectedStudentForHistory(stat);
                                        setEvaluationHistoryModal(true);
                                      }}
                                    >
                                      {stat.evaluations.length}
                                    </span>
                                  ) : (
                                    <span className={styles.noData}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
            </div>
                  </>
              )}
          </div>
        )}
          </div>
        )}

      </div>

      {/* ------------------ Student Detail Modal (Tasks & Evaluation) ------------------ */}
      <Modal open={studentDetailModal} onClose={() => setStudentDetailModal(false)}>
        {selectedStudent && (
          <div className={styles.evaluateModal}>
            <h2>Student Details</h2>
            
            <div className={styles.studentInfo}>
              <h3>{selectedStudent.name}</h3>
              <p className={styles.studentCode}>Student ID: {selectedStudent.id}</p>
              <p>
                Milestone:{" "}
                {selectedCellMilestone?.name || selectedOverviewMilestone?.name || "N/A"}
              </p>
            </div>

            {/* Content wrapper with flex: 1 and overflow */}
            <div style={{ 
              flex: '1 1 auto', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              minHeight: 0,
              maxHeight: 'calc(90vh - 250px)'
            }}>
              <div style={{ 
                flex: '1 1 auto',
                overflowY: 'auto', 
                overflowX: 'hidden', 
                width: '100%',
                minHeight: 0
              }}>
                {/* Tasks Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>Tasks</h3>
                  {renderCellTasksSection()}
              </div>

                {/* Evaluation Section - Below Tasks */}
                <div className={styles.evaluationSection}>
                  <h3 className={styles.evaluationTitle}>Evaluation</h3>
                    <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Feedback *</label>
                      <div className={styles.feedbackOptions}>
                        {feedbackStatements.map((statement) => (
                          <label key={statement.value} className={styles.feedbackOption}>
                            <input
                              type="radio"
                            name="feedback"
                              value={statement.value}
                            checked={newEvaluation.feedback === statement.value}
                              onChange={(e) =>
                              setNewEvaluation({ ...newEvaluation, feedback: e.target.value })
                              }
                              className={styles.radioInput}
                              required
                            />
                            <span className={styles.feedbackText}>{statement.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Notes</label>
                      <textarea
                      value={newEvaluation.notes}
                        onChange={(e) =>
                        setNewEvaluation({ ...newEvaluation, notes: e.target.value })
                        }
                        placeholder="Provide notes for the student..."
                        rows={4}
                        className={styles.textarea}
                      />
                    </div>
                </div>
              </div>
            </div>

            {/* Modal Actions - Always at bottom */}
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setStudentDetailModal(false)}
              >
                Close
              </Button>
              <Button onClick={submitEvaluation}>
                {currentEvaluation ? "Save" : "Submit Evaluation"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ------------------ Task List Modal (Click on Matrix Cell) ------------------ */}
      <Modal open={taskModal} onClose={() => setTaskModal(false)}>
        {selectedCellStudent && selectedCellMilestone && (
          <div className={styles.evaluateModal}>
            <h2>Tasks Overview</h2>
            
            <div className={styles.studentInfo}>
              <h3>{selectedCellStudent.name}</h3>
              <p className={styles.studentCode}>Student ID: {selectedCellStudent.id}</p>
              <p>Milestone: {selectedCellMilestone.name}</p>
            </div>

            {loadingCellTasks ? (
              <div className={styles.loadingStatistics}>
                <p>Loading tasks...</p>
              </div>
            ) : cellTasks.length > 0 ? (
              <div className={styles.taskListContainer}>
                <div className={styles.taskSummary}>
                  <span>Total: {cellTasks.length} tasks</span>
                  <span className={styles.completedCount}>
                    Completed: {cellTasks.filter(t => t.status === 'Done' || t.status === 'Completed').length}
                  </span>
                  <span className={styles.pendingCount}>
                    Pending: {cellTasks.filter(t => t.status !== 'Done' && t.status !== 'Completed').length}
                  </span>
                </div>
                <div className={styles.taskList}>
                  {cellTasks.map((task, index) => (
                    <div 
                      key={task.id || index} 
                      className={`${styles.taskItem} ${task.status === 'Done' || task.status === 'Completed' ? styles.taskCompleted : styles.taskPending}`}
                      onClick={() => {
                        // Navigate to supervisor task detail page
                        if (!selectedGroup) return;
                        window.open(`/supervisor/task/group/${selectedGroup}?taskId=${task.id}`, '_blank');
                      }}
                      title="Click to view task details"
                    >
                      <div className={styles.taskHeader}>
                        <span className={styles.taskName}>{task.name || task.title || 'Unnamed Task'}</span>
                        <span className={`${styles.taskStatus} ${styles[`status${task.status?.replace(/\s/g, '')}`]}`}>
                          {task.status || 'Unknown'}
                        </span>
                      </div>
                      <div className={styles.taskDetails}>
                        {task.deadline && (
                          <span className={styles.taskDeadline}>
                            Deadline: {new Date(task.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                        {task.progress !== undefined && (
                          <span className={styles.taskProgress}>
                            Progress: {task.progress}%
                          </span>
                        )}
                        {task.assignerName && (
                          <span className={styles.taskAssigner}>
                            Assigned by: {task.assignerName}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <div className={styles.taskDescription}>
                          {task.description.length > 100 
                            ? `${task.description.substring(0, 100)}...` 
                            : task.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.noStatistics}>
                <p>No tasks found for this student in this milestone.</p>
              </div>
            )}

            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setTaskModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ------------------ Evaluation History Modal ------------------ */}
      <Modal open={evaluationHistoryModal} onClose={() => setEvaluationHistoryModal(false)}>
        {selectedStudentForHistory && (
          <div className={styles.evaluateModal}>
            <h2>Evaluation History</h2>
            
            <div className={styles.studentInfo}>
              <h3>{selectedStudentForHistory.student.name}</h3>
              <p className={styles.studentCode}>Student ID: {selectedStudentForHistory.student.id}</p>
            </div>

            <div className={styles.evaluationHistoryContent}>
              {selectedStudentForHistory.evaluations.length === 0 ? (
                <div className={styles.noStatistics}>
                  <p>No evaluations found for this student.</p>
                </div>
              ) : (
                <div className={styles.evaluationHistoryList}>
                  {selectedStudentForHistory.evaluations
                    .sort((a, b) => new Date(b.createAt || 0) - new Date(a.createAt || 0))
                    .map((evalItem, idx) => (
                      <div key={idx} className={styles.evaluationHistoryItem}>
                        <div className={styles.evalItemHeader}>
                          <span className={styles.evalMilestone}>{evalItem.deliverableName || 'N/A'}</span>
                          <span className={styles.evalFeedbackBadge}>
                            {mapFeedbackToText(evalItem.type || evalItem.feedback)}
                          </span>
                        </div>
                        {evalItem.feedback && (
                          <div className={styles.evalNotes}>{evalItem.feedback}</div>
                        )}
                        <div className={styles.evalMeta}>
                          <span className={styles.evalDate}>
                            {evalItem.createAt 
                              ? new Date(evalItem.createAt).toLocaleString('en-US', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '—'}
                          </span>
                          {evalItem.evaluatorName && (
                            <span className={styles.evalEvaluator}>by {evalItem.evaluatorName}</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setEvaluationHistoryModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </>
  );
}
