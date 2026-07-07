const memory = new Map()
const inflight = new Map()
const PREFIX = 'ry_api_v1_'

export function buildCacheKey(path, params = {}) {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  return `${path}?${sorted}`
}

export function readCache(key, maxAgeMs) {
  const mem = memory.get(key)
  if (mem && Date.now() - mem.t < maxAgeMs) return mem.data

  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.t < maxAgeMs) {
      memory.set(key, parsed)
      return parsed.data
    }
    sessionStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
  return null
}

export function writeCache(key, data) {
  const entry = { t: Date.now(), data }
  memory.set(key, entry)
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota */
  }
}

export async function cachedRequest(key, maxAgeMs, fetcher) {
  const hit = readCache(key, maxAgeMs)
  if (hit !== null) return { data: hit, fromCache: true }

  if (inflight.has(key)) return inflight.get(key)

  const promise = fetcher()
    .then((response) => {
      writeCache(key, response.data)
      inflight.delete(key)
      return response
    })
    .catch((error) => {
      inflight.delete(key)
      throw error
    })

  inflight.set(key, promise)
  return promise
}
