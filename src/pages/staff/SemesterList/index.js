import React, { useState, useEffect } from 'react';
import { getAllSemesters } from '../../../api/staff/semester';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/DataTable/DataTable';
import styles from './index.module.scss';

const SemesterList = () => {
  const [semesters, setSemesters] = useState([]);
  const [filteredSemesters, setFilteredSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    startAt: '',
    endAt: '',
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

  // Helper function to normalize date to YYYY-MM-DD format for comparison
  const normalizeDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      // Get date in local timezone and format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  };

  const applyFilters = () => {
    let filtered = [...semesters];

    if (filters.name) {
      filtered = filtered.filter(semester => 
        semester.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.startAt) {
      const filterDate = normalizeDate(filters.startAt);
      filtered = filtered.filter(semester => {
        const semesterDate = normalizeDate(semester.startAt);
        return semesterDate >= filterDate;
      });
    }

    if (filters.endAt) {
      const filterDate = normalizeDate(filters.endAt);
      filtered = filtered.filter(semester => {
        const semesterDate = normalizeDate(semester.endAt);
        return semesterDate <= filterDate;
      });
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
      startAt: '',
      endAt: '',
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
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            handleSemesterClick(semester.id);
          }}
        >
          View Details
        </button>
      )
    }
  ];

  const handleSemesterClick = (semesterId) => {
    navigate(`/category-management/semester/${semesterId}`);
  };

  const handleCreateSemester = () => {
    navigate('/category-management/semester/create');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Semester List</h1>
        <button onClick={handleCreateSemester} className={styles.createBtn}>
          + Create New Semester
        </button>
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
            <label>From Date</label>
            <input
              type="date"
              name="startAt"
              value={filters.startAt}
              onChange={handleFilterChange}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>To Date</label>
            <input
              type="date"
              name="endAt"
              value={filters.endAt}
              onChange={handleFilterChange}
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
          onRowClick={(semester) => handleSemesterClick(semester.id)}
        />
      </div>
    </div>
  );
};

export default SemesterList;
