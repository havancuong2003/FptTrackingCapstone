import axiosClient from '../../utils/axiosClient';
import { baseTemplate } from '../templates';
import { sendEmail } from '../api';

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
 * @param {string} evaluationData.detailUrl - URL to view evaluation details (optional)
 * @param {string} evaluationData.systemUrl - URL to access system (optional)
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

        const infoItems = [
            { label: 'Sinh viên', value: evaluationData.studentName },
            { label: 'Milestone', value: evaluationData.milestoneName },
            { label: 'Người đánh giá', value: evaluationData.evaluatorName || 'Giảng viên' }
        ];

        if (evaluationData.penaltyCards && evaluationData.penaltyCards.length > 0) {
            infoItems.push({ label: 'Thẻ phạt', value: evaluationData.penaltyCards.join(', ') });
        }

        // Build action links
        const actionLinks = [];
        if (evaluationData.detailUrl) {
            actionLinks.push({
                text: 'Xem chi tiết đánh giá',
                url: evaluationData.detailUrl,
                secondary: false
            });
        }
        if (evaluationData.systemUrl) {
            actionLinks.push({
                text: 'Truy cập hệ thống Capstone Project',
                url: evaluationData.systemUrl,
                secondary: true
            });
        }

        const htmlBody = baseTemplate({
            title: 'Thông báo đánh giá milestone',
            greeting: `Xin chào ${evaluationData.studentName},`,
            content: `Bạn đã nhận được đánh giá cho milestone <strong>${evaluationData.milestoneName}</strong>.<br><br><strong>Nhận xét từ ${evaluationData.evaluatorName || 'Giảng viên'}:</strong><br>${evaluationData.feedback}`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem chi tiết.' : ''
        });

        const response = await sendEmail({
            to: evaluationData.recipients,
            cc: evaluationData.cc || [],
            subject: evaluationData.subject || `Đánh giá milestone: ${evaluationData.milestoneName}`,
            body: htmlBody
        });
        
        return response;
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
 * @param {string} summaryData.systemUrl - URL to access system (optional)
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

        const infoItems = [
            { label: 'Nhóm', value: summaryData.groupName },
            { label: 'Milestone', value: summaryData.milestoneName },
            { label: 'Tổng số đánh giá', value: String(summaryData.totalEvaluations || 0) },
            { label: 'Tổng số thẻ phạt', value: String(summaryData.totalPenalties || 0) }
        ];

        // Build action links
        const actionLinks = [];
        if (summaryData.systemUrl) {
            actionLinks.push({
                text: 'Truy cập hệ thống Capstone Project',
                url: summaryData.systemUrl,
                secondary: false
            });
        }

        const htmlBody = baseTemplate({
            title: 'Tóm tắt đánh giá milestone',
            greeting: `Xin chào,`,
            content: `Tóm tắt đánh giá cho milestone <strong>${summaryData.milestoneName}</strong> của nhóm <strong>${summaryData.groupName}</strong>.`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem chi tiết.' : ''
        });

        const response = await sendEmail({
            to: summaryData.recipients,
            cc: summaryData.cc || [],
            subject: summaryData.subject || `Tóm tắt đánh giá: ${summaryData.milestoneName}`,
            body: htmlBody
        });
        return response;
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
 * @param {string} penaltyData.detailUrl - URL to view penalty details (optional)
 * @param {string} penaltyData.systemUrl - URL to access system (optional)
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

        const infoItems = [
            { label: 'Sinh viên', value: penaltyData.studentName },
            { label: 'Thẻ phạt', value: penaltyData.penaltyName },
            { label: 'Loại', value: penaltyData.penaltyType || 'General' }
        ];

        if (penaltyData.penaltyDescription) {
            infoItems.push({ label: 'Mô tả', value: penaltyData.penaltyDescription });
        }

        // Build action links
        const actionLinks = [];
        if (penaltyData.detailUrl) {
            actionLinks.push({
                text: 'Xem chi tiết thẻ phạt',
                url: penaltyData.detailUrl,
                secondary: false
            });
        }
        if (penaltyData.systemUrl) {
            actionLinks.push({
                text: 'Truy cập hệ thống Capstone Project',
                url: penaltyData.systemUrl,
                secondary: true
            });
        }

        const htmlBody = baseTemplate({
            title: 'Thông báo thẻ phạt',
            greeting: `Xin chào ${penaltyData.studentName},`,
            content: `Bạn đã nhận thẻ phạt <strong>${penaltyData.penaltyName}</strong>.`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem chi tiết.' : ''
        });

        const response = await sendEmail({
            to: penaltyData.recipients,
            cc: penaltyData.cc || [],
            subject: penaltyData.subject || `Thẻ phạt: ${penaltyData.penaltyName}`,
            body: htmlBody
        });
        return response;
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
 * @param {string} batchData.systemUrl - URL to access system (optional)
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

        const infoItems = [
            { label: 'Nhóm', value: batchData.groupName },
            { label: 'Milestone', value: batchData.milestoneName },
            { label: 'Tổng số đánh giá', value: String(batchData.evaluations.length) }
        ];

        const evaluationsList = batchData.evaluations.map((evaluation, index) => {
            let item = `${index + 1}. ${evaluation.studentName}<br>`;
            item += `&nbsp;&nbsp;- Nhận xét: ${evaluation.feedback}<br>`;
            if (evaluation.penaltyCards && evaluation.penaltyCards.length > 0) {
                item += `&nbsp;&nbsp;- Thẻ phạt: ${evaluation.penaltyCards.join(', ')}<br>`;
            }
            return item;
        }).join('<br>');

        // Build action links
        const actionLinks = [];
        if (batchData.systemUrl) {
            actionLinks.push({
                text: 'Truy cập hệ thống Capstone Project',
                url: batchData.systemUrl,
                secondary: false
            });
        }

        const htmlBody = baseTemplate({
            title: 'Thông báo đánh giá batch',
            greeting: `Xin chào,`,
            content: `Thông báo đánh giá batch cho milestone <strong>${batchData.milestoneName}</strong>.<br><br><strong>Chi tiết đánh giá:</strong><br>${evaluationsList}`,
            infoItems: infoItems,
            actionLinks: actionLinks,
            footerNote: actionLinks.length === 0 ? 'Vui lòng đăng nhập vào hệ thống để xem chi tiết.' : ''
        });

        // Get all unique email addresses from evaluations
        const allEmails = [...new Set(batchData.evaluations.map(evaluation => evaluation.studentEmail).filter(Boolean))];
        
        if (allEmails.length === 0) {
            throw new Error('No valid email addresses found in evaluations');
        }

        const response = await sendEmail({
            to: allEmails,
            cc: batchData.cc || [],
            subject: batchData.subject || `Đánh giá batch: ${batchData.milestoneName}`,
            body: htmlBody
        });
        return response;
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

