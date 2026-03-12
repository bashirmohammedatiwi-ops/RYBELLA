import { useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import { IMG_BASE } from '../services/api';

const sizes = {
  xs: 32,
  sm: 48,
  md: 64,
  lg: 96,
  xl: 140,
};

/**
 * مكون موحد لعرض الصور في لوحة التحكم
 * @param {string} src - مسار الصورة (بدون IMG_BASE يضاف تلقائياً)
 * @param {string} size - xs | sm | md | lg | xl
 * @param {string} fit - cover | contain
 * @param {function} onClick - عند النقر (اختياري - للعرض الموسع)
 * @param {object} sx - تنسيقات إضافية
 */
export default function ImageDisplay({
  src,
  size = 'md',
  fit = 'cover',
  width,
  height,
  onClick,
  alt = '',
  sx = {},
  baseUrl = IMG_BASE,
}) {
  const [loading, setLoading] = useState(!!src);
  const [error, setError] = useState(false);
  const baseDim = sizes[size] || sizes.md;
  const w = width ?? baseDim;
  const h = height ?? baseDim;
  const isClickable = typeof onClick === 'function';

  const fullSrc = src ? (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/') ? src : `${baseUrl}${src}`) : null;

  if (!fullSrc || error) {
    return (
      <Box
        sx={{
          width: w,
          height: h,
          minWidth: w,
          minHeight: h,
          borderRadius: 2,
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed',
          borderColor: 'grey.300',
          ...sx,
        }}
      >
        <ImageIcon sx={{ fontSize: Math.min(w, h) * 0.4, color: 'grey.400' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: w,
        height: h,
        minWidth: w,
        minHeight: h,
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'grey.200',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        '&:hover': isClickable
          ? {
              boxShadow: '0 4px 16px rgba(94,53,177,0.25)',
              transform: 'scale(1.05)',
              borderColor: 'primary.main',
            }
          : {},
        ...sx,
      }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
    >
      {loading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ position: 'absolute', inset: 0 }}
        />
      )}
      <Box
        component="img"
        src={fullSrc}
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: fit,
          display: loading ? 'none' : 'block',
        }}
      />
    </Box>
  );
}
