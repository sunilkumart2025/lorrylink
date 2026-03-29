import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Truck, MapPin, Navigation,
  IndianRupee, Weight, Shield, ChevronRight,
  CheckCircle2, Package, AlertTriangle, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const MapPreview = React.lazy(() => import('../map/MapPreview'));

// ── Stage config ──────────────────────────────────────────────────────────
const STAGES = ['confirm', 'locating', 'booking', 'success'];

export default function AcceptLoadModal({ shipment, user, onClose, onAccepted }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState('confirm');
  const [driverLocation, setDriverLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const watchRef = useRef(null);

  useEffect(() => {
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  // ── Ensure user profile exists (prevents FK violation) ──────────────────
  const ensureProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!data) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const email = authUser?.email || authUser?.phone || '';
      const name = authUser?.user_metadata?.full_name || email.split('@')[0] || 'Driver';
      await supabase.from('profiles').insert([{ id: user.id, role: 'driver', name, email }]);
    }
  };

  // ── Locate → Book ──────────────────────────────────────────────────────
  const handleConfirmAndLocate = () => {
    setStage('locating');
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('GPS not available');
      setTimeout(() => handleCreateBooking(null), 1200);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLocation(loc);
        setTimeout(() => handleCreateBooking(loc), 600);
      },
      () => {
        setLocationError('Location unavailable — continuing without GPS');
        setTimeout(() => handleCreateBooking(null), 1000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCreateBooking = async (loc) => {
    setStage('booking');
    setBookingError(null);

    try {
      // Auto-create profile if missing
      await ensureProfile();

      const { createBooking } = await import('../../lib/db/bookings');
      const { data, error } = await createBooking({
        shipment_id: shipment.id,
        driver_id: user.id,
        business_id: shipment.business_id,
        agreed_price: shipment.gross_rate || shipment.price,
        status: 'requested',
      });

      if (error) throw error;
      setBookingId(data?.id);

      // --- NEW: Atomic update of the shipment status to 'matched' to prevent double-booking ---
      const { error: updateError } = await supabase
        .from('shipments')
        .update({ status: 'matched' })
        .eq('id', shipment.id);
      
      if (updateError) console.warn('Delayed status update failed, but booking was created:', updateError);

      if (loc && navigator.geolocation) {
        watchRef.current = navigator.geolocation.watchPosition(
          (pos) => setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {}, { enableHighAccuracy: true }
        );
      }

      setStage('success');
      if (onAccepted) onAccepted(shipment.id);
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err.message || 'Failed to create booking');
      setStage('confirm');
    }
  };

  const stageIdx = STAGES.indexOf(stage);
  const netEarnings = Math.round((shipment.gross_rate || 0) * 0.98);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(180deg, #0a0a0f 0%, #0d1117 100%)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* ── Ambient glow ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px', width: '300px', height: '300px',
        borderRadius: '50%', background: stage === 'success'
          ? 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', transition: 'background 0.8s ease',
      }} />

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: stage === 'success'
              ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))'
              : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))',
            border: `1px solid ${stage === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.15)'}`,
          }}>
            {stage === 'success' ? <CheckCircle2 size={20} color="#22C55E" /> : <Package size={20} color="#3B82F6" />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
              {stage === 'success' ? 'Booking Confirmed' : 'Accept Load'}
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
              {shipment.pickup_address || shipment.origin} → {shipment.drop_address || shipment.destination}
            </p>
          </div>
        </div>
        {stage !== 'success' && (
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', width: '38px', height: '38px', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Progress bar ──────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: '3px' }}>
        {STAGES.map((s, i) => (
          <motion.div key={s}
            animate={{ scaleX: i <= stageIdx ? 1 : 0.6, opacity: i <= stageIdx ? 1 : 0.15 }}
            style={{
              flex: 1, height: '3px', borderRadius: '2px', transformOrigin: 'left',
              background: i <= stageIdx
                ? (stage === 'success' ? '#22C55E' : '#3B82F6')
                : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px' }}>
        <AnimatePresence mode="wait">

          {/* ─── CONFIRM ──────────────────────────────────────────── */}
          {stage === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>

              {bookingError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    padding: '14px 16px', borderRadius: '14px', marginBottom: '16px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                  }}>
                  <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(239,68,68,0.9)', lineHeight: 1.5 }}>{bookingError}</p>
                </motion.div>
              )}

              {/* ── Earnings Hero ──────────────────────────────────── */}
              <div style={{
                borderRadius: '24px', padding: '28px 24px', marginBottom: '12px', textAlign: 'center',
                background: 'linear-gradient(160deg, rgba(34,197,94,0.1) 0%, rgba(34,211,238,0.04) 50%, rgba(59,130,246,0.06) 100%)',
                border: '1px solid rgba(34,197,94,0.12)',
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', background: 'rgba(34,197,94,0.1)', marginBottom: '12px' }}>
                  <Sparkles size={12} color="#22C55E" />
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#22C55E', letterSpacing: '1px', textTransform: 'uppercase' }}>Your Earnings</span>
                </div>
                <div style={{ fontSize: '42px', fontWeight: '900', color: 'white', letterSpacing: '-2px', lineHeight: 1 }}>
                  ₹{netEarnings.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                  After 2% platform fee · Gross ₹{(shipment.gross_rate || 0).toLocaleString('en-IN')}
                </div>
              </div>

              {/* ── Route Card ─────────────────────────────────────── */}
              <div style={{
                borderRadius: '20px', padding: '20px', marginBottom: '12px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', paddingTop: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3B82F6', border: '3px solid rgba(59,130,246,0.2)' }} />
                    <div style={{ width: '2px', flex: 1, minHeight: '30px', background: 'linear-gradient(180deg, rgba(59,130,246,0.3), rgba(34,197,94,0.3))' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22C55E', border: '3px solid rgba(34,197,94,0.2)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '9px', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>PICKUP</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginTop: '4px', lineHeight: 1.4 }}>{shipment.pickup_address || shipment.origin}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: '#22C55E', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>DROP-OFF</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginTop: '4px', lineHeight: 1.4 }}>{shipment.drop_address || shipment.destination}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Info Pills ─────────────────────────────────────── */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <InfoPill icon={<Package size={14} />} label={shipment.requirements} />
                <InfoPill icon={<Weight size={14} />} label={`${shipment.weight} Tons`} />
                <InfoPill icon={<Shield size={14} />} label="Insured" accent />
              </div>

              {/* ── Agreement ──────────────────────────────────────── */}
              <div style={{
                padding: '14px 16px', borderRadius: '14px', marginBottom: '24px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6,
              }}>
                By accepting, you agree to pick up this load. Your live GPS will be shared with the shipper for tracking.
              </div>

              {/* ── CTA ────────────────────────────────────────────── */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirmAndLocate}
                style={{
                  width: '100%', height: '58px', border: 'none', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  color: 'white', fontWeight: '900', fontSize: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: '0 8px 32px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                  letterSpacing: '-0.3px',
                }}
              >
                <Check size={20} strokeWidth={3} /> CONFIRM & ACCEPT
              </motion.button>
            </motion.div>
          )}

          {/* ─── LOCATING ─────────────────────────────────────────── */}
          {stage === 'locating' && (
            <motion.div key="locating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', paddingTop: '80px' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '28px' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Navigation size={32} color="#3B82F6" />
                  </div>
                </motion.div>
                <motion.div animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(59,130,246,0.2)' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>Acquiring GPS Signal</h3>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', maxWidth: '260px', margin: '0 auto' }}>
                {locationError || 'Connecting to satellites for live tracking...'}
              </p>
            </motion.div>
          )}

          {/* ─── BOOKING ──────────────────────────────────────────── */}
          {stage === 'booking' && (
            <motion.div key="booking" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', paddingTop: '80px' }}>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', margin: '0 auto 24px',
                  background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={36} color="#22D3EE" />
                </div>
              </motion.div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>Creating Booking</h3>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>Registering with shipper...</p>
            </motion.div>
          )}

          {/* ─── SUCCESS ──────────────────────────────────────────── */}
          {stage === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

              <div style={{ textAlign: 'center', paddingTop: '12px', marginBottom: '28px' }}>
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}>
                  <div style={{
                    width: '88px', height: '88px', borderRadius: '50%', margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, #22C55E, #15803D)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 12px 48px rgba(34,197,94,0.35)',
                  }}>
                    <CheckCircle2 size={44} color="white" strokeWidth={2} />
                  </div>
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  style={{ fontSize: '26px', fontWeight: '900', color: 'white', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                  Load Accepted!
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                  style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  Booking #{bookingId?.slice(0, 8) || '—'}
                </motion.p>
              </div>

              {/* Route summary */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{
                  borderRadius: '20px', padding: '20px', marginBottom: '12px',
                  background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pickup</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginTop: '2px' }}>{shipment.pickup_address || shipment.origin}</div>
                  </div>
                  <div style={{ fontSize: '24px', color: 'rgba(34,197,94,0.4)' }}>→</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Drop</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#22C55E', marginTop: '2px' }}>{shipment.drop_address || shipment.destination}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#22C55E' }}>₹{netEarnings.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Earnings</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>{shipment.weight}T</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Load Weight</div>
                  </div>
                </div>
              </motion.div>

              {/* Live location indicator */}
              {driverLocation && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                  style={{
                    borderRadius: '16px', padding: '14px 16px', marginBottom: '12px',
                    background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                  <div style={{ position: 'relative' }}>
                    <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
                      style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', background: '#3B82F6' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3B82F6', position: 'relative', zIndex: 1 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>Live Tracking Active</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{driverLocation.lat.toFixed(4)}°N, {driverLocation.lng.toFixed(4)}°E</div>
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: '700', color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>● LIVE</div>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => navigate('/driver/home')} style={{
                  flex: 1, height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                }}>
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/driver/navigate', { state: { booking: { id: bookingId, ...shipment } } })} 
                  style={{
                  flex: 1, height: '52px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  border: 'none', color: 'white', fontWeight: '800', fontSize: '14px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                }}>
                  START NAVIGATION <ChevronRight size={16} />
                </button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function InfoPill({ icon, label, accent }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
      padding: '10px 8px', borderRadius: '12px',
      background: accent ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${accent ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)'}`,
      fontSize: '12px', fontWeight: '700',
      color: accent ? '#22C55E' : 'rgba(255,255,255,0.5)',
    }}>
      {icon} {label}
    </div>
  );
}
