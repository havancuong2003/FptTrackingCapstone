import { sendEmail } from '../api';
import { baseTemplate } from '../templates';

/**
 * Send email notification when Secretary creates issue from meeting minutes and assigns it
 * @param {Object} params - Email parameters
 * @param {string} params.recipientEmail - Email of the person assigned the issue
 * @param {string} params.recipientName - Name of the person assigned
 * @param {string} params.issueTitle - Issue title
 * @param {string} params.issueDescription - Issue description
 * @param {string} params.deadline - Issue deadline
 * @param {string} params.meetingTopic - Meeting topic
 * @param {string} params.secretaryName - Name of the Secretary who created the issue
 * @param {string} params.groupName - Group name
 * @param {string} params.detailUrl - URL to view issue details (optional)
 * @param {string} params.systemUrl - URL to access system (optional)
 * @param {string[]} params.cc - CC recipients (optional)
 * @returns {Promise<Object>} API response
 */
export const sendIssueAssignmentEmail = async (params) => {
    try {
        const {
            recipientEmail,
            recipientName,
            issueTitle,
            issueDescription,
            deadline,
            meetingTopic,
            secretaryName,
            groupName,
            detailUrl,
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!recipientEmail || !issueTitle || !deadline || !secretaryName) {
            throw new Error('Missing required email parameters');
        }

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const infoItems = [
            { label: 'Vấn đề', value: issueTitle },
            { label: 'Từ cuộc họp', value: meetingTopic || 'N/A' },
            { label: 'Người gán', value: `${secretaryName} (Thư ký)` },
            { label: 'Hạn chót', value: formatDate(deadline) }
        ];

        if (groupName) {
            infoItems.unshift({ label: 'Nhóm', value: groupName });
        }

        // Build action links
        const actionLinks = [];
        if (detailUrl) {
            actionLinks.push({
                text: 'Xem chi tiết vấn đề',
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
            title: 'Vấn đề mới từ biên bản họp',
            greeting: `Xin chào ${recipientName || 'bạn'},`,
            content: `Thư ký <strong>${secretaryName}</strong> đã tạo một vấn đề (issue) từ biên bản cuộc họp và gán cho bạn.${issueDescription ? `<br><br><strong>Mô tả:</strong><br>${issueDescription}` : ''}`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem chi tiết và bắt đầu xử lý vấn đề này.' : ''
        });

        const emailData = {
            to: [recipientEmail],
            subject: `[${groupName || 'Capstone Project'}] Vấn đề mới: ${issueTitle}`,
            body: htmlBody,
            cc: cc
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending issue assignment email:', error);
        throw error;
    }
};

export default {
    sendIssueAssignmentEmail
};

