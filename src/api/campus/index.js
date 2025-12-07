import client from '../../utils/axiosClient';

// Get all campuses
export async function getAllCampuses() {
  try {
    const response = await client.get('/Campus');
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get campus by ID with slots
export async function getCampusById(campusId) {
  try {
    const response = await client.get(`/slot/ById/${campusId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Create/Update slots for a campus
export async function upsertSlots(campusId, slots) {
  try {
    const response = await client.post(`/slot/${campusId}`, slots);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Update slots for a campus (PUT)
export async function updateSlots(campusId, slots) {
  try {
    const response = await client.put(`/slot/${campusId}`, slots);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Soft delete slot (set isActive to false)
export async function softDeleteSlot(campusId, slotId) {
  try {
    const response = await client.put(`/campus/${campusId}/slot/${slotId}/active`, {
      isActive: false
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ========== Campus CRUD ==========
// Create campus
export async function createCampus(data) {
  try {
    const response = await client.post('/Campus', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Update campus
export async function updateCampus(campusId, data) {
  try {
    const response = await client.put(`/Campus/${campusId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Delete campus
export async function deleteCampus(campusId) {
  try {
    const response = await client.delete(`/Campus/${campusId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

