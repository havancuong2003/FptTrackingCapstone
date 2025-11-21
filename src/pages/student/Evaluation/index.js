import React from "react";
import styles from "./index.module.scss";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import DataTable from "../../../components/DataTable/DataTable";
import axiosClient from "../../../utils/axiosClient";
import { getGroupId } from "../../../auth/auth";

export default function StudentEvaluation() {
  const [evaluations, setEvaluations] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedMilestone, setSelectedMilestone] = React.useState("all");
  const [penaltyCardsGeneral, setPenaltyCardsGeneral] = React.useState([]);
  const [loadingPenaltyCards, setLoadingPenaltyCards] = React.useState(false);

  // ------------------ Fetch Milestones ------------------
  React.useEffect(() => {
    const fetchMilestones = async () => {
      setLoading(true);
      try {
        // Ưu tiên lấy milestones theo group hiện tại của student
        const gid = getGroupId() || localStorage.getItem('student_group_id');
        let response;
        if (gid) {
          response = await axiosClient.get(`/deliverables/group/${gid}`);
        } else {
          response = await axiosClient.get('/Student/milestone');
        }
        
        // Kiểm tra nếu response.data là array trực tiếp
        if (Array.isArray(response.data)) {
          const normalized = response.data.map(m => ({ id: String(m.id || m.ID || m.value || m), name: m.name || m.label || m.title || m.toString() }));
          setMilestones(normalized);
        } else if (response.data.status === 200) {
          const milestonesData = (response.data.data || []).map(m => ({ id: String(m.id || m.ID || m.value), name: m.name || m.label || m.title }));
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
        
        // Không sử dụng mock data, trả về mảng rỗng
        setMilestones([]);
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
      const response = await axiosClient.get('/Common/Evaluation/getEvaluationFromDeliverableByStudent');
      
      // Kiểm tra nếu response.data là array trực tiếp
      if (Array.isArray(response.data)) {
        setAllEvaluations(response.data);
        setEvaluations(response.data);
      } else if (response.data.status === 200) {
        const evaluationsData = response.data.data || [];
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

  // ------------------ Fetch General Penalty Cards ------------------
  React.useEffect(() => {
    const fetchGeneralPenaltyCards = async () => {
      setLoadingPenaltyCards(true);
      try {
        const response = await axiosClient.get('/Common/Evaluation/getCardEvaluationGeneralByStudent');

        // API có thể trả mảng trực tiếp hoặc theo format { status, data }
        if (Array.isArray(response.data)) {
          setPenaltyCardsGeneral(response.data);
        } else if (response.data?.status === 200) {
          setPenaltyCardsGeneral(response.data.data || []);
        } else {
          setPenaltyCardsGeneral([]);
        }
      } catch (err) {
        console.error('Error fetching general penalty cards:', err);
        setPenaltyCardsGeneral([]);
      } finally {
        setLoadingPenaltyCards(false);
      }
    };

    fetchGeneralPenaltyCards();
  }, []);

  // ------------------ Filter Evaluations when milestone changes ------------------
  React.useEffect(() => {
    if (selectedMilestone === "all") {
      setEvaluations(allEvaluations);
    } else {
      // Tìm milestone name từ milestones array
      const selectedMilestoneData = milestones.find(m => m.id === selectedMilestone);
      const milestoneName = selectedMilestoneData?.name;
      
      if (milestoneName) {
        const filteredEvaluations = allEvaluations.filter(evaluation => 
          evaluation.deliverableName === milestoneName
        );
        setEvaluations(filteredEvaluations);
      } else {
        setEvaluations(allEvaluations);
      }
    }
  }, [selectedMilestone, allEvaluations, milestones]);

  // ------------------ Table Columns ------------------
  const mapTypeToText = (type) => {
    if (!type) return '-';
    const t = String(type).trim().toLowerCase();
    const map = {
      excellent: 'Exceeds requirements',
      good: 'Fully meets requirements',
      fair: 'Mostly meets requirements',
      average: 'Meets basics, lacks detail',
      poor: 'Below standard',
    };
    if (map[t]) return map[t];
    // If already in text form, return as is
    const texts = Object.values(map).map(s => s.toLowerCase());
    if (texts.includes(t)) return type;
    // Fallbacks by keywords
    if (t.includes('exceed')) return map.excellent;
    if (t.includes('fully') && t.includes('requirement')) return map.good;
    if (t.includes('mostly')) return map.fair;
    if (t.includes('basic') || t.includes('lack')) return map.average;
    if (t.includes('below') || t.includes('standard')) return map.poor;
    return type;
  };
  const columns = [
    {
      key: 'stt',
      title: 'No',
      render: (_, index) => index + 1
    },
    {
      key: 'type',
      title: 'Feedback',
      render: (evaluation) => (
        <span>{mapTypeToText(evaluation.type)}</span>
      )
    },
    {
      key: 'feedback',
      title: 'Notes',
      render: (evaluation) => (
        <div className={styles.feedbackContent}>
          <p className={styles.feedbackText}>{evaluation.feedback}</p>
        </div>
      )
    },
    {
      key: 'supervisor',
      title: 'Supervisor',
      render: (evaluation) => (
        <div className={styles.supervisorInfo}>
          <span className={styles.supervisorName}>{evaluation.evaluatorName}</span>
        </div>
      )
    }
  ];

  // ------------------ General Penalty Cards Table Columns ------------------
  const penaltyColumns = [
    {
      key: 'stt',
      title: 'STT',
      render: (_, index) => index + 1
    },
    {
      key: 'name',
      title: 'Name',
      render: (item) => item.name || '-'
    },
    {
      key: 'description',
      title: 'Description',
      render: (item) => item.description || '-'
    },
    {
      key: 'type',
      title: 'Type',
      render: (item) => item.type || '-'
    }
  ];

  // ------------------ Summary Statistics ------------------
  const getSummaryStats = () => {
    // Tổng số đánh giá: theo bảng "Bảng đánh giá cá nhân" (danh sách evaluations hiện tại)
    const totalEvaluations = evaluations.length;
    // Tổng số thẻ phạt: theo bảng "Danh sách thẻ phạt cá nhân" (danh sách penaltyCardsGeneral)
    const totalPenalties = penaltyCardsGeneral.length;
    
    return {
      totalEvaluations,
      totalPenalties
    };
  };

  const stats = getSummaryStats();

  // Kiểm tra nếu không có group
  const groupId = getGroupId() || localStorage.getItem('student_group_id');
  const hasNoGroup = !loading && !groupId;

  // Nếu không có group, hiển thị thông báo
  if (hasNoGroup) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState || styles.loading}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#374151' }}>
            You are not in any group
          </div>
          <div style={{ color: '#6b7280' }}>
            Please contact the supervisor to be added to a group.
          </div>
        </div>
      </div>
    );
  }

  if (loading && evaluations.length === 0) {
    return <div className={styles.loading}>Loading data...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mentor Evaluations</h1>
        <p className={styles.subtitle}>
          View mentor feedback and penalty cards by milestone
        </p>
      </div>

      {/* ------------------ Controls ------------------ */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Select Milestone:</label>
          <select
            value={selectedMilestone}
            onChange={(e) => setSelectedMilestone(e.target.value)}
            className={styles.select}
          >
            <option value="all">All milestones</option>
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
            <h3>Total evaluations</h3>
            <div className={styles.summaryNumber}>{stats.totalEvaluations}</div>
          </div>
        </Card>
        
        <Card className={styles.summaryCard}>
          <div className={styles.summaryContent}>
            <h3>Total penalty cards</h3>
            <div className={styles.summaryNumber}>{stats.totalPenalties}</div>
          </div>
        </Card>
      </div>

      {/* ------------------ Evaluations Table ------------------ */}
      <div className={styles.evaluationsSection}>
        <h2>Student evaluation table</h2>
        <div className={styles.tableContainer}>
          {selectedMilestone === "all" ? (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionContent}>
                <h3>Select a milestone to view evaluations</h3>
                <p>Please choose a specific milestone to view mentor feedback.</p>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={evaluations}
              loading={loading}
              emptyMessage="No evaluations for this milestone"
              showIndex={false}
            />
          )}
        </div>
      </div>

      {/* ------------------ General Penalty Cards Table ------------------ */}
      <div className={styles.evaluationsSection}>
        <h2>Personal penalty cards</h2>
        <div className={styles.tableContainer}>
          <DataTable
            columns={penaltyColumns}
            data={penaltyCardsGeneral}
            loading={loadingPenaltyCards}
            emptyMessage="No personal penalty cards"
            showIndex={false}
          />
        </div>
      </div>

    </div>
  );
}