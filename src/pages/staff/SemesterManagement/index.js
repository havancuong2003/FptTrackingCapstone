import React, { useState } from 'react';
import { createSemester } from '../../../api/staff/semester';
import styles from './index.module.scss';

const SemesterManagement = () => {
  const [formData, setFormData] = useState({
    name: '',
    startAt: '',
    endAt: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Format dates to yyyy-MM-dd
      const formattedData = {
        ...formData,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString().split('T')[0] : '',
        endAt: formData.endAt ? new Date(formData.endAt).toISOString().split('T')[0] : ''
      };
      
      const response = await createSemester(formattedData);
      setMessage('Tạo kỳ học thành công!');
      // Reset form
      setFormData({
        name: '',
        startAt: '',
        endAt: '',
        description: ''
      });
    } catch (error) {
      setMessage(`Lỗi: ${error.message || 'Có lỗi xảy ra'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tạo Kỳ Học Mới</h1>
        <p>Nhập thông tin để tạo kỳ học mới và tính toán các tuần học</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Tên kỳ học *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Ví dụ: Spring 2026"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="startAt">Ngày bắt đầu *</label>
          <input
            type="date"
            id="startAt"
            name="startAt"
            value={formData.startAt}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="endAt">Ngày kết thúc *</label>
          <input
            type="date"
            id="endAt"
            name="endAt"
            value={formData.endAt}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Mô tả</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            placeholder="Mô tả về kỳ học..."
          />
        </div>

        {message && (
          <div className={`${styles.message} ${message.includes('Lỗi') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}

        <button 
          type="submit" 
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? 'Đang tạo...' : 'Tạo Kỳ Học'}
        </button>
      </form>
    </div>
  );
};

export default SemesterManagement;
