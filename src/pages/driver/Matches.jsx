import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Check, X, Home, MapPin, ChevronDown, ChevronUp,
  Navigation, RotateCcw, Truck, Weight, IndianRupee, Clock, CheckSquare, Square
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { isHeadingHome } from '../../lib/homeRoute';
import { useShipments } from '../../hooks/useShipments';
import AcceptLoadModal from '../../components/booking/AcceptLoadModal';
import ChatWindow from '../../components/chat/ChatWindow';

// Lazy load the MapPreview to keep the main bundle extremely lightweight
const MapPreview = React.lazy(() => import('../../components/map/MapPreview'));

// ── WKT parser ─────────────────────────────────────────────────────────────
function parseWKT(wkt) {
  if (!wkt) return null;
  // Case 1: WKT String (e.g., "POINT(80.123 13.456)")
  if (typeof wkt === 'string') {
    const m = wkt.match(/POINT\(([^ ]+)\s+([^)]+)\)/);
    return m ? { lat: parseFloat(m[2]), lng: parseFloat(m[1]) } : null;
  }
  // Case 2: PostGIS Point Object (e.g., { type: 'Point', coordinates: [lng, lat] })
  if (typeof wkt === 'object' && wkt.coordinates) {
    return { lat: wkt.coordinates[1], lng: wkt.coordinates[0] };
  }
  return null;
}

// ── Filters ────────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Home Route', 'Full Load', 'Part Load', 'High Value'];

