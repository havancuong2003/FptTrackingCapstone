import client from '../../utils/axiosClient';

// Lấy tất cả các kỳ học
export async function getAllSemesters() {
  try {
    const response = await client.get('/Staff/semester/getall');
    console.log("response getAllSemesters", response.data);
    
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Tạo kỳ học mới
export async function createSemester(semesterData) {
  try {
    const response = await client.post('/Staff/semester/create', semesterData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Lấy chi tiết kỳ học
export async function getSemesterDetail(id) {
  try {
    const response = await client.get(`/Staff/semester/getSemesterBy/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Cập nhật thông tin kỳ học
export async function updateSemester(id, semesterData) {
  try {
    const response = await client.post(`/Staff/semester/${id}`, semesterData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Lấy danh sách các tuần của kỳ học
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

// Lấy kỳ học hiện tại
export async function getCurrentSemester() {
  try {
    const response = await client.get('/Staff/semester/getSemesterByNow');
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Lấy danh sách vacation periods của semester
export async function getVacationBySemesterId(semesterId) {
  try {
    const response = await client.get(`/Staff/semester/getVacationBySemesterId/${semesterId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getVacationBySemesterId:', error);
    throw error;
  }
}

// Cập nhật vacation periods
export async function updateVacationPeriods(semesterId, vacationData) {
  try {
    const response = await client.put(`/Staff/semester/${semesterId}/vacations`, vacationData);
    return response.data;
  } catch (error) {
    console.error('Error in updateVacationPeriods:', error);
    throw error;
  }
}
