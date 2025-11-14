import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './GroupDetail.module.scss';
import Button from '../../../components/Button/Button';
import BackButton from '../../common/BackButton';
import axiosClient from '../../../utils/axiosClient';
import { getRoleInGroup, getUserInfo } from '../../../auth/auth';
import { sendSecretaryAssignmentEmail, sendRoleAssignmentEmail } from '../../../email/groups';

export default function GroupDetail() {
    const { groupId } = useParams();
    const navigate = useNavigate();
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
                console.log(" group data:  ", groupData);
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
            alert('Vui lòng nhập tiêu đề và nội dung email');
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
                alert('Email đã được gửi thành công!');
                setEmailContent('');
                setEmailSubject('');
                setShowEmailComposer(false);
            } else {
                alert('Lỗi gửi email: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Lỗi gửi email: ' + error.message);
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
                    console.log(" isSupervisor: ", isSupervisor);
                    console.log(" newRole: ", newRole);
                    console.log(" isSecretary: ", isSecretary);
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
                
                alert(`Đã thay đổi role thành ${newRole} cho ${selectedMember.name}!${isSupervisor && newRole === 'Secretary' ? ' Email thông báo đã được gửi.' : isSecretary ? ' Email thông báo đã được gửi.' : ''}`);
                setShowRoleModal(false);
                setSelectedMember(null);
                setNewRole('');
            } else {
                alert(`${response.data.message}`);
            }
        } catch (error) {
            console.error('Error changing role:', error);
            alert('Có lỗi khi thay đổi role. Vui lòng thử lại.');
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
            alert('Vui lòng điền đầy đủ thông tin email');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const allEmails = [...emailData.to, ...emailData.cc];
        const invalidEmails = allEmails.filter(email => email && !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            alert(`Email không hợp lệ: ${invalidEmails.join(', ')}`);
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
                alert('Email đã được gửi thành công!');
                setShowEmailComposer(false);
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
            console.error('Error response:', error.response?.data);
            alert(`Lỗi gửi email: ${error.response?.data?.message || error.message || 'Có lỗi xảy ra'}`);
        } finally {
            setEmailLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div>Đang tải thông tin nhóm...</div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className={styles.error}>
                <div>Không tìm thấy thông tin nhóm</div>
                <Button onClick={() => navigate('/supervisor/groups')}>
                    Quay lại danh sách
                </Button>
            </div>
        );
    }
    console.log(" group members: ", group.members);
    return (
        <div className={styles.container}>
            <BackButton to="/supervisor/groups">← Quay lại</BackButton>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Chi tiết nhóm: {group.groupName}</h1>
                </div>
                <div className={styles.headerRight}>
                    <Button 
                        onClick={openEmailComposer}
                    >
                        Gửi email cho nhóm
                    </Button>
                </div>
            </div>

            <div className={styles.groupInfo}>
                <div className={styles.infoCard}>
                    <h3>Thông tin nhóm</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <label>Mã nhóm:</label>
                            <span>{group.groupCode}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Tên dự án:</label>
                            <span>{group.projectName}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <label>Số thành viên:</label>
                            <span>{group.members.length}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.membersCard}>
                    <div className={styles.membersHeader}>
                        <h3>Thành viên nhóm</h3>
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
                                    <button 
                                        className={styles.changeRoleBtn}
                                        onClick={() => handleChangeRole(member)}
                                    >
                                        Đổi Role
                                    </button>
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
                            <h2>Gửi email cho nhóm</h2>
                            <button 
                                className={styles.closeButton}
                                onClick={() => setShowEmailComposer(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label>Người nhận (To)</label>
                                <div className={styles.recipientsList}>
                                    {group.members.map(member => (
                                        <div key={member.id} className={styles.recipient}>
                                            {member.name} ({member.email})
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>CC (Giảng viên)</label>
                                <div className={styles.recipientsList}>
                                    {group.supervisorsInfor && group.supervisorsInfor.length > 0 ? (
                                        group.supervisorsInfor.map((supervisor, index) => (
                                            <div key={index} className={styles.recipient}>
                                                {supervisor.name || supervisor.fullName} ({supervisor.email})
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.noRecipients}>Không có thông tin giảng viên</div>
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
                                Hủy
                            </Button>
                            <Button onClick={sendEmail} disabled={emailLoading}>
                                {emailLoading ? 'Đang gửi...' : 'Gửi email'}
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
                            <h2>Thay đổi Role cho {selectedMember.name}</h2>
                            <button 
                                className={styles.closeButton}
                                onClick={() => setShowRoleModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label>Role hiện tại:</label>
                                <span className={styles.currentRole}>{selectedMember.currentRole}</span>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Role mới:</label>
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
                                Hủy
                            </Button>
                            <Button onClick={handleSaveRoleChange}>
                                Lưu thay đổi
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
