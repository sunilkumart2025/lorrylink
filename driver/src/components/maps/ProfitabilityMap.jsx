import React, { useMemo, useState } from 'react';
import { Circle, Popup } from 'react-leaflet';
import WebpageMap from './WebpageMap';
import { useHeatmapData } from '../../hooks/useHeatmapData';
import '../../styles/MapTheme.css';

export default function ProfitabilityMap({ filterHome }) {
  const { data: rawData, isLoading, error } = useHeatmapData();
  const [selectedPoint, setSelectedPoint] = useState(null);

  const heatmapData = useMemo(() => {
    if (!rawData) return [];
    if (!filterHome) return rawData.map(p => ({ ...p, position: [p.position[0], p.position[1]] }));
    return rawData
      .filter(p => p.city.toLowerCase().includes(filterHome.toLowerCase()))
      .map(p => ({ ...p, position: [p.position[0], p.position[1]] }));
  }, [rawData, filterHome]);

  const getColor = (tier) => {
    switch (tier) {
      case 'HOT': return '#EF4444';
      case 'MODERATE': return '#FACC15';
      case 'COLD': return '#3B82F6';
      default: return '#9CA3AF';
    }
  };

  const getRadius = (count) => {
    // Leaflet Circle radius is in meters, same as Google
    return Math.min(Math.max(count * 5000, 20000), 100000);
  };

  if (isLoading) return <div style={{ height: '400px', background: '#0b0b0b', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2f76ff', fontWeight: '900' }}>LOADING FREIGHT MAP...</div>;
  if (error) return <div style={{ height: '400px', background: '#0b0b0b', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>Error: {error.message}</div>;

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '24px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
      <WebpageMap center={[20.5937, 78.9629]} zoom={5}>
        {heatmapData.map((point, idx) => (
          <Circle
            key={idx}
            center={point.position}
            radius={getRadius(point.count)}
            pathOptions={{ 
              fillColor: getColor(point.tier),
              fillOpacity: 0.4,
              color: '#FFFFFF',
              weight: 1,
              className: 'clickable-circle'
            }}
            eventHandlers={{
              click: () => setSelectedPoint(point),
            }}
          >
            <Popup>
              <div style={{ padding: '8px', minWidth: '150px', color: 'white' }}>
                <strong style={{ fontSize: '14px' }}>{point.city}</strong>
                <div style={{ marginTop: '6px', fontSize: '12px' }}>
                  <span style={{ color: getColor(point.tier), fontWeight: 'bold' }}>{point.tier} DEMAND</span>
                  <br />
                  Active Loads: <strong>{point.count}</strong>
                  <br />
                  Avg Rate: <strong>₹{point.avgRate.toLocaleString()}</strong>
                </div>
              </div>
            </Popup>
          </Circle>
        ))}
      </WebpageMap>
      
      {/* Legend Overlay */}
      <div className="map-glass-panel" style={{
        position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000,
        padding: '16px', borderRadius: '20px', fontSize: '11px'
      }}>
        <strong className="map-kicker" style={{ display: 'block', marginBottom: '10px' }}>Market Pulse</strong>
        <LegendItem color="#EF4444" label="High Demand" />
        <LegendItem color="#FACC15" label="Moderate" />
        <LegendItem color="#3B82F6" label="Stable" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
      <div style={{ height: '10px', width: '10px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></div>
      <span style={{ fontWeight: '700', color: 'white' }}>{label}</span>
    </div>
  );
}
