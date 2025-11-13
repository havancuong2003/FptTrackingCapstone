import client from '../../utils/axiosClient';

// Get meeting schedule by group ID
export async function getMeetingScheduleByGroupId(groupId) {
  try {
    const response = await client.get(`/Student/Meeting/schedule/finalize/getById/${groupId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get group details
export async function getGroupById(groupId) {
  try {
    const response = await client.get(`/Staff/capstone-groups/${groupId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get student free time slots
export async function getStudentFreeTimeSlots(groupId) {
  try {
    const response = await client.get(`/Student/Meeting/groups/${groupId}/schedule/free-time`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Update student free time slots
export async function updateStudentFreeTimeSlots(groupId, freeTimeData) {
  try {
    const response = await client.post(`/Student/Meeting/groups/${groupId}/schedule/free-time`, freeTimeData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Update meeting schedule finalize
export async function updateMeetingScheduleFinalize(meetingData) {
  try {
    const response = await client.post(`/Student/Meeting/schedule/finalize/update`, meetingData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Finalize meeting schedule
export async function finalizeMeetingSchedule(groupId, meetingData) {
  try {
    const response = await client.post(`/Student/Meeting/groups/${groupId}/schedule/finalize`, meetingData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get supervisor groups
export async function getSupervisorGroups() {
  try {
    const response = await client.get('/Mentor/getGroups');
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get student free time slots (new format)
export async function getStudentFreeTimeSlotsNew(groupId) {
  try {
    const response = await client.get(`/Student/Meeting/groups/${groupId}/schedule/free-time`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Update student free time slots (new format)
export async function updateStudentFreeTimeSlotsNew(groupId, freeTimeData) {
  try {
    const response = await client.post(`/Student/Meeting/groups/${groupId}/schedule/free-time`, freeTimeData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

