const ARABIC_STOP_WORDS = new Set([
  'و', 'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'ما', 'لا', 'لم',
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'for', 'to',
]);

function normalizeBarcodeValue(value) {
  return String(value || '').trim().replace(/[\s\-]/g, '');
}

function isBarcodeLikeSearch(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  const normalized = normalizeBarcodeValue(raw);
  if (/^\d{4,}$/.test(normalized)) return true;
  if (raw.includes(' ')) return false;
  return /^[A-Za-z0-9\-_]{5,24}$/.test(raw);
}

function normalizeSearchText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\w\s\u0600-\u06FF0-9\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSearchQuery(query) {
  const raw = String(query || '').trim();
  const normalized = normalizeSearchText(raw);
  if (!normalized) return { raw, normalized, tokens: [] };

  let tokens = normalized
    .split(/\s+/)
    .filter((t) => t.length >= 2 || /^\d+$/.test(t))
    .filter((t) => !ARABIC_STOP_WORDS.has(t));

  if (tokens.length === 0 && normalized.length >= 1) {
    tokens = [normalized];
  }

  return { raw, normalized, tokens };
}

function buildBarcodeSearchClause(searchVal) {
  const normalized = normalizeBarcodeValue(searchVal);
  return {
    clause: ` AND (
      REPLACE(REPLACE(COALESCE(p.barcode, ''), '-', ''), ' ', '') = ?
      OR EXISTS (
        SELECT 1 FROM product_variants pv
        WHERE pv.product_id = p.id AND (
          REPLACE(REPLACE(COALESCE(pv.barcode, ''), '-', ''), ' ', '') = ?
          OR REPLACE(REPLACE(COALESCE(pv.sku, ''), '-', ''), ' ', '') = ?
          OR pv.barcode = ?
          OR pv.sku = ?
        )
      )
    )`,
    params: [normalized, normalized, normalized, searchVal, searchVal],
  };
}

const SEARCHABLE_FIELDS = [
  'LOWER(COALESCE(p.name,\'\'))',
  'LOWER(COALESCE(p.description,\'\'))',
  'LOWER(COALESCE(p.tags,\'\'))',
  'LOWER(COALESCE(p.meta_title,\'\'))',
  'LOWER(COALESCE(b.name,\'\'))',
  'LOWER(COALESCE(c.name,\'\'))',
  'LOWER(COALESCE(s.name,\'\'))',
];

function buildSmartSearchClause(searchVal) {
  const { normalized, tokens } = parseSearchQuery(searchVal);
  if (!normalized) return null;

  const params = [];
  const parts = [];

  if (tokens.length > 0) {
    const tokenConditions = tokens.map((token) => {
      const like = `%${token}%`;
      const fieldOr = SEARCHABLE_FIELDS.map((f) => `${f} LIKE ?`).join(' OR ');
      const variantOr = `EXISTS (
        SELECT 1 FROM product_variants pv
        WHERE pv.product_id = p.id AND (
          LOWER(COALESCE(pv.shade_name, '')) LIKE ?
          OR LOWER(COALESCE(pv.sku, '')) LIKE ?
        )
      )`;
      params.push(...SEARCHABLE_FIELDS.map(() => like), like, like);
      return `(${fieldOr} OR ${variantOr})`;
    });
    parts.push(`(${tokenConditions.join(' AND ')})`);
  }

  const phraseLike = `%${normalized}%`;
  const phraseFields = [
    'LOWER(COALESCE(p.description,\'\'))',
    'LOWER(COALESCE(p.name,\'\'))',
    'LOWER(COALESCE(p.tags,\'\'))',
    'LOWER(COALESCE(p.meta_title,\'\'))',
  ];
  const phraseOr = phraseFields.map((f) => `${f} LIKE ?`).join(' OR ');
  params.push(...phraseFields.map(() => phraseLike));
  parts.push(`(${phraseOr})`);

  return {
    clause: ` AND (${parts.join(' OR ')})`,
    params,
    meta: parseSearchQuery(searchVal),
  };
}

function buildProductCorpus(product) {
  const tags = Array.isArray(product.tags)
    ? product.tags.join(' ')
    : String(product.tags || '');
  const shades = (product.variants || [])
    .map((v) => `${v.shade_name || ''} ${v.sku || ''}`)
    .join(' ');
  return normalizeSearchText(
    [
      product.name,
      product.description,
      tags,
      product.brand_name,
      product.category_name,
      product.subcategory_name,
      product.meta_title,
      product.barcode,
      shades,
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function allTokensMatch(corpus, tokens) {
  if (!tokens.length) return corpus.length > 0;
  return tokens.every((token) => corpus.includes(token));
}

function fieldContains(haystack, needle) {
  if (!haystack || !needle) return false;
  return normalizeSearchText(haystack).includes(needle);
}

function scoreProduct(product, meta) {
  const { normalized, tokens } = meta;
  if (!normalized) return 0;

  let score = 0;
  const name = product.name || '';
  const desc = product.description || '';
  const tags = Array.isArray(product.tags) ? product.tags.join(' ') : String(product.tags || '');
  const brand = product.brand_name || '';
  const category = product.category_name || '';
  const subcategory = product.subcategory_name || '';
  const metaTitle = product.meta_title || '';
  const nameNorm = normalizeSearchText(name);

  if (nameNorm === normalized) score += 500;
  else if (nameNorm.includes(normalized)) score += 220;
  else if (fieldContains(name, normalized)) score += 120;

  if (fieldContains(desc, normalized)) score += 100;
  if (fieldContains(tags, normalized)) score += 70;
  if (fieldContains(brand, normalized)) score += 65;
  if (fieldContains(category, normalized)) score += 40;
  if (fieldContains(subcategory, normalized)) score += 35;
  if (fieldContains(metaTitle, normalized)) score += 30;

  for (const token of tokens) {
    if (fieldContains(name, token)) {
      score += 55;
      if (normalizeSearchText(name).startsWith(token)) score += 20;
    }
    if (fieldContains(brand, token)) score += 42;
    if (fieldContains(tags, token)) score += 38;
    if (fieldContains(desc, token)) score += 32;
    if (fieldContains(category, token)) score += 24;
    if (fieldContains(subcategory, token)) score += 20;
    if (fieldContains(metaTitle, token)) score += 16;

    for (const variant of product.variants || []) {
      if (fieldContains(variant.shade_name, token)) score += 34;
      if (fieldContains(variant.sku, token)) score += 48;
    }
  }

  if (/^\d{3,}$/.test(normalized)) {
    const barcode = normalizeSearchText(product.barcode || '');
    if (barcode.includes(normalized)) score += 60;
    for (const variant of product.variants || []) {
      const vBarcode = normalizeSearchText(variant.barcode || '');
      if (vBarcode.includes(normalized)) score += 55;
    }
  }

  return score;
}

function rankSearchResults(products, meta) {
  const corpusMatched = products.filter((product) => allTokensMatch(buildProductCorpus(product), meta.tokens));
  return corpusMatched
    .map((product) => ({ product, score: scoreProduct(product, meta) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const orderA = a.product.sort_order ?? 0;
      const orderB = b.product.sort_order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.product.name || '').localeCompare(String(b.product.name || ''), 'ar');
    })
    .map(({ product }) => product);
}

module.exports = {
  normalizeBarcodeValue,
  isBarcodeLikeSearch,
  normalizeSearchText,
  parseSearchQuery,
  buildBarcodeSearchClause,
  buildSmartSearchClause,
  rankSearchResults,
};
