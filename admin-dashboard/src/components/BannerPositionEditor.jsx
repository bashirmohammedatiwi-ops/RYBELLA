import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { IMG_BASE } from '../services/api';

const PREVIEW_WIDTH = 360;
const PREVIEW_HEIGHT = 180;

/**
 * محرر موضع صورة PNG فوق البانر - قابل للسحب
 * image_pos_x, image_pos_y: نسبة مئوية (0-100)، يمكن أن تكون سالبة للخروج عن الإطار
 * image_size: عرض الصورة كنسبة من عرض البانر (0 = تلقائي)
 */
export default function BannerPositionEditor({
  backgroundSrc,
  imageSrc,
  imagePosX = 100,
  imagePosY = 50,
  imageSize = 0,
  onPositionChange,
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

  const posX = typeof imagePosX === 'number' ? imagePosX : 100;
  const posY = typeof imagePosY === 'number' ? imagePosY : 50;
  const size = typeof imageSize === 'number' ? imageSize : 0;

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
      const newX = Math.round((dragStartRef.current.startPosX + dx) * 10) / 10;
      const newY = Math.round((dragStartRef.current.startPosY + dy) * 10) / 10;
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" color="text.secondary">
        اسحب الصورة PNG لوضعها - يمكن أن تخرج عن إطار البانر
      </Typography>
      <Box
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        sx={{
          position: 'relative',
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          overflow: 'visible',
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'grey.300',
          bgcolor: 'grey.100',
          cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* الخلفية */}
        {bgUrl && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              overflow: 'hidden',
            }}
          >
            <img
              src={bgUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
        )}
        {!bgUrl && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #E85D7A 0%, #D14A66 100%)',
              borderRadius: 'inherit',
            }}
          />
        )}
        {/* صورة PNG - قابلة للسحب */}
        <Box
          onPointerDown={handlePointerDown}
          sx={{
            position: 'absolute',
            left: `${posX}%`,
            top: `${posY}%`,
            transform: 'translate(-50%, -50%)',
            width: size > 0 ? `${size}%` : 'auto',
            maxWidth: size > 0 ? `${size}%` : '70%',
            height: size > 0 ? 'auto' : 'auto',
            maxHeight: '120%',
            zIndex: 2,
            cursor: disabled ? 'default' : 'grab',
            filter: isDragging ? 'brightness(0.95)' : 'none',
            transition: isDragging ? 'none' : 'filter 0.2s',
          }}
        >
          <img
            src={imgUrl}
            alt=""
            draggable={false}
            style={{
              width: size > 0 ? '100%' : 'auto',
              height: size > 0 ? 'auto' : '100%',
              maxHeight: '200px',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        الموضع: X={posX}% ، Y={posY}%
      </Typography>
    </Box>
  );
}
