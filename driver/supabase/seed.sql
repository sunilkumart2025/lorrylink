-- =========================================
-- 👤 SEED PROFILES
-- =========================================
-- Note: Replace with actual auth.uid() values if running against a live system.
-- For local/demo, these are mock IDs.
INSERT INTO profiles (id, name, phone, role) VALUES 
('00000000-0000-0000-0000-000000000001', 'Arjun Singh', '+919988776655', 'driver'),
('00000000-0000-0000-0000-000000000002', 'Mahendra Yadav', '+918877665544', 'driver'),
('00000000-0000-0000-0000-000000000003', 'Priya Sharma Logistics', '+917766554433', 'business'),
('00000000-0000-0000-0000-000000000004', 'Tata Steel Hub', '+916655443322', 'business');

-- =========================================
-- 🚛 SEED TRUCKS
-- =========================================
INSERT INTO trucks (driver_id, vehicle_number, vehicle_type, capacity_kg) VALUES 
('00000000-0000-0000-0000-000000000001', 'MH-12-PQ-9876', '22-Wheeler Trailer', 18000),
('00000000-0000-0000-0000-000000000002', 'DL-01-AB-1234', '14-Wheeler Container', 12000);

-- =========================================
-- 📦 SEED SHIPMENTS (20+ Loads for Heatmap)
-- =========================================

-- CHENNAI (HOT ZONE)
INSERT INTO shipments (business_id, pickup_address, drop_address, pickup_location, drop_location, weight_kg, price, status) VALUES 
('00000000-0000-0000-0000-000000000003', 'Chennai North Port', 'Mumbai Port', ST_GeographyFromText('POINT(80.2707 13.0827)'), ST_GeographyFromText('POINT(72.8777 19.0760)'), 15000, 65000, 'pending'),
('00000000-0000-0000-0000-000000000003', 'Chennai industrial Estate', 'Pune Chakan', ST_GeographyFromText('POINT(80.1234 13.0456)'), ST_GeographyFromText('POINT(73.8567 18.5204)'), 12000, 58000, 'pending'),
('00000000-0000-0000-0000-000000000003', 'Oragadam, Chennai', 'Nagpur MIHAN', ST_GeographyFromText('POINT(80.0000 12.8000)'), ST_GeographyFromText('POINT(79.0882 21.1458)'), 18000, 42000, 'pending'),
('00000000-0000-0000-0000-000000000003', 'SIPCOT Chennai', 'Gurgaon Sect 34', ST_GeographyFromText('POINT(80.2000 12.9000)'), ST_GeographyFromText('POINT(77.0266 28.4595)'), 8000, 72000, 'pending');

-- DELHI (HOT ZONE)
INSERT INTO shipments (business_id, pickup_address, drop_address, pickup_location, drop_location, weight_kg, price, status) VALUES 
('00000000-0000-0000-0000-000000000004', 'Okhla Phase 3, Delhi', 'Mumbai Port', ST_GeographyFromText('POINT(77.2090 28.6139)'), ST_GeographyFromText('POINT(72.8777 19.0760)'), 14000, 68000, 'pending'),
('00000000-0000-0000-0000-000000000004', 'Ludhiana Hosiery Hub', 'Delhi Inland Port', ST_GeographyFromText('POINT(75.8573 30.9010)'), ST_GeographyFromText('POINT(77.2666 28.5333)'), 5000, 12000, 'pending'),
('00000000-0000-0000-0000-000000000004', 'Delhi Airport T3 Cargo', 'Bangalore Airport', ST_GeographyFromText('POINT(77.1000 28.5500)'), ST_GeographyFromText('POINT(77.7068 13.1986)'), 1000, 95000, 'pending');

-- MUMBAI (HOT ZONE)
INSERT INTO shipments (business_id, pickup_address, drop_address, pickup_location, drop_location, weight_kg, price, status) VALUES 
('00000000-0000-0000-0000-000000000004', 'JNPT Port Mumbai', 'Nagpur Yard', ST_GeographyFromText('POINT(72.9500 18.9500)'), ST_GeographyFromText('POINT(79.0882 21.1458)'), 20000, 45000, 'pending'),
('00000000-0000-0000-0000-000000000004', 'Navi Mumbai Warehouse', 'Hyderabad IT Park', ST_GeographyFromText('POINT(73.0297 19.0330)'), ST_GeographyFromText('POINT(78.4867 17.3850)'), 12000, 32000, 'pending'),
('00000000-0000-0000-0000-000000000004', 'Andheri East, Mumbai', 'Kolkata Salt Lake', ST_GeographyFromText('POINT(72.8691 19.1136)'), ST_GeographyFromText('POINT(88.3639 22.5726)'), 15000, 85000, 'pending');

-- KOLKATA (MODERATE)
INSERT INTO shipments (business_id, pickup_address, drop_address, pickup_location, drop_location, weight_kg, price, status) VALUES 
('00000000-0000-0000-0000-000000000003', 'Haldia Port', 'Gwahati Hub', ST_GeographyFromText('POINT(88.0833 22.0167)'), ST_GeographyFromText('POINT(91.7362 26.1158)'), 18000, 48000, 'pending'),
('00000000-0000-0000-0000-000000000003', 'Siliguri Transit', 'Patna Warehouse', ST_GeographyFromText('POINT(88.4237 26.7271)'), ST_GeographyFromText('POINT(85.1376 25.5941)'), 4000, 15000, 'pending');

-- =========================================
-- ⚡ AUTO-GENERATE MATCHES
-- =========================================
-- This calls the AI Match Function provided in schema.sql
SELECT find_matches();
