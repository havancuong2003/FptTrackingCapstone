import React, { useState, useEffect } from 'react';
import { getSemesterWeeks, updateVacationWeeks } from '../../../api/staff/semester';
import styles from './index.module.scss';

const VacationManagement = () => {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadWeeks();
  }, []);

  const loadWeeks = async () => {
    setLoading(true);
    try {
      const response = await getSemesterWeeks();
      if (response.status === 200 && response.data?.weeks) {
        setWeeks(response.data.weeks);
      }
    } catch (error) {
      setMessage(`Lỗi khi tải danh sách tuần: ${error.message || 'Có lỗi xảy ra'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWeekToggle = (week) => {
    setSelectedWeeks(prev => {
      const isSelected = prev.some(w => w.weekNumber === week.weekNumber);
      if (isSelected) {
        return prev.filter(w => w.weekNumber !== week.weekNumber);
      } else {
        return [...prev, week];
      }
    });
  };

  const handleSubmitVacation = async () => {
    if (selectedWeeks.length === 0) {
      setMessage('Vui lòng chọn ít nhất một tuần nghỉ');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await updateVacationWeeks(null, selectedWeeks);
      setMessage('Cập nhật tuần nghỉ thành công!');
      setSelectedWeeks([]);
    } catch (error) {
      setMessage(`Lỗi: ${error.message || 'Có lỗi xảy ra'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    // Ensure date is in yyyy-MM-dd format
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const isWeekSelected = (week) => {
    return selectedWeeks.some(w => w.weekNumber === week.weekNumber);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản Lý Tuần Nghỉ</h1>
        <p>Chọn các tuần nghỉ từ danh sách tuần học</p>
      </div>

      {loading && weeks.length === 0 ? (
        <div className={styles.loading}>Đang tải danh sách tuần...</div>
      ) : (
        <>
          <div className={styles.weeksGrid}>
            {weeks.map((week) => (
              <div
                key={week.weekNumber}
                className={`${styles.weekCard} ${isWeekSelected(week) ? styles.selected : ''}`}
                onClick={() => handleWeekToggle(week)}
              >
                <div className={styles.weekNumber}>Tuần {week.weekNumber}</div>
                <div className={styles.weekDates}>
                  <div className={styles.startDate}>
                    <strong>Từ:</strong> {formatDate(week.startOfWeek)}
                  </div>
                  <div className={styles.endDate}>
                    <strong>Đến:</strong> {formatDate(week.endOfWeek)}
                  </div>
                </div>
                {isWeekSelected(week) && (
                  <div className={styles.selectedIcon}>✓</div>
                )}
              </div>
            ))}
          </div>

          {selectedWeeks.length > 0 && (
            <div className={styles.selectedInfo}>
              <h3>Tuần nghỉ đã chọn ({selectedWeeks.length}):</h3>
              <div className={styles.selectedWeeks}>
                {selectedWeeks.map((week) => (
                  <span key={week.weekNumber} className={styles.selectedWeek}>
                    Tuần {week.weekNumber}
                  </span>
                ))}
              </div>
            </div>
          )}

          {message && (
            <div className={`${styles.message} ${message.includes('Lỗi') ? styles.error : styles.success}`}>
              {message}
            </div>
          )}

          <div className={styles.actions}>
            <button
              onClick={handleSubmitVacation}
              className={styles.submitBtn}
              disabled={loading || selectedWeeks.length === 0}
            >
              {loading ? 'Đang cập nhật...' : 'Cập Nhật Tuần Nghỉ'}
            </button>
            
            {selectedWeeks.length > 0 && (
              <button
                onClick={() => setSelectedWeeks([])}
                className={styles.clearBtn}
              >
                Xóa Lựa Chọn
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VacationManagement;
