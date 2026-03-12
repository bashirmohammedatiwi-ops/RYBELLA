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
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import { usersAPI } from '../services/api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await usersAPI.getAll()
        setCustomers(Array.isArray(data) ? data.filter((u) => u.role === 'customer') : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell>البريد الإلكتروني</TableCell>
              <TableCell>الهاتف</TableCell>
              <TableCell>تاريخ التسجيل</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.phone || '-'}</TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString('ar-IQ')}</TableCell>
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
