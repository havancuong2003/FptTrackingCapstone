import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import Button from '../../../components/Button/Button';
import Modal from '../../../components/Modal/Modal';
import DataTable from '../../../components/DataTable/DataTable';
import { getUserInfo, getUniqueSemesters, getGroupsBySemesterAndStatus, getCurrentSemesterId } from '../../../auth/auth';
import { getCapstoneGroupDetail } from '../../../api/staff/groups';
import { updateStudentRoleInGroup, sendEmails } from '../../../api/staff';
import Select from '../../../components/Select/Select';

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
    const [semesters, setSemesters] = React.useState([]);
    const [selectedSemesterId, setSelectedSemesterId] = React.useState(null);

    React.useEffect(() => {
        // Get semesters and set default to current semester
        const uniqueSemesters = getUniqueSemesters();
        setSemesters(uniqueSemesters);
        
        const currentSemesterId = getCurrentSemesterId();
        if (currentSemesterId) {
            setSelectedSemesterId(currentSemesterId);
        } else if (uniqueSemesters.length > 0) {
            // Fallback to first semester if no current semester
            setSelectedSemesterId(uniqueSemesters[0].id);
        }
    }, []);

    React.useEffect(() => {
        if (selectedSemesterId === null) return;
        
        const fetchGroups = async () => {
            try {
                setLoading(true);
                
                // Step 1: Get groups from localStorage based on semester and expired status (only active groups for main page)
                const groupsFromStorage = getGroupsBySemesterAndStatus(selectedSemesterId, false);
                
                if (groupsFromStorage.length === 0) {
                    setGroups([]);
                    setLoading(false);
                    return;
                }
                
                // Step 2: Fetch details for each group (students, projectName, etc.)
                const detailedGroups = await Promise.all(
                    groupsFromStorage.map(async (groupInfo) => {
                        try {
                            const detailResponse = await getCapstoneGroupDetail(groupInfo.id);
                            
                            if (detailResponse.status === 200 && detailResponse.data) {
                                const groupDetail = detailResponse.data;
                                return {
                                    id: groupInfo.id,
                                    groupCode: groupDetail.groupCode || groupInfo.code || '',
                                    groupName: groupDetail.groupCode || groupInfo.code || '',
                                    projectName: groupDetail.projectName || groupInfo.name || '',
                                    projectCode: groupDetail.groupCode || groupInfo.code || '',
                                    members: (groupDetail.students || []).map(student => ({
                                        id: student.rollNumber,
                                        studentId: student.id, // Save studentId for API calls
                                        name: student.name,
                                        currentRole: student.role === "Student" ? 'Member' : (student.role || 'Member'),
                                        email: student.email || `${student.rollNumber?.toLowerCase()}@student.fpt.edu.vn`
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
                            console.error(`Error fetching details for group ${groupInfo.id}:`, error);
                            return null;
                        }
                    })
                );
                
                // Filter out null groups
                const validGroups = detailedGroups.filter(group => group !== null);
                setGroups(validGroups);
            } catch (error) {
                console.error('Error fetching groups:', error);
                setGroups([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [selectedSemesterId]);

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
            const response = await updateStudentRoleInGroup(selectedGroup.id, memberToChangeRole.studentId, selectedRole);
            
            if (response.status === 200) {
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
                alert('Please fill in all email information');
                return;
            }

        setEmailLoading(true);
        try {
            const response = await sendEmails({
                to: emailData.to,
                subject: emailData.subject,
                body: emailData.body,
                cc: emailData.cc
            });

            if (response) {
                alert('Email sent successfully!');
                setEmailModalOpen(false);
                setEmailData({
                    to: [],
                    subject: '',
                    body: '',
                    cc: []
                });
            } else {
                alert('Error sending email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert(`Error sending email: ${error.message || 'An error occurred'}`);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <h1>Groups</h1>
                    <p className={styles.subtitle}>
                        Manage and track the groups you are supervising.
                    </p>
                </div>
                {semesters.length > 0 && (
                    <div style={{ minWidth: 200 }}>
                        <Select
                            value={selectedSemesterId?.toString() || ''}
                            onChange={(e) => setSelectedSemesterId(parseInt(e.target.value))}
                            options={semesters.map(s => ({ value: s.id.toString(), label: s.name }))}
                            placeholder="Select Semester"
                        />
                    </div>
                )}
            </div>
            
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