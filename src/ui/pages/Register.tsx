import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import authService from '../../features/auth/authService'
import message from '../../core/message'

const RegisterPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.register({
        username,
        password,
        name: name || null,
        gender: gender || null,
        role: role ? role : null,
      })
      message.success('Đăng ký thành công. Vui lòng đăng nhập.')
      navigate('/login', { replace: true })
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
          Đăng ký
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Họ và tên"
            size="small"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="gender-label">Giới tính</InputLabel>
            <Select
              labelId="gender-label"
              label="Giới tính"
              value={gender}
              onChange={(e) => setGender(e.target.value as string)}
            >
              <MenuItem value="">Không chọn</MenuItem>
              <MenuItem value="male">Nam</MenuItem>
              <MenuItem value="female">Nữ</MenuItem>
              <MenuItem value="other">Khác</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as string)}
            >
              <MenuItem value="">Không chọn</MenuItem>
              <MenuItem value="admin">Admin - 1</MenuItem>
              <MenuItem value="dao_tao">Đào tạo - 2</MenuItem>
              <MenuItem value="giang_vien">Giảng viên - 3</MenuItem>
              <MenuItem value="sinh_vien">Sinh viên - 4</MenuItem>
            </Select>
          </FormControl>

          <Button type="submit" variant="contained" disabled={loading} fullWidth>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>
          <Button color="secondary" variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate('/login')}>
            Đã có tài khoản? Đăng nhập
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default RegisterPage 