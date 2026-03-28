import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Fuel, Banknote, Navigation, ArrowRight, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { calculateDetourValue } from '../../lib/routing';

export default function DetourCalculator() {
  const [inputs, setInputs] = useState({
    directKm: 1200,
    detourKm: 1350,
    loadEarning: 15000,
    dieselRate: 95,
    mileage: 4
  });

  const [results, setResults] = useState(null);

  useEffect(() => {
    const res = calculateDetourValue(
      inputs.directKm,
      inputs.detourKm,
      inputs.loadEarning,
      inputs.dieselRate,
      inputs.mileage
    );
    setResults(res);
  }, [inputs]);

  const handleSliderChange = (key, val) => {
    setInputs(prev => ({ ...prev, [key]: Number(val) }));
  };

  return (
    <div style={{ padding: 'var(--spacing-md)', paddingBottom: '90px' }}>
      <header className="mb-xl">
        <h1 style={{ color: 'var(--color-primary)', fontSize: '24px', fontWeight: '900' }}>DETOUR VALUE</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Is the extra load worth the diesel cost? (Pillar 4.4)</p>
      </header>

      {/* Main Results Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card-glass"
        style={{ 
          padding: '24px', 
          marginBottom: '24px', 
          textAlign: 'center',
          background: results?.isWorthIt ? 'rgba(29, 233, 182, 0.05)' : 'rgba(255, 82, 82, 0.05)',
          border: results?.isWorthIt ? '1px solid rgba(29, 233, 182, 0.2)' : '1px solid rgba(255, 82, 82, 0.2)'
        }}
      >
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          PROJECTION: NET PROFIT GAIN
        </div>
        <div style={{ 
          fontSize: '42px', 
          fontWeight: '900', 
          color: results?.netGain > 0 ? 'var(--color-success)' : 'var(--color-danger)',
          marginBottom: '10px'
        }}>
          ₹{results?.netGain.toLocaleString()}
        </div>
        
        <AnimatePresence mode="wait">
          {results?.isWorthIt ? (
            <motion.div 
              key="worth-it"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: 'bold' }}
            >
              <CheckCircle2 size={18} /> GOLD DETOUR — GO FOR IT!
            </motion.div>
          ) : (
            <motion.div 
              key="not-worth-it"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-warning)', fontWeight: 'bold' }}
            >
              <AlertTriangle size={18} /> LOW VALUE — CONSIDER DIRECT ROUTE
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Interactive Controls */}
      <div className="flex-col gap-lg">
        <ControlItem 
          icon={<Route size={20} />} 
          label="Direct Route (Empty Truck)" 
          value={inputs.directKm} 
          unit="km"
          min={100} max={3000} step={50}
          onChange={(v) => handleSliderChange('directKm', v)}
        />
        
        <ControlItem 
          icon={<Navigation size={20} />} 
          label="Detour Route (With Extra Load)" 
          value={inputs.detourKm} 
          unit="km"
          min={inputs.directKm} max={inputs.directKm + 1000} step={20}
          onChange={(v) => handleSliderChange('detourKm', v)}
        />

        <ControlItem 
          icon={<Banknote size={20} />} 
          label="Detour Load Earning" 
          value={inputs.loadEarning} 
          unit="₹"
          min={1000} max={50000} step={500}
          onChange={(v) => handleSliderChange('loadEarning', v)}
        />

        <div className="flex gap-md">
           <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Diesel Rate</div>
              <input 
                type="number" 
                className="card-glass" 
                style={{ width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                value={inputs.dieselRate}
                onChange={(e) => handleSliderChange('dieselRate', e.target.value)}
              />
           </div>
           <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Truck Mileage (km/L)</div>
              <input 
                type="number" 
                className="card-glass" 
                style={{ width: '100%', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                value={inputs.mileage}
                onChange={(e) => handleSliderChange('mileage', e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* Breakdown Summary */}
      <div className="card-glass mt-xl" style={{ borderStyle: 'dashed', borderOpacity: 0.3 }}>
         <h4 style={{ fontSize: '14px', marginBottom: '15px', color: 'rgba(255,255,255,0.8)' }}>COST BREAKDOWN</h4>
         <div className="flex-col gap-sm">
            <div className="flex justify-between" style={{ fontSize: '13px' }}>
               <span style={{ color: 'rgba(255,255,255,0.5)' }}>Extra Distance:</span>
               <span style={{ color: 'white' }}>+{results?.extraKm} km</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '13px' }}>
               <span style={{ color: 'rgba(255,255,255,0.5)' }}>Extra Fuel Cost:</span>
               <span style={{ color: 'var(--color-danger)' }}>- ₹{results?.extraDieselCost.toFixed(0)}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '13px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
               <span style={{ color: 'rgba(255,255,255,0.5)' }}>Net Profitability:</span>
               <span style={{ color: results?.netGain > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                 ₹{results?.netGain.toLocaleString()}
               </span>
            </div>
         </div>
      </div>
    </div>
  );
}

function ControlItem({ icon, label, value, unit, min, max, step, onChange }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div className="flex justify-between items-center mb-sm">
        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon} {label}
        </label>
        <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
          {unit === '₹' ? `₹${value.toLocaleString()}` : `${value}${unit}`}
        </span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{ 
          width: '100%', 
          height: '6px', 
          borderRadius: '3px', 
          appearance: 'none', 
          background: 'rgba(255,255,255,0.1)',
          outline: 'none',
          accentColor: 'var(--color-primary)'
        }} 
      />
    </div>
  );
}
