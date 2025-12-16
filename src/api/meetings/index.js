import client from '../../utils/axiosClient';

// ================== Meeting Schedule Dates ==================

// Get meeting schedule dates by group ID
export async function getMeetingScheduleDatesByGroup(groupId) {
  try {
    const response = await client.get(`/Student/Meeting/group/${groupId}/schedule-dates`);
    return response.data;
  } catch (error) {
    console.error('Error fetching meeting schedule dates:', error);
    throw error;
  }
}

// Update meeting schedule date
export async function updateMeetingScheduleDate(meetingDateId, updateData) {
  try {
    const response = await client.put(`/Student/Meeting/schedule-dates/${meetingDateId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating meeting schedule date:', error);
    throw error;
  }
}

// ================== Meeting Minutes ==================

// Get meeting minutes by meeting date ID
export async function getMeetingMinutesByMeetingDateId(meetingDateId) {
  try {
    const response = await client.get(`/MeetingMinute?meetingDateId=${meetingDateId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching meeting minutes:', error);
    throw error;
  }
}

// Create meeting minutes
export async function createMeetingMinutes(minutesData) {
  try {
    const response = await client.post('/MeetingMinute', minutesData);
    return response.data;
  } catch (error) {
    console.error('Error creating meeting minutes:', error);
    throw error;
  }
}

// Update meeting minutes
export async function updateMeetingMinutes(minutesData) {
  try {
    const response = await client.put('/MeetingMinute', minutesData);
    return response.data;
  } catch (error) {
    console.error('Error updating meeting minutes:', error);
    throw error;
  }
}

// Delete meeting minutes
export async function deleteMeetingMinutes(minuteId) {
  try {
    const response = await client.delete(`/MeetingMinute/${minuteId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting meeting minutes:', error);
    throw error;
  }
}

// Get attendance data by group ID
export async function getAttendanceDataByGroup(groupId) {
  try {
    const response = await client.get(`/MeetingMinute/attendance?groupId=${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    throw error;
  }
}

// Update meeting isMeeting status
export async function updateMeetingIsMeetingStatus(meetingId, isMeeting) {
  try {
    // API expects JSON string 'true' or 'false', not boolean or object
    const response = await client.put(
      `/Student/Meeting/update-is-meeting/${meetingId}`,
      JSON.stringify(isMeeting),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating meeting status:', error);
    throw error;
  }
}

// Update meeting schedule
export async function updateMeetingSchedule(meetingId, scheduleData) {
  try {
    const response = await client.put(`/Student/Meeting/schedule/${meetingId}`, scheduleData);
    return response.data;
  } catch (error) {
    console.error('Error updating meeting schedule:', error);
    throw error;
  }
}

