import axiosClient from '../../utils/axiosClient';

/**
 * Send evaluation notification email
 * @param {Object} evaluationData - Evaluation data object
 * @param {string[]} evaluationData.recipients - Array of recipient email addresses
 * @param {string} evaluationData.studentName - Student name
 * @param {string} evaluationData.milestoneName - Milestone name
 * @param {string} evaluationData.feedback - Evaluation feedback
 * @param {string[]} evaluationData.penaltyCards - Array of penalty card names
 * @param {string} evaluationData.evaluatorName - Evaluator name
 * @param {string} evaluationData.subject - Email subject (optional)
 * @param {string[]} evaluationData.cc - Array of CC email addresses (optional)
 * @returns {Promise<Object>} API response
 */
export const sendEvaluationNotification = async (evaluationData) => {
    try {
        // Validate required fields
        if (!evaluationData.recipients || !Array.isArray(evaluationData.recipients) || evaluationData.recipients.length === 0) {
            throw new Error('Recipients are required');
        }

        if (!evaluationData.studentName || !evaluationData.milestoneName || !evaluationData.feedback) {
            throw new Error('Student name, milestone name and feedback are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const allEmails = [...evaluationData.recipients, ...(evaluationData.cc || [])];
        const invalidEmails = allEmails.filter(email => email && !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`);
        }

        // Create email body
        let body = `Xin chào ${evaluationData.studentName},\n\n`;
        body += `Bạn đã nhận được đánh giá cho milestone: ${evaluationData.milestoneName}\n\n`;
        body += `Nhận xét từ ${evaluationData.evaluatorName || 'Giảng viên'}:\n`;
        body += `${evaluationData.feedback}\n\n`;
        
        if (evaluationData.penaltyCards && evaluationData.penaltyCards.length > 0) {
            body += `Thẻ phạt:\n`;
            evaluationData.penaltyCards.forEach(card => {
                body += `- ${card}\n`;
            });
            body += `\n`;
        }
        
        body += `Vui lòng xem chi tiết trong hệ thống.\n\n`;
        body += `Trân trọng,\n`;
        body += `Hệ thống FPT Tracking`;
        const response = await axiosClient.post('/Mail/send-mails', {
            to: evaluationData.recipients,
            cc: evaluationData.cc || [],
            subject: evaluationData.subject || `Đánh giá milestone: ${evaluationData.milestoneName}`,
            body: body
        });
        
        return response.data;
    } catch (error) {
        console.error('Error sending evaluation notification:', error);
        throw error;
    }
};

/**
 * Send evaluation summary email to supervisor
 * @param {Object} summaryData - Summary data object
 * @param {string[]} summaryData.recipients - Array of recipient email addresses
 * @param {string} summaryData.groupName - Group name
 * @param {string} summaryData.milestoneName - Milestone name
 * @param {number} summaryData.totalEvaluations - Total number of evaluations
 * @param {number} summaryData.totalPenalties - Total number of penalties
 * @param {string} summaryData.subject - Email subject (optional)
 * @param {string[]} summaryData.cc - Array of CC email addresses (optional)
 * @returns {Promise<Object>} API response
 */
export const sendEvaluationSummary = async (summaryData) => {
    try {
        // Validate required fields
        if (!summaryData.recipients || !Array.isArray(summaryData.recipients) || summaryData.recipients.length === 0) {
            throw new Error('Recipients are required');
        }

        if (!summaryData.groupName || !summaryData.milestoneName) {
            throw new Error('Group name and milestone name are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const allEmails = [...summaryData.recipients, ...(summaryData.cc || [])];
        const invalidEmails = allEmails.filter(email => email && !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`);
        }

        // Create email body
        let body = `Tóm tắt đánh giá milestone: ${summaryData.milestoneName}\n\n`;
        body += `Nhóm: ${summaryData.groupName}\n`;
        body += `Tổng số đánh giá: ${summaryData.totalEvaluations || 0}\n`;
        body += `Tổng số thẻ phạt: ${summaryData.totalPenalties || 0}\n\n`;
        body += `Vui lòng xem chi tiết trong hệ thống.\n\n`;
        body += `Trân trọng,\n`;
        body += `Hệ thống FPT Tracking`;

        const response = await axiosClient.post('/Mail/send-mails', {
            to: summaryData.recipients,
            cc: summaryData.cc || [],
            subject: summaryData.subject || `Tóm tắt đánh giá: ${summaryData.milestoneName}`,
            body: body
        });
        return response.data;
    } catch (error) {
        console.error('Error sending evaluation summary:', error);
        throw error;
    }
};

/**
 * Send penalty card notification email
 * @param {Object} penaltyData - Penalty data object
 * @param {string[]} penaltyData.recipients - Array of recipient email addresses
 * @param {string} penaltyData.studentName - Student name
 * @param {string} penaltyData.penaltyName - Penalty card name
 * @param {string} penaltyData.penaltyDescription - Penalty description
 * @param {string} penaltyData.penaltyType - Penalty type (General/Milestone)
 * @param {string} penaltyData.subject - Email subject (optional)
 * @param {string[]} penaltyData.cc - Array of CC email addresses (optional)
 * @returns {Promise<Object>} API response
 */
export const sendPenaltyNotification = async (penaltyData) => {
    try {
        // Validate required fields
        if (!penaltyData.recipients || !Array.isArray(penaltyData.recipients) || penaltyData.recipients.length === 0) {
            throw new Error('Recipients are required');
        }

        if (!penaltyData.studentName || !penaltyData.penaltyName) {
            throw new Error('Student name and penalty name are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const allEmails = [...penaltyData.recipients, ...(penaltyData.cc || [])];
        const invalidEmails = allEmails.filter(email => email && !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            throw new Error(`Invalid email format: ${invalidEmails.join(', ')}`);
        }

        // Create email body
        let body = `Xin chào ${penaltyData.studentName},\n\n`;
        body += `Bạn đã nhận thẻ phạt: ${penaltyData.penaltyName}\n\n`;
        body += `Loại thẻ phạt: ${penaltyData.penaltyType || 'General'}\n`;
        
        if (penaltyData.penaltyDescription) {
            body += `Mô tả: ${penaltyData.penaltyDescription}\n\n`;
        }
        
        body += `Vui lòng xem chi tiết trong hệ thống.\n\n`;
        body += `Trân trọng,\n`;
        body += `Hệ thống FPT Tracking`;

        const response = await axiosClient.post('/Mail/send-mails', {
            to: penaltyData.recipients,
            cc: penaltyData.cc || [],
            subject: penaltyData.subject || `Thẻ phạt: ${penaltyData.penaltyName}`,
            body: body
        });
        return response.data;
    } catch (error) {
        console.error('Error sending penalty notification:', error);
        throw error;
    }
};

/**
 * Send batch evaluation notifications
 * @param {Object} batchData - Batch data object
 * @param {Array} batchData.evaluations - Array of evaluation objects
 * @param {string} batchData.milestoneName - Milestone name
 * @param {string} batchData.groupName - Group name
 * @param {string} batchData.subject - Email subject (optional)
 * @param {string[]} batchData.cc - Array of CC email addresses (optional)
 * @returns {Promise<Object>} API response
 */
export const sendBatchEvaluationNotifications = async (batchData) => {
    try {
        if (!batchData.evaluations || !Array.isArray(batchData.evaluations) || batchData.evaluations.length === 0) {
            throw new Error('Evaluations array is required');
        }

        if (!batchData.milestoneName || !batchData.groupName) {
            throw new Error('Milestone name and group name are required');
        }

        // Create email body for batch notification
        let body = `Thông báo đánh giá batch cho milestone: ${batchData.milestoneName}\n\n`;
        body += `Nhóm: ${batchData.groupName}\n`;
        body += `Tổng số đánh giá: ${batchData.evaluations.length}\n\n`;
        
        body += `Chi tiết đánh giá:\n`;
        batchData.evaluations.forEach((evaluation, index) => {
            body += `${index + 1}. ${evaluation.studentName}\n`;
            body += `   - Nhận xét: ${evaluation.feedback}\n`;
            if (evaluation.penaltyCards && evaluation.penaltyCards.length > 0) {
                body += `   - Thẻ phạt: ${evaluation.penaltyCards.join(', ')}\n`;
            }
            body += `\n`;
        });
        
        body += `Vui lòng xem chi tiết trong hệ thống.\n\n`;
        body += `Trân trọng,\n`;
        body += `Hệ thống FPT Tracking`;

        // Get all unique email addresses from evaluations
        const allEmails = [...new Set(batchData.evaluations.map(evaluation => evaluation.studentEmail).filter(Boolean))];
        
        if (allEmails.length === 0) {
            throw new Error('No valid email addresses found in evaluations');
        }

        const response = await axiosClient.post('/Mail/send-mails', {
            to: allEmails,
            cc: batchData.cc || [],
            subject: batchData.subject || `Đánh giá batch: ${batchData.milestoneName}`,
            body: body
        });
        return response.data;
    } catch (error) {
        console.error('Error sending batch evaluation notifications:', error);
        throw error;
    }
};

export default {
    sendEvaluationNotification,
    sendEvaluationSummary,
    sendPenaltyNotification,
    sendBatchEvaluationNotifications
};
