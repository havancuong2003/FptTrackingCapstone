import React from 'react';
import styles from './index.module.scss';

export default function StudentEvaluation() {
  const [evaluations, setEvaluations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "id": 1,
              "studentId": "SE00001",
              "studentName": "Nguyen Van A",
              "milestoneId": 1,
              "milestoneName": "Project Proposal",
              "comment": "Excellent work on the project proposal. Clear problem statement and well-defined objectives. Good understanding of the requirements.",
              "penaltyTag": null,
              "score": 9.5,
              "createdAt": "2025-10-21T10:00:00Z",
              "createdBy": "SUPERVISOR001",
              "createdByName": "Dr. Smith"
            },
            {
              "id": 2,
              "studentId": "SE00001",
              "studentName": "Nguyen Van A",
              "milestoneId": 2,
              "milestoneName": "System Design Document",
              "comment": "Good technical design but submitted late. Please improve time management for future milestones.",
              "penaltyTag": "late-submission",
              "score": 7.0,
              "createdAt": "2025-10-29T14:30:00Z",
              "createdBy": "SUPERVISOR001",
              "createdByName": "Dr. Smith"
            }
          ]
        };
        
        setEvaluations(mockData.data);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 9) return '#059669';
    if (score >= 7) return '#d97706';
    return '#dc2626';
  };

  const getScoreText = (score) => {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Average';
    return 'Needs Improvement';
  };

  const getPenaltyInfo = (penaltyTag) => {
    if (!penaltyTag) return null;
    
    switch (penaltyTag) {
      case 'late-submission':
        return { text: 'Late Submission', color: '#d97706' };
      case 'missing-meeting':
        return { text: 'Missing Meeting', color: '#dc2626' };
      case 'poor-quality':
        return { text: 'Poor Quality', color: '#dc2626' };
      default:
        return { text: penaltyTag, color: '#64748b' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading evaluations...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Evaluation</h1>
        <p className={styles.subtitle}>
          View feedback and evaluations from your supervisor for each milestone.
        </p>
      
      <div className={styles.evaluationsList}>
        {evaluations.map((evaluation) => {
          const scoreColor = getScoreColor(evaluation.score);
          const scoreText = getScoreText(evaluation.score);
          const penaltyInfo = getPenaltyInfo(evaluation.penaltyTag);
          
          return (
            <div key={evaluation.id} className={styles.evaluationCard}>
              <div className={styles.evaluationHeader}>
                <div className={styles.evaluationInfo}>
                  <h3>{evaluation.milestoneName}</h3>
                  <p className={styles.evaluationDate}>
                    Evaluated on {formatDate(evaluation.createdAt)}
                  </p>
                </div>
                <div className={styles.evaluationScore}>
                  <div 
                    className={styles.scoreCircle}
                    style={{ 
                      backgroundColor: scoreColor,
                      color: '#fff'
                    }}
                  >
                    {evaluation.score}
                  </div>
                  <div className={styles.scoreText} style={{ color: scoreColor }}>
                    {scoreText}
                  </div>
                </div>
              </div>
              
              <div className={styles.evaluationContent}>
                <div className={styles.commentSection}>
                  <h4>Mentor Feedback</h4>
                  <p className={styles.comment}>{evaluation.comment}</p>
                </div>
                
                {penaltyInfo && (
                  <div className={styles.penaltySection}>
                    <h4>Penalty Tag</h4>
                    <span 
                      className={styles.penaltyTag}
                      style={{ 
                        backgroundColor: penaltyInfo.color,
                        color: '#fff'
                      }}
                    >
                      {penaltyInfo.text}
                    </span>
                  </div>
                )}
              </div>
              
              <div className={styles.evaluationFooter}>
                <div className={styles.evaluationMeta}>
                  <span>Evaluated by: {evaluation.createdByName}</span>
                  <span>Milestone: {evaluation.milestoneName}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {evaluations.length === 0 && (
        <div className={styles.emptyState}>
          <p>No evaluations available yet.</p>
          <p>Your mentor will provide feedback after each milestone submission.</p>
        </div>
      )}
    </div>
  );
}
