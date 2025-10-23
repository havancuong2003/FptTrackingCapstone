import React from "react";
import styles from "./index.module.scss";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import Select from "../../../components/Select/Select";
import DataTable from "../../../components/DataTable/DataTable";
import axiosClient from "../../../utils/axiosClient";

// API endpoints - sử dụng axiosClient

export default function SupervisorEvaluation() {
  const [groups, setGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [evaluateModal, setEvaluateModal] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [newEvaluation, setNewEvaluation] = React.useState({
    studentId: "",
    milestoneId: "",
    comment: "",
    penaltyCards: [],
  });
  const [evaluations, setEvaluations] = React.useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = React.useState(false);
  const [penaltyCards, setPenaltyCards] = React.useState([]);
  const [loadingPenaltyCards, setLoadingPenaltyCards] = React.useState(false);

  // ------------------ Fetch Evaluations ------------------
  const fetchEvaluations = async () => {
    if (!selectedGroup || !selectedMilestone) return;
    
    setLoadingEvaluations(true);
    try {
      console.log('Fetching evaluations for groupId:', selectedGroup, 'deliverableId:', selectedMilestone);
      const response = await axiosClient.get('/Common/Evaluation/getEvaluationByMentorDeliverable', {
        params: {
          groupId: selectedGroup,
          deliverableId: selectedMilestone
        }
      });
      
      console.log('Evaluations API response:', response.data);
      
      // Kiểm tra nếu response.data là array trực tiếp
      if (Array.isArray(response.data)) {
        console.log('API returned array directly:', response.data);
        setEvaluations(response.data);
      } else if (response.data.status === 200) {
        const evaluationsData = response.data.data || [];
        console.log('Setting evaluations (with status):', evaluationsData);
        setEvaluations(evaluationsData);
      } else {
        console.error('Failed to fetch evaluations:', response.data.message);
        setEvaluations([]);
      }
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      console.error('Error details:', err.response?.data);
      setEvaluations([]);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  // ------------------ Fetch Evaluations when milestone changes ------------------
  React.useEffect(() => {
    if (selectedGroup && selectedMilestone) {
      fetchEvaluations();
    }
  }, [selectedGroup, selectedMilestone]);

  // ------------------ Fetch Group List ------------------
  React.useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get('/Mentor/getGroups');
        
        if (response.data.status === 200) {
          const groupsData =
            response.data.data?.map((g) => ({
              groupId: g.id.toString(),
              groupName: g.name,
              milestones: [],
            })) || [];
          setGroups(groupsData);
          if (groupsData.length > 0) setSelectedGroup(groupsData[0].groupId);
        } else {
          console.error('Failed to fetch groups:', response.data.message);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);



  // ------------------ Fetch Milestones & Students ------------------
  React.useEffect(() => {
    if (!selectedGroup) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        console.log('Fetching details for groupId:', selectedGroup);
        const [milestoneRes, studentRes] = await Promise.all([
          axiosClient.get(`/deliverables/group/${selectedGroup}`),
          axiosClient.get(`/Staff/capstone-groups/${selectedGroup}`)
        ]);

        console.log('Milestone response:', milestoneRes.data);
        console.log('Student response:', studentRes.data);

        // API deliverables trả về array trực tiếp, không có wrapper
        if (studentRes.data.status === 200) {
          const milestoneData = milestoneRes.data; // Array trực tiếp
          const studentData = studentRes.data.data;

          const students =
            studentData?.students?.map((s) => ({
              id: s.rollNumber, // Sử dụng rollNumber làm student code
              studentId: s.id.toString(), // Giữ lại studentId để gọi API
              name: s.name,
              role: s.role,
              penaltyCards: [],
              evaluations: [],
            })) || [];

          const milestones =
            milestoneData?.map((m) => ({
              id: m.id.toString(),
              name: m.name,
              students,
            })) || [];

          setGroups((prev) =>
            prev.map((g) =>
              g.groupId === selectedGroup
                ? {
                    ...g,
                    groupName: studentData?.name || g.groupName,
                    milestones,
                  }
                : g
            )
          );

          if (milestones.length > 0) setSelectedMilestone(milestones[0].id);
        } else {
          console.error('Failed to fetch group details');
        }
      } catch (err) {
        console.error("Failed to fetch group details", err);
        console.error("Error details:", err.response?.data);
        console.error("Error status:", err.response?.status);
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
  const studentsToEvaluate = selectedMilestoneData?.students || [];

  console.log('Selected group data:', selectedGroupData);
  console.log('Selected milestone data:', selectedMilestoneData);
  console.log('Students to evaluate:', studentsToEvaluate);


  // ------------------ DataTable Columns ------------------
  const columns = [
    {
      key: 'student',
      title: 'Student',
      render: (student) => (
        <div className={styles.studentInfo}>
          <strong>{student.name}</strong>
          <span className={styles.studentCode}>{student.id}</span>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Role',
      render: (student) => student.role
    },
    {
      key: 'feedback',
      title: 'Feedback',
      render: (student) => {
        console.log('=== RENDERING FEEDBACK FOR STUDENT ===');
        console.log('Student:', student);
        console.log('All evaluations:', evaluations);
        console.log('Student ID:', student.studentId);
        console.log('Student name:', student.name);
        
        // Tìm evaluation cho sinh viên này dựa trên receiverId
        const studentEvaluations = evaluations.filter(evaluation => {
          console.log('Checking evaluation:', evaluation);
          console.log('evaluation.receiverId:', evaluation.receiverId);
          console.log('student.studentId:', student.studentId);
          console.log('student.name:', student.name);
          
          // Match theo receiverId
          return evaluation.receiverId === parseInt(student.studentId);
        });
        
        // Lấy evaluation mới nhất (sort theo createAt desc)
        const studentEvaluation = studentEvaluations.length > 0 
          ? studentEvaluations.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0]
          : null;
        
        console.log('Student evaluations found:', studentEvaluations.length);
        console.log('Sorted evaluations:', studentEvaluations.map(e => ({
          feedback: e.feedback,
          createAt: e.createAt,
          penaltyCards: e.penaltyCards
        })));
        console.log('Latest studentEvaluation:', studentEvaluation);
        
        if (studentEvaluation) {
          console.log('Student evaluation feedback:', studentEvaluation.feedback);
          return (
            <div className={styles.feedbackContent}>
              <span className={styles.feedbackText}>{studentEvaluation.feedback}</span>
            </div>
          );
        }
        
        return <span className={styles.noComment}>No feedback yet</span>;
      }
    },
    {
      key: 'penaltyCards',
      title: 'Penalty Cards',
      render: (student) => {
        // Tìm evaluation cho sinh viên này dựa trên receiverId
        const studentEvaluations = evaluations.filter(evaluation => {
          console.log('Checking evaluation for penalty cards:', evaluation);
          console.log('evaluation.receiverId:', evaluation.receiverId);
          console.log('student.studentId:', student.studentId);
          console.log('evaluation.penaltyCards:', evaluation.penaltyCards);
          
          // Match theo receiverId
          return evaluation.receiverId === parseInt(student.studentId);
        });
        
        // Lấy evaluation mới nhất (sort theo createAt desc)
        const studentEvaluation = studentEvaluations.length > 0 
          ? studentEvaluations.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0]
          : null;
        
        if (studentEvaluation && studentEvaluation.penaltyCards && studentEvaluation.penaltyCards.length > 0) {
          return (
            <div className={styles.penaltyCardsList}>
              {studentEvaluation.penaltyCards.map((cardName, index) => {
                return (
                  <span
                    key={index}
                    className={styles.penaltyTag}
                    style={{
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      marginRight: "4px",
                      fontSize: "12px",
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}
                  >
                    {cardName}
                  </span>
                );
              })}
            </div>
          );
        }
        
        return <span className={styles.noPenalty}>No penalties</span>;
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (student) => (
        <div className={styles.actions}>
          <Button 
            variant="primary"
            size="small"
            onClick={() => openEvaluateModal(student)}
          >
            Evaluate
          </Button>
        </div>
      )
    }
  ];

  // ------------------ Fetch Penalty Cards ------------------
  const fetchPenaltyCards = async () => {
    if (!selectedGroup) return;
    
    setLoadingPenaltyCards(true);
    try {
      console.log('Fetching penalty cards for groupId:', selectedGroup);
      // Sửa URL - bỏ /api/v1/ vì axiosClient đã có base URL
      const response = await axiosClient.get('/Common/Evaluation/card-milestonse', {
        params: {
          groupId: selectedGroup
        }
      });
      console.log('API Response:', response.data);
      
      if (response.data.status === 200) {
        const penaltiesData = response.data.data || [];
        // Chỉ lấy name từ API
        const formattedPenalties = penaltiesData.map(penalty => ({
          id: penalty.id,
          name: penalty.name
        }));
        setPenaltyCards(formattedPenalties);
      } else {
        console.error('Failed to fetch penalty cards:', response.data.message);
        setPenaltyCards([]);
      }
    } catch (err) {
      console.error('Error fetching penalty cards:', err);
      setPenaltyCards([]);
    } finally {
      setLoadingPenaltyCards(false);
    }
  };


  // ------------------ Modal Logic ------------------
  const openEvaluateModal = async (student) => {
    setSelectedStudent(student);
    setNewEvaluation({
      studentId: student.studentId, // Sử dụng studentId để gọi API
      milestoneId: selectedMilestoneData?.id || "",
      comment: "",
      penaltyCards: [],
    });
    setEvaluateModal(true);
    
    // Fetch penalty cards for this group
    await fetchPenaltyCards();
  };

  const submitEvaluation = async () => {
    if (!newEvaluation.comment.trim()) {
      alert("Please enter a comment before submitting.");
      return;
    }

    try {
      // Tạo penalty card IDs array
      const selectedPenaltyCardIds = penaltyCards.filter(card => 
        newEvaluation.penaltyCards.includes(card.id)
      ).map(card => card.id);

      console.log('Selected penalty cards:', selectedPenaltyCardIds);
      console.log('Penalty card IDs to send:', selectedPenaltyCardIds);
      
      const payload = {
        receiverId: parseInt(newEvaluation.studentId),
        feedback: newEvaluation.comment,
        groupId: parseInt(selectedGroup),
        deliverableId: parseInt(newEvaluation.milestoneId),
        penaltyCardIds: selectedPenaltyCardIds
      };

      console.log('Final payload:', JSON.stringify(payload, null, 2));
      console.log('IDs check:', {
        receiverId: parseInt(newEvaluation.studentId),
        groupId: parseInt(selectedGroup),
        deliverableId: parseInt(newEvaluation.milestoneId)
      });

      const response = await axiosClient.post('/Common/Evaluation/create', payload);

      if (response.data.status === 200) {
        // Refresh evaluations from API
        await fetchEvaluations();
        setEvaluateModal(false);
        alert("Comment submitted successfully!");
      } else {
        alert(`Error: ${response.data.message}`);
      }
    } catch (err) {
      console.error("Error submitting evaluation:", err);
      console.error("Error details:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit comment.";
      alert(`Error: ${errorMessage}`);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading data...</div>;
  }

  if (groups.length === 0) {
    return <div className={styles.loading}>No groups found.</div>;
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Student Evaluation - Supervisor View</h1>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Group:</label>
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={groups.map((g) => ({
                value: g.groupId,
                label: g.groupName,
              }))}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Milestone:</label>
            <Select
              value={selectedMilestone}
              onChange={setSelectedMilestone}
              options={
                selectedGroupData?.milestones?.map((m) => ({
                  value: m.id,
                  label: m.name,
                })) || []
              }
            />
          </div>
        </div>

        <div className={styles.evaluationTable}>
          <h2>Students Evaluation Table</h2>
          <div className={styles.tableContainer}>
            <DataTable
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
              <p className={styles.studentCode}>Student Code: {selectedStudent.id}</p>
              <p>Milestone: {selectedMilestoneData?.name}</p>
            </div>

            <div className={styles.formGroup}>
              <label>Comment</label>
              <textarea
                value={newEvaluation.comment}
                onChange={(e) =>
                  setNewEvaluation({ ...newEvaluation, comment: e.target.value })
                }
                placeholder="Provide feedback for the student..."
                rows={4}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Penalty Cards</label>
              {loadingPenaltyCards ? (
                <div className={styles.loadingPenaltyCards}>
                  Loading penalty cards...
                </div>
              ) : (
                <div className={styles.penaltyCardsGrid}>
                  {penaltyCards.length > 0 ? (
                    penaltyCards.map((card) => {
                      const isSelected = newEvaluation.penaltyCards.includes(card.id);
                      return (
                        <div
                          key={card.id}
                          className={`${styles.penaltyCard} ${
                            isSelected ? styles.selected : ""
                          }`}
                          onClick={() => {
                            const updated = isSelected
                              ? newEvaluation.penaltyCards.filter((c) => c !== card.id)
                              : [...newEvaluation.penaltyCards, card.id];
                            setNewEvaluation({
                              ...newEvaluation,
                              penaltyCards: updated,
                            });
                          }}
                        >
                          <span className={styles.penaltyCardText}>{card.name}</span>
                          {isSelected && <span className={styles.checkmark}>✓</span>}
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.noPenaltyCards}>
                      No penalty cards available for this group.
                    </div>
                  )}
                </div>
              )}
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

    </>
  );
}
