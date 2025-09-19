import type { User } from '../features/auth/types'
import type { AuthTokens } from '../features/auth/types'

export type RoleKey = 'admin' | 'dao_tao' | 'sinh_vien' | 'giang_vien'

export interface MockUserRecord {
  credentials: { username: string; password: string }
  user: User
  tokens: AuthTokens
}

const mkTokens = (role: string): AuthTokens => ({
  accessToken: `mock-access-${role}`,
  refreshToken: `mock-refresh-${role}`,
})

export const mockUsers: Record<RoleKey, MockUserRecord> = {
  admin: {
    credentials: { username: 'admin', password: 'Adm!n_2025#A' },
    user: {
      id: '1',
      username: 'admin',
      fullName: 'Quản trị hệ thống',
      roles: 'admin',
      permissions: ['*'],
    },
    tokens: mkTokens('admin'),
  },
  dao_tao: {
    credentials: { username: 'daotao', password: 'Dt@oTao_2025#B' },
    user: {
      id: '2',
      username: 'daotao',
      fullName: 'Phòng Đào Tạo',
      roles: 'dao_tao',
      permissions: ['tracking.view', 'tracking.manage', 'student.manage', 'test.view'],
    },
    tokens: mkTokens('dao_tao'),
  },
  sinh_vien: {
    credentials: { username: 'sv', password: 'Sv#2025_str0ngC' },
    user: {
      id: '3',
      username: 'sv',
      fullName: 'Sinh Viên',
      roles: 'sinh_vien',
      permissions: ['tracking.view', 'student.self'],
    },
    tokens: mkTokens('sinh_vien'),
  },
  giang_vien: {
    credentials: { username: 'gv', password: 'Gv$2025_StrongD' },
    user: {
      id: '4',
      username: 'gv',
      fullName: 'Giảng Viên',
      roles: 'giang_vien',
      permissions: ['tracking.view', 'grade.manage'],
    },
    tokens: mkTokens('giang_vien'),
  },
}

export const findMockByCredentials = (username: string, password: string): MockUserRecord | null => {
  const items = Object.values(mockUsers)
  for (let i = 0; i < items.length; i++) {
    if (items[i].credentials.username === username && items[i].credentials.password === password) {
      return items[i]
    }
  }
  return null
} 