import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';

export default function StudentDocuments() {
  const [documents, setDocuments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [uploadModal, setUploadModal] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState(null);
  const [viewModal, setViewModal] = React.useState(false);
  const [newDocument, setNewDocument] = React.useState({
    fileName: '',
    fileType: 'reference',
    description: '',
    tags: ''
  });

  React.useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData = {
          "status": 200,
          "message": "Fetched successfully",
          "data": [
            {
              "id": 1,
              "fileName": "react_best_practices.pdf",
              "fileSize": "3.2MB",
              "uploadDate": "2025-10-12T09:00:00Z",
              "uploadedBy": "SE00001",
              "uploadedByName": "Nguyen Van A",
              "aiSummary": {
                "summary": "This document covers React best practices including component structure, state management, and performance optimization techniques.",
                "keywords": ["React", "Components", "State Management", "Performance", "Best Practices"],
                "objective": "To provide guidelines for writing clean and efficient React code",
                "conclusion": "Following these practices will improve code quality and maintainability"
              },
              "type": "reference",
              "tags": ["React", "Frontend", "Development"]
            },
            {
              "id": 2,
              "fileName": "database_design_notes.docx",
              "fileSize": "1.5MB",
              "uploadDate": "2025-10-14T16:30:00Z",
              "uploadedBy": "SE00002",
              "uploadedByName": "Nguyen Van B",
              "aiSummary": {
                "summary": "Database design notes covering entity relationships, normalization, and indexing strategies for the project.",
                "keywords": ["Database", "Design", "Relationships", "Normalization", "Indexing"],
                "objective": "To document database design decisions and rationale",
                "conclusion": "The database design follows 3NF normalization and includes proper indexing for performance"
              },
              "type": "internal",
              "tags": ["Database", "Design", "Internal"]
            }
          ]
        };
        
        setDocuments(mockData.data);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeInfo = (type) => {
    switch (type) {
      case 'reference':
        return { color: '#3b82f6', text: 'Reference', icon: '📚' };
      case 'internal':
        return { color: '#059669', text: 'Internal', icon: '📄' };
      case 'guideline':
        return { color: '#d97706', text: 'Guideline', icon: '📋' };
      default:
        return { color: '#64748b', text: 'Unknown', icon: '📄' };
    }
  };

  const openViewModal = (document) => {
    setSelectedDocument(document);
    setViewModal(true);
  };

  const openUploadModal = () => {
    setUploadModal(true);
  };

  const uploadDocument = () => {
    alert('Document uploaded successfully! (Mock)');
    setUploadModal(false);
    setNewDocument({
      fileName: '',
      fileType: 'reference',
      description: '',
      tags: ''
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading documents...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Documents</h1>
        <Button onClick={openUploadModal}>
          Upload Document
        </Button>
      </div>
      
      <p className={styles.subtitle}>
        Share and access documents with your team. AI summaries are automatically generated for each document.
      </p>
      
      <div className={styles.documentsList}>
        {documents.map((document) => {
          const typeInfo = getTypeInfo(document.type);
          return (
            <div key={document.id} className={styles.documentCard}>
              <div className={styles.documentHeader}>
                <div className={styles.documentInfo}>
                  <h3>{document.fileName}</h3>
                  <p className={styles.documentMeta}>
                    {document.fileSize} • Uploaded by {document.uploadedByName} • {formatDate(document.uploadDate)}
                  </p>
                </div>
                <div className={styles.documentType}>
                  <span 
                    className={styles.typeIcon}
                    style={{ color: typeInfo.color }}
                  >
                    {typeInfo.icon}
                  </span>
                  <span 
                    className={styles.typeText}
                    style={{ color: typeInfo.color }}
                  >
                    {typeInfo.text}
                  </span>
                </div>
              </div>
              
              <div className={styles.documentTags}>
                {document.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className={styles.documentSummary}>
                <h4>AI Summary</h4>
                <p className={styles.summaryText}>{document.aiSummary.summary}</p>
                <div className={styles.summaryDetails}>
                  <div className={styles.summaryItem}>
                    <strong>Keywords:</strong> {document.aiSummary.keywords.join(', ')}
                  </div>
              </div>
            </div>
            
            <div className={styles.documentActions}>
              <Button variant="secondary" size="sm">
                Download
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => openViewModal(document)}
              >
                View Details
              </Button>
            </div>
          </div>
        );
      })}
    </div>
    
    {documents.length === 0 && (
      <div className={styles.emptyState}>
        <p>No documents available yet.</p>
        <p>Upload your first document to get started.</p>
      </div>
    )}

    <Modal open={uploadModal} onClose={() => setUploadModal(false)}>
      <div className={styles.uploadModal}>
        <h2>Upload New Document</h2>
        
        <div className={styles.formGroup}>
          <label>File Name</label>
          <input
            type="text"
            value={newDocument.fileName}
            onChange={(e) => setNewDocument({...newDocument, fileName: e.target.value})}
            placeholder="Enter file name"
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Document Type</label>
          <select
            value={newDocument.fileType}
            onChange={(e) => setNewDocument({...newDocument, fileType: e.target.value})}
            className={styles.select}
          >
            <option value="reference">Reference</option>
            <option value="internal">Internal</option>
            <option value="guideline">Guideline</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea
            value={newDocument.description}
            onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
            placeholder="Enter document description"
            className={styles.textarea}
            rows={3}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Tags (comma separated)</label>
          <input
            type="text"
            value={newDocument.tags}
            onChange={(e) => setNewDocument({...newDocument, tags: e.target.value})}
            placeholder="e.g., React, Frontend, Development"
            className={styles.input}
          />
        </div>
        
        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setUploadModal(false)}>
            Cancel
          </Button>
          <Button onClick={uploadDocument}>
            Upload Document
          </Button>
        </div>
      </div>
    </Modal>

    <Modal open={viewModal} onClose={() => setViewModal(false)}>
      {selectedDocument && (
        <div className={styles.viewModal}>
          <h2>Document Details</h2>
          
          <div className={styles.documentDetail}>
            <h3>{selectedDocument.fileName}</h3>
            <p><strong>Type:</strong> {getTypeInfo(selectedDocument.type).text}</p>
            <p><strong>Size:</strong> {selectedDocument.fileSize}</p>
            <p><strong>Uploaded by:</strong> {selectedDocument.uploadedByName}</p>
            <p><strong>Upload date:</strong> {formatDate(selectedDocument.uploadDate)}</p>
          </div>
          
          <div className={styles.aiSummary}>
            <h3>AI Summary</h3>
            <div className={styles.summarySection}>
              <h4>Summary</h4>
              <p>{selectedDocument.aiSummary.summary}</p>
            </div>
            
            <div className={styles.summarySection}>
              <h4>Keywords</h4>
              <div className={styles.keywordsList}>
                {selectedDocument.aiSummary.keywords.map((keyword, index) => (
                  <span key={index} className={styles.keyword}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            <div className={styles.summarySection}>
              <h4>Objective</h4>
              <p>{selectedDocument.aiSummary.objective}</p>
            </div>
            
            <div className={styles.summarySection}>
              <h4>Conclusion</h4>
              <p>{selectedDocument.aiSummary.conclusion}</p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  </div>
);
}
