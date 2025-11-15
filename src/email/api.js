import axiosClient from '../utils/axiosClient';

/**
 * Send email API functions
 */

/**
 * Send email to multiple recipients
 * @param {Object} emailData - Email data object
 * @param {string[]} emailData.to - Array of recipient email addresses
 * @param {string[]} emailData.cc - Array of CC email addresses (optional)
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.body - Email body content
 * @returns {Promise<Object>} API response
 */
export const sendEmail = async (emailData) => {
    try {
        // Validate required fields
        if (!emailData.to || !Array.isArray(emailData.to) || emailData.to.length === 0) {
            throw new Error('Recipients (to) is required and must be an array');
        }
        
        if (!emailData.subject || !emailData.body) {
            throw new Error('Subject and body are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const allEmails = [...emailData.to, ...(emailData.cc || [])];
        const invalidEmails = allEmails.filter(email => email && !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`);
        }

        const response = await axiosClient.post('/Mail/send-mails', {
            to: emailData.to,
            subject: emailData.subject,
            body: emailData.body,
            cc: emailData.cc || []
        });

        return response.data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

/**
 * Send group email (for staff/supervisor)
 * @param {Object} emailData - Email data object
 * @param {string[]} emailData.to - Array of recipient email addresses
 * @param {string[]} emailData.cc - Array of CC email addresses (optional)
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.body - Email body content
 * @returns {Promise<Object>} API response
 */
export const sendGroupEmail = async (emailData) => {
    try {
        // Validate required fields
        if (!emailData.to || !Array.isArray(emailData.to) || emailData.to.length === 0) {
            throw new Error('Recipients (to) is required and must be an array');
        }
        
        if (!emailData.subject || !emailData.body) {
            throw new Error('Subject and body are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const allEmails = [...emailData.to, ...(emailData.cc || [])];
        const invalidEmails = allEmails.filter(email => email && !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`);
        }

        const response = await axiosClient.post('/Staff/send-group-email', {
            to: emailData.to,
            subject: emailData.subject,
            body: emailData.body,
            cc: emailData.cc || []
        });

        return response.data;
    } catch (error) {
        console.error('Error sending group email:', error);
        throw error;
    }
};

/**
 * Send meeting notification email
 * @param {Object} meetingData - Meeting data object
 * @param {string[]} meetingData.recipients - Array of recipient email addresses
 * @param {string} meetingData.subject - Email subject
 * @param {string} meetingData.meetingTime - Meeting time
 * @param {string} meetingData.meetingLink - Meeting link (optional)
 * @param {string} meetingData.message - Additional message (optional)
 * @returns {Promise<Object>} API response
 */
export const sendMeetingNotification = async (meetingData) => {
    try {
        if (!meetingData.recipients || !Array.isArray(meetingData.recipients) || meetingData.recipients.length === 0) {
            throw new Error('Recipients are required');
        }

        if (!meetingData.subject || !meetingData.meetingTime) {
            throw new Error('Subject and meeting time are required');
        }

        // Create email body
        let body = `Thời gian họp: ${meetingData.meetingTime}\n`;
        
        if (meetingData.meetingLink) {
            body += `Link tham gia: ${meetingData.meetingLink}\n`;
        }
        
        if (meetingData.message) {
            body += `\nGhi chú: ${meetingData.message}`;
        }

        const emailData = {
            to: meetingData.recipients,
            subject: meetingData.subject,
            body: body,
            cc: meetingData.cc || []
        };

        return await sendEmail(emailData);
    } catch (error) {
        console.error('Error sending meeting notification:', error);
        throw error;
    }
};

/**
 * Send task notification email
 * @param {Object} taskData - Task data object
 * @param {string[]} taskData.recipients - Array of recipient email addresses
 * @param {string} taskData.subject - Email subject
 * @param {string} taskData.taskName - Task name
 * @param {string} taskData.deadline - Task deadline
 * @param {string} taskData.description - Task description (optional)
 * @returns {Promise<Object>} API response
 */
export const sendTaskNotification = async (taskData) => {
    try {
        if (!taskData.recipients || !Array.isArray(taskData.recipients) || taskData.recipients.length === 0) {
            throw new Error('Recipients are required');
        }

        if (!taskData.subject || !taskData.taskName || !taskData.deadline) {
            throw new Error('Subject, task name and deadline are required');
        }

        // Create email body
        let body = `Tên công việc: ${taskData.taskName}\n`;
        body += `Hạn chót: ${taskData.deadline}\n`;
        
        if (taskData.description) {
            body += `\nMô tả: ${taskData.description}`;
        }

        const emailData = {
            to: taskData.recipients,
            subject: taskData.subject,
            body: body,
            cc: taskData.cc || []
        };

        return await sendEmail(emailData);
    } catch (error) {
        console.error('Error sending task notification:', error);
        throw error;
    }
};

export default {
    sendEmail,
    sendGroupEmail,
    sendMeetingNotification,
    sendTaskNotification
};

