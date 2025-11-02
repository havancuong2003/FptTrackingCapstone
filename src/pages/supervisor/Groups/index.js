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
    
    // Status for role changes
    const [memberToChangeRole, setMemberToChangeRole] = React.useState(null);
    const [roleChangeModalOpen, setRoleChangeModalOpen] = React.useState(false);
    const [selectedRole, setSelectedRole] = React.useState('');
    
    // Status for email sending
    const [emailModalOpen, setEmailModalOpen] = React.useState(false);
    const [emailData, setEmailData] = React.useState({
        to: [],
        subject: '',
        body: '',
        cc: []
    });
    const [emailLoading, setEmailLoading] = React.useState(false);

    React.useEffect(() => {
        const fetchGroups = async () => {
            try {
                setLoading(true);
                
                // Step 1: Call API to get supervisor's group list (only id and name)
                const groupsResponse = await axiosClient.get('/Mentor/getGroups');
                if (groupsResponse.data.status === 200) {
                    // Get basic group list (only id and name)
                    const groupList = groupsResponse.data.data;
                    
                    // Step 2: Fetch details for each group (students, projectName, etc.)
                    const detailedGroups = await Promise.all(
                        groupList.map(async (group) => {
                            try {
                                const detailResponse = await axiosClient.get(`/Staff/capstone-groups/${group.id}`);
                                
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
                                            studentId: student.id, // Save studentId for API calls
                                            name: student.name,
                                            currentRole: student.role === "1" ? 'Member' : (student.role || 'Member'),
                                            email: `${student.rollNumber.toLowerCase()}@student.fpt.edu.vn`
                                        })),
                                        progress: {
                                            completedMilestones: 0,
                                            totalMilestones: 7,
                                            completionPercentage: 0
                                        },
                                        currentMilestone: "Project Initialization",
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
                    
                    // Filter out null groups
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
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const columns = [
        {
            key: 'projectName',
            title: 'Project Name',
            render: (group) => (
                <div className={styles.projectName}>{group.projectName}</div>
            )
        },
        {
            key: 'groupCode',
            title: 'Group Code',
            render: (group) => group.groupCode
        },
        {
            key: 'progress',
            title: 'Progress',
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
            title: 'Current Milestone',
            render: (group) => group.currentMilestone
        },
        {
            key: 'nextDeadline',
            title: 'Next Deadline',
            render: (group) => formatDate(group.nextDeadline)
        },
        {
            key: 'actions',
            title: 'Actions',
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
                        Details
                    </Button>
                    <Button 
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/supervisor/tracking?groupId=${group.id}`;
                        }}
                    >
                        Track
                    </Button>
                </div>
            )
        }
    ];

    // --- GROUP DETAIL MODAL & ROLE MANAGEMENT LOGIC ---
    
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
            // Call API to change role
            const response = await axiosClient.put(`/Staff/update-role?groupId=${selectedGroup.id}&studentId=${memberToChangeRole.studentId}`, 
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

    // Email functions
    const openEmailModal = () => {
        if (!selectedGroup) return;
        
        // Pre-populate with group member emails
        const memberEmails = selectedGroup.members.map(member => member.email);
        setEmailData({
            to: memberEmails,
            subject: `Message from Supervisor - Group ${selectedGroup.groupName}`,
            body: '',
            cc: []
        });
        setEmailModalOpen(true);
    };

    const updateEmailData = (field, value) => {
        setEmailData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const sendEmail = async () => {
        if (!emailData.to.length || !emailData.subject || !emailData.body) {
            alert('Vui lòng điền đầy đủ thông tin email');
            return;
        }

        setEmailLoading(true);
        try {
            const response = await axiosClient.post('/Mail/send-mails', {
                to: emailData.to,
                subject: emailData.subject,
                body: emailData.body,
                cc: emailData.cc
            });

            if (response.data) {
                alert('Email đã được gửi thành công!');
                setEmailModalOpen(false);
                setEmailData({
                    to: [],
                    subject: '',
                    body: '',
                    cc: []
                });
            } else {
                alert('Có lỗi xảy ra khi gửi email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert(`Lỗi gửi email: ${error.message || 'Có lỗi xảy ra'}`);
        } finally {
            setEmailLoading(false);
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
            <h1>Group</h1>
            <p className={styles.subtitle}>
                Manage and track the groups you are supervising.
            </p>
            
            <div className={styles.groupsList}>
                <DataTable
                    columns={columns}
                    data={groups}
                    loading={loading}
                    emptyMessage="You have not been assigned to any groups yet"
                    onRowClick={viewGroupDetails}
                />
            </div>
            

            {/* GROUP DETAIL & ROLE MANAGEMENT MODAL */}
            <Modal open={groupDetailModalOpen} onClose={() => setGroupDetailModalOpen(false)}>
                {selectedGroup && (
                    <div className={styles.groupDetailModal}>
                        <h2>Group Details & Role Management</h2>
                        
                        <div className={styles.groupSummary}>
                            <h3>{selectedGroup.groupName}</h3>
                            <p><strong>Project:</strong> {selectedGroup.projectName} | <strong>Group Code:</strong> {selectedGroup.groupCode}</p>
                            <p><strong>Progress:</strong> {Math.round(selectedGroup.progress.completionPercentage)}% | <strong>Current:</strong> {selectedGroup.currentMilestone}</p>
                        </div>
                        
                        <div className={styles.membersSection_Role}>
                            <h4>Group Members ({selectedGroup.members.length})</h4>
                            <div className={styles.membersList_Role}>
                                {selectedGroup.members.map(renderMemberCard)}
                            </div>
                        </div>
                        
                        <div className={styles.modalActions}>
                            <Button variant="secondary" onClick={() => setGroupDetailModalOpen(false)}>
                                Close
                            </Button>
                            <Button variant="outline" onClick={openEmailModal}>
                                Send Email
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
            
            {/* ROLE CHANGE MODAL (STANDALONE) */}
            <Modal open={roleChangeModalOpen} onClose={() => setRoleChangeModalOpen(false)}>
                {memberToChangeRole && (
                    <div className={styles.roleModal}>
                        <h2>Change Role</h2>
                        <p>Select new role for <strong>{memberToChangeRole.name}</strong> in group <strong>{selectedGroup?.groupName}</strong></p>
                        
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
                                            <p>{role === 'Leader' ? 'Group leader with full management rights' : role === 'Secretary' ? 'Can create meeting minutes and manage documents' : 'Regular members with basic rights'}</p>
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