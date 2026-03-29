import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Bell,
  CheckCircle2,
  Crown,
  Fuel,
  Heart,
  IndianRupee,
  LifeBuoy,
  Navigation,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Users,
  Zap,
  BarChart3,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

const TIERS = [
  {
    id: 'silver',
    name: 'Silver',
    description: 'The marketplace essential',
    prices: { monthly: 499, yearly: 3999 },
    icon: Shield,
    color: '#94A3B8',
    features: [
      { text: 'Browse and bid on loads', icon: Smartphone },
      { text: 'Basic profile listing', icon: CheckCircle2 },
      { text: 'Standard GPS navigation', icon: Navigation },
      { text: 'Digital document vault', icon: ShieldCheck },
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'The professional choice',
    prices: { monthly: 1299, yearly: 12499 },
    icon: Crown,
    color: '#F59E0B',
    featured: true,
    features: [
      { text: 'All Silver features', icon: CheckCircle2 },
      { text: 'Premium load push alerts', icon: Bell },
      { text: 'Prioritized truck visibility', icon: Zap },
      { text: 'Basic accident insurance', icon: Heart },
      { text: '24/7 emergency help', icon: LifeBuoy },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    description: 'High-performance earning',
    prices: { monthly: 2499, yearly: 22499 },
    icon: Award,
    color: '#06B6D4',
    features: [
      { text: 'All Gold features', icon: CheckCircle2 },
      { text: 'Lower platform commissions', icon: IndianRupee },
      { text: 'Fuel and maintenance discounts', icon: Fuel },
      { text: 'Offline maps and live traffic', icon: Navigation },
      { text: 'Comprehensive health plan', icon: Shield },
    ],
  },
  {
    id: 'fleet',
    name: 'Fleet',
    description: 'Enterprise scalability',
    prices: { monthly: 4999, yearly: 44999 },
    icon: Users,
    color: '#8B5CF6',
    features: [
      { text: 'All Platinum features', icon: CheckCircle2 },
      { text: 'Multi-driver management', icon: Settings },
      { text: 'Real-time telematics', icon: BarChart3 },
      { text: 'Earning guarantees', icon: Award },
      { text: 'Dedicated account manager', icon: Users },
    ],
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [billingCycle, setBillingCycle] = useState('yearly');

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
          subscription_expires_at: expiresAt,
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser({
        subscription_tier: tier,
        subscription_billing_cycle: cycle,
        subscription_expires_at: expiresAt,
      });

      alert(`Success! You are now subscribed to ${tierId.toUpperCase()} (${cycle}).`);
      navigate('/driver/home');
    } catch (err) {
      console.error('Subscription error:', err);
      alert('Failed to update subscription. Please check your network.');
    }
  };

  return (
    <div className="app-page">
      <div className="card-glass app-surface-hero" style={{ marginBottom: '20px' }}>
        <div className="app-surface-kicker">
          <Crown size={14} />
          Membership
        </div>
        <h1 className="app-surface-title">Upgrade tools, protections, and visibility at your pace</h1>
        <p className="app-surface-copy">
          The pricing page now behaves like a product surface: calmer hierarchy, cleaner comparison cards, and the same
          minimal dashboard language used through the rest of the app.
        </p>

        <div className="app-scroll-strip" style={{ marginTop: '20px' }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`app-option-pill${billingCycle === 'monthly' ? ' is-active' : ''}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`app-option-pill${billingCycle === 'yearly' ? ' is-active' : ''}`}
          >
            Yearly
          </button>
          <div className="badge badge-success" style={{ padding: '8px 14px' }}>Save 20% yearly</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px',
        }}
      >
        {TIERS.map((tier, index) => {
          const Icon = tier.icon;
          const isCurrent = user?.subscription_tier === tier.id.toUpperCase();

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-glass app-data-card"
              style={{
                borderColor: tier.featured ? `${tier.color}44` : 'var(--glass-border)',
                background: tier.featured
                  ? `linear-gradient(160deg, ${tier.color}1f 0%, rgba(255,255,255,0.02) 60%, rgba(255,255,255,0.01) 100%)`
                  : undefined,
                position: 'relative',
              }}
            >
              {tier.featured && (
                <div
                  className="badge badge-primary"
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: `${tier.color}20`,
                    borderColor: `${tier.color}44`,
                    color: tier.color,
                  }}
                >
                  Popular
                </div>
              )}

              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '18px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${tier.color}1f`,
                  color: tier.color,
                }}
              >
                <Icon size={24} />
              </div>

              <div style={{ marginTop: '18px' }}>
                <div className="app-list-title" style={{ fontSize: '22px' }}>{tier.name}</div>
                <div className="app-list-subtitle" style={{ fontSize: '13px' }}>{tier.description}</div>
              </div>

              <div style={{ marginTop: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-0.08em', color: 'var(--color-text-primary)' }}>
                    ₹{tier.prices[billingCycle].toLocaleString()}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: '800' }}>
                    /{billingCycle}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="app-field-note">
                    Equivalent to ₹{Math.round(tier.prices.yearly / 12).toLocaleString()}/month
                  </div>
                )}
              </div>

              <div className="app-stacked-list" style={{ marginTop: '24px', gap: '12px' }}>
                {tier.features.map((feature) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={feature.text} className="app-list-row" style={{ alignItems: 'center' }}>
                      <div className="app-list-main" style={{ gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `${tier.color}18`,
                            color: tier.color,
                          }}
                        >
                          <FeatureIcon size={15} />
                        </div>
                        <div className="app-list-copy">
                          <div className="app-list-subtitle" style={{ marginTop: 0, color: 'var(--color-text-secondary)' }}>
                            {feature.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => handleSubscribe(tier.id, billingCycle)}
                className={`app-button ${isCurrent ? 'is-secondary' : 'is-primary'} is-block`}
                style={{ marginTop: '26px', minHeight: '56px' }}
              >
                {isCurrent ? 'Current plan' : 'Choose plan'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
