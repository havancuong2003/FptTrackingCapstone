import React from "react";
import styles from "./index.module.scss";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import Select from "../../../components/Select/Select";

// Định nghĩa API Endpoint
const API_URL_GROUPS = 'https://160.30.21.113:5000/api/v1/Mentor/getGroups';
const API_URL_MILESTONE = 'https://160.30.21.113:5000/api/v1/Student/milestone/group/';
const API_URL_STUDENTS = 'https://160.30.21.113:5000/api/v1/Staff/capstone-groups/';

export default function SupervisorEvaluation() {
  const [evaluations, setEvaluations] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  // Đặt selectedGroup là null hoặc chuỗi rỗng ban đầu để đợi dữ liệu nhóm đầu tiên
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState("all");
  const [evaluateModal, setEvaluateModal] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [newEvaluation, setNewEvaluation] = React.useState({
    studentId: "",
    milestoneId: "",
    score: "",
    comment: "",
    penaltyCards: [],
    attendance: "present",
    lateTasks: 0,
  });

// ----------------------------------------------------------------------
// useEffect 1: Lấy danh sách nhóm cơ bản (chỉ ID và Name)
// ----------------------------------------------------------------------
React.useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL_GROUPS, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            
            // Xử lý lỗi 401 tại đây nếu cần
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result = await response.json();
            
            if (result && result.data && Array.isArray(result.data)) {
                const groupsData = result.data.map(group => ({
                    groupId: group.id.toString(), 
                    groupName: group.name,
                    milestones: [], // Khởi tạo mảng milestones rỗng
                }));
                
                setGroups(groupsData);
                
                if (groupsData.length > 0) {
                    setSelectedGroup(groupsData[0].groupId);
                }
            } else {
                setGroups([]);
            }
        } catch (error) {
            console.error('Error fetching initial groups data:', error);
        }
        // KHÔNG set loading=false ở đây, để useEffect thứ hai xử lý
    };
    fetchInitialData();
}, []);

