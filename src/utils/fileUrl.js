import { API_BASE_URL } from '../app/config';

/**
 * Get full file URL from file path
 * @param {string} filePath - File path from API (e.g., "/uploads/file.pdf")
 * @returns {string} Full URL to access the file
 */
export function getFileUrl(filePath) {
  if (!filePath) return '';
  
  // Remove leading slash if present
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  
  // Get base URL without trailing slash
  const baseUrl = (API_BASE_URL || '').replace(/\/+$/, '');
  
  return `${baseUrl}${normalizedPath}`;
}

