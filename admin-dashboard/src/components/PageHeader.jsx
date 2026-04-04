import { Box, Typography, Button } from '@mui/material';

/**
 * ترويسة موحدة للصفحات
 */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
    </Box>
  );
}
