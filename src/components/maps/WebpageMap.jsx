import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/MapTheme.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Component to handle map center and zoom programmatically
 */
function MapController({ center, zoom, bounds }) {
    const map = useMap();
    
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
        } else if (center) {
            map.setView(center, zoom || map.getZoom(), { animate: true });
        }
    }, [center, zoom, bounds, map]);

    return null;
}

export default function WebpageMap({ 
    center = [20.5937, 78.9629], 
    zoom = 5, 
    children, 
    style = { height: '100%', width: '100%' },
    bounds = null,
    className = ""
}) {
    return (
        <MapContainer 
            center={center} 
            zoom={zoom} 
            style={style}
            className={`webpage-map-container ${className}`}
            zoomControl={false}
            attributionControl={true}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Custom Zoom Control at Bottom Right as per webpage-map design */}
            <MapController center={center} zoom={zoom} bounds={bounds} />
            
            {children}
            
            {/* Re-implementing the zoom control position */}
            <div className="leaflet-bottom leaflet-right">
                <div className="leaflet-control-zoom leaflet-bar leaflet-control">
                    <a className="leaflet-control-zoom-in" href="#" title="Zoom in" role="button" aria-label="Zoom in" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('map-zoom-in')); }}>+</a>
                    <a className="leaflet-control-zoom-out" href="#" title="Zoom out" role="button" aria-label="Zoom out" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('map-zoom-out')); }}>-</a>
                </div>
            </div>
        </MapContainer>
    );
}

// Helper hook to handle custom zoom buttons
export function useMapZoom() {
    const map = useMap();
    useEffect(() => {
        const handleIn = () => map.zoomIn();
        const handleOut = () => map.zoomOut();
        window.addEventListener('map-zoom-in', handleIn);
        window.addEventListener('map-zoom-out', handleOut);
        return () => {
            window.removeEventListener('map-zoom-in', handleIn);
            window.removeEventListener('map-zoom-out', handleOut);
        };
    }, [map]);
}
