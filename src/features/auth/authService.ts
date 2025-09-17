import httpClient from '../../core/httpClient'
import type { AuthTokens, User } from './types'
import { findMockByCredentials, mockUsers } from '../../mocks/users'

export interface LoginResponse {
  user: User
  tokens: AuthTokens
}

const useMock = !import.meta.env.VITE_API_BASE_URL

const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    if (useMock) {
      const rec = findMockByCredentials(username, password)
      if (!rec) throw new Error('Thông tin đăng nhập không hợp lệ')
      return { user: rec.user, tokens: rec.tokens }
    }
    const { data } = await httpClient.post<LoginResponse>('/auth/login', { username, password })
    return data
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    if (useMock) {
      // Trả lại tokens như cũ
      return { accessToken: refreshToken.replace('refresh', 'access'), refreshToken }
    }
    const { data } = await httpClient.post<AuthTokens>('/auth/refresh', { refreshToken })
    return data
  },

  async getProfile(): Promise<User> {
    if (useMock) {
      // Lấy profile từ token giả (đơn giản: map theo suffix)
      const role = (localStorage.getItem('auth.role') || 'admin') as keyof typeof mockUsers
      return mockUsers[role].user
    }
    const { data } = await httpClient.get<User>('/auth/me')
    return data
  },
}

export default authService 