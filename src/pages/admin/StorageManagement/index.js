import React, { useState, useEffect } from 'react';
import styles from './index.module.scss';
import { 
  getStorageSemesters, 
  getSemesterGroups, 
  zipFolder, 
  unzipArchive 
} from '../../../api/storage';
import Button from '../../../components/Button/Button';
import DataTable from '../../../components/DataTable/DataTable';
import Modal from '../../../components/Modal/Modal';
import axiosClient from '../../../utils/axiosClient';

export default function StorageManagement() {
  const [loading, setLoading] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0
  });
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');

  // Load semesters list
  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    setLoading(true);
    try {
      const response = await getStorageSemesters();
      if (response?.status === 200 && Array.isArray(response.data)) {
        setSemesters(response.data);
      } else if (Array.isArray(response)) {
        setSemesters(response);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      alert('Unable to load semesters list');
    } finally {
      setLoading(false);
    }
  };

  // Load groups for selected semester
  const loadSemesterGroups = async (semesterName, pageNumber = 1) => {
    setLoadingGroups(true);
    try {
      const response = await getSemesterGroups(semesterName, pageNumber, pagination.pageSize);
      if (response?.status === 200 && response.data) {
        const data = response.data;
        setGroups(data.items || []);
        setPagination({
          pageNumber: data.pageNumber || pageNumber,
          pageSize: data.pageSize || pagination.pageSize,
          totalPages: data.totalPages || 1,
          totalCount: data.totalCount || 0,
          hasPreviousPage: data.hasPreviousPage || false,
          hasNextPage: data.hasNextPage || false
        });
      }
    } catch (error) {
      console.error('Error loading semester groups:', error);
      alert('Unable to load groups list');
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Handle semester detail click
  const handleSemesterClick = (semester) => {
    setSelectedSemester(semester);
    setDetailModalOpen(true);
    loadSemesterGroups(semester.name, 1);
  };

  // Handle zip folder
  const handleZip = async (semesterName) => {
    if (!confirm(`Are you sure you want to zip folder: ${semesterName}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await zipFolder(semesterName);
      if (response?.status === 200) {
        alert('Folder zipped successfully!');
        loadSemesters(); // Refresh list
      } else {
        alert(response?.message || 'Failed to zip folder');
      }
    } catch (error) {
      console.error('Error zipping folder:', error);
      alert(error.response?.data?.message || 'Failed to zip folder');
    } finally {
      setLoading(false);
    }
  };

  // Handle unzip archive
  const handleUnzip = async (semesterName) => {
    if (!confirm(`Are you sure you want to unzip: ${semesterName}?`)) {
      return;
    }

    try {
      setLoading(true);
      // Assuming archive file name is semesterName.zip
      const archiveFileName = `${semesterName}.zip`;
      const response = await unzipArchive(archiveFileName, true);
      if (response?.status === 200) {
        alert('Archive unzipped successfully!');
        loadSemesters(); // Refresh list
      } else {
        alert(response?.message || 'Failed to unzip archive');
      }
    } catch (error) {
      console.error('Error unzipping archive:', error);
      alert(error.response?.data?.message || 'Failed to unzip archive');
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF view
  const handleViewPdf = (pdfFilePath) => {
    if (!pdfFilePath) {
      alert('PDF file not available');
      return;
    }
    
    // Construct full URL
    // pdfFilePath from API is like: /uploads/Fall2025/Group11/Fall2025_Group11.pdf
    // We need to combine with baseURL from axiosClient
    const baseUrl = axiosClient.defaults.baseURL || '';
    let pdfUrl;
    
    if (pdfFilePath.startsWith('http://') || pdfFilePath.startsWith('https://')) {
      pdfUrl = pdfFilePath;
    } else {
      // Remove leading slash if baseURL already ends with one, or add if needed
      const cleanPath = pdfFilePath.startsWith('/') ? pdfFilePath : `/${pdfFilePath}`;
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      pdfUrl = `${cleanBase}${cleanPath}`;
    }
    
    setSelectedPdfUrl(pdfUrl);
    setPdfViewerOpen(true);
  };

  // Semester columns
  const semesterColumns = [
    {
      key: 'name',
      title: 'Semester Name',
      render: (semester) => (
        <button
          className={styles.semesterLink}
          onClick={() => handleSemesterClick(semester)}
          title="Click to view groups"
        >
          {semester.name}
        </button>
      )
    },
    {
      key: 'hasFolder',
      title: 'Has Folder',
      render: (semester) => (
        <span className={semester.hasFolder ? styles.statusYes : styles.statusNo}>
          {semester.hasFolder ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'folderSizeFormatted',
      title: 'Folder Size',
      render: (semester) => semester.folderSizeFormatted || '0 B'
    },
    {
      key: 'hasZipFile',
      title: 'Has Zip',
      render: (semester) => (
        <span className={semester.hasZipFile ? styles.statusYes : styles.statusNo}>
          {semester.hasZipFile ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'zipSizeFormatted',
      title: 'Zip Size',
      render: (semester) => semester.zipSizeFormatted || '0 B'
    },
    {
      key: 'totalSizeFormatted',
      title: 'Total Size',
      render: (semester) => (
        <strong>{semester.totalSizeFormatted || '0 B'}</strong>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (semester) => (
        <div className={styles.actionButtons}>
          {semester.hasFolder && !semester.hasZipFile && (
            <Button
              variant="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleZip(semester.name);
              }}
            >
              Zip
            </Button>
          )}
          {semester.hasZipFile && (
            <Button
              variant="secondary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleUnzip(semester.name);
              }}
            >
              Unzip
            </Button>
          )}
        </div>
      )
    }
  ];

  // Group columns for detail modal
  const groupColumns = [
    {
      key: 'groupName',
      title: 'Group Name',
      render: (group) => <strong>{group.groupName}</strong>
    },
    {
      key: 'sizeFormatted',
      title: 'Size',
      render: (group) => group.sizeFormatted || '0 B'
    },
    {
      key: 'fileCount',
      title: 'Files',
      render: (group) => group.fileCount || 0
    },
    {
      key: 'subFolderCount',
      title: 'Subfolders',
      render: (group) => group.subFolderCount || 0
    },
    {
      key: 'lastModified',
      title: 'Last Modified',
      render: (group) => {
        if (!group.lastModified) return 'N/A';
        try {
          return new Date(group.lastModified).toLocaleString('vi-VN');
        } catch {
          return group.lastModified;
        }
      }
    },
    {
      key: 'pdf',
      title: 'PDF',
      render: (group) => {
        if (!group.pdfFilePath) {
          return <span className={styles.noPdf}>No PDF</span>;
        }
        return (
          <Button
            variant="ghost"
            size="small"
            onClick={() => handleViewPdf(group.pdfFilePath)}
          >
            View PDF
          </Button>
        );
      }
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Storage Management</h1>
        <Button onClick={loadSemesters} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className={styles.content}>
        <DataTable
          columns={semesterColumns}
          data={semesters}
          loading={loading}
          emptyMessage="No semesters found"
          showIndex={true}
        />
      </div>

      {/* Detail Modal - Groups in Semester */}
      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <div className={styles.detailModal}>
          <h2>Groups in {selectedSemester?.name}</h2>
          
          <DataTable
            columns={groupColumns}
            data={groups}
            loading={loadingGroups}
            emptyMessage="No groups found"
            showIndex={true}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="secondary"
                size="small"
                onClick={() => loadSemesterGroups(selectedSemester.name, pagination.pageNumber - 1)}
                disabled={!pagination.hasPreviousPage || loadingGroups}
              >
                Previous
              </Button>
              <span className={styles.pageInfo}>
                Page {pagination.pageNumber} of {pagination.totalPages} 
                ({pagination.totalCount} total)
              </span>
              <Button
                variant="secondary"
                size="small"
                onClick={() => loadSemesterGroups(selectedSemester.name, pagination.pageNumber + 1)}
                disabled={!pagination.hasNextPage || loadingGroups}
              >
                Next
              </Button>
            </div>
          )}

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal open={pdfViewerOpen} onClose={() => setPdfViewerOpen(false)}>
        <div className={styles.pdfViewer}>
          <h2>PDF Viewer</h2>
          <div className={styles.pdfContainer}>
            <iframe
              src={selectedPdfUrl}
              title="PDF Viewer"
              className={styles.pdfIframe}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setPdfViewerOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

