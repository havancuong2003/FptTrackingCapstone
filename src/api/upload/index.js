import client from '../../utils/axiosClient';

// ================== File Upload ==================

// Upload milestone file
export async function uploadMilestoneFile(groupId, deliveryItemId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post(
      `/upload/milestone?groupId=${groupId}&deliveryItemId=${deliveryItemId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading milestone file:', error);
    throw error;
  }
}

// Delete milestone attachment
export async function deleteMilestoneAttachment(attachmentId) {
  try {
    const response = await client.delete(`/upload/milestone?attachmentId=${attachmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting milestone attachment:', error);
    throw error;
  }
}

// Get files by group ID
export async function getFilesByGroup(groupId) {
  try {
    const response = await client.get('/upload/files', { params: { groupId } });
    return response.data;
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
}

// Upload group document
export async function uploadGroupDocument(groupId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post(`/upload/group`, formData, {
      params: { groupId },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading group document:', error);
    throw error;
  }
}

// Delete group document
export async function deleteGroupDocument(attachmentId) {
  try {
    const response = await client.delete('/upload/group', { params: { attachmentId } });
    return response.data;
  } catch (error) {
    console.error('Error deleting group document:', error);
    throw error;
  }
}

// Upload task attachment
export async function uploadTaskAttachment(taskId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post(`/upload/task`, formData, {
      params: { taskId },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading task attachment:', error);
    throw error;
  }
}

// Delete task attachment
export async function deleteTaskAttachment(attachmentId) {
  try {
    const response = await client.delete(`/upload/task?attachmentId=${attachmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task attachment:', error);
    throw error;
  }
}

