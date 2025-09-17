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

const persistToStorage = (state: Partial<AuthState>) => {
  try {
    localStorage.setItem('auth', JSON.stringify(state))
  } catch {
    void 0
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