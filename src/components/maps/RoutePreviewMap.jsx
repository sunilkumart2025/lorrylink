import React from 'react';
import { Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import WebpageMap from './WebpageMap';
import '../../styles/MapTheme.css';

const cityCoords = {
  'Chennai': [13.0827, 80.2707],
  'Nagpur': [21.1458, 79.0882],
  'Delhi': [28.6139, 77.2090],
  'Pune': [18.5204, 73.8567]
};

const pickupIcon = L.divIcon({
  className: 'pickup-marker-wrapper',
  html: `<div class="pickup-pin"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function RoutePreviewMap({ legs }) {
  const polylinePoints = legs.reduce((acc, leg) => {
    if (cityCoords[leg.from]) acc.push(cityCoords[leg.from]);
    if (cityCoords[leg.to]) acc.push(cityCoords[leg.to]);
    return acc;
  }, []);

  const center = cityCoords[legs[0]?.from] || [20.5937, 78.9629];

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <WebpageMap 
        center={center} 
        zoom={5}
        bounds={polylinePoints.length > 0 ? L.polyline(polylinePoints).getBounds() : null}
      >
        {polylinePoints.map((point, idx) => (
          <Marker 
            key={idx} 
            position={point} 
            icon={pickupIcon}
          >
            <Popup>
              <div style={{ padding: '4px', fontWeight: '900', color: 'white' }}>
                {idx === 0 ? 'START' : idx === polylinePoints.length - 1 ? 'END' : 'WAYPOINT'}
              </div>
            </Popup>
          </Marker>
        ))}
        {polylinePoints.length > 1 && (
          <Polyline
            positions={polylinePoints}
            pathOptions={{
              color: '#3B82F6',
              opacity: 0.8,
              weight: 4,
              lineCap: 'round'
            }}
          />
        )}
      </WebpageMap>
    </div>
  );
}
