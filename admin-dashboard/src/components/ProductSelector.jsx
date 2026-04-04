import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Chip,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { productsAPI, IMG_BASE } from '../services/api';
import ImageDisplay from './ImageDisplay';

/**
 * مكون لاختيار المنتجات عبر البحث بدلاً من إدخال المعرفات يدوياً
 * @param {number[]} value - مصفوفة معرفات المنتجات المختارة
 * @param {function} onChange - (ids: number[]) => void
 * @param {string} placeholder - نص حقل البحث
 */
export default function ProductSelector({ value = [], onChange, placeholder = 'ابحث عن منتج بالاسم...' }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [open, setOpen] = useState(false);

  const selectedIds = Array.isArray(value) ? value : [];

  const fetchProducts = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await productsAPI.getAll({ search: query.trim(), status: 'published' });
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(search), 350);
    return () => clearTimeout(t);
  }, [search, fetchProducts]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setSelectedProducts([]);
      return;
    }
    productsAPI
      .getAll({ product_ids: selectedIds.join(',') })
      .then(({ data }) => setSelectedProducts(Array.isArray(data) ? data : []))
      .catch(() => setSelectedProducts([]));
  }, [selectedIds.join(',')]);

  const handleAdd = (product) => {
    if (selectedIds.includes(product.id)) return;
    const next = [...selectedIds, product.id];
    onChange?.(next);
    setSearch('');
    setResults([]);
    setOpen(false);
  };

  const handleRemove = (id) => {
    onChange?.(selectedIds.filter((i) => i !== id));
  };

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: loading && (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ),
        }}
      />
      {open && search.trim().length >= 2 && (
        <Paper
          elevation={4}
          sx={{
            maxHeight: 280,
            overflow: 'auto',
            mt: 0.5,
            position: 'relative',
            zIndex: 10,
          }}
        >
          {results.length === 0 && !loading ? (
            <Typography sx={{ p: 2, color: 'text.secondary' }}>لا توجد نتائج</Typography>
          ) : (
            <List dense>
              {results.map((p) => (
                <ListItem key={p.id} disablePadding>
                  <ListItemButton onClick={() => handleAdd(p)} disabled={selectedIds.includes(p.id)}>
                    <ListItemAvatar>
                      <ImageDisplay src={p.main_image} width={40} height={40} fit="cover" />
                    </ListItemAvatar>
                    <ListItemText
                      primary={p.name}
                      secondary={p.brand_name ? `براند: ${p.brand_name}` : null}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                    {selectedIds.includes(p.id) ? (
                      <Chip label="مضاف" size="small" color="success" />
                    ) : (
                      <AddIcon color="action" fontSize="small" />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
      {selectedProducts.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
          {selectedProducts.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              onDelete={() => handleRemove(p.id)}
              size="small"
              sx={{ maxWidth: 200 }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
