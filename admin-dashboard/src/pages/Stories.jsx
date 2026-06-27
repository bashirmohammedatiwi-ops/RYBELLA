import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VideocamIcon from '@mui/icons-material/Videocam';
import PersonIcon from '@mui/icons-material/Person';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { storiesAPI, productsAPI, categoriesAPI, subcategoriesAPI, brandsAPI } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';

const emptySlide = () => ({ link_type: 'none', link_value: '', file: null });

function LinkSelect({ idx, slide, updateSlide, products, categories, subcategories, brands, productSearch, setProductSearch, productLoading, loadProducts }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
      <FormControl fullWidth size="small">
        <InputLabel>نوع الرابط</InputLabel>
        <Select value={slide.link_type} label="نوع الرابط" onChange={(e) => updateSlide(idx, 'link_type', e.target.value)}>
          <MenuItem value="none">بدون رابط</MenuItem>
          <MenuItem value="product">منتج</MenuItem>
          <MenuItem value="category">فئة</MenuItem>
          <MenuItem value="subcategory">فئة ثانوية</MenuItem>
          <MenuItem value="brand">براند</MenuItem>
          <MenuItem value="url">رابط خارجي</MenuItem>
        </Select>
      </FormControl>
      {slide.link_type === 'product' && (
        <Autocomplete
          freeSolo
          options={products[idx] || []}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt?.name || opt?.barcode || '')}
          loading={productLoading[idx]}
          inputValue={productSearch[idx] || ''}
          onInputChange={(_, v) => { setProductSearch((p) => ({ ...p, [idx]: v })); updateSlide(idx, 'link_value', v); loadProducts(idx, v); }}
          onChange={(_, val) => { const v = typeof val === 'string' ? val : val?.name || val?.barcode || ''; updateSlide(idx, 'link_value', v); setProductSearch((p) => ({ ...p, [idx]: v })); }}
          renderInput={(params) => <TextField {...params} label="اسم المنتج أو الباركود" size="small" />}
        />
      )}
      {slide.link_type === 'category' && (
        <Autocomplete
          options={categories}
          getOptionLabel={(opt) => opt?.name || ''}
          value={categories.find((c) => c.name === slide.link_value) || null}
          onChange={(_, val) => updateSlide(idx, 'link_value', val?.name || '')}
          renderInput={(params) => <TextField {...params} label="اختر الفئة" size="small" />}
        />
      )}
      {slide.link_type === 'subcategory' && (
        <Autocomplete
          options={subcategories}
          getOptionLabel={(opt) => opt?.name || ''}
          value={subcategories.find((s) => s.name === slide.link_value) || null}
          onChange={(_, val) => updateSlide(idx, 'link_value', val?.name || '')}
          renderInput={(params) => <TextField {...params} label="اختر الفئة الثانوية" size="small" />}
        />
      )}
      {slide.link_type === 'brand' && (
        <Autocomplete
          options={brands}
          getOptionLabel={(opt) => opt?.name || ''}
          value={brands.find((b) => b.name === slide.link_value) || null}
          onChange={(_, val) => updateSlide(idx, 'link_value', val?.name || '')}
          renderInput={(params) => <TextField {...params} label="اختر البراند" size="small" />}
        />
      )}
      {slide.link_type === 'url' && (
        <TextField label="الرابط" value={slide.link_value} onChange={(e) => updateSlide(idx, 'link_value', e.target.value)} fullWidth size="small" placeholder="https://..." />
      )}
    </Box>
  );
}

