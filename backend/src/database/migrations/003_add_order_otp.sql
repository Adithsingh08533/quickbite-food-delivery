-- =============================================================================
-- QuickBite – Add Order OTP fields
-- Migration: 003_add_order_otp.sql
-- Description: Adds OTP fields to the orders table for delivery verification
-- =============================================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS otp VARCHAR(4) NULL,
ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_generated_at TIMESTAMPTZ NULL;
