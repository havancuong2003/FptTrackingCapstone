import React, { useState, useEffect } from 'react';
import { getAllCourses, getCourseById, updateCourse } from '../../../api/staff';
import FormField from '../../../components/FormField/FormField';
import Input from '../../../components/Input/Input';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import DataTable from '../../../components/DataTable/DataTable';
import styles from './index.module.scss';

const DEFAULT_ITEMS_PER_PAGE = 5;
const ITEMS_PER_PAGE_OPTIONS = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
  { value: 100, label: '100' }
];

export default function CourseSizeConfig() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]); // Lưu tất cả courses để filter client-side
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    isActive: true,
    size: null
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load courses khi component mount hoặc khi page/itemsPerPage thay đổi
  useEffect(() => {
    loadCourses();
  }, [currentPage, itemsPerPage]);

  const loadCourses = async () => {
    setLoading(true);
    // Clear courses immediately to avoid showing stale data
    setCourses([]);
    setAllCourses([]);
    
    try {
      const response = await getAllCourses({
        page: currentPage,
        pageSize: itemsPerPage
      });
      
      if (response.status === 200) {
        // Nếu API trả về dạng paginated response
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Cấu trúc: { items: [], total: number, page: number, pageSize: number }
          const coursesList = Array.isArray(response.data.items) ? response.data.items : [];
          const total = response.data.total || response.data.totalItems || coursesList.length;
          
          // Set data - API should return exactly itemsPerPage items (or less if last page)
          setAllCourses(coursesList);
          setTotalItems(total);
          // Set courses directly - no need to filter if no search
          setCourses(coursesList);
        } else if (Array.isArray(response.data)) {
          // Nếu API vẫn trả về array (backward compatibility)
          const coursesList = response.data;
          setAllCourses(coursesList);
          setTotalItems(coursesList.length);
          setCourses(coursesList);
        } else {
          setAllCourses([]);
          setTotalItems(0);
          setCourses([]);
        }
      }
    } catch (error) {
      alert('Unable to load courses list. Please try again.');
      setAllCourses([]);
      setTotalItems(0);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (course) => {
    setErrors({});
    setSuccessMessage('');
    setSelectedCourse(course);
    
    try {
      // Load chi tiết course để đảm bảo có dữ liệu mới nhất
      const response = await getCourseById(course.id);
      if (response.status === 200 && response.data) {
        setFormData({
          id: response.data.id || 0,
          code: response.data.code || '',
          name: response.data.name || '',
          isActive: response.data.isActive !== undefined ? response.data.isActive : true,
          size: response.data.size || null
        });
      } else {
        // Fallback nếu API không trả về data
        setFormData({
          id: course.id || 0,
          code: course.code || '',
          name: course.name || '',
          isActive: course.isActive !== undefined ? course.isActive : true,
          size: course.size || null
        });
      }
    } catch (error) {
      // Fallback nếu có lỗi
      setFormData({
        id: course.id || 0,
        code: course.code || '',
        name: course.name || '',
        isActive: course.isActive !== undefined ? course.isActive : true,
        size: course.size || null
      });
    }
    
    setEditModalOpen(true);
  };

  const handleInputChange = (field, value) => {
    if (field === 'size') {
      // Chỉ cho phép số dương hoặc null/empty
      if (value === '' || value === null) {
        setFormData(prev => ({ ...prev, [field]: null }));
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
          setFormData(prev => ({ ...prev, [field]: numValue }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error khi user nhập
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Clear success message
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code || !formData.code.trim()) {
      newErrors.code = 'Course code is required';
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Course name is required';
    }

    if (formData.size !== null && formData.size !== undefined) {
      if (isNaN(formData.size) || formData.size < 0) {
        newErrors.size = 'Size must be a positive number (MB)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: formData.id,
        code: formData.code.trim(),
        name: formData.name.trim(),
        isActive: formData.isActive,
        size: formData.size || null
      };

      const response = await updateCourse(selectedCourse.id, payload);
      
      if (response.status === 200) {
        setSuccessMessage('Upload size configuration updated successfully!');
        setEditModalOpen(false);
        // Reload danh sách - giữ nguyên trang hiện tại
        setTimeout(() => {
          loadCourses();
        }, 500);
      } else {
        alert(response.message || 'Error updating configuration');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to update configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedCourse(null);
    setErrors({});
    setSuccessMessage('');
  };

  // Filter courses based on search term (client-side)
  // Note: Only filter if search term exists, otherwise show allCourses directly from API
  useEffect(() => {
    if (!searchTerm.trim()) {
      // No search - show exactly what API returns (already paginated)
      setCourses(allCourses);
    } else {
      // Has search - filter client-side on current page data
      const filtered = allCourses.filter(course => 
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setCourses(filtered);
    }
    // Don't reset page when allCourses changes (only when search changes)
    if (searchTerm.trim()) {
      setCurrentPage(1);
    }
  }, [searchTerm, allCourses]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newValue = parseInt(e.target.value);
    setItemsPerPage(newValue);
    setCurrentPage(1); // Reset về trang đầu khi thay đổi items per page
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={styles.pageButton}
          style={{
            background: i === currentPage ? '#3b82f6' : '#fff',
            color: i === currentPage ? '#fff' : '#374151',
          }}
        >
          {i}
        </button>
      );
    }

    return (
      <div className={styles.pagination}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={styles.pageButton}
          style={{
            background: currentPage === 1 ? '#f3f4f6' : '#fff',
            color: currentPage === 1 ? '#9ca3af' : '#374151',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={styles.pageButton}
          style={{
            background: currentPage === totalPages ? '#f3f4f6' : '#fff',
            color: currentPage === totalPages ? '#9ca3af' : '#374151',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          Next
        </button>
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      key: 'code',
      title: 'Course Code',
      render: (course) => (
        <div 
          style={{ 
            fontWeight: 600, 
            fontSize: '14px',
            color: '#3b82f6',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={(e) => {
            e.stopPropagation();
            openEditModal(course);
          }}
        >
          {course.code}
        </div>
      )
    },
    {
      key: 'name',
      title: 'Course Name',
      render: (course) => (
        <div style={{ fontSize: '14px' }}>
          {course.name}
        </div>
      )
    },
    {
      key: 'size',
      title: 'Size (MB)',
      render: (course) => (
        <div style={{ fontSize: '14px', fontWeight: 500 }}>
          {course.size !== null && course.size !== undefined 
            ? `${course.size} MB` 
            : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not configured</span>}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (course) => (
        <span style={{
          background: course.isActive ? '#dcfce7' : '#fee2e2',
          color: course.isActive ? '#166534' : '#dc2626',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 600
        }}>
          {course.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  if (loading && courses.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Upload Size Configuration</h1>
        <p>Manage upload size limit (MB) for each course code in the system.</p>
      </div>

      <div className={styles.content}>
        {/* Search Bar and Items Per Page */}
        <div className={styles.toolbar}>
          <div className={styles.searchBar}>
            <Input
              type="text"
              placeholder="Search by course code or name..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ maxWidth: '400px' }}
            />
          </div>
          <div className={styles.itemsPerPageSelector}>
            <label>Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className={styles.select}
            >
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Courses Table */}
        <div className={styles.tableCard}>
          <DataTable
            data={courses}
            columns={columns}
            loading={loading}
            emptyMessage={searchTerm ? 'No courses found matching your search' : 'No courses available'}
          />
        </div>

        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Edit Course Size Modal */}
      <Modal open={editModalOpen} onClose={handleCloseModal}>
        <div className={styles.modalContent}>
          <h2 className={styles.modalTitle}>Upload Size Configuration</h2>
          <p className={styles.modalDescription}>
            Configure upload size limit (MB) for course: <strong>{formData.code}</strong>
          </p>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <FormField 
              label="Course Code" 
              error={errors.code}
            >
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="Course code"
                disabled={saving}
                readOnly
              />
            </FormField>

            <FormField 
              label="Course Name" 
              error={errors.name}
            >
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Course name"
                disabled={saving}
                readOnly
              />
            </FormField>

            <FormField 
              label="Upload Size (MB)" 
              error={errors.size}
              hint="Enter allowed upload size in MB. Leave blank for unlimited."
            >
              <Input
                type="number"
                value={formData.size !== null && formData.size !== undefined ? formData.size : ''}
                onChange={(e) => handleInputChange('size', e.target.value)}
                placeholder="e.g., 100"
                disabled={saving}
                min="0"
                step="1"
              />
            </FormField>

            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}

            <div className={styles.modalActions}>
              <Button 
                type="button"
                variant="ghost"
                onClick={handleCloseModal}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                loading={saving}
                disabled={saving}
              >
                Save Configuration
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

