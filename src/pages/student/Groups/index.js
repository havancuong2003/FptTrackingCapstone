import React from 'react';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import { getRoleInGroup, getUserInfo } from '../../../auth/auth';
import axiosClient from '../../../utils/axiosClient';

export default function StudentGroups() {
    const [groups, setGroups] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    
    // Status for role changes
    const [memberToChangeRole, setMemberToChangeRole] = React.useState(null);
    const [roleChangeModalOpen, setRoleChangeModalOpen] = React.useState(false);
    const [selectedRole, setSelectedRole] = React.useState('');
    
    // Get current user info
    const userInfo = getUserInfo();
    const currentUserId = userInfo?.id;
    const currentUserRoleInGroup = getRoleInGroup();
    const isSecretary = currentUserRoleInGroup === 'Secretary';

    React.useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoading(true);
                
                // Get groupId from localStorage (set during login)
                const groupId = localStorage.getItem('student_group_id');
                
                if (!groupId) {
                    console.error('No group ID found for student');
                    setGroups([]);
                    return;
                }
                
                // Call API to get current student's group
                const response = await axiosClient.get(`/Staff/capstone-groups/${groupId}`);
                
                if (response.data.status === 200) {
                    // Convert API data format to required format
                    const group = response.data.data;
                    const formattedGroup = {
                        id: group.id,
                        groupCode: group.groupCode,
                        groupName: group.groupCode,
                        projectName: group.projectName,
                        projectCode: group.groupCode,
                        members: group.students.map(student => ({
                            id: student.rollNumber,
                            studentId: student.id, // Save studentId để gọi API
                            name: student.name,
                            currentRole: student.role === "1" ? 'Member' : (student.role || 'Member'),
                            email: student.email || ''
                        })),
                        progress: {
                            completedMilestones: 0,
                            totalMilestones: 7,
                            completionPercentage: 0
                        },
                        currentMilestone: "Project Initialization",
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


    // Check role change permissions
    const canChangeRole = (member) => {
        // Only Secretary can change roles
        if (!isSecretary) {
            return false;
        }
        
        // Secretary cannot change their own role
        // Compare using studentId (actual user ID) instead of rollNumber
        if (member.studentId === currentUserId) {
            return false;
        }
        
        // Secretary can change roles of other members
        return true;
    };


    const openRoleChangeModal = (member) => {
        if (!canChangeRole(member)) {
            return; // No notification, just return
        }
        setMemberToChangeRole(member);
        setSelectedRole(member.currentRole);
        setRoleChangeModalOpen(true);
    };

    const changeRole = async () => {
        if (!memberToChangeRole || !selectedRole) return;
        
        try {
            // Find group containing member to change role
            const targetGroup = groups.find(group => 
                group.members.some(member => member.id === memberToChangeRole.id)
            );
            
            if (!targetGroup) {
                alert('Group not found for this member!');
                return;
            }
            
            // Call API to change role
            const response = await axiosClient.put(`/Staff/update-role?groupId=${targetGroup.id}&studentId=${memberToChangeRole.studentId}`, 
                `"${selectedRole}"`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            
            if (response.data.status === 200) {
                // Update local state after successful API call
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
                
                alert(`Successfully changed role to ${selectedRole} for ${memberToChangeRole.name}!`);
                setRoleChangeModalOpen(false);
            } else {
                alert(`Error: ${response.data.message}`);
            }
        } catch (error) {
            console.error('Error changing role:', error);
            alert(`Error changing role: ${error.message || 'An error occurred'}`);
        }
    };

    const renderMemberCard = (member) => {
        const roleInfo = getRoleInfo(member.currentRole);
        const canChange = canChangeRole(member);
        
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
                            Change Role
                        </Button>
                    ) : (
                        <span className={styles.noPermission}>
                            {!isSecretary ? 'Only Secretary can change roles' : 'Cannot change your own role'}
                        </span>
                    )}
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
            <h1>My Group</h1>
            <p className={styles.subtitle}>
                Manage and track your group.
            </p>
            
            <div className={styles.groupsList}>
                {groups.map((group) => {
                    return (
                        <div key={group.id} className={styles.groupCard}>
                            <div className={styles.groupHeader}>
                                <div className={styles.groupInfo}>
                                    <h3>{group.groupName}</h3>
                                    <p className={styles.projectName}>{group.projectName}</p>
                                    {group.groupCode !== group.groupName && (
                                        <p className={styles.projectCode}>Group Code: {group.groupCode}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className={styles.groupDetails}>
                                <div className={styles.detailSection}>
                                    <h4>Members ({group.members.length})</h4>
                                    <div className={styles.membersList}>
                                        {group.members.map((member) => {
                                            const canChange = canChangeRole(member);
                                            return (
                                                <div key={member.id} className={styles.memberItem}>
                                                    <div className={styles.memberInfo}>
                                                        <span className={styles.memberName}>{member.name}</span>
                                                        <span className={styles.memberEmail}>{member.email}</span>
                                                        <span className={styles.memberRoleTag}>{member.currentRole}</span>
                                                    </div>
                                                    {canChange && (
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => openRoleChangeModal(member)}
                                                        >
                                                            Change Role
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                            </div>
                            
                        </div>
                    );
                })}
            </div>
            
            {groups.length === 0 && (
                <div className={styles.emptyState}>
                    <p>You have not been assigned to any group yet.</p>
                </div>
            )}

            
            {/* ROLE CHANGE MODAL */}
            <Modal open={roleChangeModalOpen} onClose={() => setRoleChangeModalOpen(false)}>
                {memberToChangeRole && (
                    <div className={styles.roleModal}>
                        <h2>Change Role</h2>
                        <p>Select new role for <strong>{memberToChangeRole.name}</strong></p>
                        <div className={styles.roleInfo}>
                            <p><strong>Note:</strong> Secretary can only change roles between Leader and Member. Cannot create new Secretary.</p>
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
                                            <p>{role === 'Leader' ? 'Group leader with full management rights' : 'Regular members with basic rights'}</p>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={() => setRoleChangeModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={changeRole}>
                                Confirm Change
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
