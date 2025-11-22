import React from "react";
import styles from "./index.module.scss";
import sharedLayout from "../sharedLayout.module.scss";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import DataTable from "../../../components/DataTable/DataTable";
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from "../../../auth/auth";
import { getCapstoneGroupDetail } from "../../../api/staff/groups";
import { getDeliverablesByGroup } from "../../../api/deliverables";
import { getEvaluationsByMentorDeliverable, getPenaltyCardsByMilestone, createEvaluation, updateEvaluation } from "../../../api/evaluation";
import SupervisorGroupFilter from "../../../components/SupervisorGroupFilter/SupervisorGroupFilter";

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

  // Feedback statements (theo mức độ giảm dần)
  const feedbackStatements = [
    { 
      value: "exceeds", 
      text: "Exceeds requirements",
      shortValue: "excellent",  // Giá trị gửi lên backend
      level: 1
    },
    { 
      value: "fully_meets", 
      text: "Fully meets requirements",
      shortValue: "good",  // Giá trị gửi lên backend
      level: 2
    },
    { 
      value: "mostly_meets", 
      text: "Mostly meets requirements",
      shortValue: "fair",  // Giá trị gửi lên backend
      level: 3
    },
    { 
      value: "basic", 
      text: "Meets basics, lacks detail",
      shortValue: "average",  // Giá trị gửi lên backend
      level: 4
    },
    { 
      value: "below_standard", 
      text: "Below standard",
      shortValue: "poor",  // Giá trị gửi lên backend
      level: 5
    }
  ];
  const [evaluations, setEvaluations] = React.useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = React.useState(false);
  const [penaltyCards, setPenaltyCards] = React.useState([]);
  const [loadingPenaltyCards, setLoadingPenaltyCards] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [studentStatistics, setStudentStatistics] = React.useState(null);
  const [loadingStatistics, setLoadingStatistics] = React.useState(false);
  const [semesters, setSemesters] = React.useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState(null);
  const [groupExpireFilter, setGroupExpireFilter] = React.useState('active'); // 'active' or 'expired'

  // ------------------ Fetch Evaluations ------------------
  const fetchEvaluations = async () => {
    if (!selectedGroup) return;
    
    setLoadingEvaluations(true);
    try {
      // If no milestone selected or "all" selected, get all evaluations for the group
      const params = {
        groupId: selectedGroup,
        _t: Date.now() // Cache-busting parameter
      };
      
      // Only add deliverableId if specific milestone is selected
      if (selectedMilestone && selectedMilestone !== "all") {
        params.deliverableId = selectedMilestone;
      }
      
      const response = await getEvaluationsByMentorDeliverable(selectedGroup, selectedMilestone !== "all" ? selectedMilestone : null);
      
      // Check if response.data is array directly
      if (Array.isArray(response)) {
        setEvaluations(response);
      } else if (response.status === 200) {
        const evaluationsData = response.data || [];
        setEvaluations(evaluationsData);
      } else if (Array.isArray(response.data)) {
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

  // ------------------ Force Refresh Evaluations ------------------
  const forceRefreshEvaluations = async () => {
    setEvaluations([]); // Clear current evaluations first
    await fetchEvaluations();
    setRefreshTrigger(prev => prev + 1);
  };

  // ------------------ Fetch Evaluations when milestone changes ------------------
  React.useEffect(() => {
    if (selectedGroup) {
      fetchEvaluations();
    }
  }, [selectedGroup, selectedMilestone]);
  

  // ------------------ Load Semesters and Groups ------------------
  React.useEffect(() => {
    function loadSemesters() {
      const uniqueSemesters = getUniqueSemesters();
      setSemesters(uniqueSemesters);
      
      const currentSemesterId = getCurrentSemesterId();
      if (currentSemesterId) {
        setSelectedSemesterId(currentSemesterId);
      } else if (uniqueSemesters.length > 0) {
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
    const selectedGroupExists = selectedGroup && groupsFromStorage.some(g => g.id.toString() === selectedGroup);
    
    if (selectedGroup && !selectedGroupExists) {
      // Selected group is not in filtered list, clear selection and data
      setSelectedGroup(null);
      setSelectedMilestone('all');
      setEvaluations([]);
      setPenaltyCards([]);
    }
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

        console.log('API Response - studentRes:', studentRes);
        console.log('API Response - milestoneRes:', milestoneRes);

        // Handle different API response formats
        let studentData;
        if (studentRes) {
          // studentRes là object { data: {...}, status: 200, message: '...' } từ getCapstoneGroupDetail
          if (studentRes.status === 200 && studentRes.data) {
            studentData = studentRes.data;
          } else if (studentRes.data) {
            // Fallback: nếu có data nhưng không có status
            studentData = studentRes.data;
          } else if (studentRes.status === 200) {
            // Fallback: nếu có status nhưng data ở root level
            studentData = studentRes;
          }
        }

        if (studentData) {
          // milestoneRes là object { data: [...], status: 200, message: '...' } từ getDeliverablesByGroup
          let milestoneData = [];
          if (milestoneRes) {
            if (milestoneRes.status === 200 && Array.isArray(milestoneRes.data)) {
              milestoneData = milestoneRes.data;
            } else if (Array.isArray(milestoneRes.data)) {
              milestoneData = milestoneRes.data;
            } else if (Array.isArray(milestoneRes)) {
              milestoneData = milestoneRes;
            }
          }


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

          setGroups((prev) =>
            prev.map((g) =>
              g.groupId === selectedGroup
                ? {
                    ...g,
                    groupName: studentData?.projectName || g.groupName,
                    milestones,
                  }
                : g
            )
          );

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
  const columns = [
    {
      key: 'name',
      title: 'Name',
      render: (student) => student.name
    },
    {
      key: 'studentId',
      title: 'Student ID',
      render: (student) => student.id
    },
    {
      key: 'role',
      title: 'Role',
      render: (student) => {
        const roleMap = {
          'Leader': 'Leader',
          'Secretary': 'Secretary',
          'Member': 'Member',
          'Student': 'Member'
        };
        return roleMap[student.role] || student.role;
      }
    },
    {
      key: 'type-feedback',
      title: 'Feedback',
      headerStyle: { width: '250px', minWidth: '250px' },
      cellStyle: { width: '250px', minWidth: '250px' },
      render: (student) => {
        // Lấy evaluation mới nhất theo milestone đang chọn
        const studentEvaluation = getLatestEvaluationForStudent(student);
        
        
        if (studentEvaluation) {
          // Hiển thị text của TYPE; fallback map từ feedback nếu thiếu type
          const displayText = mapFeedbackToText(studentEvaluation.type || studentEvaluation.feedback || '');
          return (
            <div className={styles.feedbackContent}>
              <span className={styles.feedbackText}>{displayText}</span>
            </div>
          );
        }
        
        return <span className={styles.noComment}>No feedback yet</span>;
      }
    },
    {
      key: 'notes',
      title: 'Notes',
      headerStyle: { width: '300px', minWidth: '300px' },
      cellStyle: { width: '300px', minWidth: '300px' },
      render: (student) => {
        const studentEvaluation = getLatestEvaluationForStudent(student);
      // Ưu tiên notes; fallback feedback. Ẩn nếu trùng text type
      const raw = studentEvaluation
        ? (String(studentEvaluation.notes || '').trim() || String(studentEvaluation.feedback || '').trim())
        : '';
      const isTypeText = raw
        ? feedbackStatements.some(s => s.text.toLowerCase() === raw.toLowerCase())
        : false;
      const notesText = raw && !isTypeText ? raw : '';
      if (studentEvaluation && notesText) {
          return (
            <div className={styles.commentPreview}>
              {notesText}
            </div>
          );
        }
        return <span className={styles.noComment}>No notes</span>;
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (student) => {
        // Lấy evaluation mới nhất theo milestone đang chọn
        const studentEvaluation = getLatestEvaluationForStudent(student);
        
        // Chặn đánh giá khi chưa chọn milestone cụ thể
        const isMilestoneSelected = selectedMilestone && selectedMilestone !== "all";

        return (
          <div className={styles.actions}>
            {!studentEvaluation ? (
              <Button 
                variant="primary"
                size="small"
                onClick={() => openEvaluateModal(student)}
                disabled={!isMilestoneSelected}
                title={!isMilestoneSelected ? "Vui lòng chọn milestone cụ thể để đánh giá" : ""}
              >
                Evaluate
              </Button>
            ) : (
              <Button 
                variant="secondary"
                size="small"
                onClick={() => openEditModal(student, studentEvaluation)}
                disabled={!isMilestoneSelected}
                title={!isMilestoneSelected ? "Vui lòng chọn milestone cụ thể để chỉnh sửa" : ""}
              >
                Edit
              </Button>
            )}
            <Button 
              variant="ghost"
              size="small"
              onClick={() => openStatisticsModal(student)}
              title="Xem thống kê đánh giá"
            >
              Thống kê
            </Button>
          </div>
        );
      }
    }
  ];

  // ------------------ Fetch Penalty Cards ------------------
  const fetchPenaltyCards = async () => {
    if (!selectedGroup) return;
    
    setLoadingPenaltyCards(true);
    try {
      const response = await getPenaltyCardsByMilestone(selectedGroup);
      
      if (response.status === 200) {
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
  const openEvaluateModal = async (student) => {
    // Chặn mở modal nếu chưa chọn milestone cụ thể
    if (!selectedMilestone || selectedMilestone === "all") {
      alert("Vui lòng chọn milestone cụ thể để đánh giá sinh viên.");
      return;
    }
    
    setSelectedStudent(student);
    setNewEvaluation({
      studentId: student.studentId, // Sử dụng studentId để gọi API
      milestoneId: selectedMilestoneData?.id || "",
      feedback: "",
      notes: "",
    });
    setEvaluateModal(true);
  };

  const openEditModal = async (student, evaluation) => {
    // Chặn mở modal nếu chưa chọn milestone cụ thể
    if (!selectedMilestone || selectedMilestone === "all") {
      alert("Vui lòng chọn milestone cụ thể để chỉnh sửa đánh giá.");
      return;
    }
    
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

    setEditEvaluation({
      id: evaluationId?.toString?.() || "",
      studentId: student.studentId, // Đã là string từ API
      milestoneId: resolvedMilestoneId || "",
      feedback: feedbackValueFromType || getFeedbackValue(evaluation.feedback || ""),
      notes: evaluation.feedback || evaluation.notes || evaluation.comment || "", // Notes lấy từ feedback text của API
    });
    setEditModal(true);
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

  // Fetch meetings và đếm số buổi họp tham gia/vắng mặt
  const fetchMeetingAttendance = async (groupId, studentName, studentId) => {
    try {
      // Lấy danh sách meetings của group
      const meetingsResponse = await axiosClient.get(`/Student/Meeting/group/${groupId}/schedule-dates`);
      
      console.log('Meeting response:', meetingsResponse.data);
      
      if (meetingsResponse.data.status !== 200) {
        console.log('Meeting response status not 200:', meetingsResponse.data.status);
        return { 
          totalMeetings: 0, 
          totalMeetingsHeld: 0,
          attendedMeetings: 0, 
          absentMeetings: 0,
          absences: []
        };
      }
      
      const meetings = meetingsResponse.data.data || [];
      const totalMeetings = meetings.length;
      let totalMeetingsHeld = 0; // Tổng số buổi họp đã diễn ra (isMeeting === true)
      let attendedMeetings = 0;
      let absentMeetings = 0;
      const absences = [];
      
      console.log('Total meetings:', totalMeetings);
      console.log('Student info:', { studentName, studentId });
      if (meetings.length > 0) {
        console.log('First meeting sample:', meetings[0]);
        console.log('Meeting keys:', Object.keys(meetings[0]));
        console.log('isMeeting value:', meetings[0].isMeeting, 'type:', typeof meetings[0].isMeeting);
      }
      
      // Đếm số buổi họp tham gia và vắng mặt
      for (const meeting of meetings) {
        // Kiểm tra buổi họp đã diễn ra - xử lý nhiều format khác nhau
        const isMeetingHeld = meeting.isMeeting === true || 
                              meeting.isMeeting === 1 || 
                              meeting.isMeeting === 'true' ||
                              String(meeting.isMeeting || '').toLowerCase() === 'true';
        
        // Đếm tổng số buổi họp đã diễn ra
        if (isMeetingHeld) {
          totalMeetingsHeld++;
          console.log('Meeting held:', meeting.id, meeting.description, 'isMinute:', meeting.isMinute, 'isMeeting:', meeting.isMeeting);
          
          // Chỉ kiểm tra có mặt/vắng mặt nếu có biên bản
          const hasMinute = meeting.isMinute === true || 
                           meeting.isMinute === 1 || 
                           meeting.isMinute === 'true' ||
                           String(meeting.isMinute).toLowerCase() === 'true';
          
          if (hasMinute) {
            try {
              const minuteResponse = await axiosClient.get(`/MeetingMinute?meetingDateId=${meeting.id}`);
              if (minuteResponse.data.status === 200 && minuteResponse.data.data) {
                const minuteData = minuteResponse.data.data;
                const attendance = minuteData.attendance || '';
                
                console.log('Meeting minute attendance:', attendance);
                
                // Kiểm tra nếu tên hoặc MSSV của sinh viên có trong danh sách tham gia
                const attendanceLower = attendance.toLowerCase();
                const studentNameLower = studentName.toLowerCase();
                const isAttended = attendance && (
                  attendanceLower.includes(studentNameLower) ||
                  attendance.includes(studentId) ||
                  attendance.includes(String(studentId))
                );
                
                console.log('Is attended:', isAttended);
                
                if (isAttended) {
                  attendedMeetings++;
                } else {
                  // Vắng mặt: buổi họp đã diễn ra nhưng không có trong danh sách tham gia
                  absentMeetings++;
                  absences.push({
                    meetingId: meeting.id,
                    meetingDate: meeting.meetingDate,
                    meetingDescription: meeting.description || 'N/A',
                    reason: minuteData.other || minuteData.issue || 'Không có lý do'
                  });
                }
              }
            } catch (err) {
              // Bỏ qua nếu không lấy được biên bản
              console.error('Error fetching meeting minute:', err);
            }
          }
        }
      }
      
      const result = { 
        totalMeetings, 
        totalMeetingsHeld, // Tổng số buổi họp đã diễn ra
        attendedMeetings, 
        absentMeetings,
        absences
      };
      
      console.log('Meeting stats result:', result);
      
      return result;
    } catch (error) {
      console.error('Error fetching meeting attendance:', error);
      return { 
        totalMeetings: 0, 
        totalMeetingsHeld: 0,
        attendedMeetings: 0, 
        absentMeetings: 0,
        absences: []
      };
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
      
      // Fetch thống kê meeting
      const meetingStats = selectedGroup 
        ? await fetchMeetingAttendance(selectedGroup, student.name, student.id)
        : { totalMeetings: 0, totalMeetingsHeld: 0, attendedMeetings: 0, absentMeetings: 0, absences: [] };
      
      console.log('Meeting stats:', meetingStats);
      
      // Tổng hợp thống kê
      const statistics = {
        // Thông tin cơ bản
        basicInfo: {
          name: student.name,
          studentId: student.id,
          role: student.role || 'Member',
          email: student.email || 'N/A'
        },
        // Thống kê task
        taskStats: taskStats || {
          totalTasks: 0,
          completedTasks: 0,
          uncompletedTasks: 0
        },
        // Thống kê meeting
        meetingStats: meetingStats
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

  const submitEvaluation = async () => {
    if (!newEvaluation.feedback) {
      alert("Please select a feedback level before submitting.");
      return;
    }

    try {
      // Xử lý deliverableId - thử lấy milestone thật từ API nếu có
      let deliverableId = null;
      if (newEvaluation.milestoneId && newEvaluation.milestoneId !== "all") {
        const parsedId = parseInt(newEvaluation.milestoneId);
        if (!isNaN(parsedId)) {
          deliverableId = parsedId;
        }
      } else if (newEvaluation.milestoneId === "all") {
        // Khi chọn "all", thử lấy milestone đầu tiên từ API thật
        try {
          const milestoneRes = await getDeliverablesByGroup(selectedGroup);
          const milestoneData = milestoneRes?.data || milestoneRes;
          if (Array.isArray(milestoneData) && milestoneData.length > 0) {
            deliverableId = milestoneData[0].id;
          }
        } catch (err) {
        }
      }

      // Lấy shortValue (type) từ lựa chọn feedback
      const feedbackShortValue = feedbackStatements.find(s => s.value === newEvaluation.feedback)?.shortValue || newEvaluation.feedback;
      
      // Thử các format payload khác nhau
      let payload;
      if (deliverableId !== null) {
        payload = {
          receiverId: parseInt(newEvaluation.studentId),
          feedback: newEvaluation.notes || "", // API yêu cầu feedback = Notes
          type: feedbackShortValue,             // API yêu cầu type = shortValue
          groupId: parseInt(selectedGroup),
          deliverableId: deliverableId
        };
      } else {
        // Không gửi deliverableId nếu không có
        payload = {
          receiverId: parseInt(newEvaluation.studentId),
          feedback: newEvaluation.notes || "", // API yêu cầu feedback = Notes
          type: feedbackShortValue,             // API yêu cầu type = shortValue
          groupId: parseInt(selectedGroup)
        };
      }


      // Validation trước khi gửi
      if (!payload.receiverId || isNaN(payload.receiverId)) {
        alert('Error: Invalid student ID');
        return;
      }
      if (!payload.groupId || isNaN(payload.groupId)) {
        alert('Error: Invalid group ID');
        return;
      }
      if (!payload.type || payload.type.trim() === '') {
        alert('Please select feedback level');
        return;
      }

      const response = await createEvaluation(payload);


      // Check if response is successful (status 200 or no error)
      if (response.status === 200 || !response.error) {
        // Add new evaluation to state for immediate UI update
        if (response.data) {
          const newEvaluationData = {
            ...response.data,
            id: response.data.id, // Save real evaluationId from server
            evaluationId: response.data.id, // Use new evaluationId from API
            receiverId: response.data.receiverId || response.data.id,
            studentName: selectedStudent?.name || 'Unknown',
            evaluatorName: 'Instructor',
            // Ensure all necessary information is available
            deliverableName: selectedMilestoneData?.name || 'Unknown Milestone',
            createAt: response.data.createAt || new Date().toISOString(),
            penaltyCards: response.data.penaltyCards || [],
            // Keep server data to display correctly in columns
            type: response.data.type,
            feedback: response.data.feedback || '',
            notes: response.data.feedback || ''
          };
          
          // Thêm vào đầu danh sách để hiển thị ngay lập tức
          setEvaluations(prevEvaluations => [newEvaluationData, ...prevEvaluations]);
          
        }
        
        // Trigger refresh cho DataTable
        setRefreshTrigger(prev => prev + 1);
        
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
        alert(`Error: ${response.data.message || 'Unable to create evaluation'}`);
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
      const response = await updateEvaluation(evaluationIdForUpdate, payload);

      // Check if response is successful
      if (response.status === 200 || !response.error) {
        // Close modal first
        setEditModal(false);
        
        // Show success message from server
        alert(response.message || "Evaluation updated successfully!");
        
        // Update directly to state for immediate UI refresh
        const updatedData = response.data;
        
        // Tìm và cập nhật evaluation trong state
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
              // Cập nhật evaluation với dữ liệu mới
              const updatedEvaluation = {
                ...evaluation,
                // Giữ nguyên giá trị server
                type: updatedData.type || evaluation.type,
                feedback: updatedData.feedback || evaluation.feedback,
                notes: updatedData.feedback || evaluation.notes || '',
                penaltyCards: updatedData.penaltyCards || [],
                createAt: updatedData.updateAt || evaluation.createAt,
                receiverId: updatedData.receiverId || evaluation.receiverId,
                evaluationId: evaluationIdForUpdate || evaluation.evaluationId,
                // Đảm bảo có đầy đủ thông tin để hiển thị
                studentName: selectedStudent?.name || evaluation.studentName,
                evaluatorName: evaluation.evaluatorName || 'Instructor',
                deliverableName: selectedMilestoneData?.name || evaluation.deliverableName
              };
              
              return updatedEvaluation;
            }
            return evaluation;
          });
        });
        
        // Trigger refresh cho DataTable
        setRefreshTrigger(prev => prev + 1);
        
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
        alert(`Error: ${response.data.message || 'Unable to update evaluation'}`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Unable to update evaluation.";
      alert(`Error: ${errorMessage}`);
    }
  };

  if (loading) {
    return <div className={sharedLayout.loading}>Loading data...</div>;
  }

  if (groups.length === 0) {
    return <div className={sharedLayout.loading}>No groups found.</div>;
  }

  // Hiển thị thông báo khi chưa chọn nhóm
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
            onSemesterChange={setSelectedSemesterId}
            groupExpireFilter={groupExpireFilter}
            onGroupExpireFilterChange={setGroupExpireFilter}
            groups={groups.map(g => ({ id: g.groupId, name: g.groupName }))}
            selectedGroupId={selectedGroup || ''}
            onGroupChange={setSelectedGroup}
            groupSelectPlaceholder="Select group"
            loading={loading}
          />
        </div>
        <div className={sharedLayout.noSelection}>
          <p>Please select a group to view student list and evaluations.</p>
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
            onSemesterChange={setSelectedSemesterId}
            groupExpireFilter={groupExpireFilter}
            onGroupExpireFilterChange={setGroupExpireFilter}
            groups={groups.map(g => ({ id: g.groupId, name: g.groupName }))}
            selectedGroupId={selectedGroup || ''}
            onGroupChange={setSelectedGroup}
            groupSelectPlaceholder="Select group"
            loading={loading}
          />
          <div className={styles.controlGroup} style={{ marginTop: '10px' }}>
            <label>Deliverables:</label>
            <select
              value={selectedMilestone || ""}
              onChange={(e) => {
                setSelectedMilestone(e.target.value);
              }}
              className={styles.select}
            >
              {/* <option value="">Chọn milestone</option> */}
              <option value="all">Select Milestone</option>
              {selectedGroupData?.milestones?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={sharedLayout.contentSection}>
          <h2>Student evaluation table</h2>
          <div className={styles.tableContainer}>
            <DataTable
              key={`evaluation-table-${refreshTrigger}`}
              columns={columns}
              data={studentsToEvaluate}
              loading={loading}
              emptyMessage="No students found for evaluation"
            />
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
              <p>Milestone: {selectedMilestoneData?.name}</p>
            </div>

            <div className={styles.formGroup}>
              <label>Feedback *</label>
              <div className={styles.feedbackOptions}>
                {feedbackStatements.map((statement, index) => (
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
              <p>Milestone: {selectedMilestoneData?.name}</p>
            </div>

            <div className={styles.formGroup}>
              <label>Feedback *</label>
              <div className={styles.feedbackOptions}>
                {feedbackStatements.map((statement, index) => (
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
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Số buổi meeting tham gia</span>
                      <span className={styles.statValue}>{studentStatistics.meetingStats.attendedMeetings}</span>
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

                {/* Tham gia họp */}
                <div className={styles.statisticsSection}>
                  <h3 className={styles.sectionTitle}>Tham gia họp</h3>
                  <div className={styles.statisticsGrid}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Số buổi họp có mặt</span>
                      <span className={`${styles.statValue} ${styles.successValue}`}>
                        {studentStatistics.meetingStats.attendedMeetings}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Số buổi họp vắng mặt</span>
                      <span className={`${styles.statValue} ${styles.errorValue}`}>
                        {studentStatistics.meetingStats.absentMeetings || 0}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Tổng buổi meeting đã diễn ra</span>
                      <span className={styles.statValue}>
                        {(() => {
                          const totalHeld = studentStatistics.meetingStats?.totalMeetingsHeld;
                          if (totalHeld !== undefined && totalHeld !== null) {
                            return totalHeld;
                          }
                          const attended = studentStatistics.meetingStats?.attendedMeetings || 0;
                          const absent = studentStatistics.meetingStats?.absentMeetings || 0;
                          return attended + absent;
                        })()}
                      </span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Tỷ lệ tham gia</span>
                      <span className={`${styles.statValue} ${styles.percentageValue}`}>
                        {(() => {
                          const totalHeld = studentStatistics.meetingStats?.totalMeetingsHeld;
                          const total = totalHeld !== undefined && totalHeld !== null 
                            ? totalHeld 
                            : ((studentStatistics.meetingStats?.attendedMeetings || 0) + (studentStatistics.meetingStats?.absentMeetings || 0));
                          const attended = studentStatistics.meetingStats?.attendedMeetings || 0;
                          return total > 0 ? ((attended / total) * 100).toFixed(1) : 0;
                        })()}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Danh sách buổi vắng mặt với lý do */}
                  {studentStatistics.meetingStats.absences && studentStatistics.meetingStats.absences.length > 0 && (
                    <div className={styles.absencesList}>
                      <h4 className={styles.absencesTitle}>Danh sách buổi vắng mặt ({studentStatistics.meetingStats.absences.length})</h4>
                      {studentStatistics.meetingStats.absences.map((absence, index) => {
                        const meetingDate = absence.meetingDate 
                          ? new Date(absence.meetingDate).toLocaleDateString('vi-VN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Ngày không xác định';
                        
                        return (
                          <div key={absence.meetingId || index} className={styles.absenceItem}>
                            <div className={styles.absenceHeader}>
                              <span className={styles.absenceDate}>{meetingDate}</span>
                              <span className={styles.absenceDescription}>{absence.meetingDescription}</span>
                            </div>
                            <div className={styles.absenceReason}>
                              <strong>Lý do:</strong> {absence.reason}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Milestone hiện tại (nếu có) */}
                {selectedMilestone && selectedMilestone !== "all" && selectedMilestoneData && (
                  <div className={styles.milestoneInfo}>
                    <p><em>Thống kê được lọc theo milestone: <strong>{selectedMilestoneData.name}</strong></em></p>
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

    </>
  );
}
