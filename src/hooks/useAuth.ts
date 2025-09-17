import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import authService from '../features/auth/authService'
import { loginSucceeded, logout as logoutAction, setUser } from '../features/auth/authSlice'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated } = useAppSelector((s) => s.auth)

  const login = useCallback(async (username: string, password: string) => {
    const res = await authService.login(username, password)
    dispatch(loginSucceeded({ user: res.user, tokens: res.tokens }))
    const profile = res.user ?? (await authService.getProfile())
    dispatch(setUser(profile))
    return profile
  }, [dispatch])

  const logout = useCallback(() => {
    dispatch(logoutAction())
  }, [dispatch])

  return { user, isAuthenticated, login, logout }
}

export default useAuth 