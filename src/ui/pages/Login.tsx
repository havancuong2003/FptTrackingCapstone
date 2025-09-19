import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import useAuth from '../../hooks/useAuth'
import message from '../../core/message'

type LoginLocationState = { from?: { pathname?: string } }

const LoginPage = () => {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() as { state: LoginLocationState }
  const from = location.state?.from?.pathname ?? '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
      message.success('Đăng nhập thành công')
      navigate(from, { replace: true })
    } catch (err) {
      message.fromAxiosError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Paper sx={{ p: 4, width: 360 }} elevation={3}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Đăng nhập a
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Username"
            size="small"
            fullWidth
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            size="small"
            type="password"
            fullWidth
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" disabled={loading} fullWidth>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          <Button color="secondary" variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/register')}>
            Chưa có tài khoản? Đăng ký
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default LoginPage 