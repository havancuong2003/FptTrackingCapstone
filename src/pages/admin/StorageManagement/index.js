// src/pages/admin/StorageManagement/index.js (FULL - Archive File Name is read-only)
import React, { useEffect, useState } from 'react';
import styles from './index.module.scss';
import {
  getStorageSemesters,
  getSemesterGroups,
  zipFolder,
  restoreGroupArchive
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
    totalCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  });

  // Restore modal (restore per group)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreTargetGroup, setRestoreTargetGroup] = useState(null);

  // Only deleteArchiveAfter remains editable
  const [deleteArchiveAfter, setDeleteArchiveAfter] = useState(true);

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    setLoading(true);
    try {
      const res = await getStorageSemesters();
      if (res?.status === 200 && Array.isArray(res.data)) {
        setSemesters(res.data);
      } else {
        setSemesters([]);
        alert(res?.message || 'Unable to load semesters.');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Unable to load semesters.');
    } finally {
      setLoading(false);
    }
  };

  const loadSemesterGroups = async (semesterName, pageNumber = 1) => {
    setLoadingGroups(true);
    try {
      const res = await getSemesterGroups(semesterName, pageNumber, pagination.pageSize);
      if (res?.status === 200 && res.data) {
        const data = res.data;
        setGroups(data.items || []);
        setPagination({
          pageNumber: data.pageNumber || pageNumber,
          pageSize: data.pageSize || pagination.pageSize,
          totalPages: data.totalPages || 1,
          totalCount: data.totalCount || 0,
          hasPreviousPage: !!data.hasPreviousPage,
          hasNextPage: !!data.hasNextPage
        });
      } else {
        setGroups([]);
        alert(res?.message || 'Unable to load groups.');
      }
    } catch (error) {
      setGroups([]);
      alert(error?.response?.data?.message || 'Unable to load groups.');
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSemesterClick = (semester) => {
    setSelectedSemester(semester);
    setDetailModalOpen(true);
    loadSemesterGroups(semester.name, 1);
  };

  const handleZipSemester = async (semesterName) => {
    if (!window.confirm(`Zip remaining items in semester "${semesterName}"?`)) return;

    try {
      setLoading(true);
      const res = await zipFolder(semesterName);
      if (res?.status === 200) {
        alert(res?.message || 'Zip completed.');
        await loadSemesters();
        if (selectedSemester?.name === semesterName) {
          await loadSemesterGroups(semesterName, pagination.pageNumber || 1);
        }
      } else {
        alert(res?.message || 'Zip failed.');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Zip failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = (pdfFilePath) => {
    if (!pdfFilePath) {
      alert('PDF is not available.');
      return;
    }

    let pdfUrl;
    if (pdfFilePath.startsWith('http://') || pdfFilePath.startsWith('https://')) {
      pdfUrl = pdfFilePath;
    } else {
      const apiBaseUrl = axiosClient.defaults.baseURL || '';
      let serverBaseUrl;

      if (apiBaseUrl.includes('/api/v1')) {
        serverBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, '');
      } else if (apiBaseUrl) {
        serverBaseUrl = apiBaseUrl.replace(/\/+$/, '');
      } else {
        serverBaseUrl = window.location.origin;
      }

      const cleanPath = pdfFilePath.startsWith('/') ? pdfFilePath : `/${pdfFilePath}`;
      pdfUrl = `${serverBaseUrl}${cleanPath}`;
    }

    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  // ✅ Read-only archive file name convention:
  // If your backend uses a different naming, change here only.
  const getArchiveFileNameForGroup = (group) => `${group.groupName}.zip`;

  const openRestoreModalForGroup = (group) => {
    if (!selectedSemester?.name) return;
    setRestoreTargetGroup(group);
    setDeleteArchiveAfter(true);
    setRestoreModalOpen(true);
  };

  const submitRestoreGroup = async () => {
    const parentFolder = selectedSemester?.name;
    const groupName = restoreTargetGroup?.groupName;

    if (!parentFolder || !groupName) return;

    const archiveFileName = getArchiveFileNameForGroup(restoreTargetGroup);

    if (!window.confirm(`Restore group "${groupName}" from "${archiveFileName}"?`)) return;

    try {
      setLoading(true);
      const res = await restoreGroupArchive(parentFolder, archiveFileName, deleteArchiveAfter);

      if (res?.status === 200) {
        alert(res?.message || 'Restore completed.');
        setRestoreModalOpen(false);

        await loadSemesters();
        await loadSemesterGroups(parentFolder, pagination.pageNumber || 1);
      } else {
        alert(res?.message || 'Restore failed.');
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Restore failed.');
    } finally {
      setLoading(false);
    }
  };

  const semesterColumns = [
    {
      key: 'name',
      title: 'Semester',
      render: (s) => (
        <button className={styles.semesterLink} onClick={() => handleSemesterClick(s)} title="Click to view groups">
          {s.name}
        </button>
      )
    },
    {
      key: 'zipFolder',
      title: 'Zip Progress',
      render: (s) => (
        <div>
          <div><strong>{s.zipFolder || '-'}</strong></div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {(s.zippedSubFolders ?? 0)}/{(s.totalSubFolders ?? 0)} subfolders
          </div>
        </div>
      )
    },
    {
      key: 'zipPercentage',
      title: 'Zip %',
      render: (s) => {
        const pct = Math.max(0, Math.min(100, Number(s.zipPercentage || 0)));
        return (
          <div>
            <div><strong>{s.zipPercentageFormatted ?? `${pct}%`}</strong></div>
            <div style={{ height: 6, background: '#eee', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6' }} />
            </div>
          </div>
        );
      }
    },
    { key: 'folderSizeFormatted', title: 'Folder Size', render: (s) => s.folderSizeFormatted || '0 B' },
    { key: 'zipSizeFormatted', title: 'Zip Size', render: (s) => s.zipSizeFormatted || '0 B' },
    {
      key: 'actions',
      title: 'Actions',
      render: (s) => {
        const canZip = Number(s.zipPercentage || 0) < 100;
        return (
          <div className={styles.actionButtons}>
            <Button
              variant="primary"
              size="small"
              disabled={!canZip || loading}
              onClick={(e) => {
                e.stopPropagation();
                handleZipSemester(s.name);
              }}
            >
              Zip
            </Button>
          </div>
        );
      }
    }
  ];

  const groupColumns = [
    { key: 'groupName', title: 'Group', render: (g) => <strong>{g.groupName}</strong> },
    {
      key: 'hasZip',
      title: 'Zipped',
      render: (g) => (
        <span className={g.hasZip ? styles.statusYes : styles.statusNo}>{g.hasZip ? 'Yes' : 'No'}</span>
      )
    },
    { key: 'sizeFormatted', title: 'Size', render: (g) => g.sizeFormatted || '0 B' },
    { key: 'fileCount', title: 'Files', render: (g) => g.fileCount || 0 },
    { key: 'subFolderCount', title: 'Subfolders', render: (g) => g.subFolderCount || 0 },
    {
      key: 'lastModified',
      title: 'Last Modified',
      render: (g) => (g.lastModified ? new Date(g.lastModified).toLocaleString('en-US') : 'N/A')
    },
    {
      key: 'pdf',
      title: 'PDF',
      render: (g) => {
        if (!g.pdfFilePath) return <span className={styles.noPdf}>No PDF</span>;
        return (
          <Button variant="ghost" size="small" onClick={() => handleViewPdf(g.pdfFilePath)}>
            View PDF
          </Button>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (g) => (
        <div className={styles.actionButtons}>
          <Button
            variant="secondary"
            size="small"
            disabled={!g.hasZip || loading}
            onClick={() => openRestoreModalForGroup(g)}
            title={g.hasZip ? 'Restore this group from its zip archive' : 'No archive to restore'}
          >
            Restore
          </Button>
        </div>
      )
    }
  ];

  const archiveFileNamePreview = restoreTargetGroup ? getArchiveFileNameForGroup(restoreTargetGroup) : '—';

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

      {/* Groups modal */}
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
                Page {pagination.pageNumber} of {pagination.totalPages} ({pagination.totalCount} total)
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

      {/* Restore modal */}
      <Modal open={restoreModalOpen} onClose={() => setRestoreModalOpen(false)}>
        <div className={styles.groupDetailModal}>
          <h2>Restore Group: {restoreTargetGroup?.groupName}</h2>

          <div className={styles.groupDetailContent}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Parent Folder:</span>
              <span className={styles.detailValue}>{selectedSemester?.name || '—'}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Archive File Name:</span>
              {/* ✅ Read-only text */}
              <span className={styles.detailValue}>
                <strong>{archiveFileNamePreview}</strong>
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Delete Archive After Restore:</span>
              <span className={styles.detailValue}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={deleteArchiveAfter}
                    onChange={(e) => setDeleteArchiveAfter(e.target.checked)}
                  />
                  Yes
                </label>
              </span>
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setRestoreModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitRestoreGroup} disabled={loading}>
              Restore
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
