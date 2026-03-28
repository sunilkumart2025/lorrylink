import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Search,
  Star,
  Award,
  TrendingUp,
  Map,
  Navigation,
  ArrowRight,
  Zap,
  Shield,
  IndianRupee,
  Siren,
  ChevronRight,
  User,
  Clock,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LiveFleetMap from '../../components/maps/LiveFleetMap';
import FuelPriceBanner from '../../components/common/FuelPriceBanner';
import ThemeToggle from '../../components/common/ThemeToggle';
import ChatWindow from '../../components/chat/ChatWindow';
import ProofUploadSheet from '../../components/booking/ProofUploadSheet';
import { MessageSquare, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { parseWKT } from '../../utils/geo';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useStore();
  const [chatBooking, setChatBooking] = React.useState(null);
  const [proofModal, setProofModal] = React.useState({ isOpen: false, type: 'loading', booking: null });

  useRealtimeSync('bookings', 'activeBooking', `driver_id=eq.${user?.id}`);
  useRealtimeSync('bookings', 'performance-stats', `driver_id=eq.${user?.id}`);
  useRealtimeSync('reviews', 'performance-stats');
  useRealtimeSync('highway_alerts', 'road-alerts');

  const { data: stats } = useQuery({
    queryKey: ['performance-stats', user?.id],
    queryFn: async () => {
      const [bookingsRes, reviewsRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('driver_id', user.id),
        supabase.from('reviews').select('*').eq('driver_id', user.id),
      ]);

      const completed = bookingsRes.data?.filter((booking) => booking.status === 'completed') || [];
      const totalEarnings = completed.reduce((sum, booking) => sum + (booking.agreed_price || 0), 0);
      const avgRating = reviewsRes.data?.length
        ? reviewsRes.data.reduce((sum, review) => sum + review.rating, 0) / reviewsRes.data.length
        : 5.0;

      return {
        trips: completed.length,
        earnings: totalEarnings,
        rating: avgRating.toFixed(1),
      };
    },
    enabled: !!user?.id,
  });

  const { data: activeBooking } = useQuery({
    queryKey: ['activeBooking', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, shipments(*)')
        .eq('driver_id', user.id)
        .in('status', ['requested', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);
      return data?.[0] || null;
    },
    enabled: !!user?.id,
  });

  const { data: backhaulLoad } = useQuery({
    queryKey: ['backhaulLoad', activeBooking?.shipments?.destination, user?.home_city],
    queryFn: async () => {
      if (!activeBooking || !user?.home_city) return null;

      const dest = activeBooking.shipments?.destination;
      const home = user.home_city;

      const { data } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'pending')
        .ilike('origin', `%${dest}%`)
        .ilike('destination', `%${home}%`)
        .limit(1)
        .maybeSingle();

      return data || null;
    },
    enabled: !!user?.home_city && !!activeBooking?.shipments?.destination,
  });

  const { data: roadAlerts } = useQuery({
    queryKey: ['active-road-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('highway_alerts')
        .select('*')
        .gt('expires_at', new Date().toISOString());
      return data || [];
    },
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { y: 18, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  const getCity = (address) => {
    if (!address) return 'Location';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim();
  };

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--color-background)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-primary)',
        }}
      >
        <div className="loader-pulse"></div>
        <h2
          style={{
            fontSize: '11px',
            fontWeight: '900',
            letterSpacing: '4px',
            marginTop: '24px',
            opacity: 0.4,
            textTransform: 'uppercase',
          }}
        >
          {t('post.matching')}
        </h2>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'User';
  const driverId = user?.id ? `#${user.id.slice(0, 5).toUpperCase()}` : '#00000';
  const subscriptionTier = user?.subscription_tier || 'Starter';
  const subscriptionTierKey = subscriptionTier.toUpperCase();
  const membershipMeta = {
    STARTER: {
      description: 'Marketplace essentials with live trip sync and standard dispatch visibility.',
      perk: 'Open benefits',
      status: 'Active',
      tone: 'starter',
      iconColor: 'var(--color-primary)',
    },
    SILVER: {
      description: 'Core load access, profile trust signals, and smoother pickup coordination.',
      perk: 'Standard route tools',
      status: 'Enabled',
      tone: 'silver',
      iconColor: '#94A3B8',
    },
    GOLD: {
      description: 'Priority matching, stronger truck visibility, and more support on the road.',
      perk: 'Priority lane unlocked',
      status: 'Priority',
      tone: 'gold',
      iconColor: '#F59E0B',
    },
    PLATINUM: {
      description: 'Higher earning controls, lower friction workflows, and premium route intelligence.',
      perk: 'Performance tier live',
      status: 'Elite',
      tone: 'platinum',
      iconColor: '#22D3EE',
    },
    FLEET: {
      description: 'Operational tools for multi-driver coordination, visibility, and centralized control.',
      perk: 'Fleet controls ready',
      status: 'Enterprise',
      tone: 'fleet',
      iconColor: '#8B5CF6',
    },
  };
  const currentMembership = membershipMeta[subscriptionTierKey] || membershipMeta.STARTER;
  const missionLabel = activeBooking?.shipments?.cargo_type || 'Freight move';

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="page-shell home-dashboard-apple"
      >
        <motion.section variants={item} className="card-glass home-hero-card">
          <div className="home-hero-main">
            <div className="home-hero-avatar">
              <Truck size={28} />
            </div>
            <div className="home-hero-copy">
              <span className="home-hero-kicker">Driver Command Center</span>
              <h1>{t('home.namaste')}, {firstName}</h1>
              <p>Everything you need for the current trip, your freight network, and your next move in one focused workspace.</p>
            </div>
          </div>
          <div className="home-hero-actions">
            <div className="home-hero-pill success">
              <span className="home-status-dot" />
              System online
            </div>
            <div className="home-hero-pill subtle">Driver ID {driverId}</div>
            <div className="home-hero-theme home-mobile-hide">
              <ThemeToggle />
            </div>
          </div>
        </motion.section>

        <motion.section variants={item} className="home-stat-strip home-stat-strip-desktop home-mobile-hide">
          <MiniStat
            label="Completed trips"
            mobileLabel="Trips"
            value={stats?.trips || '0'}
            icon={<Award size={20} color="var(--color-warning)" />}
          />
          <MiniStat
            label="Net earnings"
            mobileLabel="Earn"
            value={`₹${((stats?.earnings || 0) / 1000).toFixed(1)}K`}
            icon={<IndianRupee size={20} color="var(--color-success)" />}
          />
          <MiniStat
            label="Driver rating"
            mobileLabel="Rate"
            value={stats?.rating || '5.0'}
            icon={<Star size={20} color="var(--color-warning)" fill="currentColor" />}
          />
        </motion.section>

        <div className="home-layout-grid">
          <div className="home-primary-stack">
            <AnimatePresence mode="wait">
              {activeBooking ? (
                <motion.div
                  variants={item}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel home-mission-card home-mission-shell"
                >
                  <div className="home-mission-head">
                    <div className="home-mission-title">
                      <div className="home-mission-badge-icon">
                        <Navigation size={18} color="var(--color-primary)" />
                      </div>
                      <div>
                        <span className="home-mission-kicker">{t('home.active_mission')}</span>
                        <h2>{missionLabel}</h2>
                      </div>
                    </div>
                    <div className="badge badge-success" style={{ padding: '6px 14px', fontSize: '10px' }}>
                      {t('home.transit')}
                    </div>
                  </div>

                  <div className="mission-route">
                    <div className="home-route-stop">
                      <div className="home-route-city">{getCity(activeBooking.shipments?.pickup_address)}</div>
                      <div className="home-route-label">Origin</div>
                    </div>
                    <div className="route-arrow-pill">
                      <ArrowRight size={20} color="var(--color-primary)" />
                    </div>
                    <div className="home-route-stop mission-endpoint-right">
                      <div className="home-route-city">{getCity(activeBooking.shipments?.drop_address)}</div>
                      <div className="home-route-label destination">Destination</div>
                    </div>
                  </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      {/* Quick Scan Logic */}
                      {activeBooking.status === 'requested' && !activeBooking.loading_proof_uploaded_at && (
                        <button
                          onClick={() => setProofModal({ isOpen: true, type: 'loading', booking: activeBooking })}
                          className="trip-action-button is-primary"
                          style={{ height: '58px', borderRadius: '18px', flex: 1 }}
                        >
                          <Camera size={20} /> SCAN PICKUP
                        </button>
                      )}

                      {activeBooking.loading_proof_status === 'pending' && (
                        <div className="badge badge-warning" style={{ height: '58px', borderRadius: '18px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '900' }}>
                          <Clock size={20} /> REVIEWING PICKUP
                        </div>
                      )}

                      {activeBooking.status === 'in_progress' && !activeBooking.delivery_proof_uploaded_at && (
                        <button
                          onClick={() => setProofModal({ isOpen: true, type: 'delivery', booking: activeBooking })}
                          className="trip-action-button is-primary"
                          style={{ height: '58px', borderRadius: '18px', flex: 1 }}
                        >
                          <Camera size={20} /> SCAN DELIVERY
                        </button>
                      )}

                      {activeBooking.delivery_proof_status === 'pending' && (
                        <div className="badge badge-warning" style={{ height: '58px', borderRadius: '18px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '900' }}>
                          <Clock size={20} /> REVIEWING DELIVERY
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const pickupCoords = parseWKT(activeBooking.shipments?.pickup_location);
                          const dropCoords = parseWKT(activeBooking.shipments?.drop_location);
                          navigate('/driver/navigate', {
                            state: {
                              booking: activeBooking,
                              pickup: pickupCoords
                                ? { ...pickupCoords, address: activeBooking.shipments?.pickup_address }
                                : null,
                              drop: dropCoords
                                ? { ...dropCoords, address: activeBooking.shipments?.drop_address }
                                : null,
                            },
                          });
                        }}
                        className="trip-action-button is-primary"
                        style={{
                          flex: 2,
                          height: '58px',
                          borderRadius: '18px',
                          fontSize: '16px',
                          fontWeight: '900',
                        }}
                      >
                        {t('home.navigate')}
                      </button>
                      <button
                        onClick={() => setChatBooking(activeBooking)}
                        className="trip-action-button is-chat"
                        style={{
                          flex: 1,
                          height: '58px',
                          borderRadius: '18px',
                          fontSize: '16px',
                          fontWeight: '900',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MessageSquare size={20} />
                      </button>
                    </div>
                  </motion.div>
              ) : (
                <motion.div variants={item} className="card-glass home-empty-state home-mission-shell">
                  <Truck size={40} color="var(--color-text-muted)" style={{ marginBottom: '16px', opacity: 0.4 }} />
                  <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-text-primary)' }}>Mission Standby</div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--color-text-secondary)',
                      marginTop: '8px',
                      maxWidth: '32rem',
                    }}
                  >
                    Your truck is visible to shippers. Open the freight market to find the next best load.
                  </div>
                  <button
                    onClick={() => navigate('/driver/matches')}
                    className="btn btn-primary"
                    style={{ marginTop: '24px', height: '50px', padding: '0 28px', borderRadius: '14px', fontSize: '14px' }}
                  >
                    Freight Market
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.section variants={item} className="home-stat-strip home-stat-strip-mobile home-mobile-only">
              <MiniStat
                label="Completed trips"
                mobileLabel="Trips"
                value={stats?.trips || '0'}
                icon={<Award size={18} color="var(--color-warning)" />}
                compact
              />
              <MiniStat
                label="Net earnings"
                mobileLabel="Earn"
                value={`₹${((stats?.earnings || 0) / 1000).toFixed(1)}K`}
                icon={<IndianRupee size={18} color="var(--color-success)" />}
                compact
              />
              <MiniStat
                label="Driver rating"
                mobileLabel="Rate"
                value={stats?.rating || '5.0'}
                icon={<Star size={18} color="var(--color-warning)" fill="currentColor" />}
                compact
              />
            </motion.section>

            <motion.section variants={item} className="card-glass home-actions-card home-mobile-actions home-mobile-only">
              <div className="home-section-head">
                <h3>Quick Actions</h3>
                <p>Move to the next job faster</p>
              </div>
              <div className="home-mobile-action-grid">
                <ActionButton
                  icon={<Search size={22} />}
                  label={t('home.find_load')}
                  onClick={() => navigate('/driver/matches')}
                  small
                  mobileCompact
                  primary
                />
                <ActionButton
                  icon={<Truck size={20} />}
                  label="Post Truck"
                  onClick={() => navigate('/driver/post-truck')}
                  small
                  mobileCompact
                />
                <ActionButton
                  icon={<TrendingUp size={20} />}
                  label="Analyzer"
                  onClick={() => navigate('/driver/detour')}
                  small
                  mobileCompact
                />
              </div>
            </motion.section>

            <motion.div variants={item} className="home-fuel-section">
              <FuelPriceBanner />
            </motion.div>

            <motion.div variants={item} className="card-glass home-map-card" style={{ overflow: 'hidden', padding: 0 }}>
              <div className="panel-header">
                <div className="panel-header-main">
                  <div className="panel-icon">
                    <Map size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-text-primary)', margin: 0 }}>
                      {t('home.freight_network')}
                    </h3>
                    <span className="home-card-support">Live fleet intelligence</span>
                  </div>
                </div>
                <div className="badge badge-primary" style={{ padding: '4px 12px', opacity: 0.9 }}>
                  Live updating
                </div>
              </div>
              <div className="home-map-frame">
                <LiveFleetMap />
              </div>
            </motion.div>
          </div>

          <aside className="home-secondary-stack">
            <motion.div variants={item} className="card-glass home-profile-panel">
              <div className="home-profile-panel-head">
                <div className="profile-avatar">
                  <User size={22} />
                </div>
                <div>
                  <span className="home-card-kicker">Driver Profile</span>
                  <h2>{firstName}</h2>
                  <p>Ready for dispatch and synced across your current routes.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/driver/subscription')}
                className={`subscription-card home-tier-card is-${currentMembership.tone}`}
              >
                <div className="home-tier-icon-shell">
                  <Shield size={22} color={currentMembership.iconColor} />
                </div>
                <div className="home-tier-copy">
                  <div className="home-tier-head">
                    <div className="home-card-kicker">Membership</div>
                    <div className="home-tier-status">{currentMembership.status}</div>
                  </div>
                  <div className="home-tier-title">{subscriptionTierKey} Tier</div>
                  <div className="home-tier-description">{currentMembership.description}</div>
                  <div className="home-tier-footer">
                    <div className="home-tier-perk">{currentMembership.perk}</div>
                    <div className="home-tier-link">Manage plan</div>
                  </div>
                </div>
                <div className="home-tier-chevron">
                  <ChevronRight size={16} color="var(--color-text-muted)" />
                </div>
              </button>
            </motion.div>

            <motion.div variants={item} className="card-glass home-actions-card home-mobile-hide">
              <div className="home-section-head">
                <h3>Quick Actions</h3>
                <p>Core tools for the next move</p>
              </div>
              <div className="action-grid">
                <ActionButton
                  icon={<Search size={26} />}
                  label={t('home.find_load')}
                  onClick={() => navigate('/driver/matches')}
                  primary
                />
                <div className="action-grid-split">
                  <ActionButton
                    icon={<Truck size={22} />}
                    label="Post Truck"
                    onClick={() => navigate('/driver/post-truck')}
                    small
                  />
                  <ActionButton
                    icon={<TrendingUp size={22} />}
                    label="Analyzer"
                    onClick={() => navigate('/driver/detour')}
                    small
                  />
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {roadAlerts?.length > 0 && (
                <motion.div variants={item} className="alert-card home-note-card" whileHover={{ scale: 1.01 }}>
                  <div className="alert-icon-wrap">
                    <Siren size={24} color="#EF4444" className="animate-pulse" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--color-text-primary)', fontWeight: '900', fontSize: '16px' }}>Highway Intel</div>
                    <div style={{ color: 'var(--color-error)', fontSize: '12px', fontWeight: '800' }}>
                      {roadAlerts.length} active incidents
                    </div>
                  </div>
                  <ChevronRight size={18} color="#EF4444" />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {backhaulLoad && (
                <motion.div variants={item} className="card-glass backhaul-card home-note-card">
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '10px' }}>
                      <Zap size={22} color="var(--color-warning)" fill="currentColor" />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '950', color: 'var(--color-text-primary)', margin: 0 }}>
                      Smart Return Trip
                    </h4>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.6' }}>
                    We found a high-paying shipment from your current destination back to{' '}
                    <strong style={{ color: 'var(--color-text-primary)' }}>{user?.home_city || 'Home'}</strong>.
                  </p>
                  <div className="backhaul-profit">
                    <span style={{ fontSize: '20px', fontWeight: '950', color: 'var(--color-success)' }}>
                      ₹{backhaulLoad.price.toLocaleString()}
                    </span>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '800' }}>Estimated profit</div>
                  </div>
                  <button
                    onClick={() => navigate('/driver/matches')}
                    className="btn btn-primary"
                    style={{ height: '48px', borderRadius: '14px', background: 'var(--color-warning)', color: 'black' }}
                  >
                    Accept Return Load
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </motion.div>

      <AnimatePresence>
        {proofModal.isOpen && (
          <ProofUploadSheet 
            booking={proofModal.booking} 
            type={proofModal.type} 
            user={user} 
            isOpen={proofModal.isOpen} 
            onClose={() => setProofModal({ ...proofModal, isOpen: false })} 
            onSuccess={() => queryClient.invalidateQueries(['activeBooking'])} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatBooking && (
          <ChatWindow 
            shipment={chatBooking.shipments} 
            user={user} 
            onClose={() => setChatBooking(null)} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .loader-pulse {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-primary);
          box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
          animation: anchor-pulse 2s infinite;
        }

        @keyframes anchor-pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 24px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }

        .home-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-success);
          box-shadow: 0 0 0 rgba(34, 197, 94, 0.4);
          animation: dot-pulse 2s infinite;
        }

        @keyframes dot-pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.4); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

