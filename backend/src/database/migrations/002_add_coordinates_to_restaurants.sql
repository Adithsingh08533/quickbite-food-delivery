-- =============================================================================
-- QuickBite – Add Coordinates to Restaurants
-- Migration: 002_add_coordinates_to_restaurants.sql
-- Description: Adds latitude and longitude for geospatial queries
-- =============================================================================

ALTER TABLE restaurants
ADD COLUMN latitude NUMERIC(10, 7),
ADD COLUMN longitude NUMERIC(10, 7);

-- Create an index for geospatial queries (assuming B-tree is sufficient, though GiST + PostGIS is better for scale)
CREATE INDEX idx_restaurants_coordinates ON restaurants(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
