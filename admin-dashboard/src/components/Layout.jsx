import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  Palette as VariantsIcon,
  Category as CategoryIcon,
  LocalOffer as BrandIcon,
  ShoppingCart as OrdersIcon,
  People as PeopleIcon,
  ConfirmationNumber as CouponIcon,
  RateReview as ReviewIcon,
  LocalShipping as DeliveryIcon,
  Assessment as ReportIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 260;

const menuItems = [
  { path: '/', label: 'لوحة التحكم', icon: <DashboardIcon /> },
  { path: '/products', label: 'المنتجات', icon: <ProductsIcon /> },
  { path: '/brands', label: 'العلامات التجارية', icon: <BrandIcon /> },
  { path: '/categories', label: 'الفئات', icon: <CategoryIcon /> },
  { path: '/orders', label: 'الطلبات', icon: <OrdersIcon /> },
  { path: '/customers', label: 'العملاء', icon: <PeopleIcon /> },
  { path: '/coupons', label: 'الكوبونات', icon: <CouponIcon /> },
  { path: '/reviews', label: 'المراجعات', icon: <ReviewIcon /> },
  { path: '/delivery-zones', label: 'مناطق التوصيل', icon: <DeliveryIcon /> },
  { path: '/reports', label: 'التقارير', icon: <ReportIcon /> },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ pt: 2 }}>
      <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: 700, color: '#c2185b' }}>
        Rybella Iraq
      </Typography>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              sx={{
                '&.active': {
                  bgcolor: 'rgba(194, 24, 91, 0.12)',
                  color: '#c2185b',
                  borderRight: '3px solid #c2185b',
                },
              }}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="تسجيل الخروج" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', direction: 'rtl' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mr: { md: `${drawerWidth}px` },
          ml: 0,
          bgcolor: '#880e4f',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, ml: 'auto', display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, textAlign: 'right' }}>
            مرحباً، {user?.name}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              right: 0,
              left: 'auto',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              top: 64,
              right: 0,
              left: 'auto',
              borderLeft: '1px solid #eee',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          ml: 0,
          mr: { md: 0 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
