import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { dashboardAPI, ordersAPI, productsAPI, usersAPI } from '../services/api';

const downloadCSV = (rows, filename) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, lRes, tRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getLowStock().catch(() => ({ data: [] })),
          dashboardAPI.getTopProducts().catch(() => ({ data: [] })),
        ]);
        setStats(sRes?.data || {});
        setLowStock(Array.isArray(lRes?.data) ? lRes.data : []);
        setTopProducts(Array.isArray(tRes?.data) ? tRes.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExportOrders = async () => {
    try {
      const { data } = await ordersAPI.getAll();
      const rows = (Array.isArray(data) ? data : []).map((o) => ({
        id: o.id, final_price: o.final_price, status: o.status, payment_method: o.payment_method,
        customer_name: o.customer_name, customer_phone: o.customer_phone, created_at: o.created_at,
      }));
      downloadCSV(rows, `orders_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportProducts = async () => {
    try {
      const { data } = await productsAPI.getAll();
      const rows = (Array.isArray(data) ? data : []).map((p) => ({
        id: p.id, name: p.name, brand_name: p.brand_name, category_name: p.category_name, min_price: p.min_price,
      }));
      downloadCSV(rows, `products_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCustomers = async () => {
    try {
      const { data } = await usersAPI.getAll();
      const rows = (Array.isArray(data) ? data.filter((u) => u.role === 'customer') : []).map((c) => ({
        id: c.id, name: c.name, email: c.email, phone: c.phone, created_at: c.created_at,
      }));
      downloadCSV(rows, `customers_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;
  if (!stats) return null;

  return (
    <Box sx={{ direction: 'rtl' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>التقارير</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportOrders}>تصدير الطلبات CSV</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportProducts}>تصدير المنتجات CSV</Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExportCustomers}>تصدير العملاء CSV</Button>
        </Box>
      </Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">إجمالي المبيعات</Typography>
              <Typography variant="h5">{Number(stats.total_sales || 0).toLocaleString('ar-IQ')} د.ع</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">إجمالي الطلبات</Typography>
              <Typography variant="h5">{stats.total_orders || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">إجمالي العملاء</Typography>
              <Typography variant="h5">{stats.total_customers || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">منتجات قليلة المخزون</Typography>
              <Typography variant="h5" color="warning.main">{stats.low_stock_count ?? lowStock.length ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Typography variant="h6" sx={{ mb: 2 }}>منتجات منخفضة المخزون</Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>المنتج</TableCell>
              <TableCell>الظل</TableCell>
              <TableCell>الكمية</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(lowStock.length ? lowStock : (stats.low_stock_products || [])).map((p) => (
              <TableRow key={p.id || p.variant_id}>
                <TableCell>{p.product_name}</TableCell>
                <TableCell>{p.shade_name}</TableCell>
                <TableCell>{p.stock}</TableCell>
              </TableRow>
            ))}
            {!lowStock.length && !(stats.low_stock_products || []).length && (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>لا توجد منتجات منخفضة المخزون</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="h6" sx={{ mb: 2 }}>الأكثر مبيعاً</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>المنتج</TableCell>
              <TableCell>الظل</TableCell>
              <TableCell>الكمية المباعة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(topProducts.length ? topProducts : (stats.top_selling_products || [])).map((p) => (
              <TableRow key={p.variant_id || p.id}>
                <TableCell>{p.product_name}</TableCell>
                <TableCell>{p.shade_name}</TableCell>
                <TableCell>{p.total_quantity ?? p.total_sold}</TableCell>
              </TableRow>
            ))}
            {!topProducts.length && !(stats.top_selling_products || []).length && (
              <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>لا توجد بيانات</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
