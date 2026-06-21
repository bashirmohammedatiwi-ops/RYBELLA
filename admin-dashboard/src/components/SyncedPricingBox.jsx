import { Box, Typography } from '@mui/material';

export function formatAdminPrice(value) {
  if (value === '' || value == null || !Number.isFinite(Number(value))) return '—';
  return `${Number(value).toLocaleString('ar-IQ')} د.ع`;
}

export function getAdminPricing(data) {
  const price = Number(data?.price);
  const original = Number(data?.original_price);
  const discount = Number(data?.discount_percent);
  const hasDiscount = discount > 0 && original > price && price > 0;
  return {
    price: Number.isFinite(price) ? price : null,
    originalPrice: hasDiscount ? original : (Number.isFinite(price) ? price : null),
    finalPrice: Number.isFinite(price) ? price : null,
    discountPercent: hasDiscount ? discount : 0,
    hasDiscount,
    stock: data?.stock,
  };
}

export default function SyncedPricingBox({ data, compact = false }) {
  const p = getAdminPricing(data);
  if (p.finalPrice == null && (data?.stock === '' || data?.stock == null)) {
    return (
      <Typography variant="body2" color="text.secondary">
        يُجلب تلقائياً بعد حفظ الباركود
      </Typography>
    );
  }

  const gridSx = compact
    ? { display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.5 }
    : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mt: 1 };

  return (
    <Box sx={gridSx}>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">السعر قبل الخصم</Typography>
        <Typography variant="body2" fontWeight={600}>{formatAdminPrice(p.originalPrice)}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">السعر بعد الخصم</Typography>
        <Typography variant="body2" fontWeight={600} color={p.hasDiscount ? 'error.main' : 'text.primary'}>
          {formatAdminPrice(p.finalPrice)}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">نسبة الخصم</Typography>
        <Typography variant="body2" fontWeight={600}>{p.hasDiscount ? `${p.discountPercent}%` : '—'}</Typography>
      </Box>
      {data?.stock !== '' && data?.stock != null && (
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">المخزون</Typography>
          <Typography variant="body2" fontWeight={600}>{data.stock}</Typography>
        </Box>
      )}
    </Box>
  );
}
