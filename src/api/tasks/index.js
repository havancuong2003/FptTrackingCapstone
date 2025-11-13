import client from '../../utils/axiosClient';

// Student Task APIs
export async function getTasksByGroup(groupId) {
  try {
    const response = await client.get(`/Student/Task/get-by-group/${groupId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getTaskById(taskId) {
  try {
    const response = await client.get(`/Student/Task/get-by-id/${taskId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function createTask(taskData) {
  try {
    const response = await client.post('/Student/Task/create', taskData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateTask(updateData) {
  try {
    const response = await client.post('/Student/Task/update', updateData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Comment APIs
export async function createComment(commentData) {
  try {
    const response = await client.post('/Student/Comment/create', commentData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Attachment APIs
export async function deleteAttachment(attachmentId) {
  try {
    const response = await client.delete(`/upload/task?attachmentId=${attachmentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Milestone/Deliverable APIs
export async function getMilestonesByGroup(groupId) {
  try {
    const response = await client.get(`/deliverables/group/${groupId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Group APIs (for getting students, reviewers, etc.)
export async function getGroupById(groupId) {
  try {
    const response = await client.get(`/Staff/capstone-groups/${groupId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Meeting APIs
export async function getCompletedMeetings(groupId) {
  try {
    const response = await client.get(`/Student/Meeting/group/${groupId}/schedule-dates`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Supervisor APIs
export async function getSupervisorGroups() {
  try {
    const response = await client.get('/Mentor/getGroups');
    return response.data;
  } catch (error) {
    throw error;
  }
}

