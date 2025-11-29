import { sendEmail } from '../api';
import { baseTemplate } from '../templates';

/**
 * Send email reminder to students who haven't confirmed their free time
 * @param {Object} params - Email parameters
 * @param {string[]} params.recipientEmails - Array of student email addresses who haven't confirmed
 * @param {string[]} params.recipientNames - Array of student names who haven't confirmed
 * @param {string} params.groupName - Group name/code
 * @param {string} params.supervisorName - Name of the supervisor
 * @param {string} params.supervisorEmail - Email of the supervisor (for CC)
 * @param {string} params.scheduleUrl - URL to the student schedule page
 * @param {string} params.systemUrl - URL to access system
 * @returns {Promise<Object>} API response
 */
export const sendFreeTimeReminderEmail = async (params) => {
    try {
        const {
            recipientEmails,
            recipientNames,
            groupName,
            supervisorName,
            supervisorEmail,
            scheduleUrl,
            systemUrl
        } = params;

        // Validate required fields
        if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
            throw new Error('Recipient emails are required');
        }

        if (!groupName) {
            throw new Error('Group name is required');
        }

        const studentNameList = recipientNames && recipientNames.length > 0 
            ? recipientNames.join(', ') 
            : 'các sinh viên';

        const infoItems = [
            { label: 'Nhóm', value: groupName },
            { label: 'Sinh viên chưa xác nhận', value: studentNameList },
            { label: 'Giảng viên hướng dẫn', value: supervisorName || 'Giảng viên' }
        ];

        // Build action links
        const actionLinks = [];
        if (scheduleUrl) {
            actionLinks.push({
                text: 'Xác nhận lịch rảnh ngay',
                url: scheduleUrl,
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
            title: 'Nhắc nhở xác nhận lịch rảnh',
            greeting: `Xin chào,`,
            content: `
                <p>Giảng viên hướng dẫn <strong>${supervisorName || 'Giảng viên'}</strong> đang chờ bạn xác nhận lịch rảnh để có thể sắp xếp lịch họp nhóm.</p>
                <p style="color: #dc2626; font-weight: 600;">⚠️ Bạn chưa xác nhận lịch rảnh của mình!</p>
                <p>Vui lòng truy cập hệ thống và cập nhật lịch rảnh của bạn trong thời gian sớm nhất để nhóm có thể xác định thời gian họp phù hợp.</p>
            `,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: 'Nếu bạn đã xác nhận lịch rảnh, vui lòng bỏ qua email này.'
        });

        // Build CC list - include supervisor email
        const ccList = [];
        if (supervisorEmail) {
            ccList.push(supervisorEmail);
        }

        const emailData = {
            to: recipientEmails,
            subject: `[${groupName}] Nhắc nhở xác nhận lịch rảnh`,
            body: htmlBody,
            cc: ccList
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending free time reminder email:', error);
        throw error;
    }
};

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
    sendMeetingScheduleConfirmationEmail,
    sendFreeTimeReminderEmail
};

