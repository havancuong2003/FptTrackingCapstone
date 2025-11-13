import client from '../../utils/axiosClient';

// ================== Meeting Schedule ==================

// Get meeting schedule by group ID
export async function getMeetingScheduleByGroupId(groupId) {
  try {
    const response = await client.get(`/Student/Meeting/schedule/finalize/getById/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching meeting schedule:', error);
    throw error;
  }
}

// Finalize meeting schedule
export async function finalizeMeetingSchedule(groupId, meetingData) {
  try {
    const response = await client.post(`/Student/Meeting/groups/${groupId}/schedule/finalize`, meetingData);
    return response.data;
  } catch (error) {
    console.error('Error finalizing meeting schedule:', error);
    throw error;
  }
}

// Update meeting schedule finalize
export async function updateMeetingScheduleFinalize(meetingData) {
  try {
    const response = await client.post(`/Student/Meeting/schedule/finalize/update`, meetingData);
    return response.data;
  } catch (error) {
    console.error('Error updating meeting schedule:', error);
    throw error;
  }
}

// ================== Student Free Time ==================

// Get student free time slots
export async function getStudentFreeTimeSlots(groupId) {
  try {
    const response = await client.get(`/Student/Meeting/groups/${groupId}/schedule/free-time`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student free time slots:', error);
    throw error;
  }
}

// Get student free time slots (new format) - alias
export async function getStudentFreeTimeSlotsNew(groupId) {
  return getStudentFreeTimeSlots(groupId);
}

// Save/Update student free time slots
export async function saveStudentFreeTimeSlots(groupId, freeTimeData) {
  try {
    const response = await client.post(`/Student/Meeting/groups/${groupId}/schedule/free-time`, freeTimeData);
    return response.data;
  } catch (error) {
    console.error('Error saving student free time slots:', error);
    throw error;
  }
}

// Update student free time slots (new format) - alias
export async function updateStudentFreeTimeSlotsNew(groupId, freeTimeData) {
  return saveStudentFreeTimeSlots(groupId, freeTimeData);
}

// Legacy function - kept for backward compatibility
export async function updateStudentFreeTimeSlots(groupId, freeTimeData) {
  return saveStudentFreeTimeSlots(groupId, freeTimeData);
}

// ================== Supervisor Groups ==================


