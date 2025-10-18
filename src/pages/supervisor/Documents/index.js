import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import Select from '../../../components/Select/Select';

export default function SupervisorDocuments() {
  const [deliveries, setDeliveries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedGroup, setSelectedGroup] = React.useState('GR01');
  const [selectedMilestone, setSelectedMilestone] = React.useState('all');
  const [selectedDeliveryItem, setSelectedDeliveryItem] = React.useState('all');
  const [filter, setFilter] = React.useState('all');
  const [viewModal, setViewModal] = React.useState(false);
  const [selectedDelivery, setSelectedDelivery] = React.useState(null);
  const [evaluationModal, setEvaluationModal] = React.useState(false);
  const [evaluation, setEvaluation] = React.useState({
    score: '',
    comment: '',
    status: 'approved'
  });

  React.useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
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
                  "deliveryItems": [
                    {
                      "id": 1,
                      "name": "Project Charter",
                      "deadline": "2025-10-15T23:59:00Z",
                      "submissions": [
                        {
                          "id": 1,
                          "fileName": "project_charter_v1.pdf",
                          "fileSize": "2.1MB",
                          "uploader": "SE00001",
                          "uploaderName": "Nguyen Van A",
                          "uploadTime": "2025-10-14T16:30:00Z",
                          "version": "1.0",
                          "comment": "Initial project charter submission",
                          "status": "on-time",
                          "supervisorComment": "",
                          "score": null,
                          "evaluationStatus": "pending"
                        },
                        {
                          "id": 2,
                          "fileName": "project_charter_v2.pdf",
                          "fileSize": "2.3MB",
                          "uploader": "SE00001",
                          "uploaderName": "Nguyen Van A",
                          "uploadTime": "2025-10-15T10:15:00Z",
                          "version": "2.0",
                          "comment": "Updated based on feedback",
                          "status": "on-time",
                          "supervisorComment": "Good improvement, but still missing some technical details",
                          "score": 7.5,
                          "evaluationStatus": "reviewed"
                        }
                      ]
                    }
                  ]
                },
                {
                  "id": 2,
                  "name": "Design & Architecture",
                  "deliveryItems": [
                    {
                      "id": 2,
                      "name": "System Design Document",
                      "deadline": "2025-10-25T23:59:00Z",
                      "submissions": [
                        {
                          "id": 3,
                          "fileName": "system_design_v1.docx",
                          "fileSize": "1.8MB",
                          "uploader": "SE00002",
                          "uploaderName": "Nguyen Van B",
                          "uploadTime": "2025-10-24T14:20:00Z",
                          "version": "1.0",
                          "comment": "System design document with architecture diagrams",
                          "status": "on-time",
                          "supervisorComment": "",
                          "score": null,
                          "evaluationStatus": "pending"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        };
        
        setDeliveries(mockData.data);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'on-time':
        return { color: '#059669', text: 'On Time', icon: '✅' };
      case 'late':
        return { color: '#dc2626', text: 'Late', icon: '⚠️' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '❓' };
    }
  };

  const getEvaluationStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { color: '#d97706', text: 'Pending Review', icon: '⏳' };
      case 'reviewed':
        return { color: '#059669', text: 'Reviewed', icon: '✅' };
      case 'rejected':
        return { color: '#dc2626', text: 'Rejected', icon: '❌' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '❓' };
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

  const openViewModal = (submission) => {
    setSelectedDelivery(submission);
    setViewModal(true);
  };

  const openEvaluationModal = (submission) => {
    setSelectedDelivery(submission);
    setEvaluation({
      score: submission.score || '',
      comment: submission.supervisorComment || '',
      status: submission.evaluationStatus === 'reviewed' ? 'approved' : 'pending'
    });
    setEvaluationModal(true);
  };

  const submitEvaluation = () => {
    alert('Evaluation submitted successfully! (Mock)');
    setEvaluationModal(false);
    setEvaluation({
      score: '',
      comment: '',
      status: 'approved'
    });
  };

  // Get filtered data
  const selectedGroupData = deliveries.find(group => group.groupId === selectedGroup);
  const allSubmissions = selectedGroupData?.milestones?.flatMap(milestone => 
    milestone.deliveryItems?.flatMap(deliveryItem => 
      deliveryItem.submissions?.map(submission => ({
        ...submission,
        milestoneName: milestone.name,
        deliveryItemName: deliveryItem.name,
        deadline: deliveryItem.deadline
      }))
    )
  ) || [];

  const filteredSubmissions = allSubmissions.filter(submission => {
    if (filter !== 'all' && submission.evaluationStatus !== filter) return false;
    if (selectedMilestone !== 'all' && submission.milestoneName !== selectedGroupData?.milestones?.find(m => m.id.toString() === selectedMilestone)?.name) return false;
    if (selectedDeliveryItem !== 'all' && submission.deliveryItemName !== selectedGroupData?.milestones?.flatMap(m => m.deliveryItems)?.find(d => d.id.toString() === selectedDeliveryItem)?.name) return false;
    return true;
  });

  // Get unique options for filters
  const milestoneOptions = selectedGroupData?.milestones?.map(m => ({ value: m.id.toString(), label: m.name })) || [];
  const deliveryItemOptions = selectedGroupData?.milestones?.flatMap(m => 
    m.deliveryItems?.map(d => ({ value: d.id.toString(), label: d.name, milestoneId: m.id })) || []
  ) || [];

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading deliveries...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📦 Delivery Management - Supervisor View</h1>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label>Group:</label>
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={deliveries.map(group => ({ value: group.groupId, label: `${group.groupName} (${group.groupId})` }))}
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
          <div className={styles.controlGroup}>
            <label>Delivery Item:</label>
            <Select
              value={selectedDeliveryItem}
              onChange={setSelectedDeliveryItem}
              options={[{ value: 'all', label: 'All Delivery Items' }, ...deliveryItemOptions]}
            />
          </div>
          <div className={styles.controlGroup}>
            <label>Status:</label>
            <Select
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All Submissions' },
                { value: 'pending', label: 'Pending Review' },
                { value: 'reviewed', label: 'Reviewed' },
                { value: 'rejected', label: 'Rejected' }
              ]}
            />
          </div>
        </div>
      </div>
      
      {selectedGroupData && (
        <>
          <div className={styles.groupInfo}>
            <h2>📈 {selectedGroupData.groupName} ({selectedGroupData.groupId}) - Delivery Summary</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allSubmissions.length}</div>
                <div className={styles.statLabel}>Total Submissions</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allSubmissions.filter(s => s.evaluationStatus === 'reviewed').length}</div>
                <div className={styles.statLabel}>Reviewed</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allSubmissions.filter(s => s.evaluationStatus === 'pending').length}</div>
                <div className={styles.statLabel}>Pending Review</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allSubmissions.filter(s => s.status === 'on-time').length}</div>
                <div className={styles.statLabel}>On Time</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{allSubmissions.filter(s => s.status === 'late').length}</div>
                <div className={styles.statLabel}>Late</div>
              </div>
            </div>
          </div>
      
          <div className={styles.submissionsList}>
            {filteredSubmissions.map((submission) => {
              const statusInfo = getStatusInfo(submission.status);
              const evaluationStatusInfo = getEvaluationStatusInfo(submission.evaluationStatus);
              
              return (
                <div key={submission.id} className={styles.submissionCard}>
                  <div className={styles.submissionHeader}>
                    <div className={styles.submissionInfo}>
                      <h3>{submission.fileName}</h3>
                      <p className={styles.submissionMeta}>
                        {submission.fileSize} • Uploaded by {submission.uploaderName} • {formatDate(submission.uploadTime)}
                      </p>
                      <div className={styles.submissionContext}>
                        <span className={styles.milestoneTag}>📋 {submission.milestoneName}</span>
                        <span className={styles.deliveryTag}>📦 {submission.deliveryItemName}</span>
                        <span className={styles.versionTag}>v{submission.version}</span>
                      </div>
                    </div>
                    <div className={styles.submissionStatus}>
                      <div className={styles.statusItem}>
                        <span 
                          className={styles.statusIcon}
                          style={{ color: statusInfo.color }}
                        >
                          {statusInfo.icon}
                        </span>
                        <span 
                          className={styles.statusText}
                          style={{ color: statusInfo.color }}
                        >
                          {statusInfo.text}
                        </span>
                      </div>
                      <div className={styles.evaluationStatus}>
                        <span 
                          className={styles.evaluationIcon}
                          style={{ color: evaluationStatusInfo.color }}
                        >
                          {evaluationStatusInfo.icon}
                        </span>
                        <span 
                          className={styles.evaluationText}
                          style={{ color: evaluationStatusInfo.color }}
                        >
                          {evaluationStatusInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.submissionDetails}>
                    <div className={styles.detailRow}>
                      <div className={styles.detailItem}>
                        <strong>👤 Uploader:</strong>
                        <span>{submission.uploaderName} ({submission.uploader})</span>
                      </div>
                      <div className={styles.detailItem}>
                        <strong>⏰ Upload Time:</strong>
                        <span>{formatDate(submission.uploadTime)}</span>
                      </div>
                    </div>
                    <div className={styles.detailRow}>
                      <div className={styles.detailItem}>
                        <strong>📅 Deadline:</strong>
                        <span>{formatDate(submission.deadline)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <strong>📊 Score:</strong>
                        <span>{submission.score ? `${submission.score}/10` : 'Not scored'}</span>
                      </div>
                    </div>
                    {submission.comment && (
                      <div className={styles.commentSection}>
                        <strong>💬 Student Comment:</strong>
                        <p className={styles.commentText}>{submission.comment}</p>
                      </div>
                    )}
                    {submission.supervisorComment && (
                      <div className={styles.supervisorCommentSection}>
                        <strong>👨‍🏫 Supervisor Comment:</strong>
                        <p className={styles.supervisorCommentText}>{submission.supervisorComment}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.submissionActions}>
                    <Button variant="secondary" size="sm">
                      📥 Download
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => openViewModal(submission)}
                    >
                      👁️ View Details
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => openEvaluationModal(submission)}
                    >
                      ⭐ Evaluate
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      
      {filteredSubmissions.length === 0 && selectedGroupData && (
        <div className={styles.emptyState}>
          <p>No submissions found for the selected filters.</p>
        </div>
      )}
      
      {!selectedGroupData && (
        <div className={styles.emptyState}>
          <p>No deliveries available for the selected group.</p>
        </div>
      )}

      <Modal open={viewModal} onClose={() => setViewModal(false)}>
        {selectedDelivery && (
          <div className={styles.viewModal}>
            <h2>📦 Submission Details</h2>
            
            <div className={styles.submissionDetail}>
              <h3>{selectedDelivery.fileName}</h3>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <strong>📋 Milestone:</strong> {selectedDelivery.milestoneName}
                </div>
                <div className={styles.detailItem}>
                  <strong>📦 Delivery Item:</strong> {selectedDelivery.deliveryItemName}
                </div>
                <div className={styles.detailItem}>
                  <strong>📁 File Size:</strong> {selectedDelivery.fileSize}
                </div>
                <div className={styles.detailItem}>
                  <strong>👤 Uploader:</strong> {selectedDelivery.uploaderName} ({selectedDelivery.uploader})
                </div>
                <div className={styles.detailItem}>
                  <strong>⏰ Upload Time:</strong> {formatDate(selectedDelivery.uploadTime)}
                </div>
                <div className={styles.detailItem}>
                  <strong>📅 Deadline:</strong> {formatDate(selectedDelivery.deadline)}
                </div>
                <div className={styles.detailItem}>
                  <strong>📊 Version:</strong> v{selectedDelivery.version}
                </div>
                <div className={styles.detailItem}>
                  <strong>📈 Score:</strong> {selectedDelivery.score ? `${selectedDelivery.score}/10` : 'Not scored'}
                </div>
              </div>
              
              {selectedDelivery.comment && (
                <div className={styles.commentSection}>
                  <h4>💬 Student Comment</h4>
                  <p>{selectedDelivery.comment}</p>
                </div>
              )}
              
              {selectedDelivery.supervisorComment && (
                <div className={styles.supervisorCommentSection}>
                  <h4>👨‍🏫 Supervisor Comment</h4>
                  <p>{selectedDelivery.supervisorComment}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={evaluationModal} onClose={() => setEvaluationModal(false)}>
        {selectedDelivery && (
          <div className={styles.evaluationModal}>
            <h2>⭐ Evaluate Submission</h2>
            
            <div className={styles.evaluationForm}>
              <div className={styles.formGroup}>
                <label>Score (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={evaluation.score}
                  onChange={(e) => setEvaluation({...evaluation, score: e.target.value})}
                  className={styles.input}
                  placeholder="Enter score"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Comment</label>
                <textarea
                  value={evaluation.comment}
                  onChange={(e) => setEvaluation({...evaluation, comment: e.target.value})}
                  placeholder="Enter your evaluation comment"
                  className={styles.textarea}
                  rows={4}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  value={evaluation.status}
                  onChange={(e) => setEvaluation({...evaluation, status: e.target.value})}
                  className={styles.select}
                >
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="needs_revision">🔄 Needs Revision</option>
                </select>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setEvaluationModal(false)}>
                Cancel
              </Button>
              <Button onClick={submitEvaluation}>
                Submit Evaluation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
