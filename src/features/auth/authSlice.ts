import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { AuthTokens, User } from './types'

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

const loadFromStorage = (): Partial<AuthState> => {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return {}
    return JSON.parse(raw) as Partial<AuthState>
  } catch {
    return {}
  }
}


// const persistToStorage = (state: Partial<AuthState>) => {
//   try {
//     // map số → role
//     const ROLE_MAP: Record<number, 'admin' | 'dao_tao' | 'sinh_vien' | 'giang_vien'> = {
//       1: 'admin',
//       2: 'dao_tao',
//       3: 'sinh_vien',
//       4: 'giang_vien',
//     }
//     const VALID = new Set(['admin', 'dao_tao', 'sinh_vien', 'giang_vien'])

//     const normalizeRoles = (roles: unknown): string[] => {
//       const input = Array.isArray(roles) ? roles : roles != null ? [roles] : []
//       const out: string[] = []
//       const seen = new Set<string>()

//       for (const r of input) {
//         let role: string | undefined
//         if (typeof r === 'number') role = ROLE_MAP[r]
//         else if (typeof r === 'string') {
//           const s = r.toLowerCase()
//           if (VALID.has(s)) role = s
//         }
//         if (role && !seen.has(role)) {
//           seen.add(role)
//           out.push(role)
//         }
//       }

const persistToStorage = (state: Partial<AuthState>) => {
  try {
    localStorage.setItem('auth', JSON.stringify(state))
  } catch {
    /* no-op */
  }
}


const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  ...loadFromStorage(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSucceeded(
      state,
      action: PayloadAction<{ user: User; tokens: AuthTokens }>,
    ) {
      state.user = action.payload.user
      state.accessToken = action.payload.tokens.accessToken
      state.refreshToken = action.payload.tokens.refreshToken
      state.isAuthenticated = true
      persistToStorage({
        user: state.user,

        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      })
    },
    setTokens(state, action: PayloadAction<AuthTokens>) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = Boolean(state.accessToken)
      persistToStorage({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      })
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload
      persistToStorage({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      })
    },
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      try {
        localStorage.removeItem('auth')
      } catch {
        void 0
      }
    },
  },
})

export const { loginSucceeded, setTokens, setUser, logout } = authSlice.actions

export default authSlice.reducer 