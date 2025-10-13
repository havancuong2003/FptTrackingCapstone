import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Select from '../../../components/Select/Select';

export default function SupervisorEvaluation() {
  const [evaluations, setEvaluations] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedGroup, setSelectedGroup] = React.useState('GR01');
  const [selectedMilestone, setSelectedMilestone] = React.useState('all');
  const [evaluateModal, setEvaluateModal] = React.useState(false);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [newEvaluation, setNewEvaluation] = React.useState({
    studentId: '',
    milestoneId: '',
    score: '',
    comment: '',
    penaltyCards: [],
    attendance: 'present',
    lateTasks: 0
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock groups data with students and evaluations
        const groupsData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "groupId": "GR01",
              "groupName": "Team Alpha",
              "milestones": [
                {
                  "id": 1,
                  "name": "Project Setup & Planning",
                  "students": [
                    {
                      "id": "SE00001",
                      "name": "Nguyen Van A",
                      "role": "Team Leader",
                      "attendance": "present",
                      "lateTasks": 0,
                      "penaltyCards": [],
                      "evaluations": [
                        {
                          "id": 1,
                          "milestoneId": 1,
                          "score": 9.5,
                          "comment": "Excellent leadership and project planning. Clear vision and good team coordination.",
                          "penaltyCards": [],
                          "createdAt": "2025-10-21T10:00:00Z"
                        }
                      ]
                    },
                    {
                      "id": "SE00002",
                      "name": "Nguyen Van B",
                      "role": "Developer",
                      "attendance": "present",
                      "lateTasks": 2,
                      "penaltyCards": [
                        {
                          "type": "late-submission",
                          "description": "Late submission for task assignment",
                          "date": "2025-10-15T14:30:00Z"
                        }
                      ],
                      "evaluations": [
                        {
                          "id": 2,
                          "milestoneId": 1,
                          "score": 7.0,
                          "comment": "Good technical skills but needs improvement in time management. Late submissions affected team progress.",
                          "penaltyCards": ["late-submission"],
                          "createdAt": "2025-10-21T10:00:00Z"
                        }
                      ]
                    },
                    {
                      "id": "SE00003",
                      "name": "Nguyen Van C",
                      "role": "Designer",
                      "attendance": "absent",
                      "lateTasks": 1,
                      "penaltyCards": [
                        {
                          "type": "missing-meeting",
                          "description": "Absent from team meeting without notice",
                          "date": "2025-10-18T09:00:00Z"
                        }
                      ],
                      "evaluations": []
                    }
                  ]
                },
                {
                  "id": 2,
                  "name": "Design & Architecture",
                  "students": [
                    {
                      "id": "SE00001",
                      "name": "Nguyen Van A",
                      "role": "Team Leader",
                      "attendance": "present",
                      "lateTasks": 0,
                      "penaltyCards": [],
                      "evaluations": []
                    },
                    {
                      "id": "SE00002",
                      "name": "Nguyen Van B",
                      "role": "Developer",
                      "attendance": "present",
                      "lateTasks": 1,
                      "penaltyCards": [],
                      "evaluations": []
                    },
                    {
                      "id": "SE00003",
                      "name": "Nguyen Van C",
                      "role": "Designer",
                      "attendance": "present",
                      "lateTasks": 0,
                      "penaltyCards": [],
                      "evaluations": []
                    }
                  ]
                }
              ]
            }
          ]
        };
        
        setGroups(groupsData.data);
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

  const getPenaltyCardInfo = (type) => {
    switch (type) {
      case 'late-submission':
        return { text: 'Late Submission', color: '#d97706', icon: '⏰' };
      case 'missing-meeting':
        return { text: 'Missing Meeting', color: '#dc2626', icon: '🚫' };
      case 'poor-quality':
        return { text: 'Poor Quality', color: '#dc2626', icon: '❌' };
      case 'no-participation':
        return { text: 'No Participation', color: '#dc2626', icon: '😴' };
      default:
        return { text: type, color: '#64748b', icon: '⚠️' };
    }
  };

  const getAttendanceInfo = (attendance) => {
    switch (attendance) {
      case 'present':
        return { text: 'Present', color: '#059669', icon: '✅' };
      case 'absent':
        return { text: 'Absent', color: '#dc2626', icon: '❌' };
      case 'late':
        return { text: 'Late', color: '#d97706', icon: '⏰' };
      default:
        return { text: 'Unknown', color: '#64748b', icon: '❓' };
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

  // Get filtered data
  const selectedGroupData = groups.find(group => group.groupId === selectedGroup);
  const selectedMilestoneData = selectedGroupData?.milestones?.find(m => 
    selectedMilestone === 'all' || m.id.toString() === selectedMilestone
  );
  
  const studentsToEvaluate = selectedMilestoneData?.students || [];
  const allEvaluations = selectedGroupData?.milestones?.flatMap(m => 
    m.students?.flatMap(s => s.evaluations?.map(e => ({
      ...e,
      studentId: s.id,
      studentName: s.name,
      milestoneName: m.name
    }))) || []
  ) || [];

  const milestoneOptions = selectedGroupData?.milestones?.map(m => ({ 
    value: m.id.toString(), 
    label: m.name 
  })) || [];

  const openEvaluateModal = (student) => {
    setSelectedStudent(student);
    setNewEvaluation({
      studentId: student.id,
      milestoneId: selectedMilestoneData?.id?.toString() || '',
      score: '',
      comment: '',
      penaltyCards: [],
      attendance: student.attendance,
      lateTasks: student.lateTasks
    });
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
    <>
      <div className={styles.container}>
      <div className={styles.header}>
        <h1>⭐ Student Evaluation - Supervisor View</h1>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Group:</label>
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={groups.map(group => ({ value: group.groupId, label: `${group.groupName} (${group.groupId})` }))}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Milestone:</label>
            <Select
              value={selectedMilestone}
              onChange={setSelectedMilestone}
              options={[{ value: 'all', label: 'All Milestones' }, ...milestoneOptions]}
            />
          </div>
        </div>
      </div>
      
      {selectedGroupData && (
        <>
          <div className={styles.groupInfo}>
            <h2>📈 {selectedGroupData.groupName} ({selectedGroupData.groupId}) - Evaluation Summary</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{studentsToEvaluate.length}</div>
                <div className={styles.statLabel}>Students</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allEvaluations.length}</div>
                <div className={styles.statLabel}>Evaluations</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>
                  {studentsToEvaluate.length > 0 ? Math.round((allEvaluations.length / studentsToEvaluate.length) * 100) : 0}%
                </div>
                <div className={styles.statLabel}>Completion Rate</div>
              </div>
            </div>
          </div>
          
          <div className={styles.evaluationTable}>
            <h2>📊 Students Evaluation Table</h2>
            <div className={styles.tableContainer}>
              <table className={styles.evaluationTable}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Role</th>
                    <th>Attendance</th>
                    <th>Late Tasks</th>
                    <th>Penalty Cards</th>
                    <th>Score</th>
                    <th>Comment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsToEvaluate.map((student) => {
                    const attendanceInfo = getAttendanceInfo(student.attendance);
                    const latestEvaluation = student.evaluations?.[0];
                    
                    return (
                      <tr key={student.id}>
                        <td>
                          <div className={styles.studentInfo}>
                            <strong>{student.name}</strong>
                            <span className={styles.studentId}>({student.id})</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.roleTag}>{student.role}</span>
                        </td>
                        <td>
                          <div className={styles.attendanceInfo}>
                            <span 
                              className={styles.attendanceIcon}
                              style={{ color: attendanceInfo.color }}
                            >
                              {attendanceInfo.icon}
                            </span>
                            <span 
                              className={styles.attendanceText}
                              style={{ color: attendanceInfo.color }}
                            >
                              {attendanceInfo.text}
                            </span>
                          </div>
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
                                const penaltyInfo = getPenaltyCardInfo(card.type);
                                return (
                                  <span 
                                    key={index}
                                    className={styles.penaltyCard}
                                    style={{ backgroundColor: penaltyInfo.color }}
                                    title={card.description}
                                  >
                                    {penaltyInfo.icon} {penaltyInfo.text}
                                  </span>
                                );
                              })
                            ) : (
                              <span className={styles.noPenalty}>No penalties</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {latestEvaluation ? (
                            <div className={styles.scoreInfo}>
                              <span 
                                className={styles.scoreValue}
                                style={{ color: getScoreColor(latestEvaluation.score) }}
                              >
                                {latestEvaluation.score}/10
                              </span>
                              <span 
                                className={styles.scoreText}
                                style={{ color: getScoreColor(latestEvaluation.score) }}
                              >
                                {getScoreText(latestEvaluation.score)}
                              </span>
                            </div>
                          ) : (
                            <span className={styles.noScore}>Not evaluated</span>
                          )}
                        </td>
                        <td>
                          {latestEvaluation ? (
                            <div className={styles.commentPreview}>
                              {latestEvaluation.comment.length > 50 
                                ? `${latestEvaluation.comment.substring(0, 50)}...` 
                                : latestEvaluation.comment
                              }
                            </div>
                          ) : (
                            <span className={styles.noComment}>No comment</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <Button 
                              onClick={() => openEvaluateModal(student)}
                              size="sm"
                              variant={latestEvaluation ? "secondary" : "primary"}
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
        {selectedStudent && (
          <div className={styles.evaluateModal}>
            <h2>⭐ Evaluate Student</h2>
            <div className={styles.studentInfo}>
              <h3>Evaluating: {selectedStudent.name} ({selectedStudent.id})</h3>
              <p>Role: {selectedStudent.role} | Milestone: {selectedMilestoneData?.name}</p>
            </div>
            
            <div className={styles.evaluationForm}>
              <div className={styles.formSection}>
                <h4>📊 Basic Information</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Attendance</label>
                    <select
                      value={newEvaluation.attendance}
                      onChange={(e) => setNewEvaluation({...newEvaluation, attendance: e.target.value})}
                      className={styles.select}
                    >
                      <option value="present">✅ Present</option>
                      <option value="absent">❌ Absent</option>
                      <option value="late">⏰ Late</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Late Tasks Count</label>
                    <input
                      type="number"
                      value={newEvaluation.lateTasks}
                      onChange={(e) => setNewEvaluation({...newEvaluation, lateTasks: parseInt(e.target.value) || 0})}
                      className={styles.input}
                      min="0"
                      placeholder="Number of late tasks"
                    />
                  </div>
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h4>⭐ Evaluation</h4>
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
                    placeholder="Provide detailed feedback about the student's performance..."
                    className={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>
              
              <div className={styles.formSection}>
                <h4>⚠️ Penalty Cards</h4>
                <div className={styles.penaltyCardsList}>
                  {['late-submission', 'missing-meeting', 'poor-quality', 'no-participation'].map(penaltyType => {
                    const penaltyInfo = getPenaltyCardInfo(penaltyType);
                    const isSelected = newEvaluation.penaltyCards.includes(penaltyType);
                    
                    return (
                      <div 
                        key={penaltyType}
                        className={`${styles.penaltyCardOption} ${isSelected ? styles.selected : ''}`}
                        onClick={() => {
                          const updatedCards = isSelected 
                            ? newEvaluation.penaltyCards.filter(card => card !== penaltyType)
                            : [...newEvaluation.penaltyCards, penaltyType];
                          setNewEvaluation({...newEvaluation, penaltyCards: updatedCards});
                        }}
                      >
                        <span 
                          className={styles.penaltyIcon}
                          style={{ color: penaltyInfo.color }}
                        >
                          {penaltyInfo.icon}
                        </span>
                        <span className={styles.penaltyText}>{penaltyInfo.text}</span>
                        {isSelected && <span className={styles.checkmark}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
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
        )}
      </Modal>
    </>
  );
}