function VideoSlideEditor({ slides, setSlides, updateSlide, removeSlide, addSlide, linkProps }) {
  return (
    <>
      {slides.map((slide, idx) => (
        <Box key={idx} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <VideocamIcon fontSize="small" color="primary" />
              فيديو {idx + 1}
            </Typography>
            {slides.length > 1 && (
              <IconButton size="small" color="error" onClick={() => removeSlide(idx)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Button variant="outlined" component="label" size="small" startIcon={<VideocamIcon />} sx={{ mb: 1 }}>
            {slide.file ? slide.file.name : 'اختر فيديو (mp4, webm, mov)'}
            <input
              type="file"
              hidden
              accept="video/mp4,video/webm,video/quicktime,video/*"
              onChange={(e) => updateSlide(idx, 'file', e.target.files?.[0] ?? null)}
            />
          </Button>
          {slide.file && (
            <Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
              <video src={URL.createObjectURL(slide.file)} controls style={{ width: '100%', maxHeight: 180, display: 'block' }} />
            </Box>
          )}
          <LinkSelect idx={idx} slide={slide} updateSlide={updateSlide} {...linkProps} />
        </Box>
      ))}
      <Button variant="outlined" startIcon={<AddIcon />} onClick={addSlide} sx={{ alignSelf: 'flex-start' }}>
        إضافة فيديو آخر
      </Button>
    </>
  );
}

export default function Stories() {
  const [tab, setTab] = useState(0);
  const [stories, setStories] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [slides, setSlides] = useState([emptySlide()]);
  const [hlSlides, setHlSlides] = useState([emptySlide()]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [publisherName, setPublisherName] = useState('');
  const [highlightTitle, setHighlightTitle] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [products, setProducts] = useState({});
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [productSearch, setProductSearch] = useState({});
  const [productLoading, setProductLoading] = useState({});

  useEffect(() => {
    loadData();
    categoriesAPI.getAll().then((r) => setCategories(r?.data || [])).catch(() => []);
    brandsAPI.getAll().then((r) => setBrands(r?.data || [])).catch(() => []);
    subcategoriesAPI.getAll().then((r) => setSubcategories(r?.data || [])).catch(() => []);
  }, []);

  const loadProducts = (idx, query) => {
    if (!query || query.length < 2) {
      setProducts((p) => ({ ...p, [idx]: [] }));
      return;
    }
    setProductLoading((l) => ({ ...l, [idx]: true }));
    productsAPI.getAll({ search: query })
      .then((r) => setProducts((p) => ({ ...p, [idx]: r?.data || [] })))
      .catch(() => setProducts((p) => ({ ...p, [idx]: [] })))
      .finally(() => setProductLoading((l) => ({ ...l, [idx]: false })));
  };

  const loadData = async () => {
    try {
      const { data } = await storiesAPI.getAll();
      if (Array.isArray(data)) {
        setStories(data);
        setHighlights([]);
      } else {
        setStories(data?.stories || []);
        setHighlights(data?.highlights || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'فشل تحميل اليوميات' });
    } finally {
      setLoading(false);
    }
  };

  const linkProps = {
    products, categories, subcategories, brands, productSearch, setProductSearch, productLoading, loadProducts,
  };

  const makeUpdateSlide = (setter) => (idx, field, value) => {
    setter((s) => {
      const next = [...s];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateSlide = makeUpdateSlide(setSlides);
  const updateHlSlide = makeUpdateSlide(setHlSlides);

  const removeSlideFrom = (setter) => (idx, list) => {
    if (list.length <= 1) return;
    setter((s) => s.filter((_, i) => i !== idx));
  };

  const submitStory = async (e) => {
    e.preventDefault();
    const withFiles = slides.filter((s) => s.file);
    if (!withFiles.length) {
      setMessage({ type: 'error', text: 'يجب إضافة فيديو واحد على الأقل' });
      return;
    }
    try {
      const formData = new FormData();
      if (avatarFile) formData.append('avatar', avatarFile, avatarFile.name || 'avatar.jpg');
      formData.append('publisher_name', publisherName);
      withFiles.forEach((s) => formData.append('videos', s.file, s.file.name || 'video.mp4'));
      formData.append('slides', JSON.stringify(withFiles.map((s) => ({ link_type: s.link_type, link_value: s.link_value || '' }))));
      await storiesAPI.create(formData);
      setMessage({ type: 'success', text: 'تم إضافة اليومية بنجاح' });
      setDialogOpen(false);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'حدث خطأ' });
    }
  };

  const submitHighlight = async (e) => {
    e.preventDefault();
    if (!highlightTitle.trim()) {
      setMessage({ type: 'error', text: 'اسم الهايلايت مطلوب' });
      return;
    }
    const withFiles = hlSlides.filter((s) => s.file);
    if (!withFiles.length) {
      setMessage({ type: 'error', text: 'يجب إضافة فيديو واحد على الأقل' });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', highlightTitle.trim());
      if (coverFile) formData.append('cover', coverFile, coverFile.name || 'cover.jpg');
      withFiles.forEach((s) => formData.append('videos', s.file, s.file.name || 'video.mp4'));
      formData.append('slides', JSON.stringify(withFiles.map((s) => ({ link_type: s.link_type, link_value: s.link_value || '' }))));
      await storiesAPI.createHighlight(formData);
      setMessage({ type: 'success', text: 'تم إضافة الهايلايت بنجاح' });
      setHighlightDialogOpen(false);
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'حدث خطأ' });
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' });
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 0.5 }}>اليوميات</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        فيديوهات فقط — مثل انستغرام: إمساك للإيقاف، سحب للأسفل للإغلاق، هايلايت مثبتة دائماً
      </Typography>

      {message.text && (
        <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<VideocamIcon />} iconPosition="start" label={`اليوميات (${stories.length})`} />
        <Tab icon={<BookmarkIcon />} iconPosition="start" label={`الهايلايت (${highlights.length})`} />
      </Tabs>

      {tab === 0 && (
        <>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setSlides([emptySlide()]); setAvatarFile(null); setPublisherName(''); setDialogOpen(true); }} sx={{ mb: 2 }}>
            إضافة يومية
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الصورة</TableCell>
                  <TableCell>الناشر</TableCell>
                  <TableCell>الفيديوهات</TableCell>
                  <TableCell>العدد</TableCell>
                  <TableCell>التاريخ</TableCell>
                  <TableCell align="left">إجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stories.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell><ImageDisplay src={s.avatar || s.cover} width={48} height={48} fit="cover" /></TableCell>
                    <TableCell>{s.publisher_name || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {(s.slides || []).slice(0, 4).map((sl) => (
                          <Chip key={sl.id} size="small" icon={<VideocamIcon />} label={`#${sl.sort_order + 1}`} variant="outlined" />
                        ))}
                        {(s.slides?.length || 0) > 4 && <Chip size="small" label={`+${s.slides.length - 4}`} />}
                      </Box>
                    </TableCell>
                    <TableCell>{s.slides?.length || 0}</TableCell>
                    <TableCell>{formatDate(s.created_at)}</TableCell>
                    <TableCell align="left">
                      <IconButton size="small" color="error" onClick={async () => {
                        if (!window.confirm('حذف هذه اليومية؟')) return;
                        await storiesAPI.delete(s.id);
                        setMessage({ type: 'success', text: 'تم الحذف' });
                        loadData();
                      }}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {stories.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>لا توجد يوميات</Typography>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <Button variant="contained" startIcon={<BookmarkIcon />} onClick={() => { setHlSlides([emptySlide()]); setCoverFile(null); setHighlightTitle(''); setHighlightDialogOpen(true); }} sx={{ mb: 2 }}>
            إضافة هايلايت
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الغلاف</TableCell>
                  <TableCell>الاسم</TableCell>
                  <TableCell>الفيديوهات</TableCell>
                  <TableCell>العدد</TableCell>
                  <TableCell>التاريخ</TableCell>
                  <TableCell align="left">إجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {highlights.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell><ImageDisplay src={h.cover} width={48} height={48} fit="cover" /></TableCell>
                    <TableCell><strong>{h.title}</strong></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {(h.slides || []).slice(0, 4).map((sl) => (
                          <Chip key={sl.id} size="small" icon={<VideocamIcon />} label={`#${sl.sort_order + 1}`} variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>{h.slides?.length || 0}</TableCell>
                    <TableCell>{formatDate(h.created_at)}</TableCell>
                    <TableCell align="left">
                      <IconButton size="small" color="error" onClick={async () => {
                        if (!window.confirm('حذف هذا الهايلايت؟')) return;
                        await storiesAPI.deleteHighlight(h.id);
                        setMessage({ type: 'success', text: 'تم الحذف' });
                        loadData();
                      }}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {highlights.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>لا توجد هايلايت — أضف مجموعة فيديوهات مثبتة</Typography>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة يومية (فيديو)</DialogTitle>
        <DialogContent>
          <form onSubmit={submitStory} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>صورة الناشر (الدائرة)</Typography>
              <Button variant="outlined" component="label" size="small" startIcon={<PersonIcon />} sx={{ mb: 1 }}>
                {avatarFile ? avatarFile.name : 'اختر صورة'}
                <input type="file" hidden accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
              </Button>
              {avatarFile && (
                <Box sx={{ mt: 1 }}>
                  <img src={URL.createObjectURL(avatarFile)} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                </Box>
              )}
              <TextField label="اسم الناشر" value={publisherName} onChange={(e) => setPublisherName(e.target.value)} fullWidth size="small" sx={{ mt: 1 }} />
            </Box>
            <VideoSlideEditor
              slides={slides}
              setSlides={setSlides}
              updateSlide={updateSlide}
              removeSlide={(idx) => removeSlideFrom(setSlides)(idx, slides)}
              addSlide={() => setSlides((s) => [...s, emptySlide()])}
              linkProps={{ ...linkProps, updateSlide }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="contained" disabled={!slides.some((s) => s.file)}>إضافة</Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={highlightDialogOpen} onClose={() => setHighlightDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة هايلايت مثبت</DialogTitle>
        <DialogContent>
          <form onSubmit={submitHighlight} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'primary.light', borderRadius: 2, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>معلومات الهايلايت</Typography>
              <TextField label="اسم الهايلايت *" value={highlightTitle} onChange={(e) => setHighlightTitle(e.target.value)} fullWidth size="small" placeholder="مثال: عروض، جديد، مكياج" sx={{ mb: 1 }} />
              <Button variant="outlined" component="label" size="small" startIcon={<PersonIcon />}>
                {coverFile ? coverFile.name : 'صورة الغلاف (اختياري)'}
                <input type="file" hidden accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
              </Button>
              {coverFile && (
                <Box sx={{ mt: 1 }}>
                  <img src={URL.createObjectURL(coverFile)} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                </Box>
              )}
            </Box>
            <VideoSlideEditor
              slides={hlSlides}
              setSlides={setHlSlides}
              updateSlide={updateHlSlide}
              removeSlide={(idx) => removeSlideFrom(setHlSlides)(idx, hlSlides)}
              addSlide={() => setHlSlides((s) => [...s, emptySlide()])}
              linkProps={{ ...linkProps, updateSlide: updateHlSlide }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setHighlightDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" variant="contained" disabled={!hlSlides.some((s) => s.file) || !highlightTitle.trim()}>إضافة هايلايت</Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
