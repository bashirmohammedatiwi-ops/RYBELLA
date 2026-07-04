import { productsAPI } from '../services/api'
import { normalizeBarcode, findVariantIdByBarcode } from './barcode'

/** يبحث بالباركود ويوجّه لصفحة المنتج أو نتائج البحث */
export async function searchByBarcode(navigate, rawCode, options = {}) {
  const q = normalizeBarcode(rawCode)
  if (!q) return false

  try {
    const { data } = await productsAPI.getAll({ search: q })
    const list = Array.isArray(data) ? data : []
    if (list.length === 1) {
      const product = list[0]
      const variantId = findVariantIdByBarcode(product, rawCode)
      const variantQuery = variantId ? `?variant=${variantId}` : ''
      navigate(`/products/${product.id}${variantQuery}`)
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
