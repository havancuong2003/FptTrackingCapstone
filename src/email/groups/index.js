import { sendEmail } from '../api';
import { baseTemplate } from '../templates';

/**
 * Send email notification when supervisor assigns Secretary role to a member
 * @param {Object} params - Email parameters
 * @param {string} params.memberEmail - Email of the member being assigned Secretary role
 * @param {string} params.memberName - Name of the member
 * @param {string} params.groupName - Group name/code
 * @param {string} params.projectName - Project name
 * @param {string} params.supervisorName - Name of the supervisor
 * @param {string} params.detailUrl - URL to view group details (optional)
 * @param {string} params.systemUrl - URL to access system (optional)
 * @param {string[]} params.cc - CC recipients (optional)
 * @returns {Promise<Object>} API response
 */
export const sendSecretaryAssignmentEmail = async (params) => {
    try {
        const {
            memberEmail,
            memberName,
            groupName,
            projectName,
            supervisorName,
            detailUrl,
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!memberEmail || !memberName || !groupName || !projectName) {
            throw new Error('Missing required email parameters');
        }

        // Generate HTML email body using base template
        const infoItems = [
            { label: 'Nhóm', value: groupName },
            { label: 'Dự án', value: projectName },
            { label: 'Vai trò mới', value: 'Thư ký (Secretary)' }
        ];

        const responsibilities = [
            'Gán vai trò cho các thành viên còn lại trong nhóm (Leader, Member)',
            'Tạo và quản lý biên bản cuộc họp',
            'Quản lý tài liệu và hồ sơ của nhóm',
            'Hỗ trợ giảng viên hướng dẫn trong việc quản lý nhóm',
            'Đảm bảo thông tin liên lạc giữa các thành viên được cập nhật'
        ];

        const responsibilitiesText = responsibilities.map(r => `• ${r}`).join('<br>');

        // Build action links
        const actionLinks = [];
        if (detailUrl) {
            actionLinks.push({
                text: 'Xem chi tiết nhóm',
                url: detailUrl,
                secondary: false
            });
        }
        if (systemUrl) {
            actionLinks.push({
                text: 'Truy cập hệ thống Capstone Project',
                url: systemUrl,
                secondary: true
            });
        }

        const htmlBody = baseTemplate({
            title: 'Thông báo gán vai trò Thư ký',
            greeting: `Xin chào ${memberName},`,
            content: `Bạn đã được <strong>${supervisorName || 'Giảng viên hướng dẫn'}</strong> gán vai trò <strong>Thư ký</strong> cho nhóm của bạn.<br><br><strong>Nhiệm vụ của Thư ký:</strong><br>${responsibilitiesText}`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để bắt đầu thực hiện các nhiệm vụ của mình.' : ''
        });

        // Send email with HTML body
        const emailData = {
            to: [memberEmail],
            subject: `[${groupName}] Bạn đã được gán vai trò Thư ký`,
            body: htmlBody,
            cc: cc
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending secretary assignment email:', error);
        throw error;
    }
};

/**
 * Send email notification when Secretary assigns role to other members
 * @param {Object} params - Email parameters
 * @param {string} params.memberEmail - Email of the member receiving the role
 * @param {string} params.memberName - Name of the member
 * @param {string} params.newRole - New role assigned (Leader/Member)
 * @param {string} params.groupName - Group name/code
 * @param {string} params.projectName - Project name
 * @param {string} params.secretaryName - Name of the Secretary assigning the role
 * @param {string} params.detailUrl - URL to view group details (optional)
 * @param {string} params.systemUrl - URL to access system (optional)
 * @param {string[]} params.cc - CC recipients (optional)
 * @returns {Promise<Object>} API response
 */
export const sendRoleAssignmentEmail = async (params) => {
    try {
        const {
            memberEmail,
            memberName,
            newRole,
            groupName,
            projectName,
            secretaryName,
            detailUrl,
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!memberEmail || !memberName || !newRole || !groupName || !projectName || !secretaryName) {
            throw new Error('Missing required email parameters');
        }

        // Validate role
        const validRoles = ['Leader', 'Member', 'Secretary'];
        if (!validRoles.includes(newRole)) {
            throw new Error(`Invalid role: ${newRole}. Must be one of: ${validRoles.join(', ')}`);
        }

        // Map role names for display
        const roleNames = {
            'Leader': 'Trưởng nhóm',
            'Member': 'Thành viên',
            'Secretary': 'Thư ký'
        };

        const roleDescriptions = {
            'Leader': 'Lãnh đạo nhóm với quyền quản lý đầy đủ',
            'Member': 'Thành viên với quyền cơ bản',
            'Secretary': 'Quản lý tài liệu và biên bản'
        };

        const roleTitle = roleNames[newRole] || newRole;
        const roleDescription = roleDescriptions[newRole] || '';

        // Generate HTML email body using base template
        const infoItems = [
            { label: 'Nhóm', value: groupName },
            { label: 'Dự án', value: projectName },
            { label: 'Vai trò mới', value: roleTitle }
        ];

        // Build action links
        const actionLinks = [];
        if (detailUrl) {
            actionLinks.push({
                text: 'Xem chi tiết nhóm',
                url: detailUrl,
                secondary: false
            });
        }
        if (systemUrl) {
            actionLinks.push({
                text: 'Truy cập hệ thống Capstone Project',
                url: systemUrl,
                secondary: true
            });
        }

        const htmlBody = baseTemplate({
            title: 'Thông báo gán vai trò mới',
            greeting: `Xin chào ${memberName},`,
            content: `Bạn đã được <strong>${secretaryName}</strong> (Thư ký nhóm) gán vai trò mới trong nhóm.${roleDescription ? `<br><br><strong>Về vai trò ${roleTitle}:</strong><br>${roleDescription}` : ''}`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem thông tin chi tiết và bắt đầu thực hiện các nhiệm vụ của mình.' : ''
        });

        // Send email with HTML body
        const emailData = {
            to: [memberEmail],
            subject: `[${groupName}] Bạn đã được gán vai trò ${roleTitle}`,
            body: htmlBody,
            cc: cc
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending role assignment email:', error);
        throw error;
    }
};

/**
 * Send email to multiple members when roles are assigned
 * @param {Array} assignments - Array of role assignments
 * @param {Object} groupInfo - Group information
 * @param {string} groupInfo.groupName - Group name
 * @param {string} groupInfo.projectName - Project name
 * @param {string} assignerName - Name of person assigning roles
 * @param {boolean} isSecretary - Whether assigner is Secretary
 * @returns {Promise<Array>} Array of email results
 */
export const sendBulkRoleAssignmentEmails = async (assignments, groupInfo, assignerName, isSecretary = false) => {
    try {
        const results = await Promise.allSettled(
            assignments.map(assignment => {
                if (isSecretary) {
                    return sendRoleAssignmentEmail({
                        memberEmail: assignment.email,
                        memberName: assignment.name,
                        newRole: assignment.role,
                        groupName: groupInfo.groupName,
                        projectName: groupInfo.projectName,
                        secretaryName: assignerName
                    });
                } else {
                    return sendSecretaryAssignmentEmail({
                        memberEmail: assignment.email,
                        memberName: assignment.name,
                        groupName: groupInfo.groupName,
                        projectName: groupInfo.projectName,
                        supervisorName: assignerName
                    });
                }
            })
        );

        // Process results
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return {
            total: assignments.length,
            successful,
            failed,
            results
        };
    } catch (error) {
        console.error('Error sending bulk role assignment emails:', error);
        throw error;
    }
};

export default {
    sendSecretaryAssignmentEmail,
    sendRoleAssignmentEmail,
    sendBulkRoleAssignmentEmails
};

