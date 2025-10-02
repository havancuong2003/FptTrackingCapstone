export const Role = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
};

export function hasRole(user, role) {
  if (!role) return true;
  return role.includes(user.role);
} 