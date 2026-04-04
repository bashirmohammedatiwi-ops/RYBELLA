# Rybella Iraq - API Documentation

**Base URL:** `http://localhost:5000/api` (development)

**Authentication:** JWT Bearer token in `Authorization` header

**Currency:** Iraqi Dinar (IQD)

**Language:** Arabic (error messages and content)

---

## Authentication

### POST /auth/login
Login and get JWT token.

**Request:**
```json
{
  "email": "admin@rybella.iq",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@rybella.iq",
    "role": "admin"
  }
}
```

### POST /auth/register
Register new customer.

**Request:**
```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "password": "password123",
  "phone": "07501234567"
}
```

---

## Products

### GET /products
Get all products with filters.

**Query params:** `search`, `brand_id`, `category_id`, `min_price`, `max_price`

**Response:** Array of products with variants and images

### GET /products/:id
Get single product with variants, images, reviews.

### GET /products/:id/reviews
Get reviews for a product.

### POST /products (Admin)
Create product. `multipart/form-data`: name, brand_id, category_id, description, main_image, images[]

### PUT /products/:id (Admin)
Update product.

### DELETE /products/:id (Admin)
Delete product.

### POST /products/:id/variants (Admin)
Add variant (shade). `multipart/form-data`: shade_name, color_code, barcode, sku, price, stock, expiration_date, image

---

## Variants

### PUT /variants/:id (Admin)
Update variant.

### DELETE /variants/:id (Admin)
Delete variant.

---

## Brands

### GET /brands
Get all brands.

### POST /brands (Admin)
Create brand. `multipart/form-data`: name, logo

### PUT /brands/:id (Admin)
Update brand.

### DELETE /brands/:id (Admin)
Delete brand.

---

## Categories

### GET /categories
Get all categories.

### POST /categories (Admin)
Create category. `multipart/form-data`: name, image

### PUT /categories/:id (Admin)
Update category.

### DELETE /categories/:id (Admin)
Delete category.

---

## Orders

### GET /orders
Get orders (all for admin, user's own for customer).

### GET /orders/:id
Get single order.

### POST /orders
Create order.

**Request:**
```json
{
  "items": [
    { "variant_id": 1, "quantity": 2 }
  ],
  "address": "Full address",
  "city": "Baghdad",
  "phone": "07501234567",
  "payment_method": "cash",
  "coupon_code": "SAVE10"
}
```

### PUT /orders/:id/status (Admin)
Update order status. Body: `{ "status": "confirmed" }`

Valid statuses: pending, confirmed, processing, shipped, delivered, cancelled

---

## Reviews

### GET /reviews/products/:productId
Get reviews for a product.

### POST /reviews
Create review. Body: `{ "product_id": 1, "rating": 5, "comment": "..." }`

### GET /reviews (Admin)
Get all reviews.

### DELETE /reviews/:id (Admin)
Delete review.

---

## Coupons

### GET /coupons (Admin)
Get all coupons.

### POST /coupons (Admin)
Create coupon. Body: `{ "code": "SAVE10", "discount_percent": 10, "expiration_date": "2025-12-31" }`

### POST /coupons/apply
Apply coupon. Body: `{ "code": "SAVE10", "total_price": 50000 }`

**Response:**
```json
{
  "valid": true,
  "discount_percent": 10,
  "discount_amount": 5000,
  "final_price": 45000
}
```

---

## Cart

### GET /cart
Get cart items.

### POST /cart/add
Add to cart. Body: `{ "variant_id": 1, "quantity": 2 }`

### PUT /cart/:itemId
Update quantity. Body: `{ "quantity": 3 }`

### DELETE /cart/:itemId
Remove item from cart.

### DELETE /cart
Clear cart.

---

## Wishlist

### GET /wishlist
Get wishlist products.

### POST /wishlist/:productId
Add to wishlist.

### DELETE /wishlist/:productId
Remove from wishlist.

---

## Delivery Zones

### GET /delivery-zones
Get all delivery zones with fees.

### POST /delivery-zones (Admin)
Create zone. Body: `{ "city": "Baghdad", "delivery_fee": 5000 }`

### PUT /delivery-zones/:id (Admin)
Update zone.

### DELETE /delivery-zones/:id (Admin)
Delete zone.

---

## Dashboard (Admin)

### GET /dashboard/stats
Get dashboard statistics: total_sales, total_orders, total_customers, low_stock_products, top_selling_products.

### GET /dashboard/low-stock
Get low stock variants.

### GET /dashboard/top-products
Get top selling products.

---

## Users (Admin)

### GET /users
Get all users (customers).

### GET /users/:id
Get user by ID.

---

## Notifications

### GET /notifications
Get notifications.

### POST /notifications (Admin)
Create notification. Body: `{ "title": "...", "message": "..." }`

---

## Health Check

### GET /api/health
Returns `{ "status": "ok" }`
