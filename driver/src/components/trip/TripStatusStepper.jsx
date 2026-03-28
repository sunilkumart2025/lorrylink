import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Truck, Package, MapPin, Flag } from 'lucide-react';

const MILESTONES = [
  { id: 'started', label: 'Started', icon: MapPin },
  { id: 'arrived_pickup', label: 'At Pickup', icon: Truck },
  { id: 'loaded', label: 'Loaded', icon: Package },
  { id: 'in_transit', label: 'In Transit', icon: Truck },
  { id: 'arrived_destination', label: 'At Drop', icon: MapPin },
  { id: 'delivered', label: 'Delivered', icon: Flag },
];

export default function TripStatusStepper({ currentMilestone = 'started' }) {
  const currentIndex = MILESTONES.findIndex(m => m.id === currentMilestone);

  return (
    <div style={{ width: '100%', padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
        {/* Progress Line */}
        <div style={{ 
          position: 'absolute', top: '15px', left: '5%', right: '5%', 
          height: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 
        }} />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentIndex / (MILESTONES.length - 1)) * 90}%` }}
          style={{ 
            position: 'absolute', top: '15px', left: '5%', 
            height: '2px', background: 'var(--color-primary)', zIndex: 1,
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
          }} 
        />

        {MILESTONES.map((m, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const Icon = m.icon;

          return (
            <div key={m.id} style={{ 
              zIndex: 2, display: 'flex', flexDirection: 'column', 
              alignItems: 'center', gap: '8px', width: '60px' 
            }}>
              <motion.div
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isCompleted || isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                  borderColor: isActive ? '#fff' : 'transparent'
                }}
                style={{ 
                  width: '32px', height: '32px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isCompleted || isActive ? 'white' : 'rgba(255,255,255,0.2)',
                  border: '2px solid transparent',
                  backdropFilter: 'blur(4px)'
                }}
              >
                {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
              </motion.div>
              <span style={{ 
                fontSize: '9px', fontWeight: '900', 
                color: isActive || isCompleted ? 'white' : 'rgba(255,255,255,0.2)',
                textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center'
              }}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
