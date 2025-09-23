export const Role = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
};

export function hasRole(user, roles) {
  if (!roles || roles.length === 0) return true;
  return roles.includes(user.role);
} 