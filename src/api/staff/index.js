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
    const response = await client.put(`/Staff/update-role?groupId=${parseInt(groupId)}&studentId=${studentId}`, roleData);
    return response.data;
  } catch (error) {
    console.error('Error updating student role:', error);
    throw error;
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

