import client from '../../utils/axiosClient';
// Email functions are in email folder, import if needed
// import {
//     sendEvaluationNotification,
//     sendEvaluationSummary,
//     sendPenaltyNotification,
//     sendBatchEvaluationNotifications
// } from '../../email/evaluation';

/**
 * Evaluation API functions
 * This module provides API functions for evaluation-related activities
 */

// Get evaluations by student
export async function getEvaluationsByStudent() {
  try {
    const response = await client.get('/Common/Evaluation/getEvaluationFromDeliverableByStudent');
    return response.data;
  } catch (error) {
    console.error('Error fetching evaluations by student:', error);
    throw error;
  }
}

// Get general penalty cards by student
export async function getGeneralPenaltyCardsByStudent() {
  try {
    const response = await client.get('/Common/Evaluation/getCardEvaluationGeneralByStudent');
    return response.data;
  } catch (error) {
    console.error('Error fetching general penalty cards by student:', error);
    throw error;
  }
}

// Get evaluations by mentor and deliverable
export async function getEvaluationsByMentorDeliverable(groupId, deliverableId = null) {
  try {
    const params = { groupId };
    if (deliverableId) {
      params.deliverableId = deliverableId;
    }
    const response = await client.get('/Common/Evaluation/getEvaluationByMentorDeliverable', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching evaluations by mentor deliverable:', error);
    throw error;
  }
}

// Get penalty cards by milestone
export async function getPenaltyCardsByMilestone(groupId) {
  try {
    const response = await client.get('/Common/Evaluation/card-milestonse', {
      params: { groupId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching penalty cards by milestone:', error);
    throw error;
  }
}

// Create evaluation
export async function createEvaluation(payload) {
  try {
    const response = await client.post('/Common/Evaluation/create', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating evaluation:', error);
    throw error;
  }
}

// Update evaluation
export async function updateEvaluation(evaluationId, payload) {
  try {
    const response = await client.put(`/Common/Evaluation/update/evaluation/${evaluationId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating evaluation:', error);
    throw error;
  }
}

// Get general penalty cards by mentor ID
export async function getGeneralPenaltyCardsByMentor() {
  try {
    const response = await client.get('/Common/Evaluation/getCardGeneralFromMentorId');
    return response.data;
  } catch (error) {
    console.error('Error fetching general penalty cards by mentor:', error);
    throw error;
  }
}

// Create penalty card
export async function createPenaltyCard(payload) {
  try {
    const response = await client.post('/Common/Evaluation/create-card', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating penalty card:', error);
    throw error;
  }
}

// Update penalty card
export async function updatePenaltyCard(cardId, payload) {
  try {
    const response = await client.put(`/Common/Evaluation/update/penalty-card/${cardId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating penalty card:', error);
    throw error;
  }
}

/**
 * =============================
 * Supervisor Evaluation – New APIs
 * =============================
 *
 * Các hàm dưới đây implement 2 API đã mô tả trong
 * `API_Supervisor_Evaluation_Endpoints.md`.
 */

// API 1: Get student evaluation detail by milestone (tasks + current evaluation)
export async function getStudentEvaluationDetail({ groupId, studentId, deliverableId }) {
  try {
    const params = {
      groupId,
      studentId,
      deliverableId
    };

    const response = await client.get('/supervisor/evaluation/student-detail', {
      params
    });

    // Trả về toàn bộ response.data để component tự xử lý
    return response.data;
  } catch (error) {
    console.error('Error fetching student evaluation detail:', error);
    throw error;
  }
}

// API 2: Get student evaluation statistics & history
export async function getStudentEvaluationStatistics({ groupId, studentId, deliverableId }) {
  try {
    const params = {
      groupId,
      studentId
    };

    if (deliverableId) {
      params.deliverableId = deliverableId;
    }

    const response = await client.get('/supervisor/evaluation/student-statistics', {
      params
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching student evaluation statistics:', error);
    throw error;
  }
}

// Email functions exported separately if needed
// export {
//     sendEvaluationNotification,
//     sendEvaluationSummary,
//     sendPenaltyNotification,
//     sendBatchEvaluationNotifications
// };

export default {
    getEvaluationsByStudent,
    getGeneralPenaltyCardsByStudent
};
