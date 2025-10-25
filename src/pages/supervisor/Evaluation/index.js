import React from "react";
import styles from "./index.module.scss";
import Button from "../../../components/Button/Button";
import Modal from "../../../components/Modal/Modal";
import DataTable from "../../../components/DataTable/DataTable";
import axiosClient from "../../../utils/axiosClient";
import { sendEvaluationNotification } from "../../../api/evaluation";

// API endpoints - sử dụng axiosClient

export default function SupervisorEvaluation() {
  const [groups, setGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [selectedMilestone, setSelectedMilestone] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [evaluateModal, setEvaluateModal] = React.useState(false);
  const [editModal, setEditModal] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = React.useState(null);
  const [newEvaluation, setNewEvaluation] = React.useState({
    studentId: "",
    milestoneId: "",
    comment: "",
    penaltyCards: [],
  });
  const [editEvaluation, setEditEvaluation] = React.useState({
    id: "",
    studentId: "",
    milestoneId: "",
    comment: "",
    penaltyCards: [],
  });
  const [evaluations, setEvaluations] = React.useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = React.useState(false);
  const [penaltyCards, setPenaltyCards] = React.useState([]);
  const [loadingPenaltyCards, setLoadingPenaltyCards] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // ------------------ Fetch Evaluations ------------------
  const fetchEvaluations = async () => {
    if (!selectedGroup || !selectedMilestone) return;
    
    setLoadingEvaluations(true);
    try {
      const response = await axiosClient.get('/Common/Evaluation/getEvaluationByMentorDeliverable', {
        params: {
          groupId: selectedGroup,
          deliverableId: selectedMilestone,
          _t: Date.now() // Cache-busting parameter
        }
      });
      
      // Kiểm tra nếu response.data là array trực tiếp
      if (Array.isArray(response.data)) {
        setEvaluations(response.data);
      } else if (response.data.status === 200) {
        const evaluationsData = response.data.data || [];
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

  // ------------------ Force Refresh Evaluations ------------------
  const forceRefreshEvaluations = async () => {
    setEvaluations([]); // Clear current evaluations first
    await fetchEvaluations();
    setRefreshTrigger(prev => prev + 1);
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
        const [milestoneRes, studentRes] = await Promise.all([
          axiosClient.get(`/deliverables/group/${selectedGroup}`),
          axiosClient.get(`/Staff/capstone-groups/${selectedGroup}`)
        ]);


        // API deliverables trả về array trực tiếp, không có wrapper
        if (studentRes.data.status === 200) {
          const milestoneData = milestoneRes.data; // Array trực tiếp
          const studentData = studentRes.data.data;

          const students =
            studentData?.students?.map((s) => {
              return {
                id: s.rollNumber, // Sử dụng rollNumber làm student code
                studentId: s.id.toString(), // Giữ lại studentId để gọi API
                name: s.name,
                role: s.role,
                email: s.email, // Lấy email từ database, không tạo fallback
                penaltyCards: [],
                evaluations: [],
              };
            }) || [];

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



  // ------------------ DataTable Columns ------------------
  const columns = [
    {
      key: 'student',
      title: 'Sinh viên',
      render: (student) => (
        <div className={styles.studentInfo}>
          <strong>{student.name}</strong>
          <span className={styles.studentCode}>{student.id}</span>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Vai trò',
      render: (student) => {
        const roleMap = {
          'Leader': 'Trưởng nhóm',
          'Secretary': 'Thư ký',
          'Member': 'Thành viên'
        };
        return roleMap[student.role] || student.role;
      }
    },
    {
      key: 'feedback',
      title: 'Nhận xét',
      render: (student) => {
        
        // Tìm evaluation cho sinh viên này dựa trên receiverId
        const studentEvaluations = evaluations.filter(evaluation => {
          
          // Match theo receiverId
          return evaluation.receiverId === parseInt(student.studentId);
        });
        
        // Lấy evaluation mới nhất (sort theo createAt desc)
        const studentEvaluation = studentEvaluations.length > 0 
          ? studentEvaluations.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0]
          : null;
        
        
        if (studentEvaluation) {
          return (
            <div className={styles.feedbackContent}>
              <span className={styles.feedbackText}>{studentEvaluation.feedback}</span>
            </div>
          );
        }
        
        return <span className={styles.noComment}>Chưa có nhận xét</span>;
      }
    },
    {
      key: 'penaltyCards',
      title: 'Thẻ Phạt',
      render: (student) => {
        // Tìm evaluation cho sinh viên này dựa trên receiverId
        const studentEvaluations = evaluations.filter(evaluation => {
          
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
        
        return <span className={styles.noPenalty}>Không có thẻ phạt</span>;
      }
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (student) => {
        // Tìm evaluation cho sinh viên này
        const studentEvaluations = evaluations.filter(evaluation => {
          return evaluation.receiverId === parseInt(student.studentId);
        });
        
        const studentEvaluation = studentEvaluations.length > 0 
          ? studentEvaluations.sort((a, b) => new Date(b.createAt) - new Date(a.createAt))[0]
          : null;

        return (
          <div className={styles.actions}>
            <Button 
              variant="primary"
              size="small"
              onClick={() => openEvaluateModal(student)}
            >
              Đánh giá
            </Button>
            {studentEvaluation && (
              <Button 
                variant="secondary"
                size="small"
                onClick={() => openEditModal(student, studentEvaluation)}
                style={{ marginLeft: '8px' }}
              >
                Sửa
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  // ------------------ Fetch Thẻ Phạt ------------------
  const fetchPenaltyCards = async () => {
    if (!selectedGroup) return;
    
    setLoadingPenaltyCards(true);
    try {
      // Sửa URL - bỏ /api/v1/ vì axiosClient đã có base URL
      const response = await axiosClient.get('/Common/Evaluation/card-milestonse', {
        params: {
          groupId: selectedGroup
        }
      });
      
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

  const openEditModal = async (student, evaluation) => {
    setSelectedStudent(student);
    setSelectedEvaluation(evaluation);
    
    
    // Chuyển đổi penalty cards từ API response sang format cần thiết
    const penaltyCardIds = evaluation.penaltyCards ? evaluation.penaltyCards.map(card => card.id || card) : [];
    
    // Sử dụng student.studentId (s.id từ API) làm ID cho API update
    const evaluationId = student.studentId;
    
    
    setEditEvaluation({
      id: evaluationId,
      studentId: student.studentId, // Đã là string từ API
      milestoneId: selectedMilestoneData?.id || "",
      comment: evaluation.feedback || "",
      penaltyCards: penaltyCardIds,
    });
    setEditModal(true);
    
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

      // Gửi email thông báo đánh giá TRƯỚC khi submit
      try {
        const selectedStudent = studentsToEvaluate.find(s => s.studentId === newEvaluation.studentId);
        const selectedMilestoneData = selectedGroupData?.milestones?.find(m => m.id === newEvaluation.milestoneId);
        const selectedPenaltyCards = penaltyCards.filter(card => 
          newEvaluation.penaltyCards.includes(card.id)
        ).map(card => card.name);
        
        if (selectedStudent && selectedMilestoneData && selectedStudent.email) {
          await sendEvaluationNotification({
            recipients: [selectedStudent.email],
            studentName: selectedStudent.name,
            milestoneName: selectedMilestoneData.name,
            feedback: newEvaluation.comment,
            penaltyCards: selectedPenaltyCards,
            evaluatorName: 'Giảng viên', // Có thể lấy từ user context
            subject: `Đánh giá milestone: ${selectedMilestoneData.name}`,
            cc: [] // Có thể thêm supervisor email
          });
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Không hiển thị lỗi email cho user, chỉ log
      }

      const payload = {
        receiverId: parseInt(newEvaluation.studentId),
        feedback: newEvaluation.comment,
        groupId: parseInt(selectedGroup),
        deliverableId: parseInt(newEvaluation.milestoneId),
        penaltyCardIds: selectedPenaltyCardIds
      };

      const response = await axiosClient.post('/Common/Evaluation/create', payload);


      // Kiểm tra nếu response thành công (status 200 hoặc không có lỗi)
      if (response.data.status === 200 || response.status === 200 || !response.data.error) {
        // Thêm evaluation mới vào state thay vì refresh toàn bộ
        if (response.data.data) {
          const newEvaluation = {
            ...response.data.data,
            receiverId: response.data.data.id,
            studentName: selectedStudent?.name || 'Unknown',
            evaluatorName: 'Giảng viên',
            // Đảm bảo có đầy đủ thông tin cần thiết
            deliverableName: selectedMilestoneData?.name || 'Unknown Milestone',
            createAt: response.data.data.createAt || new Date().toISOString()
          };
          
          setEvaluations(prevEvaluations => [newEvaluation, ...prevEvaluations]);
        }
        
        // Trigger refresh cho DataTable
        setRefreshTrigger(prev => prev + 1);
        
        setEvaluateModal(false);
        alert("Đánh giá đã được gửi thành công!");
      } else {
        alert(`Lỗi: ${response.data.message || 'Không thể tạo đánh giá'}`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Không thể gửi đánh giá.";
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  const updateEvaluation = async () => {
    if (!editEvaluation.comment.trim()) {
      alert("Please enter a comment before updating.");
      return;
    }

    if (!editEvaluation.id) {
      console.error('Evaluation ID is missing:', editEvaluation);
      alert("Không thể cập nhật đánh giá: Thiếu ID đánh giá.");
      return;
    }

    try {
      // Tạo penalty card IDs array
      const selectedPenaltyCardIds = penaltyCards.filter(card => 
        editEvaluation.penaltyCards.includes(card.id)
      ).map(card => card.id);

      // Gửi email thông báo cập nhật đánh giá TRƯỚC khi submit
      try {
        const selectedStudent = studentsToEvaluate.find(s => s.studentId === editEvaluation.studentId);
        const selectedMilestoneData = selectedGroupData?.milestones?.find(m => m.id === editEvaluation.milestoneId);
        const selectedPenaltyCards = penaltyCards.filter(card => 
          editEvaluation.penaltyCards.includes(card.id)
        ).map(card => card.name);
        
        if (selectedStudent && selectedMilestoneData && selectedStudent.email) {
          await sendEvaluationNotification({
            recipients: [selectedStudent.email],
            studentName: selectedStudent.name,
            milestoneName: selectedMilestoneData.name,
            feedback: editEvaluation.comment,
            penaltyCards: selectedPenaltyCards,
            evaluatorName: 'Giảng viên', // Có thể lấy từ user context
            subject: `Cập nhật đánh giá milestone: ${selectedMilestoneData.name}`,
            cc: [] // Có thể thêm supervisor email
          });
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Không hiển thị lỗi email cho user, chỉ log
      }

      const payload = {
        receiverId: parseInt(editEvaluation.studentId), 
        feedback: editEvaluation.comment,
        groupId: parseInt(selectedGroup),
        deliverableId: parseInt(editEvaluation.milestoneId),
        penaltyCardIds: selectedPenaltyCardIds
      };

      
      // Sử dụng API endpoint mới để update evaluation
      const response = await axiosClient.put(`/Common/Evaluation/update/evaluation/${editEvaluation.id}`, payload);


      // Kiểm tra nếu response thành công
      if (response.data.status === 200 || response.status === 200 || !response.data.error) {
        // Đóng modal trước
        setEditModal(false);
        
        // Hiển thị thông báo thành công với message từ server
        alert(response.data.message || "Đánh giá đã được cập nhật thành công!");
        
        // Cập nhật trực tiếp vào state thay vì refresh toàn bộ
        const updatedData = response.data.data;
        
        // Tìm evaluation theo receiverId và deliverableName (vì không có ID field)
        const targetEvaluation = evaluations.find(evaluation => 
          evaluation.receiverId === updatedData.id && 
          evaluation.deliverableName === selectedMilestoneData?.name
        );
        
        if (targetEvaluation) {
          setEvaluations(prevEvaluations => 
            prevEvaluations.map(evaluation => {
              if (evaluation === targetEvaluation) {
                const updatedEvaluation = {
                  ...evaluation,
                  feedback: updatedData.feedback || editEvaluation.comment,
                  penaltyCards: updatedData.penaltyCards || [],
                  createAt: updatedData.updateAt || evaluation.createAt,
                  receiverId: updatedData.id || evaluation.receiverId
                };
                return updatedEvaluation;
              }
              return evaluation;
            })
          );
        } else {
          // Fallback: cập nhật tất cả evaluations có cùng receiverId
          setEvaluations(prevEvaluations => 
            prevEvaluations.map(evaluation => {
              if (evaluation.receiverId === updatedData.id) {
                return {
                  ...evaluation,
                  feedback: updatedData.feedback || editEvaluation.feedback,
                  penaltyCards: updatedData.penaltyCards || [],
                  createAt: updatedData.updateAt || evaluation.createAt,
                  receiverId: updatedData.id || evaluation.receiverId
                };
              }
              return evaluation;
            })
          );
        }
        
        // Trigger refresh cho DataTable
        setRefreshTrigger(prev => prev + 1);
        
      } else {
        alert(`Lỗi: ${response.data.message || 'Không thể cập nhật đánh giá'}`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Không thể cập nhật đánh giá.";
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải dữ liệu...</div>;
  }

  if (groups.length === 0) {
    return <div className={styles.loading}>Không tìm thấy nhóm nào.</div>;
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Đánh Giá Sinh Viên - Góc Nhìn Giảng Viên</h1>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Nhóm:</label>
            <select
              value={selectedGroup || ""}
              onChange={(e) => {
                console.log('Selected group value:', e.target.value);
                setSelectedGroup(e.target.value);
              }}
              className={styles.select}
            >
              <option value="">Chọn nhóm</option>
              {groups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label>Cột mốc:</label>
            <select
              value={selectedMilestone || ""}
              onChange={(e) => {
                console.log('Selected milestone value:', e.target.value);
                setSelectedMilestone(e.target.value);
              }}
              className={styles.select}
            >
              <option value="">Chọn milestone</option>
              {selectedGroupData?.milestones?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2>Bảng đánh giá sinh viên</h2>
          </div>
          <div className={styles.tableContainer}>
            <DataTable
              key={`evaluation-table-${refreshTrigger}`}
              columns={columns}
              data={studentsToEvaluate}
              loading={loading}
              emptyMessage="Không tìm thấy sinh viên nào để đánh giá"
            />
          </div>
        </div>

      </div>

      {/* ------------------ Evaluate Modal ------------------ */}
      <Modal open={evaluateModal} onClose={() => setEvaluateModal(false)}>
        {selectedStudent && (
          <div className={styles.evaluateModal}>
            <h2>Đánh Giá Sinh Viên</h2>
            
            <div className={styles.studentInfo}>
              <h3>{selectedStudent.name}</h3>
              <p className={styles.studentCode}>Mã sinh viên: {selectedStudent.id}</p>
              <p>Cột mốc: {selectedMilestoneData?.name}</p>
            </div>

            <div className={styles.formGroup}>
              <label>Nhận xét</label>
              <textarea
                value={newEvaluation.comment}
                onChange={(e) =>
                  setNewEvaluation({ ...newEvaluation, comment: e.target.value })
                }
                placeholder="Cung cấp phản hồi cho sinh viên..."
                rows={4}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Thẻ Phạt</label>
              {loadingPenaltyCards ? (
                <div className={styles.loadingPenaltyCards}>
                  Đang tải thẻ phạt...
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
                      Không có thẻ phạt nào cho nhóm này.
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
                Hủy
              </Button>
              <Button onClick={submitEvaluation}>Gửi Đánh Giá</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ------------------ Edit Modal ------------------ */}
      <Modal open={editModal} onClose={() => setEditModal(false)}>
        {selectedStudent && selectedEvaluation && (
          <div className={styles.evaluateModal}>
            <h2>Sửa Đánh Giá</h2>
            
            <div className={styles.studentInfo}>
              <h3>{selectedStudent.name}</h3>
              <p className={styles.studentCode}>Mã sinh viên: {selectedStudent.id}</p>
              <p>Cột mốc: {selectedMilestoneData?.name}</p>
            </div>

            <div className={styles.formGroup}>
              <label>Nhận xét</label>
              <textarea
                value={editEvaluation.comment}
                onChange={(e) =>
                  setEditEvaluation({ ...editEvaluation, comment: e.target.value })
                }
                placeholder="Cung cấp phản hồi cho sinh viên..."
                rows={4}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Thẻ Phạt</label>
              {loadingPenaltyCards ? (
                <div className={styles.loadingPenaltyCards}>
                  Đang tải thẻ phạt...
                </div>
              ) : (
                <div className={styles.penaltyCardsGrid}>
                  {penaltyCards.length > 0 ? (
                    penaltyCards.map((card) => {
                      const isSelected = editEvaluation.penaltyCards.includes(card.id);
                      return (
                        <div
                          key={card.id}
                          className={`${styles.penaltyCard} ${
                            isSelected ? styles.selected : ""
                          }`}
                          onClick={() => {
                            const updated = isSelected
                              ? editEvaluation.penaltyCards.filter((c) => c !== card.id)
                              : [...editEvaluation.penaltyCards, card.id];
                            setEditEvaluation({
                              ...editEvaluation,
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
                      Không có thẻ phạt nào cho nhóm này.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setEditModal(false)}
              >
                Hủy
              </Button>
              <Button onClick={updateEvaluation}>Cập Nhật Đánh Giá</Button>
            </div>
          </div>
        )}
      </Modal>

    </>
  );
}
