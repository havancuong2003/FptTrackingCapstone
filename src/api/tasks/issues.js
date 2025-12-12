import client from '../../utils/axiosClient';

// ================== Task Issues APIs ==================

// Get task type issues by group ID
export async function getTaskTypeIssuesByGroup(groupId) {
  try {
    const response = await client.get(`/task/taskTypeIssue/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task type issues:', error);
    throw error;
  }
}

