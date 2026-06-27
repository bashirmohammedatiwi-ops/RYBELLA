import { Dialog, DialogContent, IconButton, Box, Typography } from '@mui/material';
import { Close as CloseIcon, ZoomIn as ZoomIcon } from '@mui/icons-material';
import { getImgBase } from '../services/api';

/**
 * عرض صورة مكبّرة عند النقر
 */
export default function ImageLightbox({ open, src, alt = '', title, onClose }) {
  const fullSrc = src
    ? (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')
      ? src
      : `${getImgBase()}${src}`)
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0,0,0,0.92)',
          boxShadow: 'none',
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1 }}>
        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }} noWrap>
          {title || alt || 'صورة المنتج'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }} aria-label="إغلاق">
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        {fullSrc ? (
          <Box
            component="img"
            src={fullSrc}
            alt={alt}
            sx={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: 2,
            }}
          />
        ) : (
          <Typography color="grey.400">لا توجد صورة</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** غلاف صورة قابلة للنقر مع أيقونة تكبير */
export function ZoomableImage({ children, onZoom, label }) {
  return (
    <Box
      sx={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
      onClick={onZoom}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onZoom?.(); }}
      title={label ? `تكبير: ${label}` : 'تكبير الصورة'}
    >
      {children}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.35)' },
          '&:hover .zoom-hint': { opacity: 1 },
        }}
      >
        <ZoomIcon className="zoom-hint" sx={{ color: 'white', opacity: 0, transition: 'opacity 0.2s', fontSize: 28 }} />
      </Box>
    </Box>
  );
}
