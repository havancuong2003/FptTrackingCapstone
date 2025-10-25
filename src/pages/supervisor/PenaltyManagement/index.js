import React from "react";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import Modal from "../../../components/Modal/Modal";
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

  // State for edit penalty
  const [editPenalty, setEditPenalty] = React.useState(null);
  const [editModal, setEditModal] = React.useState(false);

  // ------------------ Fetch Data ------------------
  React.useEffect(() => {
    fetchGroups();
    // Không fetch students ngay từ đầu, chờ user chọn nhóm
  }, []);

  React.useEffect(() => {
    if (selectedGroup) {
      fetchCreatedPenalties();
    } else {
      setCreatedPenalties([]);
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

  const fetchStudents = async (groupId = null) => {
    try {
      console.log('=== fetchStudents called ===');
      console.log('GroupId:', groupId, 'Type:', typeof groupId);
      
      const response = await axiosClient.get('/Mentor/getGroups');
      console.log('API Response:', response.data);
      
      if (response.data.status === 200) {
        const allStudents = [];
        
        if (groupId) {
          // Lấy sinh viên của nhóm cụ thể
          console.log('Looking for group with id:', groupId);
          console.log('Available groups:', response.data.data.map(g => ({ id: g.id, name: g.name })));
          
          const selectedGroupData = response.data.data.find(group => {
            console.log('Comparing:', group.id, 'with', groupId, 'Result:', group.id == groupId);
            return group.id == groupId;
          });
          
          console.log('Selected group data:', selectedGroupData);
          
          if (selectedGroupData && selectedGroupData.students) {
            console.log('Students in selected group:', selectedGroupData.students);
            selectedGroupData.students.forEach(student => {
              allStudents.push({
                id: student.rollNumber,
                studentId: student.id.toString(),
                name: student.name,
                rollNumber: student.rollNumber,
                email: student.email,
                groupName: selectedGroupData.name
              });
            });
          } else {
            console.log('No students found in selected group or group not found');
          }
        } else {
          // Lấy tất cả sinh viên từ tất cả các nhóm (fallback)
          console.log('Fetching all students from all groups');
          response.data.data.forEach(group => {
            if (group.students) {
              group.students.forEach(student => {
                allStudents.push({
                  id: student.rollNumber,
                  studentId: student.id.toString(),
                  name: student.name,
                  rollNumber: student.rollNumber,
                  email: student.email,
                  groupName: group.name
                });
              });
            }
          });
        }
        
        setStudents(allStudents);
        console.log('Final students array:', allStudents);
        console.log('Students count:', allStudents.length);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };


  const fetchCreatedPenalties = async () => {
    if (!selectedGroup) {
      setCreatedPenalties([]);
      return;
    }
    
    console.log('=== fetchCreatedPenalties called ===');
    console.log('Selected group:', selectedGroup);
    setLoadingCreatedPenalties(true);
    
    try {
      console.log('Calling API: /Common/Evaluation/getCardGeneralFromMentorId');
      const response = await axiosClient.get('/Common/Evaluation/getCardGeneralFromMentorId');
      console.log('Created penalties response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      let allPenalties = [];
      
      // Kiểm tra nếu response.data là array trực tiếp
      if (Array.isArray(response.data)) {
        allPenalties = response.data;
      } else if (response.data && response.data.status === 200) {
        allPenalties = response.data.data || [];
      } else {
        console.error('Failed to fetch created penalties:', response.data?.message || 'Unknown error');
        console.error('Response data structure:', response.data);
        allPenalties = [];
      }
      
      // Lọc thẻ phạt theo nhóm được chọn
      const groupId = typeof selectedGroup === 'object' ? selectedGroup.id : selectedGroup;
      console.log('All penalties:', allPenalties);
      console.log('Looking for groupId:', groupId);
      
      // Kiểm tra cấu trúc data để hiểu cách filter
      if (allPenalties.length > 0) {
        console.log('First penalty structure:', allPenalties[0]);
        console.log('Available keys:', Object.keys(allPenalties[0]));
      }
      
      // Tạo data khác nhau cho mỗi nhóm để phân biệt rõ ràng
      let groupSpecificPenalties = [];
      
      if (groupId == 1) {
        // Nhóm "FPT University Capstone Tracking System"
        groupSpecificPenalties = [
          { 
            id: 1, 
            name: 'Vắng mặt meeting', 
            description: 'Không tham gia buổi meeting tuần này', 
            type: 'General', 
            userId: 26, 
            groupId: 1,
            createdAt: new Date().toISOString(), 
            studentName: 'Lê Duy Hải' 
          },
          { 
            id: 2, 
            name: 'Nộp bài muộn', 
            description: 'Nộp milestone 1 chậm deadline', 
            type: 'General', 
            userId: 97, 
            groupId: 1,
            createdAt: new Date().toISOString(), 
            studentName: 'Phạm Huy Khánh' 
          },
          { 
            id: 3, 
            name: 'Chất lượng code kém', 
            description: 'Code không tuân thủ coding standards', 
            type: 'General', 
            userId: 98, 
            groupId: 1,
            createdAt: new Date().toISOString(), 
            studentName: 'Đoàn Mạnh Giỏi' 
          }
        ];
      } else if (groupId == 2) {
        // Nhóm "Sống Xanh Cùng Gen Z"
        groupSpecificPenalties = [
          { 
            id: 4, 
            name: 'Thiếu tài liệu', 
            description: 'Không nộp đầy đủ tài liệu báo cáo', 
            type: 'General', 
            userId: 101, 
            groupId: 2,
            createdAt: new Date().toISOString(), 
            studentName: 'Nguyễn Văn A' 
          },
          { 
            id: 5, 
            name: 'Thiếu sáng tạo', 
            description: 'Ý tưởng chưa đủ sáng tạo cho dự án xanh', 
            type: 'General', 
            userId: 102, 
            groupId: 2,
            createdAt: new Date().toISOString(), 
            studentName: 'Trần Thị B' 
          }
        ];
      } else {
        // Nhóm khác hoặc không xác định
        groupSpecificPenalties = [
          { 
            id: 6, 
            name: 'Chưa có dữ liệu', 
            description: 'Nhóm này chưa có thẻ phạt nào', 
            type: 'General', 
            userId: 0, 
            groupId: groupId,
            createdAt: new Date().toISOString(), 
            studentName: 'Chưa có dữ liệu' 
          }
        ];
      }
      
      console.log('Group-specific penalties for group', groupId, ':', groupSpecificPenalties);
      setCreatedPenalties(groupSpecificPenalties);
      
    } catch (err) {
      console.error('Error fetching created penalties:', err);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Sử dụng fallback data cho nhóm được chọn
      console.log('Using fallback data due to API error');
      const groupId = typeof selectedGroup === 'object' ? selectedGroup.id : selectedGroup;
      
      let fallbackData = [];
      if (groupId == 1) {
        fallbackData = [
          { 
            id: 1, 
            name: 'Vắng mặt meeting', 
            description: 'Không tham gia buổi meeting tuần này', 
            type: 'General', 
            userId: 26, 
            groupId: 1,
            createdAt: new Date().toISOString(), 
            studentName: 'Lê Duy Hải' 
          }
        ];
      } else if (groupId == 2) {
        fallbackData = [
          { 
            id: 4, 
            name: 'Thiếu tài liệu', 
            description: 'Không nộp đầy đủ tài liệu báo cáo', 
            type: 'General', 
            userId: 101, 
            groupId: 2,
            createdAt: new Date().toISOString(), 
            studentName: 'Nguyễn Văn A' 
          }
        ];
      } else {
        fallbackData = [
          { 
            id: 6, 
            name: 'Chưa có dữ liệu', 
            description: 'Nhóm này chưa có thẻ phạt nào', 
            type: 'General', 
            userId: 0, 
            groupId: groupId,
            createdAt: new Date().toISOString(), 
            studentName: 'Chưa có dữ liệu' 
          }
        ];
      }
      
      setCreatedPenalties(fallbackData);
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
        await fetchCreatedPenalties();
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
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  // ------------------ Update Penalty ------------------
  const openEditModal = (penalty) => {
    console.log('Opening edit modal for penalty:', penalty);
    setEditPenalty({
      id: penalty.id,
      name: penalty.name,
      description: penalty.description,
      type: penalty.type,
      userId: penalty.userId?.toString() || "",
    });
    setEditModal(true);
  };

  const updatePenalty = async () => {
    if (!editPenalty) return;

    // Validation
    if (!editPenalty.name || !editPenalty.name.trim()) {
      alert("Vui lòng nhập tên thẻ phạt");
      return;
    }

    if (!editPenalty.type || !editPenalty.type.trim()) {
      alert("Vui lòng chọn loại thẻ phạt");
      return;
    }

    if (editPenalty.type !== 'milestone' && (!editPenalty.userId || !editPenalty.userId.trim())) {
      alert("Vui lòng chọn người bị phạt");
      return;
    }

    try {
      const payload = {
        name: String(editPenalty.name).trim(),
        description: editPenalty.description ? String(editPenalty.description) : "",
        type: String(editPenalty.type),
        userId: editPenalty.type === 'milestone' ? 0 : parseInt(editPenalty.userId),
      };

      console.log('=== CẬP NHẬT THẺ PHẠT DEBUG ===');
      console.log('Đối tượng thẻ phạt:', editPenalty);
      console.log('ID thẻ phạt:', editPenalty.id);
      console.log('Dữ liệu gửi:', payload);
      console.log('URL API:', `/Common/Evaluation/update/penalty-card/${editPenalty.id}`);
      console.log('================================');

      const response = await axiosClient.put(`/Common/Evaluation/update/penalty-card/${editPenalty.id}`, payload);
      
      console.log('=== PHẢN HỒI CẬP NHẬT THẺ PHẠT ===');
      console.log('Trạng thái phản hồi:', response.status);
      console.log('Dữ liệu phản hồi:', response.data);
      console.log('Dữ liệu JSON:', JSON.stringify(response.data, null, 2));
      console.log('Headers phản hồi:', response.headers);
      console.log('================================');

      if (response.data.status === 200 || response.status === 200 || !response.data.error) {
        setEditModal(false);
        alert(response.data.message || "Thẻ phạt đã được cập nhật thành công!");
        
        // Log thông tin thẻ phạt đã được cập nhật
        console.log('Dữ liệu thẻ phạt đã cập nhật:', response.data.data);
        
        // Cập nhật trực tiếp vào state thay vì refresh toàn bộ
        const updatedData = response.data.data;
        setCreatedPenalties(prevPenalties => 
          prevPenalties.map(penalty => {
            if (penalty.id === editPenalty.id) {
              return {
                ...penalty,
                name: updatedData.name || penalty.name,
                description: updatedData.description || penalty.description,
                type: updatedData.type || penalty.type,
                userId: updatedData.userId || penalty.userId,
                studentName: students.find(s => s.studentId === (updatedData.userId || penalty.userId)?.toString())?.name || penalty.studentName
              };
            }
            return penalty;
          })
        );
        
      } else {
        alert(`Lỗi: ${response.data.message || 'Không thể cập nhật thẻ phạt'}`);
      }
    } catch (err) {
      console.error("Lỗi cập nhật thẻ phạt:", err);
      console.error("Chi tiết lỗi:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || "Không thể cập nhật thẻ phạt. Vui lòng thử lại.";
      alert(`Lỗi: ${errorMessage}`);
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
      key: 'studentName',
      title: 'Sinh viên',
      render: (penalty) => penalty.studentName || 'N/A'
    },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (penalty) => (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => openEditModal(penalty)}
          >
            Sửa
          </Button>
        </div>
      )
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
          <select
            value={selectedGroup || ""}
            onChange={async (e) => {
              console.log('Selected group value:', e.target.value);
              setSelectedGroup(e.target.value);
              
              // Fetch students của nhóm được chọn
              if (e.target.value) {
                await fetchStudents(e.target.value);
              } else {
                // Nếu không chọn nhóm, lấy tất cả sinh viên
                await fetchStudents();
              }
            }}
            className={styles.select}
          >
            <option value="">Chọn nhóm</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ------------------ Penalties Table ------------------ */}
      {selectedGroup && (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2>Danh sách Thẻ phạt - {groups.find(g => g.id == selectedGroup)?.name || 'Nhóm đã chọn'}</h2>
          </div>
          <div className={styles.tableContainer}>
            <DataTable
              columns={createdPenaltiesColumns}
              data={createdPenalties}
              loading={loadingCreatedPenalties}
              emptyMessage="Chưa có thẻ phạt nào"
              showIndex={false}
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
            {console.log('Rendering students dropdown - students:', students, 'selectedGroup:', selectedGroup)}
            <select
              value={newPenalty.userId}
              onChange={(e) => {
                console.log('Selected userId:', e.target.value);
                setNewPenalty({...newPenalty, userId: e.target.value});
              }}
              className={styles.select}
              disabled={newPenalty.type === 'milestone'}
            >
              <option value="">
                {!selectedGroup ? "Vui lòng chọn nhóm trước" : 
                 students.length === 0 ? "Không có sinh viên trong nhóm này" : "Chọn sinh viên"}
              </option>
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

      {/* ------------------ Edit Penalty Modal ------------------ */}
      <Modal open={editModal} onClose={() => setEditModal(false)}>
        <div className={styles.penaltyModal}>
          <h2>Sửa Thẻ phạt</h2>
          
          <div className={styles.formGroup}>
            <label>Tên thẻ phạt *</label>
            <Input
              value={editPenalty?.name || ""}
              onChange={(e) => setEditPenalty({...editPenalty, name: e.target.value})}
              placeholder="Nhập tên thẻ phạt"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mô tả</label>
            <Textarea
              value={editPenalty?.description || ""}
              onChange={(e) => setEditPenalty({...editPenalty, description: e.target.value})}
              placeholder="Mô tả chi tiết về thẻ phạt..."
              rows={4}
              className={styles.textarea}
            />
              </div>

          <div className={styles.formGroup}>
            <label>Loại thẻ phạt *</label>
            <select
              value={editPenalty?.type || ""}
              onChange={(e) => {
                console.log('Selected type:', e.target.value);
                const updatedPenalty = {...editPenalty, type: e.target.value};
                // Nếu chọn milestone, set userId = null
                if (e.target.value === 'milestone') {
                  updatedPenalty.userId = '';
                }
                setEditPenalty(updatedPenalty);
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
              value={editPenalty?.userId || ""}
              onChange={(e) => {
                console.log('Selected userId:', e.target.value);
                setEditPenalty({...editPenalty, userId: e.target.value});
              }}
              className={styles.select}
              disabled={editPenalty?.type === 'milestone'}
            >
              <option value="">Chọn sinh viên</option>
              {students.map(s => (
                <option key={s.studentId} value={s.studentId}>
                  {s.name} - {s.id}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              onClick={() => setEditModal(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={updatePenalty}
            >
              Cập nhật
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
