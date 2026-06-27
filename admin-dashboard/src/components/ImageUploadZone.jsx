import { useRef } from 'react';
import { Box, Typography, IconButton, Button, alpha } from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AddPhotoAlternate as AddIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { getImgBase } from '../services/api';

function resolveSrc(src) {
  if (!src) return null;
  if (src instanceof File) return URL.createObjectURL(src);
  if (typeof src === 'string') {
    if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('/')) return src;
    return `${getImgBase()}${src}`;
  }
  return null;
}

function UploadTile({ label, hint, preview, onPick, onClear, accent = '#5e35b1', tall = false }) {
  const inputRef = useRef(null);
  const imgSrc = resolveSrc(preview);

  return (
    <Box
      onClick={() => inputRef.current?.click()}
      sx={{
        position: 'relative',
        borderRadius: 3,
        border: '2px dashed',
        borderColor: imgSrc ? 'transparent' : alpha(accent, 0.35),
        bgcolor: imgSrc ? 'grey.900' : alpha(accent, 0.04),
        minHeight: tall ? 220 : 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { borderColor: accent, bgcolor: imgSrc ? 'grey.900' : alpha(accent, 0.08) },
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { onPick?.(e.target.files?.[0] || null); e.target.value = ''; }} />
      {imgSrc ? (
        <>
          <Box component="img" src={imgSrc} alt={label} sx={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: tall ? 220 : 140 }} />
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.35)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { opacity: 1 } }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>تغيير الصورة</Typography>
          </Box>
          {onClear && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              sx={{ position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          )}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', p: 2 }}>
          <UploadIcon sx={{ fontSize: 36, color: accent, mb: 1 }} />
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
          {hint && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{hint}</Typography>}
        </Box>
      )}
    </Box>
  );
}

/** منطقة رفع الصورة الرئيسية + صور إضافية */
export default function ImageUploadZone({
  mainImage,
  onMainChange,
  existingMain,
  onClearExistingMain,
  extraImages = [],
  onExtraChange,
  existingExtras = [],
}) {
  const extraInputRef = useRef(null);

  const handleExtraPick = (files) => {
    if (!files?.length) return;
    onExtraChange?.([...extraImages, ...Array.from(files)]);
  };

  const removeExtra = (index) => {
    onExtraChange?.(extraImages.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <StarIcon sx={{ color: '#E85D7A', fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={700}>الصورة الرئيسية</Typography>
      </Box>
      <UploadTile
        label="اسحبي الصورة أو انقري للرفع"
        hint="يفضل 800×800 بكسل"
        preview={mainImage || existingMain}
        onPick={onMainChange}
        onClear={mainImage ? () => onMainChange(null) : existingMain ? onClearExistingMain : undefined}
        accent="#E85D7A"
        tall
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon sx={{ color: '#5e35b1', fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={700}>صور إضافية</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => extraInputRef.current?.click()}>
          إضافة صور
        </Button>
        <input ref={extraInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleExtraPick(e.target.files)} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1.5 }}>
        {existingExtras.map((img, i) => (
          <Box key={`ex-${i}`} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', aspectRatio: '1', border: '1px solid', borderColor: 'grey.200' }}>
            <Box component="img" src={resolveSrc(img)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', py: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'white', fontSize: 10, display: 'block', textAlign: 'center' }}>حالية</Typography>
            </Box>
          </Box>
        ))}
        {extraImages.map((file, i) => (
          <Box key={`new-${i}`} sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', aspectRatio: '1', border: '2px solid', borderColor: 'success.light' }}>
            <Box component="img" src={resolveSrc(file)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <IconButton
              size="small"
              onClick={() => removeExtra(i)}
              sx={{ position: 'absolute', top: 4, left: 4, bgcolor: 'rgba(255,255,255,0.9)', width: 24, height: 24 }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} color="error" />
            </IconButton>
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'success.main', py: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'white', fontSize: 10, display: 'block', textAlign: 'center' }}>جديدة</Typography>
            </Box>
          </Box>
        ))}
        {!existingExtras.length && !extraImages.length && (
          <Box
            onClick={() => extraInputRef.current?.click()}
            sx={{
              aspectRatio: '1',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'grey.300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              bgcolor: 'grey.50',
              '&:hover': { borderColor: 'primary.main', bgcolor: alpha('#5e35b1', 0.04) },
            }}
          >
            <AddIcon sx={{ color: 'grey.400' }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
