import { Link } from 'react-router-dom'
import { Box, Typography, Container } from '@mui/material'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        mt: 6,
        bgcolor: 'grey.100',
        borderTop: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="primary.main">Rybella Iraq</Typography>
            <Typography variant="body2" color="text.secondary">تجميلك يبدأ هنا</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link to="/products" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography variant="body2">المنتجات</Typography>
            </Link>
            <Link to="/cart" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography variant="body2">السلة</Typography>
            </Link>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Rybella Iraq. جميع الحقوق محفوظة.
        </Typography>
      </Container>
    </Box>
  )
}
