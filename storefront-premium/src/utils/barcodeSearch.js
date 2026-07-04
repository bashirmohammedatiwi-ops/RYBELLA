import { productsAPI } from '../services/api'
import { normalizeBarcode } from './barcode'

/** يبحث بالباركود ويوجّه لصفحة المنتج أو نتائج البحث */
export async function searchByBarcode(navigate, rawCode, options = {}) {
  const q = normalizeBarcode(rawCode)
  if (!q) return false

  try {
    const { data } = await productsAPI.getAll({ search: q })
    const list = Array.isArray(data) ? data : []
    if (list.length === 1) {
      navigate(`/products/${list[0].id}`)
      return true
    }
  } catch {
    /* fall through */
  }

  if (typeof options.onExploreSearch === 'function') {
    options.onExploreSearch(q)
    return true
  }

  navigate(`/explore?search=${encodeURIComponent(q)}`)
  return true
}
