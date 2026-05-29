-- =============================================================================
-- QuickBite – Initial Schema Migration
-- Migration: 001_initial_schema.sql
-- Description: Creates all tables, enums, indexes, and triggers
-- =============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM ('customer', 'owner', 'admin');

CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE order_status AS ENUM (
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM ('online', 'cod');

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TYPE discount_type AS ENUM ('percentage', 'flat');

CREATE TYPE notification_type AS ENUM (
  'order_placed',
  'order_accepted',
  'order_preparing',
  'order_ready',
  'order_out_for_delivery',
  'order_delivered',
  'order_cancelled',
  'promo',
  'system'
);

-- =============================================================================
-- TABLE: users
-- Primary actor table. Role-based: customer | owner | admin.
-- =============================================================================

CREATE TABLE users (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100)    NOT NULL,
  email           VARCHAR(255)    NOT NULL,
  password_hash   VARCHAR(255)    NOT NULL,
  phone           VARCHAR(15),
  role            user_role       NOT NULL DEFAULT 'customer',
  is_verified     BOOLEAN         NOT NULL DEFAULT false,
  is_banned       BOOLEAN         NOT NULL DEFAULT false,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'All platform users: customers, restaurant owners, and admins';
COMMENT ON COLUMN users.role IS 'customer | owner | admin — drives RBAC';
COMMENT ON COLUMN users.is_banned IS 'Soft ban — user cannot login when true';

-- =============================================================================
-- TABLE: refresh_tokens
-- Server-side token store enabling revocation (logout, ban, logout-all).
-- token_hash = SHA-256 of the raw refresh token (raw token never stored).
-- =============================================================================

CREATE TABLE refresh_tokens (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT    NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  is_revoked  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE refresh_tokens IS 'Hashed refresh tokens for server-side revocation';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 hash of raw token — raw value is never persisted';

-- =============================================================================
-- TABLE: addresses
-- Customer delivery addresses. One user can have multiple addresses.
-- =============================================================================

CREATE TABLE addresses (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       VARCHAR(50) NOT NULL DEFAULT 'Home',
  flat_house  TEXT        NOT NULL,
  street      TEXT        NOT NULL,
  area        TEXT        NOT NULL,
  city        VARCHAR(100) NOT NULL,
  state       VARCHAR(100) NOT NULL,
  pin_code    CHAR(6)     NOT NULL,
  latitude    NUMERIC(10, 7),
  longitude   NUMERIC(10, 7),
  is_default  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE addresses IS 'Indian-format delivery addresses per user (Flat, Street, Area, City, State, PIN)';
COMMENT ON COLUMN addresses.label IS 'User-defined label: Home | Work | Other';
COMMENT ON COLUMN addresses.pin_code IS '6-digit Indian postal code';

-- =============================================================================
-- TABLE: restaurants
-- A restaurant is owned by one user with role=owner.
-- Requires admin approval (approval_status) before appearing to customers.
-- =============================================================================

CREATE TABLE restaurants (
  id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name                VARCHAR(200)    NOT NULL,
  description         TEXT,
  cuisine_type        VARCHAR(100)    NOT NULL,
  phone               VARCHAR(15)     NOT NULL,
  address             TEXT            NOT NULL,
  city                VARCHAR(100)    NOT NULL,
  state               VARCHAR(100)    NOT NULL DEFAULT 'Karnataka',
  pin_code            CHAR(6)         NOT NULL,
  image_url           TEXT,
  avg_rating          NUMERIC(2, 1)   NOT NULL DEFAULT 0.0
                        CHECK (avg_rating >= 0.0 AND avg_rating <= 5.0),
  review_count        INTEGER         NOT NULL DEFAULT 0,
  delivery_fee        NUMERIC(8, 2)   NOT NULL DEFAULT 30.00,
  min_order_amount    NUMERIC(8, 2)   NOT NULL DEFAULT 100.00,
  delivery_time_min   INTEGER         NOT NULL DEFAULT 30
                        CHECK (delivery_time_min > 0),
  is_open             BOOLEAN         NOT NULL DEFAULT true,
  approval_status     approval_status NOT NULL DEFAULT 'pending',
  rejection_reason    TEXT,
  gstin               VARCHAR(15),
  fssai_number        VARCHAR(14),
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE restaurants IS 'Restaurant listings. Only approved restaurants are visible to customers.';
COMMENT ON COLUMN restaurants.approval_status IS 'pending → approved | rejected by admin';
COMMENT ON COLUMN restaurants.avg_rating IS 'Denormalized average — updated via trigger on reviews';
COMMENT ON COLUMN restaurants.fssai_number IS 'Food Safety and Standards Authority of India license';

-- =============================================================================
-- TABLE: food_categories
-- Categories belong to a specific restaurant (e.g. Starters, Mains, Desserts).
-- display_order controls sort order in the restaurant menu UI.
-- =============================================================================

CREATE TABLE food_categories (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  display_order   INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE food_categories IS 'Restaurant-scoped menu sections (Starters, Mains, Desserts, etc.)';

-- =============================================================================
-- TABLE: food_items
-- Individual dishes. Linked to a restaurant and optionally to a category.
-- Soft availability: is_available=false hides from menu without deletion.
-- Price is captured as snapshot in order_items — changes here don't affect history.
-- =============================================================================

CREATE TABLE food_items (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id   UUID            NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id     UUID            REFERENCES food_categories(id) ON DELETE SET NULL,
  name            VARCHAR(200)    NOT NULL,
  description     TEXT,
  price           NUMERIC(8, 2)   NOT NULL CHECK (price > 0),
  image_url       TEXT,
  is_veg          BOOLEAN         NOT NULL DEFAULT true,
  is_available    BOOLEAN         NOT NULL DEFAULT true,
  is_featured     BOOLEAN         NOT NULL DEFAULT false,
  prep_time_min   INTEGER         NOT NULL DEFAULT 20 CHECK (prep_time_min > 0),
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE food_items IS 'Individual menu items. Never hard-deleted — use is_available=false.';
COMMENT ON COLUMN food_items.is_veg IS 'true = veg (green dot), false = non-veg (red dot)';
COMMENT ON COLUMN food_items.is_featured IS 'Shown in "Popular Items" section on restaurant page';

-- =============================================================================
-- TABLE: cart_items
-- One row per (user, food_item) pair — enforced by unique constraint.
-- All cart items must be from the same restaurant (enforced in service layer).
-- =============================================================================

CREATE TABLE cart_items (
  id              UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_item_id    UUID    NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  restaurant_id   UUID    NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cart_user_food UNIQUE (user_id, food_item_id)
);

COMMENT ON TABLE cart_items IS 'Active shopping cart. Cleared on order placement.';
COMMENT ON COLUMN cart_items.restaurant_id IS 'Denormalized for fast cart-clear by restaurant validation';

-- =============================================================================
-- TABLE: coupons
-- Promo codes. Two discount types: percentage off or flat INR discount.
-- max_discount caps the saving on percentage coupons.
-- =============================================================================

CREATE TABLE coupons (
  id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                VARCHAR(30)     NOT NULL,
  description         TEXT,
  discount_type       discount_type   NOT NULL,
  discount_value      NUMERIC(8, 2)   NOT NULL CHECK (discount_value > 0),
  min_order_amount    NUMERIC(8, 2)   NOT NULL DEFAULT 0,
  max_discount        NUMERIC(8, 2),
  usage_limit         INTEGER,
  used_count          INTEGER         NOT NULL DEFAULT 0,
  is_active           BOOLEAN         NOT NULL DEFAULT true,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE coupons IS 'Discount coupons. Managed by admin. Applied at checkout.';
COMMENT ON COLUMN coupons.max_discount IS 'Max savings cap for percentage discounts (e.g. max ₹100 off)';

-- =============================================================================
-- TABLE: orders
-- Core transaction record. Status progresses through order_status enum.
-- Snapshot fields (subtotal, delivery_fee, discount_amount, total_amount)
-- are immutable after creation — price changes never affect past orders.
-- =============================================================================

CREATE TABLE orders (
  id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number            VARCHAR(20)     NOT NULL,
  user_id                 UUID            NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  restaurant_id           UUID            NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  delivery_address_id     UUID            REFERENCES addresses(id) ON DELETE SET NULL,
  coupon_id               UUID            REFERENCES coupons(id) ON DELETE SET NULL,
  status                  order_status    NOT NULL DEFAULT 'pending',
  payment_method          payment_method  NOT NULL,
  payment_status          payment_status  NOT NULL DEFAULT 'pending',
  subtotal                NUMERIC(10, 2)  NOT NULL CHECK (subtotal >= 0),
  delivery_fee            NUMERIC(8, 2)   NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  discount_amount         NUMERIC(8, 2)   NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount            NUMERIC(10, 2)  NOT NULL CHECK (total_amount >= 0),
  special_instructions    TEXT,
  estimated_delivery_at   TIMESTAMPTZ,
  placed_at               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  accepted_at             TIMESTAMPTZ,
  preparing_at            TIMESTAMPTZ,
  ready_at                TIMESTAMPTZ,
  picked_up_at            TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  cancellation_reason     TEXT,
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Core order record. All monetary values are snapshots — immutable post-creation.';
COMMENT ON COLUMN orders.order_number IS 'Human-readable ID e.g. QB-20240001. Separate from UUID PK.';
COMMENT ON COLUMN orders.payment_status IS 'Denormalized from payments table for fast reads without JOIN';

-- =============================================================================
-- TABLE: order_items
-- Line items for each order. food_name and unit_price are snapshots —
-- historical orders remain accurate even if the food item is renamed/repriced.
-- food_item_id is nullable to handle deleted food items gracefully.
-- =============================================================================

CREATE TABLE order_items (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  food_item_id    UUID            REFERENCES food_items(id) ON DELETE SET NULL,
  food_name       VARCHAR(200)    NOT NULL,
  food_image_url  TEXT,
  unit_price      NUMERIC(8, 2)   NOT NULL CHECK (unit_price > 0),
  quantity        INTEGER         NOT NULL CHECK (quantity > 0),
  total_price     NUMERIC(10, 2)  NOT NULL CHECK (total_price > 0),
  is_veg          BOOLEAN         NOT NULL DEFAULT true
);

COMMENT ON TABLE order_items IS 'Immutable line items. food_name and unit_price are point-in-time snapshots.';

-- =============================================================================
-- TABLE: payments
-- Razorpay transaction records. One payment record per order.
-- For COD orders: no razorpay fields, status=pending until delivery confirmed.
-- =============================================================================

CREATE TABLE payments (
  id                      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                UUID            NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  razorpay_order_id       VARCHAR(100),
  razorpay_payment_id     VARCHAR(100),
  razorpay_signature      TEXT,
  amount                  NUMERIC(10, 2)  NOT NULL CHECK (amount > 0),
  currency                VARCHAR(3)      NOT NULL DEFAULT 'INR',
  status                  payment_status  NOT NULL DEFAULT 'pending',
  failure_reason          TEXT,
  created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE payments IS 'Razorpay payment records. Signature verified server-side before marking paid.';

-- =============================================================================
-- TABLE: reviews
-- One review per (user, order) pair — enforced by unique constraint.
-- Customers can only review an order that was delivered to them.
-- avg_rating on restaurants is updated via application logic after each review.
-- =============================================================================

CREATE TABLE reviews (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id   UUID        NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id        UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating          INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  owner_reply     TEXT,
  replied_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_review_user_order UNIQUE (user_id, order_id)
);

COMMENT ON TABLE reviews IS 'One review per delivered order. Owner can reply.';

-- =============================================================================
-- TABLE: wishlist
-- Customers save food items for later. One row per (user, food_item) pair.
-- =============================================================================

CREATE TABLE wishlist (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_item_id    UUID        NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_wishlist_user_food UNIQUE (user_id, food_item_id)
);

COMMENT ON TABLE wishlist IS 'Customer saved/favourite food items (P2 feature).';

-- =============================================================================
-- TABLE: notifications
-- In-app notifications for all user roles. data JSONB carries context-specific
-- payload (e.g. { orderId, restaurantName }) for deep linking in the frontend.
-- =============================================================================

CREATE TABLE notifications (
  id          UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type   NOT NULL,
  title       VARCHAR(200)        NOT NULL,
  body        TEXT                NOT NULL,
  data        JSONB,
  is_read     BOOLEAN             NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'In-app notifications. data JSONB for frontend deep-linking context.';

-- =============================================================================
-- INDEXES
-- Strategy: index all FK columns, all filter/sort columns, all unique fields.
-- =============================================================================

-- users
CREATE UNIQUE INDEX idx_users_email           ON users(email);
CREATE        INDEX idx_users_role            ON users(role);
CREATE        INDEX idx_users_is_banned       ON users(is_banned) WHERE is_banned = true;

-- refresh_tokens
CREATE        INDEX idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE        INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- addresses
CREATE        INDEX idx_addresses_user_id     ON addresses(user_id);
CREATE        INDEX idx_addresses_default     ON addresses(user_id, is_default) WHERE is_default = true;

-- restaurants
CREATE        INDEX idx_restaurants_owner_id        ON restaurants(owner_id);
CREATE        INDEX idx_restaurants_city             ON restaurants(city);
CREATE        INDEX idx_restaurants_approval_status  ON restaurants(approval_status);
CREATE        INDEX idx_restaurants_is_open          ON restaurants(is_open);
CREATE        INDEX idx_restaurants_avg_rating       ON restaurants(avg_rating DESC);
CREATE        INDEX idx_restaurants_cuisine_type     ON restaurants(cuisine_type);
CREATE        INDEX idx_restaurants_approved_open    ON restaurants(approval_status, is_open)
                WHERE approval_status = 'approved';

-- food_categories
CREATE        INDEX idx_food_categories_restaurant_id ON food_categories(restaurant_id);

-- food_items
CREATE        INDEX idx_food_items_restaurant_id  ON food_items(restaurant_id);
CREATE        INDEX idx_food_items_category_id    ON food_items(category_id);
CREATE        INDEX idx_food_items_is_available   ON food_items(is_available) WHERE is_available = true;
CREATE        INDEX idx_food_items_is_featured    ON food_items(is_featured) WHERE is_featured = true;
CREATE        INDEX idx_food_items_is_veg         ON food_items(is_veg);

-- cart_items
CREATE        INDEX idx_cart_items_user_id        ON cart_items(user_id);
CREATE        INDEX idx_cart_items_restaurant_id  ON cart_items(restaurant_id);

-- coupons
CREATE UNIQUE INDEX idx_coupons_code             ON coupons(code);
CREATE        INDEX idx_coupons_is_active        ON coupons(is_active) WHERE is_active = true;
CREATE        INDEX idx_coupons_expires_at       ON coupons(expires_at);

-- orders
CREATE UNIQUE INDEX idx_orders_order_number       ON orders(order_number);
CREATE        INDEX idx_orders_user_id            ON orders(user_id);
CREATE        INDEX idx_orders_restaurant_id      ON orders(restaurant_id);
CREATE        INDEX idx_orders_status             ON orders(status);
CREATE        INDEX idx_orders_placed_at          ON orders(placed_at DESC);
CREATE        INDEX idx_orders_payment_status     ON orders(payment_status);
CREATE        INDEX idx_orders_user_placed_at     ON orders(user_id, placed_at DESC);

-- order_items
CREATE        INDEX idx_order_items_order_id      ON order_items(order_id);

-- payments
CREATE UNIQUE INDEX idx_payments_order_id         ON payments(order_id);
CREATE        INDEX idx_payments_razorpay_order   ON payments(razorpay_order_id);
CREATE        INDEX idx_payments_status           ON payments(status);

-- reviews
CREATE        INDEX idx_reviews_restaurant_id     ON reviews(restaurant_id);
CREATE        INDEX idx_reviews_user_id           ON reviews(user_id);

-- wishlist
CREATE        INDEX idx_wishlist_user_id          ON wishlist(user_id);

-- notifications
CREATE        INDEX idx_notifications_user_id     ON notifications(user_id);
CREATE        INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE        INDEX idx_notifications_created_at  ON notifications(created_at DESC);

-- =============================================================================
-- FUNCTION & TRIGGERS: auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_food_categories_updated_at
  BEFORE UPDATE ON food_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_food_items_updated_at
  BEFORE UPDATE ON food_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
