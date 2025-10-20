import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import { getRoleInGroup, getUserInfo } from '../../../auth/auth';
import axiosClient from '../../../utils/axiosClient';

export default function StudentGroups() {
    const [groups, setGroups] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    
    // Trạng thái cho việc thay đổi vai trò
    const [memberToChangeRole, setMemberToChangeRole] = React.useState(null);
    const [roleChangeModalOpen, setRoleChangeModalOpen] = React.useState(false);
    const [selectedRole, setSelectedRole] = React.useState('');
    
    // Lấy thông tin user hiện tại
    const userInfo = getUserInfo();
    const currentUserId = userInfo?.id;
    const currentUserRoleInGroup = getRoleInGroup();
    const isSecretary = currentUserRoleInGroup === 'Secretary';

    React.useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoading(true);
                
                // Giả sử student có groupId = 1 (có thể lấy từ context hoặc API khác)
                const groupId = 1; // TODO: Lấy từ user context hoặc API
                
                // Gọi API để lấy nhóm của student hiện tại
                const response = await axiosClient.get(`/Staff/capstone-groups/${groupId}`);
                
                if (response.data.status === 200) {
                    // Chuyển đổi format data từ API sang format cần thiết
                    const group = response.data.data;
                    const formattedGroup = {
                        id: group.id,
                        groupCode: group.groupCode,
                        groupName: group.groupCode,
                        projectName: group.projectName,
                        projectCode: group.groupCode,
                        members: group.students.map(student => ({
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
                    
                    setGroups([formattedGroup]);
                } else {
                    console.error('Error fetching groups:', response.data.message);
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

    // Kiểm tra quyền thay đổi role
    const canChangeRole = (memberId) => {
        // Chỉ Secretary mới có quyền thay đổi role
        if (!isSecretary) {
            return false;
        }
        
        // Secretary không thể thay đổi role của chính mình
        if (memberId === currentUserId) {
            return false;
        }
        
        // Secretary có thể thay đổi role của các thành viên khác
        return true;
    };


    const openRoleChangeModal = (member) => {
        if (!canChangeRole(member.id)) {
            return; // Không hiện thông báo, chỉ return
        }
        setMemberToChangeRole(member);
        setSelectedRole(member.currentRole);
        setRoleChangeModalOpen(true);
    };

    const changeRole = async () => {
        if (!memberToChangeRole || !selectedRole) return;
        
        try {
            // Tìm group chứa member cần thay đổi role
            const targetGroup = groups.find(group => 
                group.members.some(member => member.id === memberToChangeRole.id)
            );
            
            if (!targetGroup) {
                alert('Không tìm thấy nhóm của thành viên này!');
                return;
            }
            
            // Gọi API để thay đổi role
            const response = await axiosClient.put(`/Staff/update-role?groupId=${targetGroup.id}&studentId=${memberToChangeRole.studentId}`, 
                `"${selectedRole}"`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
          //  console.log('response ',response);
            
            
            if (response.data.status === 200) {
                // Cập nhật trạng thái local sau khi API thành công
                const updatedGroups = groups.map(group => {
                    if (group.id === targetGroup.id) {
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

    const renderMemberCard = (member) => {
        const roleInfo = getRoleInfo(member.currentRole);
        const canChange = canChangeRole(member.id);
        
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
                
                {/* Role history removed per requirement */}
                
                <div className={styles.memberActions_Role}>
                    {canChange ? (
                        <Button 
                            size="sm"
                            onClick={() => openRoleChangeModal(member)}
                        >
                            Thay đổi Role
                        </Button>
                    ) : (
                        <span className={styles.noPermission}>
                            {!isSecretary ? 'Chỉ Secretary mới có quyền thay đổi role' : 'Không thể thay đổi role của chính mình'}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div>Đang tải danh sách nhóm...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1>Nhóm của tôi</h1>
            <p className={styles.subtitle}>
                Quản lý và theo dõi nhóm của bạn.
            </p>
            
            <div className={styles.groupsList}>
                {groups.map((group) => {
                    const progressColor = getProgressColor(group.progress.completionPercentage);
                    const progressText = getProgressText(group.progress.completionPercentage);
                    
                    return (
                        <div key={group.id} className={styles.groupCard}>
                            <div className={styles.groupHeader}>
                                <div className={styles.groupInfo}>
                                    <h3>{group.groupName}</h3>
                                    <p className={styles.projectName}>{group.projectName}</p>
                                    <p className={styles.projectCode}>Mã nhóm: {group.groupCode}</p>
                                </div>
                            </div>
                            
                            <div className={styles.groupDetails}>
                                <div className={styles.detailSection}>
                                    <h4>Thành viên ({group.members.length})</h4>
                                    <div className={styles.membersList}>
                                        {group.members.map((member) => {
                                            const canChange = canChangeRole(member.id);
                                            return (
                                                <div key={member.id} className={styles.memberItem}>
                                                    <div className={styles.memberInfo}>
                                                        <span className={styles.memberName}>{member.name}</span>
                                                        <span className={styles.memberRoleTag}>{member.currentRole}</span>
                                                    </div>
                                                    {canChange && (
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => openRoleChangeModal(member)}
                                                        >
                                                            Thay đổi Role
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                <div className={styles.detailSection}>
                                    <h4>Tiến độ</h4>
                                    <div className={styles.progressInfo}>
                                        <div className={styles.progressItem}>
                                            <span>Hoàn thành:</span>
                                            <span>{group.progress.completedMilestones}/{group.progress.totalMilestones} milestones</span>
                                        </div>
                                        <div className={styles.progressItem}>
                                            <span>Hiện tại:</span>
                                            <span className={styles.currentMilestone}>{group.currentMilestone}</span>
                                        </div>
                                        <div className={styles.progressItem}>
                                            <span>Hạn tiếp theo:</span>
                                            <span>{formatDate(group.nextDeadline)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.groupActions}>
                                <Button>
                                    Theo dõi tiến độ
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {groups.length === 0 && (
                <div className={styles.emptyState}>
                    <p>Bạn chưa được phân vào nhóm nào.</p>
                </div>
            )}

            
            {/* MODAL THAY ĐỔI VAI TRÒ */}
            <Modal open={roleChangeModalOpen} onClose={() => setRoleChangeModalOpen(false)}>
                {memberToChangeRole && (
                    <div className={styles.roleModal}>
                        <h2>Thay đổi vai trò</h2>
                        <p>Chọn vai trò mới cho <strong>{memberToChangeRole.name}</strong></p>
                        <div className={styles.roleInfo}>
                            <p><strong>Lưu ý:</strong> Secretary chỉ có thể thay đổi role giữa Leader và Member. Không thể tạo ra Secretary mới.</p>
                        </div>
                        
                        <div className={styles.roleOptions}>
                            {['Member', 'Leader'].map(role => (
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
                                            <p>{role === 'Leader' ? 'Trưởng nhóm với quyền quản lý đầy đủ' : 'Thành viên thường với quyền cơ bản'}</p>
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
