import client from '../../utils/axiosClient';

// Get all semesters
export async function getAllSemesters() {
  try {
    const response = await client.get('/Staff/semester/getall');
    
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Create new semester (only name and description)
export async function createSemester(semesterData) {
  try {
    const response = await client.post('/Staff/semester/create', semesterData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Sync semester from FAP (only name)
export async function syncSemester(semesterData) {
  try {
    const response = await client.post('/Staff/semester/sync?name=' + semesterData.name);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get semester detail
export async function getSemesterDetail(id) {
  try {
    const response = await client.get(`/Staff/semester/getSemesterBy/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Update semester information
export async function updateSemester(id, semesterData) {
  try {
    const response = await client.post(`/Staff/semester/${id}`, semesterData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get list of weeks for a semester
export async function getSemesterWeeks(semesterId) {
  try {
    const response = await client.get('/Staff/semester/getWeek', {
      params: { id: semesterId }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get current semester
export async function getCurrentSemester() {
  try {
    const response = await client.get('/Staff/semester/getSemesterByNow');
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get list of vacation periods for a semester
export async function getVacationBySemesterId(semesterId) {
  try {
    const response = await client.get(`/Staff/semester/getVacationBySemesterId/${semesterId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getVacationBySemesterId:', error);
    throw error;
  }
}

// Update vacation periods
export async function updateVacationPeriods(semesterId, vacationData) {
  try {
    const response = await client.put(`/Staff/semester/${semesterId}/vacations`, vacationData);
    return response.data;
  } catch (error) {
    console.error('Error in updateVacationPeriods:', error);
    throw error;
  }
}