// ----------------------------------------------------------------------
// useEffect 2: Lấy chi tiết (Milestone & Students) và Lồng ghép
// ----------------------------------------------------------------------
React.useEffect(() => {
    if (!selectedGroup) return;

    const fetchGroupDetails = async () => {
        setLoading(true); 
        try {
            // 1. LẤY MILESTONE (API 1)
            const milestonePromise = fetch(`${API_URL_MILESTONE}${selectedGroup}`, {
                method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            });

            // 2. LẤY SINH VIÊN (API MỚI)
            const studentsPromise = fetch(`${API_URL_STUDENTS}${selectedGroup}`, {
                method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            });

            const [milestoneResponse, studentsResponse] = await Promise.all([milestonePromise, studentsPromise]);

            if (!milestoneResponse.ok || !studentsResponse.ok) {
                 throw new Error("One or more detail APIs failed to load.");
            }

            const milestoneResult = await milestoneResponse.json();
            const studentsResult = await studentsResponse.json();
            
            // Lấy danh sách sinh viên từ API mới
            const rawStudents = studentsResult?.data?.students || [];

            // 3. LỒNG GHÉP DỮ LIỆU
            if (milestoneResult && Array.isArray(milestoneResult.data)) {
                // Ánh xạ danh sách sinh viên: Thêm trường evaluations rỗng
                const processedStudents = rawStudents.map(student => ({
                    id: student.id.toString(),
                    name: student.name,
                    role: student.role,
                    // Giả định các trường này không có, cần phải tự tạo
                    lateTasks: 0, 
                    penaltyCards: [], 
                    attendance: 'present',
                    // Đảm bảo evaluations tồn tại (hiện tại rỗng vì API chưa có)
                    evaluations: [], 
                }));

                // Lồng ghép danh sách sinh viên vào mỗi Milestone
                const newMilestones = milestoneResult.data.map(m => ({
                    ...m,
                    id: m.id.toString(), 
                    name: m.name,
                    // ⚠️ CHÈN DANH SÁCH SINH VIÊN ĐÃ XỬ LÝ VÀO TẤT CẢ CÁC MILESTONE
                    students: processedStudents, 
                }));

                // Cập nhật state 'groups'
                setGroups(prevGroups => prevGroups.map(group => {
                    if (group.groupId === selectedGroup) {
                        return { 
                            ...group, 
                            milestones: newMilestones,
                            // Thêm groupName từ API mới nếu cần
                            groupName: studentsResult?.data?.name || group.groupName 
                        };
                    }
                    return group;
                }));

                // Cập nhật selectedMilestone
                if (newMilestones.length > 0) {
                    setSelectedMilestone(newMilestones[0].id);
                } else {
                    setSelectedMilestone('all');
                }
            }
        } catch (error) {
            console.error(`Error fetching group details for ${selectedGroup}:`, error);
        } finally {
            setLoading(false); 
        }
    };

    fetchGroupDetails();

}, [selectedGroup]);

  // --- HÀM HỖ TRỢ VÀ LOGIC KHÁC VẪN GIỮ NGUYÊN (TRỪ ICON) ---

  const getScoreColor = (score) => {
    if (score >= 9) return "#059669";
    if (score >= 7) return "#d97706";
    return "#dc2626";
  };

  const getScoreText = (score) => {
    if (score >= 9) return "Excellent";
    if (score >= 7) return "Good";
    if (score >= 5) return "Average";
    return "Needs Improvement";
  };

  // REMOVED ICONS: getPenaltyCardInfo now returns only text and color
  const getPenaltyCardInfo = (type) => {
    switch (type) {
      case "late-submission":
        return { text: "Late Submission", color: "#d97706" };
      case "missing-meeting":
        return { text: "Missing Meeting", color: "#dc2626" };
      case "poor-quality":
        return { text: "Poor Quality", color: "#dc2626" };
      case "no-participation":
        return { text: "No Participation", color: "#dc2626" };
      default:
        return { text: type, color: "#64748b" };
    }
  };

  // REMOVED ICONS: getAttendanceInfo now returns only text and color
  const getAttendanceInfo = (attendance) => {
    switch (attendance) {
      case "present":
        return { text: "Present", color: "#059669" };
      case "absent":
        return { text: "Absent", color: "#dc2626" };
      case "late":
        return { text: "Late", color: "#d97706" };
      default:
        return { text: "Unknown", color: "#64748b" };
    }
  };

  const getPenaltyInfo = (type) => {
    switch (type) {
      case "late-submission":
        return { text: "Late Submission", color: "#d97706" };
      case "missing-meeting":
      case "poor-quality":
      case "no-participation":
        return { text: "Serious Infraction", color: "#dc2626" };
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get filtered data
  const selectedGroupData = groups.find(
    (group) => group.groupId === selectedGroup
  );
  const selectedMilestoneData = selectedGroupData?.milestones?.find(
    (m) => selectedMilestone === "all" || m.id.toString() === selectedMilestone
  );

  const studentsToEvaluate = selectedMilestoneData?.students || [];
  const allEvaluations =
    selectedGroupData?.milestones?.flatMap((m) =>
      m.students?.flatMap(
        (s) =>
          s.evaluations?.map((e) => ({
            ...e,
            studentId: s.id,
            studentName: s.name,
            milestoneName: m.name,
          })) || []
      )
    ) || [];

  const milestoneOptions =
    selectedGroupData?.milestones?.map((m) => ({
      value: m.id.toString(),
      label: m.name,
    })) || [];

  const openEvaluateModal = (student) => {
    setSelectedStudent(student);
    setNewEvaluation({
      studentId: student.id,
      milestoneId: selectedMilestoneData?.id?.toString() || "",
      score: "",
      comment: "",
      penaltyCards: [],
      attendance: student.attendance,
      lateTasks: student.lateTasks,
    });
    setEvaluateModal(true);
  };

  const submitEvaluation = () => {
    if (
      !newEvaluation.studentId ||
      !newEvaluation.score ||
      !newEvaluation.comment
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const evaluation = {
      id: Date.now(),
      studentId: newEvaluation.studentId,
      // NOTE: 'students' array is not defined in this scope for a clean find,
      // but the original logic assumes it exists or uses a fallback.
      // Keeping the original structure but noting this potential issue.
      studentName: selectedStudent?.name || "Unknown Student",
      milestoneId: newEvaluation.milestoneId,
      milestoneName:
        selectedMilestoneData?.name || `Milestone ${newEvaluation.milestoneId}`,
      comment: newEvaluation.comment,
      // Assuming a single penaltyTag for simplicity in the 'recent evaluations' list
      // which uses the old structure. Real-world would handle multiple cards better.
      penaltyTag:
        newEvaluation.penaltyCards.length > 0
          ? newEvaluation.penaltyCards[0]
          : null,
      score: parseFloat(newEvaluation.score),
      createdAt: new Date().toISOString(),
      createdBy: "SUPERVISOR001",
      createdByName: "Dr. Smith",
    };

    setEvaluations((prev) => [evaluation, ...prev]);
    setEvaluateModal(false);
    setNewEvaluation({
      studentId: "",
      milestoneId: "",
      score: "",
      comment: "",
      penaltyCards: [],
      attendance: "present",
      lateTasks: 0,
    });
    alert("Evaluation submitted successfully!");
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading evaluation data...</div>
      </div>
    );
  }

  // Hiển thị thông báo nếu không có nhóm nào được tải và không còn loading
  if (groups.length === 0) {
    return (
      <div className={styles.loading}>
        <div>No groups found or failed to load data.</div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Student Evaluation - Supervisor View</h1>
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <label>Group:</label>
              <Select
                value={selectedGroup}
                onChange={setSelectedGroup}
                options={groups.map((group) => ({
                  value: group.groupId,
                  label: `${group.groupName} (${group.groupId})`,
                }))}
              />
            </div>
            <div className={styles.controlGroup}>
              <label>Milestone:</label>
              <Select
                value={selectedMilestone}
                onChange={setSelectedMilestone}
                options={[
                  { value: "all", label: "All Milestones" },
                  ...milestoneOptions,
                ]}
              />
            </div>
          </div>
        </div>

        {selectedGroupData && (
          <>
            <div className={styles.groupInfo}>
              <h2>{selectedGroupData.groupName} ({selectedGroupData.groupId}) - Evaluation Summary</h2>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {studentsToEvaluate.length}
                  </div>
                  <div className={styles.statLabel}>Students</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {allEvaluations.length}
                  </div>
                  <div className={styles.statLabel}>Evaluations</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>
                    {studentsToEvaluate.length > 0
                      ? Math.round(
                          (allEvaluations.length / studentsToEvaluate.length) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className={styles.statLabel}>Completion Rate</div>
                </div>
              </div>
            </div>

            <div className={styles.evaluationTable}>
              <h2>Students Evaluation Table</h2>
              <div className={styles.tableContainer}>
                <table className={styles.evaluationTable}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Role</th>
                      <th>Late Tasks</th>
                      <th>Penalty Cards</th>
                      <th>Comment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsToEvaluate.map((student) => {
                      const latestEvaluation = student.evaluations?.[0];

                      return (
                        <tr key={student.id}>
                          <td>
                            <div className={styles.studentInfo}>
                              <strong>{student.name}</strong>
                              <span className={styles.studentId}>
                                ({student.id})
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.roleTag}>
                              {student.role}
                            </span>
                          </td>
                          <td>
                            <span className={styles.lateTasksCount}>
                              {student.lateTasks} tasks
                            </span>
                          </td>
                          <td>
                            <div className={styles.penaltyCards}>
                              {student.penaltyCards.length > 0 ? (
                                student.penaltyCards.map((card, index) => {
                                  const penaltyInfo = getPenaltyCardInfo(
                                    card.type
                                  );
                                  return (
                                    <span
                                      key={index}
                                      className={styles.penaltyCard}
                                      style={{
                                        backgroundColor: penaltyInfo.color,
                                      }}
                                      title={card.description}
                                    >
                                      {penaltyInfo.text}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className={styles.noPenalty}>
                                  No penalties
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {latestEvaluation ? (
                              <div className={styles.commentPreview}>
                                {latestEvaluation.comment.length > 50
                                  ? `${latestEvaluation.comment.substring(
                                      0,
                                      50
                                    )}...`
                                  : latestEvaluation.comment}
                              </div>
                            ) : (
                              <span className={styles.noComment}>
                                No comment
                              </span>
                            )}
                          </td>
                          <td>
                            <div className={styles.actionButtons}>
                              <Button
                                onClick={() => openEvaluateModal(student)}
                                size='sm'
                                variant={
                                  latestEvaluation ? "secondary" : "primary"
                                }
                              >
                                {latestEvaluation ? "Re-evaluate" : "Evaluate"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className={styles.evaluationsSection}>
          <h2>Recent Evaluations</h2>
          <div className={styles.evaluationsList}>
            {evaluations.map((evaluation) => {
              const scoreColor = getScoreColor(evaluation.score);
              const scoreText = getScoreText(evaluation.score);
              const penaltyInfo = getPenaltyInfo(evaluation.penaltyTag);

              return (
                <div key={evaluation.id} className={styles.evaluationCard}>
                  <div className={styles.evaluationHeader}>
                    <div className={styles.evaluationInfo}>
                      <h3>{evaluation.studentName}</h3>
                      <p className={styles.evaluationMilestone}>
                        {evaluation.milestoneName}
                      </p>
                      <p className={styles.evaluationDate}>
                        Evaluated on {formatDate(evaluation.createdAt)}
                      </p>
                    </div>
                    <div className={styles.evaluationScore}>
                      <div
                        className={styles.scoreCircle}
                        style={{
                          backgroundColor: scoreColor,
                          color: "#fff",
                        }}
                      >
                        {evaluation.score}
                      </div>
                      <div
                        className={styles.scoreText}
                        style={{ color: scoreColor }}
                      >
                        {scoreText}
                      </div>
                    </div>
                  </div>

                  <div className={styles.evaluationContent}>
                    <div className={styles.commentSection}>
                      <h4>Feedback</h4>
                      <p className={styles.comment}>{evaluation.comment}</p>
                    </div>

                    {penaltyInfo && (
                      <div className={styles.penaltySection}>
                        <h4>Penalty Tag</h4>
                        <span
                          className={styles.penaltyTag}
                          style={{
                            backgroundColor: penaltyInfo.color,
                            color: "#fff",
                          }}
                        >
                          {penaltyInfo.text}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.evaluationActions}>
                    <Button variant='secondary' size='sm'>
                      Edit Evaluation
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={evaluateModal} onClose={() => setEvaluateModal(false)}>
        {selectedStudent && (
          <div className={styles.evaluateModal}>
            <h2>Evaluate Student</h2>
            <div className={styles.studentInfo}>
              <h3>
                Evaluating: {selectedStudent.name} ({selectedStudent.id})
              </h3>
              <p>
                Role: {selectedStudent.role} | Milestone:{" "}
                {selectedMilestoneData?.name}
              </p>
            </div>

            <div className={styles.evaluationForm}>

              <div className={styles.formSection}>
                <h4>Evaluation</h4>
                  <div className={styles.formGroup}>
                    <label>Late Tasks Count</label>
                    <input
                      type='number'
                      value={newEvaluation.lateTasks}
                      onChange={(e) =>
                        setNewEvaluation({
                          ...newEvaluation,
                          lateTasks: parseInt(e.target.value) || 0,
                        })
                      }
                      className={styles.input}
                      min='0'
                      placeholder='Number of late tasks'
                    />
                  </div>
                <div className={styles.formGroup}>
                  <label>Score (0-10)</label>
                  <input
                    type='number'
                    value={newEvaluation.score}
                    onChange={(e) =>
                      setNewEvaluation({
                        ...newEvaluation,
                        score: e.target.value,
                      })
                    }
                    className={styles.input}
                    min='0'
                    max='10'
                    step='0.1'
                    placeholder='Enter score'
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Comment</label>
                  <textarea
                    value={newEvaluation.comment}
                    onChange={(e) =>
                      setNewEvaluation({
                        ...newEvaluation,
                        comment: e.target.value,
                      })
                    }
                    placeholder="Provide detailed feedback about the student's performance..."
                    className={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Penalty Cards</h4>
                <div className={styles.penaltyCardsList}>
                  {[
                    "late-submission",
                    "missing-meeting",
                    "poor-quality",
                    "no-participation",
                  ].map((penaltyType) => {
                    const penaltyInfo = getPenaltyCardInfo(penaltyType);
                    const isSelected =
                      newEvaluation.penaltyCards.includes(penaltyType);

                    return (
                      <div
                        key={penaltyType}
                        className={`${styles.penaltyCardOption} ${
                          isSelected ? styles.selected : ""
                        }`}
                        onClick={() => {
                          const updatedCards = isSelected
                            ? newEvaluation.penaltyCards.filter(
                                (card) => card !== penaltyType
                              )
                            : [...newEvaluation.penaltyCards, penaltyType];
                          setNewEvaluation({
                            ...newEvaluation,
                            penaltyCards: updatedCards,
                          });
                        }}
                      >
                        <span className={styles.penaltyText}>
                          {penaltyInfo.text}
                        </span>
                        {isSelected && (
                          <span className={styles.checkmark}>✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button
                variant='secondary'
                onClick={() => setEvaluateModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitEvaluation}>Submit Evaluation</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
