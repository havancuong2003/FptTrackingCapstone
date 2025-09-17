export interface User {
  id: string
  username: string
  fullName?: string
  roles: string[]
  permissions: string[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
} 