function ActionButton({ icon, label, onClick, primary, small, mobileCompact }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -4, boxShadow: primary ? '0 24px 44px rgba(37, 99, 235, 0.26)' : 'var(--shadow-lg)' }}
      onClick={onClick}
      className={`dashboard-action${primary ? ' is-primary' : ''}${small ? ' is-small' : ''}${mobileCompact ? ' is-mobile-compact' : ''}`}
      style={{
        height: small ? '108px' : '170px',
        background: primary
          ? 'linear-gradient(145deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
          : 'var(--color-surface)',
        color: primary ? 'white' : 'var(--color-text-primary)',
        boxShadow: primary ? 'var(--shadow-primary)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ color: primary ? 'white' : 'var(--color-primary)', transform: small ? 'scale(0.95)' : 'scale(1.1)' }}>
        {icon}
      </div>
      <span
        style={{
          fontSize: small ? '12px' : '15px',
          fontWeight: '800',
          letterSpacing: small ? '0.02em' : '0.01em',
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

function MiniStat({ label, mobileLabel, value, icon, compact }) {
  return (
    <div className={`card-glass home-mini-stat${compact ? ' is-compact' : ''}`} style={{ borderWidth: '1.5px' }}>
      <div className="home-mini-stat-icon">{icon}</div>
      <div className="home-mini-stat-content">
        <div className="home-mini-stat-label">
          <span className="home-stat-label-desktop">{label}</span>
          <span className="home-stat-label-mobile">{mobileLabel || label}</span>
        </div>
        <div className="home-mini-stat-value">{value}</div>
      </div>
    </div>
  );
}
