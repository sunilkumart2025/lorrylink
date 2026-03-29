import React, { useState, useEffect, useCallback } from 'react';
import { Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../../lib/supabase';
import { Truck, Package, Navigation, Info, Search } from 'lucide-react';
import WebpageMap from './WebpageMap';
import '../../styles/MapTheme.css';

// ── WKT parser ─────────────────────────────────────────────────────────────
function parseWKT(wkt) {
  if (!wkt) return null;
  if (typeof wkt === 'string') {
    const m = wkt.match(/POINT\(([^ ]+)\s+([^)]+)\)/);
    return m ? { lat: parseFloat(m[2]), lng: parseFloat(m[1]) } : null;
  }
  if (typeof wkt === 'object' && wkt.coordinates) {
    return { lat: wkt.coordinates[1], lng: wkt.coordinates[0] };
  }
  return null;
}

function getCity(address) {
  if (!address) return 'Location';
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim();
}

const truckIcon = L.divIcon({
  className: 'driver-marker-wrapper',
  html: `<div class="truck-pin"><svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5zm-14 10.5c-.83 0-1.5-.67-1.5-1.5S5.17 15.5 6 15.5s1.5.67 1.5 1.5S6.83 18.5 6 18.5zm9-9h3.5l1.96 2.5H15V9.5zm2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path></svg></div>`,
  iconSize: [54, 54],
  iconAnchor: [27, 27]
});

const pickupIcon = L.divIcon({
  className: 'pickup-marker-wrapper',
  html: `<div class="pickup-pin" style="background:#22C55E; border-color:#FFFFFF"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function LiveFleetMap() {
  const [currentPos, setCurrentPos] = useState(null);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState(null);

  useEffect(() => {
    const fetchLoads = async (pos) => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'pending')
        .limit(100); 

      if (!error && data) {
        let parsedData = data.map(s => ({
          ...s,
          coord: parseWKT(s.pickup_location)
        })).filter(s => s.coord);

        if (pos) {
          const radius = 1.0; // Approx 111km
          parsedData = parsedData.filter(s => {
            const d = Math.sqrt(Math.pow(s.coord.lat - pos.lat, 2) + Math.pow(s.coord.lng - pos.lng, 2));
            return d < radius;
          });
        }
        setLoads(parsedData);
      }
      setLoading(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentPos(myPos);
          fetchLoads(myPos);
        },
        () => fetchLoads(null),
        { enableHighAccuracy: true }
      );
    } else {
      fetchLoads(null);
    }
  }, []);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <WebpageMap center={currentPos ? [currentPos.lat, currentPos.lng] : [20.5937, 78.9629]} zoom={currentPos ? 12 : 5}>
        {currentPos && (
          <>
            <Marker position={[currentPos.lat, currentPos.lng]} icon={truckIcon} />
            <Circle 
              center={[currentPos.lat, currentPos.lng]} 
              radius={1000} 
              pathOptions={{ fillColor: '#3B82F6', fillOpacity: 0.1, color: '#3B82F6', weight: 1 }}
            />
          </>
        )}

        {loads.map(load => (
          <Marker 
            key={load.id} 
            position={[load.coord.lat, load.coord.lng]} 
            icon={pickupIcon}
            eventHandlers={{ click: () => setSelectedLoad(load) }}
          >
            <Popup>
               <div style={{ padding: '8px', minWidth: '200px', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', background: 'rgba(34,197,94,0.1)', color: '#22C55E', padding: '2px 8px', borderRadius: '10px' }}>PENDING LOAD</span>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#22C55E' }}>₹{load.price?.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px' }}>{getCity(load.pickup_address)} → {getCity(load.drop_address)}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>{load.pickup_address}</div>
                  <button 
                    onClick={() => window.location.hash = `#/driver/matches`}
                    className="nav-button"
                    style={{ 
                      width: '100%', height: '40px', background: '#3B82F6', color: 'white', border: 'none', 
                      borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    BID & NAVIGATE
                  </button>
                </div>
            </Popup>
          </Marker>
        ))}
      </WebpageMap>

      {/* Floating Info Card removed per user request */}

      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(10,10,15,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', borderRadius: 'inherit' }}>
           <div className="map-glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 28px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #2f76ff', borderTopColor: 'transparent', animation: 'spin 1.0s linear infinite' }}></div>
              <span className="map-kicker" style={{ color: '#2f76ff' }}>GPS SYNCING...</span>
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
