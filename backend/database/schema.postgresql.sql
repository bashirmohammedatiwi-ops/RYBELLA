-- Rybella Iraq — PostgreSQL Schema (production)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT,
    icon TEXT,
    overlay_text TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE SET NULL,
    description TEXT,
    main_image TEXT,
    barcode TEXT UNIQUE,
    status TEXT DEFAULT 'published',
    is_featured BOOLEAN DEFAULT FALSE,
    is_best_seller BOOLEAN DEFAULT FALSE,
    new_until TEXT,
    meta_title TEXT,
    meta_description TEXT,
    tags TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;

CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    shade_name TEXT NOT NULL,
    color_code TEXT DEFAULT '#000000',
    barcode TEXT UNIQUE,
    sku TEXT UNIQUE,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(12, 2) DEFAULT 0,
    discount_percent NUMERIC(8, 2) DEFAULT 0,
    sync_price NUMERIC(12, 2),
    sync_original_price NUMERIC(12, 2),
    sync_discount_percent NUMERIC(8, 2) DEFAULT 0,
    manual_discount_percent NUMERIC(8, 2),
    manual_discount_until TIMESTAMPTZ,
    stock INTEGER DEFAULT 0,
    image TEXT,
    expiration_date TEXT,
    batch_number TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_barcode ON product_variants(barcode);

CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_zones (
    id SERIAL PRIMARY KEY,
    city TEXT NOT NULL UNIQUE,
    delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_price NUMERIC(12, 2) NOT NULL,
    delivery_fee NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    final_price NUMERIC(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'cash',
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    coupon_code TEXT,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS review_images (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_percent NUMERIC(8, 2) NOT NULL,
    expiration_date TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_id)
);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);

CREATE TABLE IF NOT EXISTS push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'web',
    endpoint TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS story_groups (
    id SERIAL PRIMARY KEY,
    avatar TEXT,
    publisher_name TEXT,
    duration_seconds INTEGER DEFAULT 5,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_slides (
    id SERIAL PRIMARY KEY,
    story_group_id INTEGER NOT NULL REFERENCES story_groups(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    thumbnail TEXT,
    link_type TEXT DEFAULT 'none',
    link_value TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS story_highlights (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    cover TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_highlight_slides (
    id SERIAL PRIMARY KEY,
    highlight_id INTEGER NOT NULL REFERENCES story_highlights(id) ON DELETE CASCADE,
    video TEXT NOT NULL,
    thumbnail TEXT,
    link_type TEXT DEFAULT 'none',
    link_value TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    image TEXT NOT NULL,
    background_image TEXT,
    link_type TEXT DEFAULT 'none',
    link_value TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    image_pos_x REAL,
    image_pos_y REAL,
    image_size REAL,
    discount_percent INTEGER,
    discount_label TEXT,
    button_text TEXT,
    button_color TEXT,
    background_color TEXT,
    border_color TEXT,
    border_radius REAL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offers (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    discount_label TEXT,
    product_ids TEXT,
    discount_percent NUMERIC(8, 2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS web_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_sync_snapshots (
    id SERIAL PRIMARY KEY,
    barcode TEXT NOT NULL UNIQUE,
    product_code TEXT,
    product_num TEXT,
    name TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(8, 2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    offer_name TEXT,
    synced_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_barcode ON inventory_sync_snapshots(barcode);

CREATE TABLE IF NOT EXISTS cart_bundles (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
    offer_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, offer_id)
);

CREATE TABLE IF NOT EXISTS cart_bundle_items (
    id SERIAL PRIMARY KEY,
    cart_bundle_id INTEGER NOT NULL REFERENCES cart_bundles(id) ON DELETE CASCADE,
    variant_id INTEGER NOT NULL REFERENCES product_variants(id)
);

CREATE TABLE IF NOT EXISTS order_bundles (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    offer_id INTEGER NOT NULL,
    offer_title TEXT NOT NULL,
    discount_percent NUMERIC(8, 2) DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_bundle_items (
    id SERIAL PRIMARY KEY,
    order_bundle_id INTEGER NOT NULL REFERENCES order_bundles(id) ON DELETE CASCADE,
    variant_id INTEGER,
    product_name TEXT,
    shade_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(12, 2) NOT NULL
);
