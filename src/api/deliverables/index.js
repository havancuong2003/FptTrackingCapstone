import client from '../../utils/axiosClient';

// ================== Deliverables/Milestones ==================

// Get deliverables by group ID
export async function getDeliverablesByGroup(groupId) {
  try {
    const response = await client.get(`/deliverables/group/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    throw error;
  }
}

// Get deliverable detail by group ID and deliverable ID
export async function getDeliverableDetail(groupId, deliverableId) {
  try {
    const response = await client.get(`/deliverables/group/detail?groupdId=${groupId}&deliverableId=${deliverableId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deliverable detail:', error);
    throw error;
  }
}

// Mark deliverable attachment as downloaded
export async function markDeliverableAttachmentDownloaded(attachmentId) {
  try {
    const response = await client.put(`/deliverables/Mark-download?attachmentId=${attachmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error marking attachment as downloaded:', error);
    throw error;
  }
}

// Confirm deliverable
export async function confirmDeliverable(groupId, deliverableId, note) {
  try {
    const response = await client.put(`/deliverables/confirmed?groupdId=${groupId}&deliverableId=${deliverableId}&note=${encodeURIComponent(note)}`);
    return response.data;
  } catch (error) {
    console.error('Error confirming deliverable:', error);
    throw error;
  }
}

// Reject deliverable
export async function rejectDeliverable(groupId, deliverableId, note) {
  try {
    const response = await client.put(`/deliverables/reject?groupdId=${groupId}&deliverableId=${deliverableId}&note=${encodeURIComponent(note)}`);
    return response.data;
  } catch (error) {
    console.error('Error rejecting deliverable:', error);
    throw error;
  }
}

