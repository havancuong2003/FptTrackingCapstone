import React, { useState, useEffect } from 'react';
import { getAllSemesters } from '../../../api/staff/semester';
import { useNavigate } from 'react-router-dom';
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
        {loading ? (
          <div className={styles.loading}>Đang tải danh sách kỳ học...</div>
        ) : filteredSemesters.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Không có kỳ học nào</p>
          </div>
        ) : (
          <div className={styles.semesterGrid}>
            {filteredSemesters.map((semester) => (
              <div
                key={semester.id}
                className={styles.semesterCard}
                onClick={() => handleSemesterClick(semester.id)}
              >
                <div className={styles.semesterHeader}>
                  <h3>{semester.name}</h3>
                  <div className={styles.headerRight}>
                    <span className={`${styles.statusBadge} ${semester.isActive ? styles.active : styles.inactive}`}>
                      {semester.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                    <span className={styles.semesterId}>ID: {semester.id}</span>
                  </div>
                </div>

                <div className={styles.semesterInfo}>
                  <div className={styles.dateRange}>
                    <div className={styles.dateItem}>
                      <strong>Bắt đầu:</strong> {formatDate(semester.startAt)}
                    </div>
                    <div className={styles.dateItem}>
                      <strong>Kết thúc:</strong> {formatDate(semester.endAt)}
                    </div>
                  </div>

                  {semester.description && (
                    <div className={styles.description}>
                      <strong>Mô tả:</strong> {semester.description}
                    </div>
                  )}

                  <div className={styles.duration}>
                    <strong>Thời gian:</strong> {Math.ceil((new Date(semester.endAt) - new Date(semester.startAt)) / (1000 * 60 * 60 * 24))} ngày
                  </div>
                </div>

                <div className={styles.semesterActions}>
                  <span className={styles.clickHint}>Click để xem chi tiết</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SemesterList;
