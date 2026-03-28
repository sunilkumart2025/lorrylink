/**
 * Unified Coordinate Parser for PostGIS/Supabase
 * Handles:
 * 1. WKT String: POINT(lng lat)
 * 2. GeoJSON Object: { coordinates: [lng, lat] }
 * 3. WKB Hex: 0101000020E6... (PostGIS raw output)
 */
export const parseWKT = (wkt) => {
  if (!wkt) return null;
  
  // 1. Handle WKB Hex String from Supabase (e.g., "0101000020E6100000...")
  if (typeof wkt === 'string' && /^[0-9A-Fa-f]+$/.test(wkt)) {
    try {
      // PostGIS WKB (Little Endian) for POINT(lng lat) SRID 4326 usually follows this pattern:
      // 01 01 00 00 20 E6 10 00 00 [8 bytes lng] [8 bytes lat]
      // We'll use a lightweight buffer-free approach to extract the doubles
      
      const buffer = Uint8Array.from(wkt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const view = new DataView(buffer.buffer);
      
      // Check for EWKB Point (0x01 = Little Endian, 0x01 = Point, 0x20000000 = Has SRID)
      const isLittleEndian = buffer[0] === 0x01;
      const type = view.getUint32(1, isLittleEndian);
      
      // Point type is 1, EWKB Point with SRID is 0x20000001 or similar
      if ((type & 0xFF) === 1) {
        const offset = (type & 0x20000000) ? 9 : 5; // Skip SRID (4 bytes) if present
        const lng = view.getFloat64(offset, isLittleEndian);
        const lat = view.getFloat64(offset + 8, isLittleEndian);
        return { lng, lat };
      }
    } catch (e) {
      console.error("WKB Parse failed:", e);
    }
  }

  // 2. Handle WKT String (e.g., "POINT(80.2707 13.0827)")
  if (typeof wkt === 'string') {
    const m = wkt.match(/POINT\(([^ ]+)\s+([^)]+)\)/i);
    return m ? { lng: parseFloat(m[1]), lat: parseFloat(m[2]) } : null;
  }
  
  // 3. Handle GeoJSON object
  if (typeof wkt === 'object' && wkt.coordinates) {
    return { lng: wkt.coordinates[0], lat: wkt.coordinates[1] };
  }
  
  return null;
};

/**
 * Approximate Haversine Distance (in km)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
