import client from '../../utils/axiosClient';

// Lấy tất cả các kỳ học
export async function getAllSemesters() {
  try {
    const response = await client.get('/Staff/semester/getall');
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

// Cập nhật tuần nghỉ
export async function updateVacationWeeks(semesterId, weeks) {
  try {
    // Chỉ gửi weekNumber và isVacation cho mỗi tuần
    const formattedWeeks = weeks.map(week => ({
      weekNumber: week.weekNumber,
      isVacation: week.isVacation
    }));
    
    const response = await client.post('/Staff/semester/vacation', {
      semesterId,
      weeks: formattedWeeks
    });
    console.log("response updateVacationWeeks", response);
    return response.data;
  } catch (error) {
    console.log("error updateVacationWeeks", error);
    throw error;
  }
}
