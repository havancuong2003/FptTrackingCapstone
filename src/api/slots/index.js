import client from '../../utils/axiosClient';

// ================== Slots ==================

// Get slots by campus ID
export async function getSlotsByCampusId(campusId) {
  try {
    const response = await client.get(`/slot/ById/${campusId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching slots:', error);
    throw error;
  }
}

