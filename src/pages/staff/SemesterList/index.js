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
      setMessage(`Lỗi khi tải danh sách kỳ học: ${error.message || 'Có lỗi xảy ra'}`);
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

    if (filters.startAt) {
      filtered = filtered.filter(semester => 
        new Date(semester.startAt) >= new Date(filters.startAt)
      );
    }

    if (filters.endAt) {
      filtered = filtered.filter(semester => 
        new Date(semester.endAt) <= new Date(filters.endAt)
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
      startAt: '',
      endAt: '',
      description: '',
      isActive: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getDuration = (startAt, endAt) => {
    if (!startAt || !endAt) return 'N/A';
    try {
      const start = new Date(startAt);
      const end = new Date(endAt);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} ngày`;
    } catch (error) {
      return 'N/A';
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Tên kỳ học',
      render: (semester) => (
        <div>
          <div className={styles.semesterName}>{semester.name}</div>
          <div className={styles.semesterId}>ID: {semester.id}</div>
        </div>
      )
    },
    {
      key: 'startAt',
      title: 'Ngày bắt đầu',
      render: (semester) => formatDate(semester.startAt)
    },
    {
      key: 'endAt',
      title: 'Ngày kết thúc',
      render: (semester) => formatDate(semester.endAt)
    },
    {
      key: 'duration',
      title: 'Thời gian',
      render: (semester) => getDuration(semester.startAt, semester.endAt)
    },
    {
      key: 'description',
      title: 'Mô tả',
      render: (semester) => semester.description || 'Không có mô tả'
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      render: (semester) => (
        <span className={`${styles.statusBadge} ${semester.isActive ? styles.active : styles.inactive}`}>
          {semester.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (semester) => (
        <button 
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            handleSemesterClick(semester.id);
          }}
        >
          Xem chi tiết
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
        <h1>Danh Sách Kỳ Học</h1>
        <button onClick={handleCreateSemester} className={styles.createBtn}>
          + Tạo Kỳ Học Mới
        </button>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <h3>Bộ Lọc</h3>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label>Tên kỳ học</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Nhập tên kỳ học..."
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Từ ngày</label>
            <input
              type="date"
              name="startAt"
              value={filters.startAt}
              onChange={handleFilterChange}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Đến ngày</label>
            <input
              type="date"
              name="endAt"
              value={filters.endAt}
              onChange={handleFilterChange}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Mô tả</label>
            <input
              type="text"
              name="description"
              value={filters.description}
              onChange={handleFilterChange}
              placeholder="Nhập mô tả..."
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Trạng thái</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input type="radio" name="isActive" value="" checked={filters.isActive === ''} onChange={handleFilterChange} />
                Tất cả
              </label>
              <label className={styles.radioOption}>
                <input type="radio" name="isActive" value="true" checked={filters.isActive === 'true'} onChange={handleFilterChange} />
                Đang hoạt động
              </label>
              <label className={styles.radioOption}>
                <input type="radio" name="isActive" value="false" checked={filters.isActive === 'false'} onChange={handleFilterChange} />
                Không hoạt động
              </label>
            </div>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button onClick={clearFilters} className={styles.clearBtn}>
            Xóa Bộ Lọc
          </button>
          <span className={styles.resultCount}>
            {filteredSemesters.length} kỳ học
          </span>
        </div>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('Lỗi') ? styles.error : styles.success}`}>
          {message}
        </div>
      )}

      {/* Semester List */}
      <div className={styles.semesterList}>
        <DataTable
          columns={columns}
          data={filteredSemesters}
          loading={loading}
          emptyMessage="Không có kỳ học nào"
          onRowClick={(semester) => handleSemesterClick(semester.id)}
        />
      </div>
    </div>
  );
};

export default SemesterList;
