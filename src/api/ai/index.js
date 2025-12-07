import client from '../../utils/axiosClient';

// ========== Admin AI Settings ==========
// Get AI settings
export async function getAISettings() {
  try {
    const response = await client.get('/ai-settings');
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Update AI settings
export async function updateAISettings(data) {
  try {
    const response = await client.post('/ai-settings', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ========== Supervisor AI APIs ==========
// Ask AI (POST)
export async function askAI(data) {
  try {
    const response = await client.post('/ask', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get AI result (GET)
export async function getAIResult(taskId) {
  try {
    const response = await client.get(`/result/${taskId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

