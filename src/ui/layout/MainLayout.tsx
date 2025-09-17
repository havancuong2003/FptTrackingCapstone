import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import InboxIcon from '@mui/icons-material/Inbox'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MenuIcon from '@mui/icons-material/Menu'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import useAuthorization from '../../hooks/useAuthorization'
import { useState } from 'react'
import styles from './MainLayout.module.css'
import { useAppConfig } from '../../core/useAppConfig'
import Collapse from '@mui/material/Collapse'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import type { MenuItemConfig } from '../menu/menu'
import logo from '../../assets/logo.png'
import Button from '@mui/material/Button'
import LogoutIcon from '@mui/icons-material/Logout'
import useAuth from '../../hooks/useAuth'
import Tooltip from '@mui/material/Tooltip'

const drawerWidth = 240

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})
  const { can, hasRole } = useAuthorization()
  const navigate = useNavigate()
  const location = useLocation()
  const { config } = useAppConfig()
  const { logout } = useAuth()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const toggleOpen = (key: string) => {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const canShow = (m: MenuItemConfig) => {
    const okPerm = !m.permission || can(m.permission)
    const okRole = !m.roles || hasRole(m.roles)
    return okPerm && okRole
  }

  const renderMenu = (items: MenuItemConfig[], level = 0) => (
    <List component="div" disablePadding>
      {items.filter(canShow).map((item) => {
        const hasChildren = Array.isArray(item.children) && item.children.length > 0
        if (hasChildren) {
          const isOpen = openKeys[item.key] ?? false
          return (
            <Box key={item.key}>
              <ListItem disablePadding>
                <ListItemButton onClick={() => toggleOpen(item.key)} sx={{ pl: 2 + level * 2 }}>
                  <ListItemIcon>
                    <InboxIcon />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                  {isOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                {renderMenu(item.children!, level + 1)}
              </Collapse>
            </Box>
          )
        }
        return (
          <ListItem key={item.key} disablePadding>
            <ListItemButton selected={location.pathname === item.path} onClick={() => item.path && navigate(item.path)} sx={{ pl: 2 + level * 2 }}>
              <ListItemIcon>
                <InboxIcon />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        )
      })}
    </List>
  )

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      {renderMenu(config.menus || [])}
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#0b1220', backgroundImage: 'linear-gradient(90deg, #0b1220 0%, #1f2937 100%)', color: '#fff' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box component="img" src={logo} alt={config.appTitle} sx={{ height: { xs: 40, sm: 56 }, mr: { xs: 1, sm: 1.5 } }} />
          <Typography variant="h6" noWrap component="div" className={styles.headerTitle} sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {config.appTitle}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Đăng xuất">
            <IconButton
              color="inherit"
              onClick={logout}
              aria-label="logout"
              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={logout}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Đăng xuất
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="menu folders">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }} className={styles.main}>
        <Toolbar />
        <Outlet />
        <Divider sx={{ my: 2 }} />
        <Box component="footer" className={styles.footer}>
          <Typography variant="body2" color="text.secondary">
            {config.footerText}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default MainLayout 