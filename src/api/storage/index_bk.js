import client from '../../utils/axiosClient';

/**
 * Storage Management API functions
 * This module provides API functions for storage management (semesters, groups, zip/unzip)
 */

/**
 * Get list of semesters with storage information
 * @returns {Promise} Response with list of semesters and their storage info
 */
export async function getStorageSemesters() {
  try {
    const response = await client.get('/admin/storage/semesters');
    return response.data;
  } catch (error) {
    console.error('Error fetching storage semesters:', error);
    throw error;
  }
}

/**
 * Get storage size for a specific semester
 * @param {string} semesterName - Name of the semester
 * @returns {Promise} Response with semester storage size
 */
export async function getSemesterStorageSize(semesterName) {
  try {
    const response = await client.get(`/admin/storage/size/${semesterName}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching semester storage size:', error);
    throw error;
  }
}

/**
 * Get list of groups in a semester with pagination
 * @param {string} semesterName - Name of the semester
 * @param {number} pageNumber - Page number (default: 1)
 * @param {number} pageSize - Page size (default: 10)
 * @returns {Promise} Response with paginated list of groups
 */
export async function getSemesterGroups(semesterName, pageNumber = 1, pageSize = 10) {
  try {
    const params = { pageNumber, pageSize };
    const response = await client.get(`/admin/storage/${semesterName}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching semester groups:', error);
    throw error;
  }
}

/**
 * Zip a folder
 * @param {string} folderName - Name of the folder to zip
 * @returns {Promise} Response from zip operation
 */
export async function zipFolder(folderName) {
  try {
    const response = await client.post('/admin/storage/zip', {
      folderName
    });
    return response.data;
  } catch (error) {
    console.error('Error zipping folder:', error);
    throw error;
  }
}

/**
 * Unzip an archive
 * @param {string} archiveFileName - Name of the archive file to unzip
 * @param {boolean} deleteArchiveAfter - Whether to delete archive after unzipping (default: true)
 * @returns {Promise} Response from unzip operation
 */
export async function unzipArchive(archiveFileName, deleteArchiveAfter = true) {
  try {
    const response = await client.post('/admin/storage/unzip', {
      archiveFileName,
      deleteArchiveAfter
    });
    return response.data;
  } catch (error) {
    console.error('Error unzipping archive:', error);
    throw error;
  }
}

/**
 * Get storage size detail for a specific group
 * @param {string} semesterName - Name of the semester
 * @param {string} groupName - Name of the group
 * @returns {Promise} Response with group storage size detail
 */
export async function getGroupSizeDetail(semesterName, groupName) {
  try {
    const response = await client.get(`/admin/storage/${semesterName}/${groupName}/size`);
    return response.data;
  } catch (error) {
    console.error('Error fetching group size detail:', error);
    throw error;
  }
}

