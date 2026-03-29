import React, { useState, useEffect } from 'react';
import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { X, Navigation, Clock } from 'lucide-react';
import WebpageMap from '../maps/WebpageMap';
import '../../styles/MapTheme.css';

// ── OSRM API Utilities ──────────────────────────────────────────────────────
const fetchOSRMRoute = async (origin, destination) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('OSRM request failed');
  const data = await response.json();
  if (data.code !== 'Ok') throw new Error('No route found');
  return data.routes[0];
};

const formatDistance = (meters) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m`;
  }
  return `${mins}m`;
};

const pickupIcon = L.divIcon({
  className: 'pickup-marker-wrapper',
  html: `<div class="pickup-pin"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function MapPreview({ shipment, onMapClose }) {
  const [routeLine, setRouteLine] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shipment.pickupCoord && shipment.dropCoord) {
      setLoading(true);
      fetchOSRMRoute(shipment.pickupCoord, shipment.dropCoord)
        .then(route => {
          setRouteLine(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
          setMetrics({
            distance: formatDistance(route.distance),
            duration: formatDuration(route.duration)
          });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [shipment.pickupCoord, shipment.dropCoord]);

  if (!shipment.pickupCoord || !shipment.dropCoord) return null;

  const center = [shipment.pickupCoord.lat, shipment.pickupCoord.lng];

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', position: 'relative', height: '260px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <WebpageMap
        center={center}
        zoom={10}
        bounds={routeLine.length > 0 ? L.polyline(routeLine).getBounds() : null}
      >
        {routeLine.length > 0 && (
          <Polyline 
            positions={routeLine} 
            pathOptions={{ color: '#3B82F6', weight: 5, opacity: 0.8, lineCap: 'round' }} 
          />
        )}
        <Marker position={[shipment.pickupCoord.lat, shipment.pickupCoord.lng]} icon={pickupIcon} />
        <Marker position={[shipment.dropCoord.lat, shipment.dropCoord.lng]} icon={pickupIcon} />
      </WebpageMap>

      {/* Metrics Overlay */}
      {metrics && (
        <div style={{
          position: 'absolute', top: 12, left: 12, zIndex: 1000,
          display: 'flex', gap: '8px',
        }}>
          <div className="map-glass-panel" style={{ padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Navigation size={12} color="#2f76ff" />
             <span style={{ color: 'white', fontSize: '11px', fontWeight: '800' }}>{metrics.distance}</span>
          </div>
          <div className="map-glass-panel" style={{ padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
             <Clock size={12} color="#22D3EE" />
             <span style={{ color: 'white', fontSize: '11px', fontWeight: '800' }}>{metrics.duration}</span>
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onMapClose(); }}
        className="map-glass-panel"
        style={{
          position: 'absolute', top: 12, right: 12, zIndex: 1000,
          width: '32px', height: '32px', color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={16} />
      </button>

      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(4px)' }}>
          <div className="map-kicker">FETCHING OSRM ROUTE...</div>
        </div>
      )}
    </div>
  );
}
