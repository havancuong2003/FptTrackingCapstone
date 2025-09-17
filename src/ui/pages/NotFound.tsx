import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useNavigate } from 'react-router-dom'

const NotFoundPage = () => {
  const navigate = useNavigate()
  return (
    <Box sx={{ py: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h4">404 - Không tìm thấy trang</Typography>
        <Typography variant="body2" color="text.secondary">
          URL bạn truy cập không tồn tại hoặc đã được di chuyển.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>Về Dashboard</Button>
      </Stack>
    </Box>
  )
}

export default NotFoundPage 