import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Truck, CheckCircle, Clock, Star, MapPin, Navigation, ShieldCheck, ArrowRight, IndianRupee, X, MessageSquare, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import RatingModal from '../../components/common/RatingModal';
import { useReviews } from '../../hooks/useReviews';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { updateBookingStatus } from '../../lib/db/bookings';
import TripStatusStepper from '../../components/trip/TripStatusStepper';
import { parseWKT } from '../../utils/geo';
import ChatWindow from '../../components/chat/ChatWindow';
import ProofUploadSheet from '../../components/booking/ProofUploadSheet';

export default function Bookings() {
  const { user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  
  // New State for Completion Flow
  const [finishingBooking, setFinishingBooking] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);
  const [proofModal, setProofModal] = useState({ isOpen: false, type: 'loading', booking: null });
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [filter, setFilter] = useState('active'); // 'active' | 'history'
  
  // Guard against null user during session init
  if (!user || user.id === null) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader-pulse"></div>
        <p style={{ marginTop: '16px', fontSize: '11px', fontWeight: '900', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)' }}>SYNCING SHIPMENTS...</p>
      </div>
    );
  }

  // Sync real-time updates
  useRealtimeSync('bookings', 'bookings', `driver_id=eq.${user?.id}`);

  useEffect(() => {
    if (location.state?.finishingBooking) {
      setFilter('active');
      setFinishingBooking(location.state.finishingBooking);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  // Fetch all bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          shipments (*)
        `)
        .eq('driver_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const filteredBookings = bookings?.filter(b => {
    if (filter === 'active') return b.status === 'requested' || b.status === 'in_progress';
    return b.status === 'completed' || b.status === 'cancelled';
  });

  const handleRateClick = (booking) => {
    setSelectedBooking(booking);
    setIsRatingOpen(true);
  };

  const { submitReview } = useReviews(selectedBooking?.id);

  // Helper for OTP Input
  const handleOtpChange = (e, index) => {
    const val = e.target.value;
    if (isNaN(val)) return;
    
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code === '2657') {
      try {
        await updateBookingStatus(finishingBooking.id, 'completed');
        setIsSuccess(true);
        queryClient.invalidateQueries(['bookings']);
        queryClient.invalidateQueries(['financials']);
        queryClient.invalidateQueries(['performance-stats']);
      } catch {
        setError("Database update failed. Please try again.");
      }
    } else {
      setError("Invalid OTP code. Please try again.");
      setOtp(['', '', '', '']);
      document.getElementById('otp-0').focus();
    }
  };


  const getCity = (address) => {
    if (!address) return 'Location';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim();
  };

  return (
    <div className="app-page app-page-narrow">
      <header className="app-page-header">
        <div className="app-title-wrap">
          <h1 className="app-page-title">My Bookings</h1>
          <p className="app-page-subtitle">Track active trips, delivery progress, and completed loads in one place.</p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="app-segmented" style={{ marginBottom: '24px' }}>
        {['active', 'history'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`app-segment${filter === f ? ' is-active' : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="loader-pulse"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredBookings?.length === 0 ? (
            <div className="card-glass app-empty-card">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                <Truck size={64} color="var(--color-text-muted)" style={{ margin: '0 auto 20px', opacity: 0.15 }} />
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-text-primary)' }}>No {filter} bookings</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Ready for your next journey?</p>
              </motion.div>
            </div>
          ) : (
            filteredBookings.map((booking, idx) => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card-glass"
                style={{ 
                  padding: '24px', 
                  background: 'var(--glass-bg)',
                  border: booking.status === 'in_progress' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                }}
              >
                {/* Pillar 4.0: Contextual Trip Progress Stepper */}
                <TripStatusStepper currentMilestone={booking.current_milestone || 'started'} />

                {/* Booking Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      padding: '10px', 
                      borderRadius: '14px', 
                      backgroundColor: booking.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: booking.status === 'completed' ? '#22C55E' : 'var(--color-primary)'
                    }}>
                      {booking.status === 'completed' ? <CheckCircle size={22} /> : <Truck size={22} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>ID: {booking.id.slice(0, 8).toUpperCase()}</div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-text-primary)' }}>₹{(booking.agreed_price || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                {/* Route Section */}
                <div style={{ marginBottom: '20px', position: 'relative', paddingLeft: '24px' }}>
                  <div style={{ position: 'absolute', left: '6px', top: '5px', bottom: '5px', width: '2px', background: 'linear-gradient(to bottom, var(--color-primary), var(--color-danger))', opacity: 0.2 }}></div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', border: '2px solid rgba(0,0,0,0.5)' }}></div>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{getCity(booking.shipments?.pickup_address)}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, paddingLeft: '20px' }}>{booking.shipments?.pickup_address}</p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', border: '2px solid rgba(0,0,0,0.5)' }}></div>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{getCity(booking.shipments?.drop_address)}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, paddingLeft: '20px' }}>{booking.shipments?.drop_address}</p>
                  </div>
                </div>

                {/* Primary Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {/* Loading Proof Step */}
                      {booking.status === 'requested' && !booking.loading_proof_uploaded_at && (
                        <button
                          onClick={() => setProofModal({ isOpen: true, type: 'loading', booking })}
                          className="trip-action-button is-primary"
                          style={{ flex: 2, height: '48px', borderRadius: '14px', background: 'var(--color-primary)' }}
                        >
                          <Camera size={18} /> SCAN PICKUP
                        </button>
                      )}

                      {/* Delivery Proof Step (Requires loading to be verified if system is strict, 
                          but here we show it when in_progress) */}
                      {booking.status === 'in_progress' && !booking.delivery_proof_uploaded_at && (
                        <button
                          onClick={() => setProofModal({ isOpen: true, type: 'delivery', booking })}
                          className="trip-action-button is-primary"
                          style={{ flex: 2, height: '48px', borderRadius: '14px', background: 'var(--color-primary)' }}
                        >
                          <Camera size={18} /> SCAN DELIVERY
                        </button>
                      )}

                      {/* Status Badges for Verification */}
                      {booking.loading_proof_uploaded_at && booking.loading_proof_status === 'pending' && (
                        <div className="badge badge-warning" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Clock size={14} /> PICKUP REVIEW
                        </div>
                      )}

                      {booking.delivery_proof_uploaded_at && booking.delivery_proof_status === 'pending' && (
                        <div className="badge badge-warning" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Clock size={14} /> DELIVERY REVIEW
                        </div>
                      )}

                      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => {
                              const pCoords = parseWKT(booking.shipments?.pickup_location);
                              const dCoords = parseWKT(booking.shipments?.drop_location);
                              navigate('/driver/navigate', {
                                state: {
                                  booking,
                                  pickup: pCoords ? { ...pCoords, address: booking.shipments?.pickup_address } : { lat: 13.0827, lng: 80.2707, address: booking.shipments?.pickup_address },
                                  drop: dCoords ? { ...dCoords, address: booking.shipments?.drop_address } : { lat: 18.5204, lng: 73.8567, address: booking.shipments?.drop_address }
                                }
                              });
                            }}
                            style={{ flex: 1, height: '48px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '14px', color: 'var(--color-primary)', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <Navigation size={18} /> NAVIGATE
                          </button>
                          <button
                            onClick={() => setChatBooking(booking)}
                            className="trip-action-button is-chat"
                            style={{ flex: 1, height: '48px', borderRadius: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <MessageSquare size={18} /> MESSAGE
                          </button>
                        </>
                      )}

                      {booking.status === 'in_progress' && (
                        <button
                          onClick={() => setFinishingBooking(booking)}
                          className="trip-action-button is-success"
                          style={{ flex: 1.5, height: '48px', borderRadius: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <ArrowRight size={18} /> REACHED DESTINATION
                        </button>
                      )}
                    </div>

                  {booking.status === 'completed' && (
                    <button 
                      onClick={() => handleRateClick(booking)}
                        style={{ height: '44px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--color-text-primary)', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Star size={16} fill="var(--color-warning)" color="var(--color-warning)" />
                      RATE TRIP
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* OTP MODAL OVERLAY */}
      <AnimatePresence>
        {finishingBooking && (
          <div className="app-sheet-overlay">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSuccess && setFinishingBooking(null)}
              className="app-sheet-backdrop"
            />
            
            <motion.div
              layout
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="app-sheet"
            >
              <div className="app-sheet-handle" />
              
              {!isSuccess ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E', margin: '0 auto 16px' }}>
                      <ShieldCheck size={32} />
                    </div>
                    <h3 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--color-text-primary)', margin: '0 0 8px' }}>Security Verification</h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>Enter the 4-digit OTP provided by the receiver at <strong>{finishingBooking.shipments?.destination}</strong></p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                    {otp.map((digit, i) => (
                      <input
                        key={i} id={`otp-${i}`}
                        type="text" inputMode="numeric"
                        value={digit}
                        onChange={(e) => handleOtpChange(e, i)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[i] && i > 0) {
                            document.getElementById(`otp-${i-1}`).focus();
                          }
                        }}
                        style={{ 
                          width: '56px', height: '64px', background: 'rgba(255,255,255,0.04)', 
                          border: '2px solid rgba(255,255,255,0.08)', borderRadius: '16px',
                          textAlign: 'center', fontSize: '24px', fontWeight: '900', color: 'var(--color-text-primary)'
                        }}
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--color-error)', fontSize: '13px', textAlign: 'center', marginBottom: '16px', fontWeight: 'bold' }}>{error}</motion.p>
                  )}

                  <button
                    onClick={verifyOtp}
                    disabled={otp.some(d => !d)}
                    style={{ 
                      width: '100%', height: '56px', background: 'var(--color-primary)', color: 'white',
                      border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '16px',
                      opacity: otp.some(d => !d) ? 0.5 : 1, transition: 'all 0.3s'
                    }}
                  >
                    VERIFY & COMPLETE DELIVERY
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
                    style={{ width: '80px', height: '80px', background: '#22C55E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 24px', boxShadow: '0 0 30px rgba(34, 197, 94, 0.4)' }}
                  >
                    <CheckCircle size={48} />
                  </motion.div>
                  <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--color-text-primary)', margin: '0 0 8px' }}>Delivery Success!</h3>
                  <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', marginBottom: '32px' }}>Trip closed successfully. Money added to your wallet.</p>
                  
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '24px', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px' }}>EARNINGS ADDED</div>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <IndianRupee size={28} /> {finishingBooking.agreed_price.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setFinishingBooking(null);
                      setIsSuccess(false);
                      setOtp(['', '', '', '']);
                      setError('');
                    }}
                    style={{ width: '100%', height: '56px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', color: 'var(--color-text-primary)', fontWeight: '900', fontSize: '16px' }}
                  >
                    BACK TO DASHBOARD
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHAT WINDOW OVERLAY */}
      <AnimatePresence>
        {chatBooking && (
          <ChatWindow 
            shipment={chatBooking.shipments} 
            user={user} 
            onClose={() => setChatBooking(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {proofModal.isOpen && (
          <ProofUploadSheet 
            booking={proofModal.booking} 
            type={proofModal.type} 
            user={user} 
            isOpen={proofModal.isOpen} 
            onClose={() => setProofModal({ ...proofModal, isOpen: false })} 
            onSuccess={() => queryClient.invalidateQueries(['bookings'])} 
          />
        )}
      </AnimatePresence>

      <RatingModal 
        isOpen={isRatingOpen} 
        onClose={() => setIsRatingOpen(false)} 
        onSubmit={async (data) => {
          await submitReview.mutateAsync(data);
        }}
        bookingId={selectedBooking?.id}
      />

      <style>{`
        .loader-pulse { width: 32px; height: 32px; border-radius: 50%; border: 3px solid var(--color-primary); border-top-color: transparent; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Step({ label, active, completed }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ 
        width: '24px', height: '24px', borderRadius: '50%', 
        background: completed ? '#22C55E' : active ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
        border: active ? '4px solid rgba(59,130,246,0.3)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: completed ? 'white' : active ? 'white' : 'rgba(255,255,255,0.2)',
        transition: 'all 0.3s ease'
      }}>
        {completed ? <CheckCircle size={14} /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />}
      </div>
      <span style={{ fontSize: '9px', fontWeight: '900', color: (completed || active) ? 'white' : 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    requested: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' },
    in_progress: { bg: 'rgba(234, 179, 8, 0.1)', color: '#EAB308' },
    completed: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }
  };
  const current = styles[status] || styles.requested;
  
  return (
    <div style={{ 
      fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '20px',
      backgroundColor: current.bg, color: current.color, textTransform: 'uppercase', letterSpacing: '0.5px'
    }}>
      {status.replace('_', ' ')}
    </div>
  );
}
