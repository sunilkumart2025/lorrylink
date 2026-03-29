import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Phone, User, Truck, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Radio } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    name: '',
    truck_type: '22-Wheeler Trailer',
    capacity_kg: 18000
  });

  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { setUser } = useStore();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    // Sanitize inputs
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const name = formData.name.trim();

    // Strict 10-digit validation
    if (!isLogin && phone.length !== 10) {
      setErrorMsg("Phone number must be exactly 10 digits.");
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { data: authData, error } = await signInWithEmail(email, formData.password);
      const session = authData?.session;
      if (session) {
        // Use maybeSingle() — profile may not exist yet (e.g. new Supabase user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        // Use profile if it exists, otherwise fall back to auth user data
        setUser(profile || { id: session.user.id, role: 'driver', email: session.user.email });
        navigate('/driver/home');
      } else {
        setErrorMsg(error?.message || "Invalid email or password");
      }
    } else {
      const { data: { user, session }, error } = await signUpWithEmail(
        email, 
        formData.password, 
        `+91${phone}`,
        { name, truck_type: formData.truck_type, capacity_kg: formData.capacity_kg }
      );
      
      if (error) {
        console.error("AUTH_ERROR_DETAIL:", error);
        setErrorMsg(error.message);
      } else if (user && !session) {
        setSuccessMsg("Account created! You can now log in with your email and password.");
        setIsLogin(true); // Automatically switch to Login tab
        setFormData(prev => ({ ...prev, email })); // Keep the email for convenience
      } else if (session) {
        // Immediate session (if Supabase 'Confirm Email' is OFF)
        await supabase.from('profiles').insert([{ id: session.user.id, name, phone: `+91${phone}`, role: 'driver' }]);
        await supabase.from('trucks').insert([{ driver_id: session.user.id, vehicle_type: formData.truck_type, capacity_kg: formData.capacity_kg }]);
        navigate('/driver/home');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-shell-inner container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-showcase"
        >
          <div className="auth-kicker">
            <Sparkles size={14} />
            Highway performance OS
          </div>
          <h1>
            Driver-grade access,
            <br />
            <span className="text-gradient-primary">built for the road.</span>
          </h1>
          <p>
            Sign in to manage bookings, monitor profitability, and stay connected to the freight network with a cleaner,
            faster driver workflow.
          </p>
          <div className="showcase-grid">
            <div className="card-glass showcase-card">
              <ShieldCheck size={18} color="var(--color-primary)" />
              <strong>Verified identity</strong>
              <span>Driver and truck details stay organized in one secure onboarding flow.</span>
            </div>
            <div className="card-glass showcase-card">
              <Radio size={18} color="var(--color-accent)" />
              <strong>Live dispatch ready</strong>
              <span>Jump from login straight into your dashboard, alerts, and active mission state.</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          layout
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card-glass auth-card"
        >
          <div className="auth-brand">
            <h1 style={{ color: 'var(--color-text-primary)', fontSize: '42px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '8px' }}>
              LoadLink<span style={{ color: 'var(--color-primary)' }}>.</span>
            </h1>
            <p>Highway Performance OS</p>
          </div>
        {/* Messages */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="auth-message error"
            >
              {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="auth-message success"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button 
            onClick={() => setIsLogin(true)}
            className={`auth-tab${isLogin ? ' is-active' : ''}`}
          >
            Log In
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`auth-tab${!isLogin ? ' is-active' : ''}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuth}>
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div 
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-col gap-md"
              >
                <div className="input-group">
                  <Mail className="input-icon" size={20} />
                  <input 
                    type="email" 
                    className="glass-input" 
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required 
                  />
                </div>
                <div className="input-group">
                  <Lock className="input-icon" size={20} />
                  <input 
                    type="password" 
                    className="glass-input" 
                    placeholder="Password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required 
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-col gap-sm"
              >
                <div className="input-group">
                  <User className="input-icon" size={20} />
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required 
                  />
                </div>
                <div className="input-group">
                  <Phone className="input-icon" size={20} />
                  <input 
                    type="tel" 
                    className="glass-input" 
                    placeholder="Phone (signup only)"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required 
                  />
                </div>
                <div className="input-group">
                  <Mail className="input-icon" size={20} />
                  <input 
                    type="email" 
                    className="glass-input" 
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required 
                  />
                </div>
                <div className="input-group">
                  <Lock className="input-icon" size={20} />
                  <input 
                    type="password" 
                    className="glass-input" 
                    placeholder="Password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required 
                  />
                </div>
                <div className="input-group">
                  <Truck className="input-icon" size={20} />
                  <select 
                    className="glass-input"
                    value={formData.truck_type}
                    onChange={e => setFormData({ ...formData, truck_type: e.target.value })}
                  >
                    <option>22-Wheeler Trailer</option>
                    <option>Container</option>
                    <option>Open Body Truck</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            className="btn btn-primary btn-block auth-submit" 
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight size={18} style={{ marginLeft: '10px' }} />}
          </button>
        </form>

        <p className="auth-legal">
          By continuing, you agree to LoadLink Terms of Service.
        </p>

          <div className="auth-badges">
             <Badge icon={<CheckCircle2 size={14} />} label="ULIP Verified" />
             <Badge icon={<CheckCircle2 size={14} />} label="ISO 27001" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Badge({ icon, label }) {
  return (
    <div className="trust-badge">
      {icon}
      <span>{label}</span>
    </div>
  );
}
