import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Shield, Zap, Mic, Map, ArrowRight,
  Globe2, BarChart3
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* BACKGROUND */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* NAVBAR */}
      <nav style={{
        padding: isMobile ? '16px' : '24px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.div
            whileHover={{ rotate: 10 }}
            style={{ background: 'var(--color-primary)', padding: '8px', borderRadius: '12px' }}
          >
            <Truck size={22} color="#000" />
          </motion.div>
          <span style={{ fontWeight: '900', color: 'white' }}>LOADLINK</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/driver/lang')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontWeight: '700'
          }}
        >
          Sign In
        </motion.button>
      </nav>

      {/* HERO */}
      <section style={{
        padding: isMobile ? '60px 16px' : '100px 5%',
        textAlign: 'center'
      }}>
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          style={{
            fontSize: isMobile ? '32px' : '64px',
            fontWeight: '900',
            color: 'white',
            lineHeight: '1.2'
          }}
        >
          The Future of
          <span style={{
            display: 'block',
            background: 'linear-gradient(135deg,#3B82F6,#22D3EE)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Highway Logistics
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: '16px',
            color: 'rgba(255,255,255,0.5)',
            fontSize: isMobile ? '14px' : '18px'
          }}
        >
          AI-powered matching • Voice commands • Real-time navigation
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/driver/lang')}
          style={{
            marginTop: '28px',
            padding: '16px 28px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg,#3B82F6,#22D3EE)',
            color: 'white',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginInline: 'auto'
          }}
        >
          Enter Dashboard <ArrowRight size={18} />
        </motion.button>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '60px 16px' }}>
        <h2 style={{ textAlign: 'center', color: 'white', marginBottom: '24px' }}>
          Core Features
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)',
          gap: '16px'
        }}>
          <FeatureCard icon={<Map />} title="Smart Matching" desc="Find nearby loads easily" />
          <FeatureCard icon={<Mic />} title="Voice Control" desc="Hands-free experience" />
          <FeatureCard icon={<Globe2 />} title="Multi Language" desc="Hindi, Tamil, English" />
          <FeatureCard icon={<BarChart3 />} title="Analytics" desc="Track earnings easily" />
          <FeatureCard icon={<Shield />} title="Secure" desc="Verified network" />
          <FeatureCard icon={<Zap />} title="Low Data Mode" desc="Works on weak network" />
        </div>
      </section>

      {/* STATS SECTION */}
      <section style={{ padding: '60px 16px', background: 'rgba(59,130,246,0.02)', borderY: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? '32px' : '80px', maxWidth: '1000px', margin: '0 auto' }}>
           <StatItem label="Verified Drivers" value="50,000+" />
           <StatItem label="Total Payouts" value="₹120Cr+" />
           <StatItem label="Route Efficiency" value="98.4%" />
        </div>
      </section>

      <section style={{ padding: '40px 16px', textAlign: 'center', opacity: 0.5 }}>
        <p style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>TRUSTED BY TOP LOGISTICS PARTNERS</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', filter: 'grayscale(1)' }}>
           <span style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>TATA MOTORS</span>
           <span style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>ASHOK LEYLAND</span>
           <span style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>MAHINDRA LOGISTICS</span>
           <span style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>RELIANCE</span>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '50px 16px', textAlign: 'center' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/driver/lang')}
          style={{
            padding: '18px 32px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg,#3B82F6,#22D3EE)',
            color: 'white',
            fontWeight: '900'
          }}
        >
          Get Started 🚚
        </motion.button>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>
        © 2026 LOADLINK
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <div style={{ marginBottom: '10px', color: 'var(--color-primary)' }}>{icon}</div>
      <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '900' }}>{title}</h3>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{desc}</p>
    </motion.div>
  );
}

function StatItem({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '36px', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--color-primary)', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '2px' }}>{label}</div>
    </div>
  );
}