import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal'; // Giả định component Modal đã có

export default function SupervisorGroups() {
    const [groups, setGroups] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedGroup, setSelectedGroup] = React.useState(null);
    const [groupDetailModalOpen, setGroupDetailModalOpen] = React.useState(false);
    
    // Trạng thái cho việc thay đổi vai trò
    const [memberToChangeRole, setMemberToChangeRole] = React.useState(null);
    const [roleChangeModalOpen, setRoleChangeModalOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoading(true);
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const mockData = {
                    "status": 200,
                    "message": "Fetched successfully",
                    "data": [
                        {
                            "id": "GR01",
                            "groupName": "Team Alpha",
                            "projectCode": "SEP490",
                            "projectName": "Student Management System",
                            "members": [
                                {
                                    "id": "SE00001",
                                    "name": "Nguyen Van A",
                                    "currentRole": "Leader",
                                    "email": "nguyenvana@student.fpt.edu.vn",
                                    "roleHistory": [
                                        {"role": "Member", "assignedDate": "2025-10-01T00:00:00Z"},
                                        {"role": "Leader", "assignedDate": "2025-10-10T00:00:00Z"}
                                    ]
                                },
                                {
                                    "id": "SE00002",
                                    "name": "Nguyen Van B",
                                    "currentRole": "Member",
                                    "email": "nguyenvanb@student.fpt.edu.vn",
                                    "roleHistory": [{"role": "Member", "assignedDate": "2025-10-01T00:00:00Z"}]
                                },
                                {
                                    "id": "SE00003",
                                    "name": "Nguyen Van C",
                                    "currentRole": "Secretary",
                                    "email": "nguyenvanc@student.fpt.edu.vn",
                                    "roleHistory": [
                                        {"role": "Member", "assignedDate": "2025-10-01T00:00:00Z"},
                                        {"role": "Secretary", "assignedDate": "2025-10-15T00:00:00Z"}
                                    ]
                                }
                            ],
                            "progress": {
                                "completedMilestones": 1,
                                "totalMilestones": 7,
                                "completionPercentage": 14.3
                            },
                            "currentMilestone": "System Design Document",
                            "nextDeadline": "2025-11-03T23:59:00Z"
                        },
                        {
                            "id": "GR02",
                            "groupName": "Team Beta",
                            "projectCode": "SEP490",
                            "projectName": "Library Management System",
                            "members": [
                                {
                                    "id": "SE00004",
                                    "name": "Tran Thi D",
                                    "currentRole": "Leader",
                                    "email": "tranthid@student.fpt.edu.vn",
                                    "roleHistory": [{"role": "Leader", "assignedDate": "2025-10-01T00:00:00Z"}]
                                },
                                {
                                    "id": "SE00005",
                                    "name": "Le Van E",
                                    "currentRole": "Member",
                                    "email": "levane@student.fpt.edu.vn",
                                    "roleHistory": [{"role": "Member", "assignedDate": "2025-10-01T00:00:00Z"}]
                                }
                            ],
                            "progress": {
                                "completedMilestones": 2,
                                "totalMilestones": 7,
                                "completionPercentage": 28.6
                            },
                            "currentMilestone": "Prototype Development",
                            "nextDeadline": "2025-11-10T23:59:00Z"
                        }
                    ]
                };
                
                setGroups(mockData.data);
            } catch (error) {
                console.error('Error fetching groups:', error);
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
                return { color: '#dc2626', text: 'Leader', icon: '👑' };
            case 'Secretary':
                return { color: '#059669', text: 'Secretary', icon: '📝' };
            case 'Member':
                return { color: '#3b82f6', text: 'Member', icon: '👤' };
            default:
                return { color: '#64748b', text: 'Unknown', icon: '❓' };
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // --- LOGIC MODAL CHI TIẾT NHÓM & QUẢN LÝ VAI TRÒ ---
    
    const viewGroupDetails = (group) => {
        setSelectedGroup(group);
        setGroupDetailModalOpen(true);
    };

    const openRoleChangeModal = (member) => {
        setMemberToChangeRole(member);
        setRoleChangeModalOpen(true);
    };

    const changeRole = (newRole) => {
        if (!memberToChangeRole || !selectedGroup) return;
        
        // 1. Cập nhật trạng thái nhóm (Tạo nhóm mới)
        const updatedGroups = groups.map(group => {
            if (group.id === selectedGroup.id) {
                return {
                    ...group,
                    members: group.members.map(member => {
                        if (member.id === memberToChangeRole.id) {
                            return {
                                ...member,
                                currentRole: newRole,
                                roleHistory: [
                                    ...(member.roleHistory || []), // Đảm bảo roleHistory tồn tại
                                    {
                                        role: newRole,
                                        assignedDate: new Date().toISOString(),
                                        assignedBy: 'SUPERVISOR001'
                                    }
                                ]
                            };
                        }
                        return member;
                    })
                };
            }
            return group;
        });

        // 2. Cập nhật trạng thái
        setGroups(updatedGroups);
        
        // 3. Cập nhật nhóm đang mở trong Modal để Modal hiển thị thay đổi
        setSelectedGroup(updatedGroups.find(g => g.id === selectedGroup.id));

        alert(`Role changed to ${newRole} for ${memberToChangeRole.name}!`);
        setRoleChangeModalOpen(false);
    };

    // ---------------------------------------------------

    const renderMemberCard = (member) => {
        const roleInfo = getRoleInfo(member.currentRole);
        return (
            <div key={member.id} className={styles.memberCard_Role}>
                <div className={styles.memberInfo_Role}>
                    <div className={styles.memberName_Role}>
                        <h4>{member.name} ({member.id})</h4>
                        <span className={styles.memberEmail_Role}>{member.email}</span>
                    </div>
                    <div className={styles.memberRole_Role}>
                        <span 
                            className={styles.roleIcon_Role}
                            style={{ color: roleInfo.color }}
                        >
                            {roleInfo.icon}
                        </span>
                        <span 
                            className={styles.roleText_Role}
                            style={{ color: roleInfo.color }}
                        >
                            {roleInfo.text}
                        </span>
                    </div>
                </div>
                
                <div className={styles.roleHistory_Role}>
                    <h5>Role History</h5>
                    <div className={styles.historyList_Role}>
                        {(member.roleHistory || []).slice(-3).map((history, index) => ( // Chỉ hiển thị 3 gần nhất
                            <div key={index} className={styles.historyItem_Role}>
                                <span className={styles.historyRole_Role}>{history.role}</span>
                                <span className={styles.historyDate_Role}>
                                    {formatDate(history.assignedDate)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className={styles.memberActions_Role}>
                    <Button 
                        size="sm"
                        onClick={() => openRoleChangeModal(member)}
                    >
                        Change Role
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
            <h1>Groups</h1>
            <p className={styles.subtitle}>
                Manage and monitor the groups you are supervising.
            </p>
            
            <div className={styles.groupsList}>
                {groups.map((group) => {
                    const progressColor = getProgressColor(group.progress.completionPercentage);
                    const progressText = getProgressText(group.progress.completionPercentage);
                    
                    return (
                        <div key={group.id} className={styles.groupCard}>
                            {/* ... Phần hiển thị thông tin nhóm (giữ nguyên) ... */}
                            <div className={styles.groupHeader}>
                                <div className={styles.groupInfo}>
                                    <h3>{group.groupName} ({group.id})</h3>
                                    <p className={styles.projectName}>{group.projectName}</p>
                                    <p className={styles.projectCode}>Project Code: {group.projectCode}</p>
                                </div>

                            </div>
                            
                            <div className={styles.groupDetails}>
                                <div className={styles.detailSection}>
                                    <h4>Members ({group.members.length})</h4>
                                    <div className={styles.membersList}>
                                        {group.members.map((member) => (
                                            <div key={member.id} className={styles.memberItem}>
                                                <span className={styles.memberName}>{member.name}</span>
                                                <span className={styles.memberRoleTag}>{member.currentRole}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className={styles.detailSection}>
                                    <h4>Progress</h4>
                                    <div className={styles.progressInfo}>
                                        <div className={styles.progressItem}>
                                            <span>Completed:</span>
                                            <span>{group.progress.completedMilestones}/{group.progress.totalMilestones} milestones</span>
                                        </div>
                                        <div className={styles.progressItem}>
                                            <span>Current:</span>
                                            <span className={styles.currentMilestone}>{group.currentMilestone}</span>
                                        </div>
                                        <div className={styles.progressItem}>
                                            <span>Next Deadline:</span>
                                            <span>{formatDate(group.nextDeadline)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.groupActions}>
                                <Button 
                                    variant="secondary"
                                    onClick={() => viewGroupDetails(group)}
                                >
                                    View Details
                                </Button>
                                <Button>
                                    Track Progress
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {groups.length === 0 && (
                <div className={styles.emptyState}>
                    <p>No groups assigned to you yet.</p>
                </div>
            )}

            {/* MODAL CHI TIẾT NHÓM & QUẢN LÝ VAI TRÒ */}
            <Modal open={groupDetailModalOpen} onClose={() => setGroupDetailModalOpen(false)}>
                {selectedGroup && (
                    <div className={styles.groupDetailModal}>
                        <h2>Group Details & Role Management</h2>
                        
                        <div className={styles.groupSummary}>
                            <h3>{selectedGroup.groupName} ({selectedGroup.id})</h3>
                            <p><strong>Project:</strong> {selectedGroup.projectName} | <strong>Code:</strong> {selectedGroup.projectCode}</p>
                            <p><strong>Progress:</strong> {Math.round(selectedGroup.progress.completionPercentage)}% | <strong>Current:</strong> {selectedGroup.currentMilestone}</p>
                        </div>
                        
                        <div className={styles.membersSection_Role}>
                            <h4>Team Members ({selectedGroup.members.length})</h4>
                            <div className={styles.membersList_Role}>
                                {selectedGroup.members.map(renderMemberCard)}
                            </div>
                        </div>
                        
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={() => setGroupDetailModalOpen(false)}>
                                Close
                            </Button>
                            <Button onClick={() => {
                                setGroupDetailModalOpen(false);
                                window.location.href = `/supervisor/tracking?groupId=${selectedGroup.id}`;
                            }}>
                                View Progress Page
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            
            {/* MODAL THAY ĐỔI VAI TRÒ (DÙNG RIÊNG) */}
            <Modal open={roleChangeModalOpen} onClose={() => setRoleChangeModalOpen(false)}>
                {memberToChangeRole && (
                    <div className={styles.roleModal}>
                        <h2>Change Role</h2>
                        <p>Select a new role for <strong>{memberToChangeRole.name}</strong> in **{selectedGroup.groupName}**</p>
                        
                        <div className={styles.roleOptions}>
                            {['Member', 'Leader', 'Secretary'].map(role => (
                                <div key={role} className={styles.roleOption}>
                                    <input
                                        type="radio"
                                        id={`role-${role}`}
                                        name="role"
                                        value={role}
                                        defaultChecked={memberToChangeRole.currentRole === role}
                                    />
                                    <label htmlFor={`role-${role}`} className={styles.roleLabel}>
                                        <span className={styles.roleIcon_Role}>{getRoleInfo(role).icon}</span>
                                        <div>
                                            <strong>{getRoleInfo(role).text}</strong>
                                            <p>{role === 'Leader' ? 'Team leader with full management permissions' : role === 'Secretary' ? 'Can create meeting minutes and manage documentation' : 'Regular team member with basic permissions'}</p>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={() => setRoleChangeModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => {
                                const selectedRole = document.querySelector('input[name="role"]:checked')?.value;
                                if (selectedRole) changeRole(selectedRole);
                            }}>
                                Confirm Change
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}