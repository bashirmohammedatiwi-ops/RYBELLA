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
  IconButton,
  Tooltip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import { Delete as DeleteIcon, PersonAdd as AddIcon } from '@mui/icons-material'
import { staffAPI } from '../services/api'

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', password: '' })
  const [saving, setSaving] = useState(false)

  const loadStaff = async () => {
    try {
      const { data } = await staffAPI.getAll()
      setStaff(Array.isArray(data) ? data : [])
    } catch (err) {
      setMessage({ type: 'error', text: 'تعذّر تحميل موظفي التجهيز' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim()) {
      setMessage({ type: 'error', text: 'الاسم والهاتف وكلمة المرور مطلوبة' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const { data } = await staffAPI.create(form)
      setStaff((prev) => [data.user, ...prev])
      setDialogOpen(false)
      setForm({ name: '', phone: '', password: '' })
      setMessage({ type: 'success', text: 'تم إنشاء حساب الموظف — يمكنه تسجيل الدخول في تطبيق التجهيز' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'فشل إنشاء الحساب' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (member) => {
    const label = member.name || member.phone
    if (!window.confirm(`حذف حساب الموظف "${label}"؟ لن يتمكن من الدخول لتطبيق التجهيز.`)) return
    setDeletingId(member.id)
    try {
      await staffAPI.delete(member.id)
      setStaff((prev) => prev.filter((s) => s.id !== member.id))
      setMessage({ type: 'success', text: 'تم حذف الموظف' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'فشل الحذف' })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>موظفو التجهيز</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            حسابات تطبيق Flutter لإدارة الطلبات والإشعارات
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          إضافة موظف
        </Button>
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
              <TableCell>الهاتف</TableCell>
              <TableCell>تاريخ الإنشاء</TableCell>
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  لا يوجد موظفو تجهيز — أضف حساباً للبدء
                </TableCell>
              </TableRow>
            ) : staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.phone || '—'}</TableCell>
                <TableCell>{new Date(s.created_at).toLocaleDateString('ar-IQ')}</TableCell>
                <TableCell align="left">
                  <Tooltip title="حذف">
                    <span>
                      <IconButton size="small" color="error" disabled={deletingId === s.id} onClick={() => handleDelete(s)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>إضافة موظف تجهيز</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="الاسم"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label="رقم الهاتف"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="07xxxxxxxxx"
            fullWidth
          />
          <TextField
            label="كلمة المرور"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>إلغاء</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'إنشاء'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
