// ../../../api/storage/index.js  (or wherever your storage api file is)
import client from '../../utils/axiosClient';

/**
 * All endpoints return:
 * { status: number, message: string, data: any }
 */

export async function getStorageSemesters() {
  const res = await client.get('/admin/storage/semesters');
  return res.data;
}

export async function getSemesterGroups(semesterName, pageNumber = 1, pageSize = 10) {
  const params = { pageNumber, pageSize };
  const res = await client.get(`/admin/storage/${encodeURIComponent(semesterName)}`, { params });
  return res.data;
}

export async function zipFolder(folderName) {
  const res = await client.post('/admin/storage/zip', { folderName });
  return res.data;
}

/**
 * Restore a group archive inside a semester folder
 * Backend endpoint: POST /admin/storage/unzip
 * Body: { parentFolder, archiveFileName, deleteArchiveAfter }
 */
export async function restoreGroupArchive(parentFolder, archiveFileName, deleteArchiveAfter = true) {
  const res = await client.post('/admin/storage/unzip', {
    parentFolder,
    archiveFileName,
    deleteArchiveAfter
  });
  return res.data;
}

