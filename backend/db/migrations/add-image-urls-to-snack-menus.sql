-- Migration: Add image_urls column to snack_menus table
-- Run this on existing production database

ALTER TABLE snack_menus ADD COLUMN IF NOT EXISTS image_urls JSONB;
