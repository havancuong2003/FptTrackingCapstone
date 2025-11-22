import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './GroupDetail.module.scss';
import Button from '../../../components/Button/Button';
import BackButton from '../../common/BackButton';
import axiosClient from '../../../utils/axiosClient';
import { getRoleInGroup, getUserInfo } from '../../../auth/auth';
import { sendSecretaryAssignmentEmail, sendRoleAssignmentEmail } from '../../../email/groups';

export default function GroupDetail() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isExpired = location.state?.isExpired || false;
    const [group, setGroup] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [emailData, setEmailData] = React.useState({
        to: [],
        subject: '',
        body: '',
        cc: []
    });
    const [showEmailComposer, setShowEmailComposer] = React.useState(false);
    const [emailLoading, setEmailLoading] = React.useState(false);
    const [showRoleModal, setShowRoleModal] = React.useState(false);
    const [selectedMember, setSelectedMember] = React.useState(null);
    const [newRole, setNewRole] = React.useState('');

    React.useEffect(() => {
        fetchGroupDetails();
    }, [groupId]);

    const fetchGroupDetails = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get(`/Staff/capstone-groups/${groupId}`);
            
            if (response.data.status === 200) {
                const groupData = response.data.data;
                const formattedGroup = {
                    id: groupData.id,
                    groupCode: groupData.groupCode,
                    groupName: groupData.groupCode,
                    projectName: groupData.projectName,
                    members: groupData.students.map(student => ({
                        id: student.rollNumber,
                        studentId: student.id,
                        name: student.name,
                        currentRole: student.role === "Student" ? 'Member' : (student.role || 'Member'),
                        email: student.email || ''
                    })),
                    supervisors: groupData.supervisors || [],
                    supervisorsInfor: groupData.supervisorsInfor || [],
                    progress: {
                        completedMilestones: 0,
                        totalMilestones: 7,
                        completionPercentage: 0
                    },
                    currentMilestone: "Khởi tạo dự án",
                    nextDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                };
                setGroup(formattedGroup);
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emailSubject.trim() || !emailContent.trim()) {
            alert('Please enter email subject and content');
            return;
        }

        try {
            // Gọi API gửi email
            const emailData = {
                groupId: parseInt(groupId),
                subject: emailSubject,
                content: emailContent,
                recipients: group.members.map(member => ({
                    name: member.name,
                    email: member.email
                }))
            };

            const response = await axiosClient.post('/Staff/send-group-email', emailData);
            
            if (response.data.status === 200) {
                alert('Email sent successfully!');
                setEmailContent('');
                setEmailSubject('');
                setShowEmailComposer(false);
            } else {
                alert('Error sending email: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Error sending email: ' + error.message);
        }
    };

    const handleChangeRole = (member) => {
        setSelectedMember(member);
        setNewRole(member.currentRole);
        setShowRoleModal(true);
    };

    const handleSaveRoleChange = async () => {
        if (!selectedMember || !newRole) return;

        try {
            // Gọi API để thay đổi role (giống hệt như trong các file khác)
            const response = await axiosClient.put(`/Staff/update-role?groupId=${parseInt(groupId)}&studentId=${selectedMember.studentId}`, 
                `"${newRole}"`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.status === 200) {
                // Update local state after successful API call
                setGroup(prevGroup => ({
                    ...prevGroup,
                    members: prevGroup.members.map(member => 
                        member.id === selectedMember.id 
                            ? { ...member, currentRole: newRole }
                            : member
                    )
                }));
                
                // Get current user info to determine if they are Supervisor or Secretary
                const currentUser = getUserInfo();
                const userRoleInGroup = getRoleInGroup();
                const isSecretary = userRoleInGroup === 'Secretary' || userRoleInGroup === 'SECRETARY';
                const isSupervisor = currentUser?.role === 'SUPERVISOR' || currentUser?.role === 'MENTOR';
                
                // Send email notification based on who is assigning the role
                try {

                    const systemUrl = `${window.location.origin}`;
                    const groupDetailUrl = `${window.location.origin}/supervisor/groups/${groupId}`;
                    
                    if (isSupervisor && newRole === 'Secretary') {
                        // Supervisor assigning Secretary role
                        await sendSecretaryAssignmentEmail({
                            memberEmail: selectedMember.email,
                            memberName: selectedMember.name,
                            groupName: group.groupName,
                            projectName: group.projectName,
                            supervisorName: currentUser?.name || 'Giảng viên hướng dẫn',
                            detailUrl: groupDetailUrl,
                            systemUrl: systemUrl,
                            cc: group.supervisorsInfor?.map(s => s.email).filter(Boolean) || []
                        });
                    } else if (isSecretary && newRole !== 'Secretary') {
                        // Secretary assigning role to other members
                        await sendRoleAssignmentEmail({
                            memberEmail: selectedMember.email,
                            memberName: selectedMember.name,
                            newRole: newRole,
                            groupName: group.groupName,
                            projectName: group.projectName,
                            secretaryName: currentUser?.name || 'Thư ký nhóm',
                            detailUrl: groupDetailUrl,
                            systemUrl: systemUrl,
                            cc: group.supervisorsInfor?.map(s => s.email).filter(Boolean) || []
                        });
                    }
                } catch (emailError) {
                    console.error('Error sending role assignment email:', emailError);
                    // Don't block the role change if email fails, just log it
                    console.warn('Role changed successfully but email notification failed');
                }
                
                alert(`Role changed to ${newRole} for ${selectedMember.name}!${isSupervisor && newRole === 'Secretary' ? ' Notification email has been sent.' : isSecretary ? ' Notification email has been sent.' : ''}`);
                setShowRoleModal(false);
                setSelectedMember(null);
                setNewRole('');
            } else {
                alert(`${response.data.message}`);
            }
        } catch (error) {
            console.error('Error changing role:', error);
            alert('Error changing role. Please try again.');
        }
    };

    // Email functions
    const openEmailComposer = () => {
        if (!group) return;
        
        // Pre-populate with group member emails
        const memberEmails = group.members.map(member => member.email);
        
        // Get supervisor emails for CC
        const supervisorEmails = [];
        if (group.supervisorsInfor && group.supervisorsInfor.length > 0) {
            group.supervisorsInfor.forEach(supervisor => {
                if (supervisor.email) {
                    supervisorEmails.push(supervisor.email);
                }
            });
        }
        
        setEmailData({
            to: memberEmails,
            subject: `Message from Supervisor - Group ${group.groupName}`,
            body: '',
            cc: supervisorEmails
        });
        setShowEmailComposer(true);
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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const allEmails = [...emailData.to, ...emailData.cc];
        const invalidEmails = allEmails.filter(email => email && !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            alert(`Invalid email: ${invalidEmails.join(', ')}`);
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
            
            if (response.status === 200 || response.data) {
                alert('Email sent successfully!');
                setShowEmailComposer(false);
                setEmailData({
                    to: [],
                    subject: '',
                    body: '',
                    cc: []
                });
            } else {
                alert('An error occurred while sending email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            console.error('Error response:', error.response?.data);
            alert(`Error sending email: ${error.response?.data?.message || error.message || 'An error occurred'}`);
        } finally {
            setEmailLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div>Loading group information...</div>
            </div>
        );
    }

    if (!group) {
        const backPath = isExpired ? '/supervisor/groups/expired' : '/supervisor/groups/active';
        return (
            <div className={styles.error}>
                <div>Group information not found</div>
                <Button onClick={() => navigate(backPath)}>
                    Back to list
                </Button>
            </div>
        );
    }
    
    const backPath = isExpired ? '/supervisor/groups/expired' : '/supervisor/groups/active';
    return (
        <div className={styles.container}>
            <BackButton to={backPath}>← Back</BackButton>
            {isExpired && (
                <div className={styles.expiredNotice} style={{ 
                    padding: '12px', 
                    backgroundColor: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    borderRadius: '6px', 
                    marginBottom: '20px',
                    color: '#92400e',
                    fontWeight: 500
                }}>
                    This group has expired. You can only view information (view-only mode).
                </div>
            )}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Group Details: {group.groupName}</h1>
                </div>
                {!isExpired && (
                    <div className={styles.headerRight}>
                        <Button 
                            onClick={openEmailComposer}
                        >
                            Send email to group
                        </Button>
                    </div>
                )}
            </div>

            <div className={styles.groupInfo}>
                <div className={styles.infoCard}>
                    <h3>Group Information</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <label>Group Code:</label>
                            <span>{group.groupCode}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Project Name:</label>
                            <span>{group.projectName}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Number of Members:</label>
                            <span>{group.members.length}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.membersCard}>
                    <div className={styles.membersHeader}>
                        <h3>Group Members</h3>
                    </div>
                    <div className={styles.membersList}>
                        {group.members.map((member) => (
                            <div key={member.id} className={styles.memberCard}>
                                <div className={styles.memberInfo}>
                                    <div className={styles.memberName}>{member.name}</div>
                                    <div className={styles.memberEmail}>{member.email}</div>
                                </div>
                                <div className={styles.memberActions}>
                                    <span className={`${styles.roleTag} ${styles[member.currentRole.toLowerCase()]}`}>
                                        {member.currentRole}
                                    </span>
                                    {!isExpired && (
                                        <button 
                                            className={styles.changeRoleBtn}
                                            onClick={() => handleChangeRole(member)}
                                        >
                                            Change Role
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Email Composer Modal */}
            {showEmailComposer && (
                <div className={styles.modalOverlay}>
                    <div className={styles.emailModal}>
                        <div className={styles.modalHeader}>
                            <h2>Send email to group</h2>
                            <button 
                                className={styles.closeButton}
                                onClick={() => setShowEmailComposer(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label>Recipients (To)</label>
                                <div className={styles.recipientsList}>
                                    {group.members.map(member => (
                                        <div key={member.id} className={styles.recipient}>
                                            {member.name} ({member.email})
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>CC (Supervisors)</label>
                                <div className={styles.recipientsList}>
                                    {group.supervisorsInfor && group.supervisorsInfor.length > 0 ? (
                                        group.supervisorsInfor.map((supervisor, index) => (
                                            <div key={index} className={styles.recipient}>
                                                {supervisor.name || supervisor.fullName} ({supervisor.email})
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.noRecipients}>No supervisor information</div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Subject</label>
                                <input
                                    type="text"
                                    value={emailData.subject}
                                    onChange={(e) => updateEmailData('subject', e.target.value)}
                                    className={styles.input}
                                    placeholder="Email subject"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Message</label>
                                <textarea
                                    value={emailData.body}
                                    onChange={(e) => updateEmailData('body', e.target.value)}
                                    className={styles.textarea}
                                    placeholder="Type your message here..."
                                    rows={6}
                                />
                            </div>
                        </div>
                        
                        <div className={styles.modalActions}>
                            <Button 
                                variant="secondary"
                                onClick={() => setShowEmailComposer(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={sendEmail} disabled={emailLoading}>
                                {emailLoading ? 'Sending...' : 'Send email'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Change Modal */}
            {showRoleModal && selectedMember && (
                <div className={styles.modalOverlay}>
                    <div className={styles.roleModal}>
                        <div className={styles.modalHeader}>
                            <h2>Change Role for {selectedMember.name}</h2>
                            <button 
                                className={styles.closeButton}
                                onClick={() => setShowRoleModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label>Current Role:</label>
                                <span className={styles.currentRole}>{selectedMember.currentRole}</span>
                            </div>
                            <div className={styles.formGroup}>
                                <label>New Role:</label>
                                <select 
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className={styles.roleSelect}
                                >
                                    <option value="Leader">Leader</option>
                                    <option value="Member">Member</option>
                                    <option value="Secretary">Secretary</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <Button 
                                variant="secondary"
                                onClick={() => setShowRoleModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSaveRoleChange}>
                                Save changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
