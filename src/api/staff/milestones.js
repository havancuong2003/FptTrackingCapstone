import client from '../../utils/axiosClient';

// ================== Staff Milestones Management ==================

// Get milestones by major category ID
export async function getMilestonesByMajor(majorCateId) {
  try {
    const response = await client.get(`/Staff/milestones?majorCateId=${encodeURIComponent(majorCateId)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching milestones:', error);
    throw error;
  }
}

// Create milestone(s)
export async function createMilestones(milestonesData) {
  try {
    const response = await client.post('/Staff/milestones', milestonesData);
    return response.data;
  } catch (error) {
    console.error('Error creating milestones:', error);
    throw error;
  }
}

// Update milestone
export async function updateMilestone(milestoneData) {
  try {
    const response = await client.put('/Staff/milestones', milestoneData);
    return response.data;
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }
}

// Delete milestone
export async function deleteMilestone(milestoneId) {
  try {
    const response = await client.delete(`/Staff/milestone/${milestoneId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting milestone:', error);
    throw error;
  }
}

// Get deliverables by major and semester
export async function getDeliverablesByMajorAndSemester(majorCateId, semesterId) {
  try {
    const response = await client.get(`/Staff/deliverables?majorCateId=${majorCateId}&semesterId=${semesterId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    throw error;
  }
}

