import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

export default function SupervisorEvaluation() {
  const [evaluations, setEvaluations] = React.useState([]);
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [evaluateModal, setEvaluateModal] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [newEvaluation, setNewEvaluation] = React.useState({
    studentId: '',
    milestoneId: '',
    score: '',
    comment: '',
    penaltyTag: ''
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock evaluations data
        const evaluationsData = {
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
        
        // Mock students data
        const studentsData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "id": "SE00001",
              "name": "Nguyen Van A",
              "groupId": "GR01",
              "groupName": "Team Alpha",
              "milestones": [
                { "id": 1, "name": "Project Proposal", "status": "completed" },
                { "id": 2, "name": "System Design Document", "status": "completed" },
                { "id": 3, "name": "Prototype Development", "status": "in-progress" }
              ]
            },
            {
              "id": "SE00002",
              "name": "Nguyen Van B",
              "groupId": "GR01",
              "groupName": "Team Alpha",
              "milestones": [
                { "id": 1, "name": "Project Proposal", "status": "completed" },
                { "id": 2, "name": "System Design Document", "status": "pending" },
                { "id": 3, "name": "Prototype Development", "status": "pending" }
              ]
            }
          ]
        };
        
        setEvaluations(evaluationsData.data);
        setStudents(studentsData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const openEvaluateModal = (student) => {
    setSelectedStudent(student);
    setEvaluateModal(true);
  };

  const submitEvaluation = () => {
    if (!newEvaluation.studentId || !newEvaluation.score || !newEvaluation.comment) {
      alert('Please fill in all required fields');
      return;
    }

    const evaluation = {
      id: Date.now(),
      studentId: newEvaluation.studentId,
      studentName: students.find(s => s.id === newEvaluation.studentId)?.name || 'Unknown Student',
      milestoneId: newEvaluation.milestoneId,
      milestoneName: `Milestone ${newEvaluation.milestoneId}`,
      comment: newEvaluation.comment,
      penaltyTag: newEvaluation.penaltyTag || null,
      score: parseFloat(newEvaluation.score),
      createdAt: new Date().toISOString(),
      createdBy: 'SUPERVISOR001',
      createdByName: 'Dr. Smith'
    };

    setEvaluations(prev => [evaluation, ...prev]);
    setEvaluateModal(false);
    setNewEvaluation({
      studentId: '',
      milestoneId: '',
      score: '',
      comment: '',
      penaltyTag: ''
    });
    alert('Evaluation submitted successfully!');
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading evaluation data...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Student Evaluation</h1>
        <p className={styles.subtitle}>
          Evaluate student performance and provide feedback for each milestone.
        </p>
      </div>
      
      <div className={styles.sections}>
        <div className={styles.studentsSection}>
          <h2>Students to Evaluate</h2>
          <div className={styles.studentsList}>
            {students.map((student) => (
              <div key={student.id} className={styles.studentCard}>
                <div className={styles.studentInfo}>
                  <h3>{student.name}</h3>
                  <p className={styles.studentGroup}>
                    {student.groupName} ({student.groupId})
                  </p>
                </div>
                <div className={styles.milestonesList}>
                  <h4>Milestones</h4>
                  {student.milestones.map((milestone) => (
                    <div key={milestone.id} className={styles.milestoneItem}>
                      <span className={styles.milestoneName}>{milestone.name}</span>
                      <span 
                        className={styles.milestoneStatus}
                        style={{
                          color: milestone.status === 'completed' ? '#059669' : 
                                 milestone.status === 'in-progress' ? '#3b82f6' : '#d97706'
                        }}
                      >
                        {milestone.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={styles.studentActions}>
                  <Button 
                    onClick={() => openEvaluateModal(student)}
                    size="sm"
                  >
                    Evaluate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
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
                            color: '#fff'
                          }}
                        >
                          {penaltyInfo.text}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.evaluationActions}>
                    <Button variant="secondary" size="sm">
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
        <div className={styles.evaluateModal}>
          <h2>Evaluate Student</h2>
          <p>Evaluating: <strong>{selectedStudent?.name}</strong></p>
          
          <div className={styles.formGroup}>
            <label>Milestone</label>
            <select
              value={newEvaluation.milestoneId}
              onChange={(e) => setNewEvaluation({...newEvaluation, milestoneId: e.target.value})}
              className={styles.select}
            >
              <option value="">Select milestone</option>
              {selectedStudent?.milestones.map(milestone => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label>Score (0-10)</label>
            <input
              type="number"
              value={newEvaluation.score}
              onChange={(e) => setNewEvaluation({...newEvaluation, score: e.target.value})}
              className={styles.input}
              min="0"
              max="10"
              step="0.1"
              placeholder="Enter score"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Comment</label>
            <textarea
              value={newEvaluation.comment}
              onChange={(e) => setNewEvaluation({...newEvaluation, comment: e.target.value})}
              placeholder="Provide detailed feedback..."
              className={styles.textarea}
              rows={4}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Penalty Tag (optional)</label>
            <select
              value={newEvaluation.penaltyTag}
              onChange={(e) => setNewEvaluation({...newEvaluation, penaltyTag: e.target.value})}
              className={styles.select}
            >
              <option value="">No penalty</option>
              <option value="late-submission">Late Submission</option>
              <option value="missing-meeting">Missing Meeting</option>
              <option value="poor-quality">Poor Quality</option>
            </select>
          </div>
          
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setEvaluateModal(false)}>
              Cancel
            </Button>
            <Button onClick={submitEvaluation}>
              Submit Evaluation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
