import { sendEmail } from '../api';
import { baseTemplate } from '../templates';

/**
 * Helper function to format date
 */
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Helper function to build greeting based on recipient type
 * @param {string} recipientName - Name of recipient (individual)
 * @param {string} groupCode - Group code (for group emails)
 * @param {boolean} isGroup - Whether sending to group
 */
const buildGreeting = (recipientName, groupCode, isGroup = false) => {
    if (isGroup && groupCode) {
        return `Thân gửi nhóm ${groupCode},`;
    }
    return `Thân gửi ${recipientName || 'bạn'},`;
};

/**
 * Helper function to build detail URL based on role
 * @param {string} baseUrl - Base URL (window.location.origin)
 * @param {string} groupId - Group ID
 * @param {string} taskId - Task ID
 * @param {string} role - Role: 'student' or 'supervisor'
 */
const buildTaskDetailUrl = (baseUrl, groupId, taskId, role = 'student') => {
    if (role === 'supervisor') {
        return `${baseUrl}/supervisor/task/group/${groupId}?taskId=${taskId}`;
    }
    return `${baseUrl}/student/task-detail/${groupId}?taskId=${taskId}`;
};

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
 * @param {string} params.groupName - Group name/code
 * @param {string} params.groupId - Group ID
 * @param {string} params.taskId - Task ID
 * @param {string} params.recipientRole - Role of recipient: 'student' or 'supervisor'
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
            groupId,
            taskId,
            recipientRole = 'student',
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!recipientEmail || !taskTitle || !deadline || !assignerName) {
            throw new Error('Missing required email parameters');
        }

        const infoItems = [
            { label: 'Công việc', value: taskTitle },
            { label: 'Người gán', value: assignerName },
            { label: 'Hạn chót', value: formatDate(deadline) },
            { label: 'Độ ưu tiên', value: priority || 'Không xác định' }
        ];

        if (groupName) {
            infoItems.unshift({ label: 'Nhóm', value: groupName });
        }

        // Build action links with correct URL based on role
        const actionLinks = [];
        if (systemUrl && groupId && taskId) {
            const detailUrl = buildTaskDetailUrl(systemUrl, groupId, taskId, recipientRole);
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
            greeting: buildGreeting(recipientName),
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
 * @param {string} params.groupId - Group ID
 * @param {string} params.taskId - Task ID
 * @param {string} params.recipientRole - Role of recipient: 'student' or 'supervisor'
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
            groupId,
            taskId,
            recipientRole = 'student',
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

        // Build action links with correct URL based on role
        const actionLinks = [];
        if (systemUrl && groupId && taskId) {
            const detailUrl = buildTaskDetailUrl(systemUrl, groupId, taskId, recipientRole);
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
            greeting: buildGreeting(recipientName),
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

/**
 * Send email notification when task is deleted
 * @param {Object} params - Email parameters
 * @param {string|string[]} params.recipientEmails - Email(s) of recipients (assignee, reviewer, group members)
 * @param {string} params.recipientName - Name of recipient (for individual) or null for group
 * @param {string} params.taskTitle - Task title
 * @param {string} params.taskDescription - Task description
 * @param {string} params.deletedByName - Name of person who deleted the task
 * @param {string} params.groupName - Group name/code
 * @param {string} params.groupCode - Group code (for group greeting)
 * @param {boolean} params.isGroupEmail - Whether sending to entire group
 * @param {string} params.systemUrl - URL to access system (optional)
 * @param {string[]} params.cc - CC recipients (optional)
 * @returns {Promise<Object>} API response
 */
export const sendTaskDeletedEmail = async (params) => {
    try {
        const {
            recipientEmails,
            recipientName,
            taskTitle,
            taskDescription,
            deletedByName,
            groupName,
            groupCode,
            isGroupEmail = false,
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!recipientEmails || !taskTitle || !deletedByName) {
            throw new Error('Missing required email parameters');
        }

        const emails = Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails];

        const infoItems = [
            { label: 'Công việc đã xóa', value: taskTitle },
            { label: 'Người xóa', value: deletedByName },
            { label: 'Thời gian', value: formatDate(new Date().toISOString()) }
        ];

        if (groupName) {
            infoItems.unshift({ label: 'Nhóm', value: groupName });
        }

        // Build action links
        const actionLinks = [];
        if (systemUrl) {
            actionLinks.push({
                text: 'Truy cập hệ thống Capstone Project',
                url: systemUrl,
                secondary: false
            });
        }

        const htmlBody = baseTemplate({
            title: 'Công việc đã bị xóa',
            greeting: buildGreeting(recipientName, groupCode, isGroupEmail),
            content: `Công việc <strong>"${taskTitle}"</strong> đã được <strong>${deletedByName}</strong> xóa khỏi hệ thống.${taskDescription ? `<br><br><strong>Mô tả công việc:</strong><br>${taskDescription}` : ''}`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: 'Nếu bạn có thắc mắc, vui lòng liên hệ người quản lý nhóm.'
        });

        const emailData = {
            to: emails,
            subject: `[${groupName || 'Capstone Project'}] Công việc đã xóa: ${taskTitle}`,
            body: htmlBody,
            cc: cc
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending task deleted email:', error);
        throw error;
    }
};

/**
 * Send email notification when task is updated (general update)
 * @param {Object} params - Email parameters
 * @param {string} params.recipientEmail - Email of recipient
 * @param {string} params.recipientName - Name of recipient
 * @param {string} params.taskTitle - Task title
 * @param {string} params.changedFields - Array of changed field names
 * @param {string} params.updatedByName - Name of person who updated the task
 * @param {string} params.groupName - Group name
 * @param {string} params.groupId - Group ID
 * @param {string} params.taskId - Task ID
 * @param {string} params.recipientRole - Role of recipient: 'student' or 'supervisor'
 * @param {string} params.systemUrl - URL to access system
 * @param {string[]} params.cc - CC recipients (optional)
 * @returns {Promise<Object>} API response
 */
export const sendTaskUpdateEmail = async (params) => {
    try {
        const {
            recipientEmail,
            recipientName,
            taskTitle,
            changedFields = [],
            updatedByName,
            groupName,
            groupId,
            taskId,
            recipientRole = 'student',
            systemUrl,
            cc = []
        } = params;

        // Validate required fields
        if (!recipientEmail || !taskTitle || !updatedByName) {
            throw new Error('Missing required email parameters');
        }

        const fieldLabels = {
            'assignee': 'Người được gán',
            'reviewer': 'Người review',
            'status': 'Trạng thái',
            'priority': 'Độ ưu tiên',
            'deadline': 'Hạn chót',
            'description': 'Mô tả',
            'title': 'Tiêu đề'
        };

        const changedFieldsText = changedFields.map(f => fieldLabels[f] || f).join(', ');

        const infoItems = [
            { label: 'Công việc', value: taskTitle },
            { label: 'Các thay đổi', value: changedFieldsText || 'Cập nhật thông tin' },
            { label: 'Người cập nhật', value: updatedByName },
            { label: 'Thời gian', value: formatDate(new Date().toISOString()) }
        ];

        if (groupName) {
            infoItems.unshift({ label: 'Nhóm', value: groupName });
        }

        // Build action links with correct URL based on role
        const actionLinks = [];
        if (systemUrl && groupId && taskId) {
            const detailUrl = buildTaskDetailUrl(systemUrl, groupId, taskId, recipientRole);
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
            title: 'Công việc đã được cập nhật',
            greeting: buildGreeting(recipientName),
            content: `Công việc <strong>"${taskTitle}"</strong> đã được <strong>${updatedByName}</strong> cập nhật.`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: ''
        });

        const emailData = {
            to: [recipientEmail],
            subject: `[${groupName || 'Capstone Project'}] Cập nhật công việc: ${taskTitle}`,
            body: htmlBody,
            cc: cc
        };

        const response = await sendEmail(emailData);
        return response;
    } catch (error) {
        console.error('Error sending task update email:', error);
        throw error;
    }
};

export default {
    sendTaskAssignmentEmail,
    sendTaskStatusUpdateEmail,
    sendTaskDeletedEmail,
    sendTaskUpdateEmail
};

