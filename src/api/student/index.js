import client from '../../utils/axiosClient';

// ================== Student Task APIs ==================

// Get task assignees
export async function getTaskAssignees() {
  try {
    const response = await client.get('/Student/Task/assignee');
    return response.data;
  } catch (error) {
    console.error('Error fetching task assignees:', error);
    throw error;
  }
}

// Get meeting tasks by meeting minute ID
export async function getMeetingTasksByMinuteId(meetingMinuteId) {
  try {
    const response = await client.get(`/Student/Task/meeting-tasks/${meetingMinuteId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching meeting tasks:', error);
    throw error;
  }
}

// Get incomplete tasks by group ID
export async function getIncompleteTasksByGroup(groupId) {
  try {
    const response = await client.get(`/Student/Task/Incomplete/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching incomplete tasks:', error);
    throw error;
  }
}

// Create task
export async function createTask(taskData) {
  try {
    const response = await client.post('/Student/Task/create', taskData);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

