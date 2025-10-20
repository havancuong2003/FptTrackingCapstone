import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import DataTable from '../../../components/DataTable/DataTable';
import axiosClient from '../../../utils/axiosClient';

export default function SupervisorGroups() {
    const navigate = useNavigate();
    const [groups, setGroups] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedGroup, setSelectedGroup] = React.useState(null);
    const [groupDetailModalOpen, setGroupDetailModalOpen] = React.useState(false);
    
    // Trạng thái cho việc thay đổi vai trò
    const [memberToChangeRole, setMemberToChangeRole] = React.useState(null);
    const [roleChangeModalOpen, setRoleChangeModalOpen] = React.useState(false);
    const [selectedRole, setSelectedRole] = React.useState('');

    React.useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoading(true);
                
                // Bước 1: Gọi API để lấy danh sách nhóm của supervisor (chỉ có id và name)
                const groupsResponse = await axiosClient.get('/Mentor/getGroups');
                
                if (groupsResponse.data.status === 200) {
                    // Lấy danh sách nhóm cơ bản (chỉ có id và name)
                    const groupList = groupsResponse.data.data;
                    
                    // Bước 2: Fetch chi tiết cho từng nhóm (students, projectName, etc.)
                    const detailedGroups = await Promise.all(
                        groupList.map(async (group) => {
                            try {
                                const detailResponse = await axiosClient.get(`/Staff/capstone-groups/${group.id}`);
                           //     console.log(`Detail for group ${group.id}:`, detailResponse);
                                
                                if (detailResponse.data.status === 200) {
                                    const groupDetail = detailResponse.data.data;
                                    return {
                                        id: group.id,
                                        groupCode: groupDetail.groupCode,
                                        groupName: groupDetail.groupCode,
                                        projectName: groupDetail.projectName,
                                        projectCode: groupDetail.groupCode,
                                        members: groupDetail.students.map(student => ({
                                            id: student.rollNumber,
                                            studentId: student.id, // Lưu studentId để gọi API
                                            name: student.name,
                                            currentRole: student.role === "1" ? 'Member' : (student.role || 'Member'),
                                            email: `${student.rollNumber.toLowerCase()}@student.fpt.edu.vn`
                                        })),
                                        progress: {
                                            completedMilestones: 0,
                                            totalMilestones: 7,
                                            completionPercentage: 0
                                        },
                                        currentMilestone: "Khởi tạo dự án",
                                        nextDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                                    };
                                }
                                return null;
                            } catch (error) {
                                console.error(`Error fetching details for group ${group.id}:`, error);
                                return null;
                            }
                        })
                    );
                    
                    // Lọc bỏ các nhóm null
                    const validGroups = detailedGroups.filter(group => group !== null);
                    setGroups(validGroups);
                } else {
                    console.error('Error fetching groups:', groupsResponse.data.message);
                    setGroups([]);
                }
            } catch (error) {
                console.error('Error fetching groups:', error);
                setGroups([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return '#059669';
        if (percentage >= 60) return '#d97706';
        if (percentage >= 40) return '#f59e0b';
        return '#dc2626';
    };
    
    const getProgressText = (percentage) => {
        if (percentage >= 80) return 'Excellent';
        if (percentage >= 60) return 'Good';
        if (percentage >= 40) return 'Average';
        return 'Needs Attention';
    };

    const getRoleInfo = (role) => {
        switch (role) {
            case 'Leader':
                return { color: '#dc2626', text: 'Leader' };
            case 'Secretary':
                return { color: '#059669', text: 'Secretary' };
            case 'Member':
                return { color: '#3b82f6', text: 'Member' };
            default:
                return { color: '#64748b', text: 'Member' };
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const columns = [
        {
            key: 'projectName',
            title: 'Tên dự án',
            render: (group) => (
                <div className={styles.projectName}>{group.projectName}</div>
            )
        },
        {
            key: 'groupCode',
            title: 'Mã nhóm',
            render: (group) => group.groupCode
        },
        {
            key: 'progress',
            title: 'Tiến độ',
            render: (group) => (
                <div className={styles.progressInfo}>
                    <div className={styles.progressBar}>
                        <div 
                            className={styles.progressFill}
                            style={{ 
                                width: `${group.progress.completionPercentage}%`,
                                backgroundColor: getProgressColor(group.progress.completionPercentage)
                            }}
                        ></div>
                    </div>
                    <div className={styles.progressText}>
                        {group.progress.completedMilestones}/{group.progress.totalMilestones} milestones
                    </div>
                </div>
            )
        },
        {
            key: 'currentMilestone',
            title: 'Milestone hiện tại',
            render: (group) => group.currentMilestone
        },
        {
            key: 'nextDeadline',
            title: 'Hạn tiếp theo',
            render: (group) => formatDate(group.nextDeadline)
        },
        {
            key: 'actions',
            title: 'Thao tác',
            render: (group) => (
                <div className={styles.actionButtons}>
                    <Button 
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            viewGroupDetails(group);
                        }}
                    >
                        Chi tiết
                    </Button>
                    <Button 
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/supervisor/tracking?groupId=${group.id}`;
                        }}
                    >
                        Theo dõi
                    </Button>
                </div>
            )
        }
    ];

    // --- LOGIC MODAL CHI TIẾT NHÓM & QUẢN LÝ VAI TRÒ ---
    
    const viewGroupDetails = (group) => {
        // Navigate to group detail page instead of modal
        navigate(`/supervisor/groups/${group.id}`);
    };

    const openRoleChangeModal = (member) => {
        setMemberToChangeRole(member);
        setSelectedRole(member.currentRole);
        setRoleChangeModalOpen(true);
    };

    const changeRole = async () => {
        if (!memberToChangeRole || !selectedGroup || !selectedRole) return;
        
        try {
            // Gọi API để thay đổi role
            const response = await axiosClient.put(`/Staff/update-role?groupId=${selectedGroup.id}&studentId=${memberToChangeRole.studentId}`, 
                `"${selectedRole}"`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.status === 200) {
                // Cập nhật trạng thái local sau khi API thành công
                const updatedGroups = groups.map(group => {
                    if (group.id === selectedGroup.id) {
                        return {
                            ...group,
                            members: group.members.map(member => {
                                if (member.id === memberToChangeRole.id) {
                                    return {
                                        ...member,
                                        currentRole: selectedRole
                                    };
                                }
                                return member;
                            })
                        };
                    }
                    return group;
                });

                setGroups(updatedGroups);
                setSelectedGroup(updatedGroups.find(g => g.id === selectedGroup.id));
                
                alert(`Đã thay đổi role thành ${selectedRole} cho ${memberToChangeRole.name}!`);
                setRoleChangeModalOpen(false);
            } else {
                alert(`Lỗi: ${response.data.message}`);
            }
        } catch (error) {
            console.error('Error changing role:', error);
            alert(`Lỗi khi thay đổi role: ${error.message || 'Có lỗi xảy ra'}`);
        }
    };

    // ---------------------------------------------------

    const renderMemberCard = (member) => {
        const roleInfo = getRoleInfo(member.currentRole);
        return (
            <div key={member.id} className={styles.memberCard_Role}>
                <div className={styles.memberInfo_Role}>
                    <div className={styles.memberName_Role}>
                        <h4>{member.name}</h4>
                        <span className={styles.studentCode}>{member.id}</span>
                        <span className={styles.memberEmail_Role}>{member.email}</span>
                    </div>
                    <div className={styles.memberRole_Role}>
                        <span 
                            className={styles.roleText_Role}
                            style={{ color: roleInfo.color }}
                        >
                            {roleInfo.text}
                        </span>
                    </div>
                </div>
                
                
                <div className={styles.memberActions_Role}>
                    <Button 
                        size="sm"
                        onClick={() => openRoleChangeModal(member)}
                    >
                        Thay đổi Role
                    </Button>
                </div>
            </div>
        );
    };


    if (loading) {
        return (
            <div className={styles.loading}>
                <div>Loading groups...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1>Nhóm</h1>
            <p className={styles.subtitle}>
                Quản lý và theo dõi các nhóm bạn đang giám sát.
            </p>
            
            <div className={styles.groupsList}>
                <DataTable
                    columns={columns}
                    data={groups}
                    loading={loading}
                    emptyMessage="Bạn chưa được phân công nhóm nào"
                    onRowClick={viewGroupDetails}
                />
            </div>
            

            {/* MODAL CHI TIẾT NHÓM & QUẢN LÝ VAI TRÒ */}
            <Modal open={groupDetailModalOpen} onClose={() => setGroupDetailModalOpen(false)}>
                {selectedGroup && (
                    <div className={styles.groupDetailModal}>
                        <h2>Chi tiết nhóm & Quản lý vai trò</h2>
                        
                        <div className={styles.groupSummary}>
                            <h3>{selectedGroup.groupName}</h3>
                            <p><strong>Dự án:</strong> {selectedGroup.projectName} | <strong>Mã nhóm:</strong> {selectedGroup.groupCode}</p>
                            <p><strong>Tiến độ:</strong> {Math.round(selectedGroup.progress.completionPercentage)}% | <strong>Hiện tại:</strong> {selectedGroup.currentMilestone}</p>
                        </div>
                        
                        <div className={styles.membersSection_Role}>
                            <h4>Thành viên nhóm ({selectedGroup.members.length})</h4>
                            <div className={styles.membersList_Role}>
                                {selectedGroup.members.map(renderMemberCard)}
                            </div>
                        </div>
                        
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={() => setGroupDetailModalOpen(false)}>
                                Đóng
                            </Button>
                            <Button onClick={() => {
                                setGroupDetailModalOpen(false);
                                window.location.href = `/supervisor/tracking?groupId=${selectedGroup.id}`;
                            }}>
                                Xem trang tiến độ
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            
            {/* MODAL THAY ĐỔI VAI TRÒ (DÙNG RIÊNG) */}
            <Modal open={roleChangeModalOpen} onClose={() => setRoleChangeModalOpen(false)}>
                {memberToChangeRole && (
                    <div className={styles.roleModal}>
                        <h2>Thay đổi vai trò</h2>
                        <p>Chọn vai trò mới cho <strong>{memberToChangeRole.name}</strong> trong nhóm <strong>{selectedGroup?.groupName}</strong></p>
                        
                        <div className={styles.roleOptions}>
                            {['Member', 'Leader', 'Secretary'].map(role => (
                                <div key={role} className={styles.roleOption}>
                                    <input
                                        type="radio"
                                        id={`role-${role}`}
                                        name="role"
                                        value={role}
                                        checked={selectedRole === role}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                    />
                                    <label htmlFor={`role-${role}`} className={styles.roleLabel}>
                                        <div>
                                            <strong>{getRoleInfo(role).text}</strong>
                                            <p>{role === 'Leader' ? 'Trưởng nhóm với quyền quản lý đầy đủ' : role === 'Secretary' ? 'Có thể tạo biên bản họp và quản lý tài liệu' : 'Thành viên thường với quyền cơ bản'}</p>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={() => setRoleChangeModalOpen(false)}>
                                Hủy
                            </Button>
                            <Button onClick={changeRole}>
                                Xác nhận thay đổi
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}