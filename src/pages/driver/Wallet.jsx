import React, { useState } from 'react';
import { 
  IndianRupee, ArrowDownToLine, FileText, 
  ChevronRight, Calendar, Download, X, TrendingUp, CreditCard, Target,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinancials } from '../../hooks/useFinancials';

export default function Wallet() {
  const { data: financials, isLoading, error } = useFinancials();
  const [showStatement, setShowStatement] = useState(false);

  if (isLoading) return <div className="text-center p-xl">Calculating earnings...</div>;
  if (error) return <div className="text-center p-xl color-danger">Error: {error.message}</div>;

  const currentBalance = financials?.balance || 0;
  const transactions = financials?.transactions || [];

  return (
    <div style={{ padding: 'var(--spacing-md)', paddingBottom: '120px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}>LINK WALLET</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase' }}>Financial Command Center</p>
      </header>

      {/* Main Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card" style={{ 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #1E40AF 100%)', 
          color: 'white', padding: '32px 24px', borderRadius: '32px',
          boxShadow: '0 24px 48px rgba(37, 99, 235, 0.3)', marginBottom: '24px', position: 'relative', overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: -20, right: -20, width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', marginBottom: '8px', opacity: 0.7, fontWeight: '900', letterSpacing: '2px' }}>AVAILABLE TO WITHDRAW</span>
          <span style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-2px' }}>₹{currentBalance.toLocaleString()}</span>
          
          <div className="flex gap-md" style={{ width: '100%' }}>
            <button className="btn" style={{ flex: 1, height: '64px', background: 'white', color: 'var(--color-primary)', borderRadius: '20px', fontWeight: '900', gap: '8px' }}>
              <ArrowDownToLine size={20} /> Withdraw
            </button>
            <button onClick={() => setShowStatement(true)} className="btn" style={{ flex: 1, height: '64px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '20px', fontWeight: '900', gap: '8px' }}>
              <FileText size={20} /> History
            </button>
          </div>
        </div>
      </motion.div>

      {/* Analytics & Goal Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
         <div className="card-glass" style={{ padding: '20px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
               <TrendingUp size={16} /> <span style={{ fontSize: '11px', fontWeight: '900' }}>WEEKLY TREND</span>
            </div>
            {/* Simple CSS Bar Graph */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px', marginBottom: '8px' }}>
               {[30, 60, 45, 80, 55, 90, 70].map((h, i) => (
                 <motion.div 
                   key={i}
                   initial={{ height: 0 }}
                   animate={{ height: `${h}%` }}
                   style={{ flex: 1, background: i === 5 ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }}
                 />
               ))}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>₹84,200</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>MTD EARNINGS</div>
         </div>
         <div className="card-glass" style={{ padding: '20px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
               <Target size={16} /> <span style={{ fontSize: '11px', fontWeight: '900' }}>SAVINGS GOAL</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', margin: '14px 0 6px' }}>
               <div style={{ width: '65%', height: '100%', background: 'var(--color-accent)', borderRadius: '3px', boxShadow: '0 0 10px var(--color-accent)' }} />
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>65% TO TRUCK REPAIR</div>
         </div>
      </div>

      {/* Premium Perks Card */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        style={{ 
          background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)', 
          padding: '20px', borderRadius: '24px', marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '16px'
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '16px' }}>
           <Zap size={24} color="#FBBF24" />
        </div>
        <div>
           <div style={{ fontWeight: '900', fontSize: '14px', color: 'white' }}>LOADLINK PREMIUM</div>
           <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Free accidental insurance & priority payouts active.</div>
        </div>
      </motion.div>

      {/* Linked Bank Card */}
      <div className="card-glass" style={{ padding: '24px', borderRadius: '28px', background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, transparent 100%)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px' }}>
               <CreditCard size={24} color="rgba(255,255,255,0.5)" />
            </div>
            <div>
               <div style={{ fontWeight: '900', fontSize: '15px', color: 'white' }}>HDFC Bank State-0321</div>
               <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>PRIMARY SETTLEMENT ACCOUNT</div>
            </div>
         </div>
         <ChevronRight size={20} color="rgba(255,255,255,0.2)" />
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '900', color: 'white', letterSpacing: '1px' }}>RECENT ACTIVITY</h3>
        <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', fontWeight: '900' }}>EXPORT ALL</button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {transactions.map((tx, idx) => (
          <motion.div 
            key={tx.id} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card-glass flex items-center justify-between" 
            style={{ padding: '16px 20px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)' }}
          >
             <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: tx.type === 'Payout' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tx.type === 'Payout' ? '#EF4444' : '#22C55E' }}>
                  {tx.type === 'Payout' ? <ArrowDownToLine size={18} /> : <IndianRupee size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: 'white' }}>{tx.type === 'Payout' ? 'Withdrawal' : 'Load Payment'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '700' }}>{tx.date}</div>
                </div>
             </div>
             <span style={{ color: tx.type === 'Payout' ? 'white' : 'var(--color-success)', fontWeight: '900', fontSize: '15px' }}>
               {tx.type === 'Payout' ? '−' : '+'} ₹{tx.amount.toLocaleString()}
             </span>
          </motion.div>
        ))}

        {transactions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: '700' }}>No historical transactions yet.</p>
          </div>
        )}
      </div>

      {/* Statement Overlay */}
      <AnimatePresence>
        {showStatement && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end' }}>
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              style={{ width: '100%', background: '#0A0A0F', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px 24px 60px', borderTop: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>Financial Summary</h3>
                <button onClick={() => setShowStatement(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div className="card-glass" style={{ padding: '24px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                       <Calendar size={18} color="var(--color-primary)" />
                       <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>March 2026 Dashboard</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                       <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Gross Revenue</span>
                       <span style={{ color: 'white', fontWeight: '800' }}>₹2,45,000</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                       <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>GST & Fees</span>
                       <span style={{ color: '#EF4444', fontWeight: '800' }}>- ₹4,900</span>
                    </div>
                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', margin: '16px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                       <span style={{ color: 'white', fontWeight: '800' }}>Net Earnings</span>
                       <span style={{ color: 'var(--color-success)', fontWeight: '800', fontSize: '18px' }}>₹2,40,100</span>
                    </div>
                 </div>

                 <button 
                  onClick={() => { alert("Exporting statement..."); setShowStatement(false); }}
                  style={{ width: '100%', height: '60px', borderRadius: '18px', background: 'var(--color-primary)', border: 'none', color: 'white', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                 >
                    <Download size={18} /> EXPORT FISCAL REPORT
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
