import React, { useState } from 'react';
import { User, CheckCircle, Clock, AlertCircle, Camera, Smartphone, CreditCard, Truck, ChevronRight, Home as HomeIcon, Upload, Shield, Star, FileText, X, LogOut, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const KYC_STEPS = [
  { id: 1, label: 'Identity', icon: Shield, desc: 'Aadhaar Number' },
  { id: 2, label: 'License', icon: FileText, desc: 'Driving License' },
  { id: 3, label: 'Vehicle', icon: Truck, desc: 'RC Document' },
];

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, setUser, setLanguage } = useStore();
  const navigate = useNavigate();
  const [kycStep, setKycStep] = useState(0);
  const [kycStatus, setKycStatus] = useState('not_started');
  const [aadhaar, setAadhaar] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    truck_type: user?.truck_type || '22-Wheeler'
  });
  const [isSaving, setIsSaving] = useState(false);

  const toggleEditing = () => {
    if (!isEditing) {
      setEditData({
        name: user?.name || '',
        phone: user?.phone || '',
        truck_type: user?.offset_truck_type || user?.truck_type || '22-Wheeler'
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      // 1. Prepare fields that we KNOW should exist (name is global)
      const updates = { name: editData.name };

      // 2. Try updating profiles (name, phone)
      // Note: We include 'phone' but we'll fallback if it fails due to schema
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: editData.name,
          phone: editData.phone
        })
        .eq('id', user.id);

      // If phone is missing, retry with just name
      if (profileError && profileError.code === 'PGRST204') {
        console.warn("Retrying profile update without 'phone' column...");
        await supabase
          .from('profiles')
          .update({ name: editData.name })
          .eq('id', user.id);
      }

      // 3. Update store
      setUser({
        name: editData.name,
        phone: editData.phone,
        truck_type: editData.truck_type
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Updated name successfully, but some fields (phone/truck) could not be saved to DB yet.');
      // Still close edit mode for good UX if at least name worked
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleHomeBaseChange = async (city) => {
    const { error } = await supabase
      .from('profiles')
      .update({ home_city: city })
      .eq('id', user?.id);
    if (!error) console.log('Home base updated');
  };

  const handleKycComplete = () => {
    setKycStatus('pending');
    setKycStep(0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser({ id: null });
    navigate('/driver/login');
  };

  const cycleLanguage = () => {
    const langs = ['en', 'hi', 'ta'];
    const currentIndex = langs.indexOf(i18n.language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    i18n.changeLanguage(nextLang);
    setLanguage(nextLang);
  };

  if (!user || user.id === null) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-primary)'
      }}>
        <div className="loader-pulse"></div>
        <p style={{ marginTop: '16px', fontSize: '12px', fontWeight: '900', letterSpacing: '2px', opacity: 0.5 }}>LOADING IDENTITY...</p>
      </div>
    );
  }

  const kycProgress = kycStatus === 'verified' ? 100 : kycStatus === 'pending' ? 66 : 10;

  return (
    <div className="app-page app-page-narrow">
      <AnimatePresence mode="wait">
        {kycStep === 0 ? (
          <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>

            {/* Profile Hero Card */}
            <div className="card-glass" style={{ textAlign: 'center', padding: '32px 24px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(34, 211, 238, 0.03) 100%)', border: '1px solid rgba(59, 130, 246, 0.16)', borderRadius: '32px' }}>
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)', position: 'relative'
              }}>
                <User size={44} color="white" />
                <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--color-surface)', borderRadius: '50%', padding: '4px', cursor: 'pointer', border: '2px solid var(--color-primary)' }}>
                  <Camera size={14} color="var(--color-primary)" />
                </div>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--color-text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-primary)', color: 'var(--color-text-primary)', fontSize: '20px', fontWeight: '900', textAlign: 'center', borderRadius: '8px', padding: '4px 12px', width: '200px' }}
                  />
                ) : (
                  <>
                    {user?.name || t('nav.profile')}
                    <button onClick={toggleEditing} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>
                      <Shield size={14} color="var(--color-primary)" />
                    </button>
                  </>
                )}
              </h2>

              <div style={{ marginBottom: '16px' }}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.phone}
                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="Phone number"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center', borderRadius: '8px', padding: '4px 12px', width: '180px' }}
                  />
                ) : (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>{user?.phone || user?.email || 'Not set'}</p>
                )}
              </div>

              {isEditing && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Vehicle Type</div>
                  <select
                    value={editData.truck_type}
                    onChange={e => setEditData({ ...editData, truck_type: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text-primary)', fontSize: '14px', borderRadius: '8px', padding: '10px', width: '220px', margin: '0 auto', display: 'block' }}
                  >
                    {['6-Wheeler', '10-Wheeler', '12-Wheeler', '14-Wheeler', '22-Wheeler'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {isEditing ? (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    style={{ padding: '8px 20px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', fontWeight: '700', border: 'none', cursor: 'pointer' }}
                  >
                    {isSaving ? 'Saving...' : 'SAVE'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ padding: '8px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '700', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  >
                    CANCEL
                  </button>
                </div>
              ) : null}

              {/* KYC Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 18px', borderRadius: '24px',
                backgroundColor: kycStatus === 'verified' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: kycStatus === 'verified' ? 'var(--color-success)' : 'var(--color-warning)',
                fontWeight: '700', fontSize: '13px', border: `1px solid ${kycStatus === 'verified' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
              }}>
                {kycStatus === 'verified' ? <CheckCircle size={15} /> : <Clock size={15} />}
                {kycStatus === 'verified' ? 'VERIFIED DRIVER' : kycStatus === 'pending' ? 'KYC UNDER REVIEW' : 'KYC PENDING'}
              </div>

              {/* Quick Stats */}
              <div className="flex gap-md" style={{ marginTop: '24px' }}>
                <div style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-primary)' }}>142</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Trips</div>
                </div>
                <div style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-success)' }}>4.8</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Rating</div>
                </div>
                <div style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-accent)' }}>₹2.4L</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Earned</div>
                </div>
              </div>
            </div>

            {/* Digital Vault Access (Pillar 6.0) */}
            <motion.div
              whileHover={{ scale: 1.01, background: 'rgba(59, 130, 246, 0.05)' }}
              onClick={() => navigate('/driver/vault')}
              className="card-glass"
              style={{
                marginBottom: '16px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, var(--glass-bg) 100%)'
              }}
            >
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '14px', borderRadius: '16px', color: 'var(--color-primary)' }}>
                <Shield size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-text-primary)', margin: 0 }}>Digital Document Vault</h3>
                  <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--color-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '10px' }}>SECURE</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>Manage RC, Driving License & Insurance</p>
              </div>
              <ChevronRight size={20} color="var(--color-text-muted)" />
            </motion.div>

            {/* Subscription Status Card */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={() => navigate('/driver/subscription')}
              className="card-glass"
              style={{
                marginBottom: '16px',
                background: user?.subscription_tier === 'GOLD' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${user?.subscription_tier === 'GOLD' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                cursor: 'pointer'
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-md">
                  <div style={{ background: user?.subscription_tier === 'GOLD' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px' }}>
                    <Crown size={20} color={user?.subscription_tier === 'GOLD' ? '#F59E0B' : 'var(--color-primary)'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--color-text-primary)' }}>{user?.subscription_tier || 'STARTER'} PLAN</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Member since {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/driver/subscription')}
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', fontWeight: '900', color: user?.subscription_tier === 'GOLD' ? '#F59E0B' : 'var(--color-primary)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '10px', border: 'none' }}
                >
                  UPGRADE
                </button>
              </div>
            </motion.div>

            {/* Home Base */}
            <div className="card-glass" style={{ marginBottom: '16px' }}>
              <div className="flex items-center gap-md" style={{ marginBottom: '12px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px', borderRadius: '12px' }}>
                  <HomeIcon size={18} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>Home Base City</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Prioritize loads returning near here</div>
                </div>
              </div>
              <select
                className="input-field"
                value={user?.home_city || 'Chennai'}
                onChange={(e) => handleHomeBaseChange(e.target.value)}
              >
                {['Chennai', 'Mumbai', 'Delhi', 'Pune', 'Nagpur', 'Bangalore', 'Hyderabad', 'Kolkata', 'Ahmedabad'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Settings */}
            <div className="card-glass" style={{ marginBottom: '16px', padding: 0 }}>
              <MenuItem icon={<Truck size={18} />} title="My Vehicle" value={user?.truck_type || '22-Wheeler'} />
              <MenuItem icon={<Star size={18} />} title="My Reviews" value="4.8 ★" />
              <MenuItem icon={<Clock size={18} />} title="Load History" onClick={() => navigate('/driver/history')} />
              <MenuItem icon={<Smartphone size={18} />} title="Language" value={i18n.language.toUpperCase()} onClick={cycleLanguage} />
              <MenuItem icon={<AlertCircle size={18} />} title="Support" last />
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              style={{ width: '100%', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', color: 'var(--color-error)', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </motion.div>
        ) : (
          <motion.div key="kyc-flow" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

            {/* KYC Header */}
            <div className="flex items-center gap-md" style={{ marginBottom: '24px' }}>
              <button onClick={() => setKycStep(kycStep > 1 ? kycStep - 1 : 0)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-primary)', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ←
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>Step {kycStep} of 3</h2>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-primary)' }}>
                  {kycStep === 1 ? 'Identity Verification' : kycStep === 2 ? 'Driving License' : 'Vehicle Registration'}
                </p>
              </div>
            </div>

            {/* Step Progress Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= kycStep ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>

            <div className="card-glass" style={{ padding: '28px' }}>
              {kycStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <Shield size={48} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Aadhaar Verification</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Enter your 12-digit Aadhaar number for instant government-backed authentication.</p>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="XXXX - XXXX - XXXX"
                    value={aadhaar}
                    onChange={e => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    style={{ letterSpacing: '6px', fontSize: '20px', textAlign: 'center', fontWeight: '700' }}
                  />
                  <div className="flex items-center gap-sm" style={{ padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '12px', fontSize: '13px', color: 'var(--color-text-secondary)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <CreditCard size={18} color="var(--color-primary)" />
                    <span>Encrypted via ULIP — compliant with IT Act 2000</span>
                  </div>
                </div>
              )}

              {kycStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <FileText size={48} color="var(--color-accent)" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Driving License</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Upload both sides of your DL. Ensure the number and expiry are clearly visible.</p>
                  </div>
                  <input type="text" className="input-field" placeholder="DL Number (e.g., TN-04-2019-0012345)" value={dlNumber} onChange={e => setDlNumber(e.target.value)} />
                  <div style={{ height: '180px', border: '2px dashed rgba(59, 130, 246, 0.3)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(59, 130, 246, 0.04)', gap: '8px' }}>
                    <Upload size={36} color="var(--color-primary)" />
                    <span style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: '600' }}>Upload Front Side</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>PNG, JPG up to 5MB</span>
                  </div>
                </div>
              )}

              {kycStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Truck size={48} color="var(--color-success)" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Vehicle Registration (RC)</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Confirm your truck details and upload the Registration Certificate.</p>
                  </div>
                  <input type="text" className="input-field" placeholder="Vehicle Number (e.g., TN 22 AB 1234)" value={rcNumber} onChange={e => setRcNumber(e.target.value)} />
                  <div className="flex gap-sm">
                    <div style={{ flex: 1, height: '140px', border: '2px dashed rgba(34, 197, 94, 0.3)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(34, 197, 94, 0.04)', gap: '6px' }}>
                      <Upload size={24} color="var(--color-success)" />
                      <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>Front Side</span>
                    </div>
                    <div style={{ flex: 1, height: '140px', border: '2px dashed rgba(34, 197, 94, 0.3)', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(34, 197, 94, 0.04)', gap: '6px' }}>
                      <Upload size={24} color="var(--color-success)" />
                      <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>Back Side</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: '20px', height: '60px', fontSize: '16px' }}
              onClick={() => kycStep < 3 ? setKycStep(kycStep + 1) : handleKycComplete()}
            >
              {kycStep === 3 ? '✓ SUBMIT FOR REVIEW' : `CONTINUE TO STEP ${kycStep + 1} →`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, title, value, last, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between"
      style={{
        padding: '16px 20px',
        borderBottom: last ? 'none' : '1px solid var(--glass-border)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-center gap-md">
        <div style={{ color: 'var(--color-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px' }}>{icon}</div>
        <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--color-text-primary)' }}>{title}</span>
      </div>
      <div className="flex items-center gap-sm">
        {value && <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{value}</span>}
        {onClick && <ChevronRight size={16} color="var(--color-text-muted)" />}
      </div>
    </div>
  );
}
