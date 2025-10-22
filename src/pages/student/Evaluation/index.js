import React from "react";
import styles from "./index.module.scss";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import Select from "../../../components/Select/Select";

const API_URL_GROUPS = "https://160.30.21.113:5000/api/v1/Mentor/getGroups";
const API_URL_MILESTONE =
  "https://160.30.21.113:5000/api/v1/Student/milestone/group/";
const API_URL_STUDENTS =
  "https://160.30.21.113:5000/api/v1/Staff/capstone-groups/";

export default function SupervisorEvaluation() {
  const [evaluations, setEvaluations] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState("all");
  const [evaluateModal, setEvaluateModal] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [newEvaluation, setNewEvaluation] = React.useState({
    studentId: "",
    milestoneId: "",
    comment: "",
    penaltyCards: [],
  });

  // Fetch danh sách nhóm
  React.useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL_GROUPS, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await res.json();

        if (data?.data?.length) {
          const groupsData = data.data.map((g) => ({
            groupId: g.id.toString(),
            groupName: g.name,
            milestones: [],
          }));
          setGroups(groupsData);
          setSelectedGroup(groupsData[0].groupId);
        }
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };
    fetchGroups();
  }, []);

  // Fetch milestone + students
  React.useEffect(() => {
    if (!selectedGroup) return;
    const fetchGroupDetails = async () => {
      setLoading(true);
      try {
        const [milestoneRes, studentRes] = await Promise.all([
          fetch(`${API_URL_MILESTONE}${selectedGroup}`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
          fetch(`${API_URL_STUDENTS}${selectedGroup}`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }),
        ]);

        const milestoneData = await milestoneRes.json();
        const studentData = await studentRes.json();

        const students =
          studentData?.data?.students?.map((s) => ({
            id: s.id.toString(),
            name: s.name,
            role: s.role,
            penaltyCards: [],
            evaluations: [],
          })) || [];

        const milestones =
          milestoneData?.data?.map((m) => ({
            id: m.id.toString(),
            name: m.name,
            students,
          })) || [];

        setGroups((prev) =>
          prev.map((g) =>
            g.groupId === selectedGroup
              ? {
                  ...g,
                  milestones,
                  groupName: studentData?.data?.name || g.groupName,
                }
              : g
          )
        );

        setSelectedMilestone(milestones.length > 0 ? milestones[0].id : "all");
      } catch (err) {
        console.error("Error fetching group details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupDetails();
  }, [selectedGroup]);

  // UI helper
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

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const selectedGroupData = groups.find((g) => g.groupId === selectedGroup);
  const selectedMilestoneData = selectedGroupData?.milestones?.find(
    (m) => selectedMilestone === "all" || m.id === selectedMilestone
  );
  const studentsToEvaluate = selectedMilestoneData?.students || [];

  const openEvaluateModal = (student) => {
    setSelectedStudent(student);
    setNewEvaluation({
      studentId: student.id,
      milestoneId: selectedMilestoneData?.id || "",
      comment: "",
      penaltyCards: [],
    });
    setEvaluateModal(true);
  };

  const submitEvaluation = async () => {
    if (!newEvaluation.studentId || !newEvaluation.comment) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch(
        "https://160.30.21.113:5000/api/v1/Common/Evaluation/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            studentId: newEvaluation.studentId,
            milestoneId: newEvaluation.milestoneId,
            comment: newEvaluation.comment,
            penaltyCards: newEvaluation.penaltyCards,
          }),
        }
      );

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const result = await res.json();
      console.log("Evaluation created:", result);

      const evaluation = {
        id: Date.now(),
        studentId: newEvaluation.studentId,
        studentName: selectedStudent?.name,
        milestoneId: newEvaluation.milestoneId,
        milestoneName: selectedMilestoneData?.name,
        comment: newEvaluation.comment,
        penaltyTag: newEvaluation.penaltyCards[0] || null,
        createdAt: new Date().toISOString(),
        createdBy: "Supervisor",
      };

      setEvaluations((prev) => [evaluation, ...prev]);
      setEvaluateModal(false);
      setNewEvaluation({
        studentId: "",
        milestoneId: "",
        comment: "",
        penaltyCards: [],
      });

      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.groupId === selectedGroup
            ? {
                ...g,
                milestones: g.milestones.map((m) =>
                  m.id === newEvaluation.milestoneId
                    ? {
                        ...m,
                        students: m.students.map((s) =>
                          s.id === newEvaluation.studentId
                            ? {
                                ...s,
                                evaluations: [
                                  {
                                    comment: newEvaluation.comment,
                                    // thêm các trường khác nếu muốn
                                  },
                                  ...(s.evaluations || []),
                                ],
                                penaltyCards: newEvaluation.penaltyCards,
                              }
                            : s
                        ),
                      }
                    : m
                ),
              }
            : g
        )
      );

      alert("Evaluation submitted successfully!");
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to submit evaluation. Please try again.");
    }
  };

  if (loading)
    return (
      <div className={styles.loading}>
        <div>Loading evaluation data...</div>
      </div>
    );

  if (groups.length === 0)
    return (
      <div className={styles.loading}>
        <div>No groups found.</div>
      </div>
    );

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
                options={groups.map((g) => ({
                  value: g.groupId,
                  label: `${g.groupName} (${g.groupId})`,
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
                  ...(selectedGroupData?.milestones?.map((m) => ({
                    value: m.id,
                    label: m.name,
                  })) || []),
                ]}
              />
            </div>
          </div>
        </div>

        {selectedGroupData && (
          <div className={styles.evaluationTable}>
            <h2>Students Evaluation Table</h2>
            <div className={styles.tableContainer}>
              <table className={styles.evaluationTable}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Role</th>
                    <th>Penalty Cards</th>
                    <th>Comment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsToEvaluate.map((student) => {
                    const latestEval = student.evaluations?.[0];
                    return (
                      <tr key={student.id}>
                        <td>
                          <strong>{student.name}</strong> ({student.id})
                        </td>
                        <td>{student.role}</td>
                        <td>
                          {student.penaltyCards?.length ? (
                            student.penaltyCards.map((card, i) => {
                              const info = getPenaltyCardInfo(card.type);
                              return (
                                <span
                                  key={i}
                                  className={styles.penaltyCard}
                                  style={{ backgroundColor: info.color }}
                                >
                                  {info.text}
                                </span>
                              );
                            })
                          ) : (
                            <span className={styles.noPenalty}>
                              No penalties
                            </span>
                          )}
                        </td>
                        <td>
                          {latestEval ? (
                            <div className={styles.commentPreview}>
                              {latestEval.comment.length > 50
                                ? latestEval.comment.slice(0, 50) + "..."
                                : latestEval.comment}
                            </div>
                          ) : (
                            <span className={styles.noComment}>No comment</span>
                          )}
                        </td>
                        <td>
                          <Button
                            onClick={() => openEvaluateModal(student)}
                            size='sm'
                            variant={latestEval ? "secondary" : "primary"}
                          >
                            {latestEval ? "Re-evaluate" : "Evaluate"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={styles.evaluationsSection}>
          <h2>Recent Evaluations</h2>
          <div className={styles.evaluationsList}>
            {evaluations.map((evaluation) => {
              const penaltyInfo = getPenaltyInfo(evaluation.penaltyTag);
              return (
                <div key={evaluation.id} className={styles.evaluationCard}>
                  <h3>{evaluation.studentName}</h3>
                  <p>{evaluation.milestoneName}</p>
                  <p>Evaluated on {formatDate(evaluation.createdAt)}</p>
                  <div className={styles.commentSection}>
                    <h4>Feedback</h4>
                    <p>{evaluation.comment}</p>
                  </div>
                  {penaltyInfo && (
                    <div className={styles.penaltySection}>
                      <h4>Penalty</h4>
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
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={evaluateModal} onClose={() => setEvaluateModal(false)}>
        {selectedStudent && (
          <div className={styles.evaluateModal}>
            <h2>Evaluate Student</h2>
            <p>
              {selectedStudent.name} ({selectedStudent.id}) —{" "}
              {selectedStudent.role}
            </p>
            <p>Milestone: {selectedMilestoneData?.name}</p>

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
                placeholder='Write feedback...'
                className={styles.textarea}
                rows={4}
              />
            </div>

            <div className={styles.formSection}>
              <h4>Penalty Cards</h4>
              <div className={styles.penaltyCardsList}>
                {[
                  "late-submission",
                  "missing-meeting",
                  "poor-quality",
                  "no-participation",
                ].map((type) => {
                  const info = getPenaltyCardInfo(type);
                  const selected = newEvaluation.penaltyCards.includes(type);
                  return (
                    <div
                      key={type}
                      className={`${styles.penaltyCardOption} ${
                        selected ? styles.selected : ""
                      }`}
                      onClick={() => {
                        const updated = selected
                          ? newEvaluation.penaltyCards.filter((c) => c !== type)
                          : [...newEvaluation.penaltyCards, type];
                        setNewEvaluation({
                          ...newEvaluation,
                          penaltyCards: updated,
                        });
                      }}
                    >
                      <span>{info.text}</span>
                      {selected && <span className={styles.checkmark}>✓</span>}
                    </div>
                  );
                })}
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
