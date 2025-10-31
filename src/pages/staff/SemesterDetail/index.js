import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getSemesterDetail, 
  updateSemester,
  getVacationBySemesterId,
  updateVacationPeriods
} from '../../../api/staff/semester';
import BackButton from '../../common/BackButton';
import styles from './index.module.scss';

const SemesterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [semester, setSemester] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [vacationPeriods, setVacationPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    startAt: '',
    endAt: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    if (id) {
      loadSemesterDetail();
    }
  }, [id]);

  const loadSemesterDetail = async () => {
    setLoading(true);
    try {
      const semesterResponse = await getSemesterDetail(id);

      if (semesterResponse.status === 200) {
        const semesterData = semesterResponse.data;
        setSemester(semesterData);
        setEditData({
          name: semesterData.name,
          startAt: semesterData.startAt.split('T')[0],
          endAt: semesterData.endAt.split('T')[0],
          description: semesterData.description || '',
          isActive: Boolean(semesterData.isActive)
        });
        
        // Get weeks list from response
        setWeeks(semesterData.weeks || []);
        
        // Load vacation periods
        await loadVacationPeriods();
      }
    } catch (error) {
      setMessage(`Error loading semester details: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditData({
        name: semester.name,
        startAt: semester.startAt.split('T')[0],
        endAt: semester.endAt.split('T')[0],
        description: semester.description || '',
        isActive: Boolean(semester.isActive)
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: name === 'isActive' ? (value === 'true') : value
    }));
  };

  const handleUpdateSemester = async () => {
    setLoading(true);
    setMessage('');

    try {
      const formattedData = {
        ...editData,
        startAt: new Date(editData.startAt).toISOString().split('T')[0],
        endAt: new Date(editData.endAt).toISOString().split('T')[0],
        isActive: Boolean(editData.isActive)
      };

      const response = await updateSemester(id, formattedData);
      if (response.status === 200) {
        setMessage('Semester information updated successfully!');
        setIsEditing(false);
        loadSemesterDetail(); // Reload data
      }
    } catch (error) {
      setMessage(`Error: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };



  // Common function to format both solar and lunar dates with same format (Vietnamese format)
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

  // Load vacation periods from API
  const loadVacationPeriods = async () => {
    try {
      const response = await getVacationBySemesterId(id);
      if (response.status === 200) {
        // Format data from API to match UI structure
        const formattedData = (response.data || []).map((period, index) => ({
          id: period.id || `api_${index}_${Date.now()}`, // Use API id or generate unique id
          semesterId: period.semesterId || parseInt(id),
          startDate: period.startDate ? period.startDate.split('T')[0] : '', // Convert ISO to date input format
          endDate: period.endDate ? period.endDate.split('T')[0] : '', // Convert ISO to date input format
          description: period.description || ''
        }));
        setVacationPeriods(formattedData);
      }
    } catch (error) {
      alert(`Error loading vacation periods: ${error.message || 'An error occurred'}`);
      setVacationPeriods([]);
    }
  };

  // Add new vacation period
  const addVacationPeriod = () => {
    const newPeriod = {
      id: Date.now(),
      semesterId: parseInt(id),
      startDate: '',
      endDate: '',
      description: ''
    };
    setVacationPeriods(prev => [...prev, newPeriod]);
  };

  // Remove vacation period
  const removeVacationPeriod = (periodId) => {
    setVacationPeriods(prev => prev.filter(period => period.id !== periodId));
  };

  // Update vacation period
  const updateVacationPeriod = (periodId, field, value) => {
    setVacationPeriods(prev => 
      prev.map(period => 
        period.id === periodId 
          ? { ...period, [field]: value }
          : period
      )
    );
  };

  // Save vacation periods to API
  const handleUpdateVacationPeriods = async () => {
    setLoading(true);

    try {
      // Filter out periods without required data
      const validPeriods = vacationPeriods.filter(period => 
        period.startDate && period.endDate && period.description
      );

      // Format data for API - only include startDate, endDate, description
      const formattedData = validPeriods.map(period => ({
        startDate: new Date(period.startDate).toISOString(),
        endDate: new Date(period.endDate).toISOString(),
        description: period.description
      }));

      const response = await updateVacationPeriods(parseInt(id), formattedData);
      if (response.status === 200) {
        alert('Vacation periods updated successfully!');
        await loadVacationPeriods(); // Reload data to get fresh state
      }
    } catch (error) {
      alert(`Error updating vacation periods: ${error.message || 'An error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !semester) {
    return <div className={styles.loading}>Loading semester details...</div>;
  }

  if (!semester) {
    return <div className={styles.error}>Semester not found</div>;
  }

  return (
    <div className={styles.container}>
      <BackButton to="/category-management/semesters" />
      <div className={styles.header}>
        <h1>Semester Details</h1>
        <button onClick={handleEditToggle} className={styles.editBtn}>
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
          {message}
        </div>
      )}

      {/* Semester Information */}
      <div className={styles.semesterInfo}>
        <h2>Semester Information</h2>
        {isEditing ? (
          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label>Semester Name</label>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleEditChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Start Date</label>
              <input
                type="date"
                name="startAt"
                value={editData.startAt}
                onChange={handleEditChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>End Date</label>
              <input
                type="date"
                name="endAt"
                value={editData.endAt}
                onChange={handleEditChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                name="description"
                value={editData.description}
                onChange={handleEditChange}
                rows="4"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Status</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    checked={editData.isActive === true}
                    onChange={handleEditChange}
                  />
                  Active
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    checked={editData.isActive === false}
                    onChange={handleEditChange}
                  />
                  Inactive
                </label>
              </div>
            </div>
            <button onClick={handleUpdateSemester} className={styles.updateBtn} disabled={loading}>
              {loading ? 'Updating...' : 'Update Information'}
            </button>
          </div>
        ) : (
          <div className={styles.infoDisplay}>
            <div className={styles.infoItem}>
              <strong>Status:</strong> {semester.isActive ? 'Active' : 'Inactive'}
            </div>
            <div className={styles.infoItem}>
              <strong>Semester Name:</strong> {semester.name}
            </div>
            <div className={styles.infoItem}>
              <strong>Start Date:</strong> {formatDate(semester.startAt)}
            </div>
            <div className={styles.infoItem}>
              <strong>End Date:</strong> {formatDate(semester.endAt)}
            </div>
            {semester.description && (
              <div className={styles.infoItem}>
                <strong>Description:</strong> {semester.description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Study Weeks Display */}
      <div className={styles.weeksSection}>
        <h2>Study Weeks</h2>
        
        <div className={styles.weeksGrid}>
          {weeks.map((week) => (
            <div key={week.weekNumber} className={styles.weekCard}>
              <div className={styles.weekNumber}>Week {week.weekNumber}</div>
              <div className={styles.weekDates}>
                <div className={styles.dateRow}>
                  <span className={styles.dateLabel}>Start:</span>
                  <span className={styles.solarDate}>{formatDate(week.startAt)}</span>
                  <span className={styles.lunarDate}>({formatDate(week.startAtLunar)})</span>
                </div>
                <div className={styles.dateRow}>
                  <span className={styles.dateLabel}>End:</span>
                  <span className={styles.solarDate}>{formatDate(week.endAt)}</span>
                  <span className={styles.lunarDate}>({formatDate(week.endAtLunar)})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vacation Periods Management */}
      <div className={styles.vacationSection}>
        <h2>Vacation Periods Management</h2>
        
        <div className={styles.vacationPeriods}>
          {vacationPeriods.map((period) => (
            <div key={period.id} className={styles.vacationPeriodCard}>
              <div className={styles.periodHeader}>
                <h3>Vacation Period {period.id && typeof period.id === 'number' ? '(From Server)' : '(New)'}</h3>
                <button 
                  onClick={() => removeVacationPeriod(period.id)}
                  className={styles.removeBtn}
                >
                  ×
                </button>
              </div>
              
              <div className={styles.periodForm}>
                <div className={styles.formGroup}>
                  <label>Start Date <span className={styles.required}>*</span></label>
                  <input
                    type="date"
                    value={period.startDate}
                    onChange={(e) => updateVacationPeriod(period.id, 'startDate', e.target.value)}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>End Date <span className={styles.required}>*</span></label>
                  <input
                    type="date"
                    value={period.endDate}
                    onChange={(e) => updateVacationPeriod(period.id, 'endDate', e.target.value)}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Description <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    value={period.description}
                    onChange={(e) => updateVacationPeriod(period.id, 'description', e.target.value)}
                    placeholder="Enter vacation description..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.vacationActions}>
          <button onClick={addVacationPeriod} className={styles.addPeriodBtn}>
            + Add Vacation Period
          </button>
        </div>
        
        {vacationPeriods.length > 0 && (
          <div className={styles.saveContainer}>
            <button
              onClick={handleUpdateVacationPeriods}
              className={styles.updateVacationBtn}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default SemesterDetail;
