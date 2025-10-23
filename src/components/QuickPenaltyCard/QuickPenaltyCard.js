import React from "react";
import Button from "../Button/Button";
import Modal from "../Modal/Modal";
import Select from "../Select/Select";
import Textarea from "../Textarea/Textarea";
import axiosClient from "../../utils/axiosClient";
import styles from "./QuickPenaltyCard.module.scss";

export default function QuickPenaltyCard({ 
  student, 
  groupId, 
  context = "general",
  onSuccess,
  trigger 
}) {
  const [penaltyModal, setPenaltyModal] = React.useState(false);
  const [newPenalty, setNewPenalty] = React.useState({
    reason: "",
    description: "",
    severity: "medium",
  });
  const [submitting, setSubmitting] = React.useState(false);

  const penaltyReasons = [
    { value: "late-meeting", label: "Vào muộn buổi meeting" },
    { value: "late-submission", label: "Nộp trễ deadline" },
    { value: "absent-without-reason", label: "Vắng mặt không lý do" },
    { value: "incomplete-task", label: "Không hoàn thành phần việc được giao" },
    { value: "poor-attitude", label: "Thái độ làm việc không tích cực" },
    { value: "disruptive-behavior", label: "Hành vi gây rối trong nhóm" },
    { value: "other", label: "Khác" }
  ];

  const severityLevels = [
    { value: "low", label: "Nhẹ", color: "#10b981" },
    { value: "medium", label: "Trung bình", color: "#f59e0b" },
    { value: "high", label: "Nặng", color: "#ef4444" }
  ];

  const openPenaltyModal = () => {
    setNewPenalty({
      reason: "",
      description: "",
      severity: "medium",
    });
    setPenaltyModal(true);
  };

  const submitPenalty = async () => {
    if (!newPenalty.reason) {
      alert("Vui lòng chọn lý do phạt");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: penaltyReasons.find(r => r.value === newPenalty.reason)?.label || newPenalty.reason,
        description: newPenalty.description,
        type: newPenalty.reason,
        userId: parseInt(student.studentId),
        createdAt: new Date().toISOString()
      };

      const response = await axiosClient.post('/Common/Evaluation/create-card', payload);

      if (response.data.status === 200) {
        setPenaltyModal(false);
        setNewPenalty({
          reason: "",
          description: "",
          severity: "medium",
        });
        alert("Cấp thẻ phạt thành công!");
        if (onSuccess) onSuccess();
      } else {
        alert(`Lỗi: ${response.data.message}`);
      }
    } catch (err) {
      console.error("Error submitting penalty:", err);
      alert("Không thể cấp thẻ phạt. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={openPenaltyModal}>
          {trigger}
        </div>
      ) : (
        <Button
          variant="danger"
          size="small"
          onClick={openPenaltyModal}
          className={styles.quickPenaltyBtn}
        >
          ⚠️ Cấp thẻ phạt
        </Button>
      )}

      <Modal open={penaltyModal} onClose={() => setPenaltyModal(false)}>
        <div className={styles.quickPenaltyModal}>
          <h2>Cấp Thẻ phạt nhanh</h2>
          
          <div className={styles.studentInfo}>
            <h3>Thông tin sinh viên</h3>
            <div className={styles.studentDetails}>
              <span className={styles.studentName}>{student?.name}</span>
              <span className={styles.studentCode}>{student?.rollNumber}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Lý do phạt *</label>
            <Select
              value={newPenalty.reason}
              onChange={(value) => setNewPenalty({...newPenalty, reason: value})}
              options={penaltyReasons}
              placeholder="Chọn lý do phạt"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mức độ nghiêm trọng</label>
            <Select
              value={newPenalty.severity}
              onChange={(value) => setNewPenalty({...newPenalty, severity: value})}
              options={severityLevels}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mô tả chi tiết</label>
            <Textarea
              value={newPenalty.description}
              onChange={(e) => setNewPenalty({...newPenalty, description: e.target.value})}
              placeholder="Mô tả chi tiết về vi phạm..."
              rows={3}
              className={styles.textarea}
            />
          </div>

          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              onClick={() => setPenaltyModal(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              onClick={submitPenalty}
              disabled={submitting}
              className={styles.submitBtn}
            >
              {submitting ? "Đang xử lý..." : "Cấp thẻ phạt"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
