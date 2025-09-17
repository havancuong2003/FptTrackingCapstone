import type { MenuItemConfig } from '../ui/menu/menu'
import { menuItems as defaultMenuItems } from '../ui/menu/menu'

export interface MessageCodeMapEntry {
  text: string
  type?: 'success' | 'error' | 'info' | 'warning'
}

export interface AppConfig {
  appTitle: string
  footerText?: string
  menus?: MenuItemConfig[]
  message: {
    autoToastOnError: boolean
    codeMap: Record<string, MessageCodeMapEntry>
  }
}

export const defaultAppConfig: AppConfig = {
  appTitle: 'Tracking System',
  footerText: '© 2025 Tracking System',
  menus: defaultMenuItems,
  message: {
    autoToastOnError: true,
    codeMap: {
      HTTP_400: { text: 'Yêu cầu không hợp lệ', type: 'error' },
      HTTP_401: { text: 'Phiên đăng nhập hết hạn hoặc không hợp lệ', type: 'error' },
      HTTP_403: { text: 'Bạn không có quyền truy cập', type: 'error' },
      HTTP_404: { text: 'Không tìm thấy tài nguyên', type: 'error' },
      HTTP_500: { text: 'Lỗi máy chủ, vui lòng thử lại sau', type: 'error' },
      AUTH_INVALID: { text: 'Tên đăng nhập hoặc mật khẩu không đúng', type: 'error' },
      AUTH_REQUIRED: { text: 'Vui lòng đăng nhập để tiếp tục', type: 'error' },
      TRACKING_NOT_FOUND: { text: 'Không tìm thấy bản ghi tracking', type: 'error' },
      NETWORK_ERROR: { text: 'Lỗi mạng, vui lòng kiểm tra kết nối', type: 'error' },
      UNKNOWN_ERROR: { text: 'Đã xảy ra lỗi, vui lòng thử lại', type: 'error' },
    },
  },
} 