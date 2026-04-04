-- Rybella Iraq - Seed Data
-- Run this after schema.sql
-- Admin user is created by run-seed.js (password: Admin@123)

-- Delivery zones
INSERT INTO delivery_zones (city, delivery_fee) VALUES
('بغداد', 5000),
('البصرة', 7000),
('الموصل', 8000),
('أربيل', 6000),
('النجف', 5500),
('كربلاء', 5500),
('الديوانية', 6500),
('العمارة', 7000),
('السليمانية', 6000),
('بابل', 5000);

-- Brands
INSERT INTO brands (name, logo) VALUES
('مايبلين', NULL),
('لوريال', NULL),
('ريفولون', NULL),
('ماك', NULL),
('نيڤيا', NULL),
('جونسون', NULL),
('افون', NULL),
('اوريفليم', NULL);

-- Categories
INSERT INTO categories (name, image) VALUES
('مكياج العيون', NULL),
('مكياج الشفاه', NULL),
('مكياج الوجه', NULL),
('العناية بالبشرة', NULL),
('العناية بالشعر', NULL),
('العطور', NULL),
('أدوات التجميل', NULL);

-- Sample product with variants
INSERT INTO products (name, brand_id, category_id, description, main_image) VALUES
('كريم أساس سائل', 1, 3, 'كريم أساس سائل بتغطية متوسطة يدوم طوال اليوم. مناسب لجميع أنواع البشرة.', NULL),
('أحمر شفاه مات', 2, 2, 'أحمر شفاه بتشطيبة ماتية ناعمة. يرطب الشفاه ويدوم لساعات.', NULL),
('ظلال عيون', 3, 1, 'باليت ظلال عيون بألوان متناسقة. سهل التطبيق والخلط.', NULL);

-- Product variants (shades)
INSERT INTO product_variants (product_id, shade_name, color_code, barcode, sku, price, stock, image, expiration_date) VALUES
(1, 'بيج فاتح', '#F5DEB3', '6221001234567', 'MB-FOUND-001', 45000, 50, NULL, '2026-12-31'),
(1, 'بيج متوسط', '#DEB887', '6221001234568', 'MB-FOUND-002', 45000, 35, NULL, '2026-12-31'),
(1, 'بيج غامق', '#8B7355', '6221001234569', 'MB-FOUND-003', 45000, 20, NULL, '2026-06-30'),
(2, 'وردي', '#FF69B4', '6222001234567', 'LOR-LIP-001', 35000, 40, NULL, '2026-09-15'),
(2, 'أحمر كلاسيكي', '#DC143C', '6222001234568', 'LOR-LIP-002', 35000, 60, NULL, '2026-09-15'),
(3, 'نود', '#C4A484', '6223001234567', 'REV-EYE-001', 55000, 25, NULL, '2026-03-31');

-- Coupons
INSERT INTO coupons (code, discount_percent, expiration_date, active) VALUES
('RYBELLA10', 10, '2025-12-31', 1),
('WELCOME20', 20, '2025-06-30', 1),
('SUMMER15', 15, '2025-08-31', 1);

-- Notifications
INSERT INTO notifications (title, message) VALUES
('مرحباً بك في ريبيلا العراق', 'نرحب بك في متجرنا. استمتع بتجربة تسوق فريدة من نوعها.'),
('عرض خاص', 'خصم 20% على جميع منتجات المكياج حتى نهاية الشهر.');
