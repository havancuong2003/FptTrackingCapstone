import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import Modal from '../../../components/Modal/Modal';

export default function StudentDeliveries() {
  const [deliveries, setDeliveries] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [uploadModal, setUploadModal] = React.useState(false);
  const [selectedMilestone, setSelectedMilestone] = React.useState(null);
  const [uploadData, setUploadData] = React.useState({
    fileName: '',
    fileType: 'document',
    fileSize: '',
    description: ''
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
              "id": 1,
              "milestoneId": 1,
              "milestoneName": "Project Proposal",
              "deliverableId": 1,
              "deliverableName": "Project Proposal Document",
              "fileName": "project_proposal.pdf",
              "fileSize": "2.5MB",
              "uploadDate": "2025-10-19T15:30:00Z",
              "status": "on-time",
              "submittedBy": "SE00001",
              "submittedByName": "Nguyen Van A"
            },
            {
              "id": 2,
              "milestoneId": 2,
              "milestoneName": "System Design Document",
              "deliverableId": 2,
              "deliverableName": "System Design Document",
              "fileName": "system_design.docx",
              "fileSize": "1.8MB",
              "uploadDate": "2025-10-28T10:15:00Z",
              "status": "late",
              "submittedBy": "SE00002",
              "submittedByName": "Nguyen Van B"
            }
          ]
        };
        
        setDeliveries(mockData.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'on-time':
        return { icon: '✓', color: '#059669', text: 'On Time' };
      case 'late':
        return { icon: '⚠', color: '#d97706', text: 'Late' };
      default:
        return { icon: '?', color: '#64748b', text: 'Unknown' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openUploadModal = (milestone) => {
    setSelectedMilestone(milestone);
    setUploadModal(true);
  };

  const handleUpload = () => {
    if (!uploadData.fileName || !uploadData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const newDelivery = {
      id: Date.now(), // Simple ID generation
      fileName: uploadData.fileName,
      fileSize: uploadData.fileSize || '2.5MB',
      uploadDate: new Date().toISOString(),
      uploadedBy: 'SE00001', // Mock user ID
      uploadedByName: 'Nguyen Van A',
      status: 'submitted',
      fileType: uploadData.fileType,
      description: uploadData.description,
      milestoneId: selectedMilestone?.id ,
      milestoneName: selectedMilestone?.name || 'Project Proposal'
    };

    setDeliveries(prev => [newDelivery, ...prev]);
    setUploadModal(false);
    setUploadData({
      fileName: '',
      fileType: 'document',
      fileSize: '',
      description: ''
    });
    alert('Delivery uploaded successfully!');
  };

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
        <h1>Deliveries</h1>
        <Button onClick={() => setUploadModal(true)}>
          Upload New File
        </Button>
      </div>
      
      <div className={styles.deliveriesList}>
        {deliveries.map((delivery) => {
          const statusInfo = getStatusInfo(delivery.status);
          return (
            <div key={delivery.id} className={styles.deliveryCard}>
              <div className={styles.deliveryHeader}>
                <div className={styles.deliveryInfo}>
                  <h3>{delivery.milestoneName}</h3>
                  <p className={styles.deliverableName}>{delivery.deliverableName}</p>
                </div>
                <div className={styles.deliveryStatus}>
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
              </div>
              
              <div className={styles.deliveryDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>File:</span>
                  <span className={styles.value}>{delivery.fileName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Size:</span>
                  <span className={styles.value}>{delivery.fileSize}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Uploaded:</span>
                  <span className={styles.value}>{formatDate(delivery.uploadDate)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>By:</span>
                  <span className={styles.value}>{delivery.submittedByName}</span>
                </div>
              </div>
              
              <div className={styles.deliveryActions}>
                <Button variant="secondary" size="sm">
                  Download
                </Button>
                <Button variant="secondary" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {uploadModal && (
        <div className={styles.modalOverlay} onClick={() => setUploadModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Upload New File</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setUploadModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>File Name</label>
                <Input
                  value={uploadData.fileName}
                  onChange={(e) => setUploadData({...uploadData, fileName: e.target.value})}
                  placeholder="Enter file name"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>File Type</label>
                <select 
                  value={uploadData.fileType}
                  onChange={(e) => setUploadData({...uploadData, fileType: e.target.value})}
                  className={styles.select}
                >
                  <option value="document">Document</option>
                  <option value="code">Code</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>File Size</label>
                <Input
                  value={uploadData.fileSize}
                  onChange={(e) => setUploadData({...uploadData, fileSize: e.target.value})}
                  placeholder="e.g., 2.5MB"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  placeholder="Enter file description"
                  className={styles.textarea}
                  rows={3}
                />
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setUploadModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload}>
                Upload File
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
