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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Search as SearchIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material'
import { usersAPI } from '../services/api'

const emptyForm = { name: '', phone: '', password: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [message, setMessage] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)

  const loadCustomers = async () => {
    try {
      const { data } = await usersAPI.getAll()
      setCustomers(Array.isArray(data) ? data : [])
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
    const label = customer.name || customer.phone || `#${customer.id}`
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف العميل "${label}"؟\n\nسيُحذف من القائمة ويُحرَّر رقمه فوراً للتسجيل من جديد. الطلبات السابقة تبقى في النظام.`
    )
    if (!confirmed) return

    setDeletingId(customer.id)
    setMessage(null)
    try {
      await usersAPI.delete(customer.id)
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
      setMessage({ type: 'success', text: 'تم حذف العميل وتحرير رقم الهاتف' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'فشل حذف العميل' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.phone.trim() || !createForm.password) {
      setMessage({ type: 'error', text: 'الاسم والهاتف وكلمة المرور مطلوبة' })
      return
    }
    setCreating(true)
    setMessage(null)
    try {
      const { data } = await usersAPI.create(createForm)
      setCreateOpen(false)
      setCreateForm(emptyForm)
      setMessage({ type: 'success', text: data.message || 'تم إنشاء حساب العميل' })
      await loadCustomers()
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'فشل إنشاء الحساب' })
    } finally {
      setCreating(false)
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
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setCreateOpen(true)}>
            إضافة عميل
          </Button>
          <TextField
            size="small"
            placeholder="بحث..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ minWidth: 200 }}
          />
        </Box>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell>البريد</TableCell>
              <TableCell>الهاتف</TableCell>
              <TableCell>الطلبات</TableCell>
              <TableCell>التسجيل</TableCell>
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  لا يوجد عملاء نشطون
                </TableCell>
              </TableRow>
            ) : paginated.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email || '—'}</TableCell>
                <TableCell>{c.phone || '—'}</TableCell>
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
        />
      </TableContainer>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>إضافة عميل جديد</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="الاسم"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="رقم الهاتف"
            placeholder="07xxxxxxxxx"
            value={createForm.phone}
            onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
            fullWidth
          />
          <TextField
            label="كلمة المرور"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? 'جاري الإنشاء...' : 'إنشاء'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
