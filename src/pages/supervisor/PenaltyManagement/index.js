import React from "react";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import Modal from "../../../components/Modal/Modal";
import Input from "../../../components/Input/Input";
import Textarea from "../../../components/Textarea/Textarea";
import DataTable from "../../../components/DataTable/DataTable";
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from "../../../auth/auth";
import { getCapstoneGroupDetail } from "../../../api/staff/groups";
import { getGeneralPenaltyCardsByMentor, createPenaltyCard, updatePenaltyCard } from "../../../api/evaluation";
import SupervisorGroupFilter from "../../../components/SupervisorGroupFilter/SupervisorGroupFilter";
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
  
  // State for penalty statistics
  const [groupPenalties, setGroupPenalties] = React.useState([]);
  const [loadingPenaltyStats, setLoadingPenaltyStats] = React.useState(false);
  const [semesters, setSemesters] = React.useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = React.useState(null);
  const [groupExpireFilter, setGroupExpireFilter] = React.useState('active'); // 'active' or 'expired'
  
  const [newPenalty, setNewPenalty] = React.useState({
    name: "",
    description: "",
    type: "",
    userId: "",
  });

  // State for edit penalty
  const [editPenalty, setEditPenalty] = React.useState(null);
  const [editModal, setEditModal] = React.useState(false);

  // ------------------ Load Semesters and Groups ------------------
  React.useEffect(() => {
    function loadSemesters() {
      const uniqueSemesters = getUniqueSemesters();
      setSemesters(uniqueSemesters);
      
      const currentSemesterId = getCurrentSemesterId();
      if (currentSemesterId) {
        setSelectedSemesterId(currentSemesterId);
      } else if (uniqueSemesters.length > 0) {
        setSelectedSemesterId(uniqueSemesters[0].id);
      }
    }
    loadSemesters();
  }, []);

  React.useEffect(() => {
    if (selectedSemesterId === null) {
      setGroups([]);
      return;
    }
    
    // Get groups from localStorage only (no API call)
    const isExpired = groupExpireFilter === 'expired';
    const groupsFromStorage = getGroupsBySemesterAndStatus(selectedSemesterId, isExpired);
    
    // Build groups list from localStorage only
    const groupsData = groupsFromStorage.map(groupInfo => ({
      id: groupInfo.id,
      name: groupInfo.name || `Group ${groupInfo.id}`,
      groupCode: groupInfo.code || groupInfo.groupCode || ''
    }));
    
    setGroups(groupsData);
    
    // Check if selected group is still in filtered list
    const selectedGroupExists = selectedGroup && groupsFromStorage.some(g => {
      const groupId = typeof selectedGroup === 'object' ? selectedGroup.id : selectedGroup;
      return g.id === Number(groupId);
    });
    
    if (selectedGroup && !selectedGroupExists) {
      // Selected group is not in filtered list, clear selection and data
      setSelectedGroup(null);
      setSelectedStudent(null);
      setStudents([]);
      setCreatedPenalties([]);
      setGroupPenalties([]);
    }
  }, [selectedSemesterId, groupExpireFilter]);

  React.useEffect(() => {
    if (selectedGroup) {
      // Refetch khi nhóm đổi hoặc danh sách sinh viên đã sẵn sàng (tránh race condition)
      fetchCreatedPenalties();
      fetchGroupPenalties();
    } else {
      setCreatedPenalties([]);
      setGroupPenalties([]);
    }
  }, [selectedGroup, students]);


  const fetchStudents = async (groupId = null) => {
    try {

      if (!groupId) {
        // No group selected: clear students
        setStudents([]);
        return;
      }

      // Sync data retrieval method with Evaluation: use /Staff/capstone-groups/:id
      const studentRes = await getCapstoneGroupDetail(groupId);

      // Normalize returned data
      let studentData;
      if (studentRes?.status === 200) {
        studentData = studentRes.data;
      } else if (studentRes?.data) {
        studentData = studentRes.data;
      } else {
        studentData = studentRes;
      }

      if (!studentData || !Array.isArray(studentData.students)) {
        setStudents([]);
        return;
      }

      // Map students according to Evaluation standard
      const mappedStudents = studentData.students.map(s => ({
        id: s.rollNumber,
        studentId: s.id?.toString(),
        name: s.name,
        rollNumber: s.rollNumber,
        email: s.email,
        groupName: studentData.projectName || studentData.name || ''
      }));

      setStudents(mappedStudents);

      // Update group name according to projectName like Evaluation for consistent display
      if (studentData.projectName) {
        setGroups(prev => prev.map(g => (
          (g.id?.toString() || g.groupId?.toString()) === groupId?.toString()
            ? { ...g, name: studentData.projectName }
            : g
        )));
      }
    } catch (err) {
      setStudents([]);
    }
  };


  const fetchCreatedPenalties = async () => {
    if (!selectedGroup) {
      setCreatedPenalties([]);
      return;
    }
    
    setLoadingCreatedPenalties(true);
    
    try {
      const response = await getGeneralPenaltyCardsByMentor();
      
      let allPenalties = [];
      
      // Check if response.data is array directly
      if (Array.isArray(response)) {
        allPenalties = response;
      } else if (response?.status === 200) {
        allPenalties = response.data || [];
      } else if (Array.isArray(response?.data)) {
        allPenalties = response.data;
      } else {
        allPenalties = [];
      }
      
      // Filter penalty cards by selected group
      const groupId = typeof selectedGroup === 'object' ? selectedGroup.id : selectedGroup;
      
      // Check data structure to understand how to filter
      if (allPenalties.length > 0) {
      }

      // Map studentName cho các penalty từ API thật
      const penaltiesWithStudentNames = allPenalties.map(penalty => {
        
        const student = students.find(s => {
          const matchById = s.studentId === penalty.userId?.toString();
          const matchByRollNumber = s.id === penalty.userId?.toString();
          const matchByNumber = s.studentId === penalty.userId;
          const match = matchById || matchByRollNumber || matchByNumber;
          return match;
        });
        
        
        return {
          ...penalty,
          studentName: student?.name || penalty.studentName || 'Unknown'
        };
      });
      
      // Chỉ giữ các penalty có user thuộc nhóm hiện tại
      const studentIdsInGroup = new Set(students.map(s => s.studentId));
      const filteredApiPenalties = penaltiesWithStudentNames.filter(p => 
        p.userId != null && (studentIdsInGroup.has(String(p.userId)) || studentIdsInGroup.has(p.userId))
      );
      
      // Chỉ dùng dữ liệu từ API
      setCreatedPenalties(filteredApiPenalties);
      
    } catch (err) {
      // Lỗi: không dùng dữ liệu mock, trả về rỗng
      setCreatedPenalties([]);
    } finally {
      setLoadingCreatedPenalties(false);
    }
  };

  // ------------------ Fetch Penalty Cards for Statistics ------------------
  const fetchGroupPenalties = async () => {
    if (!selectedGroup || !students || students.length === 0) {
      setGroupPenalties([]);
      return;
    }
    
    setLoadingPenaltyStats(true);
    try {
      const response = await getGeneralPenaltyCardsByMentor();
      
      let allPenalties = [];
      
      // Check if response.data is array directly
      if (Array.isArray(response)) {
        allPenalties = response;
      } else if (response?.status === 200) {
        allPenalties = response.data || [];
      } else if (Array.isArray(response?.data)) {
        allPenalties = response.data;
      } else {
        allPenalties = [];
      }
      
      // Lọc thẻ phạt theo nhóm được chọn và map studentName
      const filteredPenalties = allPenalties.map(penalty => {
        // Tìm student từ students
        const student = students.find(s => {
          const matchById = s.studentId === penalty.userId?.toString();
          const matchByNumber = s.studentId === penalty.userId;
          return matchById || matchByNumber;
        });
        
        return {
          ...penalty,
          studentName: student?.name || penalty.studentName || 'Unknown',
          studentId: penalty.userId
        };
      }).filter(penalty => {
        // Chỉ lấy penalties của các sinh viên trong nhóm hiện tại
        return students.some(s => {
          const matchById = s.studentId === penalty.userId?.toString();
          const matchByNumber = s.studentId === penalty.userId;
          return matchById || matchByNumber;
        });
      });
      
      setGroupPenalties(filteredPenalties);
    } catch (err) {
      setGroupPenalties([]);
    } finally {
      setLoadingPenaltyStats(false);
    }
  };

  // ------------------ Calculate Penalty Statistics by Student ------------------
  const normalizePenaltyType = (rawType) => {
    if (!rawType) return '';
    const t = String(rawType).trim().toLowerCase();
    // English variants
    if (t === 'warning' || t.includes('warn')) return 'warning';
    if (t === 'no-deduction' || t === 'no_deduction' || t === 'no deduction' || t.includes('no-deduct')) return 'no-deduction';
    if (t === 'deduction' || t.includes('deduct') || t.includes('minus')) return 'deduction';
    // Vietnamese variants
    if (t.includes('nhắc') || t.includes('nhac')) return 'warning';
    if (t.includes('không trừ') || t.includes('khong tru') || t.includes('không tru') || t.includes('khong trừ')) return 'no-deduction';
    if (t.includes('trừ điểm') || t.includes('tru diem') || t.includes('trừ diem') || t.includes('tru điểm')) return 'deduction';
    return t;
  };

  const getStudentPenaltyStats = () => {
    if (!students || students.length === 0) return [];
    
    return students.map(student => {
      const studentPenalties = groupPenalties.filter(p => {
        const matchById = p.userId?.toString() === student.studentId;
        const matchByNumber = p.userId === parseInt(student.studentId);
        return matchById || matchByNumber;
      });
      
      const normalized = studentPenalties.map(p => ({ ...p, _type: normalizePenaltyType(p.type) }));

      const stats = {
        studentId: student.studentId,
        studentName: student.name,
        studentCode: student.id,
        total: studentPenalties.length,
        warning: normalized.filter(p => p._type === 'warning').length,
        noDeduction: normalized.filter(p => p._type === 'no-deduction').length,
        deduction: normalized.filter(p => p._type === 'deduction').length
      };
      
      return stats;
    });
  };
  
  const studentPenaltyStats = getStudentPenaltyStats();

  // ------------------ Penalty Types ------------------
  const penaltyTypes = [
    { value: "warning", label: "Nhắc nhở" },
    { value: "no-deduction", label: "Không trừ điểm" },
    { value: "deduction", label: "Trừ điểm" }
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
    
    // Kiểm tra validation chi tiết hơn
    if (!newPenalty.name || typeof newPenalty.name !== 'string' || !newPenalty.name.trim()) {
      alert("Please enter penalty name");
      return;
    }
    
    if (!newPenalty.type || typeof newPenalty.type !== 'string' || !newPenalty.type.trim()) {
      alert("Please select penalty type");
      return;
    }
    
    // Luôn yêu cầu userId vì tất cả loại penalty đều cần gán cho student
    if (!newPenalty.userId || typeof newPenalty.userId !== 'string' || !newPenalty.userId.trim()) {
      alert("Please select person to penalize");
      return;
    }

    // Kiểm tra userId có phải là số hợp lệ không
    const userIdNumber = parseInt(newPenalty.userId);
    if (isNaN(userIdNumber) || userIdNumber <= 0) {
      alert("ID người dùng không hợp lệ");
      return;
    }

    try {
      const payload = {
        name: String(newPenalty.name).trim(),
        description: newPenalty.description ? String(newPenalty.description) : "",
        type: String(newPenalty.type),
        userId: userIdNumber
      };
      

      const response = await createPenaltyCard(payload);
      

      if (response.status === 200) {
        // Add penalty card to issued list (quick display)
        const studentName = students.find(s => s.studentId === newPenalty.userId)?.name || "Unknown";
        const newIssuedPenalty = {
          id: Date.now(),
          name: payload.name,
          description: payload.description,
          type: payload.type,
          studentName: studentName,
            createdAt: response.data?.createdAt || new Date().toISOString(),
          userId: payload.userId
        };
        setIssuedPenalties(prev => [newIssuedPenalty, ...prev]);

        // Update penalty list table immediately (optimistic update)
        const newCreatedPenalty = {
          id: response.data?.id || Date.now(),
          name: payload.name,
          description: payload.description,
          type: payload.type,
          userId: payload.userId,
          groupId: parseInt(selectedGroup),
            createdAt: response.data?.createdAt || new Date().toISOString(),
          studentName: studentName
        };
        setCreatedPenalties(prev => [newCreatedPenalty, ...prev]);
        
        // Can refetch to sync with server (keep if needed)
        await fetchCreatedPenalties();
        await fetchGroupPenalties();

        setPenaltyModal(false);
        setNewPenalty({
          name: "",
          description: "",
          type: "",
          userId: "",
        });
        alert("Penalty issued successfully!");
      } else {
        alert(`Error: ${response.message || 'Unable to issue penalty'}`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Unable to issue penalty. Please try again.";
      alert(`Error: ${errorMessage}`);
    }
  };

  // ------------------ Update Penalty ------------------
  const openEditModal = (penalty) => {
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
      alert("Please enter penalty name");
      return;
    }

    if (!editPenalty.type || !editPenalty.type.trim()) {
      alert("Please select penalty type");
      return;
    }

    // Luôn yêu cầu userId vì tất cả loại penalty đều cần gán cho student
    if (!editPenalty.userId || !editPenalty.userId.trim()) {
      alert("Please select person to penalize");
      return;
    }

    try {
      const payload = {
        name: String(editPenalty.name).trim(),
        description: editPenalty.description ? String(editPenalty.description) : "",
        type: String(editPenalty.type),
        userId: parseInt(editPenalty.userId),
      };


      const response = await updatePenaltyCard(editPenalty.id, payload);
      

      if (response.status === 200 || !response.error) {
        setEditModal(false);
        alert(response.message || "Penalty updated successfully!");
        
        
        // Update directly to state instead of full refresh
        const updatedData = response.data;
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
        
        // Refresh penalty stats
        await fetchGroupPenalties();
        
      } else {
        alert(`Error: ${response.message || 'Unable to update penalty'}`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Unable to update penalty. Please try again.";
      alert(`Error: ${errorMessage}`);
    }
  };


  // ------------------ Penalty Statistics Columns ------------------
  const penaltyStatsColumns = [
    {
      key: 'student',
      title: 'Student',
      render: (stats) => (
        <div className={styles.studentInfo}>
          <strong>{stats.studentName}</strong>
          <div className={styles.studentCode}>{stats.studentCode || ''}</div>
        </div>
      )
    },
    {
      key: 'total',
      title: 'Tổng số',
      render: (stats) => (
        <span className={styles.statTotal}>{stats.total}</span>
      )
    },
    {
      key: 'warning',
      title: 'Nhắc nhở',
      render: (stats) => (
        <span className={`${styles.statBadge} ${styles.statWarning}`}>
          {stats.warning}
        </span>
      )
    },
    {
      key: 'noDeduction',
      title: 'Không trừ điểm',
      render: (stats) => (
        <span className={`${styles.statBadge} ${styles.statNoDeduction}`}>
          {stats.noDeduction}
        </span>
      )
    },
    {
      key: 'deduction',
      title: 'Trừ điểm',
      render: (stats) => (
        <span className={`${styles.statBadge} ${styles.statDeduction}`}>
          {stats.deduction}
        </span>
      )
    }
  ];

  // ------------------ Created Penalties Table Columns ------------------
  const createdPenaltiesColumns = [
    {
      key: 'stt',
      title: 'No.',
      render: (_, index) => index + 1
    },
    {
      key: 'studentName',
      title: 'Student',
      render: (penalty) => penalty.studentName || 'N/A'
    },
    {
      key: 'name',
      title: 'Penalty Name',
      render: (penalty) => penalty.name || 'N/A'
    },
    {
      key: 'description',
      title: 'Description',
      render: (penalty) => penalty.description || 'N/A'
    },
    {
      key: 'type',
      title: 'Type',
      render: (penalty) => {
        const typeLabels = {
          'warning': 'Nhắc nhở',
          'no-deduction': 'Không trừ điểm',
          'deduction': 'Trừ điểm'
        };
        return typeLabels[penalty.type] || penalty.type || 'N/A';
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (penalty) => (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => openEditModal(penalty)}
          >
            Edit
          </Button>
        </div>
      )
    }
  ];

  // ------------------ Table Columns ------------------
  const columns = [
    {
      key: 'studentName',
      title: 'Student',
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
      title: 'Penalty Name',
      render: (penalty) => (
        <span className={styles.penaltyName}>
          {penalty.name}
        </span>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (penalty) => {
        const typeLabels = {
          'warning': 'Nhắc nhở',
          'no-deduction': 'Không trừ điểm',
          'deduction': 'Trừ điểm'
        };
        const getTypeClassName = (type) => {
          if (type === 'warning') return styles.penaltyTypeWarning;
          if (type === 'no-deduction') return styles.penaltyTypeNoDeduction;
          if (type === 'deduction') return styles.penaltyTypeDeduction;
          return '';
        };
        return (
          <span className={`${styles.penaltyType} ${getTypeClassName(penalty.type)}`}>
            {typeLabels[penalty.type] || penalty.type || 'N/A'}
          </span>
        );
      }
    },
    {
      key: 'description',
      title: 'Description',
      render: (penalty) => (
        <span className={styles.description}>
          {penalty.description || "No description"}
        </span>
      )
    },
    {
      key: 'createdAt',
      title: 'Time',
      render: (penalty) => (
        <span className={styles.penaltyDate}>
          {new Date(penalty.createdAt).toLocaleString('vi-VN')}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (penalty) => (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              // View penalty details
              alert(`Penalty details:\nReason: ${penalty.reason}\nDescription: ${penalty.description || "None"}`);
            }}
          >
            View
          </Button>
        </div>
      )
    }
  ];


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Penalty Management</h1>
        <div className={styles.headerActions}>
          <Button
            onClick={() => openPenaltyModal()}
          >
            Issue Penalty
          </Button>
        </div>
      </div>

      <div className={styles.controls}>
        <SupervisorGroupFilter
          semesters={semesters}
          selectedSemesterId={selectedSemesterId}
          onSemesterChange={setSelectedSemesterId}
          groupExpireFilter={groupExpireFilter}
          onGroupExpireFilterChange={setGroupExpireFilter}
          groups={groups}
          selectedGroupId={typeof selectedGroup === 'object' ? (selectedGroup?.id?.toString() || '') : (selectedGroup || '')}
          onGroupChange={async (value) => {
            setSelectedGroup(value);
            
            // Fetch students of selected group
            if (value) {
              await fetchStudents(value);
            } else {
              // If no group selected, clear students
              await fetchStudents();
            }
          }}
          groupSelectPlaceholder="Select group"
          loading={loading}
        />
      </div>

      {/* ------------------ Penalty Statistics Section ------------------ */}
      {selectedGroup && (
        <div className={styles.penaltyStatsSection}>
          <div className={styles.statsHeader}>
            <h2>Thống kê Thẻ phạt theo Sinh viên</h2>
          </div>
          <div className={styles.statsTableContainer}>
            {loadingPenaltyStats ? (
              <div className={styles.loadingStats}>Đang tải thống kê...</div>
            ) : studentPenaltyStats.length > 0 ? (
              <DataTable
                columns={penaltyStatsColumns}
                data={studentPenaltyStats}
                loading={false}
                emptyMessage="Không có thẻ phạt nào"
              />
            ) : (
              <div className={styles.noStats}>Không có dữ liệu thống kê</div>
            )}
          </div>
        </div>
      )}

      {/* ------------------ Penalties Table ------------------ */}
      {selectedGroup && (
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2>Penalty List - {groups.find(g => g.id == selectedGroup)?.name || 'Selected Group'}</h2>
          </div>
          <div className={styles.tableContainer}>
            <DataTable
              columns={createdPenaltiesColumns}
              data={createdPenalties}
              loading={loadingCreatedPenalties}
              emptyMessage="No penalties yet"
              showIndex={false}
            />
          </div>
        </div>
      )}

      {/* ------------------ Penalty Modal ------------------ */}
      <Modal open={penaltyModal} onClose={() => setPenaltyModal(false)}>
        <div className={styles.penaltyModal}>
          <h2>Issue Penalty</h2>
          
          <div className={styles.formGroup}>
            <label>Penalty Name *</label>
            <Input
              value={newPenalty.name}
              onChange={(e) => setNewPenalty({...newPenalty, name: e.target.value})}
              placeholder="Enter penalty name"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <Textarea
              value={newPenalty.description}
              onChange={(e) => setNewPenalty({...newPenalty, description: e.target.value})}
              placeholder="Describe penalty details..."
              rows={4}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Penalty Type *</label>
            <select
              value={newPenalty.type}
              onChange={(e) => {
                setNewPenalty({...newPenalty, type: e.target.value});
              }}
              className={styles.select}
            >
              <option value="">Select penalty type</option>
              {penaltyTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Person to Penalize *</label>
            <select
              value={newPenalty.userId}
              onChange={(e) => {
                setNewPenalty({...newPenalty, userId: e.target.value});
              }}
              className={styles.select}
            >
              <option value="">
                {!selectedGroup ? "Please select group first" : 
                 students.length === 0 ? "No students in this group" : "Select student"}
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
              Cancel
            </Button>
            <Button
              onClick={submitPenalty}
            >
              Issue Penalty
            </Button>
          </div>
        </div>
      </Modal>

      {/* ------------------ Edit Penalty Modal ------------------ */}
      <Modal open={editModal} onClose={() => setEditModal(false)}>
        <div className={styles.penaltyModal}>
          <h2>Edit Penalty</h2>
          
          <div className={styles.formGroup}>
            <label>Penalty Name *</label>
            <Input
              value={editPenalty?.name || ""}
              onChange={(e) => setEditPenalty({...editPenalty, name: e.target.value})}
              placeholder="Enter penalty name"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <Textarea
              value={editPenalty?.description || ""}
              onChange={(e) => setEditPenalty({...editPenalty, description: e.target.value})}
              placeholder="Describe penalty details..."
              rows={4}
              className={styles.textarea}
            />
              </div>

          <div className={styles.formGroup}>
            <label>Penalty Type *</label>
            <select
              value={editPenalty?.type || ""}
              onChange={(e) => {
                setEditPenalty({...editPenalty, type: e.target.value});
              }}
              className={styles.select}
            >
              <option value="">Select penalty type</option>
              {penaltyTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
              </div>

          <div className={styles.formGroup}>
            <label>Person to Penalize *</label>
            <select
              value={editPenalty?.userId || ""}
              onChange={(e) => {
                setEditPenalty({...editPenalty, userId: e.target.value});
              }}
              className={styles.select}
            >
              <option value="">Select student</option>
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
              Cancel
            </Button>
            <Button
              onClick={updatePenalty}
            >
              Update
            </Button>
          </div>
        </div>
      </Modal>


      {/* ------------------ Issued Penalties List ------------------ */}
      {issuedPenalties.length > 0 && (
        <div className={styles.issuedPenaltiesSection}>
          <h2>Recently Issued Penalties</h2>
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
                    <strong>Person Penalized:</strong> {penalty.studentName}
                  </div>
                  {penalty.description && (
                    <div className={styles.penaltyCardDescription}>
                      <strong>Description:</strong> {penalty.description}
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