export default function AvailableLoads() {
  const { t } = useTranslation();
  const { user, activePost } = useStore();
  const queryClient = useQueryClient();
  const [filter, setFilter]       = useState('All');
  const [expanded, setExpanded]   = useState(null);
  const [mapOpen, setMapOpen]     = useState(null);
  const [routeData, setRouteData] = useState({});
  const [accepted, setAccepted]   = useState(new Set());
  const [dismissed, setDismissed] = useState(new Set());
  const [selectedLoadIds, setSelectedLoadIds] = useState(new Set());
  const [loadingMap, setLoadingMap] = useState(null);
  const [acceptingShipment, setAcceptingShipment] = useState(null);
  const [chatShipment, setChatShipment] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS access denied", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const homeCity = user?.home_city || 'Chennai';

  // ── Smart Fetching via PostGIS RPC or Fallback ──────────────────────────
  const { data: rawShipments = [], isLoading, error, refetch } = useShipments(user?.id);


  // Parse WKT locally
  const shipments = rawShipments.map(s => {
    const pCoord = parseWKT(s.pickup_location);
    const dCoord = parseWKT(s.drop_location);
    let distFromMe = null;
    if (currentPos && pCoord) {
       distFromMe = Math.sqrt(Math.pow(pCoord.lat - currentPos.lat, 2) + Math.pow(pCoord.lng - currentPos.lng, 2)) * 111;
    }
    
    // Calculate distance to active search destination (Nearby + Fuzzy Logic)
    let distToSearch = null;
    if (activePost?.destCoords && pCoord) {
      distToSearch = Math.sqrt(Math.pow(pCoord.lat - activePost.destCoords[1], 2) + Math.pow(pCoord.lng - activePost.destCoords[0], 2)) * 111;
    }

    return {
      ...s,
      pickupCoord: pCoord,
      dropCoord:   dCoord,
      distFromMe,
      distToSearch
    };
  });

  // ── Edge Function Fetch for Route Caching ────────────────────────────────
  const openMap = useCallback(async (shipment) => {
    setMapOpen(shipment.id);
    if (!routeData[shipment.id] && shipment.pickupCoord && shipment.dropCoord) {
      setLoadingMap(shipment.id);
      try {
        const { data, error } = await supabase.functions.invoke('get-osrm-route', {
          body: { fromCoord: shipment.pickupCoord, toCoord: shipment.dropCoord },
        });

        if (error) throw error;
        if (data) {
          setRouteData(prev => ({ ...prev, [shipment.id]: data }));
        }
      } catch (err) {
        console.error("OSRM Edge Function error:", err);
      } finally {
        setLoadingMap(null);
      }
    }
  }, [routeData]);

  // ── Bulk Accept Booking ───────────────────────────────────────────────────
  const handleBulkAccept = async () => {
    if (!user?.id) return;
    const { createBooking } = await import('../../lib/db/bookings');
    const selectedLoads = visible.filter(s => selectedLoadIds.has(s.id));
    for (const load of selectedLoads) {
      const { error } = await createBooking({
        shipment_id: load.id,
        driver_id: user.id,
        business_id: load.business_id,
        agreed_price: load.gross_rate,
        status: 'requested',
      });
      if (!error) {
        setAccepted(prev => new Set([...prev, load.id]));
      }
    }
    setSelectedLoadIds(new Set());
    queryClient.invalidateQueries(['shipments']);
  };

  // ── Single Accept (opens modal) ──────────────────────────────────────────
  const handleAcceptSingle = (shipment) => {
    if (!user?.id) { alert('Please log in.'); return; }
    setAcceptingShipment(shipment);
  };

  const handleAcceptComplete = (shipmentId) => {
    setAccepted(prev => new Set([...prev, shipmentId]));
    queryClient.invalidateQueries(['shipments']);
  };
  const toggleSelection = (e, id) => {
    e.stopPropagation();
    setSelectedLoadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Filter + Sort ────────────────────────────────────────────────────────
  const visible = shipments
    .filter(s => !dismissed.has(s.id))
    .filter(s => {
      // STRICT FILTER: If driver just searched, only show loads within 50km of destination
      if (activePost?.destCoords && s.distToSearch !== null) {
        return s.distToSearch < 50; 
      }
      return true;
    })
    .map(s => ({
      ...s,
      isHomeRoute: s.distance_home_km !== undefined 
        ? s.distance_home_km < 100 
        : isHeadingHome({ drop_address: s.drop_address }, homeCity)
    }))
    .filter(s => {
      if (filter === 'Home Route') return s.isHomeRoute;
      if (filter === 'Full Load')  return s.requirements === 'Full Load';
      if (filter === 'Part Load')  return s.requirements === 'Part Load';
      if (filter === 'High Value') return s.gross_rate > 30000;
      return true;
    })
    .sort((a, b) => {
      // 1. All filter prioritized by proximity
      if (filter === 'All' && a.distFromMe && b.distFromMe) {
          return a.distFromMe - b.distFromMe;
      }
      // 2. Home Route sorting
      if (filter === 'Home Route') {
        return (a.distance_home_km || 0) - (b.distance_home_km || 0);
      }
      // 3. Fallback: Rate
      return b.gross_rate - a.gross_rate;
    });

  const homeCount = shipments.filter(s =>
    !dismissed.has(s.id) && 
    (s.distance_home_km !== undefined ? s.distance_home_km < 100 : isHeadingHome({ drop_address: s.drop_address }, homeCity))
  ).length;

  return (
    <div className="app-page" style={{ minHeight: '100dvh' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="card-glass" style={{
        padding: '22px 20px',
        marginBottom: '18px',
        position: 'sticky', top: 'var(--driver-mobile-sticky-top, 16px)', zIndex: 10,
      }}>
        <div className="app-page-header" style={{ marginBottom: '4px' }}>
          <div className="app-title-wrap">
            <h1 className="app-page-title" style={{ fontSize: '2rem', margin: 0 }}>{t('matches.title')}</h1>
            <p className="app-page-subtitle" style={{ color: 'var(--color-primary)' }}>
              {isLoading
                ? t('post.matching')
                : `${visible.length} ${t('matches.title').toLowerCase()} · ${homeCount} approx to ${homeCity}`}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            style={{
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: '10px', padding: '8px', color: 'var(--color-primary)', cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginTop: '12px' }}>
          {FILTERS.map(f => {
            const active  = filter === f;
            const isHome  = f === 'Home Route';
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`app-chip${active ? ' is-active' : ''}`}
                style={{
                  borderColor: active && isHome ? 'rgba(34,197,94,0.28)' : undefined,
                  background: active && isHome ? 'rgba(34,197,94,0.1)' : undefined,
                  color: active && isHome ? 'var(--color-success)' : undefined,
                }}
              >
                {isHome && <Home size={10} />}
                {f === 'Home Route' ? t('matches.filter_home') : f}
                {f === 'Home Route' && homeCount > 0 && (
                  <span style={{ background: 'var(--color-success)', color: '#fff', borderRadius: '10px', padding: '0 5px', fontSize: '10px', fontWeight: '900' }}>
                    {homeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>

        {/* Home route banner */}
        <AnimatePresence>
          {homeCount > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              onClick={() => setFilter('Home Route')}
              className="app-banner positive"
              style={{ marginBottom: '14px', cursor: 'pointer' }}
            >
              <div style={{ background: 'var(--color-success)', padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
                <Home size={18} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {homeCount} Load{homeCount > 1 ? 's' : ''} drop near {homeCity}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Based on exact PostGIS map calculations
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--color-success)' }}>VIEW →</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card-glass" style={{ height: '100px', opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card-glass app-empty-card" style={{ border: '1px solid rgba(239,68,68,0.22)' }}>
            <Package size={40} color="var(--color-error)" style={{ marginBottom: '12px' }} />
            <h3 style={{ color: 'var(--color-error)', marginBottom: '8px', fontSize: '16px' }}>Failed to fetch loads</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '16px', wordBreak: 'break-all' }}>
              {error.message}
            </p>
            <button onClick={() => refetch()} style={{
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: '10px', padding: '10px 24px', color: 'var(--color-primary)',
              fontWeight: '700', cursor: 'pointer', fontSize: '13px',
            }}>
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && visible.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glass app-empty-card">
            <Package size={48} color="var(--color-text-muted)" style={{ marginBottom: '16px', opacity: 0.18 }} />
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>No loads found</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
              Check back — loads refresh automatically.
            </p>
          </motion.div>
        )}

        {/* Load cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <AnimatePresence>
            {visible.map((s, idx) => {
              const isExpanded = expanded === s.id;
              const isAccepted = accepted.has(s.id);
              const isSelected = selectedLoadIds.has(s.id);
              const isHome     = s.isHomeRoute;

              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03 }}
                  className="card-glass"
                  style={{
                    padding: 0, overflow: 'hidden',
                    border: isAccepted
                      ? '1px solid rgba(34,197,94,0.4)'
                      : isSelected 
                      ? '1px solid var(--color-primary)'
                      : isHome
                      ? '1px solid rgba(34,197,94,0.2)'
                      : '1px solid rgba(255,255,255,0.07)',
                    background: isAccepted
                      ? 'rgba(34,197,94,0.06)'
                      : isSelected
                      ? 'rgba(59,130,246,0.1)'
                      : isHome
                      ? 'rgba(34,197,94,0.03)'
                      : 'var(--glass-bg)',
                  }}
                >
                  {/* Home ribbon */}
                  {isHome && (
                    <div style={{
                      background: 'rgba(34,197,94,0.1)', padding: '5px 16px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                      borderBottom: '1px solid rgba(34,197,94,0.12)',
                    }}>
                      <Home size={11} color="var(--color-success)" />
                      <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        {t('matches.filter_home')} {s.distance_home_km !== undefined && `— ${Math.round(s.distance_home_km)} ${t('matches.away')}`}
                      </span>
                    </div>
                  )}

                  {/* Card summary row */}
                  <div
                    style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', gap: '12px' }}
                    onClick={() => setExpanded(isExpanded ? null : s.id)}
                  >
                    {/* Bulk Selection Checkbox */}
                    {!isAccepted && (
                      <div onClick={(e) => toggleSelection(e, s.id)} style={{ alignSelf: 'center', paddingRight: '4px' }}>
                        {isSelected ? <CheckSquare size={20} color="var(--color-primary)" /> : <Square size={20} color="rgba(255,255,255,0.3)" />}
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ background: isHome ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.12)', padding: '8px', borderRadius: '10px' }}>
                            <Package size={15} color={isHome ? 'var(--color-success)' : 'var(--color-primary)'} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: 'white' }}>{s.requirements}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Weight size={10} /> {s.weight} {t('matches.tons')}
                              {s.distFromMe && (
                                <>
                                  <span style={{ margin: '0 4px', opacity: 0.3 }}>•</span>
                                  <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>{Math.round(s.distFromMe)} {t('matches.away')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Rate */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '900', fontSize: '20px', color: 'var(--color-success)' }}>
                            ₹{s.gross_rate?.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{t('matches.gross')}</div>
                        </div>
                      </div>

                      {/* Route row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('matches.pickup')}</div>
                          <div style={{ fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.origin}</div>
                        </div>
                        <div style={{ color: 'var(--color-primary)', fontSize: '16px', flexShrink: 0 }}>→</div>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                          <div style={{ fontSize: '9px', color: isHome ? 'var(--color-success)' : 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isHome ? t('matches.filter_home') : t('matches.drop')}</div>
                          <div style={{ fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isHome ? 'var(--color-success)' : 'white' }}>{s.destination}</div>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.2)', marginLeft: '4px' }}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded panel ───────────────────────────────────── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                          
                          {/* Advanced View Tooltip for Earnings */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', marginBottom: '12px' }}>
                            <div style={{ flex: 1, position: 'relative', overflow: 'visible' }}>
                              <StatChip icon={<IndianRupee size={12} />} label={t('matches.net_earn')} value={`₹${Math.round(s.gross_rate * 0.98).toLocaleString('en-IN')}`} color="var(--color-success)" />
                            </div>
                            <StatChip icon={<Weight size={12} />} label={t('matches.weight')} value={`${s.weight}T`} color="var(--color-warning)" />
                            <StatChip icon={<Clock size={12} />} label={t('matches.posted')} value={s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Today'} color="var(--color-accent)" />
                          </div>

                          {/* Full address detail */}
                          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '12px 14px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <MapPin size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pickup Address</div>
                                <div style={{ fontSize: '13px', color: 'white', marginTop: '2px' }}>{s.pickup_address || '—'}</div>
                              </div>
                            </div>
                            <div style={{ width: '2px', height: '12px', background: 'rgba(255,255,255,0.08)', marginLeft: '6px', marginBottom: '10px' }} />
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                              <MapPin size={14} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                              <div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Drop Address</div>
                                <div style={{ fontSize: '13px', color: 'white', marginTop: '2px' }}>{s.drop_address || '—'}</div>
                              </div>
                            </div>
                          </div>

                          {/* ── LAZY ROUTE MAP PREVIEW ──────────────────────────────── */}
                          {s.pickupCoord && s.dropCoord ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); openMap(s); }}
                                style={{
                                  width: '100%', height: '44px', marginBottom: '10px',
                                  background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)',
                                  borderRadius: '12px', color: 'var(--color-accent)', fontWeight: '700',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px',
                                }}
                              >
                                <Navigation size={15} /> Preview Route on Map
                              </button>

                              <AnimatePresence>
                                {mapOpen === s.id && (
                                  <Suspense fallback={<div style={{height: 260, borderRadius: 16, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading Map Engine...</div>}>
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 260, opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                      <MapPreview 
                                        shipment={s} 
                                        routeData={routeData[s.id]} 
                                        loadingMap={loadingMap === s.id} 
                                        onMapClose={() => setMapOpen(null)} 
                                      />
                                    </motion.div>
                                  </Suspense>
                                )}
                              </AnimatePresence>
                            </>
                          ) : (
                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '10px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                              📍 No GPS coordinates for map preview
                            </div>
                          )}

                          {/* CTA buttons */}
                          {isAccepted ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', justifyContent: 'center' }}>
                                <Check size={16} color="var(--color-success)" />
                                <span style={{ color: 'var(--color-success)', fontWeight: '700', fontSize: '14px' }}>Interest Sent!</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setChatShipment(s); }}
                                style={{ flex: 1, height: '46px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', color: 'var(--color-primary)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              >
                                <Navigation size={15} /> Message
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setChatShipment(s); }}
                                style={{ flex: 1, height: '46px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                              >
                                <Navigation size={15} /> Chat
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAcceptSingle(s); }}
                                style={{ flex: 2, height: '46px', background: 'linear-gradient(135deg, var(--color-primary), #2563EB)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}
                              >
                                <Truck size={16} /> Accept Load
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {chatShipment && (
          <ChatWindow 
            shipment={chatShipment} 
            user={user} 
            onClose={() => setChatShipment(null)} 
          />
        )}
      </AnimatePresence>

      {/* Floating Bulk Accept Bar */}
      <AnimatePresence>
        {selectedLoadIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            style={{
              position: 'fixed', bottom: '80px', left: '16px', right: '16px', zIndex: 50,
              background: 'rgba(17, 24, 39, 0.95)', border: '1px solid var(--color-primary)',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', borderRadius: '20px', padding: '16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(10px)'
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{selectedLoadIds.size} Loads Selected</div>
              <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '2px' }}>Optimized route multi-booking</div>
            </div>
            <button
              onClick={handleBulkAccept}
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), #2563EB)', color: 'white',
                border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: '800',
                fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer'
              }}
            >
              <Check size={16} /> Bulk Accept
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Accept Load Full-Screen Modal ──────────────────────── */}
      {acceptingShipment && (
        <AcceptLoadModal
          shipment={acceptingShipment}
          user={user}
          onClose={() => setAcceptingShipment(null)}
          onAccepted={handleAcceptComplete}
        />
      )}
    </div>
  );
}

function StatChip({ icon, label, value, color }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '10px 6px',
      background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px', color, opacity: 0.8 }}>{icon}</div>
      <div style={{ fontSize: '14px', fontWeight: '900', color }}>{value}</div>
      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}
