import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Search, Star, Award, TrendingUp,
  Map, Navigation, ArrowRight, Home as HomeIcon,
  Zap, Shield, Clock, IndianRupee
} from 'lucide-react';
import LiveFleetMap from '../../components/maps/LiveFleetMap';
import FuelPriceBanner from '../../components/common/FuelPriceBanner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import RecentReviews from '../../components/common/RecentReviews';
import ThemeToggle from '../../components/common/ThemeToggle';
import { parseWKT } from '../../utils/geo';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useStore();

  // Sync in real-time
  useRealtimeSync('bookings', 'activeBooking', `driver_id=eq.${user?.id}`);
  useRealtimeSync('bookings', 'performance-stats', `driver_id=eq.${user?.id}`);
  useRealtimeSync('reviews', 'performance-stats');

  // Fetch performance stats
  const { data: stats } = useQuery({
    queryKey: ['performance-stats', user?.id],
    queryFn: async () => {
      const [bookingsRes, reviewsRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('driver_id', user.id),
        supabase.from('reviews').select('*').eq('driver_id', user.id)
      ]);

      const completed = bookingsRes.data?.filter(b => b.status === 'completed') || [];
      const totalEarnings = completed.reduce((sum, b) => sum + (b.agreed_price || 0), 0);
      const avgRating = reviewsRes.data?.length
        ? reviewsRes.data.reduce((sum, r) => sum + r.rating, 0) / reviewsRes.data.length
        : 5.0;

      return {
        trips: completed.length,
        earnings: totalEarnings,
        rating: avgRating.toFixed(1)
      };
    },
    enabled: !!user?.id
  });

  // Fetch active booking
  const { data: activeBooking } = useQuery({
    queryKey: ['activeBooking', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*, shipments(*)')
        .eq('driver_id', user.id)
        .eq('status', 'in_progress')
        .limit(1);
      return data?.[0] || null;
    },
    enabled: !!user?.id
  });

  // Fetch Backhaul Load (Return Trip Optimizer)
  const { data: backhaulLoad } = useQuery({
    queryKey: ['backhaulLoad', activeBooking?.shipments?.destination, user?.home_city],
    queryFn: async () => {
      if (!activeBooking || !user?.home_city) return null;

      const dest = activeBooking.shipments?.destination;
      const home = user.home_city;

      // Find pending shipments from DESTINATION back to HOME
      const { data } = await supabase
        .from('shipments')
        .select('*')
        .eq('status', 'pending')
        .ilike('origin', `%${dest}%`)
        .ilike('destination', `%${home}%`)
        .limit(1)
        .maybeSingle(); // Better than .single() here to avoid 406

      return data || null;
    },
    enabled: !!user?.home_city && !!activeBooking?.shipments?.destination
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const getCity = (address) => {
    if (!address) return 'Location';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim();
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-primary)'
      }}>
        <div className="loader-pulse"></div>
        <h2 style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '4px', marginTop: '24px', opacity: 0.4, textTransform: 'uppercase' }}>{t('post.matching')}</h2>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', position: 'relative' }}
    >
      {/* Header Info */}
      <motion.div variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--color-text-primary)', letterSpacing: '-0.8px' }}>
            {t('home.namaste')}, {user.name?.split(' ')[0] || 'User'}!
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Driver ID: #{user.id.slice(0, 5).toUpperCase()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ThemeToggle />
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/driver/subscription')}
            style={{
              background: 'var(--glass-bg)',
              padding: '10px 16px',
              borderRadius: '16px',
              border: `1px solid ${user.subscription_tier === 'GOLD' ? '#F59E0B' : 'var(--glass-border)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: user.subscription_tier === 'GOLD' ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none'
            }}
          >
            <Shield size={16} color={user.subscription_tier === 'GOLD' ? '#F59E0B' : 'var(--color-primary)'} />
            <span style={{ fontSize: '13px', fontWeight: '900', color: 'white' }}>{user.subscription_tier || 'STARTER'}</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={item} style={{ marginBottom: '24px' }}>
        <FuelPriceBanner />
      </motion.div>

      {/* Active Trip Widget (Priority) */}
      <AnimatePresence mode="wait">
        {activeBooking && (
          <motion.div
            variants={item}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              marginBottom: '20px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, var(--glass-bg) 100%)',
              borderRadius: '28px',
              border: '1px solid var(--color-primary)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-primary)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{t('home.active_mission')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.1)', padding: '5px 12px', borderRadius: '20px' }}>
                <div className="pulse-dot green" style={{ width: '6px', height: '6px' }}></div>
                <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-success)' }}>{t('home.transit')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-text-primary)' }}>{getCity(activeBooking.shipments?.pickup_address)}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>ORIGIN</div>
              </div>
              <div style={{ alignSelf: 'center', color: 'var(--color-text-muted)' }}><ArrowRight size={20} /></div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--color-text-primary)' }}>{getCity(activeBooking.shipments?.drop_address)}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px', fontWeight: '800' }}>DESTINATION</div>
              </div>
            </div>

            <button
              onClick={() => {
                const pCoords = parseWKT(activeBooking.shipments?.pickup_location);
                const dCoords = parseWKT(activeBooking.shipments?.drop_location);
                navigate('/driver/navigate', { 
                  state: { 
                    booking: activeBooking,
                    pickup: pCoords ? { ...pCoords, address: activeBooking.shipments?.pickup_address } : null,
                    drop: dCoords ? { ...dCoords, address: activeBooking.shipments?.drop_address } : null
                  } 
                });
              }}
              className="btn btn-primary btn-block"
              style={{ height: '56px', borderRadius: '18px' }}
            >
              <Navigation size={18} /> {t('home.navigate')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Backhaul Optimizer (Pillar 4.4) */}
      <AnimatePresence>
        {backhaulLoad && (
          <motion.div
            variants={item}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ marginBottom: '24px' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, var(--glass-bg) 100%)',
              border: '1px solid var(--color-warning)',
              borderRadius: '28px',
              padding: '24px',
              display: 'flex',
              gap: '20px',
              alignItems: 'center',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-warning)' }}>
                <Zap size={24} fill="currentColor" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-warning)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '4px' }}>{t('home.backhaul')}</div>
                <h4 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--color-text-primary)', margin: 0 }}>{t('home.return_found')}</h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  To <strong style={{ color: 'var(--color-text-primary)' }}>{user.home_city}</strong> • <strong style={{ color: 'var(--color-success)' }}>₹{backhaulLoad.price.toLocaleString()}</strong>
                </p>
              </div>
              <button
                onClick={() => navigate('/driver/matches')}
                className="btn btn-ghost"
                style={{ height: '44px', padding: '0 20px', borderRadius: '14px', background: 'var(--color-surface)', border: '1px solid var(--color-warning)' }}
              >
                VIEW
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Map: Live Freight Network */}
      <motion.div
        variants={item}
        style={{
          background: 'var(--glass-bg)',
          borderRadius: '32px',
          border: '1px solid var(--glass-border)',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.01)',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(59,130,246,0.1)', borderRadius: '14px', color: 'var(--color-primary)' }}>
              <Map size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'var(--color-text-primary)', margin: 0 }}>{t('home.freight_network')}</h3>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Real-time Fleet Status</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5 }}>
            <Clock size={12} />
            <span style={{ fontSize: '10px', fontWeight: '900' }}>LIVE NOW</span>
          </div>
        </div>
        <div style={{ height: '360px', position: 'relative' }}>
          <LiveFleetMap />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <ActionButton
          icon={<Zap size={28} />}
          label={t('home.find_load')}
          onClick={() => navigate('/driver/matches')}
          primary
        />
        <ActionButton
          icon={<Truck size={28} />}
          label={t('home.post_empty')}
          onClick={() => navigate('/driver/post-truck')}
        />
      </motion.div>

      {/* Detour Shortcut */}
      <motion.div
        variants={item}
        whileHover={{ x: 4, background: 'rgba(255,255,255,0.05)' }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/driver/detour')}
        style={{
          marginBottom: '32px',
          background: 'var(--glass-bg)',
          borderRadius: '24px',
          border: '1px solid var(--glass-border)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          transition: 'background 0.3s'
        }}
      >
        <div style={{ background: 'rgba(34,211,238,0.1)', padding: '14px', borderRadius: '16px', color: 'var(--color-accent)' }}>
          <TrendingUp size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text-primary)', fontWeight: '800' }}>Net Profit Calculator</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Estimate true earnings after diesel & tolls</p>
        </div>
        <ArrowRight size={20} color="var(--color-text-muted)" />
      </motion.div>

      <motion.div variants={item}>
        <RecentReviews />
      </motion.div>

      {/* Analytics Summary */}
      <motion.div variants={item}>
        <h3 style={{ fontSize: '11px', fontWeight: '900', color: 'var(--color-text-muted)', letterSpacing: '2px', marginBottom: '16px', marginTop: '40px', textTransform: 'uppercase' }}>{t('home.performance')}</h3>
        <div style={{ display: 'flex', gap: '12px', paddingBottom: '60px' }}>
          <MiniStat label={t('home.trips')} value={stats?.trips || '0'} icon={<Award size={18} color="var(--color-warning)" />} />
          <MiniStat label={t('home.profit')} value={`₹${((stats?.earnings || 0) / 1000).toFixed(1)}K`} icon={<IndianRupee size={18} color="var(--color-success)" />} />
          <MiniStat label={t('home.score')} value={stats?.rating || '5.0'} icon={<Star size={18} color="var(--color-warning)" fill="currentColor" />} />
        </div>
      </motion.div>

      <style>{`
        .loader-pulse {
          width: 48px; height: 48px; border-radius: 50%;
          background: var(--color-primary);
          box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
          animation: anchor-pulse 2s infinite;
        }
        @keyframes anchor-pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 24px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .pulse-dot.green { background: var(--color-success); animation: dot-pulse 2s infinite; }
        @keyframes dot-pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.6); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </motion.div>
  );
}

function ActionButton({ icon, label, onClick, primary }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -4, boxShadow: primary ? '0 15px 30px rgba(37, 99, 235, 0.3)' : 'var(--shadow-md)' }}
      onClick={onClick}
      style={{
        flex: 1,
        height: '140px',
        background: primary
          ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
          : 'var(--glass-bg)',
        borderRadius: '28px',
        border: primary ? 'none' : '1px solid var(--glass-border)',
        color: primary ? 'white' : 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        cursor: 'pointer',
        boxShadow: primary ? '0 12px 24px rgba(37, 99, 235, 0.25)' : 'none',
        transition: 'all 0.3s ease'
      }}
    >
      <div style={{ color: primary ? 'white' : 'var(--color-primary)' }}>{icon}</div>
      <span style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{label}</span>
    </motion.button>
  );
}

function MiniStat({ label, value, icon }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--glass-bg)',
      borderRadius: '24px',
      border: '1px solid var(--glass-border)',
      padding: '24px 12px',
      textAlign: 'center',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--color-text-primary)', letterSpacing: '-0.8px' }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '900', marginTop: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}
