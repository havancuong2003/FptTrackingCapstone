import { sendEmail } from '../api';
import { baseTemplate } from '../templates';

/**
 * Send email notification when supervisor confirms meeting schedule
 * @param {Object} params - Email parameters
 * @param {string[]} params.recipientEmails - Array of recipient email addresses
 * @param {string} params.groupName - Group name/code
 * @param {string} params.meetingTime - Meeting time (e.g., "Monday - 14:00-15:00")
 * @param {string} params.meetingLink - Meeting link (optional)
 * @param {string} params.supervisorName - Name of the supervisor
 * @param {string} params.detailUrl - URL to view schedule details (optional)
 * @param {string} params.systemUrl - URL to access system (optional)
 * @param {string[]} params.cc - CC recipients (optional)
 * @returns {Promise<Object>} API response
 */
export const sendMeetingScheduleConfirmationEmail = async (params) => {
    try {
        const {
            recipientEmails,
            groupName,
            meetingTime,
            meetingLink,
            supervisorName,
            detailUrl,
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
            throw new Error('Recipients are required');
        }

        if (!groupName || !meetingTime) {
            throw new Error('Group name and meeting time are required');
        }

        const infoItems = [
            { label: 'Nhóm', value: groupName },
            { label: 'Thời gian họp', value: meetingTime }
        ];

        if (meetingLink) {
            infoItems.push({ label: 'Link tham gia', value: meetingLink });
        }

        // Build action links
        const actionLinks = [];
        if (detailUrl) {
            actionLinks.push({
                text: 'Xem lịch họp',
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
            title: 'Xác nhận lịch họp nhóm',
            greeting: `Xin chào,`,
            content: `Giảng viên hướng dẫn <strong>${supervisorName || 'Giảng viên'}</strong> đã xác nhận lịch họp cho nhóm của bạn. Vui lòng tham gia đúng giờ.`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem thông tin chi tiết.' : ''
        });

        const emailData = {
            to: recipientEmails,
            subject: `[${groupName}] Xác nhận lịch họp nhóm`,
            body: htmlBody,
            cc: cc
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending meeting schedule confirmation email:', error);
        throw error;
    }
};

export default {
    sendMeetingScheduleConfirmationEmail
};

