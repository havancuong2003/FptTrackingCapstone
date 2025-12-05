import client from '../../utils/axiosClient';

// ================== Staff Group Management ==================

// Send email to group
export async function sendGroupEmail(emailData) {
  try {
    const response = await client.post('/Staff/send-group-email', emailData);
    return response.data;
  } catch (error) {
    console.error('Error sending group email:', error);
    throw error;
  }
}

// Update student role in group
export async function updateStudentRoleInGroup(groupId, studentId, roleData) {
  try {
    // API expects a JSON string (e.g., "Leader" or "Member"), not an object
    // Axios will automatically serialize the string to JSON format
    const roleString = typeof roleData === 'string' ? roleData : String(roleData);
    
    const res = await client.put(
      `/Staff/update-role?groupId=${parseInt(groupId)}&studentId=${studentId}`, 
      roleString,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    const payload = res.data;
    return {
      data: payload.data,
      status: payload.status ?? res.status,
      message: payload.message || 'Role updated successfully',
    };
  } catch (error) {
    console.error('Error updating student role:', error);
    return {
      data: null,
      status: error.response?.data?.status ?? error.response?.status ?? 500,
      message: error.response?.data?.message || error.message || 'Error updating student role',
    };
  }
}

// Send emails (bulk)
export async function sendEmails(emailData) {
  try {
    const response = await client.post('/Mail/send-mails', emailData);
    return response.data;
  } catch (error) {
    console.error('Error sending emails:', error);
    throw error;
  }
}

// ================== Course Management ==================

// Get all courses with pagination
// params: { page?: number, pageSize?: number }
export async function getAllCourses(params = {}) {
  try {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    
    const url = `/Staff/getAllCodeCourse?page=${page}&pageSize=${pageSize}`;
    
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    console.error('Error getting all courses:', error);
    throw error;
  }
}

// Get course by ID
export async function getCourseById(id) {
  try {
    const response = await client.get(`/Staff/GetCourseBy/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting course by ID:', error);
    throw error;
  }
}

// Update course
export async function updateCourse(id, courseData) {
  try {
    const response = await client.post(`/Staff/updateCourse/${id}`, courseData);
    return response.data;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

