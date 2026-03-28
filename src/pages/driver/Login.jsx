import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Phone, User, Truck, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, var(--color-background) 0%, #111827 100%)', 
      padding: 'var(--spacing-md)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* Brand Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}
      >
        <h1 style={{ color: 'white', fontSize: '42px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '8px' }}>
          LoadLink<span style={{ color: 'var(--color-primary)' }}>.</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', letterSpacing: '1px' }}>HIGHWAY PERFORMANCE OS</p>
      </motion.div>

      {/* Auth Card */}
      <motion.div 
        layout
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ 
          width: '100%', 
          maxWidth: '420px', 
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--blur))',
          borderRadius: 'var(--border-radius)',
          border: '1px solid var(--glass-border)',
          padding: 'var(--spacing-xl)',
          boxShadow: 'var(--box-shadow)'
        }}
      >
        {/* Messages */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ 
                backgroundColor: 'rgba(255, 82, 82, 0.15)', 
                color: 'var(--color-danger)', 
                padding: '12px', 
                borderRadius: '12px', 
                fontSize: '13px',
                marginBottom: '16px',
                border: '1px solid rgba(255, 82, 82, 0.2)',
                textAlign: 'center'
              }}
            >
              {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ 
                backgroundColor: 'rgba(0, 230, 118, 0.15)', 
                color: 'var(--color-success)', 
                padding: '12px', 
                borderRadius: '12px', 
                fontSize: '13px',
                marginBottom: '16px',
                border: '1px solid rgba(0, 230, 118, 0.2)',
                textAlign: 'center'
              }}
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Tab Switcher */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: 'rgba(0,0,0,0.2)', 
          borderRadius: '12px', 
          padding: '4px', 
          marginBottom: 'var(--spacing-xl)' 
        }}>
          <button 
            onClick={() => setIsLogin(true)}
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: 'none', 
              borderRadius: '8px',
              backgroundColor: isLogin ? 'var(--color-primary)' : 'transparent',
              color: 'white',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            Log In
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: 'none', 
              borderRadius: '8px',
              backgroundColor: !isLogin ? 'var(--color-primary)' : 'transparent',
              color: 'white',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
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
            className="btn btn-primary btn-block mt-xl" 
            disabled={loading}
            style={{ 
              height: '52px', 
              fontSize: '16px', 
              borderRadius: '14px', 
              boxShadow: '0 10px 15px -3px rgba(33, 150, 243, 0.4)' 
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight size={18} style={{ marginLeft: '10px' }} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--spacing-md)', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          By continuing, you agree to LoadLink Terms of Service.
        </p>
      </motion.div>

      {/* Trust Badges */}
      <div style={{ marginTop: 'var(--spacing-xl)', display: 'flex', gap: '20px' }}>
         <Badge icon={<CheckCircle2 size={14} />} label="ULIP Verified" />
         <Badge icon={<CheckCircle2 size={14} />} label="ISO 27001" />
      </div>

      <style>{`
        .glass-input {
          width: 100%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 12px 12px 45px;
          color: white;
          font-size: 15px;
          transition: all 0.3s ease;
        }
        .glass-input:focus {
          background: rgba(255,255,255,0.15);
          border-color: var(--color-primary);
          outline: none;
        }
        .input-group {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.4);
        }
      `}</style>
    </div>
  );
}

function Badge({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 'bold' }}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
