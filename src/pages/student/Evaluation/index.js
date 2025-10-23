import React from "react";
import styles from "./index.module.scss";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import DataTable from "../../../components/DataTable/DataTable";
import axiosClient from "../../../utils/axiosClient";

export default function StudentEvaluation() {
  const [evaluations, setEvaluations] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMilestone, setSelectedMilestone] = React.useState("all");

  // ------------------ Fetch Milestones ------------------
  React.useEffect(() => {
    const fetchMilestones = async () => {
      setLoading(true);
      try {
        console.log('Fetching milestones for student');
        const response = await axiosClient.get('/Student/milestone');
        
        console.log('Milestones API response:', response.data);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Kiểm tra nếu response.data là array trực tiếp
        if (Array.isArray(response.data)) {
          console.log('API returned array directly:', response.data);
          setMilestones(response.data);
        } else if (response.data.status === 200) {
          const milestonesData = response.data.data || [];
          console.log('Setting milestones (with status):', milestonesData);
          setMilestones(milestonesData);
        } else {
          console.error('Failed to fetch milestones:', response.data.message);
          console.error('Full response:', response.data);
          setMilestones([]);
        }
      } catch (err) {
        console.error('Error fetching milestones:', err);
        console.error('Error details:', err.response?.data);
        console.error('Error status:', err.response?.status);
        
        // Sử dụng mock data khi API lỗi
        console.log('Using mock milestones data');
        const mockMilestones = [
          { id: "1", name: "Milestone 1: Project Introduction" },
          { id: "2", name: "Milestone 2: Project Planning" },
          { id: "3", name: "Milestone 3: Requirement Analysis" },
          { id: "4", name: "Milestone 4: System Design" },
          { id: "5", name: "Milestone 5: Implementation" }
        ];
        setMilestones(mockMilestones);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, []);

  // ------------------ Fetch All Evaluations ------------------
  const [allEvaluations, setAllEvaluations] = React.useState([]);
  
  const fetchAllEvaluations = async () => {
    setLoading(true);
    try {
      console.log('Fetching all evaluations for student');
      const response = await axiosClient.get('/Common/Evaluation/getEvaluationFromDeliverableByStudent');
      
      console.log('All evaluations API response:', response.data);
      
      // Kiểm tra nếu response.data là array trực tiếp
      if (Array.isArray(response.data)) {
        console.log('API returned array directly:', response.data);
        setAllEvaluations(response.data);
        setEvaluations(response.data);
      } else if (response.data.status === 200) {
        const evaluationsData = response.data.data || [];
        console.log('Setting all evaluations (with status):', evaluationsData);
        setAllEvaluations(evaluationsData);
        setEvaluations(evaluationsData);
      } else {
        console.error('Failed to fetch evaluations:', response.data.message);
        setAllEvaluations([]);
        setEvaluations([]);
      }
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      console.error('Error details:', err.response?.data);
      setAllEvaluations([]);
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ Fetch All Evaluations on Mount ------------------
  React.useEffect(() => {
    fetchAllEvaluations();
  }, []);

  // ------------------ Filter Evaluations when milestone changes ------------------
  React.useEffect(() => {
    console.log('=== Filtering evaluations by milestone ===');
    console.log('selectedMilestone:', selectedMilestone);
    console.log('allEvaluations:', allEvaluations);
    
    if (selectedMilestone === "all") {
      console.log('Showing all evaluations');
      setEvaluations(allEvaluations);
    } else {
      // Tìm milestone name từ milestones array
      const selectedMilestoneData = milestones.find(m => m.id === selectedMilestone);
      const milestoneName = selectedMilestoneData?.name;
      
      console.log('Selected milestone name:', milestoneName);
      
      if (milestoneName) {
        const filteredEvaluations = allEvaluations.filter(evaluation => 
          evaluation.deliverableName === milestoneName
        );
        console.log('Filtered evaluations:', filteredEvaluations);
        setEvaluations(filteredEvaluations);
      } else {
        console.log('Milestone name not found, showing all evaluations');
        setEvaluations(allEvaluations);
      }
    }
  }, [selectedMilestone, allEvaluations, milestones]);

  // ------------------ Table Columns ------------------
  const columns = [
    {
      key: 'stt',
      title: 'STT',
      render: (_, index) => index + 1
    },
    {
      key: 'feedback',
      title: 'Nhận xét',
      render: (evaluation) => (
        <div className={styles.feedbackContent}>
          <p className={styles.feedbackText}>{evaluation.feedback}</p>
        </div>
      )
    },
    {
      key: 'supervisor',
      title: 'Giảng viên',
      render: (evaluation) => (
        <div className={styles.supervisorInfo}>
          <span className={styles.supervisorName}>{evaluation.evaluatorName}</span>
        </div>
      )
    },
    {
      key: 'penaltyCards',
      title: 'Thẻ phạt',
      render: (evaluation) => {
        if (evaluation.penaltyCards && evaluation.penaltyCards.length > 0) {
          return (
            <div className={styles.penaltyCardsList}>
              {evaluation.penaltyCards.map((cardName, index) => (
                <span
                  key={index}
                  className={styles.penaltyTag}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    marginRight: "4px",
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    display: "inline-block",
                    marginBottom: "4px"
                  }}
                >
                  {cardName}
                </span>
              ))}
            </div>
          );
        }
        
        return <span className={styles.noPenalty}>Không có thẻ phạt</span>;
      }
    }
  ];

  // ------------------ Summary Statistics ------------------
  const getSummaryStats = () => {
    const totalEvaluations = evaluations.length;
    const totalPenalties = evaluations.reduce((count, evaluation) => 
      count + (evaluation.penaltyCards ? evaluation.penaltyCards.length : 0), 0
    );
    
    return {
      totalEvaluations,
      totalPenalties
    };
  };

  const stats = getSummaryStats();

  if (loading && evaluations.length === 0) {
    return <div className={styles.loading}>Đang tải dữ liệu...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Đánh giá của Mentor</h1>
        <p className={styles.subtitle}>
          Xem nhận xét và thẻ phạt từ mentor theo từng milestone
        </p>
      </div>

      {/* ------------------ Controls ------------------ */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Chọn Milestone:</label>
          <select
            value={selectedMilestone}
            onChange={(e) => setSelectedMilestone(e.target.value)}
            className={styles.select}
          >
            <option value="all">Tất cả Milestones</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
              </option>
            ))}
          </select>
        </div>
        
      </div>

      {/* ------------------ Summary Cards ------------------ */}
      <div className={styles.summaryCards}>
        <Card className={styles.summaryCard}>
          <div className={styles.summaryContent}>
            <h3>Tổng số đánh giá</h3>
            <div className={styles.summaryNumber}>{stats.totalEvaluations}</div>
          </div>
        </Card>
        
        <Card className={styles.summaryCard}>
          <div className={styles.summaryContent}>
            <h3>Tổng số thẻ phạt</h3>
            <div className={styles.summaryNumber}>{stats.totalPenalties}</div>
          </div>
        </Card>
      </div>

      {/* ------------------ Evaluations Table ------------------ */}
      <div className={styles.evaluationsSection}>
        <h2>Bảng đánh giá cá nhân</h2>
        <div className={styles.tableContainer}>
          {selectedMilestone === "all" ? (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionContent}>
                <h3>Chọn một milestone để xem đánh giá</h3>
                <p>Vui lòng chọn milestone cụ thể để xem nhận xét và thẻ phạt từ mentor.</p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={evaluations}
              loading={loading}
              emptyMessage="Chưa có đánh giá nào cho milestone này"
              showIndex={false}
            />
          )}
        </div>
      </div>

    </div>
  );
}