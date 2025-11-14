import { sendEmail } from '../api';
import { baseTemplate } from '../templates';

/**
 * Send email notification when a new task is created and assigned
 * @param {Object} params - Email parameters
 * @param {string} params.recipientEmail - Email of the person assigned the task
 * @param {string} params.recipientName - Name of the person assigned
 * @param {string} params.taskTitle - Task title
 * @param {string} params.taskDescription - Task description
 * @param {string} params.deadline - Task deadline
 * @param {string} params.priority - Task priority (High/Medium/Low)
 * @param {string} params.assignerName - Name of person who created/assigned the task
 * @param {string} params.groupName - Group name
 * @param {string} params.detailUrl - URL to view task details (optional)
 * @param {string} params.systemUrl - URL to access system (optional)
 * @param {string[]} params.cc - CC recipients (optional)
 * @returns {Promise<Object>} API response
 */
export const sendTaskAssignmentEmail = async (params) => {
    try {
        const {
            recipientEmail,
            recipientName,
            taskTitle,
            taskDescription,
            deadline,
            priority,
            assignerName,
            groupName,
            detailUrl,
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!recipientEmail || !taskTitle || !deadline || !assignerName) {
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
            { label: 'Công việc', value: taskTitle },
            { label: 'Người gán', value: assignerName },
            { label: 'Hạn chót', value: formatDate(deadline) },
            { label: 'Độ ưu tiên', value: priority || 'Không xác định' }
        ];

        if (groupName) {
            infoItems.unshift({ label: 'Nhóm', value: groupName });
        }

        // Build action links
        const actionLinks = [];
        if (detailUrl) {
            actionLinks.push({
                text: 'Xem chi tiết công việc',
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
            title: 'Công việc mới được gán',
            greeting: `Xin chào ${recipientName || 'bạn'},`,
            content: `Bạn đã được <strong>${assignerName}</strong> gán một công việc mới.${taskDescription ? `<br><br><strong>Mô tả:</strong><br>${taskDescription}` : ''}`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem chi tiết và bắt đầu thực hiện công việc.' : ''
        });

        const emailData = {
            to: [recipientEmail],
            subject: `[${groupName || 'Capstone Project'}] Công việc mới: ${taskTitle}`,
            body: htmlBody,
            cc: cc
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending task assignment email:', error);
        throw error;
    }
};

/**
 * Send email notification when task status is updated
 * @param {Object} params - Email parameters
 * @param {string} params.recipientEmail - Email of the task assignee
 * @param {string} params.recipientName - Name of the task assignee
 * @param {string} params.taskTitle - Task title
 * @param {string} params.oldStatus - Old status
 * @param {string} params.newStatus - New status
 * @param {string} params.updatedByName - Name of person who updated the status
 * @param {string} params.groupName - Group name
 * @param {string} params.detailUrl - URL to view task details (optional)
 * @param {string} params.systemUrl - URL to access system (optional)
 * @param {string[]} params.cc - CC recipients (optional)
 * @returns {Promise<Object>} API response
 */
export const sendTaskStatusUpdateEmail = async (params) => {
    try {
        const {
            recipientEmail,
            recipientName,
            taskTitle,
            oldStatus,
            newStatus,
            updatedByName,
            groupName,
            detailUrl,
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!recipientEmail || !taskTitle || !newStatus || !updatedByName) {
            throw new Error('Missing required email parameters');
        }

        const statusMap = {
            'todo': 'To Do',
            'inprogress': 'In Progress',
            'done': 'Done',
            'ToDo': 'To Do',
            'InProgress': 'In Progress',
            'Done': 'Done'
        };

        const oldStatusText = statusMap[oldStatus] || oldStatus || 'N/A';
        const newStatusText = statusMap[newStatus] || newStatus;

        const infoItems = [
            { label: 'Công việc', value: taskTitle },
            { label: 'Trạng thái cũ', value: oldStatusText },
            { label: 'Trạng thái mới', value: newStatusText },
            { label: 'Người cập nhật', value: updatedByName }
        ];

        if (groupName) {
            infoItems.unshift({ label: 'Nhóm', value: groupName });
        }

        // Build action links
        const actionLinks = [];
        if (detailUrl) {
            actionLinks.push({
                text: 'Xem chi tiết công việc',
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
            title: 'Cập nhật trạng thái công việc',
            greeting: `Xin chào ${recipientName || 'bạn'},`,
            content: `Trạng thái của công việc <strong>"${taskTitle}"</strong> đã được <strong>${updatedByName}</strong> cập nhật từ <strong>${oldStatusText}</strong> sang <strong>${newStatusText}</strong>.`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem chi tiết.' : ''
        });

        const emailData = {
            to: [recipientEmail],
            subject: `[${groupName || 'Capstone Project'}] Cập nhật trạng thái: ${taskTitle}`,
            body: htmlBody,
            cc: cc
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending task status update email:', error);
        throw error;
    }
};

export default {
    sendTaskAssignmentEmail,
    sendTaskStatusUpdateEmail
};

