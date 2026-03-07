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
  TableRow,
  TableHead,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  AttachMoney as SalesIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Warning as LowStockIcon,
  TrendingUp as TopIcon,
} from '@mui/icons-material';
import { dashboardAPI } from '../services/api';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box sx={{ color, opacity: 0.8 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, lRes, tRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getLowStock?.() || Promise.resolve({ data: [] }),
          dashboardAPI.getTopProducts?.() || Promise.resolve({ data: [] }),
        ]);
        setStats(sRes.data);
        setLowStock(lRes.data || []);
        setTopProducts(tRes.data || []);
      } catch (e) {
        setStats({ total_sales: 0, total_orders: 0, total_customers: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  const s = stats || {};

  return (
    <Box sx={{ direction: 'rtl' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        لوحة التحكم
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="إجمالي المبيعات"
            value={`${(s.total_sales || 0).toLocaleString()} د.ع`}
            icon={<SalesIcon sx={{ fontSize: 48 }} />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="إجمالي الطلبات"
            value={s.total_orders || 0}
            icon={<OrdersIcon sx={{ fontSize: 48 }} />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="إجمالي العملاء"
            value={s.total_customers || 0}
            icon={<CustomersIcon sx={{ fontSize: 48 }} />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="منتجات قليلة المخزون"
            value={s.low_stock_count || lowStock.length || 0}
            icon={<LowStockIcon sx={{ fontSize: 48 }} />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                منتجات قليلة المخزون
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>المنتج / الظل</TableCell>
                    <TableCell align="left">المخزون</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(lowStock.length ? lowStock : []).slice(0, 5).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.shade_name || row.product_name}</TableCell>
                      <TableCell align="left">
                        <Chip
                          label={row.stock}
                          size="small"
                          color={row.stock === 0 ? 'error' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {lowStock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        لا توجد منتجات قليلة المخزون
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                الأكثر مبيعاً
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>المنتج</TableCell>
                    <TableCell align="left">الكمية</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(topProducts.length ? topProducts : []).slice(0, 5).map((row) => (
                    <TableRow key={row.variant_id || row.id}>
                      <TableCell>{row.product_name || row.shade_name}</TableCell>
                      <TableCell align="left">{row.total_quantity || 0}</TableCell>
                    </TableRow>
                  ))}
                  {topProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        لا توجد بيانات بعد
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
