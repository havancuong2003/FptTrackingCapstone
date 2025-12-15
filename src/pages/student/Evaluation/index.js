import React from "react";
import styles from "./index.module.scss";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import DataTable from "../../../components/DataTable/DataTable";
import { getGroupId } from "../../../auth/auth";
import { getEvaluationsByStudent, getGeneralPenaltyCardsByStudent } from "../../../api/evaluation";

export default function StudentEvaluation() {
  const [evaluations, setEvaluations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [penaltyCardsGeneral, setPenaltyCardsGeneral] = React.useState([]);
  const [loadingPenaltyCards, setLoadingPenaltyCards] = React.useState(false);


  // ------------------ Fetch All Evaluations ------------------
  const fetchAllEvaluations = async () => {
    setLoading(true);
    try {
      // API trả về mảng trực tiếp: [{evaluationId: 2, feedback: "...", deliverableName: "...", ...}]
      const response = await getEvaluationsByStudent();
      
      // response đã là mảng từ API (getEvaluationsByStudent trả về response.data)
      if (Array.isArray(response)) {
        setEvaluations(response);
      } else {
        setEvaluations([]);
      }
    } catch (err) {
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
        // API trả về mảng trực tiếp: [{name: "vắng họp", type: "Warning", description: "...", ...}]
        const response = await getGeneralPenaltyCardsByStudent();

        // response đã là mảng từ API (getGeneralPenaltyCardsByStudent trả về response.data)
        if (Array.isArray(response)) {
          setPenaltyCardsGeneral(response);
        } else {
          setPenaltyCardsGeneral([]);
        }
      } catch (err) {
        setPenaltyCardsGeneral([]);
      } finally {
        setLoadingPenaltyCards(false);
      }
    };

    fetchGeneralPenaltyCards();
  }, []);


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
      key: 'milestone',
      title: 'Milestone',
      render: (evaluation) => (
        <span>{evaluation.deliverableName || '-'}</span>
      )
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
          View all mentor feedback and penalty cards
        </p>
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
          <DataTable
            columns={columns}
            data={evaluations}
            loading={loading}
            emptyMessage="No evaluations available"
            showIndex={false}
          />
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