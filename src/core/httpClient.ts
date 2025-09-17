import axios, { AxiosError } from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { store } from '../store/store'
import { logout, setTokens } from '../features/auth/authSlice'
import authService from '../features/auth/authService'
import type { AxiosRequestHeaders } from 'axios'
import { getRuntimeConfig } from './appRuntime'
import message from './message'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
})

const getAuth = () => {
  try {
    const raw = localStorage.getItem('auth')
    const data = raw ? JSON.parse(raw) as { accessToken?: string; refreshToken?: string } : {}
    return {
      accessToken: data.accessToken ?? null,
      refreshToken: data.refreshToken ?? null,
    }
  } catch {
    return { accessToken: null, refreshToken: null }
  }
}

httpClient.interceptors.request.use((config) => {
  const { accessToken } = getAuth()
  if (accessToken) {
    const headers = (config.headers ?? {}) as AxiosRequestHeaders
    headers.Authorization = `Bearer ${accessToken}`
    config.headers = headers
  }
  return config
})

let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

const processQueue = (token: string) => {
  pendingQueue.forEach((resolve) => resolve(token))
  pendingQueue = []
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status

    if (status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true

      const { refreshToken } = getAuth()
      if (!refreshToken) {
        store.dispatch(logout())
        const cfg = getRuntimeConfig()
        if (cfg.message.autoToastOnError) message.fromAxiosError(error)
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push((token: string) => {
            const rqHeaders = (originalRequest.headers ?? {}) as AxiosRequestHeaders
            rqHeaders.Authorization = `Bearer ${token}`
            originalRequest.headers = rqHeaders
            resolve(httpClient(originalRequest))
          })
        })
      }

      try {
        isRefreshing = true
        const tokens = await authService.refresh(refreshToken)
        store.dispatch(setTokens(tokens))
        isRefreshing = false
        processQueue(tokens.accessToken)
        const rqHeaders2 = (originalRequest.headers ?? {}) as AxiosRequestHeaders
        rqHeaders2.Authorization = `Bearer ${tokens.accessToken}`
        originalRequest.headers = rqHeaders2
        return httpClient(originalRequest)
      } catch (e) {
        isRefreshing = false
        store.dispatch(logout())
        const cfg = getRuntimeConfig()
        if (cfg.message.autoToastOnError) message.fromAxiosError(e)
        return Promise.reject(e)
      }
    }

    const cfg = getRuntimeConfig()
    if (cfg.message.autoToastOnError) message.fromAxiosError(error)

    return Promise.reject(error)
  },
)

export default httpClient 