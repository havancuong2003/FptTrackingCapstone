import React from "react";
import styles from "./index.module.scss";
import sharedLayout from "../sharedLayout.module.scss";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import DataTable from "../../../components/DataTable/DataTable";
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from "../../../auth/auth";
import { getCapstoneGroupDetail } from "../../../api/staff/groups";
import { getDeliverablesByGroup } from "../../../api/deliverables";
import { getEvaluationsByMentorDeliverable, getPenaltyCardsByMilestone, createEvaluation, updateEvaluation as updateEvaluationAPI } from "../../../api/evaluation";
import SupervisorGroupFilter from "../../../components/SupervisorGroupFilter/SupervisorGroupFilter";
import axiosClient from "../../../utils/axiosClient";

// API endpoints - using axiosClient

export default function SupervisorEvaluation() {
  const [groups, setGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [evaluateModal, setEvaluateModal] = React.useState(false);
  const [editModal, setEditModal] = React.useState(false);
  const [statisticsModal, setStatisticsModal] = React.useState(false);
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
  const [statisticsTab, setStatisticsTab] = React.useState("overview"); // 'overview' | 'history'
  const [evaluationTab, setEvaluationTab] = React.useState("tasks"); // 'tasks' | 'evaluation'

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
          console.log('milestoneData2', milestoneData);
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
  console.log('selectedGroupData', selectedGroupData);
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


  // ------------------ Modal Logic ------------------
  const openEvaluateModal = async (student, milestone = null) => {
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
    setEvaluationTab("tasks");

    // Load tasks cho ô hiện tại
    if (effectiveMilestone) {
      fetchCellTasks(student, effectiveMilestone);
    } else {
      setCellTasks([]);
    }

    setNewEvaluation({
      studentId: student.studentId, // Sử dụng studentId để gọi API
      milestoneId: effectiveMilestone?.id?.toString?.() || "",
      feedback: "",
      notes: "",
    });
    setEvaluateModal(true);
  };

  const openEditModal = async (student, evaluation) => {
    setSelectedStudent(student);
    setSelectedEvaluation(evaluation);
    
    // Lấy đúng evaluationId từ bản ghi đánh giá để gọi API update
    // Ưu tiên evaluationId mới từ API, sau đó là id, cuối cùng là receiverId
    const evaluationId = (
      evaluation?.evaluationId ?? evaluation?.id ?? evaluation?.receiverId ?? null
    );
    
    // Xác định deliverableId đã được dùng trước đó cho evaluation này
    // 1) Ưu tiên lấy trực tiếp từ evaluation nếu có
    let resolvedMilestoneId = evaluation.deliverableId?.toString?.() || evaluation.deliverableID?.toString?.() || "";
    // 2) Nếu không có, map từ deliverableName sang id trong danh sách milestones của nhóm
    if (!resolvedMilestoneId && evaluation.deliverableName && Array.isArray(selectedGroupData?.milestones)) {
      const matchedMilestone = selectedGroupData.milestones.find(m => m.name === evaluation.deliverableName);
      if (matchedMilestone?.id) {
        resolvedMilestoneId = matchedMilestone.id;
      }
    }
    // 3) Fallback cuối cùng: dùng milestone đang chọn trên UI nếu có
    if (!resolvedMilestoneId && selectedMilestoneData?.id) {
      resolvedMilestoneId = selectedMilestoneData.id;
    }
    
    
    // Map feedback từ API sang value (tìm theo text, value, hoặc shortValue)
    const getFeedbackValue = (feedback) => {
      if (!feedback) return "";
      const feedbackStr = feedback.toString().trim();
      const feedbackLower = feedbackStr.toLowerCase();
      
      // Tìm theo shortValue (excellent, good, fair, average, poor) - ưu tiên cho giá trị mới từ backend
      const matchedByShortValue = feedbackStatements.find(statement => 
        statement.shortValue === feedbackLower || 
        statement.shortValue === feedbackStr
      );
      if (matchedByShortValue) return matchedByShortValue.value;
      
      // Tìm theo text đầy đủ
      const matchedStatement = feedbackStatements.find(statement => 
        statement.text === feedbackStr || 
        feedbackStr.includes(statement.text) ||
        statement.value === feedbackStr
      );
      
      if (matchedStatement) return matchedStatement.value;
      
      // Tìm theo từ khóa tiếng Anh
      if (feedbackLower.includes("comprehensive") || feedbackLower.includes("exceeding")) return "exceeds";
      if (feedbackLower.includes("strong understanding") || (feedbackLower.includes("fully meets") && feedbackLower.includes("requirements"))) return "fully_meets";
      if (feedbackLower.includes("most") && feedbackLower.includes("requirements")) return "mostly_meets";
      if (feedbackLower.includes("basic") && (feedbackLower.includes("lacks") || feedbackLower.includes("detail"))) return "basic";
      if (feedbackLower.includes("does not meet") || feedbackLower.includes("minimum requirements")) return "below_standard";
      
      // Tìm theo từ khóa tiếng Việt (backward compatibility)
      if (feedbackLower.includes("toàn diện") || feedbackLower.includes("vượt yêu cầu")) return "exceeds";
      if (feedbackLower.includes("nắm vững") && feedbackLower.includes("đầy đủ")) return "fully_meets";
      if (feedbackLower.includes("phần lớn")) return "mostly_meets";
      if (feedbackLower.includes("cơ bản") || feedbackLower.includes("thiếu chi tiết")) return "basic";
      if (feedbackLower.includes("chưa đạt")) return "below_standard";
      if (feedbackLower.includes("hoàn thành đầy đủ") || feedbackLower.includes("chính xác")) return "fully_meets";
      
      return feedbackStr; // Giữ nguyên nếu không match
    };

    // Ưu tiên map theo TYPE từ API; fallback map từ feedback text
    const feedbackValueFromType = (() => {
      const t = (evaluation?.type || '').toString().trim().toLowerCase();
      if (!t) return '';
      const byShort = feedbackStatements.find(s => s.shortValue === t);
      if (byShort) return byShort.value;
      const byText = feedbackStatements.find(s => s.text.toLowerCase() === t);
      return byText ? byText.value : '';
    })();

    // Tìm milestone object tương ứng để hiển thị + load tasks
    let effectiveMilestone = null;
    if (resolvedMilestoneId && Array.isArray(selectedGroupData?.milestones)) {
      effectiveMilestone =
        selectedGroupData.milestones.find(m => m.id === resolvedMilestoneId) || null;
    }
    if (!effectiveMilestone && evaluation.deliverableName && Array.isArray(selectedGroupData?.milestones)) {
      effectiveMilestone =
        selectedGroupData.milestones.find(m => m.name === evaluation.deliverableName) || null;
    }

    setSelectedCellStudent(student);
    setSelectedCellMilestone(effectiveMilestone);
    setEvaluationTab("tasks");

    if (effectiveMilestone) {
      fetchCellTasks(student, effectiveMilestone);
    } else {
      setCellTasks([]);
    }

    setEditEvaluation({
      id: evaluationId?.toString?.() || "",
      studentId: student.studentId, // Đã là string từ API
      milestoneId: resolvedMilestoneId || "",
      feedback: feedbackValueFromType || getFeedbackValue(evaluation.feedback || ""),
      notes: evaluation.feedback || evaluation.notes || evaluation.comment || "", // Notes lấy từ feedback text của API
    });
    setEditModal(true);
  };

  // Khi click vào ô (student x milestone): nếu đã có evaluation thì mở Edit, chưa có thì mở Evaluate
  const handleMatrixCellClick = (student, milestone) => {
    const cellStats = getCellTaskStats(student, milestone);
    if (cellStats.hasEvaluation) {
      openEditModal(student, cellStats.evaluation);
    } else {
      openEvaluateModal(student, milestone);
    }
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
            if (!task?.id) return;
            window.open(`/student/tasks?taskId=${task.id}`, '_blank');
          }}
        />
      </div>
    );
  };

  const openStatisticsModal = async (student) => {
    setSelectedStudent(student);
    setStatisticsModal(true);
    setLoadingStatistics(true);
    setStudentStatistics(null);
    
    // Fetch statistics khi mở modal
    await fetchStudentStatistics(student);
  };

  // Fetch thống kê task từ API
  const fetchTaskStatistics = async (studentId, deliverableId = null) => {
    try {
      const params = {
        assigneeId: parseInt(studentId)
      };
      
      // Nếu có milestone được chọn, thêm deliverableId
      if (deliverableId && deliverableId !== "all") {
        params.deliverableId = parseInt(deliverableId);
      }
      
      const response = await axiosClient.get('/task/statistic/assignee', { params });
      
      // Xử lý nhiều format response khác nhau
      if (response.data) {
        // Format 1: { status: 200, data: {...} }
        if (response.data.status === 200 && response.data.data) {
          return response.data.data;
        }
        // Format 2: { totalTasks, completedTasks, uncompletedTasks } trực tiếp
        if (response.data.totalTasks !== undefined) {
          return response.data;
        }
        // Format 3: data trực tiếp trong response.data
        if (response.data.data && typeof response.data.data === 'object') {
          return response.data.data;
        }
      }
      
      // Fallback: trả về response.data nếu có
      return response.data || null;
    } catch (error) {
      console.error('Error fetching task statistics:', error);
      return null;
    }
  };

  // Fetch toàn bộ thống kê của sinh viên
  const fetchStudentStatistics = async (student) => {
    try {
      setLoadingStatistics(true);
      console.log('Fetching statistics for student:', student);
      
      const deliverableId = selectedMilestone && selectedMilestone !== "all" ? selectedMilestone : null;
      
      // Fetch thống kê task
      const taskStats = await fetchTaskStatistics(student.studentId, deliverableId);
      console.log('Task stats:', taskStats);
      
      // Tổng hợp thống kê (chỉ giữ thông tin cơ bản + task, bỏ meeting)
      const statistics = {
        basicInfo: {
          name: student.name,
          studentId: student.id,
          role: student.role || 'Member',
          email: student.email || 'N/A'
        },
        taskStats: taskStats || {
          totalTasks: 0,
          completedTasks: 0,
          uncompletedTasks: 0
        }
      };
      
      console.log('Final statistics:', statistics);
      setStudentStatistics(statistics);
    } catch (error) {
      console.error('Error fetching student statistics:', error);
      setStudentStatistics(null);
    } finally {
      setLoadingStatistics(false);
    }
  };

  // ------------------ Fetch Tasks for Cell (Student x Milestone) ------------------
  const fetchCellTasks = async (student, milestone) => {
    setLoadingCellTasks(true);
    setCellTasks([]);
    try {
      const params = {
        assigneeId: parseInt(student.studentId),
        deliverableId: parseInt(milestone.id)
      };
      
      const response = await axiosClient.get('/task', { params });
      
      let tasks = [];
      if (response?.data?.status === 200 && Array.isArray(response.data.data)) {
        tasks = response.data.data;
      } else if (Array.isArray(response?.data)) {
        tasks = response.data;
      } else if (Array.isArray(response)) {
        tasks = response;
      }
      
      setCellTasks(tasks);
    } catch (error) {
      console.error('Error fetching cell tasks:', error);
      setCellTasks([]);
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
      
      // Payload gửi lên backend: chỉ sử dụng đúng các field cần thiết
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
        
        setEvaluateModal(false);
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
        setEditModal(false);
        
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

        {/* ------------------ Group Overview Matrix (Student x Milestone) ------------------ */}
        <div className={sharedLayout.contentSection}>
          <h2>Group Evaluation Overview</h2>
          <p className={styles.matrixDescription}>
            Click on a cell to view all tasks for that student in the milestone
          </p>
          <div className={styles.matrixContainer}>
            {selectedGroupData?.milestones?.length > 0 && studentsToEvaluate.length > 0 ? (
              <DataTable
                className={styles.matrixDataTable}
                columns={[
                  {
                    key: 'student',
                    title: 'Student',
                    headerClassName: styles.matrixHeaderStudent,
                    cellClassName: styles.matrixStudentCell,
                    render: (student) => (
                      <div className={styles.studentCellInfo}>
                        <strong>{student.name}</strong>
                        <span className={styles.studentCellId}>{student.id}</span>
                      </div>
                    )
                  },
                  ...selectedGroupData.milestones.map((milestone) => ({
                    key: `milestone-${milestone.id}`,
                    title: milestone.name,
                    headerClassName: styles.matrixHeaderMilestone,
                    cellClassName: styles.matrixCell,
                    render: (student) => {
                      const cellStats = getCellTaskStats(student, milestone);
                      return (
                        <div
                          className={`${styles.matrixCellContent} ${cellStats.hasEvaluation ? styles.matrixCellEvaluated : styles.matrixCellPending}`}
                          onClick={() => handleMatrixCellClick(student, milestone)}
                          title={`Click để đánh giá/chỉnh sửa đánh giá cho ${student.name} ở ${milestone.name}`}
                        >
                          {cellStats.hasEvaluation ? (
                            <span className={styles.evaluationBadge}>
                              {mapFeedbackToText(
                                cellStats.evaluation?.type || cellStats.evaluation?.feedback
                              )}
                            </span>
                          ) : (
                            <span className={styles.pendingBadge}>Not evaluated</span>
                          )}
                        </div>
                      );
                    }
                  })),
                  {
                    key: 'actions',
                    title: 'Actions',
                    headerClassName: styles.matrixHeaderActions,
                    cellClassName: styles.matrixActionsCell,
                    render: (student) => {
                      return (
                        <div className={styles.actions}>
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => {
                              setStatisticsTab("overview");
                              openStatisticsModal(student);
                            }}
                            title="Xem thống kê đánh giá"
                          >
                            Thống kê
                          </Button>
                        </div>
                      );
                    }
                  }
                ]}
                data={studentsToEvaluate}
                loading={loading}
                emptyMessage="No students found for evaluation"
                showIndex={false}
              />
            ) : (
              <div className={styles.noMatrixData}>
                {!selectedGroupData?.milestones?.length
                  ? "No milestones found for this group"
                  : "No students found for evaluation"}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ------------------ Evaluate Modal ------------------ */}
      <Modal open={evaluateModal} onClose={() => setEvaluateModal(false)}>
        {selectedStudent && (
          <div className={styles.evaluateModal}>
            <h2>Evaluate Student</h2>
            
            <div className={styles.studentInfo}>
              <h3>{selectedStudent.name}</h3>
              <p className={styles.studentCode}>Student ID: {selectedStudent.id}</p>
              <p>
                Milestone:{" "}
                {selectedCellMilestone?.name || selectedMilestoneData?.name || "N/A"}
              </p>
            </div>

            {/* Tabs: Tasks | Evaluation */}
            <div className={styles.evaluationTabs}>
              <button
                type="button"
                className={`${styles.evaluationTabButton} ${evaluationTab === "tasks" ? styles.evaluationTabActive : ""}`}
                onClick={() => setEvaluationTab("tasks")}
              >
                Tasks
              </button>
              <button
                type="button"
                className={`${styles.evaluationTabButton} ${evaluationTab === "evaluation" ? styles.evaluationTabActive : ""}`}
                onClick={() => setEvaluationTab("evaluation")}
              >
                Evaluation
              </button>
            </div>

            {evaluationTab === "tasks" ? (
              renderCellTasksSection()
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label>Feedback *</label>
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
                  <label>Notes</label>
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

                <div className={styles.modalActions}>
                  <Button
                    variant="secondary"
                    onClick={() => setEvaluateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={submitEvaluation}>Submit Evaluation</Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ------------------ Edit Modal ------------------ */}
      <Modal open={editModal} onClose={() => setEditModal(false)}>
        {selectedStudent && selectedEvaluation && (
          <div className={styles.evaluateModal}>
            <h2>Edit Evaluation</h2>
            
            <div className={styles.studentInfo}>
              <h3>{selectedStudent.name}</h3>
              <p className={styles.studentCode}>Student ID: {selectedStudent.id}</p>
              <p>
                Milestone:{" "}
                {selectedCellMilestone?.name || selectedMilestoneData?.name || "N/A"}
              </p>
            </div>

            {/* Tabs: Tasks | Evaluation */}
            <div className={styles.evaluationTabs}>
              <button
                type="button"
                className={`${styles.evaluationTabButton} ${evaluationTab === "tasks" ? styles.evaluationTabActive : ""}`}
                onClick={() => setEvaluationTab("tasks")}
              >
                Tasks
              </button>
              <button
                type="button"
                className={`${styles.evaluationTabButton} ${evaluationTab === "evaluation" ? styles.evaluationTabActive : ""}`}
                onClick={() => setEvaluationTab("evaluation")}
              >
                Evaluation
              </button>
            </div>

            {evaluationTab === "tasks" ? (
              renderCellTasksSection()
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label>Feedback *</label>
                  <div className={styles.feedbackOptions}>
                    {feedbackStatements.map((statement) => (
                      <label key={statement.value} className={styles.feedbackOption}>
                        <input
                          type="radio"
                          name="feedback-edit"
                          value={statement.value}
                          checked={editEvaluation.feedback === statement.value}
                          onChange={(e) =>
                            setEditEvaluation({ ...editEvaluation, feedback: e.target.value })
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
                  <label>Notes</label>
                  <textarea
                    value={editEvaluation.notes}
                    onChange={(e) =>
                      setEditEvaluation({ ...editEvaluation, notes: e.target.value })
                    }
                    placeholder="Provide notes for the student..."
                    rows={4}
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.modalActions}>
                  <Button
                    variant="secondary"
                    onClick={() => setEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={updateEvaluation}>Update Evaluation</Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ------------------ Statistics Modal ------------------ */}
      <Modal open={statisticsModal} onClose={() => setStatisticsModal(false)}>
        {selectedStudent && (
          <div className={styles.evaluateModal}>
            <h2>Báo cáo tổng hợp</h2>
            
            {loadingStatistics ? (
              <div className={styles.loadingStatistics}>
                <p>Đang tải thống kê...</p>
              </div>
            ) : studentStatistics ? (
              <div className={styles.statisticsContent}>
                {/* Tabs */}
                <div style={{ display: 'flex', marginBottom: '16px', borderBottom: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => setStatisticsTab("overview")}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: statisticsTab === "overview" ? '2px solid #007bff' : '2px solid transparent',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontWeight: statisticsTab === "overview" ? '600' : '400'
                    }}
                  >
                    Tổng quan
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatisticsTab("history")}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: statisticsTab === "history" ? '2px solid #007bff' : '2px solid transparent',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontWeight: statisticsTab === "history" ? '600' : '400'
                    }}
                  >
                    Lịch sử đánh giá
                  </button>
                </div>

                {statisticsTab === "overview" && (
                  <>
                    {/* Thông tin cơ bản */}
                    <div className={styles.statisticsSection}>
                      <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
                      <div className={styles.statisticsGrid}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Tên</span>
                          <span className={styles.statValue}>{studentStatistics.basicInfo.name}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>MSSV</span>
                          <span className={styles.statValue}>{studentStatistics.basicInfo.studentId}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Vai trò</span>
                          <span className={styles.statValue}>
                            {studentStatistics.basicInfo.role === 'Leader' ? 'Leader' :
                             studentStatistics.basicInfo.role === 'Secretary' ? 'Secretary' :
                             'Member'}
                          </span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Email</span>
                          <span className={styles.statValue}>{studentStatistics.basicInfo.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Đóng góp tổng quan */}
                    <div className={styles.statisticsSection}>
                      <h3 className={styles.sectionTitle}>Đóng góp tổng quan</h3>
                      <div className={styles.statisticsGrid}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Tổng số task được giao</span>
                          <span className={styles.statValue}>{studentStatistics.taskStats.totalTasks || 0}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Số task đã hoàn thành</span>
                          <span className={`${styles.statValue} ${styles.successValue}`}>
                            {studentStatistics.taskStats.completedTasks || 0}
                          </span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Số task chưa hoàn thành</span>
                          <span className={`${styles.statValue} ${styles.warningValue}`}>
                            {studentStatistics.taskStats.uncompletedTasks || 0}
                          </span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Tỷ lệ hoàn thành</span>
                          <span className={`${styles.statValue} ${styles.percentageValue}`}>
                            {studentStatistics.taskStats.totalTasks > 0
                              ? ((studentStatistics.taskStats.completedTasks / studentStatistics.taskStats.totalTasks) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Milestone hiện tại (nếu có) */}
                    {selectedMilestone && selectedMilestone !== "all" && selectedMilestoneData && (
                      <div className={styles.milestoneInfo}>
                        <p><em>Thống kê được lọc theo milestone: <strong>{selectedMilestoneData.name}</strong></em></p>
                      </div>
                    )}
                  </>
                )}

                {statisticsTab === "history" && (
                  <div className={styles.statisticsSection}>
                    <h3 className={styles.sectionTitle}>Lịch sử đánh giá</h3>
                    {(() => {
                      const history = evaluations
                        .filter(e => 
                          e.receiverId === parseInt(selectedStudent.studentId) &&
                          isEvaluationInSelectedMilestone(e)
                        )
                        .sort((a, b) => new Date(b.createAt) - new Date(a.createAt));

                      if (!history.length) {
                        return (
                          <div className={styles.noStatistics}>
                            <p>Chưa có đánh giá nào cho sinh viên này.</p>
                          </div>
                        );
                      }

                      return (
                        <div className={styles.evaluationHistory}>
                        {history.map((ev, idx) => (
                            <div key={ev.evaluationId || ev.id || idx} className={styles.evaluationHistoryItem}>
                              <div className={styles.evaluationHistoryHeader}>
                                <span className={styles.evaluationHistoryMilestone}>
                                  {ev.deliverableName || selectedMilestoneData?.name || 'Milestone không xác định'}
                                </span>
                                <span className={styles.evaluationHistoryDate}>
                                  {ev.createAt ? new Date(ev.createAt).toLocaleString('vi-VN') : ''}
                                </span>
                              </div>
                              <div className={styles.evaluationHistoryBody}>
                                <div>
                                  <span className={styles.statLabel}>Feedback:</span>{' '}
                                  <span className={styles.statValue}>
                                    {mapFeedbackToText(ev.type || ev.feedback)}
                                  </span>
                                </div>
                        {(ev.feedback || ev.notes) && (
                                  <div>
                                    <span className={styles.statLabel}>Notes:</span>{' '}
                                    <span className={styles.statValue}>
                                      {ev.notes || ev.feedback}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noStatistics}>
                <p>Không thể tải thống kê. Vui lòng thử lại.</p>
              </div>
            )}

            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setStatisticsModal(false)}
              >
                Đóng
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
                        // Navigate to task tracking page
                        window.open(`/student/tasks?taskId=${task.id}`, '_blank');
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

    </>
  );
}
