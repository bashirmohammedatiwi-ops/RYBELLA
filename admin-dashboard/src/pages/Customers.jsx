import { useState, useEffect } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  TextField,
  InputAdornment,
  TablePagination,
  IconButton,
  Tooltip,
  Alert,
  Button,
  Collapse,
  Chip,
} from '@mui/material'
import { Search as SearchIcon, Delete as DeleteIcon, PhoneAndroid as PhoneIcon } from '@mui/icons-material'
import { usersAPI } from '../services/api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [message, setMessage] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [releasePhone, setReleasePhone] = useState('')
  const [releaseLoading, setReleaseLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState(null)
  const [showRelease, setShowRelease] = useState(false)

  const loadCustomers = async () => {
    try {
      const { data } = await usersAPI.getAll()
      setCustomers(Array.isArray(data) ? data.filter((u) => u.role === 'customer') : [])
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'تعذّر تحميل العملاء' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleDelete = async (customer) => {
    const label = customer.name || customer.email || `#${customer.id}`
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف العميل "${label}"؟\n\nسيتم حذف حسابه وطلباته وكل بياناته المرتبطة به ولا يمكن التراجع عن ذلك.`
    )
    if (!confirmed) return

    setDeletingId(customer.id)
    setMessage(null)
    try {
      await usersAPI.delete(customer.id)
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
      setMessage({ type: 'success', text: 'تم حذف العميل بنجاح' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'فشل حذف العميل' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleLookupPhone = async () => {
    if (!releasePhone.trim()) return
    setReleaseLoading(true)
    setLookupResult(null)
    setMessage(null)
    try {
      const { data } = await usersAPI.lookupPhone(releasePhone.trim())
      setLookupResult(data)
      if (!data.users?.length) {
        setMessage({ type: 'info', text: 'لا يوجد أي حساب مرتبط بهذا الرقم في قاعدة البيانات' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'فشل البحث' })
    } finally {
      setReleaseLoading(false)
    }
  }

  const handleReleasePhone = async () => {
    if (!releasePhone.trim()) return
    const confirmed = window.confirm(
      `تحرير الرقم ${releasePhone.trim()}؟\n\nسيُحذف حساب/حسابات العميل المرتبطة بهذا الرقم نهائياً ليتمكن من التسجيل من جديد.`
    )
    if (!confirmed) return

    setReleaseLoading(true)
    setMessage(null)
    try {
      const { data } = await usersAPI.releasePhone(releasePhone.trim())
      setMessage({ type: 'success', text: data.message || 'تم تحرير الرقم' })
      setLookupResult(null)
      setReleasePhone('')
      await loadCustomers()
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل تحرير الرقم'
      setMessage({ type: 'error', text: msg })
      if (err.response?.data?.users) {
        setLookupResult({ normalizedPhone: releasePhone, users: err.response.data.users })
      }
    } finally {
      setReleaseLoading(false)
    }
  }

  const filtered = customers.filter((c) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (c.name || '').toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s) || (c.phone || '').includes(search)
  })
  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>العملاء</Typography>
        <TextField
          size="small"
          placeholder="بحث بالاسم أو البريد أو الهاتف..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 220 }}
        />
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'warning.light', bgcolor: '#fffbea' }}>
        <Button
          size="small"
          startIcon={<PhoneIcon />}
          onClick={() => setShowRelease((v) => !v)}
          sx={{ mb: showRelease ? 2 : 0 }}
        >
          {showRelease ? 'إخفاء' : 'تحرير رقم هاتف (العميل غير ظاهر في القائمة)'}
        </Button>
        <Collapse in={showRelease}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            إذا حُذف عميل من القائمة لكنه لا يزال لا يستطيع التسجيل، ابحث برقمه ثم حرّره.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              label="رقم الهاتف"
              placeholder="07xxxxxxxxx"
              value={releasePhone}
              onChange={(e) => setReleasePhone(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <Button variant="outlined" onClick={handleLookupPhone} disabled={releaseLoading}>
              بحث
            </Button>
            <Button variant="contained" color="warning" onClick={handleReleasePhone} disabled={releaseLoading}>
              تحرير الرقم وحذف الحساب
            </Button>
          </Box>
          {lookupResult?.users?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>نتائج البحث ({lookupResult.normalizedPhone}):</Typography>
              {lookupResult.users.map((u) => (
                <Chip
                  key={u.id}
                  sx={{ mr: 1, mb: 1 }}
                  label={`#${u.id} ${u.name || '—'} · ${u.role} · ${u.phone || 'بدون هاتف'} · ${u.order_count ?? 0} طلب`}
                  color={u.role === 'customer' ? 'default' : 'error'}
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Collapse>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell>البريد الإلكتروني</TableCell>
              <TableCell>الهاتف</TableCell>
              <TableCell>الطلبات</TableCell>
              <TableCell>تاريخ التسجيل</TableCell>
              <TableCell align="left">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  لا يوجد عملاء — استخدم «تحرير رقم هاتف» أعلاه إن كان رقماً محجوزاً
                </TableCell>
              </TableRow>
            ) : paginated.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email?.includes('@phone.rybella.iq') || c.email?.includes('@deleted.rybella.iq') ? '—' : c.email}</TableCell>
                <TableCell>{c.phone || '-'}</TableCell>
                <TableCell>{c.order_count ?? 0}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                <TableCell align="left">
                  <Tooltip title="حذف العميل">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={deletingId === c.id}
                        onClick={() => handleDelete(c)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="صفوف لكل صفحة"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
        />
      </TableContainer>
    </Box>
  )
}
