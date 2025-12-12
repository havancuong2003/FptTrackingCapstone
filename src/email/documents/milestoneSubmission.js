import { sendEmail } from '../api';
import { baseTemplate } from '../templates';
import { formatDate } from '../../utils/date';

/**
 * Send email notification when student submits milestone file
 * @param {Object} params - Email parameters
 * @param {string[]} params.supervisorEmails - Array of supervisor email addresses (TO)
 * @param {string[]} params.studentEmails - Array of student email addresses (CC)
 * @param {string} params.studentName - Name of the student who uploaded
 * @param {string} params.groupName - Group name/project name
 * @param {string} params.milestoneName - Milestone name
 * @param {string} params.deliveryItemName - Delivery item name
 * @param {string} params.fileName - Name of the uploaded file
 * @param {string} params.fileSize - File size (formatted)
 * @param {string} params.uploadTime - Upload time (formatted)
 * @param {string} params.deadline - Milestone deadline (formatted)
 * @param {string} params.semesterName - Semester name (optional)
 * @param {string} params.fileUrl - Direct download URL for the file (optional)
 * @param {string} params.systemUrl - URL to access the system milestones page (optional)
 * @returns {Promise<Object>} API response
 */
export const sendMilestoneSubmissionEmail = async (params) => {
    try {
        const {
            supervisorEmails,
            studentEmails,
            studentName,
            groupName,
            milestoneName,
            deliveryItemName,
            fileName,
            fileSize,
            uploadTime,
            deadline,
            semesterName,
            fileUrl,
            systemUrl
        } = params;

        // Validate required fields
        if (!supervisorEmails || !Array.isArray(supervisorEmails) || supervisorEmails.length === 0) {
            throw new Error('Supervisor emails are required');
        }

        if (!studentName || !groupName || !milestoneName || !deliveryItemName || !fileName) {
            throw new Error('Student name, group name, milestone name, delivery item name and file name are required');
        }

        // Build info items
        const infoItems = [
            { label: 'Nhóm', value: groupName },
            { label: 'Milestone', value: milestoneName },
            { label: 'Delivery Item', value: deliveryItemName },
            { label: 'File đã nộp', value: fileName },
            { label: 'Kích thước file', value: fileSize || 'N/A' },
            { label: 'Thời gian nộp', value: uploadTime },
            { label: 'Hạn chót', value: deadline }
        ];

        if (semesterName) {
            infoItems.splice(2, 0, { label: 'Kỳ học', value: semesterName });
        }

        // Build action links
        const actionLinks = [];
        if (systemUrl) {
            actionLinks.push({
                text: 'Truy cập hệ thống',
                url: systemUrl,
                secondary: true
            });
        }

        const htmlBody = baseTemplate({
            title: 'Thông báo nộp milestone',
            greeting: ``,
            content: `Sinh viên <strong>${studentName}</strong> đã nộp file cho milestone <strong>${milestoneName}</strong> - Delivery Item <strong>${deliveryItemName}</strong> của nhóm <strong>${groupName}</strong>.`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem và tải xuống file.' : ''
        });

        const emailData = {
            to: supervisorEmails,
            subject: `[${groupName}] Nộp milestone: ${milestoneName} - ${deliveryItemName}`,
            body: htmlBody,
            cc: studentEmails || []
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending milestone submission email:', error);
        throw error;
    }
};

export default {
    sendMilestoneSubmissionEmail
};

