import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  Category as CategoryIcon,
  SubdirectoryArrowRight as SubcategoryIcon,
  LocalOffer as BrandIcon,
  ShoppingCart as OrdersIcon,
  People as PeopleIcon,
  ConfirmationNumber as CouponIcon,
  RateReview as ReviewIcon,
  LocalShipping as DeliveryIcon,
  Assessment as ReportIcon,
  ViewCarousel as BannerIcon,
  Percent as OfferIcon,
  Logout as LogoutIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  HelpOutline as HelpIcon,
  ChevronLeft as ArrowIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 280;

const mainNav = [
  { path: '/', label: 'لوحة التحكم', icon: <DashboardIcon /> },
  { path: '/products', label: 'المنتجات', icon: <ProductsIcon /> },
  { path: '/orders', label: 'الطلبات', icon: <OrdersIcon /> },
  { path: '/customers', label: 'العملاء', icon: <PeopleIcon /> },
];

const settingsNav = [
  { path: '/brands', label: 'العلامات التجارية', icon: <BrandIcon /> },
  { path: '/categories', label: 'الفئات', icon: <CategoryIcon /> },
  { path: '/subcategories', label: 'الفئات الثانوية', icon: <SubcategoryIcon /> },
  { path: '/banners', label: 'البانرات', icon: <BannerIcon /> },
  { path: '/offers', label: 'العروض', icon: <OfferIcon /> },
  { path: '/coupons', label: 'الكوبونات', icon: <CouponIcon /> },
  { path: '/reviews', label: 'المراجعات', icon: <ReviewIcon /> },
  { path: '/delivery-zones', label: 'مناطق التوصيل', icon: <DeliveryIcon /> },
  { path: '/reports', label: 'التقارير', icon: <ReportIcon /> },
  { path: '/settings', label: 'الإعدادات', icon: <SettingsIcon /> },
  { path: '/profile', label: 'الملف الشخصي', icon: <ProfileIcon /> },
];

const NavItem = ({ item, onClick }) => (
  <ListItem disablePadding sx={{ px: 1.5 }}>
    <ListItemButton
      component={NavLink}
      to={item.path}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        py: 1.25,
        '&.active': {
          bgcolor: 'rgba(232, 93, 122, 0.12)',
          color: 'primary.main',
          '& .MuiListItemIcon-root': { color: 'primary.main' },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 44, color: 'inherit' }}>{item.icon}</ListItemIcon>
      <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }} />
      <ArrowIcon sx={{ fontSize: 20, opacity: 0.7, transform: 'scaleX(-1)' }} />
    </ListItemButton>
  </ListItem>
);

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', py: 2 }}>
      <Box sx={{ px: 2.5, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #5e35b1 0%, #7e57c2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.35rem',
              boxShadow: '0 4px 12px rgba(94,53,177,0.35)',
            }}
          >
            R
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Rybella Iraq
            </Typography>
            <Typography variant="caption" color="text.secondary">
              لوحة الإدارة
            </Typography>
          </Box>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ px: 2.5, color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>
        التنقل الرئيسي
      </Typography>
      <List sx={{ px: 1 }}>
        {mainNav.map((item) => (
          <NavItem key={item.path} item={item} onClick={() => setMobileOpen(false)} />
        ))}
      </List>
      <Typography variant="caption" sx={{ px: 2.5, color: 'text.secondary', fontWeight: 600, mt: 2, mb: 0.5 }}>
        الإعدادات والموارد
      </Typography>
      <List sx={{ px: 1, flex: 1 }}>
        {settingsNav.map((item) => (
          <NavItem key={item.path} item={item} onClick={() => setMobileOpen(false)} />
        ))}
      </List>
      <Box
        sx={{
          mx: 2,
          mt: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: 'grey.50',
          border: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <HelpIcon sx={{ fontSize: 24, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={600}>مركز المساعدة</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          هل تحتاج دعمًا؟ تواصل معنا.
        </Typography>
        <Typography component="span" variant="body2" sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer' }}>
          الذهاب لمركز المساعدة
        </Typography>
      </Box>
      <List sx={{ mt: 1 }}>
        <ListItem disablePadding sx={{ px: 1.5 }}>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 44 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="تسجيل الخروج" primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', direction: 'rtl', minHeight: '100vh', bgcolor: 'grey.50' }}>
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
              width: drawerWidth,
              right: 0,
              left: 'auto',
              border: 'none',
              boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
              bgcolor: 'background.paper',
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
              width: drawerWidth,
              position: 'fixed',
              top: 0,
              right: 0,
              left: 'auto',
              height: '100vh',
              border: 'none',
              borderLeft: '1px solid',
              borderColor: 'grey.200',
              boxShadow: 'none',
              bgcolor: 'background.paper',
              pt: 0,
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
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            px: 3,
            py: 2,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            borderBottom: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 200 }}>
              <IconButton
                color="inherit"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { md: 'none' }, color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>
              <TextField
                size="small"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  maxWidth: 340,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'grey.200' },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton sx={{ color: 'text.secondary' }}>
                <Badge badgeContent={0} color="primary">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 1 }}>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    مرحباً، {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    مدير النظام
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor: 'primary.main',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {(user?.name || '?').charAt(0)}
                </Avatar>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ flex: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
