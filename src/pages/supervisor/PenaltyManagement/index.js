import React from "react";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import Modal from "../../../components/Modal/Modal";
import Select from "../../../components/Select/Select";
import Input from "../../../components/Input/Input";
import Textarea from "../../../components/Textarea/Textarea";
import DataTable from "../../../components/DataTable/DataTable";
import axiosClient from "../../../utils/axiosClient";
import styles from "./index.module.scss";

export default function PenaltyManagement() {
  const [penalties, setPenalties] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [selectedStudent, setSelectedStudent] = React.useState(null);
  const [penaltyModal, setPenaltyModal] = React.useState(false);
  const [issuedPenalties, setIssuedPenalties] = React.useState([]);
  const [createdPenalties, setCreatedPenalties] = React.useState([]);
  const [loadingCreatedPenalties, setLoadingCreatedPenalties] = React.useState(false);
  
  // Debug logs for state changes
  React.useEffect(() => {
    console.log('createdPenalties state changed:', createdPenalties);
  }, [createdPenalties]);
  
  React.useEffect(() => {
    console.log('loadingCreatedPenalties state changed:', loadingCreatedPenalties);
  }, [loadingCreatedPenalties]);
  const [newPenalty, setNewPenalty] = React.useState({
    name: "",
    description: "",
    type: "",
    userId: "",
  });

  // ------------------ Fetch Data ------------------
  React.useEffect(() => {
    fetchGroups();
    fetchStudents();
    fetchCreatedPenalties();
  }, []);

  React.useEffect(() => {
    if (selectedGroup) {
      fetchPenalties();
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      console.log('Fetching groups from /Mentor/getGroups');
      const response = await axiosClient.get('/Mentor/getGroups');
      console.log('Groups API response:', response.data);
      
      if (response.data.status === 200) {
        const groupsData = response.data.data || [];
        console.log('Groups data:', groupsData);
        setGroups(groupsData);
      } else {
        console.error('API returned non-200 status:', response.data);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axiosClient.get('/Mentor/getGroups');
      if (response.data.status === 200) {
        // Lấy tất cả sinh viên từ tất cả các nhóm
        const allStudents = [];
        response.data.data.forEach(group => {
          if (group.students) {
            group.students.forEach(student => {
              allStudents.push({
                id: student.rollNumber, // Sử dụng rollNumber làm student code giống Evaluation
                studentId: student.id.toString(), // Giữ lại studentId để gọi API
                name: student.name,
                rollNumber: student.rollNumber,
                email: student.email,
                groupName: group.name
              });
            });
          }
        });
        setStudents(allStudents);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchPenalties = async () => {
    try {
      const response = await axiosClient.get('/Common/Evaluation/card-milestone', {
        params: {
          groupId: selectedGroup
        }
      });
      if (response.data.status === 200) {
        const penaltiesData = response.data.data || [];
        // Chuyển đổi dữ liệu để phù hợp với hiển thị
        const formattedPenalties = penaltiesData.map(penalty => ({
          id: penalty.id,
          name: penalty.name,
          description: penalty.description,
          type: penalty.type,
          userId: penalty.userId,
          createdAt: penalty.createdAt,
          // Thêm thông tin sinh viên nếu có
          studentName: students.find(s => s.studentId === penalty.userId?.toString())?.name || "Unknown"
        }));
        setPenalties(formattedPenalties);
      } else {
        console.error('Failed to fetch penalties:', response.data.message);
        setPenalties([]);
      }
    } catch (err) {
      console.error('Error fetching penalties:', err);
      setPenalties([]);
    }
  };

  const fetchCreatedPenalties = async () => {
    console.log('=== fetchCreatedPenalties called ===');
    setLoadingCreatedPenalties(true);
    try {
      console.log('Calling API: /Common/Evaluation/getCardGeneralFromMentorId');
      const response = await axiosClient.get('/Common/Evaluation/getCardGeneralFromMentorId');
      console.log('Created penalties response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Kiểm tra nếu response.data là array trực tiếp
      if (Array.isArray(response.data)) {
        console.log('Setting created penalties (array):', response.data);
        setCreatedPenalties(response.data);
      } else if (response.data && response.data.status === 200) {
        const penaltiesData = response.data.data || [];
        console.log('Setting created penalties (with status):', penaltiesData);
        setCreatedPenalties(penaltiesData);
      } else {
        console.error('Failed to fetch created penalties:', response.data?.message || 'Unknown error');
        console.error('Response data structure:', response.data);
        setCreatedPenalties([]);
      }
    } catch (err) {
      console.error('Error fetching created penalties:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setCreatedPenalties([]);
    } finally {
      setLoadingCreatedPenalties(false);
      console.log('=== fetchCreatedPenalties completed ===');
    }
  };

  // ------------------ Penalty Types ------------------
  const penaltyTypes = [
    { value: "general", label: "General" },
    { value: "milestone", label: "Milestone" }
  ];

  // ------------------ Modal Logic ------------------
  const openPenaltyModal = (student = null) => {
    if (student) {
      setSelectedStudent(student);
      setNewPenalty({
        name: "",
        description: "",
        type: "",
        userId: student.studentId,
      });
    } else {
      setSelectedStudent(null);
      setNewPenalty({
        name: "",
        description: "",
        type: "",
        userId: "",
      });
    }
    setPenaltyModal(true);
  };

  const submitPenalty = async () => {
    // Debug log để kiểm tra dữ liệu
    console.log('newPenalty state:', newPenalty);
    
    // Kiểm tra validation chi tiết hơn
    if (!newPenalty.name || typeof newPenalty.name !== 'string' || !newPenalty.name.trim()) {
      console.log('Validation failed: name =', newPenalty.name);
      alert("Vui lòng nhập tên thẻ phạt");
      return;
    }
    
    if (!newPenalty.type || typeof newPenalty.type !== 'string' || !newPenalty.type.trim()) {
      console.log('Validation failed: type =', newPenalty.type);
      alert("Vui lòng chọn loại thẻ phạt");
      return;
    }
    
    // Chỉ yêu cầu userId khi loại không phải milestone
    if (newPenalty.type !== 'milestone' && (!newPenalty.userId || typeof newPenalty.userId !== 'string' || !newPenalty.userId.trim())) {
      console.log('Validation failed: userId =', newPenalty.userId);
      alert("Vui lòng chọn người bị phạt");
      return;
    }

    // Kiểm tra userId có phải là số hợp lệ không (chỉ khi không phải milestone)
    let userIdNumber = null;
    if (newPenalty.type !== 'milestone') {
      userIdNumber = parseInt(newPenalty.userId);
      if (isNaN(userIdNumber) || userIdNumber <= 0) {
        alert("ID người dùng không hợp lệ");
        return;
      }
    }

    try {
      const payload = {
        name: String(newPenalty.name).trim(),
        description: newPenalty.description ? String(newPenalty.description) : "",
        type: String(newPenalty.type),
        userId: newPenalty.type === 'milestone' ? 0 : userIdNumber,
        createdAt: new Date().toISOString()
      };
      
      console.log('Payload gửi lên API:', payload);
      console.log('API Endpoint: /Common/Evaluation/create-card');

      const response = await axiosClient.post('/Common/Evaluation/create-card', payload);
      
      console.log('API Response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.data.status === 200) {
        // Thêm thẻ phạt vào danh sách đã cấp
        const studentName = newPenalty.type === 'milestone' 
          ? "Milestone Penalty" 
          : students.find(s => s.studentId === newPenalty.userId)?.name || "Unknown";
        const newIssuedPenalty = {
          id: Date.now(),
          name: payload.name,
          description: payload.description,
          type: payload.type,
          studentName: studentName,
          createdAt: payload.createdAt,
          userId: payload.userId
        };
        setIssuedPenalties(prev => [newIssuedPenalty, ...prev]);
        
        // Refresh penalties list
        await fetchPenalties();
        setPenaltyModal(false);
        setNewPenalty({
          name: "",
          description: "",
          type: "",
          userId: "",
        });
        alert("Cấp thẻ phạt thành công!");
      } else {
        console.error('API Error:', response.data);
        alert(`Lỗi: ${response.data.message || 'Không thể cấp thẻ phạt'}`);
      }
    } catch (err) {
      console.error("Error submitting penalty:", err);
      console.error("Error details:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error headers:", err.response?.headers);
      const errorMessage = err.response?.data?.message || err.message || "Không thể cấp thẻ phạt. Vui lòng thử lại.";
      alert(`Error: ${errorMessage}`);
    }
  };


  // ------------------ Created Penalties Table Columns ------------------
  const createdPenaltiesColumns = [
    {
      key: 'stt',
      title: 'STT',
      render: (_, index) => index + 1
    },
    {
      key: 'name',
      title: 'Tên thẻ phạt',
      render: (penalty) => penalty.name || 'N/A'
    },
    {
      key: 'description',
      title: 'Mô tả',
      render: (penalty) => penalty.description || 'N/A'
    },
    {
      key: 'type',
      title: 'Thể loại',
      render: (penalty) => {
        const typeLabels = {
          'general': 'General',
          'General': 'General',
          'milestone': 'Milestone',
          'Milestone': 'Milestone'
        };
        return typeLabels[penalty.type] || penalty.type || 'N/A';
      }
    },
    {
      key: 'userName',
      title: 'Sinh viên',
      render: (penalty) => penalty.userName || 'N/A'
    }
  ];

  // ------------------ Table Columns ------------------
  const columns = [
    {
      key: 'studentName',
      title: 'Sinh viên',
      render: (penalty) => {
        const student = students.find(s => s.studentId === penalty.userId?.toString());
        return (
          <div className={styles.studentInfo}>
            <div className={styles.studentName}>{student?.name || penalty.studentName || "Unknown"}</div>
            <div className={styles.studentCode}>{student?.id || ""}</div>
          </div>
        );
      }
    },
    {
      key: 'name',
      title: 'Tên thẻ phạt',
      render: (penalty) => (
        <span className={styles.penaltyName}>
          {penalty.name}
        </span>
      )
    },
    {
      key: 'type',
      title: 'Loại',
      render: (penalty) => {
        const typeInfo = penaltyReasons.find(r => r.value === penalty.type);
        return (
          <span className={styles.penaltyType}>
            {typeInfo?.label || penalty.type}
          </span>
        );
      }
    },
    {
      key: 'description',
      title: 'Mô tả',
      render: (penalty) => (
        <span className={styles.description}>
          {penalty.description || "Không có mô tả"}
        </span>
      )
    },
    {
      key: 'createdAt',
      title: 'Thời gian',
      render: (penalty) => (
        <span className={styles.penaltyDate}>
          {new Date(penalty.createdAt).toLocaleString('vi-VN')}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (penalty) => (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              // View penalty details
              alert(`Chi tiết thẻ phạt:\nLý do: ${penalty.reason}\nMô tả: ${penalty.description || "Không có"}`);
            }}
          >
            Xem
          </Button>
        </div>
      )
    }
  ];


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Quản lý Thẻ phạt</h1>
        <div className={styles.headerActions}>
          <Button
            onClick={() => openPenaltyModal()}
          >
            Cấp thẻ phạt
          </Button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Nhóm:</label>
          <Select
            value={selectedGroup || ""}
            onChange={setSelectedGroup}
            options={(() => {
              const options = groups.map((g) => ({
                value: g.id, 
                label: g.name, 
              }));
              console.log('Select options:', options);
              console.log('Groups state:', groups);
              return options;
            })()}
            placeholder="Chọn nhóm"
          />
        </div>
      </div>

      {/* ------------------ Created Penalties Table ------------------ */}
      <div className={styles.penaltyTable}>
        <h2>Danh sách Thẻ phạt đã tạo</h2>
        <div className={styles.tableContainer}>
          {console.log('=== RENDERING CREATED PENALTIES ===')}
          {console.log('createdPenalties:', createdPenalties)}
          {console.log('loadingCreatedPenalties:', loadingCreatedPenalties)}
          {console.log('createdPenaltiesColumns:', createdPenaltiesColumns)}
          {console.log('createdPenalties.length:', createdPenalties.length)}
           <DataTable
             columns={createdPenaltiesColumns}
             data={createdPenalties}
             loading={loadingCreatedPenalties}
             emptyMessage="Chưa có thẻ phạt nào được tạo"
             showIndex={false}
           />
        </div>
      </div>

      {selectedGroup && (
        <div className={styles.penaltyTable}>
          <h2>Danh sách Thẻ phạt</h2>
          <div className={styles.tableContainer}>
            <DataTable
              columns={columns}
              data={penalties}
              loading={loading}
              emptyMessage="Chưa có thẻ phạt nào"
            />
          </div>
        </div>
      )}

      {/* ------------------ Penalty Modal ------------------ */}
      <Modal open={penaltyModal} onClose={() => setPenaltyModal(false)}>
        <div className={styles.penaltyModal}>
          <h2>Cấp Thẻ phạt</h2>
          
          <div className={styles.formGroup}>
            <label>Tên thẻ phạt *</label>
            <Input
              value={newPenalty.name}
              onChange={(e) => setNewPenalty({...newPenalty, name: e.target.value})}
              placeholder="Nhập tên thẻ phạt"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mô tả</label>
            <Textarea
              value={newPenalty.description}
              onChange={(e) => setNewPenalty({...newPenalty, description: e.target.value})}
              placeholder="Mô tả chi tiết về thẻ phạt..."
              rows={4}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Loại thẻ phạt *</label>
            <select
              value={newPenalty.type}
              onChange={(e) => {
                console.log('Selected type:', e.target.value);
                const updatedPenalty = {...newPenalty, type: e.target.value};
                // Nếu chọn milestone, set userId = null
                if (e.target.value === 'milestone') {
                  updatedPenalty.userId = '';
                }
                setNewPenalty(updatedPenalty);
              }}
              className={styles.select}
            >
              <option value="">Chọn loại thẻ phạt</option>
              {penaltyTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Người bị phạt *</label>
            <select
              value={newPenalty.userId}
              onChange={(e) => {
                console.log('Selected userId:', e.target.value);
                setNewPenalty({...newPenalty, userId: e.target.value});
              }}
              className={styles.select}
              disabled={newPenalty.type === 'milestone'}
            >
              <option value="">Chọn sinh viên</option>
              {students.map(s => (
                <option key={s.studentId} value={s.studentId}>
                  {s.name} - {s.id}
                </option>
              ))}
            </select>
          </div>

          {/* <div className={styles.formGroup}>
            <label>Ngày tạo</label>
            <Input
              value={new Date().toLocaleString('vi-VN')}
              disabled
              className={styles.disabledInput}
            />
          </div> */}

          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              onClick={() => setPenaltyModal(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={submitPenalty}
            >
              Cấp thẻ phạt
            </Button>
          </div>
        </div>
      </Modal>


      {/* ------------------ Issued Penalties List ------------------ */}
      {issuedPenalties.length > 0 && (
        <div className={styles.issuedPenaltiesSection}>
          <h2>Thẻ phạt đã cấp gần đây</h2>
          <div className={styles.issuedPenaltiesList}>
            {issuedPenalties.map((penalty) => (
              <div key={penalty.id} className={styles.issuedPenaltyCard}>
                <div className={styles.penaltyCardHeader}>
                  <div className={styles.penaltyCardTitle}>
                    <h3>{penalty.name}</h3>
                    <span className={`${styles.penaltyType} ${styles[penalty.type]}`}>
                      {penaltyTypes.find(t => t.value === penalty.type)?.label || penalty.type}
                    </span>
                  </div>
                  <div className={styles.penaltyCardTime}>
                    {new Date(penalty.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className={styles.penaltyCardContent}>
                  <div className={styles.penaltyCardStudent}>
                    <strong>Người bị phạt:</strong> {penalty.studentName}
                  </div>
                  {penalty.description && (
                    <div className={styles.penaltyCardDescription}>
                      <strong>Mô tả:</strong> {penalty.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
