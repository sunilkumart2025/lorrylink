import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BarChart3,
  Globe,
  TrendingUp,
  Zap,
} from 'lucide-react';
import ProfitabilityMap from '../../components/maps/ProfitabilityMap';

const hotRoutes = [
  { from: 'Chennai', to: 'Mumbai', hike: '+12%', rate: '₹3,200/ton', demand: 'High' },
  { from: 'Delhi', to: 'Ahmedabad', hike: '+8%', rate: '₹2,800/ton', demand: 'Medium' },
  { from: 'Bangalore', to: 'Hyderabad', hike: '+15%', rate: '₹1,900/ton', demand: 'Peak' },
];

export default function MarketInsights() {
  return (
    <div className="app-page">
      <div className="card-glass app-surface-hero" style={{ marginBottom: '20px' }}>
        <div className="app-surface-kicker">
          <Zap size={14} />
          Market Pulse
        </div>
        <h1 className="app-surface-title">Freight intelligence built for fast route decisions</h1>
        <p className="app-surface-copy">
          The network view now reads like an operations dashboard instead of a utility page, with live context,
          high-yield lanes, and compact route signals.
        </p>
      </div>

      <div className="card-glass" style={{ padding: 0, overflow: 'hidden', borderRadius: '32px', marginBottom: '20px' }}>
        <div className="app-page-header" style={{ padding: '22px 24px 18px', marginBottom: 0 }}>
          <div className="app-title-wrap">
            <h2 className="app-page-title" style={{ fontSize: '1.45rem' }}>Live Network Map</h2>
            <p className="app-page-subtitle">Active freight movement and market heat in one surface.</p>
          </div>
          <div className="badge badge-primary" style={{ padding: '6px 14px' }}>
            Live
          </div>
        </div>
        <div style={{ height: '340px', position: 'relative' }}>
          <ProfitabilityMap />
        </div>
      </div>

      <div className="app-page-header" style={{ marginBottom: '14px' }}>
        <div className="app-title-wrap">
          <h2 className="app-page-title" style={{ fontSize: '1.45rem' }}>High-Yield Corridors</h2>
          <p className="app-page-subtitle">Top lanes ranked by demand, rate, and market momentum.</p>
        </div>
      </div>

      <div className="app-stacked-list" style={{ marginBottom: '20px' }}>
        {hotRoutes.map((route, index) => (
          <motion.div
            key={`${route.from}-${route.to}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="card-glass app-list-card"
            style={{ borderLeft: '3px solid var(--color-primary)' }}
          >
            <div className="app-list-row">
              <div className="app-list-main">
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(59,130,246,0.12)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <TrendingUp size={18} />
                </div>
                <div className="app-list-copy">
                  <div className="app-list-title">{route.from} to {route.to}</div>
                  <div className="app-list-subtitle">Average rate {route.rate}</div>
                </div>
              </div>
              <div className="app-list-value" style={{ color: 'var(--color-success)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <ArrowUpRight size={16} />
                  {route.hike}
                </div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '800' }}>
                  {route.demand} demand
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="app-stat-grid">
        <div className="card-glass app-metric-card">
          <div style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} />
            <h3>Average profit</h3>
          </div>
          <p>₹14.2K</p>
        </div>
        <div className="card-glass app-metric-card">
          <div style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={16} />
            <h3>Active loads</h3>
          </div>
          <p>1,240+</p>
        </div>
        <div className="card-glass app-metric-card">
          <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} />
            <h3>Best momentum</h3>
          </div>
          <p>Bengaluru</p>
        </div>
      </div>
    </div>
  );
}
