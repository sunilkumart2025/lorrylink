import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Marker, Polyline, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, ArrowLeft, MapPin, Truck, Clock, CheckCircle,
  AlertTriangle, Compass, ChevronRight, RefreshCw, X, Maximize2, Minimize2
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import WebpageMap from '../../components/maps/WebpageMap';
import TripStatusStepper from '../../components/trip/TripStatusStepper';
import ProofUpload from '../../components/trip/ProofUpload';
import '../../styles/MapTheme.css';
import { parseWKT, calculateDistance } from '../../utils/geo';
import AlertPortal from '../../components/trip/AlertPortal';
import { Siren, ShieldAlert, Construction, Info } from 'lucide-react';

// ── OSRM API Utilities ──────────────────────────────────────────────────────
const fetchOSRMRoute = async (origin, destination) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
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

const ESTIMATED_SPEED_KMH = 50; // Highway average

export default function LiveNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useStore();

  const booking = location.state?.booking;
  
  // Dynamic Coordinate Extraction (Pillar 1.0/2.0 Fix)
  const pickup = useMemo(() => {
    if (location.state?.pickup) return location.state.pickup;
    const p = parseWKT(booking?.shipments?.pickup_location);
    return p ? { ...p, address: booking?.shipments?.pickup_address } : { lat: 13.0827, lng: 80.2707, address: 'Chennai Port' };
  }, [location.state, booking]);

  const drop = useMemo(() => {
    if (location.state?.drop) return location.state.drop;
    const d = parseWKT(booking?.shipments?.drop_location);
    return d ? { ...d, address: booking?.shipments?.drop_address } : { lat: 18.5204, lng: 73.8567, address: 'Pune Warehouse' };
  }, [location.state, booking]);

  const [livePos, setLivePos] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [currentMilestone, setCurrentMilestone] = useState(booking?.current_milestone || 'started');
  const [eta, setEta] = useState(null);
  const [distLeft, setDistLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [nextStep, setNextStep] = useState(null);
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [loadingProof, setLoadingProof] = useState(booking?.loading_proof_url);
  const [isFlyway, setIsFlyway] = useState(false);
  const [deliveryProof, setDeliveryProof] = useState(booking?.delivery_proof_url);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [showAlertPortal, setShowAlertPortal] = useState(false);
  const [proximityAlert, setProximityAlert] = useState(null);

  const watchRef = useRef(null);
  const lastSyncRef = useRef(0);

  const fetchRoute = useCallback(async (origin, destination) => {
    setLoading(true);
    setGpsError(null);
    setIsFlyway(false);
    
    try {
      const route = await fetchOSRMRoute(origin, destination);
      setRouteData(route);
      setEta(formatDuration(route.duration));
      setDistLeft(formatDistance(route.distance));
      
      if (route.legs?.[0]?.steps?.length > 0) {
        setNextStep(route.legs[0].steps[0].maneuver.instruction);
      }
    } catch (err) {
      console.warn("OSRM Failure, falling back to Haversine:", err);
      // Pillar 4.5 Fallback: Calculate straight-line distance if routing fails
      const directDistKm = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      const approxSeconds = (directDistKm / ESTIMATED_SPEED_KMH) * 3600;
      
      setDistLeft(`${directDistKm.toFixed(1)} km (Approx)`);
      setEta(formatDuration(approxSeconds));
      setIsFlyway(true);
      setRouteData(null); // Clear previous route
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMilestone = useCallback(async (nextM) => {
    if (!booking?.id) return;
    setCurrentMilestone(nextM);
    try {
      // Structure: Update current status and the specific timestamp history
      const { error } = await supabase.from('bookings').update({
        current_milestone: nextM,
        status: nextM === 'delivered' ? 'completed' : 'in_progress',
        milestone_history: {
          ...(booking?.milestone_history || {}),
          [nextM]: new Date().toISOString()
        }
      }).eq('id', booking.id);
      
      if (error) throw error;
      
      // Auto-trigger route fetch if destination changes (e.g. from pickup to drop)
      if (nextM === 'loaded') {
         fetchRoute(livePos || pickup, drop);
      }
    } catch (err) {
      console.error('Milestone update failed:', err);
    }
  }, [booking, livePos, pickup, drop, fetchRoute]);

  const startNavigation = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS not supported');
      return;
    }
    setStatus('navigating');
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLivePos(origin);
        fetchRoute(origin, drop); // Navigate to drop by default
      },
      () => setGpsError('GPS access denied'),
      { enableHighAccuracy: true }
    );

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLivePos(newPos);
        
        const now = Date.now();
        if (booking?.id && now - lastSyncRef.current > 10000) {
          lastSyncRef.current = now;
          
          // 1. Historical Log (Per-booking path)
          await supabase.from('tracking').upsert({
            booking_id: booking.id,
            location: `POINT(${newPos.lng} ${newPos.lat})`,
            speed: pos.coords.speed || 0,
            recorded_at: new Date().toISOString()
          });

          // 2. Real-time Live State (Per-device/driver current position)
          // Pillar 6.0: Constant goods monitoring
          if (user?.id) {
            await supabase.from('user_locations').upsert({
              device_id: user.id,
              latitude: newPos.lat,
              longitude: newPos.lng,
              updated_at: new Date().toISOString()
            }, { onConflict: 'device_id' });
          }
        }

        // Advanced Milestone Auto-Detection (Radius based)
        // 1. Pickup arrival (if in 'started' state)
        const pDist = Math.sqrt(Math.pow(newPos.lat - pickup.lat, 2) + Math.pow(newPos.lng - pickup.lng, 2));
        if (currentMilestone === 'started' && pDist < 0.005) { // ~500m
           updateMilestone('arrived_pickup');
        }

        // 2. Drop arrival (if in 'in_transit' state)
        const dDist = Math.sqrt(Math.pow(newPos.lat - drop.lat, 2) + Math.pow(newPos.lng - drop.lng, 2));
        if (currentMilestone === 'in_transit' && dDist < 0.005) {
           updateMilestone('arrived_destination');
           setStatus('arrived');
        }
      },
      null,
      { enableHighAccuracy: true }
    );
  };

  const stopNavigation = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    setStatus('idle');
    setLivePos(null);
  };

  const markDelivered = async () => {
    if (booking?.id) {
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id);
    }
    setStatus('arrived');
  };

  // Fetch nearby alerts (Choice 5)
  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase.from('highway_alerts').select('*').gt('expires_at', new Date().toISOString());
      if (data) setActiveAlerts(data.map(a => ({ ...a, pos: parseWKT(a.location) })));
    };

    fetchAlerts();
    const sub = supabase.channel('road-alerts').on('postgres_changes', { event: '*', table: 'highway_alerts' }, fetchAlerts).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Proximity Alert Logic
  useEffect(() => {
    if (!livePos || activeAlerts.length === 0) return;
    const nearby = activeAlerts.find(a => calculateDistance(livePos.lat, livePos.lng, a.pos.lat, a.pos.lng) < 2); // 2km
    setProximityAlert(nearby || null);
  }, [livePos, activeAlerts]);

  useEffect(() => {
    fetchRoute(pickup, drop);
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [fetchRoute, pickup, drop]);

  const routeCoordinates = useMemo(() => {
    if (!routeData?.geometry?.coordinates) return [];
    return routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }, [routeData]);

  // Custom Symbols using DivIcon for premium feel
  const truckIcon = L.divIcon({
    className: 'driver-marker-wrapper',
    html: `<div class="truck-pin"><svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5zm-14 10.5c-.83 0-1.5-.67-1.5-1.5S5.17 15.5 6 15.5s1.5.67 1.5 1.5S6.83 18.5 6 18.5zm9-9h3.5l1.96 2.5H15V9.5zm2 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path></svg></div>`,
    iconSize: [54, 54],
    iconAnchor: [27, 27]
  });

  const pickupIcon = L.divIcon({
    className: 'pickup-marker-wrapper',
    html: `<div class="pickup-pin"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <div style={{ height: '100dvh', width: '100dvw', position: 'fixed', inset: 0, zIndex: 2000, background: '#0A0A0F' }}>
      
      <WebpageMap 
        center={livePos ? [livePos.lat, livePos.lng] : [pickup.lat, pickup.lng]} 
        zoom={14}
        bounds={routeCoordinates.length > 0 ? L.polyline(routeCoordinates).getBounds() : null}
      >
        {routeCoordinates.length > 0 && (
          <>
            <Polyline 
              positions={routeCoordinates} 
              pathOptions={{ color: 'rgba(47, 118, 255, 0.28)', weight: 16, lineCap: 'round' }} 
            />
            <Polyline 
              positions={routeCoordinates} 
              pathOptions={{ color: '#2f76ff', weight: 6, lineCap: 'round' }} 
            />
          </>
        )}

        {isFlyway && (
          <Polyline 
            positions={[[pickup.lat, pickup.lng], [drop.lat, drop.lng]]}
            pathOptions={{ color: 'var(--color-warning)', weight: 4, dashArray: '10, 10', opacity: 0.6 }}
          />
        )}

        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>Pickup: {pickup.address}</Popup>
        </Marker>

        <Marker position={[drop.lat, drop.lng]} icon={pickupIcon}>
          <Popup>Destination: {drop.address}</Popup>
        </Marker>

        {livePos && (
          <Marker position={[livePos.lat, livePos.lng]} icon={truckIcon} />
        )}

        {/* Choice 5: Road Alerts Markers */}
        {activeAlerts.map(alert => (
          <Marker key={alert.id} position={[alert.pos.lat, alert.pos.lng]} icon={L.divIcon({
            className: 'alert-marker',
            html: `<div class="alert-blob" style="background: ${alert.type === 'accident' ? '#EF4444' : '#F59E0B'}"></div>`,
            iconSize: [20, 20]
          })}>
            <Tooltip permanent direction="top" offset={[0, -10]}>
              <div style={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '10px' }}>{alert.type}</div>
            </Tooltip>
          </Marker>
        ))}
      </WebpageMap>

      {/* ── Top Bar HUD ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isWidgetMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1001,
              background: 'linear-gradient(180deg, rgba(14,15,19,0.95) 0%, transparent 100%)',
              padding: '16px 20px 60px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => { stopNavigation(); navigate(-1); }}
                className="map-glass-panel"
                style={{ padding: '10px', display: 'flex' }}
              >
                <ArrowLeft size={20} color="white" />
              </button>
              <div style={{ flex: 1 }}>
                <div className="map-kicker">LoadLink Navigation</div>
                <div style={{ fontWeight: '900', fontSize: '18px', letterSpacing: '-0.5px', color: 'white' }}>
                  {status === 'arrived' ? 'Destination Reached' : 'Following Optimized Route'}
                </div>
              </div>
              <button 
                onClick={() => setIsWidgetMode(true)}
                className="map-glass-panel"
                style={{ padding: '10px', display: 'flex' }}
              >
                <Minimize2 size={20} color="white" />
              </button>
              {loading && <RefreshCw size={20} className="animate-spin" color="#2f76ff" />}
            </div>

            {/* Pillar 4.0: Modern Trip Progress Stepper */}
            <TripStatusStepper currentMilestone={currentMilestone} />

            {proximityAlert && (
              <motion.div initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }}
                style={{ background: '#EF4444', padding: '12px 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', border: '2px solid rgba(255,255,255,0.2)' }}>
                <Siren size={24} color="white" className="animate-pulse" />
                <div>
                   <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: '900' }}>CAUTION AHEAD</div>
                   <div style={{ color: 'white', fontWeight: '900', textTransform: 'uppercase' }}>{proximityAlert.type} DETECTED</div>
                </div>
              </motion.div>
            )}

            {isFlyway && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="map-glass-panel"
                style={{ padding: '12px 16px', background: 'rgba(249, 115, 22, 0.2)', border: '1px solid var(--color-warning)', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertTriangle size={16} color="var(--color-warning)" />
                  <span style={{ fontSize: '12px', color: 'white', fontWeight: '800' }}>Impossible Route Detected. Showing straight-line estimate.</span>
                </div>
              </motion.div>
            )}

            {status === 'navigating' && nextStep && !isFlyway && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="map-glass-panel"
                style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(47, 118, 255, 0.9)' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                  <Navigation size={24} color="white" />
                </div>
                <div>
                  <div className="map-kicker" style={{ color: 'rgba(255,255,255,0.7)' }}>Next Maneuver</div>
                  <div style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>{nextStep}</div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Summary HUD ─────────────────────────────────────────── */}
      <div className={`bottom-panel ${isWidgetMode ? 'mini-widget' : ''}`} style={{
        position: 'absolute', bottom: isWidgetMode ? '24px' : 0, left: isWidgetMode ? 'auto' : 0, right: 0, zIndex: 1001,
        width: isWidgetMode ? '320px' : '100%',
        margin: isWidgetMode ? '0 24px 0 0' : 0,
        background: isWidgetMode ? 'var(--map-panel-bg)' : 'linear-gradient(0deg, rgba(14,15,19,1) 0%, rgba(14,15,19,0.95) 80%, transparent 100%)',
        padding: isWidgetMode ? '20px' : '20px 20px 40px',
        borderRadius: isWidgetMode ? '24px' : 0,
        backdropFilter: 'blur(12px)',
        border: isWidgetMode ? '1px solid var(--map-panel-border)' : 'none'
      }}>
        {isWidgetMode && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div className="map-kicker">Mini Tracker</div>
            <button onClick={() => setIsWidgetMode(false)} style={{ background: 'none', border: 'none', color: 'white' }}>
              <Maximize2 size={18} />
            </button>
          </div>
        )}

        {status === 'arrived' && (
          <div className="map-glass-panel" style={{ background: 'rgba(18, 61, 37, 0.4)', border: '1px solid #c7f8d4', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
            <CheckCircle size={40} color="#c7f8d4" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ color: '#c7f8d4', fontWeight: '900' }}>DESTINATION REACHED</h3>
            <button onClick={() => navigate('/driver/bookings')} className="nav-button" style={{ marginTop: '15px', height: '44px', background: '#c7f8d4', color: '#123d25' }}>COMPLETE BOOKING</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div className="map-glass-panel" style={{ flex: 1, padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
            <Clock size={18} color="#2f76ff" style={{ marginBottom: '6px' }} />
            <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>{eta || '--'}</div>
            <div className="map-kicker">Remaining</div>
          </div>
          {!isWidgetMode && (
            <div className="map-glass-panel" style={{ flex: 1, padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
              <Navigation size={18} color="#2f76ff" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>{distLeft || '--'}</div>
              <div className="map-kicker">Distance</div>
            </div>
          )}
        </div>

        {/* Pillar 4.0: Context-Aware Action Dashboard */}
        <div className="action-dashboard">
          {currentMilestone === 'started' && status === 'idle' && (
            <button
              onClick={startNavigation}
              className="nav-button"
              style={{ width: '100%', height: '64px', background: 'var(--color-primary)', border: 'none', borderRadius: '20px', color: 'white', fontWeight: '900', fontSize: '18px' }}
            >
              START TRIP
            </button>
          )}

          {currentMilestone === 'started' && status === 'navigating' && (
             <div style={{ textAlign: 'center' }}>
               <div className="map-kicker" style={{ marginBottom: '10px' }}>Driving to Pickup Location...</div>
               <button onClick={() => updateMilestone('arrived_pickup')} style={{ width: '100%', height: '56px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-primary)', borderRadius: '18px', color: 'white', fontWeight: '900' }}>
                 MANUAL ARRIVAL AT PICKUP
               </button>
             </div>
          )}

          {currentMilestone === 'arrived_pickup' && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <h4 style={{ color: 'var(--color-success)', margin: '0 0 12px', fontWeight: '900' }}>ARRIVED AT PICKUP</h4>
              <ProofUpload 
                bookingId={booking.id} 
                type="loading" 
                onUploadComplete={(url) => {
                  setLoadingProof(url);
                  updateMilestone('loaded');
                }} 
              />
            </div>
          )}

          {currentMilestone === 'loaded' && (
             <button
               onClick={() => updateMilestone('in_transit')}
               className="nav-button"
               style={{ width: '100%', height: '60px', background: 'var(--color-primary)', border: 'none', borderRadius: '20px', color: 'white', fontWeight: '900' }}
             >
               START TRANSIT TO DESTINATION
             </button>
          )}

          {currentMilestone === 'in_transit' && (
             <div style={{ textAlign: 'center' }}>
               <div className="map-kicker" style={{ marginBottom: '10px', color: 'var(--color-warning)' }}>ON THE ROAD (LIVE TRACKING ENABLED)</div>
               <button onClick={() => updateMilestone('arrived_destination')} style={{ width: '100%', height: '56px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-warning)', borderRadius: '18px', color: 'white', fontWeight: '900' }}>
                 MANUAL ARRIVAL AT DESTINATION
               </button>
             </div>
          )}

          {currentMilestone === 'arrived_destination' && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <h4 style={{ color: 'var(--color-primary)', margin: '0 0 12px', fontWeight: '900' }}>REACHED DESTINATION</h4>
              <ProofUpload 
                bookingId={booking.id} 
                type="delivery" 
                onUploadComplete={(url) => {
                  setDeliveryProof(url);
                  // Open the finishing OTP modal from Bookings logic (we can mock or direct here)
                  setStatus('arrived'); 
                }} 
              />
            </div>
          )}

          {status === 'arrived' && currentMilestone === 'arrived_destination' && deliveryProof && (
             <div className="map-glass-panel" style={{ background: 'rgba(18, 61, 37, 0.4)', border: '1px solid #c7f8d4', padding: '20px', textAlign: 'center' }}>
                <CheckCircle size={40} color="#c7f8d4" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ color: '#c7f8d4', fontWeight: '900' }}>READY FOR OTP</h3>
                <button 
                   onClick={() => navigate('/driver/bookings', { state: { finishingBooking: booking } })} 
                   className="nav-button" 
                   style={{ marginTop: '15px', height: '48px', background: '#c7f8d4', color: '#123d25', border: 'none', borderRadius: '14px', width: '100%', fontWeight: '900' }}
                >
                   ENTER DELIVERY OTP
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Choice 5: Report Button Float */}
      <motion.button 
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => setShowAlertPortal(true)}
        style={{
          position: 'fixed', bottom: '160px', right: '20px', zIndex: 1002,
          width: '56px', height: '56px', borderRadius: '50%', background: '#EF4444',
          color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)'
        }}
      >
        <ShieldAlert size={28} />
      </motion.button>

      <AnimatePresence>
        {showAlertPortal && (
          <AlertPortal 
            location={livePos || pickup} 
            onClose={() => setShowAlertPortal(false)} 
            onSuccess={() => { /* Possible specific confirmation alert */ }}
          />
        )}
      </AnimatePresence>
      
      <style>{`
        .bottom-panel { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .nav-button { transition: transform 0.2s; cursor: pointer; }
        .nav-button:active { transform: scale(0.98); }
        .action-dashboard { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
