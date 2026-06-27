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
import AddPhotoIcon from '@mui/icons-material/AddPhotoAlternate';
import VideocamIcon from '@mui/icons-material/Videocam';
import PersonIcon from '@mui/icons-material/Person';
import ReplayIcon from '@mui/icons-material/Replay';
import EditIcon from '@mui/icons-material/Edit';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { storiesAPI, productsAPI, categoriesAPI, subcategoriesAPI, brandsAPI, getImgBase } from '../services/api';
import ImageDisplay from '../components/ImageDisplay';

const emptySlide = () => ({ link_type: 'none', link_value: '', file: null, existingMedia: null, existingMediaType: null });

const slideFromStory = (sl) => ({
  id: sl.id,
  link_type: sl.link_type || 'none',
  link_value: sl.link_value || '',
  file: null,
  existingMedia: sl.image,
  existingMediaType: sl.media_type,
});

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

function MediaSlideEditor({ slides, updateSlide, removeSlide, addSlide, linkProps, allowImages = true, isEdit = false }) {
  return (
    <>
      {slides.map((slide, idx) => {
        const isVideo = slide.file?.type?.startsWith('video/') || (!slide.file && slide.existingMediaType === 'video');
        const previewSrc = slide.file
          ? URL.createObjectURL(slide.file)
          : (slide.existingMedia ? `${getImgBase()}${slide.existingMedia}` : null);
        return (
          <Box key={slide.id || `new-${idx}`} sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isVideo ? <VideocamIcon fontSize="small" color="primary" /> : <AddPhotoIcon fontSize="small" color="primary" />}
                {allowImages ? `شريحة ${idx + 1}` : `فيديو ${idx + 1}`}
                {isEdit && slide.id && !slide.file && (
                  <Chip size="small" label="محفوظة" variant="outlined" sx={{ ml: 0.5 }} />
                )}
              </Typography>
              {slides.length > 1 && (
                <IconButton size="small" color="error" onClick={() => removeSlide(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Button variant="outlined" component="label" size="small" startIcon={allowImages ? <AddPhotoIcon /> : <VideocamIcon />} sx={{ mb: 1 }}>
              {slide.file ? slide.file.name : (isEdit && slide.existingMedia ? 'استبدال الملف' : (allowImages ? 'اختر صورة أو فيديو' : 'اختر فيديو (mp4, webm, mov)'))}
              <input
                type="file"
                hidden
                accept={allowImages ? 'image/*,video/mp4,video/webm,video/quicktime,video/*' : 'video/mp4,video/webm,video/quicktime,video/*'}
                onChange={(e) => updateSlide(idx, 'file', e.target.files?.[0] ?? null)}
              />
            </Button>
            {previewSrc && (
              <Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', bgcolor: isVideo ? '#000' : 'grey.100' }}>
                {isVideo ? (
                  <video src={previewSrc} controls style={{ width: '100%', maxHeight: 180, display: 'block' }} />
                ) : (
                  <img src={previewSrc} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
                )}
              </Box>
            )}
            <LinkSelect idx={idx} slide={slide} updateSlide={updateSlide} {...linkProps} />
          </Box>
        );
      })}
      <Button variant="outlined" startIcon={<AddIcon />} onClick={addSlide} sx={{ alignSelf: 'flex-start' }}>
        {allowImages ? 'إضافة شريحة أخرى' : 'إضافة فيديو آخر'}
      </Button>
    </>
  );
}

function VideoSlideEditor({ slides, updateSlide, removeSlide, addSlide, linkProps }) {
  return (
    <MediaSlideEditor
      slides={slides}
      updateSlide={updateSlide}
      removeSlide={removeSlide}
      addSlide={addSlide}
      linkProps={linkProps}
      allowImages={false}
    />
  );
}

export default function Stories() {
  const [tab, setTab] = useState(0);
  const [stories, setStories] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [deletedSlideIds, setDeletedSlideIds] = useState([]);
  const [existingAvatar, setExistingAvatar] = useState(null);
  const [highlightDialogOpen, setHighlightDialogOpen] = useState(false);
  const [slides, setSlides] = useState([emptySlide()]);
  const [hlSlides, setHlSlides] = useState([emptySlide()]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [publisherName, setPublisherName] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(5);
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

  const openCreateDialog = () => {
    setEditingStory(null);
    setDeletedSlideIds([]);
    setExistingAvatar(null);
    setSlides([emptySlide()]);
    setAvatarFile(null);
    setPublisherName('');
    setDurationSeconds(5);
    setProductSearch({});
    setDialogOpen(true);
  };

  const openEditDialog = (story) => {
    setEditingStory(story);
    setDeletedSlideIds([]);
    setExistingAvatar(story.avatar || null);
    setAvatarFile(null);
    setPublisherName(story.publisher_name || '');
    setDurationSeconds(story.duration_seconds ?? 5);
    const storySlides = story.slides?.length ? story.slides.map(slideFromStory) : [emptySlide()];
    setSlides(storySlides);
    const ps = {};
    story.slides?.forEach((sl, i) => {
      if (sl.link_type === 'product' && sl.link_value) ps[i] = sl.link_value;
    });
    setProductSearch(ps);
    setDialogOpen(true);
  };

  const closeStoryDialog = () => {
    setDialogOpen(false);
    setEditingStory(null);
    setDeletedSlideIds([]);
    setExistingAvatar(null);
  };

  const handleRemoveSlide = (idx) => {
    const slide = slides[idx];
    if (slide?.id) setDeletedSlideIds((ids) => [...ids, slide.id]);
    removeSlideFrom(setSlides)(idx, slides);
  };

  const submitStory = async (e) => {
    e.preventDefault();
    const isEdit = !!editingStory;

    if (!isEdit) {
      const withFiles = slides.filter((s) => s.file);
      if (!withFiles.length) {
        setMessage({ type: 'error', text: 'يجب إضافة صورة أو فيديو واحد على الأقل' });
        return;
      }
    } else {
      if (slides.length === 0) {
        setMessage({ type: 'error', text: 'يجب أن تحتوي اليومية على شريحة واحدة على الأقل' });
        return;
      }
      const invalidNew = slides.some((s) => !s.id && !s.file);
      if (invalidNew) {
        setMessage({ type: 'error', text: 'الشرائح الجديدة تحتاج ملف صورة أو فيديو' });
        return;
      }
    }

    try {
      const formData = new FormData();
      if (avatarFile) formData.append('avatar', avatarFile, avatarFile.name || 'avatar.jpg');
      formData.append('publisher_name', publisherName);
      formData.append('duration_seconds', Math.min(60, Math.max(1, durationSeconds)));

      if (isEdit) {
        const slidesPayload = [
          ...slides.map((s) => ({
            id: s.id,
            link_type: s.link_type,
            link_value: s.link_value || '',
            replace_media: !!(s.id && s.file),
          })),
          ...deletedSlideIds.map((id) => ({ id, _delete: true })),
        ];
        formData.append('slides', JSON.stringify(slidesPayload));
        slides.forEach((s) => {
          if (s.file) formData.append('images', s.file, s.file.name || 'media');
        });
        await storiesAPI.update(editingStory.id, formData);
        setMessage({ type: 'success', text: 'تم تحديث اليومية بنجاح' });
      } else {
        const withFiles = slides.filter((s) => s.file);
        withFiles.forEach((s) => formData.append('images', s.file, s.file.name || 'media'));
        formData.append('slides', JSON.stringify(withFiles.map((s) => ({ link_type: s.link_type, link_value: s.link_value || '' }))));
        await storiesAPI.create(formData);
        setMessage({ type: 'success', text: 'تم إضافة اليومية بنجاح' });
      }
      closeStoryDialog();
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
        فيديوهات وصور — مثل انستغرام: إمساك للإيقاف، سحب للأسفل للإغلاق. الهايلايت فيديو فقط.
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ mb: 2 }}>
            إضافة يومية
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الصورة</TableCell>
                  <TableCell>الناشر</TableCell>
                  <TableCell>الشرائح</TableCell>
                  <TableCell>العدد</TableCell>
                  <TableCell>وقت الصور (ث)</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>آخر عرض</TableCell>
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
                          sl.media_type === 'video' ? (
                            <Chip key={sl.id} size="small" icon={<VideocamIcon />} label={`#${sl.sort_order + 1}`} variant="outlined" />
                          ) : (
                            <ImageDisplay key={sl.id} src={sl.image} width={40} height={40} fit="cover" />
                          )
                        ))}
                        {(s.slides?.length || 0) > 4 && <Chip size="small" label={`+${s.slides.length - 4}`} />}
                      </Box>
                    </TableCell>
                    <TableCell>{s.slides?.length || 0}</TableCell>
                    <TableCell>{s.duration_seconds ?? 5}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={s.is_active !== false ? 'نشطة' : 'منتهية'}
                        color={s.is_active !== false ? 'success' : 'default'}
                        variant={s.is_active !== false ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(s.published_at || s.created_at)}</TableCell>
                    <TableCell align="left">
                      <IconButton size="small" color="default" title="تعديل" onClick={() => openEditDialog(s)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        title="إعادة عرض"
                        onClick={async () => {
                          try {
                            await storiesAPI.republish(s.id);
                            setMessage({ type: 'success', text: 'تم إعادة عرض اليومية — ستظهر من جديد في المتجر' });
                            loadData();
                          } catch (err) {
                            setMessage({ type: 'error', text: err.response?.data?.message || 'فشل إعادة العرض' });
                          }
                        }}
                      >
                        <ReplayIcon />
                      </IconButton>
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

      <Dialog open={dialogOpen} onClose={closeStoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStory ? 'تعديل يومية' : 'إضافة يومية'}</DialogTitle>
        <DialogContent>
          <form onSubmit={submitStory} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>صورة الناشر (الدائرة)</Typography>
              <Button variant="outlined" component="label" size="small" startIcon={<PersonIcon />} sx={{ mb: 1 }}>
                {avatarFile ? avatarFile.name : (existingAvatar ? 'استبدال صورة الناشر' : 'اختر صورة')}
                <input type="file" hidden accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
              </Button>
              {(avatarFile || existingAvatar) && (
                <Box sx={{ mt: 1 }}>
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <ImageDisplay src={existingAvatar} width={64} height={64} fit="cover" sx={{ borderRadius: '50%' }} />
                  )}
                </Box>
              )}
              <TextField label="اسم الناشر" value={publisherName} onChange={(e) => setPublisherName(e.target.value)} fullWidth size="small" sx={{ mt: 1 }} />
              <TextField
                label="وقت عرض الصور (ثواني)"
                type="number"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Math.min(60, Math.max(1, parseInt(e.target.value, 10) || 5)))}
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 60 }}
                helperText="للصور فقط — الفيديو يعرض حسب مدته"
                sx={{ mt: 1 }}
              />
            </Box>
            <MediaSlideEditor
              slides={slides}
              updateSlide={updateSlide}
              removeSlide={handleRemoveSlide}
              addSlide={() => setSlides((s) => [...s, emptySlide()])}
              linkProps={{ ...linkProps, updateSlide }}
              isEdit={!!editingStory}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={closeStoryDialog}>إلغاء</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={editingStory ? slides.length === 0 : !slides.some((s) => s.file)}
              >
                {editingStory ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
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
