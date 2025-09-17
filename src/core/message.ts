import toast from 'react-hot-toast'
import type { AxiosError } from 'axios'
import { getRuntimeConfig } from './appRuntime'

export type MessageType = 'success' | 'error' | 'info' | 'warning'

const show = (type: MessageType, text: string) => {
  switch (type) {
    case 'success':
      toast.success(text)
      break
    case 'error':
      toast.error(text)
      break
    case 'warning':
      toast(text, { icon: '⚠️' })
      break
    default:
      toast(text)
  }
}

export const message = {
  success(text: string) {
    show('success', text)
  },
  error(text: string) {
    show('error', text)
  },
  info(text: string) {
    show('info', text)
  },
  warning(text: string) {
    show('warning', text)
  },
  byCode(code: string, fallbackText?: string) {
    const cfg = getRuntimeConfig()
    const entry = cfg.message.codeMap[code]
    if (entry) {
      show(entry.type || 'info', entry.text)
      return entry.text
    }
    if (fallbackText) {
      show('info', fallbackText)
      return fallbackText
    }
    show('info', code)
    return code
  },
  fromAxiosError(error: unknown) {
    const cfg = getRuntimeConfig()
    const err = error as AxiosError<{ code?: string; message?: string }>
    const status = err.response?.status
    const data = err.response?.data
    const code: string | undefined = data?.code || (status ? `HTTP_${status}` : undefined)
    const messageText: string | undefined = data?.message

    if (code) {
      const entry = cfg.message.codeMap[code]
      if (entry) {
        show(entry.type || 'error', entry.text)
        return entry.text
      }
    }

    if (messageText) {
      show('error', messageText)
      return messageText
    }

    if (status) {
      const statusEntry = cfg.message.codeMap[`HTTP_${status}`]
      if (statusEntry) {
        show(statusEntry.type || 'error', statusEntry.text)
        return statusEntry.text
      }
    }

    const fallback = cfg.message.codeMap['UNKNOWN_ERROR']?.text || 'Đã xảy ra lỗi'
    show('error', fallback)
    return fallback
  },
}

export default message 