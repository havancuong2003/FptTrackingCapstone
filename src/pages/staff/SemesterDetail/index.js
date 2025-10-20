import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getSemesterDetail, 
  updateSemester, 
  updateVacationWeeks 
} from '../../../api/staff/semester';
import BackButton from '../../common/BackButton';
import styles from './index.module.scss';

const SemesterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [semester, setSemester] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [vacationWeeks, setVacationWeeks] = useState([]);
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
        
        // Lấy danh sách tuần từ response
        setWeeks(semesterData.weeks || []);
        
        // Lấy các tuần nghỉ từ response (isVacation = true)
        const vacationWeeks = (semesterData.weeks || []).filter(week => week.isVacation);
        setVacationWeeks(vacationWeeks);
      }
    } catch (error) {
      setMessage(`Lỗi khi tải chi tiết kỳ học: ${error.message || 'Có lỗi xảy ra'}`);
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
        setMessage('Cập nhật thông tin kỳ học thành công!');
        setIsEditing(false);
        loadSemesterDetail(); // Reload data
      }
    } catch (error) {
      setMessage(`Lỗi: ${error.message || 'Có lỗi xảy ra'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWeekToggle = (week) => {
    setWeeks(prevWeeks => {
      return prevWeeks.map(w => 
        w.weekNumber === week.weekNumber 
          ? { ...w, isVacation: !w.isVacation }
          : w
      );
    });
    
    setVacationWeeks(prev => {
      const isSelected = prev.some(w => w.weekNumber === week.weekNumber);
      if (isSelected) {
        return prev.filter(w => w.weekNumber !== week.weekNumber);
      } else {
        return [...prev, { ...week, isVacation: true }];
      }
    });
  };

  const handleUpdateVacation = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Validate semesterId
      const semesterId = parseInt(id);

      if (isNaN(semesterId)) {
        setMessage('Lỗi: ID kỳ học không hợp lệ');
        return;
      }

      // Gửi tất cả tuần với trạng thái isVacation đã cập nhật
      const response = await updateVacationWeeks(semesterId, weeks);
      if (response.status === 200) {
        setMessage('Cập nhật tuần nghỉ thành công!');
        // Reload data để đảm bảo sync
        loadSemesterDetail();
      }
    } catch (error) {
      setMessage(`Lỗi: ${error.message || 'Có lỗi xảy ra'}`);
    } finally {
      setLoading(false);
    }
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

  const isWeekVacation = (week) => {
    return week.isVacation;
  };

  if (loading && !semester) {
    return <div className={styles.loading}>Đang tải chi tiết kỳ học...</div>;
  }

  if (!semester) {
    return <div className={styles.error}>Không tìm thấy kỳ học</div>;
  }

  return (
    <div className={styles.container}>
      <BackButton to="/category-management/semesters" />
      <div className={styles.header}>
        <button onClick={() => navigate('/category-management/semesters')} className={styles.backBtn}>
          ← Quay lại
        </button>
        <h1>Chi Tiết Kỳ Học</h1>
        <button onClick={handleEditToggle} className={styles.editBtn}>
          {isEditing ? 'Hủy' : 'Chỉnh sửa'}
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${message.includes('Lỗi') ? styles.error : styles.success}`}>
          {message}
        </div>
      )}

      {/* Semester Information */}
      <div className={styles.semesterInfo}>
        <h2>Thông Tin Kỳ Học</h2>
        {isEditing ? (
          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label>Tên kỳ học</label>
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleEditChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Ngày bắt đầu</label>
              <input
                type="date"
                name="startAt"
                value={editData.startAt}
                onChange={handleEditChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Ngày kết thúc</label>
              <input
                type="date"
                name="endAt"
                value={editData.endAt}
                onChange={handleEditChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mô tả</label>
              <textarea
                name="description"
                value={editData.description}
                onChange={handleEditChange}
                rows="4"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Trạng thái</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    checked={editData.isActive === true}
                    onChange={handleEditChange}
                  />
                  Đang hoạt động
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    checked={editData.isActive === false}
                    onChange={handleEditChange}
                  />
                  Không hoạt động
                </label>
              </div>
            </div>
            <button onClick={handleUpdateSemester} className={styles.updateBtn} disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
            </button>
          </div>
        ) : (
          <div className={styles.infoDisplay}>
            <div className={styles.infoItem}>
              <strong>Trạng thái:</strong> {semester.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
            </div>
            <div className={styles.infoItem}>
              <strong>Tên kỳ học:</strong> {semester.name}
            </div>
            <div className={styles.infoItem}>
              <strong>Ngày bắt đầu:</strong> {formatDate(semester.startAt)}
            </div>
            <div className={styles.infoItem}>
              <strong>Ngày kết thúc:</strong> {formatDate(semester.endAt)}
            </div>
            {semester.description && (
              <div className={styles.infoItem}>
                <strong>Mô tả:</strong> {semester.description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weeks and Vacation Management */}
      <div className={styles.weeksSection}>
        <h2>Quản Lý Tuần Học & Tuần Nghỉ</h2>
        
        <div className={styles.weeksGrid}>
          {weeks.map((week) => (
            <div
              key={week.weekNumber}
              className={`${styles.weekCard} ${isWeekVacation(week) ? styles.vacationWeek : ''}`}
              onClick={() => handleWeekToggle(week)}
            >
              <div className={styles.weekNumber}>Tuần {week.weekNumber}</div>
              <div className={styles.weekDates}>
                <div className={styles.startDate}>
                  <strong>Từ:</strong> {formatDate(week.startAt)}
                </div>
                <div className={styles.endDate}>
                  <strong>Đến:</strong> {formatDate(week.endAt)}
                </div>
              </div>
              {isWeekVacation(week) && (
                <div className={styles.vacationLabel}>Tuần nghỉ</div>
              )}
            </div>
          ))}
        </div>

        {vacationWeeks.length > 0 && (
          <div className={styles.vacationInfo}>
            <h3>Tuần nghỉ đã chọn ({vacationWeeks.length}):</h3>
            <div className={styles.selectedWeeks}>
              {vacationWeeks.map((week) => (
                <span key={week.weekNumber} className={styles.selectedWeek}>
                  Tuần {week.weekNumber}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.vacationActions}>
          <button
            onClick={handleUpdateVacation}
            className={styles.updateVacationBtn}
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật tuần nghỉ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SemesterDetail;
