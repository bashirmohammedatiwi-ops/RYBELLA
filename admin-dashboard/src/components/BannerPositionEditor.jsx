import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { IMG_BASE } from '../services/api';

const PREVIEW_WIDTH = 360;
const PREVIEW_HEIGHT = 140;
/** نسبة امتداد الصورة نحو الأطراف لاقتصاص قليل من الجوانب (مطابق لـ Flutter) */
const IMAGE_EDGE_BLEED = 1.08;

/**
 * محرر موضع وحجم الصورة الثانية فوق البانر
 * - image_pos_x: الموضع الأفقي (0=يسار، 100=يمين) - في الأدمن يمين = في الويب يمين
 * - image_pos_y: الموضع العمودي (0=أعلى، 100=أسفل)
 * - image_size: حجم الصورة كنسبة من عرض البانر (30-100)، 0 = تلقائي (62%)
 */
export default function BannerPositionEditor({
  backgroundSrc,
  imageSrc,
  imagePosX = 80,
  imagePosY = 100,
  imageSize = 0,
  onPositionChange,
  onSizeChange,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPosX: 0, startPosY: 0 });

  const getImageUrl = (src) => {
    if (!src) return null;
    if (typeof src === 'object' && src instanceof File) return URL.createObjectURL(src);
    if (typeof src === 'string' && (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('data:'))) return src;
    return `${IMG_BASE}${src}`;
  };

  const [bgUrl, setBgUrl] = useState(null);
  useEffect(() => {
    if (!backgroundSrc) {
      setBgUrl(null);
      return;
    }
    if (typeof backgroundSrc === 'object' && backgroundSrc instanceof File) {
      const url = URL.createObjectURL(backgroundSrc);
      setBgUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBgUrl(getImageUrl(backgroundSrc));
  }, [backgroundSrc]);

  const [imgUrl, setImgUrl] = useState(null);
  useEffect(() => {
    if (!imageSrc) {
      setImgUrl(null);
      return;
    }
    if (typeof imageSrc === 'object' && imageSrc instanceof File) {
      const url = URL.createObjectURL(imageSrc);
      setImgUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setImgUrl(getImageUrl(imageSrc));
  }, [imageSrc]);

  const posX = typeof imagePosX === 'number' ? imagePosX : 80;
  const posY = typeof imagePosY === 'number' ? imagePosY : 70;
  const size = typeof imageSize === 'number' ? imageSize : 0;
  const displaySize = size > 0 ? size : 62;

  const handlePointerDown = useCallback(
    (e) => {
      if (disabled || !imgUrl) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPosX: posX,
        startPosY: posY,
      };
    },
    [disabled, imgUrl, posX, posY]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging || !onPositionChange) return;
      const dx = ((e.clientX - dragStartRef.current.x) / PREVIEW_WIDTH) * 100;
      const dy = ((e.clientY - dragStartRef.current.y) / PREVIEW_HEIGHT) * 100;
      const newX = Math.round(Math.max(0, Math.min(100, dragStartRef.current.startPosX + dx)) * 10) / 10;
      const newY = Math.round(Math.max(0, Math.min(100, dragStartRef.current.startPosY + dy)) * 10) / 10;
      onPositionChange({ x: newX, y: newY });
    },
    [isDragging, onPositionChange]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => handlePointerMove(e);
    const onUp = () => handlePointerUp();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  if (!imgUrl) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        التحكم بالصورة الثانية (فوق البانر)
      </Typography>
      <Typography variant="caption" color="text.secondary">
        اسحب الصورة لوضعها • الصورة تبدأ من الحافة السفلية وتخرج من الأعلى • الموضع هنا = الموضع في التطبيق
      </Typography>

      {/* معاينة البانر - الصورة الثانية على اليمين مثل الويب */}
      <Box
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        sx={{
          position: 'relative',
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          overflowX: 'clip',
          overflowY: 'visible',
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'primary.main',
          bgcolor: 'grey.100',
          cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* الخلفية */}
        {bgUrl ? (
          <Box sx={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden' }}>
            <img src={bgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #F5F5F5 0%, #F0F0F0 100%)',
              borderRadius: 'inherit',
              border: '1px solid rgba(232,93,122,0.3)',
            }}
          />
        )}

        {/* الصورة الثانية - مُثبتة من الأسفل، تخرج للأعلى، أوسع قليلاً لاقتصاص من الجوانب */}
        <Box
          onPointerDown={handlePointerDown}
          sx={{
            position: 'absolute',
            left: `${posX}%`,
            bottom: `${Math.max(0, 100 - posY)}%`,
            transform: 'translateX(-50%)',
            width: `${displaySize * IMAGE_EDGE_BLEED}%`,
            zIndex: 2,
            cursor: disabled ? 'default' : 'grab',
            filter: isDragging ? 'brightness(0.95)' : 'none',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <img
            src={imgUrl}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '180%',
              objectFit: 'contain',
              objectPosition: 'bottom center',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>

      {/* أدوات التحكم الدقيقة */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            الموضع الأفقي (X): {posX}% — يمين ← → يسار
          </Typography>
          <Slider
            value={posX}
            min={0}
            max={100}
            step={1}
            onChange={(_, v) => onPositionChange?.({ x: v, y: posY })}
            disabled={disabled}
            size="small"
            valueLabelDisplay="auto"
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            الموضع العمودي (Y): {posY}% — أعلى ← → أسفل
          </Typography>
          <Slider
            value={posY}
            min={0}
            max={100}
            step={1}
            onChange={(_, v) => onPositionChange?.({ x: posX, y: v })}
            disabled={disabled}
            size="small"
            valueLabelDisplay="auto"
          />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            حجم الصورة (سكيل): {size > 0 ? `${size}%` : 'تلقائي (62%)'}
          </Typography>
          <Slider
            value={size > 0 ? size : 62}
            min={30}
            max={100}
            step={5}
            onChange={(_, v) => onSizeChange?.(v === 62 ? 0 : v)}
            disabled={disabled}
            size="small"
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => (v === 62 ? 'تلقائي' : `${v}%`)}
          />
        </Box>
      </Box>
    </Box>
  );
}
