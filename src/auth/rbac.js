export const Role = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  SUPERVISOR: 'SUPERVISOR',
};

export function hasRole(user, requiredRoles) {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!user || !user.role) return false;
  
  // Chuyển tất cả về uppercase để so sánh
  const userRole = user.role.toUpperCase();
  const upperRequiredRoles = requiredRoles.map(role => role.toUpperCase());
  
  return upperRequiredRoles.includes(userRole);
} 