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
  Button,
} from '@mui/material';
import {
  AttachMoney as SalesIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Warning as LowStockIcon,
  TrendingUp as TopIcon,
  ArrowForward as ForwardIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, lRes, tRes, cRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getLowStock?.().catch(() => ({ data: [] })),
          dashboardAPI.getTopProducts?.().catch(() => ({ data: [] })),
          dashboardAPI.getSalesChart?.(14).catch(() => ({ data: [] })),
        ]);
        setStats(sRes?.data || {});
        setLowStock(Array.isArray(lRes?.data) ? lRes.data : []);
        setTopProducts(Array.isArray(tRes?.data) ? tRes.data : []);
        setChartData(Array.isArray(cRes?.data) ? cRes.data : []);
      } catch (e) {
        setStats({ total_sales: 0, total_orders: 0, total_customers: 0 });
        setLowStock([]);
        setTopProducts([]);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress sx={{ color: '#5e35b1' }} />
      </Box>
    );
  }

  const s = stats || {};
  const formatSales = (v) => (v ? `${Number(v).toLocaleString('ar-IQ')} د.ع` : '0 د.ع');

  const SummaryCard = ({ title, value, subtitle, change, gradient, chartValues }) => {
    const hasChart = chartValues && chartValues.length > 0;
    return (
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden', height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {change && (
            <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <TrendingUp sx={{ fontSize: 14 }} /> {change}
            </Typography>
          )}
          {hasChart && (
            <Box sx={{ height: 48, mt: 1.5 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartValues} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Bar dataKey="v" fill={gradient || '#5e35b1'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const barData = chartData.slice(-7).map((d) => ({ name: d.date?.slice(5) || '', v: Number(d.sales) || 0 }));

  return (
    <Box sx={{ direction: 'rtl' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#1a1a2e' }}>
        لوحة التحكم
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #00c853 0%, #69f0ae 100%)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(0,200,83,0.3)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
            onClick={() => navigate('/reports')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>إجمالي المبيعات</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                    {formatSales(s.total_sales)}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2, p: 1.5 }}>
                  <SalesIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(255,152,0,0.3)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
            onClick={() => navigate('/orders')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>إجمالي الطلبات</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                    {s.total_orders || 0}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2, p: 1.5 }}>
                  <OrdersIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #0097a7 0%, #4dd0e1 100%)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(0,151,167,0.3)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' },
            }}
            onClick={() => navigate('/customers')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>إجمالي العملاء</Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                    {s.total_customers || 0}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2, p: 1.5 }}>
                  <CustomersIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="المبيعات أسبوعياً"
            value={formatSales(chartData.reduce((a, d) => a + (Number(d.sales) || 0), 0))}
            subtitle="آخر أسبوع"
            chartValues={barData}
            gradient="#5e35b1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="الطلبات"
            value={s.total_orders || 0}
            subtitle="هذا الشهر"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="العملاء الجدد"
            value={s.total_customers || 0}
            subtitle="إجمالي المسجلين"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="منتجات قليلة المخزون"
            value={s.low_stock_count ?? lowStock.length ?? 0}
            subtitle="تحتاج إعادة تعبئة"
          />
        </Grid>

        {chartData.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight={700} color="#1a1a2e">
                  تطور المبيعات (آخر 14 يوم)
                </Typography>
                <Box sx={{ height: 280, width: '100%' }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5e35b1" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#7e57c2" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000)}k`} />
                      <Tooltip formatter={(v) => [formatSales(v), 'المبيعات']} />
                      <Area type="monotone" dataKey="sales" stroke="#5e35b1" fill="url(#salesGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} color="#1a1a2e">
                  منتجات قليلة المخزون
                </Typography>
                {lowStock.length > 0 && (
                  <Button size="small" endIcon={<ForwardIcon sx={{ transform: 'scaleX(-1)' }} />} onClick={() => navigate('/reports')}>
                    عرض الكل
                  </Button>
                )}
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>المنتج / العنصر</TableCell>
                    <TableCell align="left" sx={{ fontWeight: 600 }}>المخزون</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStock.slice(0, 5).map((row) => (
                    <TableRow key={row.id} hover sx={{ cursor: 'default' }}>
                      <TableCell>{row.shade_name || row.product_name}</TableCell>
                      <TableCell align="left">
                        <Chip label={row.stock} size="small" color={row.stock === 0 ? 'error' : 'warning'} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {lowStock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} color="#1a1a2e">
                  الأكثر مبيعاً
                </Typography>
                <TopIcon sx={{ color: '#00c853' }} />
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>المنتج</TableCell>
                    <TableCell align="left" sx={{ fontWeight: 600 }}>الكمية المباعة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts.slice(0, 5).map((row) => (
                    <TableRow key={row.variant_id || row.id} hover>
                      <TableCell>{row.product_name || row.shade_name}</TableCell>
                      <TableCell align="left">{row.total_quantity || 0}</TableCell>
                    </TableRow>
                  ))}
                  {topProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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
