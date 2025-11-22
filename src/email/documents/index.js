import { sendEmail } from '../api';
import { baseTemplate } from '../templates';

/**
 * Send email notification when supervisor uploads document for students
 * @param {Object} params - Email parameters
 * @param {string[]} params.recipientEmails - Array of student email addresses
 * @param {string} params.fileName - Name of the uploaded file
 * @param {string} params.supervisorName - Name of the supervisor who uploaded
 * @param {string} params.groupName - Group name
 * @param {string} params.message - Optional message from supervisor
 * @param {string} params.fileUrl - Direct download URL for the file (optional)
 * @param {string} params.systemUrl - URL to access the system documents page (optional)
 * @param {string[]} params.cc - CC recipients (optional)
 * @returns {Promise<Object>} API response
 */
export const sendDocumentUploadEmail = async (params) => {
    try {
        const {
            recipientEmails,
            fileName,
            supervisorName,
            groupName,
            message,
            fileUrl,
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
            throw new Error('Recipients are required');
        }

        if (!fileName || !supervisorName || !groupName) {
            throw new Error('File name, supervisor name and group name are required');
        }

        const infoItems = [
            { label: 'Nhóm', value: groupName },
            { label: 'Tài liệu', value: fileName },
            { label: 'Người tải lên', value: supervisorName }
        ];

        // Build action links
        const actionLinks = [];
        if (fileUrl) {
            actionLinks.push({
                text: 'Tải xuống tài liệu',
                url: fileUrl,
                secondary: false
            });
        }
        if (systemUrl) {
            actionLinks.push({
                text: 'Truy cập hệ thống',
                url: systemUrl,
                secondary: true
            });
        }

        const htmlBody = baseTemplate({
            title: 'Tài liệu mới được chia sẻ',
            greeting: `Xin chào,`,
            content: `Giảng viên hướng dẫn <strong>${supervisorName}</strong> đã tải lên một tài liệu mới cho nhóm của bạn.${message ? `<br><br><strong>Ghi chú từ giảng viên:</strong><br>${message}` : ''}`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để tải xuống và xem tài liệu.' : ''
        });

        const emailData = {
            to: recipientEmails,
            subject: `[${groupName}] Tài liệu mới: ${fileName}`,
            body: htmlBody,
            cc: cc
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending document upload email:', error);
        throw error;
    }
};

export default {
    sendDocumentUploadEmail
};

