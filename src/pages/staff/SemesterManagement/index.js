import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSemester } from '../../../api/semester';
import BackButton from '../../common/BackButton';
import styles from './index.module.scss';

const SemesterManagement = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    semesterType: '', // Spring, Summer, Fall
    year: '',
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

    // Validate
    if (!formData.semesterType) {
      setMessage('Error: Please select semester type');
      setLoading(false);
      return;
    }

    if (!formData.year) {
      setMessage('Error: Please enter year');
      setLoading(false);
      return;
    }

    try {
      // Gộp semesterType và year thành name: "Spring 2025"
      const name = `${formData.semesterType} ${formData.year}`;
      
      // API chỉ gửi name và description
      const formattedData = {
        name: name,
        description: formData.description
      };
      
      const response = await createSemester(formattedData);
      setMessage('Semester created successfully!');
      // Navigate back to semester list after 1 second
      setTimeout(() => {
        navigate('/category-management/semesters');
      }, 1000);
    } catch (error) {
      setMessage(`Error: ${error.message || 'An error occurred'}`);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <BackButton to="/category-management/semesters" />
      <div className={styles.header}>
        <h1>Create New Semester</h1>
        <p>Enter information to create a new semester</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="semesterType">Semester Type *</label>
            <select
              id="semesterType"
              name="semesterType"
              value={formData.semesterType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select semester type</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="year">Year *</label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
              min="2000"
              max="2100"
              placeholder="2025"
            />
          </div>
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
