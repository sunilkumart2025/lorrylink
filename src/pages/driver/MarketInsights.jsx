import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Map as MapIcon, Zap, ArrowUpRight, BarChart3, Globe } from 'lucide-react';
import ProfitabilityMap from '../../components/maps/ProfitabilityMap';

export default function MarketInsights() {
  const hotRoutes = [
    { from: 'Chennai', to: 'Mumbai', hike: '+12%', rate: '₹3,200/ton', demand: 'High' },
    { from: 'Delhi', to: 'Ahmedabad', hike: '+8%', rate: '₹2,800/ton', demand: 'Medium' },
    { from: 'Bangalore', to: 'Hyderabad', hike: '+15%', rate: '₹1,900/ton', demand: 'Peak' },
  ];

  return (
    <div style={{ padding: 'var(--spacing-md)', paddingBottom: '100px' }}>
      <header className="mb-xl">
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>MARKET PULSE</h1>
        <p style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: '500' }}>Real-time Freight Intelligence</p>
      </header>

      {/* Live Market Map (Mini) */}
      <div className="card-glass" style={{ padding: 0, overflow: 'hidden', height: '220px', marginBottom: '24px', position: 'relative' }}>
         <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: 'rgba(59, 130, 246, 0.9)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={10} fill="white" /> LIVE NETWORK ACTIVITY
         </div>
         <ProfitabilityMap />
      </div>

      {/* Hot Routes Section */}
      <h3 style={{ fontSize: '15px', color: 'var(--color-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={18} /> HIGH-YIELD CORRIDORS
      </h3>
      
      <div className="flex-col gap-md mb-xl">
        {hotRoutes.map((route, idx) => (
          <motion.div 
            key={idx}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="card-glass"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--color-primary)' }}
          >
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{route.from} → {route.to}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Avg Rate: {route.rate}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'var(--color-success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                 <ArrowUpRight size={14} /> {route.hike}
              </div>
              <div style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', marginTop: '4px' }}>
                {route.demand}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Market Stats Cluster */}
      <div className="flex gap-md">
         <div className="card-glass" style={{ flex: 1, textAlign: 'center' }}>
            <BarChart3 size={24} color="var(--color-accent)" style={{ marginBottom: '8px', margin: '0 auto' }} />
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>AVG PROFIT</div>
            <div style={{ fontSize: '18px', fontWeight: '900' }}>₹14,200</div>
         </div>
         <div className="card-glass" style={{ flex: 1, textAlign: 'center' }}>
            <Globe size={24} color="var(--color-primary)" style={{ marginBottom: '8px', margin: '0 auto' }} />
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>ACTIVE LOADS</div>
            <div style={{ fontSize: '18px', fontWeight: '900' }}>1,240+</div>
         </div>
      </div>
    </div>
  );
}
