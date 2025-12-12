import React, { useState, useEffect } from 'react';
import { getAllSemesters, syncSemester } from '../../../api/semester';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/DataTable/DataTable';
import Modal from '../../../components/Modal/Modal';
import BackButton from '../../common/BackButton';
import styles from './index.module.scss';

const SemesterSync = () => {
  const [semesters, setSemesters] = useState([]);
  const [filteredSemesters, setFilteredSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [syncLoading, setSyncLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    description: '',
    isActive: '' // '', 'true', 'false'
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadSemesters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [semesters, filters]);

  const loadSemesters = async () => {
    setLoading(true);
    try {
      const response = await getAllSemesters();
      if (response.status === 200) {
        setSemesters(response.data || []);
      }
    } catch (error) {
      setMessage(`Error loading semesters: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...semesters];

    if (filters.name) {
      filtered = filtered.filter(semester => 
        semester.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.description) {
      filtered = filtered.filter(semester => 
        semester.description?.toLowerCase().includes(filters.description.toLowerCase())
      );
    }

    if (filters.isActive !== '') {
      const expected = filters.isActive === 'true';
      filtered = filtered.filter(semester => Boolean(semester.isActive) === expected);
    }

    setFilteredSemesters(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      description: '',
      isActive: ''
    });
  };

  // Format date to dd/MM/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleSyncClick = (semester) => {
    setConfirmModal(semester);
  };

  const handleConfirmSync = async () => {
    if (!confirmModal) return;

    setSyncLoading(confirmModal.id);
    try {
      // API sync chỉ gửi name
      const response = await syncSemester({ name: confirmModal.name });
      if (response.status === 200) {
        setMessage(`Synced semester successfully: ${confirmModal.name}`);
        setConfirmModal(null);
        // Reload danh sách
        await loadSemesters();
      }
    } catch (error) {
      setMessage(`Error syncing semester: ${error.message || 'An error occurred'}`);
    } finally {
      setSyncLoading(null);
    }
  };

  const handleCancelSync = () => {
    setConfirmModal(null);
  };

  const columns = [
    {
      key: 'name',
      title: 'Semester Name',
      render: (semester) => (
        <div className={styles.semesterName}>{semester.name}</div>
      )
    },
    {
      key: 'startAt',
      title: 'Start Date',
      render: (semester) => formatDate(semester.startAt)
    },
    {
      key: 'endAt',
      title: 'End Date',
      render: (semester) => formatDate(semester.endAt)
    },
    {
      key: 'description',
      title: 'Description',
      render: (semester) => semester.description || 'No description'
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (semester) => (
        <span className={`${styles.statusBadge} ${semester.isActive ? styles.active : styles.inactive}`}>
          {semester.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (semester) => (
        <button 
          className={styles.syncButton}
          onClick={(e) => {
            e.stopPropagation();
            handleSyncClick(semester);
          }}
          disabled={syncLoading === semester.id}
        >
          {syncLoading === semester.id ? 'Syncing...' : 'Sync'}
        </button>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <BackButton to="/category-management/semesters" />
      <div className={styles.header}>
        <h1>Sync Semester from FAP</h1>
        <p className={styles.subtitle}>Sync the semester information and name from the FAP system</p>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <h3>Filters</h3>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label>Semester Name</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Enter semester name..."
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={filters.description}
              onChange={handleFilterChange}
              placeholder="Enter description..."
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Status</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input type="radio" name="isActive" value="" checked={filters.isActive === ''} onChange={handleFilterChange} />
                All
              </label>
              <label className={styles.radioOption}>
                <input type="radio" name="isActive" value="true" checked={filters.isActive === 'true'} onChange={handleFilterChange} />
                Active
              </label>
              <label className={styles.radioOption}>
                <input type="radio" name="isActive" value="false" checked={filters.isActive === 'false'} onChange={handleFilterChange} />
                Inactive
              </label>
            </div>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button onClick={clearFilters} className={styles.clearBtn}>
            Clear Filters
          </button>
          <span className={styles.resultCount}>
            {filteredSemesters.length} semesters
          </span>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
          {message}
        </div>
      )}

      {/* Semester List */}
      <div className={styles.semesterList}>
        <DataTable
          columns={columns}
          data={filteredSemesters}
          loading={loading}
          emptyMessage="No semesters found"
        />
      </div>
      {/* Confirm Sync Modal */}
      <Modal
        open={!!confirmModal}
        onClose={handleCancelSync}
      >
        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle}>Sync semester from FAP</h2>
          <p className={styles.modalDescription}>
            Do you want to sync the semester information and name from the FAP system?
          </p>
          <div className={styles.modalSemesterInfo}>
              <span className={styles.modalLabel}>Semester:</span>
            <span className={styles.modalSemesterName}>{confirmModal?.name}</span>
          </div>
          <div className={styles.modalActions}>
            <button 
              onClick={handleCancelSync} 
              className={styles.cancelBtn}
              disabled={syncLoading === confirmModal?.id}
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmSync} 
              className={styles.confirmBtn}
              disabled={syncLoading === confirmModal?.id}
            >
              {syncLoading === confirmModal?.id ? 'Syncing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SemesterSync;

