import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSemester } from '../../../api/staff/semester';
import BackButton from '../../common/BackButton';
import styles from './index.module.scss';

const SemesterManagement = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    startAt: '',
    endAt: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Convert yyyy-MM-dd (from input type="date") to dd/MM/yyyy for API
  const convertDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    // Input type="date" returns yyyy-MM-dd format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    // If already in dd/MM/yyyy format, return as is
    return dateString;
  };

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

    // Validate dates are selected
    if (!formData.startAt) {
      setMessage('Error: Start Date is required');
      setLoading(false);
      return;
    }

    if (!formData.endAt) {
      setMessage('Error: End Date is required');
      setLoading(false);
      return;
    }

    try {
      // Convert dates from yyyy-MM-dd to dd/MM/yyyy for API
      const formattedData = {
        ...formData,
        startAt: convertDateToDDMMYYYY(formData.startAt),
        endAt: convertDateToDDMMYYYY(formData.endAt)
      };
      
      const response = await createSemester(formattedData);
      setMessage('Semester created successfully!');
      // Reset form
      setFormData({
        name: '',
        startAt: '',
        endAt: '',
        description: ''
      });
    } catch (error) {
      setMessage(`Error: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <BackButton to="/category-management/semesters" />
      <div className={styles.header}>
        <h1>Create New Semester</h1>
        <p>Enter information to create a new semester and calculate study weeks</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Semester Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Example: Spring 2026"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="startAt">Start Date *</label>
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
          <label htmlFor="endAt">End Date *</label>
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
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            placeholder="Description about the semester..."
          />
        </div>

        {message && (
          <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}

        <button 
          type="submit" 
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Semester'}
        </button>
      </form>
    </div>
  );
};

export default SemesterManagement;
