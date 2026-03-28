-- =============================================
-- SEED DATA: Run this in Supabase SQL Editor
-- =============================================

-- 1. First, create a dummy business profile for seed data
-- (Uses a fixed UUID so it's repeatable)
INSERT INTO profiles (id, role, name, email, home_city)
VALUES ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'business', 'TruckFleet India Pvt Ltd', 'fleet@truckfleet.in', 'Chennai')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert sample shipments with real Indian routes + PostGIS coordinates
INSERT INTO shipments (business_id, pickup_address, drop_address, pickup_location, drop_location, weight_kg, price, is_partial, status) VALUES
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Ambattur Industrial Estate, Chennai, Tamil Nadu', 'Electronic City, Bangalore, Karnataka', ST_GeogFromText('POINT(80.1548 13.1067)'), ST_GeogFromText('POINT(77.6602 12.8399)'), 8000, 28500, false, 'pending'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'JNPT Port, Navi Mumbai, Maharashtra', 'Peenya Industrial Area, Bangalore, Karnataka', ST_GeogFromText('POINT(72.9495 18.9506)'), ST_GeogFromText('POINT(77.5157 13.0280)'), 14000, 45000, false, 'pending'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Guindy, Chennai, Tamil Nadu', 'Madurai, Tamil Nadu', ST_GeogFromText('POINT(80.2083 13.0103)'), ST_GeogFromText('POINT(78.1198 9.9252)'), 3500, 12000, true, 'pending'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Whitefield, Bangalore, Karnataka', 'Anna Nagar, Chennai, Tamil Nadu', ST_GeogFromText('POINT(77.7500 12.9698)'), ST_GeogFromText('POINT(80.2108 13.0850)'), 6000, 22000, false, 'pending'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Hosur Road, Bangalore, Karnataka', 'Coimbatore, Tamil Nadu', ST_GeogFromText('POINT(77.6353 12.8998)'), ST_GeogFromText('POINT(76.9615 11.0168)'), 5500, 18500, false, 'pending'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Sriperumbudur, Chennai, Tamil Nadu', 'Hyderabad, Telangana', ST_GeogFromText('POINT(79.9424 12.9685)'), ST_GeogFromText('POINT(78.4867 17.3850)'), 10000, 35000, false, 'pending'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Manali, Chennai, Tamil Nadu', 'Vizag, Andhra Pradesh', ST_GeogFromText('POINT(80.2632 13.1666)'), ST_GeogFromText('POINT(83.3188 17.6869)'), 7200, 26000, false, 'pending'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Pune, Maharashtra', 'Goa, Goa', ST_GeogFromText('POINT(73.8567 18.5204)'), ST_GeogFromText('POINT(73.9542 15.2993)'), 2500, 9500, true, 'pending'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Kolkata Port, West Bengal', 'Jamshedpur, Jharkhand', ST_GeogFromText('POINT(88.3639 22.5726)'), ST_GeogFromText('POINT(86.1850 22.8046)'), 9500, 18000, false, 'pending'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'Okhla Industrial Area, Delhi', 'Jaipur, Rajasthan', ST_GeogFromText('POINT(77.2703 28.5310)'), ST_GeogFromText('POINT(75.7873 26.9124)'), 4200, 15500, false, 'pending');

-- Verify
SELECT id, pickup_address, drop_address, price, status FROM shipments LIMIT 10;
