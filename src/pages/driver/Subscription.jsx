import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Check, Star, Zap, 
  Crown, ArrowRight, X, IndianRupee,
  Award, Heart, ShieldCheck, Navigation,
  Bell, LifeBuoy, Fuel, Settings, BarChart3,
  Users, Smartphone, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

const TIERS = [
  {
    id: 'silver',
    name: 'Silver',
    description: 'The Marketplace Essential',
    prices: { monthly: 499, yearly: 3999 },
    icon: <Shield size={28} />,
    color: '#94A3B8',
    features: [
      { text: 'Browse & Bid on Loads', icon: <Smartphone size={14} /> },
      { text: 'Basic Profile Listing', icon: <CheckCircle2 size={14} /> },
      { text: 'Standard GPS Navigation', icon: <Navigation size={14} /> },
      { text: 'Digital Document Vault', icon: <ShieldCheck size={14} /> }
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'The Professional Choice',
    prices: { monthly: 1299, yearly: 12499 },
    icon: <Crown size={28} />,
    color: '#F59E0B',
    featured: true,
    features: [
      { text: 'All Silver Features', icon: <CheckCircle2 size={14} /> },
      { text: 'Push Alerts for Premium Loads', icon: <Bell size={14} /> },
      { text: 'Prioritized Truck Visibility', icon: <Zap size={14} /> },
      { text: 'Accident Insurance (Basic)', icon: <Heart size={14} /> },
      { text: '24/7 Emergency Help', icon: <LifeBuoy size={14} /> }
    ]
  },
  {
    id: 'platinum',
    name: 'Platinum',
    description: 'High-Performance Earning',
    prices: { monthly: 2499, yearly: 22499 },
    icon: <Award size={28} />,
    color: '#06B6D4',
    features: [
      { text: 'All Gold Features', icon: <CheckCircle2 size={14} /> },
      { text: 'Lower Platform Commissions', icon: <IndianRupee size={14} /> },
      { text: 'Fuel & Maintenance Discounts', icon: <Fuel size={14} /> },
      { text: 'Offline Maps & Live Traffic', icon: <Navigation size={14} /> },
      { text: 'Comprehensive Health Plan', icon: <Shield size={14} /> }
    ]
  },
  {
    id: 'fleet',
    name: 'Fleet',
    description: 'Enterprise Scalability',
    prices: { monthly: 4999, yearly: 44999 },
    icon: <Users size={28} />,
    color: '#8B5CF6',
    features: [
      { text: 'All Platinum Features', icon: <CheckCircle2 size={14} /> },
      { text: 'Multi-Driver Management', icon: <Settings size={14} /> },
      { text: 'Real-time Fleet Telematics', icon: <BarChart3 size={14} /> },
      { text: 'Earning Guarantees', icon: <Award size={14} /> },
      { text: 'Dedicated Account Manager', icon: <Users size={14} /> }
    ]
  }
];

export default function Subscription() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' | 'yearly'

  const handleSubscribe = async (tierId, cycle) => {
    if (!user?.id) return;
    
    const tier = tierId.toUpperCase();
    const expiresAt = cycle === 'yearly' 
      ? new Date(Date.now() + 365 * 86400000).toISOString()
      : new Date(Date.now() + 30 * 86400000).toISOString();

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: tier,
          subscription_billing_cycle: cycle,
          subscription_expires_at: expiresAt
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setUser({ 
        subscription_tier: tier,
        subscription_billing_cycle: cycle,
        subscription_expires_at: expiresAt
      });
      alert(`Success! You are now subscribed to ${tierId.toUpperCase()} (${cycle}).`);
      navigate('/driver/home');
    } catch (err) {
      console.error("Subscription error:", err);
      alert("Failed to update subscription. Please check your network.");
    }
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '120px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'white', marginBottom: '12px', letterSpacing: '-1px' }}>UNLOCK YOUR LIMITS</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', fontWeight: '600', marginBottom: '32px' }}>Choose the tier that fuels your business growth.</p>
        
        {/* Toggle Billing Cycle */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            onClick={() => setBillingCycle('monthly')}
            style={{ 
              padding: '10px 24px', borderRadius: '12px', border: 'none', 
              background: billingCycle === 'monthly' ? 'white' : 'transparent',
              color: billingCycle === 'monthly' ? 'black' : 'rgba(255,255,255,0.5)',
              fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: '0.3s'
            }}
          >
            MONTHLY
          </button>
          <button 
            onClick={() => setBillingCycle('yearly')}
            style={{ 
              padding: '10px 24px', borderRadius: '12px', border: 'none', 
              background: billingCycle === 'yearly' ? 'white' : 'transparent',
              color: billingCycle === 'yearly' ? 'black' : 'rgba(255,255,255,0.5)',
              fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: '0.3s',
              position: 'relative'
            }}
          >
            YEARLY
            {billingCycle !== 'yearly' && (
              <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--color-success)', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '8px', fontWeight: '900' }}>SAVE 20%</span>
            )}
          </button>
        </div>
      </header>

      {/* Subscription Grid - Horizontal Scroll on Mobile */}
      <div className="tier-carousel" style={{ 
        display: 'flex', 
        gap: '20px', 
        overflowX: 'auto', 
        paddingBottom: '24px',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch'
      }}>
        {TIERS.map((tier, idx) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              flex: '0 0 300px',
              scrollSnapAlign: 'center',
              padding: '32px',
              borderRadius: '32px',
              border: `1px solid ${tier.featured ? tier.color + '44' : 'rgba(255,255,255,0.05)'}`,
              background: tier.featured ? `linear-gradient(135deg, ${tier.color}15, var(--glass-bg))` : 'var(--glass-bg)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: tier.featured ? `0 20px 40px ${tier.color}15` : 'none'
            }}
          >
            {tier.featured && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: tier.color, color: 'white', padding: '4px 16px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>MOST POPULAR</div>
            )}

            <div style={{ color: tier.color, marginBottom: '20px' }}>{tier.icon}</div>
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>{tier.name}</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '24px', fontWeight: '700' }}>{tier.description}</p>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '32px', fontWeight: '900', color: 'white' }}>₹{(tier.prices[billingCycle] || 0).toLocaleString()}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: '700' }}>/{billingCycle}</span>
              </div>
              {billingCycle === 'yearly' && (
                <div style={{ color: 'var(--color-success)', fontSize: '11px', fontWeight: '900', marginTop: '4px' }}>Equiv. ₹{(tier.prices.yearly / 12).toFixed(0).toLocaleString()}/mo</div>
              )}
            </div>

            <div style={{ flex: 1, marginBottom: '40px' }}>
              {tier.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ color: tier.color, opacity: 0.8 }}>{f.icon}</div>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>{f.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(tier.id, billingCycle)}
              style={{
                width: '100%',
                height: '60px',
                borderRadius: '18px',
                border: 'none',
                background: tier.featured ? tier.color : 'rgba(255,255,255,0.05)',
                color: 'white',
                fontWeight: '900',
                fontSize: '14px',
                cursor: 'pointer',
                transition: '0.3s',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {user?.subscription_tier === tier.id.toUpperCase() ? 'Current Plan' : 'Get Started'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trust Footer */}
      <footer style={{ marginTop: '40px', textAlign: 'center' }}>
         <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', opacity: 0.3, marginBottom: '16px' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" style={{ height: '16px', filter: 'brightness(0) invert(1)' }} />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" style={{ height: '12px', filter: 'brightness(0) invert(1)' }} />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" style={{ height: '18px', filter: 'brightness(0) invert(1)' }} />
         </div>
         <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontWeight: '700' }}>SSL SECURED • CANCEL ANYTIME • 24/7 SUPPORT</p>
      </footer>

      <style>{`
        .tier-carousel::-webkit-scrollbar { display: none; }
        .tier-carousel { -ms-overflow-style: none; scrollbar-width: none; }
        @media (min-width: 1024px) {
          .tier-carousel {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            overflow-x: visible;
          }
        }
      `}</style>
    </div>
  );
}
