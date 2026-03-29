import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, Shield, Zap, Mic, Map, ArrowRight, 
  Globe2, BarChart3, ChevronRight, Play, Star
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="landing-shell">
      
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="container landing-nav">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Truck size={24} color="white" />
          </div>
          <span className="brand-wordmark">LORRYLINK<span className="brand-dot">.</span></span>
        </div>

        <div className="hide-mobile landing-nav-links">
          <a href="#features">Features</a>
          <a href="#network">Network</a>
          <a href="#partners">Partners</a>
          <button 
            onClick={() => navigate('/driver/lang')}
            className="btn-premium btn-premium-primary"
            style={{ padding: '12px 24px', fontSize: '14px' }}
          >
            Launch Portal
          </button>
        </div>
        
        <button className="show-mobile btn-premium btn-premium-outline" onClick={() => navigate('/driver/lang')}>
           Login
        </button>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="container section-padding landing-hero">
        <div className="landing-hero-glow" />

        <motion.div variants={container} initial="hidden" animate="show" className="hero-copy">
          <motion.div variants={item} className="hero-pill">
            <span>Now Live in 12+ States</span>
            <ChevronRight size={14} color="var(--color-primary)" />
          </motion.div>

          <motion.h1 variants={item} className="text-hero">
            The Future of <br />
            <span className="text-gradient-primary">Highway Logistics</span>
          </motion.h1>

          <motion.p variants={item} className="hero-subtitle">
            India's first AI-driven OS for the road. Real-time matching, 
            voice-controlled operations, and instant profitability tracking.
          </motion.p>

          <motion.div variants={item} className="hero-actions">
            <button onClick={() => navigate('/driver/lang')} className="btn-premium btn-premium-primary">
              Get Started for Free <ArrowRight size={20} />
            </button>
            <button onClick={scrollToFeatures} className="btn-premium hero-secondary-button">
              <Play size={20} fill="white" /> Watch Demo
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats & Trust ────────────────────────────────────────────── */}
      <section className="container" id="partners" style={{ paddingBottom: '100px' }}>
        <div className="glass-panel stats-panel">
          <div className="stats-grid">
            <StatItem icon={<Truck />} label="Active Lorry Network" value="85,000+" />
            <StatItem icon={<Zap />} label="Avg. Matching Time" value="< 2 Mins" />
            <StatItem icon={<BarChart3 />} label="Total Freight Volume" value="₹450 Cr+" />
            <StatItem icon={<Star />} label="Monthly Active Drivers" value="120K+" />
          </div>

          <div className="partner-strip">
            <p>Trusted Powerhouse Partners</p>
            <div className="partner-grid">
               <BrandIcon name="TATA" />
               <BrandIcon name="ASHOK LEYLAND" />
               <BrandIcon name="MAHINDRA" />
               <BrandIcon name="RELIANCE" />
               <BrandIcon name="BLUE DART" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────── */}
      <section className="container section-padding" id="features">
        <div className="feature-header">
           <h2>Radical Simplicity, <span style={{ color: 'var(--color-primary)' }}>Engineered.</span></h2>
           <p>Solving the hardest problems for the highway ecosystem.</p>
        </div>

        <div className="grid-auto-fit">
          <FeatureCard 
            icon={<Zap />} 
            title="AI Matching" 
            desc="Predictive routes that connect empty trucks with the highest-paying loads before they hit the market." 
          />
          <FeatureCard 
            icon={<Mic />} 
            title="Voice Interface" 
            desc="Full hands-free control designed specifically for Indian highway noise and localized accents." 
          />
          <FeatureCard 
            icon={<Shield />} 
            title="Instant Verification" 
            desc="Blockchain-backed KYC and vehicle history to ensure 100% trust across every transaction." 
          />
          <FeatureCard 
            icon={<Map />} 
            title="Smart Navigation" 
            desc="Live highway statuses, police checkpoint alerts, and toll optimization for maximum speed." 
          />
          <FeatureCard 
            icon={<Globe2 />} 
            title="Multilingual" 
            desc="Support for 14 regional languages, ensuring every driver in India can operate with confidence." 
          />
          <FeatureCard 
            icon={<BarChart3 />} 
            title="Profit Analytics" 
            desc="Deep insights into your diesel consumption, toll costs, and net profit per kilometer." 
          />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="container landing-footer">
        <div className="landing-footer-inner">
          <div className="brand-lockup">
            <div style={{ background: 'var(--grad-primary)', padding: '6px', borderRadius: '10px' }}>
              <Truck size={18} color="white" />
            </div>
            <span style={{ fontWeight: '900', letterSpacing: '-0.5px' }}>LORRYLINK.</span>
          </div>
          <p className="footer-note">
             Empowering the backbone of Indian logistics through cutting-edge technology and radical inclusivity.
          </p>
          <div className="footer-copyright">
             © 2026 LOADLINK LOGISTICS PVT LTD. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div
      whileHover={{ y: -10, borderColor: 'rgba(59,130,246,0.3)' }}
      className="glass-panel feature-card"
      style={{ transition: 'var(--transition)' }}
    >
      <div className="feature-card-icon">
        {icon}
      </div>
      <h3 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '12px' }}>{title}</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{desc}</p>
    </motion.div>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <div>
       <div style={{ color: 'var(--color-primary)', marginBottom: '12px', opacity: 0.5 }}>{icon}</div>
       <div style={{ fontSize: '32px', fontWeight: '950', letterSpacing: '-1px' }}>{value}</div>
       <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

function BrandIcon({ name }) {
  return (
    <span style={{ fontWeight: '950', fontSize: '15px', letterSpacing: '0.16em' }}>{name}</span>
  );
}
