import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useAppDispatch } from '../../store/hooks'
import { loginSucceeded, setUser } from '../../features/auth/authSlice'
import { mockUsers } from '../../mocks/users'
import message from '../../core/message'

const RoleSwitcher = () => {
  const dispatch = useAppDispatch()

  const handleSwitch = (role: keyof typeof mockUsers) => {
    const rec = mockUsers[role]
    localStorage.setItem('auth.role', role)
    dispatch(loginSucceeded({ user: rec.user, tokens: rec.tokens }))
    dispatch(setUser(rec.user))
    message.success(`Đã chuyển sang role: ${role}`)
  }

  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mr: 1 }}>Chuyển nhanh role:</Typography>
      <Button size="small" variant="outlined" onClick={() => handleSwitch('admin')}>Admin</Button>
      <Button size="small" variant="outlined" onClick={() => handleSwitch('dao_tao')}>Đào tạo</Button>
      <Button size="small" variant="outlined" onClick={() => handleSwitch('giang_vien')}>Giảng viên</Button>
      <Button size="small" variant="outlined" onClick={() => handleSwitch('sinh_vien')}>Sinh viên</Button>
    </Stack>
  )
}

export default RoleSwitcher 