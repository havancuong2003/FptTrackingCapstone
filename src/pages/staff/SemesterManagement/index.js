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
